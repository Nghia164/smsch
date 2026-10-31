import Modal from "../../../../components/Modal";
import Button from "../../../../components/Button";
import { Field, FormError, PasswordInput, fieldClass } from "../employeeShared";

/**
 * Hộp thoại cấp tài khoản nhân viên
 */
export function GrantAccountModal({
  open,
  selected,
  form,
  onChange,
  error,
  onClose,
  onSubmit,
}) {
  return (
    <Modal open={open} title={`Cấp tài khoản cho ${selected?.name || ""}`} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormError message={error} />
        <p className="text-[13px] text-slate-600">Nhân viên sẽ dùng email và mật khẩu này để đăng nhập vào hệ thống.</p>
        <Field label="Email đăng nhập *">
          <input
            type="email"
            name="email"
            value={form.email || ""}
            onChange={onChange}
            placeholder="nhanvien@gmail.com"
            className={fieldClass}
          />
        </Field>
        <Field label="Mật khẩu *">
          <PasswordInput
            name="password"
            value={form.password || ""}
            onChange={onChange}
            placeholder="Nhập mật khẩu"
          />
        </Field>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            name="changePasswordFirstLogin"
            checked={!!form.changePasswordFirstLogin}
            onChange={onChange}
            className="h-4 w-4"
          />
          <span className="text-[13px] text-slate-600">Yêu cầu đổi mật khẩu khi đăng nhập lần đầu</span>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit">Cấp tài khoản</Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Hộp thoại thông báo cấp tài khoản thành công
 */
export function AccountSuccessModal({ open, created, onClose }) {
  return (
    <Modal open={open} title="Cấp tài khoản thành công" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-[14px] text-emerald-900">
          Tài khoản đã được tạo. Hãy gửi email và mật khẩu cho nhân viên.
        </div>
        <div className="rounded-xl border border-slate-200 p-4 text-[14px]">
          <p className="text-[12px] text-slate-500">Nhân viên</p>
          <p className="font-medium text-slate-900">{created?.name}</p>
          <p className="mt-3 text-[12px] text-slate-500">Email đăng nhập</p>
          <p className="text-slate-800">{created?.email}</p>
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={onClose}>
            Đã hiểu
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Hộp thoại xác nhận khóa hoặc mở khóa tài khoản
 */
export function ToggleAccountModal({ open, selected, error, onClose, onConfirm }) {
  const isLocked = selected?.account?.status === "locked";
  const actionTitle = isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản";

  return (
    <Modal open={open} title={actionTitle} onClose={onClose}>
      <div className="space-y-4">
        <FormError message={error} />
        <p className="text-[14px] text-slate-700">
          {isLocked ? (
            <>
              Bạn có chắc chắn muốn mở khóa tài khoản cho nhân viên{" "}
              <b className="text-slate-900">{selected?.name}</b> ({selected?.account?.email})?
              Sau khi mở khóa, nhân viên sẽ có thể tiếp tục đăng nhập vào hệ thống.
            </>
          ) : (
            <>
              Bạn có chắc chắn muốn khóa tài khoản của nhân viên{" "}
              <b className="text-slate-900">{selected?.name}</b> ({selected?.account?.email})?
              Sau khi khóa, tài khoản sẽ không thể đăng nhập vào hệ thống. Mật khẩu và hồ sơ nhân viên vẫn được giữ nguyên.
            </>
          )}
        </p>
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="button"
            variant={isLocked ? "primary" : "danger"}
            onClick={onConfirm}
          >
            {actionTitle}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
