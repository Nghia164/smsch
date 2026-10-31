// Quy tắc nghiệp vụ của Ca trực mở. Dùng chung cho giao diện và service để hai bên luôn cùng một luật.
//
// Một ca trực mở = quán còn thiếu người ở (ngày, ca, Role_Tag). Nhân viên bấm "Nhận ca": AI NHẬN TRƯỚC ĐƯỢC TRƯỚC,
// không cần quản lý duyệt; đủ số người cần thì ca đóng lại. Trạng thái KHÔNG lưu cứng mà suy ra từ dữ liệu (statusOf):
//
//   open (đang mở) ──đủ người nhận──▶ filled (đã đủ người)
//        │
//        ├──quá giờ bắt đầu ca──────▶ closed (đã đóng)
//        └──quản lý hủy (chưa ai nhận)▶ cancelled (đã hủy, giữ lại để xem lịch sử)

// Role_Tag - cùng bộ với mocks/workHours.js (mockRoleTags)
export const ROLES = ["Shift_Leader", "Barista", "Cashier"];
export const MAX_NEEDED = 10;
export const MAX_NOTE = 200;

// ---------- ngày giờ ----------
const pad = (n) => String(n).padStart(2, "0");
const WEEKDAYS = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseISO = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const todayISO = (now = new Date()) => toISO(now);
export const addDaysISO = (iso, n) => {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
export const fmtDate = (iso) => iso.split("-").reverse().join("/");
export const weekdayOf = (iso) => WEEKDAYS[parseISO(iso).getDay()];
export const dayLabel = (iso) => `${weekdayOf(iso)}, ${fmtDate(iso)}`;

// Thời điểm ca bắt đầu
export const startOf = (s) => {
  const [h, m] = s.startTime.split(":").map(Number);
  const d = parseISO(s.date);
  d.setHours(h, m, 0, 0);
  return d;
};
export const overlaps = (a, b) => a.date === b.date && a.startTime < b.endTime && b.startTime < a.endTime;

// ---------- người nhận ca ----------
// s.claims = [{ id, employeeId, name, phone, claimedAt }] theo thứ tự nhận (người đầu tiên ở trước)
export const isClaimedBy = (s, employeeId) => (s.claims || []).some((c) => c.employeeId === employeeId);
export const approvedOf = (s) => s?.claims || s?.registrations?.filter((r) => r.status === "approved") || [];

// ---------- trạng thái ----------
export function statusOf(s, now = new Date()) {
  if (s.cancelled) return "cancelled";
  if (s.claims.length >= s.needed) return "filled";
  if (startOf(s) <= now) return "closed";
  return "open";
}

const WHY_NOT_OPEN = {
  filled: "Ca đã có đủ người nhận.",
  closed: "Ca đã quá giờ bắt đầu nên không còn nhận ca.",
  cancelled: "Ca đã bị hủy, chỉ lưu lại để xem lịch sử.",
};

// Chỉ ca đang mở mới sửa được. Đã có người nhận thì khóa ngày/ca/Role_Tag/tiền thưởng (đổi sẽ ảnh hưởng người đã nhận),
// chỉ cho đổi số lượng cần (không ít hơn số người đã nhận) và ghi chú.
export function getEditRule(s, now = new Date()) {
  const st = statusOf(s, now);
  if (st !== "open") return { allowed: false, reason: `Không thể sửa. ${WHY_NOT_OPEN[st]}` };
  const locked = s.claims.length > 0;
  return {
    allowed: true,
    locked,
    minNeeded: Math.max(1, s.claims.length),
    reason: locked ? "Ca đã có người nhận nên chỉ đổi được số lượng cần và ghi chú." : "",
  };
}

// Chỉ hủy được khi CHƯA CÓ NGƯỜI NHẬN (tài liệu 2.14). Hủy = chuyển "Đã hủy", vẫn giữ lại để xem lịch sử.
export function getCancelRule(s, now = new Date()) {
  const st = statusOf(s, now);
  if (st === "cancelled") return { allowed: false, reason: `Không thể hủy. ${WHY_NOT_OPEN.cancelled}` };
  if (s.claims.length > 0) return { allowed: false, reason: "Không thể hủy. Ca đã có nhân viên nhận, chỉ hủy được khi chưa có người nhận." };
  if (st === "closed") return { allowed: false, reason: `Không thể hủy. ${WHY_NOT_OPEN.closed}` };
  return { allowed: true };
}

// ---------- kiểm tra dữ liệu khi tạo / sửa ----------
// p = { id?, date, shiftCode, shiftName, startTime, endTime, role, needed, bonus?, note? }. Trả về câu báo lỗi hoặc "".
export function validateOpenShift(p, shifts, now = new Date()) {
  const self = shifts.find((s) => s.id === p.id);
  const needed = Number(p.needed);
  const bonus = p.bonus === "" || p.bonus == null ? 0 : Number(p.bonus);

  if (!p.date) return "Vui lòng chọn ngày trực.";
  if (!p.shiftCode) return "Vui lòng chọn ca.";
  if (!ROLES.includes(p.role)) return "Vui lòng chọn Role_Tag.";
  if (!Number.isInteger(needed) || needed < 1 || needed > MAX_NEEDED) return `Số lượng cần phải từ 1 đến ${MAX_NEEDED}.`;
  if (!Number.isInteger(bonus) || bonus < 0) return "Tiền thưởng khuyến khích phải là số nguyên không âm.";
  if (String(p.note ?? "").length > MAX_NOTE) return `Ghi chú tối đa ${MAX_NOTE} ký tự.`;

  const moved = !self || self.date !== p.date || self.shiftCode !== p.shiftCode;
  if (moved && startOf(p) <= now) return "Ca này đã bắt đầu hoặc đã qua, không thể mở.";

  const claimed = self ? self.claims.length : 0;
  if (needed < claimed) return `Đã có ${claimed} người nhận ca nên số lượng cần không được nhỏ hơn ${claimed}.`;

  const dup = shifts.find((s) => s.id !== p.id && !s.cancelled && s.date === p.date && s.shiftCode === p.shiftCode && s.role === p.role);
  if (dup) return `Đã có ca trực mở ${p.role} – ${p.shiftName} ngày ${fmtDate(p.date)}. Hãy sửa số lượng của ca đó thay vì tạo mới.`;
  return "";
}

// ---------- kiểm tra khi nhân viên bấm "Nhận ca" ----------
// employee = { employeeId, roleTags: [...] }; shifts = mọi ca trực mở; official = các ca trong lịch chính thức của nhân viên
// trong ngày của ca này: [{ date, startTime, endTime }]. Trả về câu báo lỗi hoặc "".
// TODO: thời gian nghỉ tối thiểu giữa hai ca và giờ tối đa mỗi tuần (cấu hình ở US09) - cần dữ liệu lịch cả tuần.
export function validateClaim(shift, employee, shifts, official = [], now = new Date()) {
  const st = statusOf(shift, now);
  if (st === "filled") return "Ca này đã có người nhận.";
  if (st === "closed") return "Ca này đã quá giờ bắt đầu, không còn nhận ca.";
  if (st === "cancelled") return "Ca này đã bị hủy.";
  if (isClaimedBy(shift, employee.employeeId)) return "Bạn đã nhận ca này rồi.";
  if (!employee.roleTags?.includes(shift.role)) return `Ca này yêu cầu Role_Tag ${shift.role}, bạn chưa có Role_Tag phù hợp.`;

  const clash = shifts.find((o) => o.id !== shift.id && !o.cancelled && isClaimedBy(o, employee.employeeId) && overlaps(o, shift));
  if (clash) return `Bạn đã nhận ca ${clash.shiftName} cùng ngày, trùng giờ với ca này.`;
  const fixed = official.find((o) => overlaps(o, shift));
  if (fixed) return `Trùng giờ với ca đã xếp trong lịch làm việc (${fixed.startTime} – ${fixed.endTime}).`;
  return "";
}

// Ca có hiển thị cho nhân viên này không (chỉ hiện cho người đủ điều kiện - tài liệu 2.14)
export const isEligible = (shift, employee, shifts, official = [], now = new Date()) =>
  validateClaim(shift, employee, shifts, official, now) === "";