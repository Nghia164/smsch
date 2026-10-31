// =============================================================================
// DỮ LIỆU DÙNG CHUNG ĐỒNG BỘ 100% VỚI WORKHOURS, DASHBOARD VÀ CHẤM CÔNG
// =============================================================================
import {
  WEEKLY_PATTERN,
  mondayOf,
  addDays,
  toISO,
  toVN,
  startOfDay,
} from "./workHours";

import {
  liveEmployeeRoster,
  getEmployeeById as dbGetEmployeeById,
  getSavedSchedules as dbGetSavedSchedules,
  saveSchedules as dbSaveSchedules,
  confirmSchedule as dbConfirmSchedule,
  isScheduleConfirmed as dbIsScheduleConfirmed,
} from "./db";

// 1. DANH SÁCH NHÂN VIÊN (ĐỒNG BỘ 100% TỪ DB - SINGLE SOURCE OF TRUTH)
export const employeeRoster = liveEmployeeRoster;

// Helper lấy nhân viên theo ID
export const getEmployeeById = (id) => dbGetEmployeeById(id);


// 2. TÍNH TOÁN 7 NGÀY TRONG TUẦN HIỆN TẠI (ĐỒNG BỘ ĐỘNG VỚI WORKHOURS)
export const getWeekDays = (baseDate = new Date()) => {
  const mon = mondayOf(startOfDay(baseDate));
  const dayNames = [
    { id: "T2", label: "T2", name: "Thứ 2" },
    { id: "T3", label: "T3", name: "Thứ 3" },
    { id: "T4", label: "T4", name: "Thứ 4" },
    { id: "T5", label: "T5", name: "Thứ 5" },
    { id: "T6", label: "T6", name: "Thứ 6" },
    { id: "T7", label: "T7", name: "Thứ 7" },
    { id: "CN", label: "CN", name: "Chủ nhật" },
  ];

  return dayNames.map((d, index) => {
    const cur = addDays(mon, index);
    const iso = toISO(cur);
    const vn = toVN(iso);
    const [day, month] = vn.split("/");
    return {
      id: d.id,
      dayIndex: index,
      label: d.label,
      date: `${day}/${month}`,
      fullDate: `${d.name}, ${vn}`,
      iso,
      active: true,
    };
  });
};

export const initialDays = getWeekDays();

export const getCurrentWeekLabel = (baseDate = new Date()) => {
  const mon = mondayOf(startOfDay(baseDate));
  const sun = addDays(mon, 6);
  return `Tuần ${toVN(toISO(mon))} – ${toVN(toISO(sun))}`;
};

// 3. ĐỊNH NGHĨA CA VÀ NHU CẦU ĐỊNH BIÊN (KHỚP SHIFT_DEFS & DASHBOARD REQUIREMENTS)
export const initialShiftDemands = [
  {
    id: "morning",
    name: "Ca sáng (06:00 - 12:00)",
    shortName: "Sáng",
    time: "06:00 - 12:00",
    phucVu: 1,
    phaChe: 1,
    thuNgan: 0,
    total: 2,
    color: "blue",
  },
  {
    id: "afternoon",
    name: "Ca chiều (12:00 - 17:00)",
    shortName: "Chiều",
    time: "12:00 - 17:00",
    phucVu: 0,
    phaChe: 1,
    thuNgan: 1,
    total: 2,
    color: "amber",
  },
  {
    id: "evening",
    name: "Ca tối (17:00 - 22:00)",
    shortName: "Tối",
    time: "17:00 - 22:00",
    phucVu: 1,
    phaChe: 0,
    thuNgan: 0,
    total: 1,
    color: "indigo",
  },
];

