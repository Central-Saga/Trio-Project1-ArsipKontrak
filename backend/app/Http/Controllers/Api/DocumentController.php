<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentVersion;
use App\Http\Resources\DocumentResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
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
        $query = Document::with(['project', 'creator', 'activeVersion']);

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

        return DocumentResource::collection($documents);
    }

    public function trashed(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Hanya administrator yang dapat melihat tempat sampah.');
        }

        $documents = Document::onlyTrashed()
            ->with(['project', 'creator', 'activeVersion'])
            ->latest('deleted_at')
            ->get();

        return DocumentResource::collection($documents);
    }

    public function restore(Request $request, string $id)
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Hanya administrator yang dapat memulihkan dokumen.');
        }

        $document = Document::onlyTrashed()->findOrFail($id);
        $document->restore();

        return response()->json([
            'message' => 'Dokumen berhasil dikembalikan.',
            'data' => new DocumentResource($document->load(['project', 'creator', 'versions'])),
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'document_number' => 'required|string|unique:documents,document_number',
                'title'           => 'required|string|max:255',
                'document_type'   => 'required|in:contract,mou,adendum,agreement,supporting',
                'partner'         => 'required|string|max:255',
                'document_date'   => 'required|date',
                'expiry_date'     => 'required|date',
                'description'     => 'nullable|string',
                'project_id'      => 'nullable|integer|exists:projects,id',
                'file'            => 'required|file|mimes:pdf|max:20480',
            ]);

            DB::beginTransaction();

            $document = Document::create([
                'document_number' => $validated['document_number'],
                'document_name'   => $validated['title'],
                'document_type'   => $validated['document_type'],
                'partner'         => $validated['partner'],
                'document_date'   => $validated['document_date'],
                'effective_date'  => $validated['document_date'],
                'expiry_date'     => $validated['expiry_date'],
                'status'          => 'active',
                'description'     => $validated['description'] ?? null,
                'project_id'      => $validated['project_id'] ?? 1,
                'created_by'      => $request->user()->id,
            ]);

            $file = $request->file('file');
            $originalName = $file->getClientOriginalName();
            $fileContent = file_get_contents($file->getRealPath());

            $encryptionKey = config('app.key');
            if (str_starts_with($encryptionKey, 'base64:')) {
                $encryptionKey = base64_decode(substr($encryptionKey, 7));
            }

            $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length('aes-256-cbc'));
            $encryptedContent = openssl_encrypt($fileContent, 'aes-256-cbc', $encryptionKey, 0, $iv);
            $payload = base64_encode($iv . $encryptedContent);

            $path = 'documents/contracts/' . uniqid() . '.enc';
            Storage::disk('private_encrypted')->put($path, $payload);

            $fileHash = hash_file('sha256', $file->getRealPath());

            DocumentVersion::create([
                'document_id'    => $document->id,
                'version_number' => 'v1.0',
                'file_path'      => $path,
                'file_name'      => $originalName,
                'file_size'      => $file->getSize(),
                'file_hash'      => $fileHash,
                'mime_type'      => $file->getMimeType(),
                'encrypted_at'   => now(),
                'is_current'     => true,
                'notes'          => 'Dokumen awal diunggah.',
                'uploaded_by'    => $request->user()->id,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Dokumen kontrak/MoU berhasil diunggah dan diamankan dengan enkripsi penuh.',
                'data'    => new DocumentResource($document->load(['project', 'creator', 'versions'])),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal menyimpan dokumen.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function show(string $id)
    {
        $document = Document::with(['project', 'creator', 'versions.uploader'])->findOrFail($id);

        $user = request()->user();
        if ($user) {
            \App\Models\ActivityLog::record(
                userId: $user->id,
                action: 'VIEW_DOCUMENT',
                description: "Pengguna {$user->name} ({$user->role}) melihat detail dokumen: {$document->document_name}",
                documentId: $document->id
            );
        }

        if ($document->expiry_date && \Carbon\Carbon::parse($document->expiry_date)->isPast() && in_array($document->status, ['active', 'draft'])) {
            $document->status = 'expired';
            $document->save();
            $document->refresh();
        }

        return new DocumentResource($document);
    }

    public function preview(Request $request, string $id)
    {
        try {
            $document = Document::with('versions')->findOrFail($id);
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

            // Sanitasi nama file untuk header Content-Disposition
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
        try {
            $document = Document::with('versions')->findOrFail($id);
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

            // Sanitasi nama file untuk header Content-Disposition
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

    public function storeVersion(Request $request, string $id)
    {
        $document = Document::findOrFail($id);

        $validated = $request->validate([
            'version_number' => 'required|string|max:50',
            'notes'          => 'nullable|string',
            'file'           => 'required|file|mimes:pdf|max:20480',
        ]);

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $fileContent = file_get_contents($file->getRealPath());

        $encryptionKey = config('app.key');
        if (str_starts_with($encryptionKey, 'base64:')) {
            $encryptionKey = base64_decode(substr($encryptionKey, 7));
        }

        $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length('aes-256-cbc'));
        $encryptedContent = openssl_encrypt($fileContent, 'aes-256-cbc', $encryptionKey, 0, $iv);
        $payload = base64_encode($iv . $encryptedContent);

        $path = 'documents/contracts/' . uniqid() . '.enc';
        Storage::disk('private_encrypted')->put($path, $payload);

        $fileHash = hash_file('sha256', $file->getRealPath());

        try {
            DB::beginTransaction();

            // Set versi sebelumnya menjadi non-aktif (is_current = false)
            $document->versions()->update(['is_current' => false]);

            $version = DocumentVersion::create([
                'document_id'    => $document->id,
                'version_number' => $validated['version_number'],
                'file_path'      => $path,
                'file_name'      => $originalName,
                'file_size'      => $file->getSize(),
                'file_hash'      => $fileHash,
                'mime_type'      => $file->getMimeType(),
                'encrypted_at'   => now(),
                'is_current'     => true,
                'notes'          => $validated['notes'] ?? 'Pembaruan versi dokumen.',
                'uploaded_by'    => $request->user()->id,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Versi baru dokumen berhasil diunggah.',
                'data'    => new DocumentResource($document->load(['project', 'creator', 'versions']))
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            // Hapus file fisik jika transaksi database gagal
            if (Storage::disk('private_encrypted')->exists($path)) {
                Storage::disk('private_encrypted')->delete($path);
            }

            return response()->json([
                'message' => 'Gagal mengunggah versi baru.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, string $id)
    {
        $document = Document::findOrFail($id);

        $validated = $request->validate([
            'document_number' => 'sometimes|required|string|unique:documents,document_number,' . $document->id,
            'document_name'   => 'sometimes|required|string|max:255',
            'document_type'   => 'sometimes|required|in:contract,mou,addendum,other',
            'partner'         => 'sometimes|required|string|max:255',
            'document_date'   => 'sometimes|required|date',
            'effective_date'  => 'sometimes|required|date',
            'expiry_date'     => 'sometimes|required|date',
            'status'          => 'sometimes|required|in:draft,active,expired,terminated',
            'description'     => 'nullable|string',
            'project_id'      => 'nullable|exists:projects,id',
        ]);

        $document->update($validated);

        return response()->json([
            'message' => 'Metadata dokumen berhasil diperbarui.',
            'data'    => new DocumentResource($document->load(['project', 'creator']))
        ]);
    }

    public function destroy(Request $request, string $id)
    {
        $document = Document::with('versions')->findOrFail($id);

        if ($document->created_by !== $request->user()->id && $request->user()->role !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized action.'
            ], 403);
        }

        try {
            DB::beginTransaction();

            foreach ($document->versions as $version) {
                if (Storage::disk('private_encrypted')->exists($version->file_path)) {
                    Storage::disk('private_encrypted')->delete($version->file_path);
                }
            }

            $document->delete();

            DB::commit();

            return response()->json([
                'message' => 'Dokumen dan seluruh riwayat versinya berhasil dihapus.'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal menghapus dokumen.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}