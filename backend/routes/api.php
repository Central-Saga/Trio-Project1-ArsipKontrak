<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\DocumentVersionController;
use App\Models\Project;
use Illuminate\Support\Facades\Route;

// Bungkus dengan prefix 'v1' agar sesuai standar enterprise
Route::prefix('v1')->group(function () {
    
    // Auth Public
    Route::post('/login', [AuthController::class, 'login']);

    // Auth Protected (Semua endpoint dokumen, versi, project, dan auth user diproteksi Sanctum)
    Route::middleware('auth:sanctum')->group(function () {
        // Auth User
        Route::get('/me', [AuthController::class, 'me']);
        Route::get('/user', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);

        // Endpoint Dashboard Statistics
        Route::get('/dashboard/statistics', [DocumentController::class, 'statistics']);

        // Endpoint Dokumen & Arsip
        Route::apiResource('documents', DocumentController::class);
        Route::get('documents/{document}/versions', [DocumentVersionController::class, 'index']);
        Route::post('documents/{document}/versions', [DocumentVersionController::class, 'store']);
        Route::get('documents/{document}/versions/{version}/download', [DocumentVersionController::class, 'download']);
        Route::get('documents/{document}/versions/{version}/preview', [DocumentVersionController::class, 'preview']);

        // List Project untuk Dropdown Upload
        Route::get('/projects', function () {
            return response()->json(Project::select('id', 'project_name', 'project_code')->get());
        });
    });
});