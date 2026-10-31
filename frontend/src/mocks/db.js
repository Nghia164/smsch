// =============================================================================
// SMART SCHEDULING - SINGLE SOURCE OF TRUTH (SỔ CÁI CHUNG TOÀN HỆ THỐNG)
// File: src/mocks/db.js
//
// Dữ liệu GỐC duy nhất:
// 1. employees (hồ sơ, lương giờ, hợp đồng, trạng thái, tài khoản)
// 2. shiftConfig (danh mục ca, hệ số ca, ràng buộc, cấu hình chung)
// 3. schedules (phân công ca tuần, trạng thái xác nhận)
// 4. attendance (chấm công vào/ra thô, điều chỉnh, lịch sử)
// 5. payrollLocks (kỳ lương đã chốt)
// 6. leaves (đơn nghỉ phép)
// 7. openShifts (ca trực mở)
//
// MỌI DỮ LIỆU TỔNG HỢP (giờ làm, bảng lương, dashboard) đều được TÍNH ĐỘNG từ dữ liệu gốc.
// =============================================================================

const DB_STORAGE_KEY = "SMART_SCHEDULING_DB_V1";

// ---------- Tiện ích ngày giờ ----------
export const pad = (n) => String(n).padStart(2, "0");
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const toVN = (iso) => {
  if (!iso || !iso.includes("-")) return iso || "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
export const toMin = (hhmm) => {
  if (!hhmm || !String(hhmm).includes(":")) return null;
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
};
export const fmtMin = (min) => {
  if (min == null) return "—";
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
};
export const hoursOf = (min) => Math.round(min / 6) / 10; // phút -> giờ, 1 chữ số lẻ

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
export function mondayOf(d) {
  const x = startOfDay(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

// Định nghĩa ca mặc định
export const SHIFT_DEFS = {
  "Sáng": { start: "06:00", end: "12:00", night: false, multiplier: 1.0 },
  "Chiều": { start: "12:00", end: "17:00", night: false, multiplier: 1.0 },
  "Tối": { start: "17:00", end: "22:00", night: true, multiplier: 1.2 },
};
export const SHIFT_NAMES = Object.keys(SHIFT_DEFS);

// Lịch cố định theo thứ trong tuần (0 = Thứ 2 ... 6 = Chủ nhật)
export const WEEKLY_PATTERN = {
  NV001: { 0: "Sáng", 1: "Tối", 3: "Sáng", 5: "Tối", 6: "Sáng" },
  NV002: { 0: "Chiều", 2: "Tối", 4: "Chiều", 5: "Sáng", 6: "Chiều" },
  NV003: { 1: "Sáng", 2: "Sáng", 4: "Chiều", 6: "Tối" },
  NV004: { 0: "Tối", 3: "Tối", 4: "Sáng", 5: "Chiều" },
  NV005: { 2: "Chiều", 3: "Chiều", 5: "Sáng", 6: "Sáng" },
};

// Mapping Vai trò hiển thị <-> Role_Tag hệ thống
export function roleToTag(role) {
  if (role === "Pha chế") return "Barista";
  if (role === "Thu ngân") return "Cashier";
  if (role === "Quản lý ca" || role === "Quản lý") return "Shift_Leader";
  return "Waiter";
}
export function tagToRole(roleTag) {
  if (roleTag === "Barista") return "Pha chế";
  if (roleTag === "Cashier") return "Thu ngân";
  if (roleTag === "Shift_Leader") return "Quản lý ca";
  return "Phục vụ";
}

// 5 nhân viên mặc định của hệ thống
const defaultEmployees = [
  {
    id: "NV001",
    name: "Nguyễn Văn An",
    phone: "0905123456",
    birthDate: "2002-05-12",
    role: "Phục vụ",
    roleTag: "Shift_Leader",
    contract: "Toàn thời gian",
    hourlyWage: 35000,
    status: "Đang làm việc",
    email: "nguyenvanan@gmail.com",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces",
    account: { email: "nguyenvanan@gmail.com", password: "12345678", status: "active" },
  },
  {
    id: "NV002",
    name: "Trần Thị Bích",
    phone: "0905123457",
    birthDate: "2001-08-20",
    role: "Pha chế",
    roleTag: "Barista",
    contract: "Toàn thời gian",
    hourlyWage: 30000,
    status: "Đang làm việc",
    email: "tranthibich@gmail.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces",
    account: { email: "tranthibich@gmail.com", password: "12345678", status: "active" },
  },
  {
    id: "NV003",
    name: "Lê Minh Cường",
    phone: "0905123458",
    birthDate: "2003-01-15",
    role: "Thu ngân",
    roleTag: "Cashier",
    contract: "Bán thời gian",
    hourlyWage: 28000,
    status: "Đang làm việc",
    email: "leminhcuong@gmail.com",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=faces",
    account: null,
  },
  {
    id: "NV004",
    name: "Phạm Thị Dung",
    phone: "0905123459",
    birthDate: "2002-11-03",
    role: "Pha chế",
    roleTag: "Barista",
    contract: "Bán thời gian",
    hourlyWage: 30000,
    status: "Nghỉ phép",
    email: "phamthidung@gmail.com",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces",
    account: { email: "phamthidung@gmail.com", password: "12345678", status: "active" },
  },
  {
    id: "NV005",
    name: "Hoàng Văn Nam",
    phone: "0905123460",
    birthDate: "2001-06-25",
    role: "Thu ngân",
    roleTag: "Cashier",
    contract: "Bán thời gian",
    hourlyWage: 28000,
    status: "Đang làm việc",
    email: "hoangvannam@gmail.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
    account: null,
  },
];

// Cấu hình ca và ràng buộc mặc định
const defaultShiftConfig = {
  shifts: [
    { id: "shift_1", name: "Sáng", start: "06:00", end: "12:00", multiplier: 1.0, active: true },
    { id: "shift_2", name: "Chiều", start: "12:00", end: "17:00", multiplier: 1.0, active: true },
    { id: "shift_3", name: "Tối", start: "17:00", end: "22:00", multiplier: 1.2, active: true },
  ],
  constraints: [
    { id: "max_hours_week", name: "Giờ làm tối đa trong tuần", value: 48, unit: "giờ", enabled: true, hard: true },
    { id: "min_rest_between_shifts", name: "Khoảng nghỉ tối thiểu giữa 2 ca", value: 12, unit: "giờ", enabled: true, hard: true },
    { id: "max_consecutive_days", name: "Số ngày làm việc liên tục tối đa", value: 6, unit: "ngày", enabled: true, hard: true },
    { id: "fair_hours_distribution", name: "Phân bổ giờ làm công bằng", enabled: true, hard: false },
    { id: "fair_weekend_distribution", name: "Chia đều ca làm việc cuối tuần", enabled: true, hard: false },
  ],
  generalSettings: {
    gracePeriodMin: 5,
    registrationDeadline: "T6 18:00",
    holidays: [
      { date: "2026-01-01", multiplier: 1.5, name: "Tết Dương lịch" },
      { date: "2026-04-30", multiplier: 1.5, name: "Giải phóng miền Nam" },
      { date: "2026-05-01", multiplier: 1.5, name: "Quốc tế Lao động" },
      { date: "2026-09-02", multiplier: 1.5, name: "Quốc khánh" },
    ],
  },
};

// Khởi tạo lịch tuần ban đầu từ WEEKLY_PATTERN
export function generateInitialScheduleDict(employees = defaultEmployees) {
  const sched = {};
  const dayKeys = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  dayKeys.forEach((d) => {
    sched[`morning_${d}`] = { shiftId: "morning", dayId: d, assigned: [] };
    sched[`afternoon_${d}`] = { shiftId: "afternoon", dayId: d, assigned: [] };
    sched[`evening_${d}`] = { shiftId: "evening", dayId: d, assigned: [] };
  });

  const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));
  Object.entries(WEEKLY_PATTERN).forEach(([empId, pattern]) => {
    const emp = empMap[empId];
    if (!emp) return;
    Object.entries(pattern).forEach(([dIndexStr, shiftName]) => {
      const dIndex = Number(dIndexStr);
      const dayKey = dayKeys[dIndex];
      if (!dayKey) return;
      const shiftKey =
        shiftName === "Sáng"
          ? `morning_${dayKey}`
          : shiftName === "Chiều"
          ? `afternoon_${dayKey}`
          : `evening_${dayKey}`;
      if (sched[shiftKey]) {
        sched[shiftKey].assigned.push(emp);
      }
    });
  });
  return sched;
}

// Khởi tạo danh sách chấm công thô 6 tuần gần nhất
function buildInitialAttendance(employees = defaultEmployees) {
  const today = startOfDay(new Date());
  const first = addDays(mondayOf(today), -35);
  const list = [];

  employees.forEach((emp, ei) => {
    const pattern = WEEKLY_PATTERN[emp.id] ?? {};
    for (let n = 0; n <= 41; n++) {
      const day = addDays(first, n);
      if (day > today) break;
      const shiftName = pattern[(day.getDay() + 6) % 7];
      if (!shiftName) continue;
      const def = SHIFT_DEFS[shiftName];
      const iso = toISO(day);
      const seed = ei * 7 + n;

      const late = [0, 0, 2, 0, 5, 0, 12, 0][seed % 8];
      const early = [0, 0, 0, 3, 0, 0, 0, 25][(seed + 3) % 8];
      const extra = [0, 5, 0, 0, 10, 0, 0, 0][(seed + 5) % 8];
      const absent = seed % 17 === 4;
      const missing = !absent && seed % 13 === 5;
      const sMin = toMin(def.start);
      const eMin = toMin(def.end);

      list.push({
        id: `${emp.id}_${iso}`,
        employeeId: emp.id,
        iso,
        shiftName,
        sMin,
        eMin,
        def,
        checkInMin: absent ? null : sMin + late,
        checkOutMin: absent || missing ? null : eMin - early + extra,
        adjusted: false,
        adjustmentHistory: [],
      });
    }
  });

  return list;
}

// ==========================================
// CƠ CHẾ PUB / SUB (THÔNG BÁO CHO CÁC TRANG)
// ==========================================
const listeners = new Set();

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.error("Lỗi callback listener trong db.js:", err);
    }
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("smart_scheduling_db_changed"));
  }
}

