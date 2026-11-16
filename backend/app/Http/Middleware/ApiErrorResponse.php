<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiErrorResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (
            ! $request->is('api/*') ||
            $response->getStatusCode() < 400 ||
            ! $response instanceof JsonResponse
        ) {
            return $response;
        }

        $status = $response->getStatusCode();
        $payload = $response->getData(true);

        if (! is_array($payload)) {
            $payload = [];
        }

        $defaultMessages = [
            400 => 'Permintaan tidak valid.',
            401 => 'Autentikasi gagal atau token tidak valid.',
            403 => 'Aksi tidak diizinkan.',
            404 => 'Sumber daya atau endpoint tidak ditemukan.',
            405 => 'Metode HTTP tidak diizinkan.',
            409 => 'Terjadi konflik data.',
            419 => 'Sesi tidak valid atau telah kedaluwarsa.',
            422 => 'Data yang dikirim tidak valid.',
            429 => 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
        ];

        if ($status >= 500) {
            $message = 'Terjadi kesalahan internal server.';
        } elseif ($status === 422) {
            $message = 'Data yang dikirim tidak valid.';
        } elseif ($status === 429) {
            $message = $defaultMessages[429];
        } else {
            $message = $payload['message']
                ?? $defaultMessages[$status]
                ?? 'Permintaan gagal.';
        }

        $errors = $status === 422
            ? (is_array($payload['errors'] ?? null) ? $payload['errors'] : [])
            : null;

        $response->setData([
            'success' => false,
            'message' => $message,
            'data' => null,
            'errors' => $errors,
        ]);

        return $response;
    }
}
