import Modal from "../../../../components/Modal";
import Button from "../../../../components/Button";
import { EmployeeFields, Field, FormError, PasswordInput, fieldClass } from "../employeeShared";

/**
 * Hộp thoại chỉnh sửa thông tin nhân viên
 */
export default function EditEmployeeModal({
  open,
  selected,
  form,
  onChange,
  error,
  onClose,
  onSubmit,
}) {
  return (
    <Modal open={open} title="Sửa nhân viên" onClose={onClose}>
      <form onSubmit={onSubmit} className="max-h-[75vh] overflow-y-auto pr-1">
        <FormError message={error} />
        <EmployeeFields form={form} onChange={onChange} />
        {selected?.account && (
          <div className="mt-6 space-y-4 border-t border-slate-200 pt-5">
            <h4 className="text-[14px] font-semibold text-slate-900">Tài khoản đăng nhập</h4>
            <Field label="Email đăng nhập">
              <input
                type="email"
                name="email"
                value={form.email || ""}
                onChange={onChange}
                className={fieldClass}
              />
            </Field>
            <Field label="Mật khẩu (không bắt buộc)">
              <PasswordInput
                name="password"
                value={form.password || ""}
                onChange={onChange}
                placeholder="Để trống để giữ nguyên mật khẩu cũ"
              />
              <p className="mt-1 text-[12px] text-slate-500">
                Để trống nếu không đổi. Nhân viên có thể tự đổi mật khẩu sau khi đăng nhập.
              </p>
            </Field>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit">Lưu thay đổi</Button>
        </div>
      </form>
    </Modal>
  );
}
