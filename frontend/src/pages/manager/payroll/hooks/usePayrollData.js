import { useState, useEffect, useMemo } from "react";
import { getPayrollSummary, subscribePayroll } from "../../../../services/payrollService";
import { computeTotals } from "../../../../mocks/payroll";
import { currentMonth, monthRange } from "../payrollData";

/**
 * Hook quản lý trạng thái, dữ liệu và bộ lọc của Bảng lương (US23)
 */
export function usePayrollData() {
  const [period, setPeriod] = useState("month");
  const [month, setMonth] = useState(currentMonth());
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [contract, setContract] = useState("all");
  const [search, setSearch] = useState("");

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const canClear =
    period !== "month" ||
    month !== currentMonth() ||
    fromDate !== "" ||
    toDate !== "" ||
    contract !== "all" ||
    search !== "";

  const resetFilters = () => {
    setPeriod("month");
    setMonth(currentMonth());
    setFromDate("");
    setToDate("");
    setContract("all");
    setSearch("");
  };

  const rangeError = useMemo(() => {
    if (period === "month") return month ? "" : "Vui lòng chọn tháng/năm.";
    if (!fromDate || !toDate) return "Vui lòng chọn đủ Từ ngày và Đến ngày.";
    if (fromDate > toDate) return "“Từ ngày” không được lớn hơn “Đến ngày”.";
    return "";
  }, [period, month, fromDate, toDate]);

  // Đổi tháng/năm thành khoảng ngày để service xử lý đồng nhất
  const query = useMemo(() => {
    if (period === "month" && month) {
      const m = monthRange(month);
      return { period: "range", from: m.from, to: m.to, label: m.label };
    }
    return { period: "range", from: fromDate, to: toDate };
  }, [period, month, fromDate, toDate]);

  // Lắng nghe cập nhật từ Single Source of Truth
  useEffect(() => {
    const unsub = subscribePayroll(() => {
      setRefreshKey((k) => k + 1);
    });
    return unsub;
  }, []);

  // Tải dữ liệu bảng lương
  useEffect(() => {
    if (rangeError) {
      queueMicrotask(() => setLoading(false));
      return undefined;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError("");
      }
    });
    getPayrollSummary(query)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError("Không tải được dữ liệu bảng lương");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, rangeError, refreshKey]);

  const calculated = !!data;
  const keyword = search.trim().toLowerCase();

  const rows = useMemo(
    () =>
      (calculated ? data.rows : [])
        .filter(
          (r) =>
            (contract === "all" || r.contract === contract) &&
            (!keyword || `${r.name} ${r.employeeId}`.toLowerCase().includes(keyword))
        )
        .map((r) => ({ ...r, id: r.employeeId })),
    [data, calculated, contract, keyword]
  );

  const totals = useMemo(() => computeTotals(rows), [rows]);

  const visibleEmployeeIds = useMemo(() => new Set(rows.map((r) => r.employeeId)), [rows]);

  const missing = useMemo(() => {
    if (!calculated) return 0;
    if (data.issues?.missingShifts) {
      return data.issues.missingShifts.filter((s) => visibleEmployeeIds.has(s.employeeId)).length;
    }
    return data.issues?.missingCheckout ?? 0;
  }, [calculated, data, visibleEmployeeIds]);

  const hasData = calculated && data.rows.length > 0;
  const partial = calculated && !!data.to && data.to > new Date().toLocaleDateString("sv-SE");

  const runCalculation = async () => {
    if (rangeError || loading) return;
    setLoading(true);
    setError("");
    try {
      const d = await getPayrollSummary(query);
      setData(d);
      return d;
    } catch {
      setError("Không tải được dữ liệu bảng lương");
      throw new Error("Không tải được dữ liệu bảng lương");
    } finally {
      setLoading(false);
    }
  };

  return {
    period,
    setPeriod,
    month,
    setMonth,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    contract,
    setContract,
    search,
    setSearch,
    canClear,
    resetFilters,
    rangeError,
    query,
    data,
    rows,
    totals,
    missing,
    hasData,
    calculated,
    partial,
    loading,
    error,
    runCalculation,
  };
}