// Nhu cầu chi tiết từng ngày khớp với REQUIREMENTS trong dashboardStats.js
// Giúp khớp chính xác 2 ca thiếu nhân sự demo:
// - Thứ 3 (T3) Chiều: thiếu 1 Pha chế
// - Thứ 6 (T6) Tối: thiếu 1 Thu ngân
export const DAILY_SHIFT_REQUIREMENTS = {
  T2: {
    morning: { phucVu: 1, phaChe: 0, thuNgan: 0, total: 1 },
    afternoon: { phucVu: 0, phaChe: 1, thuNgan: 0, total: 1 },
    evening: { phucVu: 0, phaChe: 1, thuNgan: 0, total: 1 },
  },
  T3: {
    morning: { phucVu: 0, phaChe: 0, thuNgan: 1, total: 1 },
    afternoon: { phucVu: 0, phaChe: 1, thuNgan: 0, total: 1 }, // ⚠️ Thiếu 1 Barista (demo)
    evening: { phucVu: 1, phaChe: 0, thuNgan: 0, total: 1 },
  },
  T4: {
    morning: { phucVu: 0, phaChe: 0, thuNgan: 1, total: 1 },
    afternoon: { phucVu: 0, phaChe: 0, thuNgan: 1, total: 1 },
    evening: { phucVu: 0, phaChe: 1, thuNgan: 0, total: 1 },
  },
  T5: {
    morning: { phucVu: 1, phaChe: 0, thuNgan: 0, total: 1 },
    afternoon: { phucVu: 0, phaChe: 0, thuNgan: 1, total: 1 },
    evening: { phucVu: 0, phaChe: 1, thuNgan: 0, total: 1 },
  },
  T6: {
    morning: { phucVu: 0, phaChe: 1, thuNgan: 0, total: 1 },
    afternoon: { phucVu: 0, phaChe: 1, thuNgan: 1, total: 2 },
    evening: { phucVu: 0, phaChe: 0, thuNgan: 1, total: 1 }, // ⚠️ Thiếu 1 Cashier (demo)
  },
  T7: {
    morning: { phucVu: 0, phaChe: 1, thuNgan: 1, total: 2 },
    afternoon: { phucVu: 0, phaChe: 1, thuNgan: 0, total: 1 },
    evening: { phucVu: 1, phaChe: 0, thuNgan: 0, total: 1 },
  },
  CN: {
    morning: { phucVu: 1, phaChe: 0, thuNgan: 1, total: 2 },
    afternoon: { phucVu: 0, phaChe: 1, thuNgan: 0, total: 1 },
    evening: { phucVu: 0, phaChe: 0, thuNgan: 1, total: 1 },
  },
};

// 4. DANH SÁCH CA MẪU (DÙNG CHO SHIFT TEMPLATES PAGE - ĐỒNG BỘ VỚI SHIFT_DEFS)
export const initialShiftTemplates = [
  {
    id: "tpl_morning",
    code: "SHIFT-SANG",
    name: "Ca sáng",
    startTime: "06:00",
    endTime: "12:00",
    duration: 6,
    color: "blue",
    phucVu: 1,
    phaChe: 1,
    thuNgan: 0,
    total: 2,
    status: "active",
    desc: "Ca mở cửa phục vụ cà phê sáng, điểm tâm và chuẩn bị thiết bị.",
    hourlyRateMultiplier: 1.0,
  },
  {
    id: "tpl_afternoon",
    code: "SHIFT-CHIEU",
    name: "Ca chiều",
    startTime: "12:00",
    endTime: "17:00",
    duration: 5,
    color: "amber",
    phucVu: 0,
    phaChe: 1,
    thuNgan: 1,
    total: 2,
    status: "active",
    desc: "Ca phục vụ khách giờ trưa, xế chiều và tiếp nhận bàn giao nguyên liệu.",
    hourlyRateMultiplier: 1.0,
  },
  {
    id: "tpl_evening",
    code: "SHIFT-TOI",
    name: "Ca tối",
    startTime: "17:00",
    endTime: "22:00",
    duration: 5,
    color: "indigo",
    phucVu: 1,
    phaChe: 0,
    thuNgan: 0,
    total: 1,
    status: "active",
    desc: "Ca tối phục vụ đồ uống, dọn dẹp kiểm kê đóng cửa (hệ số ca đêm x1.2).",
    hourlyRateMultiplier: 1.2,
  },
  {
    id: "tpl_peak",
    code: "SHIFT-PEAK",
    name: "Ca cao điểm (Part-time)",
    startTime: "11:00",
    endTime: "14:00",
    duration: 3,
    color: "emerald",
    phucVu: 1,
    phaChe: 1,
    thuNgan: 0,
    total: 2,
    status: "active",
    desc: "Ca tăng cường khung giờ đông khách buổi trưa.",
    hourlyRateMultiplier: 1.0,
  },
];

