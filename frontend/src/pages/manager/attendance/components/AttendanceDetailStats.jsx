import { STATUS_LIST, STATUS_VI, fmtDuration } from "../attendanceData";
import { Dot } from "./AttendanceStatusBadge";

export default function AttendanceDetailStats({ stats }) {
  return (
    <>
      {/* Thẻ thống kê */}
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5">
          <span className="text-[15px] font-medium text-slate-800">Tổng giờ làm</span>
          <span className="text-[18px] font-semibold tabular-nums text-slate-900">
            {fmtDuration(stats.actualMin)}
          </span>
        </div>
        {STATUS_LIST.map((s) => (
          <div key={s} className="flex items-center justify-between rounded-lg border border-slate-300 px-4 py-2.5">
            <span className="flex items-center gap-2 text-[15px] text-slate-800">
              <Dot status={s} />
              {STATUS_VI[s]}
            </span>
            <span className="text-[18px] font-semibold tabular-nums text-slate-900">
              {stats.counts[s]}
              <span className="ml-1 text-[14px] font-normal text-slate-600">ca</span>
            </span>
          </div>
        ))}
      </div>

      {/* Chú thích màu */}
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200 pt-5">
        <span className="flex items-center gap-2 text-[14px] text-slate-700">
          <span className="inline-block h-2.5 w-5 rounded-sm bg-slate-200" />
          Khung giờ của ca
        </span>
        {STATUS_LIST.map((s) => (
          <span key={s} className="flex items-center gap-2 text-[14px] text-slate-700">
            <Dot status={s} />
            {STATUS_VI[s]}
          </span>
        ))}
      </div>
    </>
  );
}
