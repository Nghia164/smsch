import { useState, useEffect } from "react";
import { Clock, CheckCircle2, TrendingUp, Moon } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import Loading from "../../../components/Loading";
import ErrorMessage from "../../../components/ErrorMessage";
import Button from "../../../components/Button";
import { PERIOD_OPTIONS, inputClass } from "../../../components/FilterBar";
import Table from "../../../components/Table";
import {
  PageCard,
  StatStrip,
  PeriodControl,
  DateRangeInputs,
  SearchInput,
  ExportButton,
  Alert,
  Pagination,
  HR_TABS,
  roleLabel,
} from "../../../components/PageKit";
import WorkHoursDetailModal from "./WorkHoursDetailModal";
import { round1, signed } from "./workHoursData";
import { getWorkHoursColumns, getWorkHoursFooter } from "./workHoursColumns";
import { exportWorkHoursExcel } from "./exportWorkHoursExcel";
import { useWorkHoursData } from "./hooks/useWorkHoursData";
import { usePagination } from "../../../hooks/usePagination";

/**
 * US13 - Tổng hợp giờ làm (Manager) + US28 - Xuất Excel
 */
export default function WorkHoursPage() {
  const { user } = useAuth();
  const {
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
  } = useWorkHoursData();

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [notice, setNotice] = useState("");
  const [detailEmployee, setDetailEmployee] = useState(null);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
    pagedItems: pageRows,
    resetPage,
  } = usePagination(rows, 7);

  // Về trang 1 khi đổi bộ lọc
  useEffect(() => {
    resetPage();
  }, [period, fromDate, toDate, employeeId, roleTag, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const handleExportExcel = () => {
    if (!summary || rows.length === 0) return;
    setExporting(true);
    setExportError("");
    try {
      exportWorkHoursExcel({ summary, rows, totals, employeeId, roleTag, employeeMap, user });
      setNotice("Đã tải xuống báo cáo Excel thành công");
    } catch {
      setExportError("Không tạo được file Excel. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  const statItems = rangeError
    ? null
    : [
        { key: "sched", icon: <Clock size={18} strokeWidth={1.8} />, label: "Giờ theo lịch", value: `${totals.scheduledHours}h`, note: `${totals.shiftCount} ca` },
        { key: "actual", icon: <CheckCircle2 size={18} strokeWidth={1.8} />, label: "Giờ thực tế", value: `${totals.actualHours}h`, note: `${overallRatio}% so với lịch` },
        {
          key: "diff",
          icon: <TrendingUp size={18} strokeWidth={1.8} />,
          label: "Chênh lệch",
          value: `${signed(totals.diff)}h`,
          note: totals.diff === 0 ? "Khớp kế hoạch" : totals.diff > 0 ? "Tăng ca" : "Thiếu giờ làm",
        },
        {
          key: "night",
          icon: <Moon size={18} strokeWidth={1.8} />,
          label: "Ca đêm và ngày lễ",
          value: `${round1(totals.nightHours + totals.holidayHours)}h`,
          note: `Đêm ${totals.nightHours}h • Lễ ${totals.holidayHours}h`,
        },
      ];

  const columns = getWorkHoursColumns({ onOpenDetail: setDetailEmployee });
  const footer = getWorkHoursFooter({ rows, totals, overallRatio });
  const exportDisabled = !summary || rows.length === 0 || exporting || !!rangeError;

  return (
    <PageCard
      title="Giờ làm việc"
      subtitle="Tổng hợp giờ làm theo lịch so với thực tế, chênh lệch và phụ cấp tính lương."
      tabs={HR_TABS}
      actions={
        <PeriodControl label="Khoảng ngày" options={PERIOD_OPTIONS} value={period} onChange={setPeriod}>
          {period === "range" ? (
            <DateRangeInputs from={fromDate} to={toDate} onFrom={setFromDate} onTo={setToDate} />
          ) : (
            <span className="whitespace-nowrap tabular-nums">{summary?.periodLabel ?? "—"}</span>
          )}
        </PeriodControl>
      }
      stats={statItems && <StatStrip items={statItems} />}
    >
      {notice && <Alert tone="success" className="mt-4">{notice}</Alert>}

      {/* THANH CÔNG CỤ */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <SearchInput value={searchTerm} onChange={setSearchTerm} />

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-44">
            <select aria-label="Vai trò" value={roleTag} onChange={(e) => setRoleTag(e.target.value)} className={inputClass}>
              <option value="all">Tất cả vai trò</option>
              {options.roleTags.map((tag) => (
                <option key={tag} value={tag}>{roleLabel(tag)}</option>
              ))}
            </select>
          </div>

          <div className="w-48">
            <select aria-label="Nhân viên" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={inputClass}>
              <option value="all">Tất cả nhân viên</option>
              {options.employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <Button type="button" variant="ghost" size="lg" onClick={resetFilters} disabled={!canClear}>
            Xóa bộ lọc
          </Button>
          <ExportButton onClick={handleExportExcel} disabled={exportDisabled} loading={exporting} />
        </div>
      </div>

      {(rangeError || exportError) && <Alert tone="error">{rangeError || exportError}</Alert>}

      {/* BẢNG */}
      <p className="mb-2 text-[13px] text-slate-500">
        Kỳ làm việc: <span className="font-medium text-slate-800">{summary?.periodLabel ?? "—"}</span>
        <span className="ml-2 hidden lg:inline">• Bấm vào dòng để xem chi tiết từng ca</span>
      </p>

      {error && <ErrorMessage message={error} />}
      {loading && !error && <Loading text="Đang đồng bộ dữ liệu giờ làm..." />}
      {!loading && !error && rangeError && <p className="py-10 text-center text-[15px] text-slate-500">{rangeError}</p>}

      {!loading && !error && !rangeError &&
        (rows.length === 0 ? (
          <p className="py-12 text-center text-[15px] text-slate-500">Không tìm thấy nhân viên phù hợp với bộ lọc</p>
        ) : (
          <>
            <Table variant="clean" minWidth={960} columns={columns} rows={pageRows} footer={footer} onRowClick={setDetailEmployee} />
            <Pagination
              page={page}
              pageCount={pageCount}
              total={rows.length}
              pageSize={pageSize}
              onPage={setPage}
              onPageSize={setPageSize}
              unit="nhân viên"
            />
          </>
        ))}

      {/* HỘP THOẠI CHI TIẾT TỪNG CA */}
      {detailEmployee && (
        <WorkHoursDetailModal
          employee={detailEmployee}
          period={period}
          from={fromDate}
          to={toDate}
          roleLabel={roleLabel}
          onClose={() => setDetailEmployee(null)}
        />
      )}
    </PageCard>
  );
}