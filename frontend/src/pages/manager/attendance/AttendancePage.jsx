import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import Loading from "../../../components/Loading";
import ErrorMessage from "../../../components/ErrorMessage";
import AttendanceGrid from "../../../components/AttendanceGrid";
import Button from "../../../components/Button";
import MenuIcon from "../../../components/MenuIcon";
import { inputClass } from "../../../components/FilterBar";
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
} from "../../../components/PageKit";
import AttendanceDetailModal from "./AttendanceDetailModal";
import {
  STATUS_LIST,
  STATUS_VI,
  STATUS_HEX,
  PERIOD_OPTIONS,
  STATUS_ICON,
  fmtDate,
} from "./attendanceData";
import { getAttendanceColumns } from "./attendanceColumns";
import { exportAttendanceExcel } from "./exportAttendanceExcel";
import { useAttendanceData } from "./hooks/useAttendanceData";
import { usePagination } from "../../../hooks/usePagination";

/**
 * US24 - Đối soát chấm công (Manager) + US25 - Điều chỉnh dữ liệu chấm công
 */
export default function AttendancePage() {
  const { user } = useAuth();
  const {
    currentTime, weekLabel, period, setPeriod, fromDate, setFromDate, toDate, setToDate,
    status, setStatus, search, setSearch, view, setView, canClear, resetFilters,
    rangeError, data, counts, allRows, rows, gridEmployees, navEmployees,
    missingCount, error, loading, refresh,
  } = useAttendanceData();

  const [notice, setNotice] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [detail, setDetail] = useState(null);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
    pagedItems: pageRows,
    resetPage,
  } = usePagination(rows, 7);

  // Tự động về trang 1 khi đổi bộ lọc
  useEffect(() => {
    resetPage();
  }, [period, fromDate, toDate, status, search, view]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tự ẩn thông báo sau 4 giây
  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const isLoading = loading && !rangeError;

  // Thẻ tóm tắt số liệu ca làm việc
  const statItems = counts && !rangeError ? STATUS_LIST.map((s) => ({
    key: s,
    icon: <MenuIcon name={STATUS_ICON[s]} size={18} />,
    dot: STATUS_HEX[s],
    label: STATUS_VI[s],
    value: counts[s],
    note: `${counts.total > 0 ? Math.round((counts[s] / counts.total) * 100) : 0}% số ca`,
    active: status === s,
    onClick: () => setStatus(status === s ? "all" : s),
  })) : null;

  const columns = getAttendanceColumns({ onOpenDetail: setDetail });

  const handleExportExcel = () => {
    if (!data || rows.length === 0) return;
    setExporting(true);
    setExportError("");
    try {
      exportAttendanceExcel({ data, rows, search, status, user });
    } catch {
      setExportError("Không tạo được file Excel. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  const exportDisabled = !data || rows.length === 0 || exporting || !!rangeError;

  return (
    <PageCard
      title="Tổng hợp chấm công"
      subtitle="Theo dõi và đối chiếu giờ chấm công với lịch làm việc chính thức."
      tabs={HR_TABS}
      actions={
        <PeriodControl label="Khoảng ngày" options={PERIOD_OPTIONS} value={period} onChange={setPeriod}>
          {period === "range" ? (
            <DateRangeInputs from={fromDate} to={toDate} onFrom={setFromDate} onTo={setToDate} />
          ) : (
            <span className="whitespace-nowrap tabular-nums">{period === "today" ? fmtDate(currentTime) : weekLabel}</span>
          )}
        </PeriodControl>
      }
      stats={statItems && <StatStrip items={statItems} />}
    >
      {notice && <Alert tone="success" className="mt-4">{notice}</Alert>}

      {/* THANH CÔNG CỤ */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <SearchInput value={search} onChange={setSearch} />

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-44">
            <select aria-label="Trạng thái" value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
              <option value="all">Tất cả trạng thái</option>
              {STATUS_LIST.map((s) => (
                <option key={s} value={s}>
                  {STATUS_VI[s]}
                </option>
              ))}
            </select>
          </div>

          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[14px]">
            {[["list", "Danh sách"], ["grid", "Bảng chấm công"]].map(([v, label]) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${view === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <Button type="button" variant="ghost" size="lg" onClick={resetFilters} disabled={!canClear}>
            Xóa bộ lọc
          </Button>
          <ExportButton onClick={handleExportExcel} disabled={exportDisabled} loading={exporting} />
        </div>
      </div>

      {(rangeError || exportError) && <Alert tone="error">{rangeError || exportError}</Alert>}

      {/* Cảnh báo ca thiếu giờ ra (US24) */}
      {missingCount > 0 && status !== "Missing-Checkout" && !rangeError && (
        <Alert
          dot={STATUS_HEX["Missing-Checkout"]}
          action={
            <button type="button" onClick={() => setStatus("Missing-Checkout")} className="font-semibold text-slate-900 underline underline-offset-2 hover:text-slate-600">
              Xem các ca này
            </button>
          }
        >
          Có {missingCount} ca thiếu giờ ra chưa được tính giờ làm. Mở chi tiết nhân viên và chọn “Điều chỉnh” để nhập giờ ra.
        </Alert>
      )}

      {/* BẢNG */}
      <div>
        <p className="mb-2 text-[13px] text-slate-500">
          <span className="font-medium text-slate-800">{data?.periodLabel ?? "—"}</span>
          <span className="ml-2 hidden lg:inline">
            • {view === "grid" ? "Bấm vào ô để điều chỉnh • " : "Bấm vào dòng để xem chi tiết • "}Bản ghi thuộc kỳ lương đã chốt không thể điều chỉnh
          </span>
        </p>

        {error && <ErrorMessage message={error} />}
        {isLoading && !error && <Loading text="Đang tải dữ liệu..." />}
        {!isLoading && !error && rangeError && <p className="py-10 text-center text-[15px] text-slate-500">{rangeError}</p>}

        {!isLoading && !error && !rangeError && data && (
          <>
            {counts.total === 0 ? (
              <p className="py-10 text-center text-[15px] text-slate-500">Chưa có dữ liệu chấm công trong khoảng đã chọn.</p>
            ) : view === "grid" ? (
              <AttendanceGrid
                from={data.from}
                to={data.to}
                employees={gridEmployees}
                rows={allRows}
                status={status}
                onSelect={(row) => setDetail({ employeeId: row.employeeId, rowId: row.id })}
              />
            ) : rows.length === 0 ? (
              <p className="py-10 text-center text-[15px] text-slate-500">Không có bản ghi phù hợp với bộ lọc hiện tại.</p>
            ) : (
              <Table variant="clean" minWidth={900} columns={columns} rows={pageRows} onRowClick={(r) => setDetail({ employeeId: r.employeeId })} />
            )}
          </>
        )}
      </div>

      {/* PHÂN TRANG (chỉ cho dạng danh sách) */}
      {view === "list" && !isLoading && !error && !rangeError && rows.length > 0 && (
        <Pagination page={page} pageCount={pageCount} total={rows.length} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
      )}

      {/* Chi tiết nhân viên + điều chỉnh (US25) + lịch sử */}
      <AttendanceDetailModal
        open={!!detail}
        employeeId={detail?.employeeId}
        focusRowId={detail?.rowId}
        employees={navEmployees}
        rows={allRows}
        periodLabel={data?.periodLabel}
        onClose={() => setDetail(null)}
        onNavigate={(id) => setDetail({ employeeId: id })}
        onSaved={(msg) => {
          setNotice(msg);
          refresh();
        }}
      />
    </PageCard>
  );
}