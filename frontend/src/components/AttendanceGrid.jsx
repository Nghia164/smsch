import { useMemo } from "react";

// US21-22 - Bảng chấm công dạng lưới: mỗi hàng một nhân viên, mỗi cột một ngày.
// Ô tô màu theo trạng thái, hiện giờ vào/ra; bấm vào ô để điều chỉnh (US22).
// Cột "Nhân viên" và hàng ngày dính khi cuộn. Tối đa 31 ngày.
//
// Props:
//   from, to     : khoảng ngày (YYYY-MM-DD)
//   employees    : [{ id, name, roleTag }]
//   rows         : bản ghi chấm công { id, iso, employeeId, shiftName, scheduled, checkIn, checkOut,
//                  status, adjusted, locked, actualMin, ... }
//   status       : bộ lọc trạng thái ("all" hoặc tên trạng thái) - ô không khớp sẽ mờ đi
//   onSelect(row): gọi khi bấm vào một ô còn điều chỉnh được

const MAX_DAYS = 31;
// Độ rộng cột (px): tên nhân viên + 2 cột tổng cố định, các cột ngày chia đều phần còn lại
const COL_NAME = 200;
const COL_SHIFTS = 72;
const COL_HOURS = 84;
const COL_DAY_MIN = 64;
const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

// Màu ô theo trạng thái (US21)
const CELL = {
  "On-Time": "bg-emerald-100 text-emerald-800",
  Late: "bg-amber-100 text-amber-800",
  "Early-Departure": "bg-sky-100 text-sky-800",
  Absent: "bg-rose-100 text-rose-700",
  "Missing-Checkout": "bg-violet-100 text-violet-800",
};
const DOT = {
  "On-Time": "bg-emerald-400",
  Late: "bg-amber-400",
  "Early-Departure": "bg-sky-400",
  Absent: "bg-rose-400",
  "Missing-Checkout": "bg-violet-400",
};

const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function listDays(from, to) {
  if (!from || !to) return [];
  const out = [];
  const end = new Date(`${to}T00:00:00`);
  for (let d = new Date(`${from}T00:00:00`); d <= end && out.length <= MAX_DAYS; d.setDate(d.getDate() + 1)) {
    out.push(toISO(d));
  }
  return out;
}

function Cell({ r, dim, onSelect }) {
  const missing = r.status === "Missing-Checkout";
  const absent = r.status === "Absent";
  const tip = [
    `Ca ${r.shiftName} (${r.scheduled})`,
    absent ? "Vắng mặt" : `Vào ${r.checkIn || "—"} • Ra ${r.checkOut || "—"}`,
    r.status,
    r.adjusted ? "Đã chỉnh sửa" : null,
    r.locked ? "Bản ghi đã khóa" : "Bấm để điều chỉnh",
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <button
      type="button"
      onClick={() => onSelect?.(r)}
      disabled={r.locked}
      title={tip}
      className={`relative h-12 w-full rounded-md px-1 text-[10px] leading-tight transition ${CELL[r.status]} ${
        dim ? "opacity-25" : ""
      } ${r.locked ? "cursor-not-allowed opacity-60" : "hover:ring-2 hover:ring-blue-300"}`}
    >
      {absent ? (
        <span className="block text-[11px] font-semibold">Vắng</span>
      ) : (
        <>
          <span className="block text-[11px] font-semibold">{r.checkIn || "--:--"}</span>
          <span className="block opacity-80">{r.checkOut || (missing ? "?" : "")}</span>
        </>
      )}
      {r.adjusted && <span className="absolute right-0.5 top-0 text-[9px] opacity-70">✎</span>}
    </button>
  );
}

