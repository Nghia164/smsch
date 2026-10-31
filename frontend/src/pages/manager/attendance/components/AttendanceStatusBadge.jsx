import { STATUS_META, STATUS_HEX, STATUS_VI } from "../attendanceData";

export const Dot = ({ status, size = 10 }) => (
  <span
    className="inline-block shrink-0 rounded-full"
    style={{ width: size, height: size, backgroundColor: STATUS_HEX[status] || "#94a3b8" }}
  />
);

export function PlainStatus({ status }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[14px] font-medium text-slate-900">
      <Dot status={status} />
      {STATUS_VI[status] ?? status}
    </span>
  );
}

export function StatusBadge({ status }) {
  const m = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${
        m?.badge || "bg-slate-100 text-slate-700"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m?.dot || "bg-slate-400"}`} />
      {status}
    </span>
  );
}
