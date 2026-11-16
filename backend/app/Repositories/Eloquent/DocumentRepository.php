<?php

namespace App\Repositories\Eloquent;

use App\DTO\DocumentListQueryData;
use App\Models\Document;
use App\Models\User;
use App\Repositories\Contracts\DocumentRepositoryInterface;
use Carbon\CarbonInterface;
use Closure;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class DocumentRepository implements DocumentRepositoryInterface
{
    public function statistics(): array
    {
        $row = Document::query()->selectRaw("
            COUNT(*) AS total_arsip,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS dokumen_aktif,
            SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) AS dokumen_inactive,
            SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS dokumen_draft,
            SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) AS dokumen_expired,
            SUM(CASE WHEN status = 'terminated' THEN 1 ELSE 0 END) AS dokumen_terminated,
            SUM(CASE WHEN document_type = 'contract' THEN 1 ELSE 0 END) AS total_kontrak
        ")->first();

        return [
            'total_arsip' => (int) ($row->total_arsip ?? 0),
            'dokumen_aktif' => (int) ($row->dokumen_aktif ?? 0),
            'dokumen_inactive' => (int) ($row->dokumen_inactive ?? 0),
            'dokumen_draft' => (int) ($row->dokumen_draft ?? 0),
            'dokumen_expired' => (int) ($row->dokumen_expired ?? 0),
            'dokumen_terminated' => (int) ($row->dokumen_terminated ?? 0),
            'total_kontrak' => (int) ($row->total_kontrak ?? 0),
        ];
    }

    public function paginateForUser(?User $user, DocumentListQueryData $query): LengthAwarePaginator
    {
        $builder = Document::query()->with(['project', 'creator', 'activeVersion']);

        if ($user?->role !== 'admin') {
            $builder
                ->whereRaw("LOWER(COALESCE(document_name, '')) NOT LIKE ?", ['%nda%'])
                ->whereRaw("LOWER(COALESCE(document_name, '')) NOT LIKE ?", ['%rahasia%'])
                ->whereRaw("LOWER(COALESCE(description, '')) NOT LIKE ?", ['%nda%'])
                ->whereRaw("LOWER(COALESCE(description, '')) NOT LIKE ?", ['%rahasia%']);
        }

        if ($query->search !== null) {
            $builder->where(function ($inner) use ($query): void {
                $inner->where('document_number', 'like', "%{$query->search}%")
                    ->orWhere('document_name', 'like', "%{$query->search}%")
                    ->orWhere('partner', 'like', "%{$query->search}%");
            });
        }

        if ($query->status !== null) {
            $builder->where('status', $query->status);
        }

        if ($query->documentType !== null) {
            $builder->where('document_type', $query->documentType);
        }

        return $builder
            ->orderBy($query->sort, $query->direction)
            ->paginate($query->perPage);
    }

    public function trashed(DocumentListQueryData $query): Collection
    {
        return Document::onlyTrashed()
            ->with(['project', 'creator', 'activeVersion'])
            ->orderBy($query->sort, $query->direction)
            ->limit($query->perPage)
            ->get();
    }

    public function findOrFail(string $id): Document
    {
        return Document::query()->findOrFail($id);
    }

    public function findWithRelations(string $id, array $relations = []): Document
    {
        return Document::with($relations)->findOrFail($id);
    }

    public function findOnlyTrashed(string $id): Document
    {
        return Document::onlyTrashed()->findOrFail($id);
    }

    public function findForMetadata(string $id): Document
    {
        return Document::query()
            ->select(['id', 'document_name', 'description'])
            ->findOrFail($id);
    }

    public function create(array $attributes): Document
    {
        return Document::create($attributes);
    }

    public function update(Document $document, array $attributes): bool
    {
        return $document->update($attributes);
    }

    public function delete(Document $document): ?bool
    {
        return $document->delete();
    }

    public function restore(Document $document): bool
    {
        return $document->restore();
    }

    public function markExpiredBefore(CarbonInterface $date): int
    {
        return Document::query()
            ->whereNotIn('status', ['terminated', 'expired'])
            ->whereNotNull('expiry_date')
            ->whereDate('expiry_date', '<', $date->toDateString())
            ->update([
                'status' => 'expired',
                'updated_at' => now(),
            ]);
    }

    public function markExpiredForStatuses(array $statuses, CarbonInterface $date): int
    {
        return Document::query()
            ->whereIn('status', $statuses)
            ->whereNotNull('expiry_date')
            ->whereDate('expiry_date', '<', $date->toDateString())
            ->update([
                'status' => 'expired',
                'updated_at' => now(),
            ]);
    }

    public function chunkForExpiryNotifications(int $chunkSize, Closure $callback): void
    {
        Document::query()
            ->select(['id', 'expiry_date', 'created_by'])
            ->whereNotNull('expiry_date')
            ->where('status', '!=', 'terminated')
            ->orderBy('id')
            ->chunkById($chunkSize, $callback);
    }

    public function chunkAll(int $chunkSize, Closure $callback): void
    {
        Document::query()
            ->orderBy('id')
            ->chunkById($chunkSize, $callback);
    }

    public function transaction(Closure $callback): mixed
    {
        return DB::transaction($callback);
    }
}
