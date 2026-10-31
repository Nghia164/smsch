import httpClient from "./httpClient";
import { buildReport, buildOverview } from "../mocks/reports";

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

// US25 - Báo cáo (xuất Excel). File Excel được tạo ở trình duyệt từ chính dữ liệu này
// (xem utils/exportExcel.js), nên Backend chỉ cần trả dữ liệu báo cáo.
// TODO: kiểm tra lại đường dẫn API và tên tham số với Backend (Laravel)

// type: "roster" | "hours" | "attendance" | "payroll" | "dashboard"
// params: { period: "week"|"month"|"range", from, to, employeeId, roleTag }
// Trả về: { title, sheetName, fileBase, periodLabel, columns, rows, footer?, extraSheets? }
export async function getReportData(type, params) {
  if (USE_MOCK) return buildReport(type, params);
  const res = await httpClient.get(`/reports/${type}`, { params });
  return res.data;
}

// Báo cáo tổng hợp theo kỳ cho màn "Báo cáo": thẻ chỉ số, dữ liệu biểu đồ, bảng lương, bảng giờ làm
// và các sheet sẽ xuất ra Excel. params: { period, from, to, roleTag }
export async function getReportOverview(params) {
  if (USE_MOCK) return buildOverview(params);
  const res = await httpClient.get("/reports/overview", { params });
  return res.data;
}