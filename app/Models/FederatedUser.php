<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FederatedUser extends Model
{
    public const PROVIDER_LDAP = 'ldap';

    protected $primaryKey = 'user_id';

    public $incrementing = false;

    protected $keyType = 'int';

    // user_id is set through the relation ($user->federatedUser()->create([...])), so it is not fillable.
    protected $fillable = ['provider_type', 'upstream_uid'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