// 5. CÁC RÀNG BUỘC KHI XẾP LỊCH (ĐỒNG BỘ BLLĐ 2019 & SHIFT_CONFIG)
export const initialConstraints = [
  {
    id: "sufficient_staff",
    category: "hard",
    title: "Đủ số lượng nhân viên",
    desc: "Đảm bảo mỗi ca có đủ số lượng nhân viên theo nhu cầu định biên.",
    type: "users",
    color: "blue",
    enabled: true,
  },
  {
    id: "no_overlap",
    category: "hard",
    title: "Không trùng ca",
    desc: "Đảm bảo nhân viên không được phân công các ca bị trùng thời gian.",
    type: "clock",
    color: "indigo",
    enabled: true,
  },
  {
    id: "min_rest",
    category: "hard",
    title: "Thời gian nghỉ tối thiểu",
    desc: "Đảm bảo nhân viên có đủ thời gian nghỉ giữa 2 ngày làm liên tiếp (Điều 109 BLLĐ 2019, tối thiểu 12 giờ).",
    type: "coffee",
    color: "orange",
    enabled: true,
    inputLabel: "Thời gian nghỉ tối thiểu",
    value: 12,
    unit: "giờ",
  },
  {
    id: "max_consecutive",
    category: "hard",
    title: "Số ngày làm liên tiếp tối đa",
    desc: "Đảm bảo mỗi tuần có ít nhất 24h nghỉ ngơi liên tục (Bộ luật Lao động).",
    type: "alert",
    color: "red",
    enabled: true,
    inputLabel: "Số ngày liên tiếp tối đa",
    value: 6,
    unit: "ngày",
  },
  {
    id: "max_hours",
    category: "hard",
    title: "Giới hạn giờ làm việc",
    desc: "Không cho nhân viên vượt quá số giờ làm tối đa mỗi tuần (tối đa 48 giờ/tuần).",
    type: "timer",
    color: "green",
    enabled: true,
    inputLabel: "Số giờ làm tối đa",
    value: 40,
    unit: "giờ/tuần",
  },
  {
    id: "no_clopening",
    category: "hard",
    title: "Không xếp ca tối rồi ca sáng hôm sau",
    desc: "Nhân viên đóng ca tối muộn thì hôm sau không bị xếp ca mở cửa sáng sớm.",
    type: "clock",
    color: "indigo",
    enabled: true,
  },
  {
    id: "respect_approved_leave",
    category: "hard",
    title: "Không xếp ca vào ngày nghỉ đã duyệt",
    desc: "Nhân viên có đơn xin nghỉ đã được Manager duyệt sẽ không bị xếp ca.",
    type: "alert",
    color: "red",
    enabled: true,
  },
  {
    id: "role_match",
    category: "hard",
    title: "Theo vai trò chuyên môn (Role_Tag)",
    desc: "Chỉ phân công nhân viên vào ca phù hợp với vai trò yêu cầu (Shift_Leader, Barista, Cashier).",
    type: "shield",
    color: "amber",
    enabled: true,
  },
  {
    id: "fair_hours_distribution",
    category: "soft",
    title: "Phân bổ giờ làm công bằng",
    desc: "Cố gắng chia đều tổng số giờ làm việc giữa các nhân viên trong tuần để đảm bảo công bằng.",
    type: "timer",
    color: "green",
    enabled: true,
  },
  {
    id: "availability",
    category: "soft",
    title: "Theo thời gian rảnh",
    desc: "Chỉ phân công nhân viên vào những ca mà họ đã đăng ký rảnh.",
    type: "calendar",
    color: "orange",
    enabled: true,
  },
  {
    id: "fair_weekend_distribution",
    category: "soft",
    title: "Chia đều ca cuối tuần",
    desc: "Chia đều các ca Thứ 7 và Chủ nhật giữa các nhân viên trong nhóm.",
    type: "calendar",
    color: "blue",
    enabled: true,
  },
];

export const WEEK_LABEL = "Tuần 12/10/2026 – 18/10/2026";

// Hàm hợp nhất cấu hình từ Ca & Ràng buộc (ShiftConfig) sang Tạo lịch tự động
export function mergeConfigConstraints(baseConstraints, savedConstraintsList) {
  if (!Array.isArray(savedConstraintsList) || savedConstraintsList.length === 0) {
    return baseConstraints;
  }
  const savedMap = new Map(savedConstraintsList.map((c) => [c.id, c]));
  return baseConstraints.map((c) => {
    let s = savedMap.get(c.id);
    if (!s) {
      if (c.id === "min_rest") s = savedMap.get("rest_between_shifts");
      else if (c.id === "max_consecutive") s = savedMap.get("max_consecutive_days");
      else if (c.id === "max_hours") s = savedMap.get("max_hours_per_week");
      else if (c.id === "role_match") s = savedMap.get("skill_match");
      else if (c.id === "availability") s = savedMap.get("preference_matching");
      else if (c.id === "fair_hours_distribution") s = savedMap.get("fair_hours_distribution");
    }
    if (!s) return c;
    return {
      ...c,
      enabled: s.enabled !== undefined ? !!s.enabled : c.enabled,
      ...(s.value !== undefined && { value: s.value }),
    };
  });
}

