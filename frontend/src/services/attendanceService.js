import httpClient from "./httpClient";
import { buildAttendance, adjustRecord, recordHistory } from "../mocks/attendanceRecon";
import { subscribe as dbSubscribe } from "../mocks/db";

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

// FR11 - check-in/out và chỉnh chấm công
// Toàn bộ đọc/ghi mock đều đi qua src/mocks/db.js (Single Source of Truth)

export const subscribeAttendance = (listener) => dbSubscribe(listener);

// ---------- Staff (US23) - giữ nguyên như cũ ----------
export const checkIn = (data) => httpClient.post("/attendance/check-in", data).then((r) => r.data);
export const checkOut = (data) => httpClient.post("/attendance/check-out", data).then((r) => r.data);
export const getAttendance = (params) => httpClient.get("/attendance", { params }).then((r) => r.data);

// ---------- Manager (US21-22) ----------

// Đối soát chấm công: danh sách bản ghi + thẻ tổng hợp theo trạng thái.
// params: { period: "week"|"month"|"range", from, to, employeeId, status }
export async function getAttendanceRecords(params) {
  if (USE_MOCK) return buildAttendance(params);
  const res = await httpClient.get("/attendance/reconciliation", { params });
  return res.data;
}

// Điều chỉnh một bản ghi. payload: { checkIn: "HH:MM", checkOut: "HH:MM", reason, modifier }
// Lỗi nghiệp vụ (thiếu lý do...) được ném ra dưới dạng Error có message tiếng Việt.
export async function adjustAttendance(id, payload) {
  if (USE_MOCK) return adjustRecord(id, payload);
  try {
    const res = await httpClient.put(`/attendance/${id}`, payload);
    return res.data;
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Không lưu được điều chỉnh. Vui lòng thử lại.", { cause: err });
  }
}

// Lịch sử các lần điều chỉnh của một bản ghi
export async function getAttendanceHistory(id) {
  if (USE_MOCK) return recordHistory(id);
  const res = await httpClient.get(`/attendance/${id}/history`);
  return res.data;
}
