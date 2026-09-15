<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\DocumentVersionController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\NotificationController;
use App\Models\Project;
use Illuminate\Support\Facades\Route;

// Bungkus dengan prefix 'v1' agar sesuai standar enterprise
Route::prefix('v1')->group(function () {
    
    // Auth Public
    Route::post('/login', [AuthController::class, 'login']);

    // Auth Protected (Semua endpoint dokumen, versi, project, notifikasi, dan auth user diproteksi Sanctum)
    Route::middleware('auth:sanctum')->group(function () {
        // Auth User
        Route::get('/me', [AuthController::class, 'me']);
        Route::get('/user', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);

        // Endpoint Dashboard Statistics
        Route::get('/dashboard/statistics', [DocumentController::class, 'statistics']);

        // Endpoint Dokumen & Arsip
        Route::get('documents/trash', [DocumentController::class, 'trashed']);
        Route::post('documents/{id}/restore', [DocumentController::class, 'restore']);

        // Rute khusus preview & download dokumen dengan proteksi Rate Limiter (Throttle: 30 req/min)
        Route::middleware('throttle:30,1')->group(function () {
            Route::get('documents/{id}/preview', [DocumentController::class, 'preview']);
            Route::get('documents/{id}/download', [DocumentController::class, 'download']);
        });

        Route::apiResource('documents', DocumentController::class);
        
        Route::get('documents/{document}/versions', [DocumentVersionController::class, 'index']);
        // Arahkan post versions ke DocumentController karena method storeVersion ada di sana
        Route::post('documents/{document}/versions', [DocumentController::class, 'storeVersion']);

        // List Project untuk Dropdown Upload
        Route::get('/projects', function () {
            return response()->json(Project::select('id', 'project_name', 'project_code')->get());
        });

        // Rute log aktivitas untuk admin
        Route::get('/admin/activity-logs', [ActivityLogController::class, 'index']);

        // Rute Notifikasi Pengguna
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    });
});