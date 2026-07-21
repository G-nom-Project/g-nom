<?php

use App\Models\Assembly;
use App\Models\AssemblyCollection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\delete;
use function Pest\Laravel\get;
use function Pest\Laravel\post;
use function Pest\Laravel\put;

uses(RefreshDatabase::class);

function actingAsRole(User $user): void
{
    actingAs($user);
}

function attachRole(AssemblyCollection $collection, User $user, string $role): void
{
    $collection->users()->syncWithoutDetaching([
        $user->id => [
            'role' => $role,
        ],
    ]);
}

beforeEach(function () {
    $this->admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $this->owner = User::factory()->create();

    $this->editor = User::factory()->create();

    $this->viewer = User::factory()->create();

    $this->outsider = User::factory()->create();

    $this->collection = AssemblyCollection::factory()->create([
        'user_id' => $this->owner->id,
        'is_public' => false,
    ]);

    $this->collection->users()->attach($this->owner, [
        'role' => 'admin',
    ]);

    $this->collection->users()->attach($this->editor, [
        'role' => 'editor',
    ]);

    $this->collection->users()->attach($this->viewer, [
        'role' => 'viewer',
    ]);
});

describe('index', function () {
    test('shows collections visible to the authenticated user', function () {
        actingAs($this->viewer);
        $response = get('/collections');
        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Collections/CollectionsPage')
                ->has('collections', 1)
                ->where('user_id', $this->viewer->id)
            );
    });

    test('shows public collections', function () {
        AssemblyCollection::factory()
            ->public()
            ->create();
        actingAs($this->outsider);
        $response = get('/collections');
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page->has('collections', 1)
        );
    });

    test('does not show unrelated private collections', function () {
        AssemblyCollection::factory()
            ->private()
            ->create();
        actingAs($this->outsider);
        $response = get('/collections');
        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('collections', 0)
            );
    });
});

describe('view', function () {
    test('allows admins to view a collection', function () {
        actingAs($this->owner);
        get("/collections/{$this->collection->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Collections/CollectionPage')
                ->where('collection.id', $this->collection->id)
                ->where('role', 'admin')
            );
    });

    test('allows editors to view a collection', function () {
        actingAs($this->editor);
        get("/collections/{$this->collection->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('role', 'editor')
            );
    });

    test('allows viewers to view a collection', function () {
        actingAs($this->viewer);
        get("/collections/{$this->collection->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('role', 'viewer')
            );
    });

    test('forbids unrelated users', function () {
        actingAs($this->outsider);
        get("/collections/{$this->collection->id}")
            ->assertForbidden();
    });

    test('allows viewing public collections', function () {
        $this->collection->update([
            'is_public' => true,
        ]);
        actingAs($this->outsider);
        get("/collections/{$this->collection->id}")
            ->assertOk();
    });
});

describe('create', function () {
    test('creates a collection', function () {
        actingAs($this->admin);
        put('/collections/', [
            'name' => 'Test',
            'public' => false,
        ])
            ->assertOk();
        expect(
            AssemblyCollection::count()
        )->toBe(2);
    });

    test('makes creator an admin', function () {
        actingAs($this->owner);
        post('/collections', [
            'name' => 'Testing',
            'public' => false,
        ]);
        $collection = AssemblyCollection::latest()->first();
        expect(
            $collection
                ->users()
                ->whereKey($this->owner)
                ->first()
                ->pivot
                ->role
        )->toBe('admin');
    });
});

describe('gallery', function () {
    beforeEach(function () {
        $this->assembly1 = Assembly::factory()->create([
            'name' => 'Human Genome',
        ]);

        $this->assembly2 = Assembly::factory()->create([
            'name' => 'Mouse Genome',
        ]);

        $this->collection
            ->assemblies()
            ->attach($this->assembly1);

        $this->collection
            ->assemblies()
            ->attach($this->assembly2);
    });

    test('shows assemblies belonging to the collection', function () {
        actingAs($this->owner);
        get("/collections/{$this->collection->id}/gallery")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Collections/Gallery')
                ->has('assemblies.data', 2)
            );
    });

    test('filters assemblies by name', function () {
        actingAs($this->owner);
        get("/collections/{$this->collection->id}/gallery?search=Human")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('assemblies.data', 1)
                ->where(
                    'assemblies.data.0.name',
                    'Human Genome'
                )
            );
    });

    test('returns no assemblies when search has no matches', function () {
        actingAs($this->owner);
        get("/collections/{$this->collection->id}/gallery?search=Banana")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('assemblies.data', 0));
    });

    test('forbids unrelated users', function () {
        actingAs($this->outsider);
        get("/collections/{$this->collection->id}/gallery")
            ->assertForbidden();
    });

});

