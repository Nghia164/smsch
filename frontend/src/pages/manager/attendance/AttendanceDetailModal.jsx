import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { initialsOf } from "../../../utils/format";
import {
  STATUS_LIST,
  toMin,
  dateKey,
  roleVi,
  AX_TICKS,
  pct,
  schedParts,
} from "./attendanceData";
import AttendanceShiftItem from "./components/AttendanceShiftItem";
import AttendanceAdjustModal from "./components/AttendanceAdjustModal";
import AttendanceHistoryModal from "./components/AttendanceHistoryModal";
import AttendanceDetailStats from "./components/AttendanceDetailStats";

/**
 * Hộp thoại chi tiết chấm công nhân viên (US24 / US25)
 */
export default function AttendanceDetailModal({
  open,
  employeeId,
  focusRowId,
  employees = [],
  rows = [],
  periodLabel,
  onClose,
  onNavigate,
  onSaved,
}) {
  const [adjusting, setAdjusting] = useState(null);
  const [historyRow, setHistoryRow] = useState(null);

  const openAdjust = (row) => setAdjusting(row);
  const openHistory = (row) => setHistoryRow(row);

  useEffect(() => {
    if (!open || !focusRowId) return;
    const r = rows.find((x) => x.id === focusRowId);
    if (r) queueMicrotask(() => openAdjust(r));
  }, [open, focusRowId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && !adjusting && !historyRow && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, adjusting, historyRow, onClose]);

  const list = useMemo(
    () =>
      rows
        .filter((r) => r.employeeId === employeeId)
        .sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date)) || (schedParts(b)[0] ?? 0) - (schedParts(a)[0] ?? 0)),
    [rows, employeeId]
  );

  const stats = useMemo(() => {
    const counts = Object.fromEntries(STATUS_LIST.map((s) => [s, 0]));
    let actualMin = 0;
    list.forEach((r) => {
      counts[r.status] = (counts[r.status] ?? 0) + 1;
      const a = toMin(r.checkIn);
      const b = toMin(r.checkOut);
      if (a != null && b != null && b > a) actualMin += b - a;
    });
    return { counts, actualMin };
  }, [list]);

  if (!open || !employeeId) return null;

  const emp = employees.find((e) => e.id === employeeId);
  const name = emp?.name ?? list[0]?.employeeName ?? employeeId;
  const idx = employees.findIndex((e) => e.id === employeeId);
  const go = (step) => {
    if (idx < 0 || employees.length === 0) return;
    onNavigate?.(employees[(idx + step + employees.length) % employees.length].id);
  };

  const navBtn = "grid h-9 w-9 place-items-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40";

  return (
    <>
      <div
        className="fixed inset-0 z-[45] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:items-center"
        onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
      >
        <div role="dialog" aria-modal="true" aria-label={`Chi tiết chấm công - ${name}`} className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-[15px] font-semibold text-slate-700">{initialsOf(name)}</span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-[17px] font-semibold text-slate-900">
                  {name}
                  {emp?.roleTag && <span className="rounded border border-slate-300 px-2 py-0.5 text-[12px] font-medium text-slate-700">{roleVi(emp.roleTag)}</span>}
                </p>
                <p className="text-[14px] text-slate-600">{employeeId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1 text-[14px] tabular-nums text-slate-600">{idx >= 0 ? `${idx + 1} / ${employees.length}` : ""}</span>
              <button type="button" className={navBtn} onClick={() => go(-1)} disabled={employees.length < 2} aria-label="Nhân viên trước">
                <ChevronLeft size={16} />
              </button>
              <button type="button" className={navBtn} onClick={() => go(1)} disabled={employees.length < 2} aria-label="Nhân viên sau">
                <ChevronRight size={16} />
              </button>
              <button type="button" className={navBtn} onClick={onClose} aria-label="Đóng">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto px-6 py-5">
            <p className="text-[14px] text-slate-600">
              Kỳ xem: <span className="font-semibold text-slate-900">{periodLabel ?? "—"}</span> • {list.length} ca
            </p>

            {/* Thống kê và chú thích */}
            <AttendanceDetailStats stats={stats} />

            {list.length === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-slate-300 py-10 text-center text-[14px] text-slate-500">Không có ca nào trong kỳ đã chọn.</p>
            ) : (
              <>
                {/* Trục giờ */}
                <div className="mt-4 grid grid-cols-[64px_1fr_64px] gap-3">
                  <span />
                  <div className="relative h-4">
                    {AX_TICKS.map((h) => (
                      <span key={h} className="absolute -translate-x-1/2 text-[12px] tabular-nums text-slate-500" style={{ left: `${pct(h * 60)}%` }}>
                        {String(h).padStart(2, "0")}:00
                      </span>
                    ))}
                  </div>
                  <span />
                </div>

                {/* Danh sách ca làm việc theo ngày */}
                <ul className="divide-y divide-slate-200">
                  {list.map((r) => (
                    <AttendanceShiftItem
                      key={r.id}
                      row={r}
                      onAdjust={openAdjust}
                      onHistory={openHistory}
                    />
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Form điều chỉnh (US25) */}
      {adjusting && (
        <AttendanceAdjustModal
          key={adjusting.id}
          adjusting={adjusting}
          onClose={() => setAdjusting(null)}
          onSaved={onSaved}
        />
      )}

      {/* Lịch sử điều chỉnh */}
      {historyRow && (
        <AttendanceHistoryModal
          key={historyRow.id}
          historyRow={historyRow}
          onClose={() => setHistoryRow(null)}
        />
      )}
    </>
  );
}