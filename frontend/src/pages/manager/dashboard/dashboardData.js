import { formatMoney, formatNumber } from "../../../utils/format";

export const PERIODS = [
  { value: "week", label: "Tuần này" },
  { value: "month", label: "Tháng này" },
  { value: "range", label: "Tùy chọn" },
];

export const SHIFT_OPTIONS = ["Sáng", "Chiều", "Tối"];
export const DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export const SHIFT_STYLE = {
  "Sáng": { bg: "#e0f2fe", fg: "#0369a1", dot: "#0ea5e9" },
  "Chiều": { bg: "#e0e7ff", fg: "#3730a3", dot: "#6366f1" },
  "Tối": { bg: "#ede9fe", fg: "#5b21b6", dot: "#8b5cf6" },
};

// Màu biểu đồ trung tính
export const C = {
  grid: "#e2e8f0",
  muted: "#64748b",
  ink: "#0f172a",
  soft: "#cbd5e1",
  main: "#334155",
};

export const AXIS_TICK = { fill: C.muted, fontSize: 12 };

export const TOOLTIP_STYLE = {
  borderRadius: 10,
  border: "none",
  background: C.ink,
  boxShadow: "0 8px 24px rgba(15,23,42,0.18)",
  fontSize: 12.5,
};

export const TOOLTIP_TEXT = {
  itemStyle: { color: "#fff" },
  labelStyle: { color: "#fff" },
};

export const fmtNum = formatNumber;
export const fmtMoney = formatMoney;
