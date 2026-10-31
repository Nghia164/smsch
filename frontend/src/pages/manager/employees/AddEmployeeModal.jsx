import { useEffect, useState } from "react";
import Modal from "../../../components/Modal";
import Button from "../../../components/Button";
import { EmployeeFields, Field, FormError, PasswordInput, fieldClass } from "./employeeShared";

const emptyForm = {
  id: "",
  name: "",
  phone: "",
  birthDate: "",
  contract: "Bán thời gian",
  role: "Phục vụ",
  hourlyWage: 28000,
  createAccount: true,
  email: "",
  password: "",
  changePasswordFirstLogin: true,
};

// Form thêm nhân viên (có thể cấp tài khoản ngay).
// - nextId: mã nhân viên mới
// - isEmailTaken(email): kiểm tra email đã dùng chưa
// - onCreate(employee): trả nhân viên mới về trang danh sách
export default function AddEmployeeModal({ open, nextId, isEmailTaken, onClose, onCreate }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  // Mỗi lần mở: xóa form cũ
  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setForm({ ...emptyForm, id: nextId });
        setError("");
      });
    }
  }, [open, nextId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { createAccount, email, password } = form;

    if (!form.name.trim()) return setError("Vui lòng nhập họ và tên.");
    if (!form.phone.trim()) return setError("Vui lòng nhập số điện thoại.");
    if (createAccount && !email.trim()) return setError("Vui lòng nhập email đăng nhập.");
    if (createAccount && isEmailTaken(email)) return setError("Email này đã được dùng cho tài khoản khác.");
    if (createAccount && !password.trim()) return setError("Vui lòng nhập mật khẩu.");

    try {
      await onCreate({
        id: form.id,
        name: form.name.trim(),
        phone: form.phone.trim(),
        birthDate: form.birthDate ? form.birthDate : null,
        role: form.role,
        contract: form.contract,
        hourlyWage: Number(form.hourlyWage) || 28000,
        status: "Đang làm việc",
        account: createAccount ? { email: email.trim(), password, status: "active" } : null,
      });
      if (!createAccount) {
        onClose();
      }
    } catch (err) {
      setError(err.message || "Lỗi khi thêm nhân viên.");
    }
  };

  return (
    <Modal open={open} title="Thêm nhân viên" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 pr-1">
        <FormError message={error} />

        <h4 className="mb-3 text-[14px] font-semibold text-slate-900">Thông tin nhân viên</h4>
        <EmployeeFields form={form} onChange={handleChange} />

        <div className="mt-6 border-t border-slate-200 pt-5">
          <h4 className="text-[14px] font-semibold text-slate-900">Tài khoản đăng nhập</h4>
          <p className="mb-3 mt-1 text-[13px] text-slate-500">
            Quản lý có thể cấp tài khoản cho nhân viên ngay khi tạo hồ sơ.
          </p>

          <label className="mb-4 flex cursor-pointer items-center gap-2">
            <input type="checkbox" name="createAccount" checked={form.createAccount} onChange={handleChange} className="h-4 w-4" />
            <span className="text-[14px] text-slate-800">Cấp tài khoản cho nhân viên</span>
          </label>

          {form.createAccount && (
            <div className="space-y-4">
              <Field label="Email đăng nhập *">
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="nhanvien@gmail.com" className={fieldClass} />
              </Field>
              <Field label="Mật khẩu *">
                <PasswordInput name="password" value={form.password} onChange={handleChange} placeholder="Nhập mật khẩu" />
              </Field>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" name="changePasswordFirstLogin" checked={form.changePasswordFirstLogin} onChange={handleChange} className="h-4 w-4" />
                <span className="text-[13px] text-slate-600">Yêu cầu đổi mật khẩu khi đăng nhập lần đầu</span>
              </label>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>Hủy</Button>
          <Button type="submit">Thêm nhân viên</Button>
        </div>
      </form>
    </Modal>
  );
}