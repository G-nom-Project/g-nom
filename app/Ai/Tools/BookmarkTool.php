<?php

namespace App\Ai\Tools;

use App\Models\Assembly;
use App\Models\Bookmark;
use App\Models\User;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class BookmarkTool implements Tool
{

    public function __construct(
        protected User $user,
    ) {}

    /**
     * Get the description of the tool's purpose.
     */
    public function description(): Stringable|string
    {
        return
            'This tool allows you to set or remove bookmarks for assemblies on behalf of a user. Only use this tool if
            explicitly instructed to. Bookmarks are set via assembly ID. Available actions are "set", "remove"';
    }

    /**
     * Execute the tool.
     */
    public function handle(Request $request): Stringable|string
    {
        //
        $action = $request['action'];
        if ($action != 'set' && $action != 'remove') {
            return "Invalid action '{$action}', only set or remove are allowed.";
        }

        $assembly = Assembly::where('id', $request['assembly_id'])->firstOrFail();

        if(!$assembly) {
            return "Assembly not found.";
        }

        if ($this->user->cannot('view', $assembly)) {
            return 'The requested assembly is not available to this user. NOTIFY THE USER!';
        }
        $bookmark = Bookmark::where('user_id', $this->user->id)->where('assembly_id', $assembly->id)->first();

        if ($action == 'set') {
            if ($bookmark) {
                return "Assembly is already bookmarked.";
            }

            $bookmark = Bookmark::create([
                'user_id' => $this->user->id,
                'assembly_id' => $assembly->id,
            ]);

            $bookmark->save();

            return "Bookmarked assembly.";
        } else {
            if (!$bookmark) {
                return "The bookmark does not exist.";
            }

            $bookmark->delete();
            return "Bookmark removed.";
        }
    }

    /**
     * Get the tool's schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'assembly_id' => $schema->integer()->required(),
            'action' => $schema->string()->required(),
        ];
    }
}
