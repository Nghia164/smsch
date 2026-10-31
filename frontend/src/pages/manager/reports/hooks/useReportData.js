import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { getEmployeeOptions } from "../../../../services/workHoursService";
import { getReportData, getReportOverview } from "../../../../services/reportService";
import { exportReportExcel } from "../../../../utils/exportExcel";
import { REPORT_TYPES, PREVIEW_LIMIT, fmtCell } from "../reportData";

export function useReportData() {
  const { user } = useAuth();

  const [type, setType] = useState("hours");
  const [period, setPeriod] = useState("week");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [roleTag, setRoleTag] = useState("all");

  const [roleTags, setRoleTags] = useState([]);
  const [overview, setOverview] = useState(null);
  const [report, setReport] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingReport, setLoadingReport] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [notice, setNotice] = useState("");

  const meta = useMemo(() => REPORT_TYPES.find((t) => t.value === type), [type]);

  const canClear = period !== "week" || fromDate !== "" || toDate !== "" || roleTag !== "all";

  const resetFilters = () => {
    setPeriod("week");
    setFromDate("");
    setToDate("");
    setRoleTag("all");
    setExportError("");
  };

  const rangeError = useMemo(() => {
    if (period !== "range") return "";
    if (!fromDate || !toDate) return "Vui lòng chọn đủ Từ ngày và Đến ngày.";
    if (fromDate > toDate) return "“Từ ngày” không được lớn hơn “Đến ngày”.";
    return "";
  }, [period, fromDate, toDate]);

  useEffect(() => {
    getEmployeeOptions()
      .then((o) => setRoleTags(o.roleTags))
      .catch(() => setRoleTags([]));
  }, []);

  // Thẻ chỉ số + biểu đồ: luôn là cả tháng hiện tại (không phụ thuộc "Khoảng ngày"), chỉ đổi theo Role_Tag
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoadingOverview(true);
        setError("");
      }
    });
    getReportOverview({ period: "month", from: "", to: "", roleTag })
      .then((d) => !cancelled && setOverview(d))
      .catch(() => !cancelled && setError("Không tải được dữ liệu báo cáo"))
      .finally(() => !cancelled && setLoadingOverview(false));
    return () => {
      cancelled = true;
    };
  }, [roleTag]);

  // Bảng xem trước: phụ thuộc kỳ, Role_Tag và loại báo cáo
  useEffect(() => {
    if (rangeError) {
      queueMicrotask(() => setLoadingReport(false));
      return undefined;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoadingReport(true);
      }
    });
    getReportData(type, { period, from: fromDate, to: toDate, employeeId: "all", roleTag })
      .then((d) => !cancelled && setReport(d))
      .catch(() => !cancelled && setError("Không tải được dữ liệu báo cáo"))
      .finally(() => !cancelled && setLoadingReport(false));
    return () => {
      cancelled = true;
    };
  }, [type, period, fromDate, toDate, roleTag, rangeError]);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(t);
  }, [notice]);

  const handleExport = () => {
    if (!report || report.rows.length === 0) return;
    setExporting(true);
    setExportError("");
    try {
      const { fileName } = exportReportExcel({
        report,
        filterText: `Role_Tag - ${roleTag === "all" ? "Tất cả" : roleTag}`,
        userName: user?.name ?? "",
      });
      setNotice(`Đã xuất file ${fileName}`);
    } catch {
      setExportError("Không tạo được file Excel. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  const preview = useMemo(() => {
    if (!report) return null;
    return {
      columns: report.columns.map((c) => ({
        key: c.key,
        label: c.label,
        align: c.align,
        render: (r) => fmtCell(c, r[c.key]),
      })),
      footer: report.footer
        ? Object.fromEntries(report.columns.map((c) => [c.key, fmtCell(c, report.footer[c.key])]))
        : null,
      rows: report.rows.slice(0, PREVIEW_LIMIT),
    };
  }, [report]);

  const showOverview = !!overview && !overview.empty && !error;
  const exportDisabled = !report || report.rows.length === 0 || exporting || !!rangeError;

  return {
    type,
    setType,
    period,
    setPeriod,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    roleTag,
    setRoleTag,
    roleTags,
    overview,
    report,
    loadingOverview,
    loadingReport,
    error,
    exporting,
    exportError,
    notice,
    meta,
    canClear,
    resetFilters,
    rangeError,
    handleExport,
    preview,
    showOverview,
    exportDisabled,
  };
}
