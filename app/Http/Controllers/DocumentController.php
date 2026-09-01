<?php

namespace App\Http\Controllers;

use App\Jobs\Concerns\DispatchesTrackableJobs;
use App\Models\Document;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use PharIo\Version\Exception;

class DocumentController extends Controller
{
    //
    use DispatchesTrackableJobs;

    public function view($id) {
        $document = Document::where('id', $id)->with('references')->first();
        return Inertia::render('DocumentPage', [
            'document' => $document,
        ]);

    }

    public function uploadPage() {
        $this->authorize('create', Document::class);
        return Inertia::render('DocumentUploadPage', [
        ]);
    }

    public function uploadFiles(Request $request)
    {
        try {
            $request->validate([
                'files' => ['required', 'array'],
                'files.*' => ['file', 'mimes:pdf', 'max:51200'],
            ]);
        } catch  (Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 422);
        }

        $this->authorize('create', Document::class);

        $files = $request->file('files');
        foreach ($files as $file) {
            $uniqueName = Str::random(20);
            $path = $file->storeAs(
                'uploads',
                $uniqueName . '.pdf'
            );
            $this->dispatchTrackable(
                'App\Jobs\ProcessUploadedDocument',
                payload: [$path],
                queue: 'long'
            );
        }

        return response()->json(['success' => true]);
    }
}
