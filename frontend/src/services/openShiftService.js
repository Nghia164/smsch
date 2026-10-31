import httpClient from "./httpClient";
import { getSavedOpenShifts, saveOpenShifts } from "../mocks/openShiftMock";
import { SHIFT_DEFS, WEEKLY_PATTERN } from "../mocks/workHours";
import { getCancelRule, getEditRule, parseISO, validateClaim, validateOpenShift } from "../utils/openShiftRules";

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

// Ca trực mở: quản lý đăng ca -> nhân viên "Nhận ca" (ai nhận trước được trước, không cần duyệt).
// Luật nghiệp vụ nằm ở utils/openShiftRules.js; ở chế độ mock service này kiểm tra lại từng thao tác
// (giống backend thật sẽ làm), lỗi nghiệp vụ có `business: true` để giao diện hiện đúng câu báo lỗi.
// TODO: kiểm tra lại đường dẫn API với Backend (Laravel)

const businessError = (message) => Object.assign(new Error(message), { business: true });
function find(list, id) {
  const s = list.find((x) => x.id === id);
  if (!s) throw businessError("Không tìm thấy ca trực mở, vui lòng tải lại danh sách.");
  return s;
}
// Mỗi lần ghi tăng version -> dùng cho Optimistic Locking
const commit = (list, shift) => {
  const next = { ...shift, version: (shift.version ?? 1) + 1 };
  saveOpenShifts(list.map((s) => (s.id === next.id ? next : s)));
  return next;
};

// Ca trong lịch chính thức của nhân viên vào đúng ngày của ca trực mở (mock: lịch cố định theo thứ)
function officialShiftsOf(employeeId, date) {
  const dayIndex = (parseISO(date).getDay() + 6) % 7; // 0 = Thứ 2
  const name = WEEKLY_PATTERN[employeeId]?.[dayIndex];
  return name ? [{ date, startTime: SHIFT_DEFS[name].start, endTime: SHIFT_DEFS[name].end }] : [];
}

export const getOpenShifts = () =>
  USE_MOCK ? Promise.resolve(getSavedOpenShifts()) : httpClient.get("/open-shifts").then((r) => r.data);

// p = { date, shiftCode, shiftName, startTime, endTime, role, needed, bonus?, note? }
export async function createOpenShift(p) {
  if (!USE_MOCK) return httpClient.post("/open-shifts", p).then((r) => r.data);
  const list = getSavedOpenShifts();
  const err = validateOpenShift(p, list);
  if (err) throw businessError(err);
  const n = Math.max(0, ...list.map((s) => Number(s.id.slice(2)))) + 1;
  const shift = {
    ...p,
    id: `OS${String(n).padStart(3, "0")}`,
    needed: Number(p.needed),
    bonus: Number(p.bonus) || 0,
    note: (p.note ?? "").trim(),
    cancelled: false,
    version: 1,
    claims: [],
  };
  saveOpenShifts([shift, ...list]);
  return shift;
}

export async function updateOpenShift(p) {
  if (!USE_MOCK) return httpClient.put(`/open-shifts/${p.id}`, p).then((r) => r.data);
  const list = getSavedOpenShifts();
  const s = find(list, p.id);
  const rule = getEditRule(s);
  if (!rule.allowed) throw businessError(rule.reason);
  if (rule.locked && (p.date !== s.date || p.shiftCode !== s.shiftCode || p.role !== s.role || Number(p.bonus) !== s.bonus))
    throw businessError(rule.reason);
  const err = validateOpenShift(p, list);
  if (err) throw businessError(err);
  return commit(list, { ...s, ...p, needed: Number(p.needed), bonus: Number(p.bonus) || 0, note: (p.note ?? "").trim() });
}

// Chỉ hủy được khi chưa có người nhận. Hủy = chuyển "Đã hủy" (giữ lại để xem lịch sử). Trả về { action: "cancelled" }.
export async function cancelOpenShift(id) {
  if (!USE_MOCK) return httpClient.delete(`/open-shifts/${id}`).then((r) => r.data);
  const list = getSavedOpenShifts();
  const s = find(list, id);
  const rule = getCancelRule(s);
  if (!rule.allowed) throw businessError(rule.reason);
  commit(list, { ...s, cancelled: true });
  return { action: "cancelled" };
}

// Nhân viên bấm "Nhận ca" (dùng ở màn hình của Staff). Ai gửi thành công trước được ghi nhận, người sau nhận lỗi
// "Ca này đã có người nhận". Optimistic Locking: expectedVersion = version của ca lúc nhân viên mở danh sách;
// nếu ca đã bị ghi đè trong lúc đó (có người nhận, quản lý sửa...) thì từ chối, không bao giờ trùng ca.
// employee = { employeeId, name, phone, roleTags }. Trả về { shift, filled, bonus }.
export async function claimOpenShift(shiftId, employee, expectedVersion) {
  if (!USE_MOCK)
    return httpClient.post(`/open-shifts/${shiftId}/claim`, { version: expectedVersion }).then((r) => r.data);
  const list = getSavedOpenShifts();
  const s = find(list, shiftId);

  const err = validateClaim(s, employee, list, officialShiftsOf(employee.employeeId, s.date));
  if (err) throw businessError(err);
  if (expectedVersion !== undefined && s.version !== expectedVersion)
    throw businessError("Ca này vừa được cập nhật, vui lòng tải lại danh sách rồi nhận lại.");

  const claim = {
    id: `C${Date.now()}`,
    employeeId: employee.employeeId,
    name: employee.name,
    phone: employee.phone ?? "",
    claimedAt: new Date().toISOString(),
  };
  const next = commit(list, { ...s, claims: [...s.claims, claim] });
  return { shift: next, filled: next.claims.length >= next.needed, bonus: next.bonus };
}