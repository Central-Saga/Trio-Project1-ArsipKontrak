<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\Project;
use App\Models\User;
use Closure;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ControllerApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_controllers_are_at_most_150_lines_and_do_not_query_models(): void
    {
        $files = File::allFiles(app_path('Http/Controllers/Api'));

        $this->assertNotEmpty($files, 'Tidak ada controller API yang diperiksa.');

        foreach ($files as $file) {
            $this->assertLessThanOrEqual(
                150,
                count(file($file->getPathname())),
                "{$file->getRelativePathname()} melebihi batas 150 baris."
            );

            $contents = $file->getContents();

            foreach ([
                '::query',
                '::where',
                '::find(',
                '::findOrFail(',
                '::create(',
                'DB::',
                'ActivityLog::',
            ] as $forbidden) {
                $this->assertStringNotContainsString(
                    $forbidden,
                    $contents,
                    "{$file->getRelativePathname()} tidak boleh memakai {$forbidden}; gunakan Service/Repository."
                );
            }

            $this->assertStringContainsString(
                'Service',
                $contents,
                "{$file->getRelativePathname()} harus memakai Service."
            );
        }
    }

    public function test_document_listing_rejects_unlisted_sort_filter_and_pagination(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        foreach ([
            'sort=password',
            'sort=id',
            'filter[pwd]=rahasia',
            'per_page=abc',
        ] as $query) {
            $this->actingAs($admin, 'sanctum')
                ->getJson('/api/v1/documents?'.$query)
                ->assertStatus(422);
        }

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/documents?sort=document_name&direction=asc&per_page=5&filter[status]=active')
            ->assertOk()
            ->assertJsonPath('meta.per_page', 5);
    }

    public function test_other_listing_endpoints_reject_unlisted_sort_filter_and_pagination(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $project = $this->createProject();
        $document = $this->createDocument($project, $admin);

        $endpoints = [
            '/api/v1/documents/'.$document->id.'/versions',
            '/api/v1/admin/users',
            '/api/v1/admin/activity-logs',
            '/api/v1/notifications',
            '/api/v1/projects',
        ];

        foreach ($endpoints as $endpoint) {
            foreach ([
                'sort=password',
                'filter[pwd]=rahasia',
                'per_page=abc',
            ] as $query) {
                $separator = str_contains($endpoint, '?') ? '&' : '?';

                $this->actingAs($admin, 'sanctum')
                    ->getJson($endpoint.$separator.$query)
                    ->assertStatus(422);
            }
        }

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/documents/'.$document->id.'/versions?sort=version_number&direction=asc&per_page=10')
            ->assertOk();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/users?sort=name&direction=asc&per_page=10')
            ->assertOk();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/activity-logs?sort=created_at&direction=desc&per_page=10')
            ->assertOk();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/notifications?sort=created_at&direction=desc&per_page=10')
            ->assertOk();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/projects?sort=project_name&direction=asc&per_page=10')
            ->assertOk()
            ->assertJsonCount(1);
    }

    public function test_login_and_profile_keep_expected_response_shapes(): void
    {
        $user = User::factory()->create([
            'email' => 'api-shape@arsipkontrak.local',
            'password' => 'password',
        ]);

        $this->postJson('/api/v1/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk()->assertJsonStructure([
            'access_token',
            'token_type',
            'user' => ['id', 'name', 'email', 'role'],
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('id', $user->id)
            ->assertJsonPath('email', $user->email);
    }

    public function test_document_trash_listing_rejects_unlisted_sort(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/documents/trash?sort=password')
            ->assertStatus(422);
    }

    public function test_api_routes_do_not_define_query_closures(): void
    {
        $routes = File::get(base_path('routes/api.php'));

        foreach (['App\\Models', '::query', '::select', '::where', '::all('] as $forbidden) {
            $this->assertStringNotContainsString(
                $forbidden,
                $routes,
                "routes/api.php tidak boleh memakai {$forbidden}; gunakan controller/service."
            );
        }
    }

    public function test_all_application_routes_use_controller_actions_instead_of_closures(): void
    {
        foreach (Route::getRoutes() as $route) {
            // Route bawaan framework (health check dan storage lokal) memang
            // memakai closure dan bukan bagian dari routes/api.php atau web.php.
            if ($route->uri() === 'up' || str_starts_with($route->uri(), 'storage/')) {
                continue;
            }

            $this->assertNotInstanceOf(
                Closure::class,
                $route->getAction('uses'),
                "Route {$route->uri()} masih memakai closure; gunakan controller agar route dapat di-cache."
            );
        }
    }

    private function createProject(): Project
    {
        return Project::create([
            'project_code' => 'PRJ-CONTROLLER-TEST',
            'project_name' => 'Proyek Controller API',
            'client' => 'PT Uji Controller',
            'description' => 'Proyek untuk pengujian controller dan API.',
            'start_date' => '2026-01-01',
            'end_date' => '2027-12-31',
            'status' => 'active',
        ]);
    }

    private function createDocument(Project $project, User $admin): Document
    {
        return Document::create([
            'project_id' => $project->id,
            'document_number' => 'DOC/CONTROLLER/001',
            'document_name' => 'Dokumen Controller API',
            'document_type' => 'contract',
            'partner' => 'PT Uji Controller',
            'document_date' => '2026-01-01',
            'effective_date' => '2026-01-01',
            'expiry_date' => '2027-12-31',
            'status' => 'active',
            'description' => 'Dokumen untuk pengujian controller.',
            'created_by' => $admin->id,
        ]);
    }
}
