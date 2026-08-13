<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class WikidataService extends SparqlService
{
    public function __construct()
    {
        parent::__construct(
            endpoint: 'https://query.wikidata.org/sparql',
            defaultCacheTtl: 1209600, // 14 days
            retries: 3,
            retryDelayMs: 1000
        );
    }

    /**
     * Retrieves information about a list of NCBI taxonomy IDs from wikidata. Results are cached per-ID
     * @param array $ncbi_ids List of NCBI IDs
     * @return array|null
     */
    public function getTaxaInfoChunk(array $ncbi_ids): ?array
    {
        $stale_ids = [];
        $results = [];

        foreach ($ncbi_ids as $ncbi_id) {
            if (Cache::has("sparql:wikidata:taxon:$ncbi_id")) {
                $results[$ncbi_id] = Cache::get("sparql:wikidata:taxon:$ncbi_id");
            } else {
                $stale_ids[] = $ncbi_id;
            }
        }


        $values = collect($stale_ids)
            ->map(fn ($id) => '"' . addslashes((string) $id) . '"')
            ->implode("\n");

        $query = <<<SPARQL
SELECT
  ?ncbiId
  ?taxon
  ?taxonLabel
  ?status
  ?statusLabel
  (SAMPLE(?article) AS ?article)
  (SAMPLE(?image) AS ?image)
WHERE {
  VALUES ?ncbiId {
    {$values}
  }

  ?taxon wdt:P685 ?ncbiId.

  OPTIONAL {
    ?taxon wdt:P141 ?status.
  }

  OPTIONAL {
    ?article schema:about ?taxon ;
             schema:isPartOf <https://en.wikipedia.org/>.
  }

  OPTIONAL {
    ?taxon wdt:P18 ?image.
  }

  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "en".
    ?taxon rdfs:label ?taxonLabel.
    ?status rdfs:label ?statusLabel.
  }
}
GROUP BY
  ?ncbiId
  ?taxon
  ?taxonLabel
  ?status
  ?statusLabel
SPARQL;

        if (sizeof($stale_ids) > 0) {
            $cache_str = implode("|", $stale_ids);
            $rows = $this->select($query, overrideCacheKey: "wikidata:ncbi:$cache_str");
        }

        if (!empty($rows)) {
            foreach ($rows as $row) {
                $formatted = [
                    'ncbi_id' => $row['ncbiId'] ?? null,
                    'taxon_uri' => $row['taxon'] ?? null,
                    'taxon_qid' => $this->extractQid($row['taxon'] ?? null),
                    'taxon_label' => $row['taxonLabel'] ?? null,
                    'status_uri' => $row['status'] ?? null,
                    'status_qid' => $this->extractQid($row['status'] ?? null),
                    'status_label' => $row['statusLabel'] ?? null,
                    'wikipedia_url' => $row['article'] ?? null,
                    'image' => $row['image'] ?? null,
                ];

                if (! empty($formatted['wikipedia_url'])) {
                    $formatted['wikipedia_summary'] = $this->getWikipediaSummary($formatted['wikipedia_url']);
                }

                $results[$formatted['ncbi_id']] = $formatted;
                Cache::put("sparql:wikidata:taxon:{$formatted['ncbi_id']}", $formatted, now()->plus(days: 14));
            }
        }

        return $results;
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

        $rows = $this->select($query, overrideCacheKey: "wikidata:ncbi:$escapedNcbiId");

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
