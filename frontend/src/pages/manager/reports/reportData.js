export const REPORT_TYPES = [
  { value: "roster", label: "Lịch làm việc", to: "/manager/schedule", link: "Xem lịch làm việc" },
  { value: "hours", label: "Tổng hợp giờ làm", to: "/manager/work-hours", link: "Xem chi tiết giờ làm" },
  { value: "attendance", label: "Đối soát chấm công", to: "/manager/attendance", link: "Xem chi tiết chấm công" },
  { value: "payroll", label: "Bảng lương", to: "/manager/payroll", link: "Xem chi tiết bảng lương" },
  { value: "dashboard", label: "Dashboard", to: "/manager/dashboard", link: "Xem Dashboard" },
];

export const PREVIEW_LIMIT = 50;
export const AXIS_TICK = { fill: "#64748B", fontSize: 12 };
export const GRID_COLOR = "#E2E8F0";
export const PIE_COLORS = ["#6EE7B7", "#FCD34D", "#93C5FD", "#FDA4AF", "#C4B5FD"]; // On-Time, Late, Early-Departure, Absent, Missing-Checkout

export const fmtNum = (n) => n.toLocaleString("vi-VN");
export const fmtMoney = (n) => `${fmtNum(n)} đ`;

// Hiển thị giá trị theo kiểu cột (file Excel luôn ghi số thật)
export function fmtCell(col, v) {
  if (v === undefined || v === null || v === "") return "";
  if (typeof v !== "number") return v;
  const s = fmtNum(v);
  if (col.format === "money") return `${s} đ`;
  if (col.format === "hours") return `${s} giờ`;
  if (col.format === "signed") return `${v > 0 ? "+" : ""}${s}`;
  return s;
}
