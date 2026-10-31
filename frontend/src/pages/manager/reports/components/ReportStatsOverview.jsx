import { AlertTriangle, CalendarCheck, Clock, UserX, Wallet } from "lucide-react";
import { fmtNum, fmtMoney } from "../reportData";

function StatCell({ icon: Icon, label, value, note }) {
  return (
    <div className="flex items-center gap-3 px-5 py-5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm">
        <Icon size={18} strokeWidth={1.8} />
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-medium text-slate-700">{label}</span>
        <span className="flex flex-wrap items-baseline gap-x-2">
          <b className="text-[24px] font-semibold leading-tight tabular-nums text-slate-900">{value}</b>
          <span className="text-[13px] text-slate-600">{note}</span>
        </span>
      </span>
    </div>
  );
}

export default function ReportStatsOverview({ overview }) {
  if (!overview || overview.empty) return null;
  const c = overview.cards;

  return (
    <div className="grid border-b border-slate-200 sm:grid-cols-2 xl:grid-cols-5 xl:divide-x xl:divide-slate-200">
      <StatCell
        icon={Clock}
        label="Giờ làm thực tế"
        value={`${fmtNum(c.actualHours)}h`}
        note={`Theo lịch ${fmtNum(c.scheduledHours)}h`}
      />
      <StatCell
        icon={Wallet}
        label="Tổng chi phí lương"
        value={fmtMoney(c.payrollCost)}
        note={`${fmtNum(c.totalShifts)} ca`}
      />
      <StatCell
        icon={CalendarCheck}
        label="Số ca đã làm"
        value={fmtNum(c.totalShifts)}
        note="ca"
      />
      <StatCell
        icon={AlertTriangle}
        label="Tỷ lệ đi trễ"
        value={`${fmtNum(c.lateRate)}%`}
        note={`${c.lateCount}/${c.totalShifts} ca`}
      />
      <StatCell
        icon={UserX}
        label="Tỷ lệ vắng"
        value={`${fmtNum(c.absentRate)}%`}
        note={`${c.absentCount}/${c.totalShifts} ca`}
      />
    </div>
  );
}
