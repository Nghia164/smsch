import httpClient from "./httpClient";
import { mockEmployees, mockRoleTags, buildSummary, buildDetail } from "../mocks/workHours";
import { subscribe as dbSubscribe } from "../mocks/db";

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

// US13 - Tổng hợp giờ làm (Manager)
// Toàn bộ đọc/ghi mock đều đi qua src/mocks/db.js (Single Source of Truth)

export const subscribeWorkHours = (listener) => dbSubscribe(listener);

// Danh sách nhân viên + Role_Tag để đổ vào 2 bộ lọc
export async function getEmployeeOptions() {
  if (USE_MOCK) return { employees: mockEmployees, roleTags: mockRoleTags };
  const res = await httpClient.get("/employees", { params: { fields: "id,name,roleTag" } });
  return res.data;
}

// Bảng tổng hợp theo kỳ + bộ lọc. params: { period: "week"|"month"|"range", from, to, employeeId, roleTag }
export async function getWorkHoursSummary(params) {
  if (USE_MOCK) return buildSummary(params);
  const res = await httpClient.get("/work-hours", { params });
  return res.data;
}

// Chi tiết từng ca của một nhân viên trong kỳ đang xem
export async function getEmployeeShiftDetail(employeeId, params) {
  if (USE_MOCK) return buildDetail(employeeId, params);
  const res = await httpClient.get(`/work-hours/${employeeId}/shifts`, { params });
  return res.data;
}
