// Dữ liệu giả cho US21 (Đối soát chấm công) và US22 (Điều chỉnh chấm công).
// Đọc và ghi thẳng vào sổ cái chung (src/mocks/db.js).
import {
  STATUSES,
  buildAttendance as dbBuildAttendance,
  adjustAttendance,
  getShiftHistory,
} from "./db";

export { STATUSES };

export function buildAttendance(params) {
  return dbBuildAttendance(params);
}

export function adjustRecord(id, payload) {
  return adjustAttendance(id, payload);
}

export const recordHistory = (id) => getShiftHistory(id);