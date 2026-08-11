<?php

namespace App\Http\Controllers;

use App\Jobs\Concerns\DispatchesTrackableJobs;
use App\Models\Assembly;
use App\Models\UserJob;
use App\Services\ApplicationModeService;
use App\Services\BlastResultParser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class JobController extends Controller
{
    //
    use DispatchesTrackableJobs;

    public function __construct(
        protected BlastResultParser $blastParser
    ) {}

    public function index()
    {
        $user = auth()->user();
        $jobs = UserJob::where('user_id', $user->id)->orderBy('created_at', 'desc')->get();
        // $jobs = $user->jobs;

        return Inertia::render('Jobs', [
            'jobs' => $jobs,
        ]);
    }

    public function details($id)
    {
        $user = auth()->user();
        $job = $user->jobs()->find($id);
        $vault = Storage::disk('vault');
        if (! $job) {
            abort(404);
        }

        $redirectable_jobs = ["App\Jobs\ImportBusco", "App\Jobs\ImportTaxaminer", "App\Jobs\ImportRepeatMasker"];

        if (in_array($job->job_class, $redirectable_jobs)) {
            return redirect('/assemblies/'.$job->payload['assemblyID']);
        }

        // Render Simple BLAST results
        if ($job->job_class == 'SingleBlastQuery' || $job->job_class == 'App\Jobs\SingleBlastQuery') {
            $data = [];
            if ($job->status == 'completed') {
                $path = $vault->path("blast/queries/{$job->result['filename']}");
                if (file_exists($path)) {
                    $data = $this->blastParser->parse($path);
                }
            }

            return Inertia::render('JobResults/Blast', ['job' => $job, 'data' => $data]);
        } else {
            abort(404);
        }
    }

    public function createBLAST(Request $request)
    {
        if (!app(ApplicationModeService::class)->isBlastEnabled()) {
            abort(503, 'BLAST is disabled on this instance');
        }

        // Check DB rebuild lock
        $wait = Cache::get('rebuilding_blast_shard');

        return Inertia::render('JobDispatches/Blast', ['wait' => $wait]);
    }

    public function dispatchBLAST(Request $request)
    {
        if (!app(ApplicationModeService::class)->isBlastEnabled()) {
            abort(503, 'BLAST is disabled on this instance');
        }

        $request->validate([
            'query' => 'required|string|max:2048',
        ]);
        $user = auth()->user();
        $this->dispatchTrackable('App\Jobs\SingleBlastQuery', payload: [$request->input('query'), $user->id]);

        return $this->index();
    }

    public function map_job_to_assembly(Request $request, int $id)
    {
        $job = UserJob::findOrFail($id);
        $assembly_id = $job->result['assemblyID'];
        $assembly = Assembly::where('id', $assembly_id)->first();
        $this->authorize('update', $assembly);

        return response()->json([
            'jobID' => $id,
            'assemblyID' => $assembly_id,
            'taxonID' => $assembly->taxon_ncbiTaxonID,
        ]);
    }
}
