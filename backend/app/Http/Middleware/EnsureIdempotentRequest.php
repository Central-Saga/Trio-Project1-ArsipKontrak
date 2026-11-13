<?php

namespace App\Http\Middleware;

use App\Models\IdempotencyKey;
use Closure;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Symfony\Component\HttpFoundation\Response;

/**
 * Menjamin mutasi kritikal hanya memiliki satu efek walaupun request
 * dikirim ulang.
 *
 * Klien dapat mengirim header `Idempotency-Key`. Jika header tidak ada,
 * middleware membuat kunci deterministik dari payload request sehingga
 * pengiriman ulang tanpa header tetap aman.
 */
class EnsureIdempotentRequest
{
    private const TTL_HOURS = 24;

    private const LOCK_MINUTES = 5;

    private const MAX_KEY_LENGTH = 191;

    public function handle(Request $request, Closure $next): Response
    {
        if (! in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return $next($request);
        }

        $userId = $request->user()?->getAuthIdentifier();

        if ($userId === null) {
            return $next($request);
        }

        $requestHash = $this->requestFingerprint($request);
        $scope = hash('sha256', $userId.'|'.$request->method().'|'.$request->path());
        $key = $this->resolveKey($request, $requestHash);

        if ($key === null) {
            return $this->error(
                'Header Idempotency-Key maksimal '.self::MAX_KEY_LENGTH.' karakter.',
                422
            );
        }

        IdempotencyKey::query()
            ->where('expires_at', '<', now())
            ->delete();

        $existing = IdempotencyKey::query()
            ->where('scope', $scope)
            ->where('key', $key)
            ->first();

        if ($existing !== null) {
            $replay = $this->replayableResponse($existing, $requestHash);

            if ($replay !== null) {
                return $replay;
            }
        }

        $record = $this->startRecord($scope, $key, (int) $userId, $requestHash);

        if ($record === null) {
            // Request lain memenangkan race insert. Putuskan berdasarkan
            // record yang sudah tersimpan.
            $existing = IdempotencyKey::query()
                ->where('scope', $scope)
                ->where('key', $key)
                ->first();

            if ($existing === null) {
                return $this->error('Gagal memproses idempotency key.', 500);
            }

            return $this->replayableResponse($existing, $requestHash)
                ?? $this->error(
                    'Permintaan dengan idempotency key yang sama sedang diproses.',
                    409
                );
        }

        try {
            $response = $next($request);
        } catch (\Throwable $e) {
            // Jangan simpan kegagalan sebagai hasil final supaya klien bisa
            // mencoba ulang dengan key yang sama.
            $record->delete();

            throw $e;
        }

        if ($response->getStatusCode() >= 500) {
            $record->delete();

            return $response;
        }

        $this->storeResponse($record, $response);

        return $response;
    }

    private function resolveKey(Request $request, string $requestHash): ?string
    {
        $provided = $request->header('Idempotency-Key');

        if (is_string($provided) && trim($provided) !== '') {
            $provided = trim($provided);

            if (strlen($provided) > self::MAX_KEY_LENGTH) {
                return null;
            }

            return 'client:'.$provided;
        }

        return 'auto:'.$requestHash;
    }

    private function replayableResponse(IdempotencyKey $record, string $requestHash): ?Response
    {
        if (! hash_equals($record->request_hash, $requestHash)) {
            return $this->error(
                'Idempotency key sudah dipakai untuk payload yang berbeda.',
                409
            );
        }

        if ($record->status === 'processing') {
            $updatedAt = $record->updated_at;

            if ($updatedAt !== null && $updatedAt->gt(now()->subMinutes(self::LOCK_MINUTES))) {
                return $this->error(
                    'Permintaan dengan idempotency key yang sama sedang diproses.',
                    409
                );
            }

            $record->delete();

            return null;
        }

        if (
            $record->status === 'completed'
            && $record->expires_at !== null
            && $record->expires_at->isFuture()
        ) {
            return $this->replay($record);
        }

        $record->delete();

        return null;
    }

