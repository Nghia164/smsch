<?php

namespace App\Http\Controllers;

use App\Http\Requests\Admin\CreateNhanVienRequest;
use App\Http\Requests\Admin\UpdateNhanVienRequest;
use App\Models\NhanVien;
use App\Models\RoleTag;
use App\Models\TaiKhoan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class NhanVienController extends Controller
{
    /**
     * Lấy danh sách toàn bộ nhân viên kèm thông tin vai trò và tài khoản
     */
    public function getDataNhanVien()
    {
        try {
            $data = DB::table('nhan_viens')
                ->leftJoin('role_tags', 'nhan_viens.role_tag_id', '=', 'role_tags.role_tag_id')
                ->leftJoin('tai_khoans', 'nhan_viens.tai_khoan_id', '=', 'tai_khoans.tai_khoan_id')
                ->select(
                    'nhan_viens.nhan_vien_id',
                    'nhan_viens.ho_ten',
                    'nhan_viens.so_dien_thoai',
                    'nhan_viens.ngay_sinh',
                    'nhan_viens.loai_hop_dong',
                    'nhan_viens.muc_luong_gio',
                    'nhan_viens.trang_thai as trang_thai_nhan_vien',
                    'nhan_viens.hinh_anh',
                    'nhan_viens.role_tag_id',
                    'role_tags.ten_role',
                    'tai_khoans.tai_khoan_id',
                    'tai_khoans.email',
                    'tai_khoans.vai_tro',
                    'tai_khoans.trang_thai as trang_thai_tai_khoan'
                )
                ->orderBy('nhan_viens.nhan_vien_id', 'desc')
                ->get();

            // Format dữ liệu hỗ trợ cả chuẩn API và chuẩn Frontend
            $formatted = $data->map(function ($item) {
                $contractDisplay = match ($item->loai_hop_dong) {
                    'FULL_TIME' => 'Toàn thời gian',
                    'PART_TIME' => 'Bán thời gian',
                    default     => $item->loai_hop_dong,
                };

                $statusDisplay = match ($item->trang_thai_nhan_vien) {
                    'ACTIVE'   => 'Đang làm việc',
                    'LOCKED', 'INACTIVE' => 'Nghỉ việc',
                    default    => $item->trang_thai_nhan_vien,
                };

                return [
                    'id'            => 'NV' . str_pad($item->nhan_vien_id, 3, '0', STR_PAD_LEFT),
                    'raw_id'        => $item->nhan_vien_id,
                    'nhan_vien_id'  => $item->nhan_vien_id,
                    'name'          => $item->ho_ten,
                    'ho_ten'        => $item->ho_ten,
                    'phone'         => $item->so_dien_thoai,
                    'so_dien_thoai' => $item->so_dien_thoai,
                    'birthDate'     => $item->ngay_sinh,
                    'ngay_sinh'     => $item->ngay_sinh,
                    'contract'      => $contractDisplay,
                    'loai_hop_dong' => $item->loai_hop_dong,
                    'hourlyWage'    => (int) $item->muc_luong_gio,
                    'muc_luong_gio' => (int) $item->muc_luong_gio,
                    'role'          => $item->ten_role ?? 'Phục vụ',
                    'roleTag'       => $item->ten_role ?? 'Waiter',
                    'role_tag_id'   => $item->role_tag_id,
                    'status'        => $statusDisplay,
                    'trang_thai'    => $item->trang_thai_nhan_vien,
                    'avatar'        => $item->hinh_anh,
                    'hinh_anh'      => $item->hinh_anh,
                    'account'       => $item->email ? [
                        'email'    => $item->email,
                        'status'   => strtolower($item->trang_thai_tai_khoan ?? 'active'),
                    ] : null,
                ];
            });

            return response()->json([
                'status'  => true,
                'message' => 'Lấy dữ liệu nhân viên thành công',
                'data'    => $formatted,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => false,
                'message' => 'Lỗi lấy dữ liệu nhân viên: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Thêm mới nhân viên và tự động cấp tài khoản nếu có
     */
    public function storeNhanVien(CreateNhanVienRequest $request)
    {
        DB::beginTransaction();
        try {
            // 1. Xác định role_tag_id
            $roleTagId = $request->role_tag_id;
            if (!$roleTagId && !empty($request->role)) {
                $roleTag = RoleTag::where('ten_role', $request->role)->first();
                $roleTagId = $roleTag ? $roleTag->role_tag_id : null;
            }
            if (!$roleTagId) {
                $firstRole = RoleTag::first();
                $roleTagId = $firstRole ? $firstRole->role_tag_id : 4;
            }

            // 2. Chuẩn hóa loại hợp đồng
            $contract = $request->loai_hop_dong ?? $request->contract ?? 'PART_TIME';
            if ($contract === 'Toàn thời gian') $contract = 'FULL_TIME';
            if ($contract === 'Bán thời gian') $contract = 'PART_TIME';

            // 3. Chuẩn hóa ngày sinh và hình ảnh (tránh lỗi MySQL Incorrect date value cho chuỗi rỗng '')
            $rawNgaySinh = $request->ngay_sinh ?? $request->birthDate;
            $ngaySinh = (!empty($rawNgaySinh) && trim($rawNgaySinh) !== '') ? trim($rawNgaySinh) : null;

            $rawHinhAnh = $request->hinh_anh ?? $request->avatar;
            $hinhAnh = (!empty($rawHinhAnh) && trim($rawHinhAnh) !== '') ? trim($rawHinhAnh) : null;

            // 4. Tạo tài khoản nếu có email
            $taiKhoanId = null;
            $rawEmail = $request->input('email') ?? $request->input('account.email');
            $email = (!empty($rawEmail) && trim($rawEmail) !== '') ? trim($rawEmail) : null;
            $password = $request->input('password') ?? $request->input('account.password') ?? '12345678';

            if (!empty($email)) {
                // Kiểm tra email trùng
                if (TaiKhoan::where('email', $email)->exists()) {
                    DB::rollBack();
                    return response()->json([
                        'status'  => false,
                        'message' => 'Email ' . $email . ' đã tồn tại trong hệ thống.',
                    ], 422);
                }

                $taiKhoan = TaiKhoan::create([
                    'email'      => $email,
                    'mat_khau'   => Hash::make($password),
                    'vai_tro'    => 'STAFF',
                    'trang_thai' => 'ACTIVE',
                ]);
                $taiKhoanId = $taiKhoan->tai_khoan_id;
            }

            // 5. Tạo nhân viên
            $nhanVien = NhanVien::create([
                'ho_ten'        => trim($request->ho_ten ?? $request->name),
                'so_dien_thoai' => trim($request->so_dien_thoai ?? $request->phone),
                'ngay_sinh'     => $ngaySinh,
                'loai_hop_dong' => $contract,
                'muc_luong_gio' => $request->muc_luong_gio ?? $request->hourlyWage ?? 28000,
                'role_tag_id'   => $roleTagId,
                'tai_khoan_id'  => $taiKhoanId,
                'trang_thai'    => $request->trang_thai ?? 'ACTIVE',
                'hinh_anh'      => $hinhAnh,
            ]);

            DB::commit();

            $tenRole = RoleTag::where('role_tag_id', $roleTagId)->value('ten_role') ?? 'Phục vụ';
            $contractDisplay = match ($contract) {
                'FULL_TIME' => 'Toàn thời gian',
                'PART_TIME' => 'Bán thời gian',
                default     => $contract,
            };

            $formatted = [
                'id'            => 'NV' . str_pad($nhanVien->nhan_vien_id, 3, '0', STR_PAD_LEFT),
                'raw_id'        => $nhanVien->nhan_vien_id,
                'nhan_vien_id'  => $nhanVien->nhan_vien_id,
                'name'          => $nhanVien->ho_ten,
                'ho_ten'        => $nhanVien->ho_ten,
                'phone'         => $nhanVien->so_dien_thoai,
                'so_dien_thoai' => $nhanVien->so_dien_thoai,
                'birthDate'     => $nhanVien->ngay_sinh,
                'ngay_sinh'     => $nhanVien->ngay_sinh,
                'contract'      => $contractDisplay,
                'loai_hop_dong' => $nhanVien->loai_hop_dong,
                'hourlyWage'    => (int) $nhanVien->muc_luong_gio,
                'muc_luong_gio' => (int) $nhanVien->muc_luong_gio,
                'role'          => $tenRole,
                'roleTag'       => $tenRole,
                'role_tag_id'   => $nhanVien->role_tag_id,
                'status'        => 'Đang làm việc',
                'trang_thai'    => $nhanVien->trang_thai,
                'avatar'        => $nhanVien->hinh_anh,
                'hinh_anh'      => $nhanVien->hinh_anh,
                'account'       => !empty($email) ? [
                    'email'    => $email,
                    'status'   => 'active',
                ] : null,
            ];

            return response()->json([
                'status'  => true,
                'message' => 'Thêm mới nhân viên ' . $nhanVien->ho_ten . ' thành công',
                'data'    => $formatted,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status'  => false,
                'message' => 'Lỗi thêm mới nhân viên: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cập nhật thông tin nhân viên & tài khoản
     */
    public function updateNhanVien(UpdateNhanVienRequest $request, $id = null)
    {
        DB::beginTransaction();
        try {
            $rawId = $id ?? $request->nhan_vien_id ?? $request->id;
            // Chuyển mã NV001 thành số nguyên 1
            $nhanVienId = (int) preg_replace('/[^0-9]/', '', (string)$rawId);

            $nhanVien = NhanVien::find($nhanVienId);
            if (!$nhanVien) {
                DB::rollBack();
                return response()->json([
                    'status'  => false,
                    'message' => 'Không tìm thấy nhân viên cần cập nhật',
                ], 404);
            }

            // 1. Cập nhật vai trò nếu có
            $roleTagId = $request->role_tag_id;
            if (!$roleTagId && !empty($request->role)) {
                $roleTag = RoleTag::where('ten_role', $request->role)->first();
                if ($roleTag) {
                    $roleTagId = $roleTag->role_tag_id;
                }
            }

            // 2. Chuẩn hóa hợp đồng & trạng thái
            $contract = $request->loai_hop_dong ?? $request->contract ?? $nhanVien->loai_hop_dong;
            if ($contract === 'Toàn thời gian') $contract = 'FULL_TIME';
            if ($contract === 'Bán thời gian') $contract = 'PART_TIME';

            $status = $request->trang_thai ?? $request->status ?? $nhanVien->trang_thai;
            if ($status === 'Đang làm việc') $status = 'ACTIVE';
            if ($status === 'Nghỉ việc') $status = 'INACTIVE';

            // 3. Chuẩn hóa ngày sinh
            $rawNgaySinh = $request->ngay_sinh ?? $request->birthDate;
            $ngaySinh = ($rawNgaySinh !== null && trim($rawNgaySinh) !== '') ? trim($rawNgaySinh) : $nhanVien->ngay_sinh;

            // 4. Cập nhật nhân viên
            $nhanVien->update([
                'ho_ten'        => trim($request->ho_ten ?? $request->name ?? $nhanVien->ho_ten),
                'so_dien_thoai' => trim($request->so_dien_thoai ?? $request->phone ?? $nhanVien->so_dien_thoai),
                'ngay_sinh'     => $ngaySinh,
                'loai_hop_dong' => $contract,
                'muc_luong_gio' => $request->muc_luong_gio ?? $request->hourlyWage ?? $nhanVien->muc_luong_gio,
                'role_tag_id'   => $roleTagId ?? $nhanVien->role_tag_id,
                'trang_thai'    => $status,
                'hinh_anh'      => $request->hinh_anh ?? $request->avatar ?? $nhanVien->hinh_anh,
            ]);

            // 5. Xử lý tài khoản
            $rawEmail = $request->input('email') ?? $request->input('account.email');
            $email = (!empty($rawEmail) && trim($rawEmail) !== '') ? trim($rawEmail) : null;
            $password = $request->input('password') ?? $request->input('account.password');
            $accountStatus = $request->input('account.status');

            if (!empty($email)) {
                $taiKhoan = $nhanVien->tai_khoan_id ? TaiKhoan::find($nhanVien->tai_khoan_id) : null;

                if ($taiKhoan) {
                    // Nếu là yêu cầu cấp tài khoản nhưng nhân viên đã có tài khoản
                    if ($request->input('is_grant')) {
                        DB::rollBack();
                        return response()->json([
                            'status'  => false,
                            'message' => 'Nhân viên này đã có tài khoản trong hệ thống.',
                        ], 422);
                    }

                    // Kiểm tra trùng email với tài khoản khác
                    $isDuplicate = TaiKhoan::where('email', $email)
                        ->where('tai_khoan_id', '!=', $taiKhoan->tai_khoan_id)
                        ->exists();
                    if ($isDuplicate) {
                        DB::rollBack();
                        return response()->json([
                            'status'  => false,
                            'message' => 'Email ' . $email . ' đã được dùng cho tài khoản khác.',
                        ], 422);
                    }

                    $tkUpdate = ['email' => $email];
                    if (!empty($password) && is_string($password) && trim($password) !== '') {
                        $tkUpdate['mat_khau'] = Hash::make(trim($password));
                    }
                    if (!empty($accountStatus)) {
                        $tkUpdate['trang_thai'] = strtoupper($accountStatus);
                    }
                    $taiKhoan->update($tkUpdate);
                } else {
                    // Chưa có tài khoản hợp lệ -> cấp tài khoản mới
                    if (TaiKhoan::where('email', $email)->exists()) {
                        DB::rollBack();
                        return response()->json([
                            'status'  => false,
                            'message' => 'Email ' . $email . ' đã được dùng cho tài khoản khác.',
                        ], 422);
                    }

                    $plainPassword = (!empty($password) && is_string($password) && trim($password) !== '')
                        ? trim($password)
                        : '12345678';

                    $taiKhoan = TaiKhoan::create([
                        'email'      => $email,
                        'mat_khau'   => Hash::make($plainPassword),
                        'vai_tro'    => 'STAFF',
                        'trang_thai' => 'ACTIVE',
                    ]);

                    $nhanVienUpdate = ['tai_khoan_id' => $taiKhoan->tai_khoan_id];
                    if ($nhanVien->trang_thai === 'INACTIVE' && empty($request->trang_thai) && empty($request->status)) {
                        $nhanVienUpdate['trang_thai'] = 'ACTIVE';
                    }
                    $nhanVien->update($nhanVienUpdate);
                }
            }
            DB::commit();

            // Lấy dữ liệu mới nhất để trả về chuẩn cấu trúc cho frontend
            $nhanVien->refresh();
            $roleName = RoleTag::where('role_tag_id', $nhanVien->role_tag_id)->value('ten_role') ?? 'Phục vụ';
            $taiKhoan = $nhanVien->tai_khoan_id ? TaiKhoan::find($nhanVien->tai_khoan_id) : null;
            $contractDisplay = match ($nhanVien->loai_hop_dong) {
                'FULL_TIME' => 'Toàn thời gian',
                'PART_TIME' => 'Bán thời gian',
                default     => $nhanVien->loai_hop_dong,
            };
            $statusDisplay = match ($nhanVien->trang_thai) {
                'ACTIVE'             => 'Đang làm việc',
                'INACTIVE', 'LOCKED' => 'Nghỉ việc',
                default              => $nhanVien->trang_thai,
            };

            $formatted = [
                'id'            => 'NV' . str_pad($nhanVien->nhan_vien_id, 3, '0', STR_PAD_LEFT),
                'raw_id'        => $nhanVien->nhan_vien_id,
                'nhan_vien_id'  => $nhanVien->nhan_vien_id,
                'name'          => $nhanVien->ho_ten,
                'ho_ten'        => $nhanVien->ho_ten,
                'phone'         => $nhanVien->so_dien_thoai,
                'so_dien_thoai' => $nhanVien->so_dien_thoai,
                'birthDate'     => $nhanVien->ngay_sinh,
                'ngay_sinh'     => $nhanVien->ngay_sinh,
                'contract'      => $contractDisplay,
                'loai_hop_dong' => $nhanVien->loai_hop_dong,
                'hourlyWage'    => (int) $nhanVien->muc_luong_gio,
                'muc_luong_gio' => (int) $nhanVien->muc_luong_gio,
                'role'          => $roleName,
                'roleTag'       => $roleName,
                'role_tag_id'   => $nhanVien->role_tag_id,
                'status'        => $statusDisplay,
                'trang_thai'    => $nhanVien->trang_thai,
                'avatar'        => $nhanVien->hinh_anh,
                'hinh_anh'      => $nhanVien->hinh_anh,
                'account'       => $taiKhoan ? [
                    'email'  => $taiKhoan->email,
                    'status' => strtolower($taiKhoan->trang_thai ?? 'active'),
                ] : null,
            ];

            return response()->json([
                'status'  => true,
                'message' => 'Đã cập nhật thông tin nhân viên ' . $nhanVien->ho_ten . ' thành công',
                'data'    => $formatted,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status'  => false,
                'message' => 'Lỗi cập nhật nhân viên: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cho nhân viên nghỉ việc (Không xóa cứng, kiểm tra ca làm tương lai)
     */
    public function destroyNhanVien(Request $request, $id = null)
    {
        try {
            $rawId = $id ?? $request->nhan_vien_id ?? $request->id;
            $nhanVienId = (int) preg_replace('/[^0-9]/', '', (string)$rawId);

            $nhanVien = NhanVien::find($nhanVienId);
            if (!$nhanVien) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Không tìm thấy nhân viên',
                ], 404);
            }

            // Kiểm tra số ca làm trong tương lai (từ hôm nay trở đi)
            $today = date('Y-m-d');
            $futureShifts = DB::table('phan_cong_cas')
                ->join('ca_maus', 'phan_cong_cas.ca_mau_id', '=', 'ca_maus.ca_mau_id')
                ->where('phan_cong_cas.nhan_vien_id', $nhanVienId)
                ->where('phan_cong_cas.ngay_lam', '>=', $today)
                ->whereNotIn('phan_cong_cas.trang_thai', ['CANCELLED', 'HUY'])
                ->select(
                    'phan_cong_cas.phan_cong_ca_id',
                    'phan_cong_cas.ngay_lam',
                    'ca_maus.ten_ca',
                    'ca_maus.gio_bat_dau',
                    'ca_maus.gio_ket_thuc'
                )
                ->orderBy('phan_cong_cas.ngay_lam')
                ->get();

            $futureCount = $futureShifts->count();

            // Đổi trạng thái nhân viên sang INACTIVE (Không xóa cứng hồ sơ và dữ liệu lịch sử)
            $nhanVien->update(['trang_thai' => 'INACTIVE']);

            // Khóa tài khoản nếu có
            if ($nhanVien->tai_khoan_id) {
                TaiKhoan::where('tai_khoan_id', $nhanVien->tai_khoan_id)
                    ->update(['trang_thai' => 'LOCKED']);
            }

            $message = 'Đã chuyển nhân viên ' . $nhanVien->ho_ten . ' sang trạng thái nghỉ việc.';
            if ($futureCount > 0) {
                $message .= " (Lưu ý: Nhân viên còn {$futureCount} ca làm việc tương lai cần được phân công lại).";
            }

            return response()->json([
                'status'              => true,
                'message'             => $message,
                'future_shifts_count' => $futureCount,
                'future_shifts'       => $futureShifts,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => false,
                'message' => 'Lỗi xử lý nghỉ việc: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lấy danh sách ca làm việc trong tương lai của nhân viên
     */
    public function getFutureShifts(Request $request, $id = null)
    {
        try {
            $rawId = $id ?? $request->nhan_vien_id ?? $request->id;
            $nhanVienId = (int) preg_replace('/[^0-9]/', '', (string)$rawId);

            $today = date('Y-m-d');
            $shifts = DB::table('phan_cong_cas')
                ->join('ca_maus', 'phan_cong_cas.ca_mau_id', '=', 'ca_maus.ca_mau_id')
                ->where('phan_cong_cas.nhan_vien_id', $nhanVienId)
                ->where('phan_cong_cas.ngay_lam', '>=', $today)
                ->whereNotIn('phan_cong_cas.trang_thai', ['CANCELLED', 'HUY'])
                ->select(
                    'phan_cong_cas.phan_cong_ca_id',
                    'phan_cong_cas.ngay_lam',
                    'ca_maus.ten_ca',
                    'ca_maus.gio_bat_dau',
                    'ca_maus.gio_ket_thuc'
                )
                ->orderBy('phan_cong_cas.ngay_lam')
                ->get();

            return response()->json([
                'status' => true,
                'count'  => $shifts->count(),
                'data'   => $shifts,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => false,
                'message' => 'Lỗi kiểm tra ca làm việc: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Khóa hoặc mở khóa tài khoản nhân viên
     */
    public function changeStatusNhanVien(Request $request, $id = null)
    {
        try {
            $rawId = $id ?? $request->nhan_vien_id ?? $request->id;
            $nhanVienId = (int) preg_replace('/[^0-9]/', '', (string)$rawId);

            $nhanVien = NhanVien::find($nhanVienId);
            if (!$nhanVien) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Không tìm thấy nhân viên',
                ], 404);
            }

            if (!$nhanVien->tai_khoan_id) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Nhân viên này chưa được cấp tài khoản',
                ], 400);
            }

            $taiKhoan = TaiKhoan::find($nhanVien->tai_khoan_id);
            if (!$taiKhoan) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Tài khoản không tồn tại',
                ], 404);
            }

            $newStatus = ($taiKhoan->trang_thai === 'ACTIVE') ? 'LOCKED' : 'ACTIVE';
            if ($request->has('locked')) {
                $newStatus = $request->boolean('locked') ? 'LOCKED' : 'ACTIVE';
            }

            // Nghiệp vụ: Không cho phép mở khóa để nhân viên đã nghỉ việc có thể đăng nhập
            if ($nhanVien->trang_thai === 'INACTIVE' && $newStatus === 'ACTIVE') {
                return response()->json([
                    'status'  => false,
                    'message' => 'Không thể mở khóa tài khoản cho nhân viên đã nghỉ việc.',
                ], 400);
            }

            $taiKhoan->update(['trang_thai' => $newStatus]);

            $msg = ($newStatus === 'ACTIVE') ? 'Đã mở khóa tài khoản thành công' : 'Đã khóa tài khoản thành công';

            return response()->json([
                'status'     => true,
                'message'    => $msg,
                'new_status' => strtolower($newStatus),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => false,
                'message' => 'Lỗi thay đổi trạng thái: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Tìm kiếm nhân viên
     */
    public function searchNhanVien(Request $request)
    {
        try {
            $keyword = trim($request->noi_dung_tim_kiem ?? $request->keyword ?? '');

            $query = DB::table('nhan_viens')
                ->leftJoin('role_tags', 'nhan_viens.role_tag_id', '=', 'role_tags.role_tag_id')
                ->leftJoin('tai_khoans', 'nhan_viens.tai_khoan_id', '=', 'tai_khoans.tai_khoan_id')
                ->select(
                    'nhan_viens.nhan_vien_id',
                    'nhan_viens.ho_ten',
                    'nhan_viens.so_dien_thoai',
                    'nhan_viens.ngay_sinh',
                    'nhan_viens.loai_hop_dong',
                    'nhan_viens.muc_luong_gio',
                    'nhan_viens.trang_thai as trang_thai_nhan_vien',
                    'nhan_viens.hinh_anh',
                    'role_tags.ten_role',
                    'tai_khoans.email',
                    'tai_khoans.trang_thai as trang_thai_tai_khoan'
                );

            if ($keyword !== '') {
                $query->where(function ($q) use ($keyword) {
                    $q->where('nhan_viens.ho_ten', 'like', '%' . $keyword . '%')
                      ->orWhere('nhan_viens.so_dien_thoai', 'like', '%' . $keyword . '%')
                      ->orWhere('tai_khoans.email', 'like', '%' . $keyword . '%');
                });
            }

            $data = $query->orderBy('nhan_viens.nhan_vien_id', 'desc')->get();

            return response()->json([
                'status'  => true,
                'message' => 'Tìm kiếm nhân viên thành công',
                'data'    => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => false,
                'message' => 'Lỗi tìm kiếm nhân viên: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lấy danh sách Vai trò (Role Tags)
     */
    public function getDataRoleTag()
    {
        try {
            $data = RoleTag::where('trang_thai', 'ACTIVE')->get();
            return response()->json([
                'status'  => true,
                'message' => 'Lấy dữ liệu vai trò thành công',
                'data'    => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => false,
                'message' => 'Lỗi lấy dữ liệu vai trò: ' . $e->getMessage(),
            ], 500);
        }
    }
}
