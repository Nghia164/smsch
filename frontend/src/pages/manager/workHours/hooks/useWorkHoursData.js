import { useState, useEffect, useMemo } from "react";
import { getEmployeeOptions, getWorkHoursSummary, subscribeWorkHours } from "../../../../services/workHoursService";
import { getEmployeeById } from "../../../../mocks/scheduleMockData";
import { round1 } from "../workHoursData";

/**
 * Hook quản lý trạng thái, dữ liệu và bộ lọc của Tổng hợp giờ làm việc (US13)
 */
export function useWorkHoursData() {
  const [period, setPeriod] = useState("week");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [employeeId, setEmployeeId] = useState("all");
  const [roleTag, setRoleTag] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("default");

  const [options, setOptions] = useState({ employees: [], roleTags: [] });
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const canClear =
    period !== "week" ||
    fromDate !== "" ||
    toDate !== "" ||
    employeeId !== "all" ||
    roleTag !== "all" ||
    searchTerm !== "" ||
    sortBy !== "default";

  const resetFilters = () => {
    setPeriod("week");
    setFromDate("");
    setToDate("");
    setEmployeeId("all");
    setRoleTag("all");
    setSearchTerm("");
    setSortBy("default");
  };

  const rangeError = useMemo(() => {
    if (period !== "range") return "";
    if (!fromDate || !toDate) return "Vui lòng chọn đủ Từ ngày và Đến ngày.";
    if (fromDate > toDate) return "“Từ ngày” không được lớn hơn “Đến ngày”.";
    return "";
  }, [period, fromDate, toDate]);

  // Tải danh mục nhân viên và vai trò
  useEffect(() => {
    getEmployeeOptions()
      .then(setOptions)
      .catch(() => setOptions({ employees: [], roleTags: [] }));

    const unsub = subscribeWorkHours(() => {
      getEmployeeOptions()
        .then(setOptions)
        .catch(() => {});
      setRefreshKey((k) => k + 1);
    });
    return unsub;
  }, []);

  // Tải bảng tổng hợp giờ làm
  useEffect(() => {
    if (rangeError) {
      queueMicrotask(() => {
        setSummary(null);
        setError("");
        setLoading(false);
      });
      return undefined;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError("");
      }
    });
    getWorkHoursSummary({ period, from: fromDate, to: toDate, employeeId, roleTag })
      .then((data) => !cancelled && setSummary(data))
      .catch(() => !cancelled && setError("Không tải được dữ liệu tổng hợp giờ làm"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [period, fromDate, toDate, employeeId, roleTag, rangeError, refreshKey]);

  const employeeMap = useMemo(() => {
    const map = {};
    for (const e of options.employees) map[e.id] = e;
    return map;
  }, [options.employees]);

  const rows = useMemo(() => {
    if (!summary) return [];
    let list = summary.rows.map((r) => {
      const emp = employeeMap[r.employeeId];
      const rosterEmp = getEmployeeById(r.employeeId);
      const scheduled = r.scheduledHours;
      const actual = r.actualHours;
      const ratio = scheduled > 0 ? Math.round((actual / scheduled) * 100) : actual > 0 ? 100 : 0;

      return {
        ...r,
        id: r.employeeId,
        name: emp?.name ?? rosterEmp?.name ?? r.employeeId,
        roleTag: emp?.roleTag ?? rosterEmp?.roleTag ?? "",
        role: rosterEmp?.role ?? "",
        contract: rosterEmp?.contract ?? "Toàn thời gian",
        diff: round1(actual - scheduled),
        ratio,
      };
    });

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.employeeId.toLowerCase().includes(q) ||
          r.roleTag.toLowerCase().includes(q)
      );
    }

    if (sortBy === "actual-desc") list.sort((a, b) => b.actualHours - a.actualHours);
    else if (sortBy === "diff-desc") list.sort((a, b) => b.diff - a.diff);
    else if (sortBy === "shifts-desc") list.sort((a, b) => b.shiftCount - a.shiftCount);

    return list;
  }, [summary, employeeMap, searchTerm, sortBy]);

  const totals = useMemo(() => {
    const t = rows.reduce(
      (acc, r) => ({
        shiftCount: acc.shiftCount + r.shiftCount,
        scheduledHours: acc.scheduledHours + r.scheduledHours,
        actualHours: acc.actualHours + r.actualHours,
        nightHours: acc.nightHours + r.nightHours,
        holidayHours: acc.holidayHours + r.holidayHours,
      }),
      { shiftCount: 0, scheduledHours: 0, actualHours: 0, nightHours: 0, holidayHours: 0 }
    );
    return {
      shiftCount: t.shiftCount,
      scheduledHours: round1(t.scheduledHours),
      actualHours: round1(t.actualHours),
      diff: round1(t.actualHours - t.scheduledHours),
      nightHours: round1(t.nightHours),
      holidayHours: round1(t.holidayHours),
    };
  }, [rows]);

  const overallRatio =
    totals.scheduledHours > 0
      ? Math.round((totals.actualHours / totals.scheduledHours) * 100)
      : totals.actualHours > 0
      ? 100
      : 0;

  return {
    period,
    setPeriod,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    employeeId,
    setEmployeeId,
    roleTag,
    setRoleTag,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    canClear,
    resetFilters,
    rangeError,
    options,
    summary,
    employeeMap,
    rows,
    totals,
    overallRatio,
    loading,
    error,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}
