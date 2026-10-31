<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Validation\ValidationException;

class CreateNhanVienRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $merges = [];

        if ($this->has('name') && !$this->has('ho_ten')) {
            $merges['ho_ten'] = $this->input('name');
        }
        if ($this->has('phone') && !$this->has('so_dien_thoai')) {
            $merges['so_dien_thoai'] = $this->input('phone');
        }
        if ($this->has('birthDate') && !$this->has('ngay_sinh')) {
            $merges['ngay_sinh'] = $this->input('birthDate');
        }
        if ($this->has('contract') && !$this->has('loai_hop_dong')) {
            $merges['loai_hop_dong'] = $this->input('contract');
        }
        if ($this->has('hourlyWage') && !$this->has('muc_luong_gio')) {
            $merges['muc_luong_gio'] = $this->input('hourlyWage');
        }
        if ($this->has('status') && !$this->has('trang_thai')) {
            $merges['trang_thai'] = $this->input('status');
        }
        if (!$this->has('email') && $this->input('account.email')) {
            $merges['email'] = $this->input('account.email');
        }
        if (!$this->has('password') && $this->input('account.password')) {
            $merges['password'] = $this->input('account.password');
        }

        if (!empty($merges)) {
            $this->merge($merges);
        }
    }

    public function rules(): array
    {
        return [
            'ho_ten'        => 'required|string|max:255',
            'so_dien_thoai' => 'nullable|string|max:20',
            'ngay_sinh'     => 'nullable',
            'loai_hop_dong' => 'nullable|string|max:50',
            'muc_luong_gio' => 'nullable|numeric|min:0',
            'role_tag_id'   => 'nullable|integer',
            'role'          => 'nullable|string',
            'trang_thai'    => 'nullable|string|max:30',
            'email'         => 'nullable|email|max:255|unique:tai_khoans,email',
            'password'      => 'nullable|string|min:6',
        ];
    }

    public function messages(): array
    {
        return [
            'ho_ten.required'        => 'Họ và tên không được để trống.',
            'so_dien_thoai.required' => 'Số điện thoại không được để trống.',
            'muc_luong_gio.required' => 'Mức lương theo giờ không được để trống.',
            'muc_luong_gio.numeric'  => 'Mức lương phải là chữ số.',
            'email.email'            => 'Email không đúng định dạng.',
            'email.unique'           => 'Email này đã tồn tại trong hệ thống.',
            'password.min'           => 'Mật khẩu phải có ít nhất 6 ký tự.',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        $response = response()->json([
            'status'  => false,
            'message' => $validator->errors()->first(),
            'errors'  => $validator->errors(),
        ], 422);

        throw new ValidationException($validator, $response);
    }
}
