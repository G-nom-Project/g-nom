<?php

namespace App\Console\Commands;

use App\Models\GnomKnowledgeBaseEntry;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

#[Signature('gnom:seedknowledgebase')]
#[Description('Seed the knowledge base from AsciiDoc documentation and generate embeddings')]
class SeedKnowledgeBase extends Command
{
    public function handle(): void
    {
        $directories = [
            base_path('antora-docs/docs/g-nom/modules/ROOT/pages/adminguide'),
            base_path('antora-docs/docs/g-nom/modules/ROOT/pages/userguide'),
        ];

        $files = collect($directories)
            ->flatMap(fn (string $directory) => File::allFiles($directory))
            ->filter(fn (\SplFileInfo $file) => $file->getExtension() === 'adoc')
            ->values();

        $this->info("Found {$files->count()} AsciiDoc files.");

        $bar = $this->output->createProgressBar($files->count());
        $bar->start();

        foreach ($files as $file) {
            try {
                $data = $this->parseAsciiDoc($file->getPathname());

                if (!$data) {
                    $this->newLine();
                    $this->warn("Skipping {$file->getPathname()} — could not parse document.");
                    $bar->advance();
                    continue;
                }

                $article = GnomKnowledgeBaseEntry::updateOrCreate(
                    ['title' => $data['title']],
                    $data
                );

                $article->generateEmbedding();
            } catch (\Throwable $e) {
                $this->newLine();
                $this->error(
                    "Failed to process {$file->getPathname()}: {$e->getMessage()}"
                );
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();

        $this->info("Knowledge base seeded with {$files->count()} documents.");
    }

    /**
     * Parse an AsciiDoc file into a knowledge article.
     *
     * @return array{title: string, category: string, content: string}|null
     */
    private function parseAsciiDoc(string $path): ?array
    {
        $content = file_get_contents($path);

        if ($content === false) {
            return null;
        }

        // Extract the first level-1 AsciiDoc heading:
        if (!preg_match('/^=\s+(.+)$/m', $content, $matches)) {
            return null;
        }

        $title = trim($matches[1]);

        // Extract category tags
        if (!preg_match('/^:category:\s*(.+)$/mi', $content, $matches)) {
            $category = 'general';
        } else {
            $category = trim($matches[1]);
        }

        $plainText = $this->toPlainText($content);

        return [
            'title' => $title,
            'category' => $category,
            'content' => $plainText,
        ];
    }

    private function toPlainText(string $content): string
    {
        /*
         * Remove Mermaid blocks.
         *
         * [mermaid]
         * ....
         * flowchart TD
         * ...
         * ....
         */
        $content = preg_replace(
            '/^\[mermaid\]\s*\R\.\.\.\.\s*\R.*?^\.\.\.\.\s*$/ms',
            '',
            $content
        );

        /*
         * Remove image blocks:
         *
         * image::foo.png[]
         * image::foo.png[Some description]
         */
        $content = preg_replace(
            '/^image::.*$/mi',
            '',
            $content
        );

        /*
         * Remove document attributes such as:
         *
         * :category: admin
         * :toc:
         * :imagesdir: images
         */
        $content = preg_replace(
            '/^:[^:\r\n]+:.*$/m',
            '',
            $content
        );

        /*
         * Remove AsciiDoc source blocks.
         *
         * [source,bash]
         * ----
         * command
         * ----
         */
        $content = preg_replace(
            '/^\[source[^\]]*\]\s*\R----\s*\R.*?^----\s*$/ms',
            '',
            $content
        );

        /*
         * Remove other delimited blocks.
         */
        $content = preg_replace(
            '/^----\s*\R.*?^----\s*$/ms',
            '',
            $content
        );

        /*
         * Convert AsciiDoc headings:
         *
         */
        $content = preg_replace(
            '/^={2,}\s+(.+)$/m',
            '$1',
            $content
        );

        /*
         * Remove the document title.
         */
        $content = preg_replace(
            '/^=\s+.+$/m',
            '',
            $content
        );

        /*
         * Remove AsciiDoc anchors:
         *
         * [[some-anchor]]
         */
        $content = preg_replace(
            '/^\[\[[^\]]+\]\]\s*$/m',
            '',
            $content
        );

        /*
         * Remove block attributes such as:
         *
         * [NOTE]
         * [TIP]
         * [cols="1,1"]
         */
        $content = preg_replace(
            '/^\[[^\]]+\]\s*$/m',
            '',
            $content
        );

        /*
         * Decode HTML entities if there are any.
         */
        $content = html_entity_decode($content, ENT_QUOTES | ENT_HTML5);

        /*
         * Normalize whitespace.
         */
        $content = preg_replace("/[ \t]+/", ' ', $content);
        $content = preg_replace("/\n{3,}/", "\n\n", $content);

        return trim($content);
    }
}
