// Hàm định dạng dùng chung toàn hệ thống
export const pad = (n) => String(n).padStart(2, "0");

export const formatDate = (d) => {
  if (!d) return "—";
  if (typeof d === "string" && d.includes("-")) {
    const [y, m, day] = d.split("-");
    if (y && m && day) return `${day}/${m}/${y}`;
  }
  const date = new Date(d);
  return isNaN(date) ? String(d) : `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};
export const fmtDate = formatDate;

export const formatTime = (d) =>
  new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

export const formatNumber = (n) => (n == null ? "0" : Number(n).toLocaleString("vi-VN"));
export const fmtNum = formatNumber;

export const formatMoney = (n) => `${formatNumber(n)} ₫`;
export const fmtMoney = formatMoney;

export const formatHours = (h) => (h || 0).toLocaleString("vi-VN", { maximumFractionDigits: 1 });
export const fmtHours = formatHours;

export const initialsOf = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
