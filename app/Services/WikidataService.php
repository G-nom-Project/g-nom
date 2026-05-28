<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class WikidataService extends SparqlService
{
    public function __construct()
    {
        parent::__construct(
            endpoint: 'https://query.wikidata.org/sparql',
            defaultCacheTtl: 604800, // 7 days
            retries: 3,
            retryDelayMs: 1000
        );
    }

    /**
     * Get conservation status (IUCN Red List category) for a taxon
     * identified by its NCBI Taxonomy ID.
     * Returns null if no matching taxon or no conservation status is found.
     * Wikidata generally mirror NCBI taxonomy in terms of completeness, but IUCN property path are missing for a
     * majority of species.
     */
    public function getConservationStatusByNcbiId(string $ncbiId): ?array
    {
        $escapedNcbiId = $this->escapeLiteral($ncbiId);

        $query = <<<SPARQL
SELECT ?taxon ?taxonLabel ?status ?statusLabel ?article ?image WHERE {
  ?taxon wdt:P685 "{$escapedNcbiId}".
  OPTIONAL { ?taxon wdt:P141 ?status. }

  OPTIONAL {
    ?article schema:about ?taxon ;
             schema:isPartOf <https://en.wikipedia.org/> .
  }

  OPTIONAL { ?taxon wdt:P18 ?image. }

  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "en".
  }
}
LIMIT 1
SPARQL;

        $rows = $this->select($query);

        if (empty($rows)) {
            return null;
        }

        $row = $rows[0];

        return [
            'ncbi_id' => $ncbiId,
            'taxon_uri' => $row['taxon'] ?? null,
            'taxon_qid' => $this->extractQid($row['taxon'] ?? null),
            'taxon_label' => $row['taxonLabel'] ?? null,
            'status_uri' => $row['status'] ?? null,
            'status_qid' => $this->extractQid($row['status'] ?? null),
            'status_label' => $row['statusLabel'] ?? null,
            'wikipedia_url' => $row['article'] ?? null,
            'image' => $row['image'] ?? null,
        ];
    }

    public function getWikipediaSummary(string $url): ?string
    {
        $title = urldecode(basename(parse_url($url, PHP_URL_PATH)));

        $response = Http::timeout(10)
            ->withHeaders([
                'User-Agent' => 'G-nom/1.0 (contact: lkcontact01@gmail.com) G-nom Wikipedia Integration',
            ])
            ->acceptJson()
            ->get(
                'https://en.wikipedia.org/api/rest_v1/page/summary/'.
                rawurlencode($title)
            );

        if (! $response->successful()) {
            return null;
        }

        return $response->json('extract');
    }

    public function getTaxonInfoByNcbiId(string $ncbiId): ?array
    {
        $data = $this->getConservationStatusByNcbiId($ncbiId);

        if (! $data) {
            return null;
        }

        if (! empty($data['wikipedia_url'])) {
            $data['wikipedia_summary'] = $this->getWikipediaSummary($data['wikipedia_url']);
        }

        return $data;
    }

    public function getWikimediaImageUrl(?string $filename, int $width = 600): ?string
    {
        if (! $filename) {
            return null;
        }

        $filename = str_replace(' ', '_', $filename);
        $hash = md5($filename);

        $path = substr($hash, 0, 1).'/'
            .substr($hash, 0, 2).'/'
            .rawurlencode($filename);

        return 'https://upload.wikimedia.org/wikipedia/commons/thumb/'
            .$path
            ."/{$width}px-{$filename}";
    }
}
