<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use RuntimeException;
use SimpleXMLElement;

class GrobidTeiParser
{
    private const TEI_NS = 'http://www.tei-c.org/ns/1.0';
    private const XML_NS = 'http://www.w3.org/XML/1998/namespace';

    /**
     * Parse a GROBID TEI XML document.
     *
     * @return array{
     *     title: ?string,
     *     authors: array<int, array{
     *         first_name: ?string,
     *         last_name: ?string,
     *         full_name: string
     *     }>,
     *     abstract: ?string,
     *     elements: array<int, array<string, mixed>>,
     *     references: array<int, array<string, mixed>>
     * }
     */
    public function parse(string $xml): array
    {
        libxml_use_internal_errors(true);

        // Load TEI as object
        $tei = simplexml_load_string($xml);
        $tei->registerXPathNamespace('tei', 'http://www.tei-c.org/ns/1.0');

        // Return libxml errors of any
        if ($tei === false) {
            $errors = libxml_get_errors();
            libxml_clear_errors();

            throw new RuntimeException(
                'Could not parse GROBID TEI XML: ' .
                implode(
                    '; ',
                    array_map(
                        fn ($error) => trim($error->message),
                        $errors
                    )
                )
            );
        }

        // Top-level namespace
        $tei->registerXPathNamespace('tei', self::TEI_NS);

        return [
            'title' => $this->extractTitle($tei),
            'doi' => $this->extractDOI($tei),
            'authors' => $this->extractAuthors($tei),
            'abstract' => $this->extractAbstract($tei),
            'elements' => $this->extractElements($tei),
            'references' => $this->extractReferences($tei),
        ];
    }

    private function extractTitle(SimpleXMLElement $tei): ?string
    {
        // This will work for most TEI documents produced by GROBID
        $nodes = $tei->xpath(
            '//tei:teiHeader//tei:title[@type="main"]'
        );

        // Fallback for more elaborate title paths
        if (!$nodes) {
            $nodes = $tei->xpath(
                '//tei:teiHeader//tei:titleStmt/tei:title'
            );
        }

        if (!$nodes) {
            return null;
        }

        $title = $this->elementText($nodes[0]);
        return $title !== '' ? $title : null;
    }

    private function extractDOI(SimpleXMLElement $tei): ?string
    {
        // This will work for most TEI documents produced by GROBID
        $nodes = $tei->xpath(
            '//tei:teiHeader//tei:sourceDesc/tei:biblStruct/tei:idno[@type="DOI"]'
        );

        if (!$nodes) {
            return null;
        }

        $doi = $this->elementText($nodes[0]);

        // Remove common prefixes and whitespaces
        $doi = str_replace('doi', '', $doi);
        $doi = str_replace('doi:', '', $doi);
        $doi = str_replace(' ', '', $doi);
        Log::info('doi: ' . $doi);
        return $doi !== '' ? $doi : null;
    }

    /**
     * @return array<int, array{
     *     first_name: ?string,
     *     last_name: ?string,
     *     full_name: string
     * }>
     */
    private function extractAuthors(SimpleXMLElement $tei): array
    {
        $authors = [];

        $nodes = $tei->xpath(
            '//tei:teiHeader//tei:author'
        );


        foreach ($nodes ?: [] as $author) {
            // Re-register TEI namespace
            $author->registerXPathNamespace(
                'tei',
                'http://www.tei-c.org/ns/1.0'
            );

            $forenames = [];
            $forenameNodes = $author->xpath(
                './tei:persName/tei:forename'
            );


            if (!$forenameNodes) {
                $forenameNodes = $author->xpath(
                    './/tei:forename'
                );
            }

            foreach ($forenameNodes ?: [] as $forename) {
                $value = $this->elementText($forename);

                if ($value !== '') {
                    $forenames[] = $value;
                }
            }

            $surnameNodes = $author->xpath(
                './tei:persName/tei:surname'
            );

            if (!$surnameNodes) {
                $surnameNodes = $author->xpath(
                    './/tei:surname'
                );
            }

            $surname = $surnameNodes
                ? $this->elementText($surnameNodes[0])
                : null;

            $firstName = $forenames
                ? implode(' ', $forenames)
                : null;

            $fullName = trim(
                implode(
                    ' ',
                    array_filter([
                        $firstName,
                        $surname,
                    ])
                )
            );

            if ($fullName === '') {
                continue;
            }

            $authors[] = [
                'first_name' => $firstName,
                'last_name' => $surname,
                'full_name' => $fullName,
            ];
        }
        return $authors;
    }