describe('add assembly', function () {

    beforeEach(function () {
        $this->assembly = Assembly::factory()->create();
    });

    test('adds an assembly', function () {
        actingAs($this->admin);
        post("/collections/{$this->collection->id}/add-assembly", [
            'assemblyID' => $this->assembly->id,
        ])->assertRedirect();
        expect(
            $this->collection
                ->fresh()
                ->assemblies
                ->contains($this->assembly)
        )->toBeTrue();
    });

    test('forbids viewers from adding assemblies', function () {
        actingAs($this->viewer);
        post("/collections/{$this->collection->id}/add-assembly", [
            'assemblyID' => $this->assembly->id,
        ])->assertForbidden();
    });
});

describe('remove assembly', function () {
    beforeEach(function () {
        $this->assembly = Assembly::factory()->create();
        $this->collection
            ->assemblies()
            ->attach($this->assembly);
    });

    test('removes an assembly', function () {
        actingAs($this->owner);
        post("/collections/{$this->collection->id}/remove-assembly", [
            'assemblyID' => $this->assembly->id,
        ])->assertRedirect();

        expect(
            $this->collection
                ->fresh()
                ->assemblies
                ->contains($this->assembly)
        )->toBeFalse();
    });

    test('forbids viewers', function () {
        actingAs($this->viewer);
        post("/collections/{$this->collection->id}/remove-assembly", [
            'assemblyID' => $this->assembly->id,
        ])->assertForbidden();
    });
});

describe('add user', function () {
    beforeEach(function () {
        $this->newUser = User::factory()->create();
    });

    test('allows admins to add users', function () {
        actingAs($this->owner);
        post("/collections/{$this->collection->id}/add-user", [
            'userID' => $this->newUser->id,
            'role' => 'viewer',
        ])->assertRedirect();
        expect(
            $this->collection
                ->fresh()
                ->users()
                ->whereKey($this->newUser)
                ->exists()
        )->toBeTrue();
    });

    test('stores the requested role', function () {

        actingAs($this->owner);
        post("/collections/{$this->collection->id}/add-user", [

            'userID' => $this->newUser->id,
            'role' => 'editor',

        ]);
        expect(
            $this->collection
                ->fresh()
                ->users()
                ->whereKey($this->newUser)
                ->first()
                ->pivot
                ->role
        )->toBe('editor');
    });

    test('updates the role of an existing user', function () {
        actingAs($this->owner);
        post("/collections/{$this->collection->id}/add-user", [
            'userID' => $this->viewer->id,
            'role' => 'editor',
        ]);

        expect(
            $this->collection
                ->fresh()
                ->users()
                ->whereKey($this->viewer)
                ->first()
                ->pivot
                ->role
        )->toBe('editor');
    });

    test('forbids editors', function () {
        actingAs($this->editor);
        post("/collections/{$this->collection->id}/add-user", [
            'userID' => $this->newUser->id,
            'role' => 'viewer',
        ])
            ->assertForbidden();
    });

    test('forbids viewers', function () {
        actingAs($this->viewer);
        post("/collections/{$this->collection->id}/add-user", [
            'userID' => $this->newUser->id,
            'role' => 'viewer',

        ])
            ->assertForbidden();
    });

    test('requires a valid role', function () {
        actingAs($this->owner);
        post("/collections/{$this->collection->id}/add-user", [
            'userID' => $this->newUser->id,
            'role' => 'banana',
        ])
            ->assertSessionHasErrors('role');
    });

    test('requires an existing user', function () {
        actingAs($this->owner);
        post("/collections/{$this->collection->id}/add-user", [
            'userID' => 999999,
            'role' => 'viewer',
        ])
            ->assertSessionHasErrors('userID');
    });
});

describe('delete', function () {
    test('allows admins to delete collections', function () {
        actingAs($this->owner);
        delete("/collections/{$this->collection->id}")
            ->assertOk();
        expect(
            AssemblyCollection::find($this->collection->id)
        )->toBeNull();
    });

    test('forbids editors', function () {
        actingAs($this->editor);
        delete("/collections/{$this->collection->id}")->assertForbidden();
    });

    test('forbids viewers', function () {
        actingAs($this->viewer);
        delete("/collections/{$this->collection->id}")
            ->assertForbidden();
    });

    test('forbids outsiders', function () {
        actingAs($this->outsider);
        delete("/collections/{$this->collection->id}")
            ->assertForbidden();
    });

});

describe('edge cases', function () {
    test('returns 404 for unknown collections', function () {
        actingAs($this->owner);
        get('/collections/999999')
            ->assertNotFound();
    });

    test('cannot add a user twice', function () {
        actingAs($this->owner);
        post("/collections/{$this->collection->id}/users", [
            'userID' => $this->viewer->id,
            'role' => 'viewer',
        ]);

        expect(
            $this->collection
                ->fresh()
                ->users()
                ->whereKey($this->viewer)
                ->count()
        )->toBe(1);
    });
});
