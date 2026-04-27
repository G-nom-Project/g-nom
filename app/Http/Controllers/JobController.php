<?php

namespace App\Http\Controllers;

use App\Jobs\Concerns\DispatchesTrackableJobs;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class JobController extends Controller
{
    //
    use DispatchesTrackableJobs;

    public function index()
    {
        $user = auth()->user();
        $jobs = $user->jobs;

        return Inertia::render('Jobs', [
            'jobs' => $jobs,
        ]);
    }

    public function details($id)
    {
        $user = auth()->user();
        $job = $user->jobs()->find($id);
        $vault = \Illuminate\Support\Facades\Storage::disk('vault');
        if (! $job) {
            return 404;
        }

        $redirectable_jobs = ["App\Jobs\ImportBusco", "App\Jobs\ImportTaxaminer", "App\Jobs\ImportRepeatMasker"];

        function parseBLAST($path)
        {
            $rows = array_map('str_getcsv', file($path), array_fill(0, count(file($path)), "\t"));

            // This is equivalent to outputfmt 6, which is enforced in the BLAST jobs
            $header = ['qseqid', 'sseqid', 'stitle', 'pident', 'length', 'mismatch', 'gapopen', 'qstart', 'qend', 'sstart', 'send', 'evalue', 'bitscore'];

            $data = array_map(function ($row) use ($header) {

                $mapped = array_combine($header, $row);
                $mapped['id'] = $mapped['qseqid'].'_'.$mapped['sseqid'];

                return $mapped;
            }, $rows);

            return $data;
        }

        if (in_array($job->job_class, $redirectable_jobs)) {
            return redirect('/assemblies/'.$job->payload['assemblyID']);
        }

        // Render Simple BLAST results
        if ($job->job_class == 'SingleBlastQuery' || $job->job_class == 'App\Jobs\SingleBlastQuery') {
            $data = [];
            if ($job->status == 'completed') {
                $path = $vault->path("blast/queries/{$job->result['filename']}");
                if (file_exists($path)) {
                    $data = parseBLAST($path);
                }
            }

            return Inertia::render('JobResults/Blast', ['job' => $job, 'data' => $data]);
        }
    }

    public function createBLAST(Request $request)
    {
        // Check DB rebuild lock
        $wait = Cache::get('rebuilding_blast_shard');

        return Inertia::render('JobDispatches/Blast', ['wait' => $wait]);
    }

    public function dispatchBLAST(Request $request)
    {
        $request->validate([
            'query' => 'required|string|max:2048',
        ]);
        $user = auth()->user();
        $this->dispatchTrackable('App\Jobs\SingleBlastQuery', payload: [$request->input('query'), $user->id]);

        return $this->index();
    }
}
