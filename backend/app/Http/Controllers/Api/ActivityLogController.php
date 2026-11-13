<?php

namespace App\Http\Controllers\Api;

use App\DTO\ActivityLogListQueryData;
use App\Http\Controllers\Controller;
use App\Http\Requests\IndexActivityLogRequest;
use App\Http\Resources\ActivityLogResource;
use App\Services\ActivityLogService;

class ActivityLogController extends Controller
{
    public function __construct(private ActivityLogService $activityLogService) {}

    public function index(IndexActivityLogRequest $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya administrator yang dapat melihat log aktivitas.',
                'data' => null,
                'errors' => null,
            ], 403);
        }

        $logs = $this->activityLogService->listLogs(
            ActivityLogListQueryData::fromValidated($request->validated())
        );

        return response()->json([
            'success' => true,
            'data' => ActivityLogResource::collection(
                $logs->items()
            )->resolve($request),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }
}
