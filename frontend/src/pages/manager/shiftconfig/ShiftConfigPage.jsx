import { CheckCircle2, Plus } from "lucide-react";
import Button from "../../../components/Button";
import { PageCard, SearchInput, Alert } from "../../../components/PageKit";
import { inputClass } from "../../../components/FilterBar";
import { SHIFT_STATUS } from "./shiftConfigData";
import ConstraintsTab from "./components/ConstraintsTab";
import GeneralSettingsTab from "./components/GeneralSettingsTab";
import ShiftTemplatesTab from "./components/ShiftTemplatesTab";
import { ShiftFormModal, DeleteShiftModal } from "./components/ShiftModals";
import { useShiftConfig } from "./hooks/useShiftConfig";

function Toast({ message }) {
  return (
    <div role="status" className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-[14px] font-medium text-white shadow-lg">
      <CheckCircle2 size={16} className="text-emerald-400" />
      {message}
    </div>
  );
}

export default function ShiftConfigPage() {
  const {
    tab,
    setTab,
    shifts,
    constraints,
    generalSettings,
    loading,
    offline,
    filters,
    setFilters,
    page,
    setPage,
    pageSize,
    setPageSize,
    editing,
    setEditing,
    deleting,
    setDeleting,
    toast,
    activeCount,
    rows,
    pageRows,
    canClear,
    resetFilters,
    isShiftUsedInSchedule,
    saveShift,
    pauseShift,
    deleteShift,
    saveConstraints,
    saveGeneral,
    saving,
    tabs,
  } = useShiftConfig();

  return (
    <>
      <PageCard
        title="Ca & ràng buộc"
        subtitle="Ca làm việc mẫu, quy tắc xếp lịch tự động và cấu hình chung hệ thống."
        actions={
          tab === "shifts" && (
            <Button type="button" size="lg" icon={<Plus size={16} />} onClick={() => setEditing("new")}>
              Thêm ca mẫu
            </Button>
          )
        }
      >
        {offline && (
          <Alert tone="error" className="mb-4">
            Không kết nối được máy chủ, đang hiển thị cấu hình mặc định. Thay đổi sẽ chưa lưu được.
          </Alert>
        )}

        {/* TAB + BỘ LỌC */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[14px]">
            {tabs.map(([id, label, count]) => (
              <button
                key={id}
                type="button"
                aria-pressed={tab === id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${
                  tab === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>{label}</span>
                <span className="text-[12px] tabular-nums text-slate-400">{count}</span>
              </button>
            ))}
          </div>

          {tab === "shifts" && (
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput
                value={filters.q}
                onChange={(val) => {
                  setFilters((f) => ({ ...f, q: val }));
                  setPage(1);
                }}
                placeholder="Tìm tên ca..."
              />
              <div className="w-44">
                <select
                  aria-label="Trạng thái"
                  value={filters.status}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, status: e.target.value }));
                    setPage(1);
                  }}
                  className={inputClass}
                >
                  <option value="all">Tất cả trạng thái</option>
                  {Object.entries(SHIFT_STATUS).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              {canClear && (
                <Button type="button" variant="ghost" size="lg" onClick={resetFilters}>
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <p className="py-16 text-center text-[15px] text-slate-500">Đang tải cấu hình...</p>
        ) : tab === "shifts" ? (
          <ShiftTemplatesTab
            shifts={shifts}
            rows={rows}
            pageRows={pageRows}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
        ) : tab === "constraints" ? (
          <div className="pb-6">
            <ConstraintsTab saved={constraints} shifts={shifts} onSave={saveConstraints} saving={saving} />
          </div>
        ) : (
          <div className="pb-6">
            <GeneralSettingsTab saved={generalSettings} onSave={saveGeneral} saving={saving} />
          </div>
        )}
      </PageCard>

      {editing && (
        <ShiftFormModal
          key={editing === "new" ? "new" : editing.id}
          shift={editing === "new" ? undefined : editing}
          shifts={shifts}
          onClose={() => setEditing(null)}
          onSubmit={saveShift}
        />
      )}
      <DeleteShiftModal
        shift={deleting}
        lastActive={deleting?.status === "active" && activeCount === 1}
        isUsed={isShiftUsedInSchedule(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={deleteShift}
        onPause={pauseShift}
      />
      {toast && <Toast message={toast} />}
    </>
  );
}