<?php

namespace App\Mcp\Servers;

use App\Mcp\Tools\AssemblySearchTool;
use App\Mcp\Tools\ExecuteSparqlQuery;
use App\Mcp\Tools\RetrieveBuscoTool;
use App\Mcp\Tools\RetrieveFcatTool;
use App\Mcp\Tools\UserGuideTool;
use Laravel\Mcp\Server;
use Laravel\Mcp\Server\Attributes\Instructions;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Attributes\Version;

#[Name('G-nom Data Server')]
#[Version('0.0.1')]
#[Instructions('MCP server allowing agents to interact with hard data stored in this G-nom Instance.')]
class GnomDataServer extends Server
{
    protected array $tools = [
        //
        RetrieveBuscoTool::class,
        AssemblySearchTool::class,
        RetrieveFcatTool::class,
        UserGuideTool::class,
        ExecuteSparqlQuery::class,
    ];

    protected array $resources = [
        //
    ];

    protected array $prompts = [
        //
    ];
}
