import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// Các thành phần dùng chung cho form nhân viên (thêm / sửa / cấp tài khoản)

export const ROLES = ["Phục vụ", "Pha chế", "Thu ngân"];
export const CONTRACTS = ["Toàn thời gian", "Bán thời gian"];

export const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[14px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100";

export function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-[13px] font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

export function FormError({ message }) {
  if (!message) return null;
  return (
    <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-[14px] text-rose-800">
      {message}
    </p>
  );
}

export function PasswordInput(props) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`${fieldClass} pr-10`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-800"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

// Nhóm ô "Thông tin nhân viên" (dùng cho cả form thêm và form sửa)
export function EmployeeFields({ form, onChange }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Mã nhân viên">
        <input value={form.id || ""} disabled className={`${fieldClass} bg-slate-50 text-slate-500`} />
      </Field>
      <Field label="Họ và tên *">
        <input name="name" value={form.name || ""} onChange={onChange} placeholder="Nguyễn Văn A" className={fieldClass} />
      </Field>
      <Field label="Số điện thoại *">
        <input name="phone" value={form.phone || ""} onChange={onChange} placeholder="0905xxxxxx" className={fieldClass} />
      </Field>
      <Field label="Ngày sinh">
        <input type="date" name="birthDate" value={form.birthDate || ""} onChange={onChange} className={fieldClass} />
      </Field>
      <Field label="Loại hợp đồng">
        <select name="contract" value={form.contract || CONTRACTS[0]} onChange={onChange} className={fieldClass}>
          {CONTRACTS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Vai trò">
        <select name="role" value={form.role || ROLES[0]} onChange={onChange} className={fieldClass}>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
      </Field>
      <Field label="Lương theo giờ (VNĐ)">
        <input
          type="number"
          name="hourlyWage"
          value={form.hourlyWage ?? ""}
          onChange={onChange}
          placeholder="Ví dụ: 30000"
          min="0"
          step="1000"
          className={fieldClass}
        />
      </Field>
    </div>
  );
}