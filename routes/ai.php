<?php

use App\Http\Middleware\MCPMode;
use App\Mcp\Servers\GnomDataServer;
use Laravel\Mcp\Facades\Mcp;

Mcp::web('/mcp/data', GnomDataServer::class)->middleware(['auth:sanctum', MCPMode::class]);
