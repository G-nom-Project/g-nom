<?php

return [
    'is_readonly' => env('GNOM_READONLY', 'normal'),
    'blast' => env('GNOM_BLAST', 'enabled'),
    'sparql_console' => env('GNOM_SPARQL_CONSOLE', 'enabled'),
    'wikidata' => env('GNOM_WIKIDATA', 'enabled'),
    'shard_size' => env('SHARD_SIZE', 20),
    'qlever_host' => env('QLEVER_HOST', 'qlever'),
    'qlever_access_token' => env('QLEVER_ACCESS_TOKEN'),
    'agents' => env('GNOM_AGENTS', 'disabled'),
    'store_documents' => env('GNOM_STORE_DOCUMENTS', false),
];
