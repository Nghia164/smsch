// Hằng số và cấu hình dùng chung cho module Chấm công (US24 / US25)

export const STATUS_META = {
  "On-Time": { badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500", tint: "bg-emerald-50 text-emerald-600", num: "text-emerald-600", ring: "ring-emerald-300", icon: "clipboardCheck" },
  Late: { badge: "bg-amber-50 text-amber-700", dot: "bg-amber-500", tint: "bg-amber-50 text-amber-600", num: "text-amber-600", ring: "ring-amber-300", icon: "clock" },
  "Early-Departure": { badge: "bg-sky-50 text-sky-700", dot: "bg-sky-500", tint: "bg-sky-50 text-sky-600", num: "text-sky-600", ring: "ring-sky-300", icon: "calendar" },
  Absent: { badge: "bg-rose-50 text-rose-700", dot: "bg-rose-500", tint: "bg-rose-50 text-rose-600", num: "text-rose-600", ring: "ring-rose-300", icon: "fileText" },
  "Missing-Checkout": { badge: "bg-violet-50 text-violet-700", dot: "bg-violet-500", tint: "bg-violet-50 text-violet-600", num: "text-violet-600", ring: "ring-violet-300", icon: "userPlus" },
};

export const STATUS_LIST = Object.keys(STATUS_META);

export const STATUS_VI = {
  "On-Time": "Đúng giờ",
  Late: "Đi trễ",
  "Early-Departure": "Về sớm",
  Absent: "Vắng mặt",
  "Missing-Checkout": "Thiếu giờ ra",
};

export const STATUS_HEX = {
  "On-Time": "#10b981",
  Late: "#f59e0b",
  "Early-Departure": "#0ea5e9",
  Absent: "#f43f5e",
  "Missing-Checkout": "#8b5cf6",
};

export const STATUS_ICON = {
  "On-Time": "clipboardCheck",
  Late: "clock",
  "Early-Departure": "calendar",
  Absent: "fileText",
  "Missing-Checkout": "userPlus",
};

export const PERIOD_OPTIONS = [
  { value: "today", label: "Hôm nay" },
  { value: "week", label: "Tuần này" },
  { value: "range", label: "Tùy chọn" },
];

export const ROLE_VI = {
  Shift_Leader: "Quản lý ca",
  Barista: "Pha chế",
  Cashier: "Thu ngân",
  Waiter: "Phục vụ",
  Manager: "Quản lý",
};

export const roleVi = (r) => ROLE_VI[r] ?? String(r).replace(/_/g, " ");

export const toMin = (hhmm) => {
  if (!hhmm || !String(hhmm).includes(":")) return null;
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
};

export const fmtDuration = (min) =>
  min == null || min < 0 ? "—" : `${Math.floor(min / 60)}g${String(min % 60).padStart(2, "0")}`;

export const pad = (n) => String(n).padStart(2, "0");
export const fmtDate = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const dateKey = (vn) => vn.split("/").reverse().join("-");

export const AX_START = 6 * 60;
export const AX_END = 23 * 60;
export const AX_TICKS = [6, 10, 14, 18, 22];

export const pct = (m) => Math.min(100, Math.max(0, ((m - AX_START) / (AX_END - AX_START)) * 100));

export const schedParts = (r) => String(r.scheduled ?? "").split(/\s*[-–]\s*/).map(toMin);

export function dayLabel(vn) {
  const [d, m, y] = vn.split("/").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today - date) / 86400000);
  if (diff === 0) return "Hôm nay";
  if (diff === 1) return "Hôm qua";
  const names = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  return `${names[date.getDay()]}, ${vn.slice(0, 5)}`;
}
