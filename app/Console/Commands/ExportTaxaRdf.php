<?php

namespace App\Console\Commands;

use App\Models\Assembly;
use App\Models\TaxaminerAnalysis;
use App\Models\Taxon;
use App\Services\RdfService;
use Illuminate\Console\Command;

class ExportTaxaRdf extends Command
{
    protected $signature = 'rdf:export
                            {output=storage/app/taxa.ttl}';

    protected $description = 'Export taxa and assemblies as RDF Turtle';

    private string $rdf = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';

    private string $rdfs = 'http://www.w3.org/2000/01/rdf-schema#';

    private string $xsd = 'http://www.w3.org/2001/XMLSchema#';

    private string $gnom = 'https://w3id.org/gnom/';

    private string $biolink = 'https://w3id.org/biolink/vocab/';

    public function handle(RdfService $rdf): int
    {
        $output = $this->argument('output');

        $handle = fopen($output, 'w');

        if (! $handle) {
            $this->error("Cannot open file: {$output}");

            return self::FAILURE;
        }

        $this->writePrefixes($handle);
        $this->info('Exporting Taxa...');
        $this->withProgressBar(
            Taxon::cursor(),
            function (Taxon $taxon) use ($handle, $rdf) {
                $lines = $taxon->toRdfRecord($rdf);

                foreach ($lines as $line) {
                    fwrite($handle, $line."\n");
                }
            }
        );
        $this->newLine();

        $this->info('Exporting Assemblies...');
        $this->withProgressBar(
            Assembly::cursor(),
            function (Assembly $assembly) use ($handle, $rdf) {
                $lines = $assembly->toRdfRecord($rdf);

                foreach ($lines as $line) {
                    fwrite($handle, $line."\n");
                }
            }
        );
        $this->newLine();

        $this->info('Exporting taXaminer Analyses...');
        $this->withProgressBar(
            TaxaminerAnalysis::cursor(),
            function (TaxaminerAnalysis $analysis) use ($handle, $rdf) {
                $lines = $analysis->toRdfRecord($rdf);

                foreach ($lines as $line) {
                    fwrite($handle, $line."\n");
                }
            }
        );
        $this->newLine();

        fclose($handle);

        $this->info("RDF export complete: {$output}");

        return self::SUCCESS;
    }

    private function writePrefixes($handle): void
    {
        fwrite($handle, "@prefix rdf: <{$this->rdf}> .\n");
        fwrite($handle, "@prefix rdfs: <{$this->rdfs}> .\n");
        fwrite($handle, "@prefix xsd: <{$this->xsd}> .\n");
        fwrite($handle, "@prefix gnom: <{$this->gnom}> .\n");
        fwrite($handle, "@prefix biolink: <{$this->biolink}> .\n\n");
    }
}