// ==========================================
// STORE DATA & PERSISTENCE
// ==========================================
let state = null;

function loadDb() {
  if (state) return state;

  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(DB_STORAGE_KEY) : null;
    if (raw) {
      state = JSON.parse(raw);
      return state;
    }
  } catch (err) {
    console.warn("Không đọc được localStorage db, khởi tạo mới:", err);
  }

  // Khởi tạo dữ liệu gốc
  const employees = defaultEmployees;
  const shiftConfig = defaultShiftConfig;
  const schedules = generateInitialScheduleDict(employees);
  const attendance = buildInitialAttendance(employees);

  state = {
    employees,
    shiftConfig,
    schedules,
    isScheduleConfirmed: false,
    attendance,
    payrollLocks: ["2026-01", "2026-02"], // Mặc định khóa kỳ lương cũ để kiểm thử
  };

  saveDb();
  return state;
}

function saveDb() {
  if (!state) return;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(state));
    }
  } catch (err) {
    console.error("Lỗi ghi db vào localStorage:", err);
  }
}

export function getDbSnapshot() {
  return loadDb();
}

// ==========================================
// CÁC HÀM TRUY XUẤT VÀ THAO TÁC NHÂN VIÊN
// ==========================================
export function getEmployees(params = {}) {
  const db = loadDb();
  let list = [...db.employees];

  if (params.search) {
    const q = params.search.toLowerCase().trim();
    list = list.filter((e) => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q));
  }
  if (params.role && params.role !== "all") {
    list = list.filter((e) => e.role === params.role);
  }
  if (params.contract && params.contract !== "all") {
    list = list.filter((e) => e.contract === params.contract);
  }
  if (params.status && params.status !== "all") {
    list = list.filter((e) => e.status === params.status);
  }

  return list;
}

