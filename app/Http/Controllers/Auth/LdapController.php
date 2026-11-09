<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\FederatedUser;
use App\Models\User;
use App\Services\Ldap\LdapService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use SebastianBergmann\Template\RuntimeException;

class LdapController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/LdapLogin', [
            'canResetPassword' => false,
            'status' => session('status'),
            'ldap_enabled' => config('ldap.enabled', false),
            'ldap_login_banner' => config('ldap.login_banner'),
        ]);
    }

    /**
     * Authenticate a user via LDAP
     */
    public function store(Request $request, LdapService $ldap): RedirectResponse
    {
        $data = $request->validate(['uid' => 'required|string', 'password' => 'required|string']);

        try {
            $ldapUser = $ldap->authenticate($data['uid'], $data['password']);
        } catch (RuntimeException $e) {
            report($e);

            return back()->withErrors(['uid' => 'Authentication service unavailable.']);
        }

        if ($ldapUser === null) {
            return back()->withErrors(['uid' => 'Invalid credentials.']);
        }

        // First find the federated user
        $federatedUser = FederatedUser::where('upstream_uid', $data['uid'])->first();

        // Federate users on first login
        if ($federatedUser === null) {
            $user = new User;
            $user->email = $ldapUser->email;
            $user->name = $ldapUser->name;
            /**
             * Storing the password the user used to authenticate against the LDAP would introduce an additional
             * attack vector for malicious actors trying to obtain login credentials, but we need a password to comply
             * with the NON-NULL constraint => safely generate a random password.
             *
             * Since the user is tagged as federated, this password will never be used to authenticate the user.
             **/
            $user->password = Str::password(24);
            $user->is_federated = true;
            $user->save();

            try {
                // Attach federation
                $federatedUser = new FederatedUser;
                $federatedUser->user_id = $user->id;
                $federatedUser->provider_type = "ldap";
                $federatedUser->upstream_uid = $ldapUser->username;
                $federatedUser->save();
            } catch (RuntimeException $e) {
                report($e);
                // Don't leave user account dangling
                $user->delete();
            }

        } else {
            $user = $federatedUser->user();
        }

        if ($user->is_locked) {
            return back()->withErrors(['uid' => 'Account is locked in G-nom.']);
        }

        # User is LDAP authenticated and matched to a federated user => check for attribute changes
        if($ldapUser->email != $user->email) {
            $user->email = $ldapUser->email;
            $user->save();
        }

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended(route('assemblies', absolute: false));
    }
}
