<?php

namespace App\Services;

class BlastResultParser
{
    protected array $header = [
        'qseqid',
        'sseqid',
        'stitle',
        'pident',
        'length',
        'mismatch',
        'gapopen',
        'qstart',
        'qend',
        'sstart',
        'send',
        'evalue',
        'bitscore',
    ];

    public function parse(string $path): array
    {
        if (! file_exists($path)) {
            return [];
        }

        $rows = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        return array_map(function (string $line) {
            $row = str_getcsv($line, "\t");

            $mapped = array_combine($this->header, $row);

            $mapped['id'] = $mapped['qseqid'].'_'.$mapped['sseqid'];

            return $mapped;
        }, $rows);
    }
}