export function getEmployeeById(id) {
  const db = loadDb();
  return db.employees.find((e) => e.id === id) ?? null;
}

export function addEmployee(data) {
  const db = loadDb();
  const nextNumber = db.employees.length + 1;
  const id = data.id || `NV${String(nextNumber).padStart(3, "0")}`;

  const role = data.role || "Phục vụ";
  const roleTag = data.roleTag || roleToTag(role);
  const hourlyWage = Number(data.hourlyWage) || 28000;
  const contract = data.contract || "Bán thời gian";
  const status = data.status || "Đang làm việc";

  const newEmp = {
    id,
    name: data.name,
    phone: data.phone || "",
    birthDate: data.birthDate || "",
    role,
    roleTag,
    contract,
    hourlyWage,
    status,
    email: data.account?.email || data.email || `${id.toLowerCase()}@coffeeshop.vn`,
    avatar: data.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces",
    account: data.account ?? (data.email && data.password ? { email: data.email, password: data.password, status: "active" } : null),
  };

  db.employees.push(newEmp);
  saveDb();
  notifyListeners();
  return newEmp;
}

export function updateEmployee(id, data) {
  const db = loadDb();
  const idx = db.employees.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error(`Không tìm thấy nhân viên với mã ${id}`);

  const curr = db.employees[idx];
  const role = data.role !== undefined ? data.role : curr.role;
  const roleTag = data.roleTag !== undefined ? data.roleTag : roleToTag(role);
  const hourlyWage = data.hourlyWage !== undefined ? Number(data.hourlyWage) : curr.hourlyWage;

  db.employees[idx] = {
    ...curr,
    ...data,
    role,
    roleTag,
    hourlyWage,
  };

  saveDb();
  notifyListeners();
  return db.employees[idx];
}

// Proxy array backward-compatible để các file cũ gọi `employeeRoster` hay `mockEmployees`
// luôn đọc dữ liệu LIVE từ db.employees
export const liveEmployeeRoster = new Proxy([], {
  get(target, prop) {
    const list = loadDb().employees;
    if (prop === "length") return list.length;
    if (prop === Symbol.iterator) return list[Symbol.iterator].bind(list);
    if (typeof list[prop] === "function") return list[prop].bind(list);
    return list[prop];
  },
});

// ==========================================
// CẤU HÌNH CA & RÀNG BUỘC
// ==========================================
export function getShiftConfig() {
  return loadDb().shiftConfig;
}

export function saveShiftConfig(cfg) {
  const db = loadDb();
  db.shiftConfig = { ...db.shiftConfig, ...cfg };
  saveDb();
  notifyListeners();
  return db.shiftConfig;
}

export function getLiveSettings() {
  const db = loadDb();
  const cfg = db.shiftConfig ?? {};
  const gen = cfg.generalSettings ?? {};
  const graceMin = gen.gracePeriodMin !== undefined ? Number(gen.gracePeriodMin) : 5;
  const holidays = Array.isArray(gen.holidays) && gen.holidays.length > 0
    ? gen.holidays
    : [
        { date: "2026-01-01", multiplier: 1.5 },
        { date: "2026-04-30", multiplier: 1.5 },
        { date: "2026-05-01", multiplier: 1.5 },
        { date: "2026-09-02", multiplier: 1.5 },
      ];
  const holidayMap = new Map(holidays.map((h) => [h.date, Number(h.multiplier) || 1.5]));

  const shiftMultipliers = new Map(
    (cfg.shifts || []).map((s) => [s.name, Number(s.multiplier) || (s.name === "Tối" ? 1.2 : 1.0)])
  );

  return { graceMin, holidayMap, shiftMultipliers };
}

// ==========================================
// KHÓA KỲ LƯƠNG (PAYROLL LOCKS)
// ==========================================
export function getPayrollLocks() {
  return loadDb().payrollLocks || [];
}

export function isPeriodLocked(isoDate) {
  if (!isoDate) return false;
  const locks = getPayrollLocks();
  const monthKey = isoDate.slice(0, 7); // "YYYY-MM"
  return locks.includes(monthKey) || locks.includes(isoDate);
}

export function lockPayrollPeriod(monthKey) {
  const db = loadDb();
  if (!db.payrollLocks) db.payrollLocks = [];
  if (!db.payrollLocks.includes(monthKey)) {
    db.payrollLocks.push(monthKey);
    saveDb();
    notifyListeners();
  }
  return true;
}

