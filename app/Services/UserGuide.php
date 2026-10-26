<?php

namespace App\Services;

use Illuminate\Contracts\Filesystem\FileNotFoundException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;

/**
 * Provides functionalities around the G-nom documentation without relying on embedding contents.
 */
class UserGuide
{
    public function root(): string
    {
        return base_path('antora-docs/docs/g-nom/modules/ROOT/pages/userguide');
    }

    /**
     * List .adoc pages in the userguide folder which actually exist
     *
     * @return Collection
     */
    public function pages()
    {
        return collect(File::allFiles($this->root()))
            ->filter(fn ($f) => $f->getExtension() === 'adoc')
            ->map(fn ($f) => str($f->getRelativePathname())->beforeLast('.adoc')->toString())
            ->sort()
            ->values();
    }

    /**
     * Read a specific asciidoc page or return null if it does not exist.
     *
     * @param  string  $page  Page name, <name>.adoc file
     * @return string|null File contents
     *
     * @throws FileNotFoundException
     */
    public function read(string $page): ?string
    {
        // whitelist against real files
        if (! $this->pages()->contains($page)) {
            return null;
        }

        return File::get($this->root()."/{$page}.adoc");
    }

    /**
     * Primitive search function for doc files, which, however does not require embedding the documentation contents
     * beforehand. Better suited for G-nom Instances with disabled AI assistant and Document Index features which would
     * otherwise not need an embedding model.
     *
     * @param  string  $query  Search query
     * @param  int  $limit  Numer of results
     * @return array Results
     *
     * @throws FileNotFoundException
     */
    public function search(string $query, int $limit = 20): array
    {
        $hits = [];

        foreach ($this->pages() as $page) {
            $lines = preg_split('/\R/', File::get($this->root()."/{$page}.adoc"));

            foreach ($lines as $i => $line) {
                if (stripos($line, $query) !== false) {
                    $hits[] = sprintf('%s:%d: %s', $page, $i + 1, trim($line));
                    if (count($hits) >= $limit) {
                        return $hits;
                    }
                }
            }
        }

        return $hits;
    }
}
