<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDocumentRequest;
use App\Http\Requests\UpdateDocumentRequest;
use App\Models\Document;
use App\Models\DocumentVersion;
use App\Http\Resources\DocumentResource;
use App\Http\Resources\DocumentVersionResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class DocumentController extends Controller
{
    /**
     * Fungsi bantu untuk menentukan status otomatis berdasarkan tanggal atau pilihan manual.
     */
    private function determineStatus($startDate, $expiryDate, $currentStatus = null)
    {
        // Jika status sudah ditentukan secara manual (expired, terminated, draft, active), hargai pilihan tersebut
        if ($currentStatus && in_array(strtolower($currentStatus), ['expired', 'terminated', 'draft', 'active'])) {
            return strtolower($currentStatus);
        }

        $today = Carbon::today();
        $start = $startDate ? Carbon::parse($startDate)->startOfDay() : null;
        $expiry = $expiryDate ? Carbon::parse($expiryDate)->startOfDay() : null;

        // 1. Jika tanggal mulai masih di masa depan -> Draft / Upcoming
        if ($start && $start->greaterThan($today)) {
            return 'draft';
        }

        // 2. Jika tanggal kedaluwarsa sudah terlewati -> Expired
        if ($expiry && $expiry->lessThan($today)) {
            return 'expired';
        }

        // 3. Jika sedang berjalan -> Active
        return 'active';
    }

    public function statistics()
    {
        $totalArsip = Document::count();
        $dokumenAktif = Document::where('status', 'active')->count();
        $dokumenInactive = Document::where('status', 'inactive')->count();
        $dokumenDraft = Document::where('status', 'draft')->count();
        $dokumenExpired = Document::where('status', 'expired')->count();
        $dokumenTerminated = Document::where('status', 'terminated')->count();
        $totalKontrak = Document::where('document_type', 'contract')->count();

        $statusDistribution = [
            ['name' => 'Active', 'value' => $dokumenAktif, 'color' => '#10b981'],
            ['name' => 'Inactive', 'value' => $dokumenInactive, 'color' => '#64748b'],
            ['name' => 'Draft', 'value' => $dokumenDraft, 'color' => '#f59e0b'],
            ['name' => 'Expired', 'value' => $dokumenExpired, 'color' => '#f43f5e'],
            ['name' => 'Terminated', 'value' => $dokumenTerminated, 'color' => '#475569'],
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'total_arsip' => $totalArsip,
                'total_kontrak' => $totalKontrak,
                'dokumen_aktif' => $dokumenAktif,
                'inactive' => $dokumenInactive,
                'draft' => $dokumenDraft,
                'expired' => $dokumenExpired,
                'terminated' => $dokumenTerminated,
                'distribution' => $statusDistribution,
            ]
        ]);
    }

    public function index(Request $request)
    {
        Gate::authorize('viewAny', Document::class);

        $query = Document::with(['project', 'creator', 'activeVersion']);

        if ($request->user()->role !== 'admin') {
            $query
                ->whereRaw("LOWER(COALESCE(document_name, '')) NOT LIKE ?", ['%nda%'])
                ->whereRaw("LOWER(COALESCE(document_name, '')) NOT LIKE ?", ['%rahasia%'])
                ->whereRaw("LOWER(COALESCE(description, '')) NOT LIKE ?", ['%nda%'])
                ->whereRaw("LOWER(COALESCE(description, '')) NOT LIKE ?", ['%rahasia%']);
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('document_number', 'like', "%{$search}%")
                  ->orWhere('document_name', 'like', "%{$search}%")
                  ->orWhere('partner', 'like', "%{$search}%");
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('document_type')) {
            $query->where('document_type', $request->document_type);
        }

        $documents = $query->latest()->paginate(15);

        return DocumentResource::collection($documents)->additional([
            'success' => true,
            'message' => 'Daftar dokumen berhasil diambil.',
        ]);
    }

    public function trashed(Request $request)
    {
        Gate::authorize('viewTrash', Document::class);

        $documents = Document::onlyTrashed()
            ->with(['project', 'creator', 'activeVersion'])
            ->latest('deleted_at')
            ->get();

        return DocumentResource::collection($documents);
    }

    public function restore(Request $request, string $id)
    {
        $document = Document::onlyTrashed()->findOrFail($id);
        Gate::authorize('restore', $document);

        $document->restore();

        return response()->json([
            'success' => true,
            'message' => 'Dokumen berhasil dikembalikan.',
            'data' => new DocumentResource(
                $document->load(['project', 'creator', 'versions'])
            ),
        ]);
    }


    public function store(StoreDocumentRequest $request)
    {
        $validated = $request->validated();

        Gate::authorize('create', Document::class);

        $file = $request->file('file');
        $path = null;

        try {
            $document = DB::transaction(function () use (
                $validated, $request, $file, &$path
            ) {
                $effectiveDate = $validated['effective_date']
                    ?? $validated['document_date'];

                $status = $this->determineStatus(
                    $effectiveDate,
                    $validated['expiry_date'],
                    $validated['status'] ?? null
                );

                $document = Document::create([
                    'document_number' => $validated['document_number'],
                    'document_name' => $validated['document_name'],
                    'document_type' => $validated['document_type'],
                    'partner' => $validated['partner'],
                    'document_date' => $validated['document_date'],
                    'effective_date' => $effectiveDate,
                    'expiry_date' => $validated['expiry_date'],
                    'status' => $status,
                    'description' => $validated['description'] ?? null,
                    'project_id' => $validated['project_id'],
                    'created_by' => $request->user()->id,
                ]);

                $content = file_get_contents($file->getRealPath());
                if ($content === false) {
                    throw new \RuntimeException('File tidak dapat dibaca.');
                }

                $key = config('app.key');
                if (str_starts_with($key, 'base64:')) {
                    $key = base64_decode(substr($key, 7), true);
                }

                if ($key === false || $key === '') {
                    throw new \RuntimeException('Kunci enkripsi aplikasi tidak valid.');
                }

                $iv = random_bytes(openssl_cipher_iv_length('aes-256-cbc'));
                $encrypted = openssl_encrypt(
                    $content,
                    'aes-256-cbc',
                    $key,
                    0,
                    $iv
                );

                if ($encrypted === false) {
                    throw new \RuntimeException('Enkripsi file gagal.');
                }

                $payload = base64_encode($iv . $encrypted);
                $path = 'documents/contracts/' . bin2hex(random_bytes(16)) . '.enc';

                if (! Storage::disk('private_encrypted')->put($path, $payload)) {
                    throw new \RuntimeException('File terenkripsi gagal disimpan.');
                }

                $hash = hash_file('sha256', $file->getRealPath());
                if ($hash === false) {
                    throw new \RuntimeException('Hash SHA-256 gagal dihitung.');
                }

                DocumentVersion::create([
                    'document_id' => $document->id,
                    'version_number' => 'v1.0',
                    'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(),
                    'file_size' => $file->getSize(),
                    'file_hash' => $hash,
                    'mime_type' => $file->getMimeType(),
                    'encrypted_at' => now(),
                    'is_current' => true,
                    'notes' => $validated['notes'] ?? 'Dokumen awal diunggah.',
                    'uploaded_by' => $request->user()->id,
                ]);

                return $document;
            });

            return response()->json([
                'success' => true,
                'message' => 'Dokumen berhasil diunggah dan dienkripsi.',
                'data' => new DocumentResource(
                    $document->load(['project', 'creator', 'versions.uploader'])
                ),
            ], 201);
        } catch (\Throwable $e) {
            // Rollback database ditangani otomatis oleh DB::transaction().
            // File bukan bagian dari transaksi database, jadi bersihkan secara manual.
            if ($path && Storage::disk('private_encrypted')->exists($path)) {
                Storage::disk('private_encrypted')->delete($path);
            }

            report($e);

            if (app()->environment('testing')) {
                throw $e;
            }

            return response()->json([
                'message' => 'Gagal menyimpan dokumen.',
            ], 500);
        }
    }


    public function show(string $id)
    {
        $document = Document::with([
            'project',
            'creator',
            'versions.uploader',
        ])->findOrFail($id);

        // Pastikan policy dokumen benar-benar diberlakukan.
        Gate::authorize('view', $document);

        $user = request()->user();

        if ($user) {
            \App\Models\ActivityLog::record(
                userId: $user->id,
                action: 'VIEW_DOCUMENT',
                description: "Pengguna {$user->name} ({$user->role}) melihat detail dokumen: {$document->document_name}",
                documentId: $document->id
            );
        }

        if (
            $document->expiry_date
            && Carbon::parse($document->expiry_date)->isPast()
            && in_array($document->status, ['active', 'draft'], true)
        ) {
            $document->status = 'expired';
            $document->save();
            $document->refresh();
            $document->load(['project', 'creator', 'versions.uploader']);
        }

        return new DocumentResource($document);
    }

    /**
     * Metadata minimum untuk judul halaman frontend.
     * Tetap menggunakan policy dan tidak mencatat VIEW_DOCUMENT.
     */
    public function metadata(string $id)
    {
        $document = Document::query()
            ->select(['id', 'document_name', 'description'])
            ->findOrFail($id);

        Gate::authorize('view', $document);

        return response()->json([
            'success' => true,
            'data' => [
                'document_name' => $document->document_name,
            ],
        ], 200, [
            'Cache-Control' => 'no-store, private',
        ]);
    }

    public function preview(Request $request, string $id)
    {
        $document = Document::with('versions')->findOrFail($id);
        Gate::authorize('view', $document);

        try {
            
            $user = $request->user();
            if ($user) {
                \App\Models\ActivityLog::record(
                    userId: $user->id,
                    action: 'PREVIEW_PDF',
                    description: "Pengguna {$user->name} ({$user->role}) membuka pratinjau dokumen: {$document->document_name}",
                    documentId: $document->id
                );
            }

            $versionId = $request->query('version_id');
            
            $version = $versionId 
                ? $document->versions()->where('id', $versionId)->firstOrFail() 
                : $document->versions()->where('is_current', true)->first() ?? $document->versions()->latest()->first();

            if (!$version || !Storage::disk('private_encrypted')->exists($version->file_path)) {
                return response()->json(['message' => 'Berkas fisik tidak ditemukan.'], 404);
            }

            $payload = Storage::disk('private_encrypted')->get($version->file_path);
            
            $encryptionKey = config('app.key');
            if (str_starts_with($encryptionKey, 'base64:')) {
                $encryptionKey = base64_decode(substr($encryptionKey, 7));
            }

            $decodedPayload = base64_decode($payload);
            $ivLength = openssl_cipher_iv_length('aes-256-cbc');
            $iv = substr($decodedPayload, 0, $ivLength);
            $encryptedContent = substr($decodedPayload, $ivLength);

            $decryptedContent = openssl_decrypt($encryptedContent, 'aes-256-cbc', $encryptionKey, 0, $iv);

            if ($decryptedContent === false) {
                return response()->json(['message' => 'Gagal mendekripsi berkas PDF.'], 500);
            }

            $safeFilename = preg_replace('/[\r\n\t[:cntrl:]]+/', '', basename($version->file_name));

            return response($decryptedContent, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . addslashes($safeFilename) . '"',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal memuat pratinjau: ' . $e->getMessage()
            ], 500);
        }
    }

    public function download(Request $request, string $id)
    {
        $document = Document::with('versions')->findOrFail($id);
        Gate::authorize('download', $document);

        try {
            $user = $request->user();

            if ($user) {
                \App\Models\ActivityLog::record(
                    userId: $user->id,
                    action: 'DOWNLOAD_DOCUMENT',
                    description: "Administrator {$user->name} mengunduh berkas dokumen: {$document->document_name}",
                    documentId: $document->id
                );
            }

            $versionId = $request->query('version_id');
            
            $version = $versionId 
                ? $document->versions()->where('id', $versionId)->firstOrFail() 
                : $document->versions()->where('is_current', true)->first() ?? $document->versions()->latest()->first();

            if (!$version || !Storage::disk('private_encrypted')->exists($version->file_path)) {
                return response()->json(['message' => 'Berkas fisik tidak ditemukan.'], 404);
            }

            $payload = Storage::disk('private_encrypted')->get($version->file_path);
            
            $encryptionKey = config('app.key');
            if (str_starts_with($encryptionKey, 'base64:')) {
                $encryptionKey = base64_decode(substr($encryptionKey, 7));
            }

            $decodedPayload = base64_decode($payload);
            $ivLength = openssl_cipher_iv_length('aes-256-cbc');
            $iv = substr($decodedPayload, 0, $ivLength);
            $encryptedContent = substr($decodedPayload, $ivLength);

            $decryptedContent = openssl_decrypt($encryptedContent, 'aes-256-cbc', $encryptionKey, 0, $iv);

            if ($decryptedContent === false) {
                return response()->json(['message' => 'Gagal mendekripsi berkas PDF.'], 500);
            }

            $safeFilename = preg_replace('/[\r\n\t[:cntrl:]]+/', '', basename($version->file_name));

            return response($decryptedContent, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="' . addslashes($safeFilename) . '"',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengunduh: ' . $e->getMessage()
            ], 500);
        }
    }


    public function update(UpdateDocumentRequest $request, string $id)
    {
        $document = Document::findOrFail($id);
        Gate::authorize('update', $document);

        $validated = $request->validated();

        $startDate = $validated['document_date'] ?? $validated['effective_date'] ?? $document->document_date;
        $expiryDate = $validated['expiry_date'] ?? $document->expiry_date;
        
        // Ambil status manual yang dikirim dari form edit
        $requestedStatus = $validated['status'] ?? $request->input('status') ?? $document->status;
        
        // Evaluasi status dengan memprioritaskan pilihan manual pengguna saat update
        $validated['status'] = $this->determineStatus($startDate, $expiryDate, $requestedStatus);

        $document->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Metadata dokumen berhasil diperbarui.',
            'data' => new DocumentResource($document->load(['project', 'creator'])),
        ]);
    }


    public function destroy(Request $request, string $id)
    {
        $document = Document::with('versions')->findOrFail($id);

        Gate::authorize('delete', $document);

        try {
            DB::transaction(function () use ($document) {
                // Soft delete tidak menghapus file fisik atau riwayat versi.
                $document->delete();
            });

            return response()->json([
                'success' => true,
                'message' => 'Dokumen dipindahkan ke tempat sampah; file fisik dan riwayat versinya dipertahankan.',
                'data' => null,
            ]);
        } catch (\Throwable $e) {
            report($e);

            if (app()->environment('testing')) {
                throw $e;
            }

            return response()->json([
                'message' => 'Gagal menghapus dokumen.',
            ], 500);
        }
    }
}