export function unlockPayrollPeriod(monthKey) {
  const db = loadDb();
  if (db.payrollLocks) {
    db.payrollLocks = db.payrollLocks.filter((k) => k !== monthKey);
    saveDb();
    notifyListeners();
  }
  return true;
}

// ==========================================
// TÍNH TOÁN DẪN XUẤT CHẤM CÔNG (ON-THE-FLY)
// ==========================================
function deriveShift(b) {
  const { graceMin, holidayMap, shiftMultipliers } = getLiveSettings();
  const inMin = b.checkInMin;
  const outMin = b.checkOutMin;

  const absent = inMin == null;
  const missing = !absent && outMin == null;
  const lateMin = absent ? 0 : Math.max(0, inMin - b.sMin);
  const earlyMin = absent || missing ? 0 : Math.max(0, b.eMin - outMin);
  const isLate = !absent && lateMin > graceMin;
  const isEarly = !absent && !missing && earlyMin > graceMin;

  const status = absent
    ? "Absent"
    : missing
    ? "Missing-Checkout"
    : isLate
    ? "Late"
    : isEarly
    ? "Early-Departure"
    : "On-Time";

  // Absent và Missing-Checkout chưa điều chỉnh có actualMin = 0
  const actualMin = absent || missing ? 0 : Math.max(0, outMin - inMin);
  const night = b.def?.night ?? false;

  const isHoliday = holidayMap.has(b.iso);
  const holidayCoefficient = isHoliday ? (holidayMap.get(b.iso) ?? 1.5) : 1.0;
  const shiftMultiplier = shiftMultipliers.get(b.shiftName) ?? (night ? 1.2 : 1.0);
  const coefficient = isHoliday ? Math.max(holidayCoefficient, shiftMultiplier) : shiftMultiplier;

  const locked = isPeriodLocked(b.iso);

  return {
    id: b.id,
    employeeId: b.employeeId,
    iso: b.iso,
    shiftName: b.shiftName,
    scheduledMin: b.eMin - b.sMin,
    actualMin,
    scheduledText: `${b.def?.start || "06:00"} - ${b.def?.end || "12:00"}`,
    actualText: absent ? "Vắng mặt" : `${fmtMin(inMin)} - ${missing ? "--:--" : fmtMin(outMin)}`,
    checkInMin: inMin,
    checkOutMin: outMin,
    lateMin,
    earlyMin,
    absent,
    missing,
    isLate,
    isEarly,
    status,
    adjusted: !!b.adjusted,
    locked,
    isNight: night,
    isHoliday,
    coefficient,
  };
}

export function getCalculatedShifts() {
  const db = loadDb();
  return db.attendance.map(deriveShift);
}

export function getShiftById(id) {
  return getCalculatedShifts().find((s) => s.id === id) ?? null;
}

export function getShiftHistory(id) {
  const db = loadDb();
  const raw = db.attendance.find((s) => s.id === id);
  return raw ? [...(raw.adjustmentHistory || [])].reverse() : [];
}