export function mergeConfigShifts(baseDemands, savedShiftsList) {
  if (!Array.isArray(savedShiftsList) || savedShiftsList.length === 0) {
    return baseDemands;
  }
  const shiftMap = new Map(savedShiftsList.map((s) => [s.code || s.name, s]));
  return baseDemands.map((demand) => {
    const s = shiftMap.get(demand.id) || shiftMap.get(demand.shortName);
    if (!s) return demand;
    const timeStr = s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : demand.time;
    return {
      ...demand,
      time: timeStr,
      name: `Ca ${s.name || demand.shortName} (${timeStr})`,
    };
  });
}

export function getShiftInfo(schedules, shiftDemands, days, selectedShiftKey) {
  const [shiftId, dayId] = selectedShiftKey.split("_");
  const demand = shiftDemands.find((d) => d.id === shiftId) || shiftDemands[0];
  const day = days.find((d) => d.id === dayId) || days[1];
  const shiftSchedule = schedules[selectedShiftKey] || { assigned: [] };
  const assigned = shiftSchedule.assigned || [];

  const pvAssigned = assigned.filter((e) => e.role === "Phục vụ").length;
  const pcAssigned = assigned.filter((e) => e.role === "Pha chế").length;
  const tnAssigned = assigned.filter((e) => e.role === "Thu ngân").length;

  const pvMissing = Math.max(0, demand.phucVu - pvAssigned);
  const pcMissing = Math.max(0, demand.phaChe - pcAssigned);
  const tnMissing = Math.max(0, demand.thuNgan - tnAssigned);
  const totalMissing = Math.max(0, demand.total - assigned.length);

  return {
    shiftKey: selectedShiftKey,
    shiftId,
    dayId,
    demand,
    day,
    assigned,
    pvAssigned,
    pcAssigned,
    tnAssigned,
    pvMissing,
    pcMissing,
    tnMissing,
    totalMissing,
    isSatisfied: assigned.length >= demand.total,
  };
}

export function roleBadgeClass(role) {
  if (role === "Phục vụ") return "bg-[#E8EEFB] text-[#3452A8] border-[#BFD0F5]";
  if (role === "Pha chế") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-purple-50 text-purple-700 border-purple-200";
}

// 6. KHỞI TẠO LỊCH TUẦN TRÍCH XUẤT 100% TỪ WEEKLY_PATTERN TRONG WORKHOURS.JS
export const generateInitialSchedules = () => {
  const sched = {};
  const dayKeys = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  // Tạo khung rỗng cho 21 ca trong tuần
  dayKeys.forEach((d) => {
    sched[`morning_${d}`] = { shiftId: "morning", dayId: d, assigned: [] };
    sched[`afternoon_${d}`] = { shiftId: "afternoon", dayId: d, assigned: [] };
    sched[`evening_${d}`] = { shiftId: "evening", dayId: d, assigned: [] };
  });

  // Đọc từ WEEKLY_PATTERN: { empId: { dayIndex: "Sáng" | "Chiều" | "Tối" } }
  Object.entries(WEEKLY_PATTERN).forEach(([empId, pattern]) => {
    const emp = getEmployeeById(empId);
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
};

// 7. LƯU TRỮ VÀ ĐỒNG BỘ QUA DB (SINGLE SOURCE OF TRUTH)
export const getSavedSchedules = () => dbGetSavedSchedules();
export const saveSchedules = (schedules) => dbSaveSchedules(schedules);
export const confirmSchedule = (schedules) => dbConfirmSchedule(schedules);
export const isScheduleConfirmed = () => dbIsScheduleConfirmed();

const TEMPLATE_STORAGE_KEY = "smart_scheduling_shift_templates";


export const getSavedTemplates = () => {
  try {
    const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Failed to load templates from localStorage:", err);
  }
  return initialShiftTemplates;
};

export const saveTemplates = (templates) => {
  try {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
  } catch (err) {
    console.error("Failed to save templates to localStorage:", err);
  }
};
