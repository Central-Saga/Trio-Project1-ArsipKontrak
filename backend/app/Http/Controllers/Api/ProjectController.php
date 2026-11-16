<?php

namespace App\Http\Controllers\Api;

use App\DTO\ProjectListQueryData;
use App\Http\Controllers\Controller;
use App\Http\Requests\IndexProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Services\ProjectService;

class ProjectController extends Controller
{
    public function __construct(private ProjectService $projectService) {}

    public function index(IndexProjectRequest $request)
    {
        $projects = $this->projectService->dropdown(
            ProjectListQueryData::fromValidated($request->validated())
        );

        return response()->json(
            ProjectResource::collection($projects)->resolve($request)
        );
    }
}