    /**
     * Extracts the abstract based on TEI syntax
     * @param SimpleXMLElement $tei
     * @return string|null
     */
    private function extractAbstract(SimpleXMLElement $tei): ?string
    {
        $nodes = $tei->xpath(
            '//tei:teiHeader//tei:abstract'
        );

        if (!$nodes) {
            return null;
        }

        $abstract = $this->elementText($nodes[0]);
        return $abstract !== '' ? $abstract : null;
    }

    /**
     * Parse the logical structure of the document body. The sectio_path variable in this block and related functions
     * serves only debugging purposes.
     *
     * @return array<int, array<string, mixed>>
     */
    private function extractElements(SimpleXMLElement $tei): array
    {
        $bodyNodes = $tei->xpath(
            '//tei:text/tei:body'
        );

        if (!$bodyNodes) {
            return [];
        }

        $elements = [];
        $position = 0;

        foreach (
            $bodyNodes[0]->children(self::TEI_NS) as $child
        ) {
            $this->parseNode(
                $child,
                $elements,
                $position,
                [],
            );
        }

        return $elements;
    }

    /**
     * Recursively parse TEI nodes.
     *
     * @param array<int, array<string, mixed>> $elements
     * @param array<int, string> $sectionPath
     */
    private function parseNode(
        SimpleXMLElement $node,
        array &$elements,
        int &$position,
        array $sectionPath,
    ): void {
        switch ($node->getName()) {
            case 'div':
                $this->parseSection(
                    $node,
                    $elements,
                    $position,
                    $sectionPath,
                );
                break;

            case 'p':
                $this->parseParagraph(
                    $node,
                    $elements,
                    $position,
                    $sectionPath,
                );
                break;

            case 'figure':
                $type = strtolower(
                    trim((string) $node['type'])
                );

                if ($type === 'table') {
                    $this->parseTable(
                        $node,
                        $elements,
                        $position,
                        $sectionPath,
                    );
                } else {
                    $this->parseFigure(
                        $node,
                        $elements,
                        $position,
                        $sectionPath,
                    );
                }

                break;

            case 'table':
                $this->parseTable(
                    $node,
                    $elements,
                    $position,
                    $sectionPath,
                );
                break;

            case 'formula':
                $this->parseFormula(
                    $node,
                    $elements,
                    $position,
                    $sectionPath,
                );
                break;

            case 'list':
                $this->parseList(
                    $node,
                    $elements,
                    $position,
                    $sectionPath,
                );
                break;

            case 'note':
                $this->parseNote(
                    $node,
                    $elements,
                    $position,
                    $sectionPath,
                );
                break;

            case 'head':
            case 'label':
            case 'figDesc':
            case 'graphic':
                // These are handled by their parent.
                break;

            default:
                // Be tolerant of TEI elements we don't explicitly handle.
                foreach (
                    $node->children(self::TEI_NS) as $child
                ) {
                    $this->parseNode(
                        $child,
                        $elements,
                        $position,
                        $sectionPath,
                    );
                }
        }
    }

