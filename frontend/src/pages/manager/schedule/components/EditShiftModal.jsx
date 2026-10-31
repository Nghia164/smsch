import Modal from "../../../../components/Modal";
import Button from "../../../../components/Button";
import { Calendar, Trash2, Plus } from "lucide-react";

export default function EditShiftModal({
  open,
  selectedInfo,
  editEmployeesList,
  employeeRoster,
  showAddDropdown,
  onClose,
  onToggleAddDropdown,
  onRemoveEmployee,
  onAddEmployee,
  onSave,
}) {
  if (!selectedInfo) return null;

  const availableCandidates = employeeRoster.filter(
    (cand) => !editEmployeesList.some((e) => e.id === cand.id)
  );

  return (
    <Modal open={open} title="Chỉnh sửa ca làm việc" onClose={onClose}>
      <div className="space-y-5">
        {/* Banner ca */}
        <div className="flex items-start gap-3 rounded-xl border border-[#BFD0F5] bg-[#E8EEFB] p-4">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-[#BFD0F5] text-[#3F62C4]">
            <Calendar size={18} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">
              {selectedInfo.day.fullDate} - {selectedInfo.demand.name}
            </div>
            <div className="mt-0.5 text-xs text-slate-600">
              Cần:{" "}
              <span className="font-semibold text-[#3F62C4]">
                {selectedInfo.demand.phucVu} Phục vụ + {selectedInfo.demand.phaChe} Pha chế ({selectedInfo.demand.total} người)
              </span>
            </div>
          </div>
        </div>

        {/* Danh sách nhân viên hiện tại */}
        <div>
          <div className="mb-2 text-xs font-semibold text-slate-700">
            Nhân viên hiện tại ({editEmployeesList.length}/{selectedInfo.demand.total})
          </div>
          <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
            {editEmployeesList.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-2.5 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={emp.avatar}
                    alt={emp.name}
                    className="h-9 w-9 rounded-full border border-slate-200 object-cover"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-800">{emp.name}</div>
                    <div className="text-[11px] font-medium text-[#3F62C4]">{emp.role}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveEmployee(emp.id)}
                  className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                >
                  <Trash2 size={13} />
                  <span>Xóa khỏi ca</span>
                </button>
              </div>
            ))}
            {editEmployeesList.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
                Chưa có nhân viên nào trong ca này.
              </div>
            )}
          </div>
        </div>

        {/* Nút thêm nhân viên */}
        <div className="relative">
          <button
            type="button"
            onClick={onToggleAddDropdown}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#BFD0F5] bg-[#E8EEFB]/50 py-3 text-xs font-semibold text-[#3F62C4] transition hover:bg-[#E8EEFB]"
          >
            <Plus size={16} />
            <span>+ Thêm nhân viên</span>
          </button>

          {/* Dropdown danh sách nhân viên để chọn */}
          {showAddDropdown && (
            <div className="absolute top-full left-0 z-20 mt-2 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <div className="mb-1.5 px-2 text-[11px] font-semibold uppercase text-slate-400">
                Chọn nhân viên có sẵn:
              </div>
              {availableCandidates.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  Tất cả nhân viên đã được thêm vào ca.
                </div>
              ) : (
                availableCandidates.map((cand) => (
                  <div
                    key={cand.id}
                    onClick={() => onAddEmployee(cand)}
                    className="flex cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={cand.avatar}
                        alt={cand.name}
                        className="h-7 w-7 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-xs font-semibold text-slate-800">{cand.name}</div>
                        <div className="text-[10px] text-[#3F62C4]">{cand.role}</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#3F62C4]">+ Thêm</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Hủy
          </Button>
          <Button type="button" size="md" onClick={onSave}>
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </Modal>
  );
}
