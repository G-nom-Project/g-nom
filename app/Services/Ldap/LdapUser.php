<?php

namespace App\Services\Ldap;

final class LdapUser
{
    public function __construct(
        public readonly string $dn,
        public readonly string $username,
        public readonly ?string $email,
        public readonly ?string $name,
    ) {}
}
