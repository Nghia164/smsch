// Service cho màn Tạo lịch tự động (US09, US10) và Lịch đã tạo.
// Tập trung toàn bộ thao tác dữ liệu, tương tác Mock & API chuẩn hóa.
import {
  employeeRoster,
  initialDays,
  initialShiftDemands,
  initialConstraints,
  DAILY_SHIFT_REQUIREMENTS,
  generateInitialSchedules,
  getSavedSchedules,
  saveSchedules,
  confirmSchedule,
  isScheduleConfirmed,
  getShiftInfo,
  roleBadgeClass,
  mergeConfigConstraints,
  mergeConfigShifts,
  WEEK_LABEL,
} from "../mocks/scheduleMockData";

export {
  employeeRoster,
  initialDays,
  initialShiftDemands,
  initialConstraints,
  DAILY_SHIFT_REQUIREMENTS,
  generateInitialSchedules,
  getSavedSchedules,
  saveSchedules,
  confirmSchedule,
  isScheduleConfirmed,
  getShiftInfo,
  roleBadgeClass,
  mergeConfigConstraints,
  mergeConfigShifts,
  WEEK_LABEL,
};

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

/** Lấy toàn bộ dữ liệu bảng lịch làm việc tuần */
export async function getScheduleBoard(weekKey) {
  await delay(200);
  const schedules = getSavedSchedules();
  return {
    weekKey: weekKey || WEEK_LABEL,
    schedules,
    employees: employeeRoster,
    days: initialDays,
    demands: initialShiftDemands,
    constraints: initialConstraints,
  };
}

/** Lưu bản nháp lịch làm việc tuần */
export async function saveScheduleDraft(schedules) {
  await delay(250);
  saveSchedules(schedules);
  return { ok: true, schedules };
}

/** Công bố lịch làm việc chính thức (Official) */
export async function publishSchedule(schedules) {
  await delay(400);
  confirmSchedule(schedules);
  return { ok: true, status: "OFFICIAL", schedules };
}
