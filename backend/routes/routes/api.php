<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\NhanVienController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CaMauController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ==========================================
// 1. CÁC ROUTE CÔNG KHAI (Không cần Token)
// ==========================================
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/admin/login', [AuthController::class, 'login']);

// ==========================================
// 2. CÁC ROUTE YÊU CẦU XÁC THỰC (Sanctum Token)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {
    // Thông tin người dùng hiện tại
    Route::get('/user', [AuthController::class, 'me']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Đăng xuất thu hồi token
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // ==========================================
    // 3. CÁC ROUTE NGHIỆP VỤ CHO MANAGER 
    // ==========================================
    Route::middleware('role:MANAGER')->group(function () {
        // --- A. QUẢN LÝ NHÂN VIÊN ---
        // Chuẩn Action-based
        Route::prefix('admin')->group(function () {
            Route::get('/nhan-vien/data', [NhanVienController::class, 'getDataNhanVien']);
            Route::post('/nhan-vien/search', [NhanVienController::class, 'searchNhanVien']);
            Route::post('/nhan-vien/create', [NhanVienController::class, 'storeNhanVien']);
            Route::post('/nhan-vien/delete', [NhanVienController::class, 'destroyNhanVien']);
            Route::post('/nhan-vien/update', [NhanVienController::class, 'updateNhanVien']);
            Route::post('/nhan-vien/change-status', [NhanVienController::class, 'changeStatusNhanVien']);
            Route::get('/nhan-vien/future-shifts/{id}', [NhanVienController::class, 'getFutureShifts']);
            Route::get('/role-tag/data', [NhanVienController::class, 'getDataRoleTag']);

            // Quản lý Ca mẫu (Chuẩn Action-based)
            Route::get('/ca-mau/data', [CaMauController::class, 'index']);
            Route::post('/ca-mau/search', [CaMauController::class, 'index']);
            Route::post('/ca-mau/create', [CaMauController::class, 'store']);
            Route::get('/ca-mau/detail/{id}', [CaMauController::class, 'show']);
            Route::post('/ca-mau/update', [CaMauController::class, 'update']);
            Route::post('/ca-mau/change-status', [CaMauController::class, 'changeStatus']);
            Route::post('/ca-mau/delete', [CaMauController::class, 'destroy']);
        });

        // Chuẩn RESTful cho Nhân viên
        Route::get('/employees', [NhanVienController::class, 'getDataNhanVien']);
        Route::post('/employees', [NhanVienController::class, 'storeNhanVien']);
        Route::put('/employees/{id}', [NhanVienController::class, 'updateNhanVien']);
        Route::patch('/employees/{id}/lock', [NhanVienController::class, 'changeStatusNhanVien']);
        Route::delete('/employees/{id}', [NhanVienController::class, 'destroyNhanVien']);

        // --- B. QUẢN LÝ DANH MỤC CA (Chuẩn RESTful) ---
        Route::get('/shifts', [CaMauController::class, 'index']);
        Route::post('/shifts', [CaMauController::class, 'store']);
        Route::get('/shifts/{id}', [CaMauController::class, 'show']);
        Route::put('/shifts/{id}', [CaMauController::class, 'update']);
        Route::patch('/shifts/{id}', [CaMauController::class, 'update']);
        Route::patch('/shifts/{id}/status', [CaMauController::class, 'changeStatus']);
        Route::delete('/shifts/{id}', [CaMauController::class, 'destroy']);

        // Alias tương đương cho /ca-mau
        Route::get('/ca-mau', [CaMauController::class, 'index']);
        Route::post('/ca-mau', [CaMauController::class, 'store']);
        Route::get('/ca-mau/{id}', [CaMauController::class, 'show']);
        Route::put('/ca-mau/{id}', [CaMauController::class, 'update']);
        Route::delete('/ca-mau/{id}', [CaMauController::class, 'destroy']);

        // --- C. HỖ TRỢ TƯƠNG THÍCH MÀN HÌNH "CA & RÀNG BUỘC" (/shift-config) ---
        Route::get('/shift-config', [CaMauController::class, 'getShiftConfig']);
        Route::put('/shift-config', [CaMauController::class, 'saveShiftConfig']);
        Route::post('/shift-config', [CaMauController::class, 'saveShiftConfig']);
    });
});
