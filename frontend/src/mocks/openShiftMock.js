import { addDaysISO, todayISO } from "../utils/openShiftRules";

// Dữ liệu giả cho Ca trực mở (lưu localStorage). Ngày tính từ hôm nay để demo luôn có ca đang mở / đã đóng.
// Mỗi ca có `version` (tăng sau mỗi lần ghi) để service kiểm tra Optimistic Locking khi nhân viên nhận ca.
// Người nhận lấy từ danh sách nhân viên mẫu (cùng mã, tên, số điện thoại, Role_Tag).
const KEY = "SMART_SCHEDULING_OPEN_SHIFTS_V2"; // V2: đổi từ "đăng ký + duyệt" sang "nhận ca ngay" (có thưởng, ghi chú)

const SHIFT = {
  morning: { shiftCode: "morning", shiftName: "Sáng", startTime: "06:00", endTime: "12:00" },
  afternoon: { shiftCode: "afternoon", shiftName: "Chiều", startTime: "12:00", endTime: "17:00" },
  evening: { shiftCode: "evening", shiftName: "Tối", startTime: "17:00", endTime: "22:00" },
};

const claim = (id, employeeId, name, phone, claimedAt) => ({ id, employeeId, name, phone, claimedAt });

function buildInitial() {
  const d = (n) => addDaysISO(todayISO(), n);
  const base = { cancelled: false, version: 1, note: "" };
  return [
    { id: "OS001", date: d(2), ...SHIFT.afternoon, role: "Cashier", needed: 1, bonus: 30000, ...base, claims: [] },
    { id: "OS002", date: d(3), ...SHIFT.evening, role: "Barista", needed: 1, bonus: 50000, ...base, note: "Cuối tuần đông khách", claims: [] },
    { id: "OS003", date: d(4), ...SHIFT.morning, role: "Cashier", needed: 1, bonus: 0, ...base, version: 2,
      claims: [claim("C1", "NV003", "Lê Minh Cường", "0905123458", `${d(-1)}T08:30:00`)] },
    { id: "OS004", date: d(-3), ...SHIFT.morning, role: "Barista", needed: 1, bonus: 0, ...base, claims: [] },
    { id: "OS005", date: d(1), ...SHIFT.evening, role: "Cashier", needed: 1, bonus: 0, ...base, cancelled: true, claims: [] },
    { id: "OS006", date: d(5), ...SHIFT.morning, role: "Cashier", needed: 2, bonus: 70000, ...base, version: 2,
      claims: [claim("C2", "NV005", "Hoàng Văn Nam", "0905123460", `${d(-1)}T09:10:00`)] },
  ];
}

export function getSavedOpenShifts() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* dùng dữ liệu mặc định */
  }
  const initial = buildInitial();
  saveOpenShifts(initial);
  return initial;
}

export function saveOpenShifts(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Lỗi lưu localStorage ca trực mở:", e);
  }
}