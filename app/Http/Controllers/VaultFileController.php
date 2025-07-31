<?php

namespace App\Http\Controllers;

use App\Models\Assembly;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VaultFileController extends Controller
{
    public function serve(Request $request, $path)
    {
        // Sanitize path
        if (str_contains($path, '..') || str_starts_with($path, '/')) {
            abort(403, 'Forbidden path');
        }

        /**
         * All vault file requests must follow the pattern
         * taxa/<tax_id>/<assembly_id>/<path_to_file>
         */
        if (preg_match("#taxa/[0-9]+/[0-9]+/#", $path) === false) {
            abort(400, 'Malformed path');
        }

        // Only allow certain file extensions
        $allowedExtensions = ['gz', 'gzi', 'fai', 'tbi'];
        $extension = pathinfo($path, PATHINFO_EXTENSION);

        if (!in_array($extension, $allowedExtensions)) {
            abort(403, 'File type not allowed');
        }

        // Disallow hidden files or directories (e.g., ".htaccess")
        foreach (explode('/', $path) as $segment) {
            if (str_starts_with($segment, '.')) {
                abort(403, 'Hidden files not allowed');
            }
        }

        // Enforce access policy via associated assemblyID
        $assemblyID = intval(explode('/', $path)[2]);
        $assembly = Assembly::where('id', $assemblyID)->first();
        $this->authorize('view', $assembly);

        // Find real path - or not
        $filePath = storage_path("app/vault/{$path}");
        if (!file_exists($filePath)) {
            abort(404, 'File not found');
        }

        $fileSize = filesize($filePath);
        $mimeTypes = [
            'gz'   => 'application/x-gzip',
            'gzi'  => 'application/octet-stream', // Index file, not gzip
            'fai'  => 'text/plain',
            'sorted.gff3' => 'text/plain',
            'sorted.gff3.gz' => 'application/x-gzip',
            'sorted.gff3.gz.tbi' => 'application/x-gzip',
            'fa'   => 'text/plain',
            'fa.gz' => 'application/x-gzip',
            'fasta' => 'text/plain',
            'fasta.gz' => 'application/x-gzip',
        ];


        $position = strpos($path, '.');
        if ($position !== false) {
            $extension = substr($path, $position + 1);
        } else {
            return response('', 416);
        }

        $contentType = $mimeTypes[$extension] ?? 'application/octet-stream';

        $headers = [
            'Content-Type' => $contentType,
            'Accept-Ranges' => 'bytes',
        ];

        // Use Range Headers whenever possible
        if ($request->headers->has('Range')) {
            if (preg_match('/bytes=(\d+)-(\d*)/', $request->header('Range'), $matches)) {
                $start = intval($matches[1]);
                $end = isset($matches[2]) && $matches[2] !== '' ? intval($matches[2]) : $fileSize - 1;

                if ($start >= $fileSize) {
                    return response('', 416); // Invalid range
                }

                $end = min($end, $fileSize - 1);
                $length = $end - $start + 1;

                $headers['Content-Length'] = $length;
                $headers['Content-Range'] = "bytes {$start}-{$end}/{$fileSize}";

                return new StreamedResponse(function () use ($filePath, $start, $length) {
                    $fp = fopen($filePath, 'rb');
                    fseek($fp, $start);
                    echo fread($fp, $length);
                    fclose($fp);
                }, 206, $headers);
            }
        }

        // Fallback: Serve full file
        $headers['Content-Length'] = $fileSize;
        return response()->stream(function () use ($filePath) {
            readfile($filePath);
        }, 200, $headers);
    }
}