    /**
     * Parse a <div>, generally found in the main body text.
     *
     * @param array<int, array<string, mixed>> $elements
     * @param array<int, string> $sectionPath
     */
    private function parseSection(
        SimpleXMLElement $div,
        array &$elements,
        int &$position,
        array $sectionPath,
    ): void {
        $headNodes = $div->xpath('./tei:head');

        $title = $headNodes
            ? $this->elementText($headNodes[0])
            : null;

        $newSectionPath = $sectionPath;

        if ($title !== null && $title !== '') {
            $newSectionPath[] = $title;

            $elements[] = $this->makeElement(
                position: $position++,
                type: 'heading',
                content: $title,
                sourceNode: $div,
            );
        }

        foreach (
            $div->children(self::TEI_NS) as $child
        ) {
            if ($child->getName() === 'head') {
                continue;
            }

            $this->parseNode(
                $child,
                $elements,
                $position,
                $newSectionPath,
            );
        }
    }

    /**
     * Parse a paragraph.
     *
     * Captions are NOT parsed here. Figure/table captions are handled
     * separately by parseFigure() / parseTable().
     *
     * @param array<int, array<string, mixed>> $elements
     * @param array<int, string> $sectionPath
     */
    private function parseParagraph(
        SimpleXMLElement $paragraph,
        array &$elements,
        int &$position,
        array $sectionPath,
    ): void {
        $content = $this->elementText($paragraph);

        if ($content === '') {
            return;
        }

        $elements[] = $this->makeElement(
            position: $position++,
            type: 'paragraph',
            content: $content,
            sectionPath: $sectionPath,
            sourceNode: $paragraph,
        );
    }

    /**
     * Parse figures without merging captions into normal paragraphs.
     *
     * @param array<int, array<string, mixed>> $elements
     * @param array<int, string> $sectionPath
     */
    private function parseFigure(
        SimpleXMLElement $figure,
        array &$elements,
        int &$position,
        array $sectionPath,
    ): void {
        $label = $this->firstText(
            $figure->xpath('./tei:label')
        );

        $caption = $this->firstText(
            $figure->xpath('./tei:figDesc')
        );

        if ($caption === null) {
            $caption = $this->firstText(
                $figure->xpath('./tei:head')
            );
        }

        $graphicNodes = $figure->xpath(
            './/tei:graphic/@url'
        );

        $graphic = $graphicNodes
            ? trim((string) $graphicNodes[0])
            : null;

        $content = trim(
            implode(
                ' ',
                array_filter([
                    $label,
                    $caption,
                ])
            )
        );

        if ($content === '') {
            $content = $this->elementText($figure);
        }

        if ($content === '') {
            return;
        }

        $metadata = [
            'graphic' => $graphic,
        ];

        $metadata = array_merge(
            $metadata,
            $this->extractCoordinates($figure),
        );

        $elements[] = $this->makeElement(
            position: $position++,
            type: 'figure_caption',
            content: $content,
            sectionPath: $sectionPath,
            sourceNode: $figure,
            label: $label,
            metadata: $metadata,
        );
    }

    /**
     * Parse tables.
     *
     * @param array<int, array<string, mixed>> $elements
     * @param array<int, string> $sectionPath
     */
    private function parseTable(
        SimpleXMLElement $table,
        array &$elements,
        int &$position,
        array $sectionPath,
    ): void {
        $label = $this->firstText(
            $table->xpath('./tei:label')
        );

        if ($label === null) {
            $label = $this->firstText(
                $table->xpath('./tei:head')
            );
        }

        $caption = $this->firstText(
            $table->xpath('./tei:figDesc')
        );

        if ($caption === null) {
            $caption = $this->firstText(
                $table->xpath('./tei:head')
            );
        }

        $rows = [];

        foreach (
            $table->xpath('.//tei:row') ?: [] as $row
        ) {
            $cells = [];

            foreach (
                $row->xpath('./tei:cell') ?: [] as $cell
            ) {
                $cells[] = $this->elementText($cell);
            }

            if ($cells) {
                $rows[] = implode(
                    ' | ',
                    $cells
                );
            }
        }

        $tableText = implode(
            "\n",
            $rows
        );

        $content = trim(
            implode(
                "\n",
                array_filter([
                    $label,
                    $caption,
                    $tableText,
                ])
            )
        );

        if ($content === '') {
            return;
        }

        $metadata = $this->extractCoordinates($table);

        $elements[] = $this->makeElement(
            position: $position++,
            type: 'table',
            content: $content,
            sectionPath: $sectionPath,
            sourceNode: $table,
            label: $label,
            metadata: $metadata,
        );
    }