export default function AttendanceGrid({ from, to, employees, rows, status = "all", onSelect }) {
  const days = useMemo(() => listDays(from, to), [from, to]);
  const today = toISO(new Date());

  const byKey = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => m.set(`${r.employeeId}_${r.iso}`, r));
    return m;
  }, [rows]);

  // Tổng mỗi nhân viên: số ca và giờ làm thực tế (cộng phút rồi đổi giờ - khớp màn Tổng hợp giờ làm)
  const totals = useMemo(() => {
    const t = {};
    rows.forEach((r) => {
      const cur = t[r.employeeId] ?? { shifts: 0, min: 0 };
      cur.shifts += 1;
      cur.min += r.actualMin ?? 0;
      t[r.employeeId] = cur;
    });
    return t;
  }, [rows]);

  if (days.length > MAX_DAYS) {
    return (
      <p className="px-4 py-10 text-center text-sm text-slate-400">
        Khoảng ngày dài hơn {MAX_DAYS} ngày, dạng lưới chỉ hỗ trợ tối đa {MAX_DAYS} ngày. Vui lòng chọn khoảng ngắn hơn hoặc
        chuyển sang dạng Danh sách.
      </p>
    );
  }

  return (
    <div>
      {/* Chú thích màu */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-slate-100 px-4 py-2.5 text-xs text-slate-500">
        {Object.keys(CELL).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${DOT[s]}`} />
            {s}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-200" />
          Không có ca
        </span>
        <span className="ml-auto text-slate-400">✎ đã chỉnh sửa</span>
      </div>

      <div className="overflow-auto" style={{ maxHeight: "min(60vh, 520px)" }}>
        <table
          className="w-full table-fixed border-separate border-spacing-0 text-xs"
          style={{ minWidth: COL_NAME + COL_SHIFTS + COL_HOURS + days.length * COL_DAY_MIN }}
        >
          <thead>
            <tr>
              <th
                style={{ width: COL_NAME }}
                className="sticky left-0 top-0 z-30 border-b border-r border-slate-200 bg-white px-4 py-2.5 text-left text-[13px] font-semibold text-[#59667a]"
              >
                Nhân viên
              </th>
              {days.map((d) => {
                const dt = new Date(`${d}T00:00:00`);
                const wd = dt.getDay();
                const weekend = wd === 0 || wd === 6;
                return (
                  <th
                    key={d}
                    className={`sticky top-0 z-20 border-b border-slate-200 px-1 py-2 text-center ${
                      d === today ? "bg-blue-50" : "bg-white"
                    }`}
                  >
                    <span className={`block text-[12px] font-semibold ${weekend ? "text-rose-500" : "text-[#59667a]"}`}>
                      {WEEKDAYS[wd]}
                    </span>
                    <span className="block text-[11px] font-normal text-slate-400">
                      {pad(dt.getDate())}/{pad(dt.getMonth() + 1)}
                    </span>
                  </th>
                );
              })}
              <th
                style={{ width: COL_SHIFTS }}
                className="sticky top-0 z-20 border-b border-l border-slate-200 bg-white px-2 py-2.5 text-center text-[13px] font-semibold text-[#59667a]"
              >
                Số ca
              </th>
              <th
                style={{ width: COL_HOURS }}
                className="sticky top-0 z-20 border-b border-slate-200 bg-white px-2 py-2.5 text-center text-[13px] font-semibold text-[#59667a]"
              >
                Giờ làm
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => {
              const t = totals[e.id] ?? { shifts: 0, min: 0 };
              return (
                <tr key={e.id}>
                  <td className="sticky left-0 z-10 border-b border-r border-slate-100 bg-white px-4 py-2">
                    <span className="block text-[13px] font-medium text-[#141f33]">{e.name}</span>
                    <span className="block text-[11px] text-slate-400">
                      {e.id}
                      {e.roleTag ? ` • ${e.roleTag}` : ""}
                    </span>
                  </td>
                  {days.map((d) => {
                    const r = byKey.get(`${e.id}_${d}`);
                    return (
                      <td key={d} className={`border-b border-slate-100 p-1 ${d === today ? "bg-blue-50/40" : ""}`}>
                        {r ? (
                          <Cell r={r} dim={status !== "all" && r.status !== status} onSelect={onSelect} />
                        ) : (
                          <div className="h-12 rounded-md bg-slate-50" />
                        )}
                      </td>
                    );
                  })}
                  <td className="border-b border-l border-slate-100 px-2 py-2 text-center tabular-nums text-[#2e384a]">
                    {t.shifts}
                  </td>
                  <td className="border-b border-slate-100 px-2 py-2 text-center font-semibold tabular-nums text-[#141f33]">
                    {(Math.round(t.min / 6) / 10).toLocaleString("vi-VN")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}