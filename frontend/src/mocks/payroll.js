// Dữ liệu cho lương (US23) - dùng chung cho Bảng lương, Báo cáo (US25) và Dashboard (US24)
// Đọc và tính toán TRỰC TIẾP từ src/mocks/db.js (Single Source of Truth)
import {
  getEmployees,
  updateEmployee,
  computePayroll as dbComputePayroll,
  computeTotals as dbComputeTotals,
  computeEmployeeDetail as dbComputeEmployeeDetail,
  payrollTotal as dbPayrollTotal,
} from "./db.js";

// Proxy đọc mức lương giờ trực tiếp từ danh sách nhân viên trong DB
export const HOURLY_WAGE = new Proxy({}, {
  get(target, prop) {
    if (typeof prop !== "string") return undefined;
    const emps = getEmployees();
    const emp = emps.find((e) => e.id === prop);
    return emp?.hourlyWage ?? 28000;
  },
});

// Proxy đọc loại hợp đồng trực tiếp từ danh sách nhân viên trong DB
export const CONTRACT = new Proxy({}, {
  get(target, prop) {
    if (typeof prop !== "string") return undefined;
    const emps = getEmployees();
    const emp = emps.find((e) => e.id === prop);
    return emp?.contract ?? "Part-time";
  },
});

export function getSavedWageRates() {
  const emps = getEmployees();
  const rates = {};
  emps.forEach((e) => {
    rates[e.id] = e.hourlyWage || 28000;
  });
  return rates;
}

export function saveWageRates(rates) {
  if (!rates || typeof rates !== "object") return;
  Object.entries(rates).forEach(([id, wage]) => {
    try {
      updateEmployee(id, { hourlyWage: Number(wage) });
    } catch {
      // Bỏ qua nếu id không tồn tại
    }
  });
}

export function computePayroll(shifts) {
  return dbComputePayroll(shifts);
}

export function computeTotals(rows) {
  return dbComputeTotals(rows);
}

export function countMissingCheckout(shifts) {
  return shifts.filter((s) => s.status === "Missing-Checkout").length;
}

export function computeEmployeeDetail(shifts, employeeId) {
  return dbComputeEmployeeDetail(shifts, employeeId);
}

export const payrollTotal = (shifts) => dbPayrollTotal(shifts);

export const PAYROLL_COLUMNS = [
  { key: "name", label: "Nhân viên", width: 26 },
  { key: "employeeId", label: "Mã NV", width: 10 },
  { key: "contract", label: "Loại hợp đồng", width: 16 },
  { key: "actualHours", label: "Tổng giờ thực tế", align: "right", format: "hours", width: 18 },
  { key: "nightHours", label: "Giờ ca đêm", align: "right", format: "hours", width: 14 },
  { key: "holidayHours", label: "Giờ ngày lễ", align: "right", format: "hours", width: 14 },
  { key: "basePay", label: "Lương cơ bản", align: "right", format: "money", width: 18 },
  { key: "surcharge", label: "Phần tăng theo hệ số", align: "right", format: "money", width: 22 },
  { key: "openShiftBonus", label: "Thưởng Open Shift", align: "right", format: "money", width: 20 },
  { key: "total", label: "Tổng lương", align: "right", format: "money", width: 18 },
];