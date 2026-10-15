<?php

use App\Http\Middleware\ApiErrorResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(ApiErrorResponse::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $isApiRequest = static fn (Request $request): bool =>
            $request->is('api/*') || $request->expectsJson();

        $exceptions->shouldRenderJsonWhen($isApiRequest);

        $exceptions->render(
            function (ValidationException $e, Request $request) use ($isApiRequest) {
                if (! $isApiRequest($request)) {
                    return null;
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Data yang dikirim tidak valid.',
                    'data' => null,
                    'errors' => $e->errors(),
                ], 422);
            }
        );

        $exceptions->render(
            function (AuthenticationException $e, Request $request) use ($isApiRequest) {
                if (! $isApiRequest($request)) {
                    return null;
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Autentikasi gagal atau token tidak valid.',
                    'data' => null,
                    'errors' => null,
                ], 401);
            }
        );

        $exceptions->render(
            function (AuthorizationException $e, Request $request) use ($isApiRequest) {
                if (! $isApiRequest($request)) {
                    return null;
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Aksi tidak diizinkan.',
                    'data' => null,
                    'errors' => null,
                ], 403);
            }
        );

        $exceptions->render(
            function (HttpExceptionInterface $e, Request $request) use ($isApiRequest) {
                if (! $isApiRequest($request)) {
                    return null;
                }

                $status = $e->getStatusCode();

                $message = match ($status) {
                    400 => 'Permintaan tidak valid.',
                    401 => 'Autentikasi gagal atau token tidak valid.',
                    403 => 'Aksi tidak diizinkan.',
                    404 => 'Sumber daya atau endpoint tidak ditemukan.',
                    405 => 'Metode HTTP tidak diizinkan.',
                    409 => 'Terjadi konflik data.',
                    419 => 'Sesi tidak valid atau telah kedaluwarsa.',
                    422 => 'Data yang dikirim tidak valid.',
                    429 => 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
                    default => $status >= 500
                        ? 'Terjadi kesalahan internal server.'
                        : ($e->getMessage() ?: 'Permintaan gagal.'),
                };

                return response()->json([
                    'success' => false,
                    'message' => $message,
                    'data' => null,
                    'errors' => null,
                ], $status, $e->getHeaders());
            }
        );

        $exceptions->render(
            function (\Throwable $e, Request $request) use ($isApiRequest) {
                if (! $isApiRequest($request)) {
                    return null;
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Terjadi kesalahan internal server.',
                    'data' => null,
                    'errors' => null,
                ], 500);
            }
        );
    })->create();
