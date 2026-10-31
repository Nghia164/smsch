import { useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { adjustAttendance } from "../../../../services/attendanceService";
import Modal from "../../../../components/Modal";
import Button from "../../../../components/Button";
import { Field, inputClass } from "../../../../components/FilterBar";

/**
 * Hộp thoại điều chỉnh chấm công (US25)
 */
export default function AttendanceAdjustModal({ adjusting, onClose, onSaved }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    checkIn: adjusting?.checkIn || "",
    checkOut: adjusting?.checkOut || "",
    reason: "",
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!adjusting) return null;

  const handleSave = async () => {
    setSaving(true);
    setFormError("");
    try {
      await adjustAttendance(adjusting.id, {
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        reason: form.reason,
        modifier: user?.id ?? user?.name ?? "manager",
      });
      onClose();
      onSaved?.("Đã lưu điều chỉnh chấm công. Số liệu tổng hợp giờ làm đã được cập nhật.");
    } catch (err) {
      setFormError(err?.message ?? "Không lưu được điều chỉnh. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={!!adjusting} title="Điều chỉnh chấm công" onClose={() => !saving && onClose()}>
      <div className="space-y-4 text-[14px]">
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
          <div>
            <p className="text-[13px] text-slate-600">Nhân viên</p>
            <p className="font-medium text-slate-900">{adjusting.employeeName} ({adjusting.employeeId})</p>
          </div>
          <div>
            <p className="text-[13px] text-slate-600">Ca</p>
            <p className="font-medium text-slate-900">{adjusting.shiftName} • {adjusting.date} • {adjusting.scheduled}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Giờ vào">
            <input type="time" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Giờ ra">
            <input type="time" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} className={inputClass} />
          </Field>
        </div>

        <Field label="Lý do điều chỉnh (bắt buộc)">
          <textarea
            rows={3}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Ví dụ: nhân viên quên chấm công ra, đã xác nhận với quản lý ca"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[14px] text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </Field>

        {formError && <p className="text-[13px] text-rose-700">{formError}</p>}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" size="lg" onClick={onClose} disabled={saving}>
            Hủy
          </Button>
          <Button type="button" size="lg" onClick={handleSave} loading={saving}>
            {saving ? "Đang lưu…" : "Lưu"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
