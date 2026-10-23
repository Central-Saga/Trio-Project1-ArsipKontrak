<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\Notification;
use App\Models\Project;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationExpiryTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'email' => 'notification-expiry-test@arsipkontrak.local',
            'role' => 'admin',
        ]);

        $this->project = Project::create([
            'project_code' => 'PRJ-NOTIF-TEST',
            'project_name' => 'Project Pengujian Notifikasi',
            'client' => 'Internal Corporate',
            'description' => 'Project untuk pengujian expiry',
            'start_date' => '2026-01-01',
            'end_date' => '2027-12-31',
            'status' => 'active',
        ]);
    }

    public function test_get_notifications_does_not_generate_expiry_notifications(): void
    {
        $this->createDocument(
            'DOC-NOTIF-GET-001',
            Carbon::today()->addDays(5)
        );

        $this->actingAs($this->user)
            ->getJson('/api/v1/notifications')
            ->assertOk()
            ->assertJsonCount(0, 'notifications')
            ->assertJsonPath('unread_count', 0);

        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_expiry_command_generates_notifications_idempotently(): void
    {
        $expiry30 = $this->createDocument(
            'DOC-NOTIF-H30',
            Carbon::today()->addDays(20)
        );

        $expiry7 = $this->createDocument(
            'DOC-NOTIF-H7',
            Carbon::today()->addDays(5)
        );

        $expired = $this->createDocument(
            'DOC-NOTIF-EXPIRED',
            Carbon::today()->subDay()
        );

        $terminated = $this->createDocument(
            'DOC-NOTIF-TERMINATED',
            Carbon::today()->addDays(3),
            'terminated'
        );

        $this->artisan('documents:check-expiry')
            ->assertExitCode(0);

        $this->assertDatabaseHas('notifications', [
            'document_id' => $expiry30->id,
            'recipient_user_id' => $this->user->id,
            'type' => 'expiry_30',
        ]);

        $this->assertDatabaseHas('notifications', [
            'document_id' => $expiry7->id,
            'recipient_user_id' => $this->user->id,
            'type' => 'expiry_7',
        ]);

        $this->assertDatabaseHas('notifications', [
            'document_id' => $expired->id,
            'recipient_user_id' => $this->user->id,
            'type' => 'expired',
        ]);

        $this->assertDatabaseHas('documents', [
            'id' => $expired->id,
            'status' => 'expired',
        ]);

        $this->assertDatabaseMissing('notifications', [
            'document_id' => $terminated->id,
        ]);

        $this->assertDatabaseCount('notifications', 3);

        // Menjalankan ulang command tidak boleh membuat notifikasi ganda.
        $this->artisan('documents:check-expiry')
            ->assertExitCode(0);

        $this->assertDatabaseCount('notifications', 3);
    }

    private function createDocument(
        string $documentNumber,
        Carbon $expiryDate,
        string $status = 'active'
    ): Document {
        return Document::create([
            'project_id' => $this->project->id,
            'document_number' => $documentNumber,
            'document_name' => 'Dokumen ' . $documentNumber,
            'document_type' => 'contract',
            'partner' => 'PT Mitra Pengujian',
            'document_date' => Carbon::today()->subDays(60)->toDateString(),
            'effective_date' => Carbon::today()->subDays(30)->toDateString(),
            'expiry_date' => $expiryDate->toDateString(),
            'status' => $status,
            'description' => 'Dokumen untuk tes notifikasi expiry.',
            'created_by' => $this->user->id,
        ]);
    }
}
