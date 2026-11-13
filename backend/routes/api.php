<?php

use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\DocumentFileController;
use App\Http\Controllers\Api\DocumentStatisticsController;
use App\Http\Controllers\Api\DocumentTrashController;
use App\Http\Controllers\Api\DocumentVersionController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Bungkus dengan prefix 'v1' agar sesuai standar enterprise
Route::prefix('v1')->group(function () {

    // Auth Public
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

    // Auth Protected (Semua endpoint dokumen, versi, project, notifikasi, dan auth user diproteksi Sanctum)
    Route::middleware('auth:sanctum')->group(function () {
        // Auth User
        Route::get('/me', [AuthController::class, 'me'])->middleware('throttle:120,1');
        Route::get('/user', [AuthController::class, 'me'])->middleware('throttle:120,1');
        Route::post('/logout', [AuthController::class, 'logout'])->middleware('throttle:120,1');

        // Endpoint Dashboard Statistics
        Route::get('/dashboard/statistics', DocumentStatisticsController::class)
            ->middleware('throttle:120,1');

        // Endpoint Dokumen & Arsip
        Route::get('documents/trash', [DocumentTrashController::class, 'index'])
            ->middleware('throttle:120,1');
        Route::post('documents/{id}/restore', [DocumentTrashController::class, 'restore'])
            ->middleware(['throttle:30,1', 'idempotent']);

        // Rute khusus preview & download dokumen dengan proteksi Rate Limiter (Throttle: 30 req/min)
        Route::middleware('throttle:30,1')->group(function () {
            Route::get('documents/{id}/preview', [DocumentFileController::class, 'preview']);
            Route::get('documents/{id}/download', [DocumentFileController::class, 'download']);
        });

        Route::get('documents/{id}/metadata', [DocumentController::class, 'metadata'])
            ->middleware('throttle:60,1');
        Route::apiResource('documents', DocumentController::class)
            ->middleware('throttle:60,1')
            ->middlewareFor('store', 'idempotent');

        Route::get('documents/{document}/versions', [DocumentVersionController::class, 'index'])
            ->middleware('throttle:120,1');
        // Upload versi memakai FormRequest, Policy, dan DocumentVersionResource.
        Route::post('documents/{document}/versions', [DocumentVersionController::class, 'store'])
            ->middleware(['throttle:30,1', 'idempotent']);

        // List Project untuk Dropdown Upload
        Route::get('/projects', [ProjectController::class, 'index'])
            ->middleware('throttle:120,1');

        // Rute log aktivitas untuk admin
        Route::get('/admin/activity-logs', [ActivityLogController::class, 'index'])
            ->middleware('throttle:120,1');

        // --- RUTE BARU: Manajemen Pengguna untuk Admin ---
        Route::get('/admin/users', [UserController::class, 'index'])->middleware('throttle:120,1');
        Route::post('/admin/users', [UserController::class, 'store'])
            ->middleware(['throttle:30,1', 'idempotent']);
        Route::delete('/admin/users/{id}', [UserController::class, 'destroy'])
            ->middleware('throttle:30,1');
        // ------------------------------------------------

        // Rute Notifikasi Pengguna
        Route::get('/notifications', [NotificationController::class, 'index'])
            ->middleware('throttle:120,1');
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])
            ->middleware('throttle:30,1');
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])
            ->middleware('throttle:30,1');
    });
});