    private function startRecord(
        string $scope,
        string $key,
        int $userId,
        string $requestHash
    ): ?IdempotencyKey {
        try {
            return IdempotencyKey::create([
                'user_id' => $userId,
                'scope' => $scope,
                'key' => $key,
                'request_hash' => $requestHash,
                'status' => 'processing',
                'expires_at' => now()->addHours(self::TTL_HOURS),
            ]);
        } catch (QueryException $e) {
            if ($this->isUniqueViolation($e)) {
                return null;
            }

            throw $e;
        }
    }

    private function storeResponse(IdempotencyKey $record, Response $response): void
    {
        $body = $response->getContent();
        $headers = [];

        foreach (['Content-Type', 'Location'] as $header) {
            if ($response->headers->has($header)) {
                $headers[$header] = $response->headers->all($header);
            }
        }

        $record->forceFill([
            'status' => 'completed',
            'response_status' => $response->getStatusCode(),
            'response_body' => $body === false ? null : $body,
            'response_headers' => $headers,
            'expires_at' => now()->addHours(self::TTL_HOURS),
        ])->save();
    }

    private function replay(IdempotencyKey $record): Response
    {
        $headers = is_array($record->response_headers) ? $record->response_headers : [];
        $headers['Idempotency-Replayed'] = 'true';

        $status = (int) ($record->response_status ?? 200);
        $body = $record->response_body;
        $contentType = $headers['Content-Type'][0] ?? '';

        if (is_string($body) && str_contains(strtolower((string) $contentType), 'json')) {
            $decoded = json_decode($body, true);

            if (is_array($decoded)) {
                return response()->json($decoded, $status, $headers);
            }
        }

        return response($body ?? '', $status, $headers);
    }

    private function error(string $message, int $status): Response
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => null,
            'errors' => null,
        ], $status);
    }

    private function isUniqueViolation(QueryException $e): bool
    {
        return in_array((string) $e->getCode(), ['23000', '23505'], true)
            || str_contains($e->getMessage(), 'idempotency_keys_scope_key_unique');
    }

    private function requestFingerprint(Request $request): string
    {
        $payload = [
            'method' => $request->method(),
            'path' => $request->path(),
            'input' => $this->normalize($request->input()),
            'files' => $this->fileFingerprints($request->allFiles()),
        ];

        $encoded = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return hash('sha256', $encoded === false ? serialize($payload) : $encoded);
    }

    private function normalize(mixed $value): mixed
    {
        if (! is_array($value)) {
            if ($value instanceof \Stringable) {
                return (string) $value;
            }

            if (is_object($value)) {
                return get_object_vars($value);
            }

            return $value;
        }

        $normalized = [];

        foreach ($value as $key => $item) {
            $normalized[$key] = $this->normalize($item);
        }

        ksort($normalized);

        return $normalized;
    }

    /**
     * @param  array<string, mixed>  $files
     * @return array<string, array<string, mixed>>
     */
    private function fileFingerprints(array $files, string $prefix = ''): array
    {
        $fingerprints = [];

        foreach ($files as $key => $file) {
            $path = $prefix === '' ? (string) $key : $prefix.'.'.$key;

            if (is_array($file)) {
                $fingerprints += $this->fileFingerprints($file, $path);

                continue;
            }

            if (! $file instanceof UploadedFile) {
                continue;
            }

            $realPath = $file->getRealPath();

            $fingerprints[$path] = [
                'name' => $file->getClientOriginalName(),
                'size' => (int) $file->getSize(),
                'mime' => (string) ($file->getMimeType() ?? ''),
                'hash' => is_string($realPath)
                    ? (hash_file('sha256', $realPath) ?: null)
                    : null,
            ];
        }

        ksort($fingerprints);

        return $fingerprints;
    }
}
