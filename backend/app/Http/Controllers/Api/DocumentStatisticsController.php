<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DocumentService;

class DocumentStatisticsController extends Controller
{
    public function __construct(private DocumentService $documentService) {}

    public function __invoke()
    {
        $statistics = $this->documentService->statistics();

        return response()->json([
            'success' => true,
            'data' => [
                'total_arsip' => $statistics['total_arsip'],
                'total_kontrak' => $statistics['total_kontrak'],
                'dokumen_aktif' => $statistics['dokumen_aktif'],
                'inactive' => $statistics['dokumen_inactive'],
                'draft' => $statistics['dokumen_draft'],
                'expired' => $statistics['dokumen_expired'],
                'terminated' => $statistics['dokumen_terminated'],
                'distribution' => [
                    ['name' => 'Active', 'value' => $statistics['dokumen_aktif'], 'color' => '#10b981'],
                    ['name' => 'Inactive', 'value' => $statistics['dokumen_inactive'], 'color' => '#64748b'],
                    ['name' => 'Draft', 'value' => $statistics['dokumen_draft'], 'color' => '#f59e0b'],
                    ['name' => 'Expired', 'value' => $statistics['dokumen_expired'], 'color' => '#f43f5e'],
                    ['name' => 'Terminated', 'value' => $statistics['dokumen_terminated'], 'color' => '#475569'],
                ],
            ],
        ]);
    }
}
