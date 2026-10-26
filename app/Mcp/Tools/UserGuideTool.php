<?php

namespace App\Mcp\Tools;

use App\Services\UserGuide;
use Illuminate\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[IsReadOnly]
class UserGuideTool extends Tool
{
    protected string $description = 'Browse the g-nom user guide. Without "page", returns the list of available pages. With "page", returns that page as AsciiDoc.';

    public function schema(JsonSchema|\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'page' => $schema->string()->description('Page name from the list, without .adoc'),
        ];
    }

    public function handle(Request $request, UserGuide $guide): Response
    {
        $page = $request->string('page')->toString();

        if ($page === '') {
            return Response::text($guide->pages()->implode("\n"));
        }

        $content = $guide->read($page);

        return $content === null
            ? Response::error("Page not found. Call without 'page' to list valid pages.")
            : Response::text($content);
    }
}