    /**
     * Parse formulas.
     *
     * @param array<int, array<string, mixed>> $elements
     * @param array<int, string> $sectionPath
     */
    private function parseFormula(
        SimpleXMLElement $formula,
        array &$elements,
        int &$position,
        array $sectionPath,
    ): void {
        $content = $this->elementText($formula);

        if ($content === '') {
            return;
        }

        $elements[] = $this->makeElement(
            position: $position++,
            type: 'formula',
            content: $content,
            sectionPath: $sectionPath,
            sourceNode: $formula,
        );
    }

    /**
     * Parse list items individually.
     *
     * @param array<int, array<string, mixed>> $elements
     * @param array<int, string> $sectionPath
     */
    private function parseList(
        SimpleXMLElement $list,
        array &$elements,
        int &$position,
        array $sectionPath,
    ): void {
        foreach (
            $list->xpath('./tei:item') ?: [] as $item
        ) {
            $content = $this->elementText($item);

            if ($content === '') {
                continue;
            }

            $elements[] = $this->makeElement(
                position: $position++,
                type: 'list_item',
                content: $content,
                sectionPath: $sectionPath,
                sourceNode: $item,
            );
        }
    }

    /**
     * Parse notes/footnotes.
     *
     * @param array<int, array<string, mixed>> $elements
     * @param array<int, string> $sectionPath
     */
    private function parseNote(
        SimpleXMLElement $note,
        array &$elements,
        int &$position,
        array $sectionPath,
    ): void {
        $content = $this->elementText($note);

        if ($content === '') {
            return;
        }

        $elements[] = $this->makeElement(
            position: $position++,
            type: 'note',
            content: $content,
            sectionPath: $sectionPath,
            sourceNode: $note,
        );
    }

    /**
     * Extract bibliography.
     *
     * @return array<int, array<string, mixed>>
     */
    private function extractReferences(
        SimpleXMLElement $tei
    ): array {
        $references = [];

        $nodes = $tei->xpath(
            '//tei:text/tei:back//tei:listBibl/*'
        );

        foreach ($nodes ?: [] as $reference) {
            $content = $this->elementText($reference);

            if ($content === '') {
                continue;
            }

            $metadata = $this->extractReferenceMetadata(
                $reference
            );

            $metadata = array_merge(
                $metadata,
                $this->extractCoordinates($reference),
            );

            $references[] = [
                'id' => $this->xmlId($reference),
                'type' => $reference->getName(),
                'content' => $content,
                'metadata' => $metadata,
            ];
        }

        return $references;
    }

    /**
     * @return array<string, mixed>
     */
    private function extractReferenceMetadata(
        SimpleXMLElement $reference
    ): array {
        $metadata = [];

        $titles = [];

        foreach (
            $reference->xpath('.//tei:title') ?: [] as $title
        ) {
            $value = $this->elementText($title);

            if ($value !== '') {
                $titles[] = $value;
            }
        }

        if ($titles) {
            $metadata['titles'] = $titles;
        }

        $dates = $reference->xpath(
            './/tei:date/@when'
        );

        if ($dates) {
            $metadata['date'] = trim(
                (string) $dates[0]
            );
        }

        $doi = $reference->xpath(
            './/tei:idno[@type="DOI"]'
        );

        if ($doi) {
            $metadata['doi'] = $this->elementText(
                $doi[0]
            );
        }

        $pmid = $reference->xpath(
            './/tei:idno[@type="PMID"]'
        );

        if ($pmid) {
            $metadata['pmid'] = $this->elementText(
                $pmid[0]
            );
        }

        return $metadata;
    }

