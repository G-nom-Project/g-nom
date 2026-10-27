<?php

return [
    'is_readonly' => env('GNOM_READONLY', 'normal'),
    'blast' => env('GNOM_BLAST', 'enabled'),
    'sparql_console' => env('GNOM_SPARQL_CONSOLE', 'enabled'),
    'wikidata' => env('GNOM_WIKIDATA', 'enabled'),
    'shard_size' => env('SHARD_SIZE', 20),
    'qlever_host' => env('QLEVER_HOST', 'qlever'),
    'qlever_access_token' => env('QLEVER_ACCESS_TOKEN'),
    'agents_enabled' => env('GNOM_AGENTS_ENABLED', false),
    'mcp_enabled' => env('GNOM_MCP_ENABLED', false),
    'agents' => env('GNOM_AGENTS', 'disabled'),
    'store_documents' => env('GNOM_STORE_DOCUMENTS', false),
    'public' => env('GNOM_PUBLIC', false),
    /** The following settings will be shared by inertia on every request. */
    'custom_title' => env('VITE_CUSTOM_TITLE', false),
    'custom_logo' => env('VITE_CUSTOM_LOGO'),
    'app_url' => env('APP_URL', ''),
    'reverb_host' => env('VITE_REVERB_HOST', ''),
    'reverb_key' => env('VITE_REVERB_APP_KEY', ''),
    'reverb_port' => env('VITE_REVERB_PORT', ''),
    'reverb_scheme' => env('VITE_REVERB_SCHEME', ''),
];
