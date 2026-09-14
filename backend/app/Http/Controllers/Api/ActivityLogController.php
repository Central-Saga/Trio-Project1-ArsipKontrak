<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        // Pastikan hanya admin yang bisa mengakses daftar log
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'message' => 'Hanya administrator yang dapat melihat log aktivitas.'
            ], 403);
        }

        $logs = ActivityLog::with(['user', 'document'])
            ->latest('created_at')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }
}