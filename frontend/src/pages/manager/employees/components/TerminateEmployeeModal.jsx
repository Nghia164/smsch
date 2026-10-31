import Modal from "../../../../components/Modal";
import Button from "../../../../components/Button";
import { FormError } from "../employeeShared";

/**
 * Hộp thoại xác nhận cho nhân viên thôi việc
 */
export default function TerminateEmployeeModal({
  open,
  selected,
  futureShifts = [],
  loadingShifts = false,
  error,
  onClose,
  onConfirm,
}) {
  return (
    <Modal open={open} title="Cho nhân viên nghỉ việc" onClose={onClose}>
      <div className="space-y-4">
        <FormError message={error} />

        <p className="text-[14px] text-slate-700">
          Bạn có chắc chắn muốn chuyển nhân viên <b className="text-slate-900">{selected?.name}</b> sang trạng thái nghỉ việc?
        </p>

        {loadingShifts ? (
          <p className="text-[13px] text-slate-500 italic">Đang kiểm tra ca làm việc tương lai...</p>
        ) : futureShifts.length > 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-[13px] text-amber-900">
            <p className="font-semibold text-amber-950 flex items-center gap-1.5">
              <span>⚠️</span> Lưu ý: Nhân viên còn {futureShifts.length} ca làm trong tương lai
            </p>
            <p className="mt-1 text-amber-800">
              Các ca phân công sắp tới sẽ không tự động xóa để bảo toàn dữ liệu. Quản lý vui lòng phân công người thay thế cho các ca này sau khi cho nghỉ việc.
            </p>
            <div className="mt-2 max-h-32 overflow-y-auto rounded border border-amber-200 bg-white/70 p-2 text-[12px]">
              {futureShifts.map((s, idx) => (
                <div key={idx} className="flex justify-between py-1 border-b border-amber-100 last:border-0">
                  <span className="font-medium text-slate-800">{s.ten_ca || "Ca làm"} ({s.gio_bat_dau} - {s.gio_ket_thuc})</span>
                  <span className="text-slate-600 tabular-nums">{s.ngay_lam}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[12px] text-slate-600">
          Tài khoản đăng nhập sẽ bị khóa. Toàn bộ hồ sơ nhân viên, lịch sử chấm công, đổi ca và bảng lương đều được giữ nguyên vẹn trong hệ thống.
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            Hủy
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm}>
            Xác nhận cho nghỉ việc
          </Button>
        </div>
      </div>
    </Modal>
  );
}
