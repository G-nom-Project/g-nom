<?php

namespace Tests\Unit;

use App\Services\BlastResultParser;
use Tests\TestCase;

class BlastResultParserTest extends TestCase
{
    public function test_parses_blast_file()
    {
        $path = storage_path('app/test-blast.tsv');

        file_put_contents(
            $path,
            "gene1\tgene2\tTitle\t99\t100\t0\t0\t1\t100\t1\t100\t1e-50\t500\n"
        );

        $parser = new BlastResultParser;

        $result = $parser->parse($path);

        $this->assertCount(1, $result);

        $this->assertEquals('gene1', $result[0]['qseqid']);
        $this->assertEquals('gene2', $result[0]['sseqid']);
        $this->assertEquals('gene1_gene2', $result[0]['id']);

        unlink($path);
    }

    public function test_returns_empty_array_for_missing_file()
    {
        $parser = new BlastResultParser;

        $this->assertEquals(
            [],
            $parser->parse('/does/not/exist.tsv')
        );
    }
}
