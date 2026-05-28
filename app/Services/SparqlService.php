<?php

namespace App\Services;

use EasyRdf\Sparql\Client;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

/**
 * Reusable base class for querying SPARQL endpoints.
 */
abstract class SparqlService
{
    protected Client $client;

    /**
     * Default cache TTL in seconds.
     * Set to 0 to disable caching.
     */
    protected int $defaultCacheTtl;

    /**
     * Number of retry attempts for transient endpoint failures.
     */
    protected int $retries;

    /**
     * Delay between retries in milliseconds.
     */
    protected int $retryDelayMs;

    public function __construct(
        string $endpoint,
        int $defaultCacheTtl = 3600,
        int $retries = 2,
        int $retryDelayMs = 500
    ) {
        $this->client = new Client($endpoint);
        $this->defaultCacheTtl = $defaultCacheTtl;
        $this->retries = $retries;
        $this->retryDelayMs = $retryDelayMs;
    }

    /**
     * Execute a SELECT query and return normalized rows.
     *
     * @param  int|null  $cacheTtl  Override cache TTL (seconds). Null = default.
     * @return array<int, array<string, mixed>>
     */
    protected function select(string $query, ?int $cacheTtl = null): array
    {
        $ttl = $cacheTtl ?? $this->defaultCacheTtl;

        if ($ttl > 0) {
            $cacheKey = $this->cacheKey($query);

            return Cache::remember($cacheKey, $ttl, function () use ($query) {
                return $this->runSelect($query);
            });
        }

        return $this->runSelect($query);
    }

    /**
     * Execute an ASK query and return a boolean.
     */
    protected function ask(string $query, ?int $cacheTtl = null): bool
    {
        $rows = $this->select($query, $cacheTtl);

        // Note: EasyRdf may return different structures depending on endpoint.
        if (is_bool($rows)) {
            return $rows;
        }

        if (isset($rows[0])) {
            return (bool) $rows[0];
        }

        return false;
    }

    /**
     * Execute a SELECT query without caching.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function runSelect(string $query): array
    {
        $attempt = 0;

        do {
            try {
                $result = $this->client->query($query);

                $rows = [];

                foreach ($result as $row) {
                    $normalized = [];

                    foreach ($row as $field => $value) {
                        $normalized[$field] = $this->normalizeValue($value);
                    }

                    $rows[] = $normalized;
                }

                return $rows;
            } catch (Throwable $e) {
                $attempt++;

                Log::warning('SPARQL query failed', [
                    'endpoint' => $this->endpoint(),
                    'attempt' => $attempt,
                    'error' => $e->getMessage(),
                ]);

                if ($attempt > $this->retries) {
                    throw new RuntimeException(
                        'SPARQL query failed after retries: '.$e->getMessage(),
                        previous: $e
                    );
                }

                usleep($this->retryDelayMs * 1000);
            }
        } while (true);
    }

    /**
     * Normalize EasyRdf values into plain PHP scalars/arrays.
     */
    protected function normalizeValue(mixed $value): mixed
    {
        if (is_object($value)) {
            if (method_exists($value, 'getUri')) {
                return $value->getUri();
            }

            if (method_exists($value, 'getValue')) {
                return $value->getValue();
            }

            if (method_exists($value, '__toString')) {
                return (string) $value;
            }
        }

        return $value;
    }

    /**
     * Generate a cache key for a query based on the endpoint.
     */
    protected function cacheKey(string $query): string
    {
        return 'sparql:'.md5($this->endpoint().'|'.$query);
    }

    /**
     * Return the endpoint URL.
     */
    protected function endpoint(): string
    {
        // EasyRdf client does not expose endpoint publicly.
        $reflection = new \ReflectionClass($this->client);

        if ($reflection->hasProperty('uri')) {
            $property = $reflection->getProperty('uri');
            $property->setAccessible(true);

            return (string) $property->getValue($this->client);
        }

        return 'unknown';
    }

    /**
     * Escape a string for use as a SPARQL literal.
     */
    protected function escapeLiteral(string $value): string
    {
        return addcslashes($value, "\\\"\n\r\t");
    }

    /**
     * Build a Wikidata entity URL from a Q-ID.
     */
    protected function wikidataUri(string $qid): string
    {
        return "http://www.wikidata.org/entity/{$qid}";
    }

    /**
     * Extract a Q-ID from a full Wikidata URI.
     */
    protected function extractQid(?string $uri): ?string
    {
        if (! $uri) {
            return null;
        }

        if (preg_match('~/Q\d+$~', $uri, $matches)) {
            return ltrim($matches[0], '/');
        }

        return null;
    }
}
