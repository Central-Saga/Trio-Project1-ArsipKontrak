<?php

use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\DocumentVersionController;
use Illuminate\Support\Facades\Route;

Route::apiResource('documents', DocumentController::class);

// Endpoint Versioning & Secure File Delivery
Route::get('documents/{document}/versions', [DocumentVersionController::class, 'index']);
Route::post('documents/{document}/versions', [DocumentVersionController::class, 'store']);
Route::get('documents/{document}/versions/{version}/download', [DocumentVersionController::class, 'download']);
Route::get('documents/{document}/versions/{version}/preview', [DocumentVersionController::class, 'preview']);