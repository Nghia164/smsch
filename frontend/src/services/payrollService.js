import httpClient from "./httpClient";
import { listShifts, resolvePeriod } from "../mocks/workHours";
import { computePayroll, computeTotals, computeEmployeeDetail } from "../mocks/payroll";
import {
  lockPayrollPeriod as dbLockPayrollPeriod,
  unlockPayrollPeriod as dbUnlockPayrollPeriod,
  isPeriodLocked,
  getPayrollLocks,
  subscribe as dbSubscribe,
} from "../mocks/db";

// Đơn giá lương giờ: giữ nguyên tên hàm cũ, logic lưu nằm ở mocks/payroll.js (dùng chung với Dashboard/Báo cáo)
export { getSavedWageRates, saveWageRates } from "../mocks/payroll";
export { getPayrollLocks, isPeriodLocked };

export const subscribePayroll = (listener) => dbSubscribe(listener);

export const lockPayrollPeriod = (periodKey) => dbLockPayrollPeriod(periodKey);
export const unlockPayrollPeriod = (periodKey) => dbUnlockPayrollPeriod(periodKey);

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

// US23 - Tổng hợp bảng lương theo kỳ
// Trả về: { periodLabel, from, to, rows, totals, isLocked, issues: { missingCheckout, missingShifts } }
export async function getPayrollSummary({ period = "month", from = "", to = "", label } = {}) {
  if (USE_MOCK) {
    await delay(100);
    const range = resolvePeriod({ period, from, to });
    const shifts = listShifts({ period, from, to });
    const rows = computePayroll(shifts);
    const missingShifts = shifts
      .filter((s) => s.status === "Missing-Checkout")
      .map((s) => ({ id: s.id, employeeId: s.employeeId, iso: s.iso, shiftName: s.shiftName }));

    const locked = isPeriodLocked(range.from) || isPeriodLocked(range.to);

    return {
      periodLabel: label ?? range.label,
      from: range.from,
      to: range.to,
      rows,
      totals: computeTotals(rows),
      isLocked: locked,
      issues: {
        missingCheckout: missingShifts.length,
        missingShifts,
      },
    };
  }
  const res = await httpClient.get("/payroll", { params: { period, from, to } });
  return res.data;
}

// Chi tiết phiếu lương của từng nhân viên (US23): từng ca + từng khoản thưởng Open Shift
export async function getEmployeePayslip(employeeId, { period = "month", from = "", to = "", label } = {}) {
  if (USE_MOCK) {
    await delay(100);
    const range = resolvePeriod({ period, from, to });
    const d = computeEmployeeDetail(listShifts({ period, from, to, employeeId }), employeeId);
    if (!d) throw new Error("Không tìm thấy nhân viên.");
    return {
      employee: d.employee,
      periodLabel: label ?? range.label,
      from: range.from,
      to: range.to,
      shifts: d.shifts,
      bonuses: d.bonuses,
      totalHours: d.summary?.actualHours ?? 0,
      totalSalary: d.shifts.reduce((a, s) => a + s.totalPay, 0),
      openShiftBonus: d.summary?.openShiftBonus ?? 0,
      netPay: d.summary?.total ?? 0,
    };
  }
  const res = await httpClient.get(`/payroll/employee/${employeeId}`, { params: { period, from, to } });
  return res.data;
}