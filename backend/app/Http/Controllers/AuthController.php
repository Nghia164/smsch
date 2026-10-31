<?php

namespace App\Http\Controllers;

use App\Models\TaiKhoan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Đăng nhập hệ thống (dùng chung cho Manager và Staff)
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ], [
            'email.required'    => 'Vui lòng nhập địa chỉ email.',
            'email.email'       => 'Địa chỉ email không đúng định dạng.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
        ]);

        $taiKhoan = TaiKhoan::with('nhanVien')->where('email', $request->email)->first();

        if ($taiKhoan && Hash::check($request->password, $taiKhoan->mat_khau)) {
            if ($taiKhoan->trang_thai === 'LOCKED') {
                return response()->json([
                    'status'  => false,
                    'message' => 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản lý.',
                ], 403);
            }

            if ($taiKhoan->nhanVien && $taiKhoan->nhanVien->trang_thai === 'INACTIVE') {
                return response()->json([
                    'status'  => false,
                    'message' => 'Nhân viên đã nghỉ việc. Không thể đăng nhập vào hệ thống.',
                ], 403);
            }

            // Tạo token Sanctum
            $token = $taiKhoan->createToken('token_auth')->plainTextToken;
            $role = strtoupper($taiKhoan->vai_tro) === 'MANAGER' ? 'manager' : 'staff';
            $nhanVien = $taiKhoan->nhanVien;

            return response()->json([
                'status'  => true,
                'message' => 'Đăng nhập thành công',
                'token'   => $token,
                'user'    => [
                    'id'       => $taiKhoan->tai_khoan_id,
                    'name'     => $nhanVien ? $nhanVien->ho_ten : ($role === 'manager' ? 'Quản lý' : 'Nhân viên'),
                    'ho_ten'   => $nhanVien ? $nhanVien->ho_ten : ($role === 'manager' ? 'Quản lý' : 'Nhân viên'),
                    'email'    => $taiKhoan->email,
                    'role'     => $role,
                    'vai_tro'  => $taiKhoan->vai_tro,
                ],
            ]);
        }

        return response()->json([
            'status'  => false,
            'message' => 'Email hoặc mật khẩu không chính xác',
        ], 401);
    }

    /**
     * Lấy thông tin user hiện tại qua token Sanctum
     */
    public function me(Request $request)
    {
        $taiKhoan = $request->user();

        if (!$taiKhoan) {
            return response()->json([
                'status'  => false,
                'message' => 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn.',
            ], 401);
        }

        if ($taiKhoan->trang_thai === 'LOCKED') {
            if ($taiKhoan->currentAccessToken()) {
                $taiKhoan->currentAccessToken()->delete();
            }
            return response()->json([
                'status'  => false,
                'message' => 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản lý.',
            ], 403);
        }

        if ($taiKhoan->nhanVien && $taiKhoan->nhanVien->trang_thai === 'INACTIVE') {
            if ($taiKhoan->currentAccessToken()) {
                $taiKhoan->currentAccessToken()->delete();
            }
            return response()->json([
                'status'  => false,
                'message' => 'Nhân viên đã nghỉ việc. Không thể truy cập hệ thống.',
            ], 403);
        }

        $role = strtoupper($taiKhoan->vai_tro) === 'MANAGER' ? 'manager' : 'staff';
        $nhanVien = $taiKhoan->nhanVien;

        return response()->json([
            'status' => true,
            'user'   => [
                'id'       => $taiKhoan->tai_khoan_id,
                'name'     => $nhanVien ? $nhanVien->ho_ten : ($role === 'manager' ? 'Quản lý' : 'Nhân viên'),
                'ho_ten'   => $nhanVien ? $nhanVien->ho_ten : ($role === 'manager' ? 'Quản lý' : 'Nhân viên'),
                'email'    => $taiKhoan->email,
                'role'     => $role,
                'vai_tro'  => $taiKhoan->vai_tro,
            ],
        ]);
    }

    /**
     * Đăng xuất - Thu hồi token hiện tại
     */
    public function logout(Request $request)
    {
        $user = $request->user();

        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        return response()->json([
            'status'  => true,
            'message' => 'Đăng xuất thành công',
        ]);
    }
}
