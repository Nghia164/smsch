import Block from "./Block";
import { Avatar } from "../../../../components/TableKit";
import { DAYS, SHIFT_OPTIONS, SHIFT_STYLE } from "../dashboardData";

export default function ScheduleWeekBlock({ weekLabel = "", schedule = [] }) {
  const todayIdx = (new Date().getDay() + 6) % 7; // 0 = Thứ 2

  return (
    <Block
      title="Lịch làm việc tuần này"
      subtitle={`${weekLabel} • ${schedule.length} nhân viên`}
      action={
        <div className="hidden items-center gap-3 text-[13px] text-slate-600 sm:flex">
          {SHIFT_OPTIONS.map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: SHIFT_STYLE[s].dot }} />
              {s}
            </span>
          ))}
        </div>
      }
    >
      <div className="max-h-[380px] overflow-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-x-1 border-spacing-y-1.5">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-20 w-48 bg-white" />
              {DAYS.map((d, i) => (
                <th key={d} className="sticky top-0 z-10 bg-white pb-1 text-center text-[13px] font-medium">
                  <span
                    className={
                      i === todayIdx
                        ? "rounded-full bg-slate-900 px-2.5 py-1 font-semibold text-white"
                        : "text-slate-500"
                    }
                  >
                    {i === todayIdx ? "Hôm nay" : d}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedule.map((row) => (
              <tr key={row.employee}>
                <td className="sticky left-0 z-10 bg-white pr-2">
                  <span className="flex items-center gap-2.5">
                    <Avatar name={row.employee} />
                    <span className="truncate text-[14px] font-medium text-slate-900">{row.employee}</span>
                  </span>
                </td>
                {row.shifts.map((s, i) => {
                  const st = s ? SHIFT_STYLE[s] : null;
                  return (
                    <td
                      key={i}
                      className={`rounded-lg px-1.5 py-2 text-center text-[13px] font-medium ${
                        i === todayIdx && !s ? "bg-slate-50" : ""
                      }`}
                      style={st ? { background: st.bg, color: st.fg } : { color: "#cbd5e1" }}
                    >
                      {s ?? "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Block>
  );
}