const stamp = () => {
  const d = new Date();
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const span = (a, b) => `${a == null ? "—" : fmtMin(a)} - ${b == null ? "—" : fmtMin(b)}`;

// US22: Điều chỉnh chấm công (lưu thẳng vào DB, kiểm tra kỳ lương đã chốt)
export function adjustAttendance(id, { checkIn, checkOut, reason, modifier } = {}, isoFallback) {
  const db = loadDb();
  const record = db.attendance.find((s) => s.id === id);
  const targetIso = record ? record.iso : isoFallback;

  if (targetIso && isPeriodLocked(targetIso)) {
    throw new Error("Bản ghi thuộc kỳ lương đã chốt, không thể điều chỉnh.");
  }
  if (!record) throw new Error("Không tìm thấy bản ghi chấm công.");

  const effectiveIn = checkIn != null && checkIn !== "" ? checkIn : (record.checkInMin != null ? fmtMin(record.checkInMin) : "");
  const effectiveOut = checkOut != null && checkOut !== "" ? checkOut : (record.checkOutMin != null ? fmtMin(record.checkOutMin) : "");

  if (!effectiveIn || !effectiveOut) throw new Error("Vui lòng nhập đủ giờ check-in và check-out.");
  if (!reason || !reason.trim()) throw new Error("Vui lòng nhập lý do điều chỉnh.");

  const inMin = toMin(effectiveIn);
  const outMin = toMin(effectiveOut);
  if (outMin <= inMin) throw new Error("Giờ check-out phải sau giờ check-in.");

  const prevIn = record.checkInMin;
  const prevOut = record.checkOutMin;

  record.checkInMin = inMin;
  record.checkOutMin = outMin;
  record.adjusted = true;

  if (!record.adjustmentHistory) record.adjustmentHistory = [];
  record.adjustmentHistory.push({
    at: stamp(),
    by: modifier || "Quản lý",
    reason: reason.trim(),
    before: span(prevIn, prevOut),
    after: span(inMin, outMin),
  });

  saveDb();
  notifyListeners();
  return deriveShift(record);
}

// ==========================================
// TÍNH TOÁN KỲ XEM
// ==========================================
export function resolvePeriod({ period = "week", from = "", to = "" }) {
  const today = startOfDay(new Date());
  if (period === "month") {
    const a = new Date(today.getFullYear(), today.getMonth(), 1);
    const b = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { from: toISO(a), to: toISO(b), label: `Tháng ${pad(a.getMonth() + 1)}/${a.getFullYear()}` };
  }
  if (period === "range") {
    if (!from || !to) return { from: "", to: "", label: "Chưa chọn khoảng ngày" };
    return { from, to, label: from === to ? toVN(from) : `${toVN(from)} – ${toVN(to)}` };
  }
  const a = mondayOf(today);
  const b = addDays(a, 6);
  return { from: toISO(a), to: toISO(b), label: `Tuần ${toVN(toISO(a))} – ${toVN(toISO(b))}` };
}

// Lọc ca tính toán theo kỳ và các tiêu chí
export function listShifts({ period = "week", from = "", to = "", employeeId = "all", roleTag = "all", shiftName = "all" }) {
  const range = resolvePeriod({ period, from, to });
  if (!range.from || !range.to) return [];

  const db = loadDb();
  const roleOf = Object.fromEntries(db.employees.map((e) => [e.id, e.roleTag]));

  return getCalculatedShifts().filter(
    (s) =>
      s.iso >= range.from &&
      s.iso <= range.to &&
      (employeeId === "all" || s.employeeId === employeeId) &&
      (roleTag === "all" || roleOf[s.employeeId] === roleTag) &&
      (shiftName === "all" || s.shiftName === shiftName)
  );
}

// ==========================================
// BẢNG TỔNG HỢP GIỜ LÀM (WORK HOURS)
// ==========================================
export function buildWorkHoursSummary({ period = "week", from = "", to = "", employeeId = "all", roleTag = "all" }) {
  const range = resolvePeriod({ period, from, to });
  const db = loadDb();
  const allShifts = getCalculatedShifts();

  const rows = db.employees
    .filter((e) => (employeeId === "all" || e.id === employeeId) && (roleTag === "all" || e.roleTag === roleTag))
    .map((e) => {
      const list = allShifts.filter((s) => s.employeeId === e.id && s.iso >= range.from && s.iso <= range.to);
      const sum = (fn) => list.reduce((acc, s) => acc + fn(s), 0);
      return {
        employeeId: e.id,
        shiftCount: list.length,
        scheduledHours: hoursOf(sum((s) => s.scheduledMin)),
        actualHours: hoursOf(sum((s) => s.actualMin)),
        nightHours: hoursOf(sum((s) => (s.isNight ? s.actualMin : 0))),
        holidayHours: hoursOf(sum((s) => (s.isHoliday ? s.actualMin : 0))),
      };
    });

  return { periodLabel: range.label, rows };
}

export function buildWorkHoursDetail(employeeId, { period = "week", from = "", to = "" }) {
  const range = resolvePeriod({ period, from, to });
  return getCalculatedShifts()
    .filter((s) => s.employeeId === employeeId && s.iso >= range.from && s.iso <= range.to)
    .map((s) => ({
      date: toVN(s.iso),
      shiftName: s.shiftName,
      scheduled: s.scheduledText,
      actual: s.actualText,
      absent: s.absent,
      missing: s.missing,
      status: s.status,
      isNight: s.isNight,
      isHoliday: s.isHoliday,
      coefficient: s.coefficient,
    }));
}

// ==========================================
// ĐỐI SOÁT CHẤM CÔNG (ATTENDANCE RECONCILIATION)
// ==========================================
export const STATUSES = ["On-Time", "Late", "Early-Departure", "Absent", "Missing-Checkout"];

export function buildAttendance({ period = "week", from = "", to = "", employeeId = "all", roleTag = "all", status = "all" } = {}) {
  const range = resolvePeriod({ period, from, to });
  const base = listShifts({ period, from, to, employeeId, roleTag });
  const db = loadDb();
  const nameOf = Object.fromEntries(db.employees.map((e) => [e.id, e.name]));

  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  base.forEach((s) => {
    if (counts[s.status] !== undefined) counts[s.status] += 1;
  });
  counts.total = base.length;

  const rows = base
    .filter((s) => status === "all" || s.status === status)
    .sort((a, b) => b.iso.localeCompare(a.iso) || a.employeeId.localeCompare(b.employeeId))
    .map((s) => ({
      id: s.id,
      iso: s.iso,
      scheduledMin: s.scheduledMin,
      actualMin: s.actualMin,
      employeeId: s.employeeId,
      employeeName: nameOf[s.employeeId] ?? s.employeeId,
      date: toVN(s.iso),
      shiftName: s.shiftName,
      scheduled: s.scheduledText,
      checkIn: s.checkInMin == null ? "" : fmtMin(s.checkInMin),
      checkOut: s.checkOutMin == null ? "" : fmtMin(s.checkOutMin),
      lateMin: s.lateMin,
      earlyMin: s.earlyMin,
      status: s.status,
      adjusted: s.adjusted,
      locked: s.locked,
      isNight: s.isNight,
      isHoliday: s.isHoliday,
      coefficient: s.coefficient,
    }));

  return { periodLabel: range.label, from: range.from, to: range.to, counts, rows };
}

// ==========================================
// BẢNG LƯƠNG & TÍNH LƯƠNG (PAYROLL)
// ==========================================
const BONUS_AMOUNTS = [30000, 50000, 70000];
function openShiftBonusOf(s) {
  if (s.absent || s.missing) return 0;
  let seed = 0;
  for (const ch of s.id) seed = (seed * 31 + ch.charCodeAt(0)) % 1000003;
  return seed % 9 === 0 ? BONUS_AMOUNTS[seed % 3] : 0;
}

function shiftPay(s, wage) {
  const hours = (s.actualMin || 0) / 60;
  const coeff = s.coefficient !== undefined ? s.coefficient : (s.isNight ? 1.2 : 1.0);
  const base = Math.round(hours * wage);
  const amount = Math.round(hours * wage * coeff);
  return { base, amount, surcharge: amount - base, bonus: openShiftBonusOf(s) };
}

export function computePayroll(shifts = getCalculatedShifts()) {
  const db = loadDb();
  return db.employees
    .map((e) => {
      const list = (shifts || []).filter((s) => s.employeeId === e.id);
      const wage = e.hourlyWage || 28000;
      let actualHoursSum = 0;
      let nightHoursSum = 0;
      let holidayHoursSum = 0;
      let nightHolidayHoursSum = 0;
      let basePay = 0;
      let surcharge = 0;
      let openShiftBonus = 0;
      let openShiftCount = 0;

      for (const s of list) {
        const p = shiftPay(s, wage);
        const sHours = hoursOf(s.actualMin);
        actualHoursSum += sHours;
        if (s.isNight) nightHoursSum += sHours;
        if (s.isHoliday) holidayHoursSum += sHours;
        if (s.isNight && s.isHoliday) nightHolidayHoursSum += sHours;
        basePay += p.base;
        surcharge += p.surcharge;
        if (p.bonus > 0) {
          openShiftBonus += p.bonus;
          openShiftCount += 1;
        }
      }

      return {
        employeeId: e.id,
        name: e.name,
        roleTag: e.roleTag,
        contract: e.contract,
        hourlyWage: wage,
        shiftCount: list.length,
        actualHours: Math.round(actualHoursSum * 10) / 10,
        nightHours: Math.round(nightHoursSum * 10) / 10,
        holidayHours: Math.round(holidayHoursSum * 10) / 10,
        nightHolidayHours: Math.round(nightHolidayHoursSum * 10) / 10,
        basePay,
        surcharge,
        openShiftBonus,
        openShiftCount,
        total: basePay + surcharge + openShiftBonus,
      };
    })
    .filter((r) => r.shiftCount > 0);
}

export function computeTotals(rows) {
  const sum = (k) => rows.reduce((a, r) => a + (r[k] || 0), 0);
  const h = (k) => Math.round(sum(k) * 10) / 10;
  return {
    employeeCount: rows.length,
    shiftCount: sum("shiftCount"),
    actualHours: h("actualHours"),
    nightHours: h("nightHours"),
    holidayHours: h("holidayHours"),
    nightHolidayHours: h("nightHolidayHours"),
    basePay: sum("basePay"),
    surcharge: sum("surcharge"),
    openShiftBonus: sum("openShiftBonus"),
    total: sum("total"),
  };
}

export function computeEmployeeDetail(shiftsOrId, employeeIdMaybe) {
  let shifts;
  let employeeId;
  if (typeof shiftsOrId === "string") {
    employeeId = shiftsOrId;
    shifts = getCalculatedShifts();
  } else {
    shifts = shiftsOrId || getCalculatedShifts();
    employeeId = employeeIdMaybe;
  }
  const db = loadDb();
  const emp = db.employees.find((e) => e.id === employeeId);
  if (!emp) return null;
  const wage = emp.hourlyWage || 28000;
  const list = shifts
    .filter((s) => s.employeeId === emp.id)
    .sort((a, b) => (a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : 0));

  const shiftRows = list.map((s) => {
    const p = shiftPay(s, wage);
    return {
      id: s.id,
      date: toVN(s.iso),
      shiftName: s.shiftName,
      scheduled: s.scheduledText,
      checkIn: s.checkInMin != null ? fmtMin(s.checkInMin) : "—",
      checkOut: s.checkOutMin != null ? fmtMin(s.checkOutMin) : "—",
      isNight: s.isNight,
      isHoliday: s.isHoliday,
      status: s.status,
      adjusted: s.adjusted,
      hours: hoursOf(s.actualMin),
      coefficient: s.coefficient,
      basePay: p.base,
      totalPay: p.amount,
    };
  });

  const bonusRows = list
    .map((s) => ({ s, bonus: openShiftBonusOf(s) }))
    .filter((x) => x.bonus > 0)
    .map(({ s, bonus }) => ({ id: s.id, date: toVN(s.iso), shiftName: s.shiftName, amount: bonus }));

  const row = computePayroll(list).find((r) => r.employeeId === emp.id) ?? null;
  return {
    employee: { id: emp.id, name: emp.name, roleTag: emp.roleTag, contract: emp.contract, hourlyWage: wage },
    summary: row,
    shifts: shiftRows,
    bonuses: bonusRows,
  };
}

export const payrollTotal = (shifts = getCalculatedShifts()) => computePayroll(shifts).reduce((a, r) => a + r.total, 0);

// ==========================================
// DASHBOARD STATS
// ==========================================
const REQUIREMENTS = [
  [0, "Sáng", "Shift_Leader", 1], [0, "Chiều", "Barista", 1], [0, "Tối", "Barista", 1],
  [1, "Sáng", "Cashier", 1], [1, "Chiều", "Barista", 1], [1, "Tối", "Shift_Leader", 1],
  [2, "Sáng", "Cashier", 1], [2, "Chiều", "Cashier", 1], [2, "Tối", "Barista", 1],
  [3, "Sáng", "Shift_Leader", 1], [3, "Chiều", "Cashier", 1], [3, "Tối", "Barista", 1],
  [4, "Sáng", "Barista", 1], [4, "Chiều", "Barista", 1], [4, "Chiều", "Cashier", 1], [4, "Tối", "Cashier", 1],
  [5, "Sáng", "Barista", 1], [5, "Sáng", "Cashier", 1], [5, "Chiều", "Barista", 1], [5, "Tối", "Shift_Leader", 1],
  [6, "Sáng", "Shift_Leader", 1], [6, "Sáng", "Cashier", 1], [6, "Chiều", "Barista", 1], [6, "Tối", "Cashier", 1],
].map(([day, shift, roleTag, count]) => ({ day, shift, roleTag, count }));

const dayIndex = (d) => (d.getDay() + 6) % 7;
const pct = (a, b) => (b === 0 ? 0 : Math.round((a / b) * 1000) / 10);

function assignedCount(day, shift, roleTag) {
  const db = loadDb();
  return db.employees.filter((e) => e.roleTag === roleTag && WEEKLY_PATTERN[e.id]?.[day] === shift).length;
}

function fillStats(range, roleTag, shiftName) {
  const today = startOfDay(new Date());
  const byShift = Object.fromEntries(SHIFT_NAMES.map((n) => [n, { required: 0, filled: 0 }]));
  if (range.from && range.to) {
    const end = new Date(Math.min(startOfDay(new Date(range.to)).getTime(), today.getTime()));
    for (let d = startOfDay(new Date(range.from)); d <= end; d = addDays(d, 1)) {
      for (const r of REQUIREMENTS) {
        if (r.day !== dayIndex(d)) continue;
        if (roleTag !== "all" && r.roleTag !== roleTag) continue;
        if (shiftName !== "all" && r.shift !== shiftName) continue;
        byShift[r.shift].required += r.count;
        byShift[r.shift].filled += Math.min(r.count, assignedCount(r.day, r.shift, r.roleTag));
      }
    }
  }
  return byShift;
}

// Ca thiếu người trong 14 ngày tới (kể cả hôm nay) - không phụ thuộc kỳ đang lọc
function upcomingUnderstaffed(roleTag, shiftName) {
  const rows = [];
  const today = startOfDay(new Date());
  for (let i = 0; i < 14; i++) {
    const d = addDays(today, i);
    for (const r of REQUIREMENTS) {
      if (r.day !== dayIndex(d)) continue;
      if (roleTag !== "all" && r.roleTag !== roleTag) continue;
      if (shiftName !== "all" && r.shift !== shiftName) continue;
      const assigned = Math.min(r.count, assignedCount(r.day, r.shift, r.roleTag));
      if (assigned < r.count) {
        rows.push({
          id: `${toISO(d)}-${r.shift}-${r.roleTag}`,
          date: toVN(toISO(d)),
          shift: `Ca ${r.shift.toLowerCase()}`,
          roleTag: r.roleTag,
          required: r.count,
          assigned,
          missing: r.count - assigned,
        });
      }
    }
  }
  return rows;
}

// Lịch tuần hiện tại (T2 -> CN) theo lịch cố định, có lọc Role_Tag / ca
function weekSchedule(roleTag, shiftName) {
  const db = loadDb();
  return db.employees
    .filter((e) => roleTag === "all" || e.roleTag === roleTag)
    .map((e) => ({
      employee: e.name,
      shifts: Array.from({ length: 7 }, (_, i) => {
        const s = WEEKLY_PATTERN[e.id]?.[i] ?? null;
        return s && (shiftName === "all" || s === shiftName) ? s : null;
      }),
    }));
}

export function buildDashboard({ period = "week", from = "", to = "", roleTag = "all", shiftName = "all" } = {}) {
  const range = resolvePeriod({ period, from, to });
  const shifts = listShifts({ period, from, to, roleTag, shiftName });
  const total = shifts.length;
  const monday = mondayOf(startOfDay(new Date()));

  // Chi phí lương: cùng công thức với Bảng lương
  const payrollCost = payrollTotal(shifts);
  const lateCount = shifts.filter((s) => s.status === "Late").length;
  const absentCount = shifts.filter((s) => s.status === "Absent").length;

  const fill = fillStats(range, roleTag, shiftName);
  const fillRequired = Object.values(fill).reduce((a, v) => a + v.required, 0);
  const fillFilled = Object.values(fill).reduce((a, v) => a + v.filled, 0);

  const db = loadDb();
  // Giờ theo lịch so với giờ thực tế - theo nhân viên
  const hoursPerEmployee = db.employees
    .map((e) => {
      const list = shifts.filter((s) => s.employeeId === e.id);
      return {
        name: e.name,
        scheduled: hoursOf(list.reduce((a, s) => a + s.scheduledMin, 0)),
        actual: hoursOf(list.reduce((a, s) => a + s.actualMin, 0)),
        count: list.length,
      };
    })
    .filter((r) => r.count > 0);

  const sumHours = (k) => Math.round(hoursPerEmployee.reduce((a, r) => a + r[k], 0) * 10) / 10;

  // Chi phí lương theo kỳ: kỳ ngắn (<= 14 ngày) chia theo ngày, kỳ dài chia theo tuần
  const spanDays = range.from && range.to ? Math.round((new Date(range.to) - new Date(range.from)) / 86400000) + 1 : 0;
  const byDay = spanDays <= 14;
  const buckets = new Map();
  [...shifts].sort((a, b) => a.iso.localeCompare(b.iso)).forEach((s) => {
    const d = new Date(s.iso);
    const key = byDay ? s.iso : toISO(mondayOf(d));
    const label = byDay ? toVN(s.iso).slice(0, 5) : `Tuần ${toVN(key).slice(0, 5)}`;
    const cur = buckets.get(key) ?? { label, shifts: [] };
    cur.shifts.push(s);
    buckets.set(key, cur);
  });
  const costPerBucket = [...buckets.values()].map((b) => ({ label: b.label, cost: payrollTotal(b.shifts) }));

  const count = (st) => shifts.filter((s) => s.status === st).length;
  const attendance = [
    { name: "On-Time", value: count("On-Time") },
    { name: "Late", value: count("Late") },
    { name: "Early-Departure", value: count("Early-Departure") },
    { name: "Absent", value: count("Absent") },
  ];

  const fillByShift = SHIFT_NAMES.filter((n) => shiftName === "all" || n === shiftName).map((n) => ({
    shift: n,
    rate: pct(fill[n].filled, fill[n].required),
    required: fill[n].required,
    filled: fill[n].filled,
  }));

  const understaffed = upcomingUnderstaffed(roleTag, shiftName);

  const missingCheckoutList = shifts
    .filter((s) => s.status === "Missing-Checkout")
    .map((s) => {
      const emp = db.employees.find((e) => e.id === s.employeeId);
      return {
        id: s.id,
        employeeId: s.employeeId,
        employeeName: emp?.name ?? s.employeeId,
        date: toVN(s.iso),
        shiftName: s.shiftName,
        checkIn: s.checkInMin != null ? fmtMin(s.checkInMin) : "—",
      };
    });

  return {
    periodLabel: range.label,
    weekLabel: `${toVN(toISO(monday))} – ${toVN(toISO(addDays(monday, 6)))}`,
    from: range.from,
    to: range.to,
    empty: total === 0,
    cards: {
      totalShifts: total,
      scheduledHours: sumHours("scheduled"),
      actualHours: sumHours("actual"),
      payrollCost,
      lateCount,
      lateRate: pct(lateCount, total),
      absentCount,
      absentRate: pct(absentCount, total),
      fillRate: pct(fillFilled, fillRequired),
      fillFilled,
      fillRequired,
    },
    hoursPerEmployee,
    costPerBucket,
    attendance,
    fillByShift,
    schedule: weekSchedule(roleTag, shiftName),
    todo: {
      pendingLeave: 2,
      pendingExchange: 1,
      understaffed: understaffed.length,
      missingCheckout: count("Missing-Checkout"),
      missingCheckoutList,
    },
    understaffed,
    kpis: {
      fillRate: pct(fillFilled, fillRequired),
      requiredSlots: fillRequired,
      filledSlots: fillFilled,
      attendanceRate: pct(total - count("Absent"), total),
      lateRate: pct(lateCount, total),
      absentRate: pct(absentCount, total),
      scheduledHours: sumHours("scheduled"),
      actualHours: sumHours("actual"),
      totalCost: payrollCost,
    },
    attendanceCounts: {
      total,
      onTime: count("On-Time"),
      late: count("Late"),
      early: count("Early-Departure"),
      absent: count("Absent"),
      missingCheckout: count("Missing-Checkout"),
    },
    issues: {
      pendingLeave: 2,
      pendingExchange: 1,
      missingCheckout: count("Missing-Checkout"),
      missingCheckoutList,
    },
  };
}

// ==========================================
// THAO TÁC LỊCH LÀM VIỆC (SCHEDULE)
// ==========================================
export function getSavedSchedules() {
  const db = loadDb();
  return db.schedules || generateInitialScheduleDict(db.employees);
}

export function saveSchedules(schedules) {
  const db = loadDb();
  db.schedules = schedules;
  saveDb();
  notifyListeners();
}

export function isScheduleConfirmed() {
  const db = loadDb();
  return !!db.isScheduleConfirmed;
}

export function confirmSchedule(newSchedules) {
  const db = loadDb();
  if (newSchedules) {
    db.schedules = newSchedules;
  }
  const schedules = db.schedules || {};
  db.isScheduleConfirmed = true;

  // Đồng bộ các ca của tuần hiện tại vào db.attendance
  const today = startOfDay(new Date());
  const monday = mondayOf(today);
  const dayKeys = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const shiftDefsMap = {
    morning: { name: "Sáng", ...SHIFT_DEFS["Sáng"] },
    afternoon: { name: "Chiều", ...SHIFT_DEFS["Chiều"] },
    evening: { name: "Tối", ...SHIFT_DEFS["Tối"] },
  };

  dayKeys.forEach((dKey, dIndex) => {
    const day = addDays(monday, dIndex);
    const iso = toISO(day);

    ["morning", "afternoon", "evening"].forEach((sKey) => {
      const fullKey = `${sKey}_${dKey}`;
      const shiftData = schedules[fullKey];
      if (!shiftData || !shiftData.assigned) return;

      const def = shiftDefsMap[sKey];
      shiftData.assigned.forEach((emp) => {
        const id = `${emp.id}_${iso}`;
        const existing = db.attendance.find((a) => a.id === id);
        if (!existing) {
          const sMin = toMin(def.start);
          const eMin = toMin(def.end);
          db.attendance.push({
            id,
            employeeId: emp.id,
            iso,
            shiftName: def.name,
            sMin,
            eMin,
            def,
            checkInMin: sMin,
            checkOutMin: eMin,
            adjusted: false,
            adjustmentHistory: [],
          });
        }
      });
    });
  });

  saveDb();
  notifyListeners();
  return true;
}
