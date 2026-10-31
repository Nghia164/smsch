import {
  liveEmployeeRoster,
  pad,
  toISO,
  toVN,
  toMin,
  fmtMin,
  SHIFT_DEFS,
  SHIFT_NAMES,
  getLiveSettings,
  WEEKLY_PATTERN,
  startOfDay,
  mondayOf,
  addDays,
  getCalculatedShifts,
  getShiftById,
  getShiftHistory,
  adjustAttendance,
  resolvePeriod,
  buildWorkHoursSummary,
  buildWorkHoursDetail,
  listShifts,
} from "./db.js";

// US13 / US21 / US24 - Đồng bộ 100% dữ liệu qua db.js (Single Source of Truth)
export const mockEmployees = liveEmployeeRoster;
export const mockRoleTags = ["Shift_Leader", "Barista", "Cashier", "Waiter"];

export {
  pad,
  toISO,
  toVN,
  toMin,
  fmtMin,
  SHIFT_DEFS,
  SHIFT_NAMES,
  getLiveSettings,
  WEEKLY_PATTERN,
  startOfDay,
  mondayOf,
  addDays,
  getCalculatedShifts,
  getShiftById,
  getShiftHistory,
  resolvePeriod,
  listShifts,
};

export const GRACE_MIN = 5;

export const adjustShift = (id, payload) => adjustAttendance(id, payload);
export const buildSummary = (params) => buildWorkHoursSummary(params);
export const buildDetail = (employeeId, params) => buildWorkHoursDetail(employeeId, params);