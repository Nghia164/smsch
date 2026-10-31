/* eslint-disable react-refresh/only-export-components */
import { Person, StatusPill, RowActions } from "../../../components/TableKit";
import { STATUS_VI, STATUS_HEX, toMin, fmtDuration } from "./attendanceData";

// "08:05 ····· 7g55 ····· 16:00"
export function InOut({ r }) {
  if (r.status === "Absent") return <span className="text-slate-400">Không có dữ liệu</span>;
  const a = toMin(r.checkIn);
  const b = toMin(r.checkOut);
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap tabular-nums">
      <span>{r.checkIn || "—"}</span>
      <span className="inline-flex items-center gap-1.5 text-[12px] text-slate-400">
        <span className="w-5 border-t border-dotted border-slate-300" />
        {a != null && b != null ? fmtDuration(b - a) : "—"}
        <span className="w-5 border-t border-dotted border-slate-300" />
      </span>
      {r.checkOut ? <span>{r.checkOut}</span> : <span className="font-medium text-slate-900">Chưa có giờ ra</span>}
    </span>
  );
}

/**
 * Định nghĩa các cột cho bảng Đối soát chấm công (Table)
 */
export function getAttendanceColumns({ onOpenDetail }) {
  const menuItems = (r) => [
    { label: "Xem chi tiết", onClick: () => onOpenDetail({ employeeId: r.employeeId }) },
    {
      label: r.locked ? "Điều chỉnh (kỳ lương đã chốt)" : "Điều chỉnh",
      disabled: r.locked,
      onClick: () => onOpenDetail({ employeeId: r.employeeId, rowId: r.id }),
    },
  ];

  return [
    { key: "employee", label: "Nhân viên", render: (r) => <Person name={r.employeeName} sub={r.employeeId} /> },
    { key: "date", label: "Ngày", className: "whitespace-nowrap", render: (r) => r.date },
    {
      key: "shift",
      label: "Ca",
      className: "whitespace-nowrap",
      render: (r) => (
        <>
          {r.shiftName}
          <span className="block text-[12px] text-slate-500">{r.scheduled}</span>
        </>
      ),
    },
    { key: "inout", label: "Giờ vào – ra", render: (r) => <InOut r={r} /> },
    {
      key: "late",
      label: "Đi trễ / Về sớm",
      className: "whitespace-nowrap",
      render: (r) =>
        r.lateMin > 0 || r.earlyMin > 0 ? (
          <span className="font-medium">
            {r.lateMin > 0 && <span className="block">Đi trễ {r.lateMin} phút</span>}
            {r.earlyMin > 0 && <span className="block">Về sớm {r.earlyMin} phút</span>}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <StatusPill hex={STATUS_HEX[r.status]}>{STATUS_VI[r.status] ?? r.status}</StatusPill>
          {r.adjusted && <span title="Đã chỉnh sửa" className="text-[12px] text-slate-500">✎ Đã sửa</span>}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (r) => <RowActions label={`Thao tác với ca của ${r.employeeName}`} items={menuItems(r)} />,
    },
  ];
}
