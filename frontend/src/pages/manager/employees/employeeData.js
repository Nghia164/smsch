export const STATUSES = ["Đang làm việc", "Nghỉ phép", "Nghỉ việc"];
export const STATUS_HEX = {
  "Đang làm việc": "#10b981",
  "Nghỉ phép": "#f59e0b",
  "Nghỉ việc": "#94a3b8",
};
export const PAGE_SIZES = [7, 10, 20];

export const fmtBirth = (iso) => (iso ? iso.split("-").reverse().join("/") : "—");
