<?php

namespace App\Services\Ldap;

use Illuminate\Support\Facades\Log;
use LDAP\Connection;
use RuntimeException;
use SensitiveParameter;

class LdapService
{
    private const ERR_INVALID_CREDENTIALS = 49;

    public function __construct(private readonly array $config)
    {
        if (! extension_loaded('ldap')) {
            throw new RuntimeException('The PHP ldap extension is not installed.');
        }
    }

    /**
     * Authenticate a user, optionally require group membership, and return basic attributes.
     *
     * @return LdapUser|null null on bad credentials, unknown user, or missing group membership
     *
     * @throws RuntimeException on connection/configuration problems
     */
    public function authenticate(string $username, #[SensitiveParameter] string $password, ?string $requiredGroupDn = null): ?LdapUser
    {
        $username = trim($username);
        // Safety check
        if (str_starts_with($this->config['uri'], 'ldap://')
            && ! ($this->config['start_tls'] ?? true)
            && ! ($this->config['allow_insecure'] ?? false)) {
            Log::critical("You are using ldap:// with STARTTLS off. This exposes plain text password in network traffic.");
        }

        // An empty password results in an anonymous bind, which "succeeds". Never allow it.
        if ($username === '' || $password === '') {
            return null;
        }

        $requiredGroupDn = $requiredGroupDn ?: ($this->config['required_group'] ?? null);

        // Look up the user (and check the group) with the service account, or anonymously if none is set
        $svc = $this->connect();
        try {
            $this->bindServiceAccount($svc);

            $entry = $this->findUser($svc, $username);
            if ($entry === null) {
                return null;
            }

            if ($requiredGroupDn && ! $this->isMember($svc, $entry['dn'], $username, $requiredGroupDn)) {
                return null;
            }
        } finally {
            @ldap_unbind($svc);
        }

        // Authenticate by binding as the user on a separate connection
        $entry = $this->bindAsUser($entry, $password);
        if ($entry === null) {
            return null;
        }

        return new LdapUser(
            dn: $entry['dn'],
            username: $username,
            email: $entry['email'],
            name: $entry['name'],
        );
    }

    /**
     * Get the user's own information
     *
     * @param  Connection  $ds  LDAP connection
     * @param  string  $dn  User DN
     * @return array {'dn': User DN, 'email': user email, 'name': username}
     */
    private function readOwnEntry(Connection $ds, string $dn): array
    {
        $mailAttr = strtolower($this->config['email_attribute']);
        $nameAttr = strtolower($this->config['name_attribute']);

        $res = @ldap_read($ds, $dn, '(objectClass=*)', [$mailAttr, $nameAttr]);
        $entries = $res ? ldap_get_entries($ds, $res) : ['count' => 0];

        // If the directory ACLs hide the attributes, the login is still valid: return what we have.
        return [
            'dn' => $entries[0]['dn'] ?? $dn,
            'email' => $entries[0][$mailAttr][0] ?? null,
            'name' => $entries[0][$nameAttr][0] ?? null,
        ];
    }

    /**
     * Check membership of a known user DN
     *
     * @param  Connection  $svc  LDAP connection
     * @param  string  $userDn  User DN
     * @param  string  $username  Username / uid
     * @param  string  $groupDn  Group DN to check membership
     * @return bool True if member, else false
     */
    private function isMember(Connection $svc, string $userDn, string $username, string $groupDn): bool
    {
        $base = $this->config['base_dn'];
        $attr = $this->config['username_attribute'];
        $safeGroup = ldap_escape($groupDn, '', LDAP_ESCAPE_FILTER);
        $safeUserDn = ldap_escape($userDn, '', LDAP_ESCAPE_FILTER);
        $safeUser = ldap_escape($username, '', LDAP_ESCAPE_FILTER);

        switch ($this->config['group_mode'] ?? 'memberof') {
            case 'ad_nested':
                $res = @ldap_read($svc, $userDn, "(memberOf:1.2.840.113556.1.4.1941:={$safeGroup})", ['dn']);
                break;

            case 'member':
                $res = @ldap_read($svc, $groupDn, "(|(member={$safeUserDn})(uniqueMember={$safeUserDn}))", ['dn']);
                break;

            case 'memberuid':
                $res = @ldap_read($svc, $groupDn, "(memberUid={$safeUser})", ['dn']);
                break;

            case 'memberof':
            default:
                $res = @ldap_read($svc, $userDn, "(memberOf={$safeGroup})", ['dn']);
                break;
        }

        // group does not exist / search error -> treat as "not a member"
        return $res !== false && ldap_count_entries($svc, $res) > 0;
    }

    /**
     * Connect to an LDAO server with options
     */
    private function connect(): Connection
    {
        // These TLS options are process-global in PHP's ldap extension and must be set before connecting.
        if (! empty($this->config['ca_cert'])) {
            ldap_set_option(null, LDAP_OPT_X_TLS_CACERTFILE, $this->config['ca_cert']);
        }
        if (($this->config['verify_cert'] ?? true) === false) {
            ldap_set_option(null, LDAP_OPT_X_TLS_REQUIRE_CERT, LDAP_OPT_X_TLS_NEVER);
        }

        $ds = @ldap_connect($this->config['uri']);
        if ($ds === false) {
            throw new RuntimeException('Invalid LDAP URI.');
        }

        ldap_set_option($ds, LDAP_OPT_PROTOCOL_VERSION, 3);
        ldap_set_option($ds, LDAP_OPT_REFERRALS, 0); // required for Active Directory
        ldap_set_option($ds, LDAP_OPT_NETWORK_TIMEOUT, (int) ($this->config['timeout'] ?? 5));
        ldap_set_option($ds, LDAP_OPT_TIMELIMIT, (int) ($this->config['timeout'] ?? 5));

        if (($this->config['start_tls'] ?? true) && ! @ldap_start_tls($ds)) {
            throw new RuntimeException('LDAP StartTLS failed: '.ldap_error($ds));
        }

        return $ds;
    }

    /**
     * Bind service account for DN search
     */
    private function bindServiceAccount(Connection $ds): void
    {
        $dn = $this->config['bind_dn'] ?? null;

        // No bind_dn configured: search anonymously
        $ok = $dn ? @ldap_bind($ds, $dn, $this->config['bind_password'] ?? '') : @ldap_bind($ds);

        if (! $ok) {
            throw new RuntimeException('LDAP search bind failed: '.ldap_error($ds));
        }
    }

    /**
     * Find user in the directory
     *
     * @return array{dn:string,email:?string,name:?string}|null
     */
    private function findUser(Connection $ds, string $username): ?array
    {
        $userAttr = $this->config['username_attribute'];
        $mailAttr = strtolower($this->config['email_attribute']);
        $nameAttr = strtolower($this->config['name_attribute']);

        $safeUser = ldap_escape($username, '', LDAP_ESCAPE_FILTER); // prevents LDAP injection
        $filter = sprintf('(&%s(%s=%s))', $this->config['user_filter'] ?? '', $userAttr, $safeUser);

        // sizelimit 2: enough to detect ambiguity without pulling the whole directory
        $res = @ldap_search($ds, $this->config['base_dn'], $filter, [$mailAttr, $nameAttr], 0, 2);
        if ($res === false) {
            throw new RuntimeException('LDAP user search failed: '.ldap_error($ds));
        }

        $entries = ldap_get_entries($ds, $res);
        if ($entries['count'] !== 1) { // not found, or ambiguous
            return null;
        }

        return [
            'dn' => $entries[0]['dn'],
            'email' => $entries[0][$mailAttr][0] ?? null,
            'name' => $entries[0][$nameAttr][0] ?? null,
        ];
    }

    /**
     * Bind as the user to verify the password. Attributes the search could not see (for example
     * because of ACLs for anonymous searches) are then read with the user's own permissions.
     *
     * @param  array{dn:string,email:?string,name:?string}  $entry
     * @return array{dn:string,email:?string,name:?string}|null null on wrong password
     */
    private function bindAsUser(array $entry, #[SensitiveParameter] string $password): ?array
    {
        $ds = $this->connect();
        try {
            if (! @ldap_bind($ds, $entry['dn'], $password)) {
                if (ldap_errno($ds) === self::ERR_INVALID_CREDENTIALS) {
                    return null;
                }
                throw new RuntimeException('LDAP user bind failed: '.ldap_error($ds));
            }

            if ($entry['email'] === null || $entry['name'] === null) {
                $own = $this->readOwnEntry($ds, $entry['dn']);
                $entry['email'] ??= $own['email'];
                $entry['name'] ??= $own['name'];
            }

            return $entry;
        } finally {
            @ldap_unbind($ds);
        }
    }
}
