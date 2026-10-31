import { STATUS_VI, STATUS_HEX, toMin, schedParts, pct } from "../attendanceData";

export function Segment({ from, to, className = "", style }) {
  if (from == null || to == null || to <= from) return null;
  return <div className={`absolute inset-y-0 ${className}`} style={{ left: `${pct(from)}%`, width: `${pct(to) - pct(from)}%`, ...style }} />;
}

/**
 * Thanh thời gian hiển thị ca làm việc
 */
export function DayBar({ row }) {
  const [s, e] = schedParts(row);
  const inMin = toMin(row.checkIn);
  const outMin = toMin(row.checkOut);
  const color = STATUS_HEX[row.status] || "#94a3b8";
  const absent = row.status === "Absent";
  const missing = row.status === "Missing-Checkout";

  return (
    <div
      className="relative h-7 overflow-hidden rounded bg-slate-100"
      role="img"
      aria-label={`${STATUS_VI[row.status] ?? row.status}: ${row.checkIn || "—"} đến ${row.checkOut || "—"}`}
    >
      <Segment from={s} to={e} className="bg-slate-200" />
      {absent && (
        <>
          <Segment from={s} to={e} style={{ backgroundColor: color }} />
          <span className="absolute inset-0 grid place-items-center text-[13px] font-semibold text-white">Vắng mặt</span>
        </>
      )}
      {!absent && inMin != null && (
        missing ? (
          <Segment from={inMin} to={e} style={{ background: `repeating-linear-gradient(45deg,${color},${color} 4px,#ddd6fe 4px,#ddd6fe 8px)` }} />
        ) : (
          <Segment from={inMin} to={outMin} style={{ backgroundColor: color }} />
        )
      )}
    </div>
  );
}
