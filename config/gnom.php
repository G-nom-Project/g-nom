<?php

return [
    'is_readonly' => env('GNOM_READONLY'),
    'blast' => env('GNOM_BLAST'),
    'sparql_console' => env('GNOM_SPARQL_CONSOLE'),
    'shard_size' => env('SHARD_SIZE', 20),
    'qlever_host' => env('QLEVER_HOST', 'qlever'),
    'qlever_access_token' => env('QLEVER_ACCESS_TOKEN'),
];
