import Button from "../../../../components/Button";
import { toMin, fmtDuration, schedParts, dayLabel } from "../attendanceData";
import { DayBar } from "./AttendanceDayBar";
import { PlainStatus } from "./AttendanceStatusBadge";

/**
 * Hiển thị một ca làm việc trong chi tiết chấm công của nhân viên
 */
export default function AttendanceShiftItem({ row: r, onAdjust, onHistory }) {
  const [s, e] = schedParts(r);
  const a = toMin(r.checkIn);
  const b = toMin(r.checkOut);

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[15px] font-semibold text-slate-900">
          {dayLabel(r.date)}
          <span className="ml-2 text-[14px] font-normal text-slate-600">
            Ca {String(r.shiftName).toLowerCase()} • {r.scheduled}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[14px] text-slate-600">
            Thời lượng: <b className="font-semibold text-slate-900">{a != null && b != null ? fmtDuration(b - a) : "—"}</b>
          </span>
          <PlainStatus status={r.status} />
          {r.adjusted && <span title="Đã chỉnh sửa" className="text-[13px] font-medium text-slate-500">✎ Đã sửa</span>}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[64px_1fr_64px] items-center gap-3">
        <div>
          <p className="text-[12px] text-slate-500">Vào</p>
          <p className="text-[15px] font-semibold tabular-nums text-slate-900">{r.checkIn || "—"}</p>
        </div>
        <DayBar row={r} />
        <div className="text-right">
          <p className="text-[12px] text-slate-500">Ra</p>
          <p className="text-[15px] font-semibold tabular-nums text-slate-900">
            {r.checkOut || (r.status === "Missing-Checkout" ? "Chưa có" : "—")}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] text-slate-700">
          {r.lateMin > 0 && <span className="mr-4 font-medium text-slate-900">Đi trễ {r.lateMin} phút</span>}
          {r.earlyMin > 0 && <span className="font-medium text-slate-900">Về sớm {r.earlyMin} phút</span>}
          {!(r.lateMin > 0) && !(r.earlyMin > 0) && s != null && e != null && <span className="text-slate-500">Đúng khung giờ của ca</span>}
        </p>
        <div className="flex items-center gap-2">
          {r.adjusted && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onHistory(r)}>
              Lịch sử
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAdjust(r)}
            disabled={r.locked}
            title={r.locked ? "Kỳ lương đã chốt, không thể điều chỉnh" : undefined}
          >
            Điều chỉnh
          </Button>
        </div>
      </div>
    </li>
  );
}