    /**
     * Extract GROBID coordinate information.
     *
     * GROBID represents coordinates as:
     *
     * page,x,y,width,height
     *
     * Multiple boxes are separated by semicolons.
     *
     * Pagination is therefore treated as optional presentation metadata,
     * rather than part of the TEI logical structure.
     *
     * @return array<string, mixed>
     */
    private function extractCoordinates(
        SimpleXMLElement $element
    ): array {
        $coords = trim(
            (string) $element['coords']
        );

        if ($coords === '') {
            return [];
        }

        $boxes = [];

        foreach (
            explode(';', $coords) as $coordinate
        ) {
            $parts = array_map(
                'trim',
                explode(',', $coordinate)
            );

            if (count($parts) !== 5) {
                continue;
            }

            if (
                !is_numeric($parts[0]) ||
                !is_numeric($parts[1]) ||
                !is_numeric($parts[2]) ||
                !is_numeric($parts[3]) ||
                !is_numeric($parts[4])
            ) {
                continue;
            }

            $boxes[] = [
                'page' => (int) $parts[0],
                'x' => (float) $parts[1],
                'y' => (float) $parts[2],
                'width' => (float) $parts[3],
                'height' => (float) $parts[4],
            ];
        }

        if (!$boxes) {
            return [];
        }

        $pages = array_column(
            $boxes,
            'page'
        );

        return [
            'coordinates' => $boxes,
            'page_start' => min($pages),
            'page_end' => max($pages),
        ];
    }

    /**
     * Flatten TEI markup into plain text.
     *
     * This intentionally removes structural XML markup such as:
     *
     * <hi>
     * <ref>
     * <persName>
     * <orgName>
     * <measure>
     *
     * while preserving their textual content.
     */
    private function elementText(
        SimpleXMLElement $element
    ): string {
        $textNodes = $element->xpath(
            './/text()'
        );

        if (!$textNodes) {
            return $this->normalizeText(
                (string) $element
            );
        }

        $parts = [];

        foreach ($textNodes as $textNode) {
            $value = trim(
                (string) $textNode
            );

            if ($value !== '') {
                $parts[] = $value;
            }
        }

        return $this->normalizeText(
            implode(' ', $parts)
        );
    }

    private function normalizeText(
        string $text
    ): string {
        $text = html_entity_decode(
            $text,
            ENT_QUOTES | ENT_HTML5,
            'UTF-8'
        );

        $text = preg_replace(
            '/\s+/u',
            ' ',
            $text
        ) ?? $text;

        return trim($text);
    }

    private function firstText(
        array|false|null $nodes
    ): ?string {
        if (!$nodes) {
            return null;
        }

        $text = $this->elementText($nodes[0]);

        return $text !== ''
            ? $text
            : null;
    }

    private function xmlId(
        SimpleXMLElement $element
    ): ?string {
        $attributes = $element->attributes(
            self::XML_NS
        );

        $id = trim(
            (string) ($attributes['id'] ?? '')
        );

        return $id !== ''
            ? $id
            : null;
    }

    /**
     * @param array<int, string> $sectionPath
     * @param array<string, mixed> $metadata
     */
    private function makeElement(
        int $position,
        string $type,
        string $content,
        array $sectionPath,
        ?SimpleXMLElement $sourceNode = null,
        ?string $label = null,
        array $metadata = [],
    ): array {
        if ($sourceNode !== null) {
            $metadata = array_merge(
                [
                    'xml_id' => $this->xmlId(
                        $sourceNode
                    ),
                ],
                $this->extractCoordinates(
                    $sourceNode
                ),
                $metadata,
            );
        }

        return [
            'position' => $position,
            'type' => $type,

            'section' => $sectionPath
                ? implode(
                    ' > ',
                    $sectionPath
                )
                : null,

            'section_path' => $sectionPath,
            'content' => $content,
            'label' => $label,
            'metadata' => $metadata,
        ];
    }
}
