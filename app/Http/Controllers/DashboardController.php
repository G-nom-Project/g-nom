<?php

namespace App\Http\Controllers;

use App\Jobs\CleanUploadsJob;
use App\Jobs\RebuildTaxonTable;
use App\Models\Assembly;
use App\Models\AssemblyCollection;
use App\Models\BuscoAnalysis;
use App\Models\FcatAnalysis;
use App\Models\RepeatmaskerAnalysis;
use App\Models\TaxaminerAnalysis;
use App\Models\Taxon;
use App\Models\User;
use App\Models\UserJob;
use App\Services\ApplicationModeService;
use Illuminate\Contracts\Routing\ResponseFactory;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Routing\Redirector;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DashboardController extends Controller
{
    //
    public function view()
    {
        return Inertia::render('Dashboard', [
            'is_read_only' => app(ApplicationModeService::class)->isReadOnly(),
        ]);
    }

    public function admin()
    {

        Cache::store('redis')->put('health_check', 'ok', 10);
        $cache_healthy = Cache::store('redis')->get('health_check') === 'ok';

        $stats = DB::selectOne('
            SELECT
                pg_size_pretty(pg_database_size(current_database())) AS db_size,
                round(100.0 * blks_hit / NULLIF(blks_hit + blks_read, 0), 2) AS cache_hit_pct,
                xact_commit,
                xact_rollback,
                deadlocks,
                temp_files
            FROM pg_stat_database
            WHERE datname = current_database()
        ');

        $qlever_response = Http::timeout(120)
            ->get(config('gnom.qlever_host'), [
                'cmd' => 'stats',
            ]);

        $path = Storage::disk('vault')->path('');
        $disk_total = disk_total_space($path);
        $disk_free = disk_free_space($path);

        $totalAssemblies = Cache::rememberForever('totalAssemblies', function () {
            return Assembly::count();
        });

        $publicAssemblies = Assembly::where('public', true)->count();

        $taxaWithAssemblies = Cache::rememberForever('taxaWithAssemblies', function () {
            return Taxon::whereHas('assemblies')->count();
        });

        $analysesCount = Cache::rememberForever('analyses_count', function () {
            return BuscoAnalysis::count() + RepeatmaskerAnalysis::count() + TaxaminerAnalysis::count() + FcatAnalysis::count();
        });

        $userCount = User::count();
        $collectionCount = AssemblyCollection::count();
        $publicCollectionCount = AssemblyCollection::where('is_public', true)->count();

        $users = User::all();

        return Inertia::render('AdminDashboard', [
            'db' => $stats,
            'cache_healthy' => $cache_healthy,
            'qlever' => $qlever_response->json(),
            'vault' => [
                'disk_total' => $disk_total,
                'disk_free' => $disk_free,
            ],
            'data' => [
                'assemblies' => $totalAssemblies,
                'public_assemblies' => $publicAssemblies,
                'taxa' => $taxaWithAssemblies,
                'analyses' => $analysesCount,
                'users' => $userCount,
                'collections' => $collectionCount,
                'public_collections' => $publicCollectionCount,
            ],
            'users' => $users,
        ]);
    }

    /**
     * Flush the entire (!) redis cache
     *
     * @return ResponseFactory|Response
     */
    public function flushCache()
    {
        Cache::flush();

        return response('', 204);
    }

    /**
     * Dispatch housekeeping job for the upload directory
     *
     * @return ResponseFactory|Response
     */
    public function cleanData()
    {
        CleanUploadsJob::dispatch();

        return response('', 204);
    }

    /**
     * Queue a job downloading the newest taxdump and importing it into the DB
     *
     * @return ResponseFactory|Response
     */
    public function updateTaxonomy()
    {
        $user = Auth::user();
        RebuildTaxonTable::dispatch($user->id, 'https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/new_taxdump/new_taxdump.tar.gz');

        return response('', 204);
    }

    /**
     * Instructs Qlever to rebuild its index
     *
     * @return ResponseFactory|Response
     *
     * @throws ConnectionException
     */
    public function rebuildIndex()
    {
        $payload = [
            'cmd' => 'rebuild-index',
            'access-token' => config('gnom.qlever_access_token'),
        ];

        $payload['index-name'] = 'gnom';
        $host = config('gnom.qlever_host');
        $response = Http::asForm()->post($host, $payload);

        $body = $response->body();

        return response($body, 200);
    }

    /**
     * Remove failed / stale jobs
     *
     * @return ResponseFactory|Response
     */
    public function pruneJobs()
    {
        UserJob::where('status', 'failed')->delete();
        UserJob::where('started_at', '<', now()->subDays(14))->delete();
        UserJob::where('finished_at', '<', now()->subDays(7))->delete();

        return response('', 204);
    }

    public function editUser(Request $request, $user)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user),
            ],
            'role' => ['required', Rule::in(['user', 'admin'])],
            'password' => ['nullable', 'confirmed', 'min:12'],
        ]);

        $data['password'] = Hash::make($data['password']);

        if (empty($data['password'])) {
            unset($data['password']);
        }
        User::where('id', $user)->update($data);

        return back()->with('success', 'User updated successfully.');
    }

    public function storeUser(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::in(['user', 'admin'])],
            'password' => ['required', 'confirmed', 'min:12'],
        ]);

        $data['password'] = Hash::make($data['password']);
        User::create($data);

        return back()->with('success', 'User created successfully.');
    }

    /**
     * Log in as a different user for debug purposes
     *
     * @return RedirectResponse|Redirector
     */
    public function impersonate(int $user)
    {
        $user = User::where('id', $user)->first();
        Auth::login($user);
        Log::warn('User '.Auth::user()->email." impersonated user $user->email");

        return redirect(route('dashboard', absolute: false));
    }

    /**
     * Lock user account and disable all associated API tokens
     *
     * @return ResponseFactory|Response
     */
    public function lockUser(int $user_id)
    {
        $user = User::where('id', $user_id)->first();
        $user->is_locked = true;
        $user->save();
        $user->tokens()->delete();

        return response('', 204);
    }

    /**
     * Unlock locked user account
     *
     * @return ResponseFactory|Response
     */
    public function unlockUser(int $user_id)
    {
        $user = User::where('id', $user_id)->first();
        $user->is_locked = false;
        $user->save();
        $user->tokens()->delete();

        return response('', 204);
    }
}
