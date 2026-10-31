import { Plus } from "lucide-react";
import Button from "../../../components/Button";
import TablePagination from "../../../components/TablePagination";
import { RowActions, StatusPill } from "../../../components/TableKit";
import { inputClass } from "../../../components/FilterBar";
import { formatMoney } from "../../../utils/format";
import { ROLES, dayLabel, statusOf, weekdayOf, fmtDate } from "../../../utils/openShiftRules";
import { CancelOpenShiftModal, OpenShiftFormModal } from "./OpenShiftModals";
import ShiftDetailModal from "./ShiftDetailModal";
import { PAGE_SIZES, STATUS, TABS, prefillFromSchedule } from "./openShiftData";
import { useOpenShifts } from "./hooks/useOpenShifts";

const th = "px-4 py-3 text-left text-[13px] font-semibold text-slate-600";
const NOTICE = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
};

export default function OpenShiftPage() {
  const {
    fromSchedule,
    shifts,
    catalog,
    loading,
    loadError,
    filters,
    setFilters,
    resetFilters,
    page,
    setPage,
    pageSize,
    setPageSize,
    form,
    setForm,
    setDetailId,
    cancelling,
    setCancelling,
    notice,
    saveForm,
    confirmCancel,
    countOf,
    rows,
    pageCount,
    pageRows,
    canClear,
    openCount,
    detail,
    menuItems,
  } = useOpenShifts();

  return (
    <div className="flex min-h-[calc(100vh-9.75rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* TIÊU ĐỀ */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
        <div>
          <h1 className="text-[18px] font-semibold leading-tight text-slate-900">Ca trực mở</h1>
          <p className="mt-1 text-[14px] text-slate-500">
            Các ca còn thiếu nhân viên. Nhân viên đủ điều kiện tự nhận ca, ai nhận trước được trước. Đang mở:{" "}
            <b className="font-semibold tabular-nums text-slate-700">{openCount}</b> ca
          </p>
        </div>
        <Button type="button" size="lg" icon={<Plus size={16} />} onClick={() => setForm({ shift: null })}>
          Mở ca trực
        </Button>
      </div>

      <div className="flex flex-1 flex-col px-6">
        {notice && (
          <div role={notice.type === "error" ? "alert" : "status"} className={`mt-4 rounded-lg border px-4 py-3 text-[14px] ${NOTICE[notice.type]}`}>
            {notice.message}
          </div>
        )}

        {/* TAB TRẠNG THÁI + BỘ LỌC */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 pt-5">
          <div className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[14px]">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={filters.status === id}
                onClick={() => setFilters({ ...filters, status: id })}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${
                  filters.status === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {label}
                <span className="text-[12px] tabular-nums text-slate-400">{countOf(id)}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              placeholder="Tìm ca, ngày hoặc tên nhân viên..."
              aria-label="Tìm ca trực mở"
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-[14px] outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 sm:w-72"
            />
            <div className="w-44">
              <select aria-label="Role_Tag" value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })} className={inputClass}>
                <option value="all">Tất cả Role_Tag</option>
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            {canClear && (
              <Button type="button" variant="ghost" size="lg" onClick={resetFilters}>
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>

        {/* BẢNG */}
        {loading ? (
          <p className="py-16 text-center text-[15px] text-slate-500">Đang tải ca trực mở...</p>
        ) : loadError ? (
          <p role="alert" className="py-16 text-center text-[15px] text-rose-700">{loadError}</p>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-[15px] text-slate-500">
            {shifts.length === 0 ? "Chưa có ca trực mở nào. Bấm “Mở ca trực” để tạo." : "Không có ca trực mở phù hợp với bộ lọc hiện tại."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-[14px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className={`${th} rounded-l-lg`}>Ngày</th>
                  <th className={th}>Ca</th>
                  <th className={th}>Role_Tag</th>
                  <th className={th}>Thưởng</th>
                  <th className={th}>Đã nhận / Cần</th>
                  <th className={th}>Người nhận</th>
                  <th className={th}>Trạng thái</th>
                  <th className={`${th} rounded-r-lg`} />
                </tr>
              </thead>
              <tbody>
                {pageRows.map((s) => {
                  const st = statusOf(s);
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setDetailId(s.id)}
                      className="cursor-pointer border-b border-slate-100 text-slate-900 transition-colors last:border-0 hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className="block font-medium">{weekdayOf(s.date)}</span>
                        <span className="block text-[12px] text-slate-500">{fmtDate(s.date)}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className="block font-medium">{s.shiftName}</span>
                        <span className="block text-[12px] tabular-nums text-slate-500">{s.startTime} – {s.endTime}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">{s.role}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 tabular-nums">
                        {s.bonus > 0 ? formatMoney(s.bonus) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 tabular-nums">
                        {s.claims.length} / {s.needed}
                      </td>
                      <td className="px-4 py-3.5">
                        {s.claims.length > 0 ? s.claims.map((c) => c.name).join(", ") : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusPill hex={STATUS[st].hex}>{STATUS[st].label}</StatusPill>
                      </td>
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <RowActions label={`Thao tác với ca ${s.shiftName} ${dayLabel(s.date)}`} items={menuItems(s)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PHÂN TRANG */}
        <div className="mt-auto">
          {rows.length > 0 && (
            <TablePagination
              page={page}
              pageCount={pageCount}
              pageSize={pageSize}
              total={rows.length}
              unit="ca trực"
              pageSizes={PAGE_SIZES}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </div>
      </div>

      {form && !loading && (
        <OpenShiftFormModal
          key={form.shift?.id ?? "new"}
          shift={form.shift ?? undefined}
          shifts={shifts}
          catalog={catalog}
          prefill={fromSchedule && !form.shift ? prefillFromSchedule(fromSchedule, catalog) : undefined}
          onClose={() => setForm(null)}
          onSubmit={saveForm}
        />
      )}
      <ShiftDetailModal
        shift={detail}
        onClose={() => setDetailId(null)}
        onEdit={(s) => {
          setDetailId(null);
          setForm({ shift: s });
        }}
        onCancel={(s) => {
          setDetailId(null);
          setCancelling(s);
        }}
      />
      <CancelOpenShiftModal shift={cancelling} onClose={() => setCancelling(null)} onConfirm={confirmCancel} />
    </div>
  );
}