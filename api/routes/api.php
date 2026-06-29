<?php

use App\Http\Controllers\Api\UploadController;
use App\Http\Controllers\Api\VideoController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('/videos', [VideoController::class, 'index']);
Route::get('/videos/{video}', [VideoController::class, 'show']);
Route::get('/videos/{video}/renditions', [VideoController::class, 'renditions']);

Route::middleware(['auth:sanctum'])->group(function (): void {
    Route::get('/me/videos', [VideoController::class, 'mine']);
    Route::get('/videos/{video}/processing-runs', [VideoController::class, 'processingRuns']);

    Route::post('/uploads', [UploadController::class, 'store']);
    Route::get('/uploads/{uploadSession}', [UploadController::class, 'show']);
    Route::put('/uploads/{uploadSession}/parts/{partNumber}', [UploadController::class, 'storePart']);
    Route::post('/uploads/{uploadSession}/parts/{partNumber}', [UploadController::class, 'storePart']);
    Route::post('/uploads/{uploadSession}/complete', [UploadController::class, 'complete']);
    Route::post('/uploads/{uploadSession}/abort', [UploadController::class, 'abort']);
});
