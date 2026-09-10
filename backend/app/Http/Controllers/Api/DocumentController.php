<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentVersion;
use App\Http\Resources\DocumentResource;
use App\Http\Resources\DocumentVersionResource;
use App\Http\Requests\StoreDocumentRequest;
use App\Http\Requests\StoreDocumentVersionRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function statistics()
    {
        $totalArsip = Document::count();
        $dokumenAktif = Document::where('status', 'active')->count();
        $totalKontrak = Document::where('document_type', 'contract')->count();
        $dokumenDraft = Document::where('status', 'draft')->count();
        $dokumenExpired = Document::where('status', 'expired')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_arsip' => $totalArsip,
                'dokumen_aktif' => $dokumenAktif,
                'total_kontrak' => $totalKontrak,
                'draft' => $dokumenDraft,
                'expired' => $dokumenExpired,
            ]
        ]);
    }

    /**
     * Tampilkan daftar seluruh dokumen arsip.
     */
    public function index(Request $request)
    {
        $query = Document::with(['project', 'creator', 'activeVersion']);

        // Logika pencarian berdasarkan nomor dokumen, nama dokumen, atau rekanan
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('document_number', 'like', "%{$search}%")
                  ->orWhere('document_name', 'like', "%{$search}%")
                  ->orWhere('partner', 'like', "%{$search}%");
            });
        }

        // Filter pencarian opsional (status, tipe, dll)
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('document_type')) {
            $query->where('document_type', $request->document_type);
        }

        $documents = $query->latest()->paginate(15);

        return DocumentResource::collection($documents);
    }

    /**
     * Simpan dokumen baru beserta file versi pertamanya (terenkripsi manual AES-256).
     */
    public function store(StoreDocumentRequest $request)
    {
        try {
            DB::beginTransaction();

            // 1. Ambil data yang sudah bersih dan lolos validasi dari StoreDocumentRequest
            $validated = $request->validated();

            // 2. Simpan data utama dokumen
            $document = Document::create([
                'document_number' => $validated['document_number'],
                'document_name'   => $validated['document_name'],
                'document_type'   => $validated['document_type'],
                'partner'         => $validated['partner'],
                'document_date'   => $validated['document_date'],
                'effective_date'  => $validated['effective_date'],
                'expiry_date'     => $validated['expiry_date'],
                'status'          => $validated['status'],
                'description'     => $validated['description'] ?? null,
                'project_id'      => $validated['project_id'] ?? null,
                'created_by'      => $request->user()->id,
            ]);

            // 3. Enkripsi file secara manual (AES-256-CBC) sebelum disimpan ke disk
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

            // 4. Hitung SHA-256 hash dari file asli untuk integritas berkas
            $fileHash = hash_file('sha256', $file->getRealPath());

            // 5. Buat record versi dokumen (v1.0 default)
            DocumentVersion::create([
                'document_id'    => $document->id,
                'version_number' => $validated['version_number'] ?? 'v1.0',
                'file_path'      => $path,
                'file_name'      => $originalName,
                'file_size'      => $file->getSize(),
                'file_hash'      => $fileHash,
                'mime_type'      => $file->getMimeType(),
                'notes'          => $validated['notes'] ?? 'Dokumen awal diunggah.',
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

    /**
     * Tampilkan detail dokumen spesifik beserta versinya.
     */
    public function show(string $id)
    {
        $document = Document::with(['project', 'creator', 'versions.uploader'])->findOrFail($id);
        return new DocumentResource($document);
    }

    /**
     * Perbarui informasi/metadata dokumen.
     */
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
            'expiry_date'     => 'sometimes|required|date|after_or_equal:effective_date',
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

    /**
     * Hapus dokumen beserta seluruh versi berkasnya.
     */
    public function destroy(string $id)
    {
        $document = Document::with('versions')->findOrFail($id);

        try {
            DB::beginTransaction();

            // Hapus file fisik dari storage terenkripsi
            foreach ($document->versions as $version) {
                if (Storage::disk('private_encrypted')->exists($version->file_path)) {
                    Storage::disk('private_encrypted')->delete($version->file_path);
                }
            }

            // Hapus data dari database
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

    /**
     * Tampilkan daftar versi untuk suatu dokumen.
     */
    public function versions(string $id)
    {
        $document = Document::findOrFail($id);
        $versions = $document->versions()->with('uploader')->latest()->get();

        return DocumentVersionResource::collection($versions);
    }

    /**
     * Unggah versi baru / adendum untuk dokumen yang sudah ada (dengan enkripsi manual).
     */
    public function storeVersion(StoreDocumentVersionRequest $request, string $id)
    {
        $document = Document::findOrFail($id);

        $validated = $request->validated();

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

        $version = DocumentVersion::create([
            'document_id'    => $document->id,
            'version_number' => $validated['version_number'],
            'file_path'      => $path,
            'file_name'      => $originalName,
            'file_size'      => $file->getSize(),
            'file_hash'      => $fileHash,
            'mime_type'      => $file->getMimeType(),
            'notes'          => $validated['notes'] ?? null,
            'uploaded_by'    => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Versi baru / adendum dokumen berhasil diunggah dengan enkripsi penuh.',
            'data'    => new DocumentVersionResource($version->load('uploader')),
        ], 201);
    }

    /**
     * Unduh file dokumen dari versi tertentu (secara transparan didekripsi kembali ke PDF).
     */
    public function downloadVersion(string $id, string $versionId)
    {
        $version = DocumentVersion::where('document_id', $id)->findOrFail($versionId);

        if (!Storage::disk('private_encrypted')->exists($version->file_path)) {
            return response()->json(['message' => 'File fisik tidak ditemukan di server.'], 404);
        }

        // Ambil payload terenkripsi dari storage
        $encryptedPayload = base64_decode(Storage::disk('private_encrypted')->get($version->file_path));
        
        $ivLength = openssl_cipher_iv_length('aes-256-cbc');
        $iv = substr($encryptedPayload, 0, $ivLength);
        $encryptedContent = substr($encryptedPayload, $ivLength);

        $encryptionKey = config('app.key');
        if (str_starts_with($encryptionKey, 'base64:')) {
            $encryptionKey = base64_decode(substr($encryptionKey, 7));
        }

        // Dekripsi kembali ke bentuk PDF asli
        $decryptedContent = openssl_decrypt($encryptedContent, 'aes-256-cbc', $encryptionKey, 0, $iv);

        // Kirim file hasil dekripsi ke browser pengguna
        return response()->streamDownload(function () use ($decryptedContent) {
            echo $decryptedContent;
        }, $version->file_name);
    }
}