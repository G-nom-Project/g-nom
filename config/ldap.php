<?php

return [
    'enabled' => env('LDAP_ENABLED', true),
    'login_banner' => env('LDAP_LOGIN_BANNER', 'Login with LDAP'),
    'uri' => env('LDAP_URI'),
    'base_dn' => env('LDAP_BASE_DN'),

    // Read-only account used to search for users and groups
    'bind_dn' => env('LDAP_BIND_DN'),
    'bind_password' => env('LDAP_BIND_PASSWORD'),

    // Transport security
    'start_tls' => env('LDAP_START_TLS', false),
    'verify_cert' => env('LDAP_VERIFY_CERT', true),
    'ca_cert' => env('LDAP_CA_CERT'),
    'timeout' => env('LDAP_TIMEOUT', 5),

    // Attribute mapping. Active Directory: sAMAccountName / mail / displayName
    'username_attribute' => env('LDAP_USERNAME_ATTR', 'uid'),
    'email_attribute' => env('LDAP_EMAIL_ATTR', 'mail'),
    'name_attribute' => env('LDAP_NAME_ATTR', 'cn'),

    // Optional extra filter e.g. '(objectClass=person)'
    'user_filter' => env('LDAP_USER_FILTER', ''),

    // Optional default group DN a user must belong to in order to access G-nom
    'required_group' => env('LDAP_REQUIRED_GROUP'),

    // How membership is checked:
    //   memberof  - user has a memberOf attribute (AD, or OpenLDAP with memberof overlay)
    //   ad_nested - AD, including nested groups (matching rule in chain)
    //   member    - group is groupOfNames/groupOfUniqueNames with member=<userDN>
    //   memberuid - group is posixGroup with memberUid=<username>
    'group_mode' => env('LDAP_GROUP_MODE', 'memberof'),
];
