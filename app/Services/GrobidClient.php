<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class GrobidClient
{
    public function __construct(
        private readonly string $baseUrl,
    ) {}

    public function processFulltext(string $path): string
    {
        $response = Http::timeout(300)
            ->attach(
                'input',
                fopen($path, 'r'),
                basename($path)
            )
            ->post(
                rtrim($this->baseUrl, '/') .
                '/api/processFulltextDocument',
                ['teiCoordinates' => 'p,figure,table,formula',]
            );

        $response->throw();

        return $response->body();
    }
}
