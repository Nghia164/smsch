import { useState, useEffect, useMemo } from "react";
import { getEmployeeOptions } from "../../../../services/workHoursService";
import { getAttendanceRecords, subscribeAttendance } from "../../../../services/attendanceService";
import { todayISO, fmtDate, pad } from "../attendanceData";

/**
 * Hook quản lý trạng thái, dữ liệu và bộ lọc của trang Đối soát chấm công (US24)
 */
export function useAttendanceData() {
  const [currentTime, setCurrentTime] = useState(new Date());

  const [period, setPeriod] = useState("week");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("list"); // "list" | "grid"

  const [employees, setEmployees] = useState([]);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Cập nhật đồng hồ mỗi phút
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Nhãn hiển thị cho kỳ "Tuần này"
  const weekLabel = useMemo(() => {
    const start = new Date(currentTime);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${pad(start.getDate())}/${pad(start.getMonth() + 1)} – ${fmtDate(end)}`;
  }, [currentTime]);

  const canClear = period !== "week" || fromDate !== "" || toDate !== "" || status !== "all" || search !== "";
  const resetFilters = () => {
    setPeriod("week");
    setFromDate("");
    setToDate("");
    setStatus("all");
    setSearch("");
  };

  const rangeError = useMemo(() => {
    if (period !== "range") return "";
    if (!fromDate || !toDate) return "Vui lòng chọn đủ Từ ngày và Đến ngày.";
    if (fromDate > toDate) return "“Từ ngày” không được lớn hơn “Đến ngày”.";
    return "";
  }, [period, fromDate, toDate]);

  const query = useMemo(() => {
    if (period === "today") return { period: "range", from: todayISO(), to: todayISO() };
    return { period, from: fromDate, to: toDate };
  }, [period, fromDate, toDate]);

  // Lắng nghe thay đổi dữ liệu chấm công từ sổ cái SSOT
  useEffect(() => {
    const fetchOptions = () => {
      getEmployeeOptions()
        .then((o) => setEmployees(o.employees ?? o ?? []))
        .catch(() => setEmployees([]));
    };
    fetchOptions();
    const unsub = subscribeAttendance(() => {
      fetchOptions();
      setRefreshKey((k) => k + 1);
    });
    return unsub;
  }, []);

  // Tải dữ liệu đối soát chấm công
  useEffect(() => {
    if (rangeError) return undefined;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError("");
      }
    });
    getAttendanceRecords({ ...query, employeeId: "all" })
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setError("Không tải được dữ liệu đối soát chấm công"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query, rangeError, refreshKey]);

  const counts = data?.counts ?? null;
  const allRows = useMemo(() => data?.rows ?? [], [data]);
  const keyword = search.trim().toLowerCase();
  const matchSearch = (name, id) => !keyword || `${name} ${id}`.toLowerCase().includes(keyword);

  const rows = useMemo(
    () => allRows.filter((r) => (status === "all" || r.status === status) && matchSearch(r.employeeName, r.employeeId)),
    [allRows, status, keyword] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const gridEmployees = employees.filter((e) => matchSearch(e.name, e.id));
  const navEmployees = employees.filter((e) => allRows.some((r) => r.employeeId === e.id));
  const missingCount = counts?.["Missing-Checkout"] ?? 0;

  return {
    currentTime,
    weekLabel,
    period,
    setPeriod,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    status,
    setStatus,
    search,
    setSearch,
    view,
    setView,
    canClear,
    resetFilters,
    query,
    rangeError,
    employees,
    data,
    counts,
    allRows,
    rows,
    gridEmployees,
    navEmployees,
    missingCount,
    error,
    loading,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}
