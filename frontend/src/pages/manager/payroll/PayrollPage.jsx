import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import Loading from "../../../components/Loading";
import ErrorMessage from "../../../components/ErrorMessage";
import Button from "../../../components/Button";
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
  contractLabel,
} from "../../../components/PageKit";
import PayrollDetailModal from "./PayrollDetailModal";
import { formatMoney, fmtHours } from "../../../utils/format";
import { PERIOD_OPTIONS, CONTRACTS, PAY_COLORS, I } from "./payrollData";
import { getPayrollColumns, getPayrollFooter } from "./payrollColumns";
import { exportPayrollExcel } from "./exportPayrollExcel";
import { usePayrollData } from "./hooks/usePayrollData";
import { usePagination } from "../../../hooks/usePagination";

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/**
 * US23 - Bảng lương (Manager)
 */
export default function PayrollPage() {
  const { user } = useAuth();
  const {
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
  } = usePayrollData();

  const [notice, setNotice] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [detailId, setDetailId] = useState(null);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
    pagedItems: pageRows,
    resetPage,
  } = usePagination(rows, 7);

  // Về trang 1 khi thay đổi bộ lọc
  useEffect(() => {
    resetPage();
  }, [period, month, fromDate, toDate, contract, search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const share = (v) => (totals.total > 0 ? Math.round((v / totals.total) * 100) : 0);

  const statItems =
    hasData && !rangeError
      ? [
          { key: "total", icon: <Icon d={I.wallet} />, color: "#0f172a", label: "Tổng chi phí lương", value: formatMoney(totals.total), note: `${totals.employeeCount} nhân viên` },
          { key: "base", icon: <Icon d={I.coins} />, color: PAY_COLORS.base, label: "Lương cơ bản", value: formatMoney(totals.basePay), note: `${share(totals.basePay)}% tổng lương` },
          { key: "sur", icon: <Icon d={I.trend} />, color: PAY_COLORS.surcharge, label: "Tăng theo hệ số", value: formatMoney(totals.surcharge), note: `${share(totals.surcharge)}% tổng lương` },
          { key: "bonus", icon: <Icon d={I.gift} />, color: PAY_COLORS.bonus, label: "Thưởng Open Shift", value: formatMoney(totals.openShiftBonus), note: `${share(totals.openShiftBonus)}% tổng lương` },
          { key: "hours", icon: <Icon d={I.clock} />, color: "#64748b", label: "Giờ thực tế", value: `${fmtHours(totals.actualHours)} giờ`, note: `${totals.shiftCount} ca` },
        ]
      : null;

  const handleRun = async () => {
    try {
      const d = await runCalculation();
      if (d) setNotice(`Đã tính lương ${d.periodLabel}`);
    } catch {
      // Error handled inside hook
    }
  };

  const handleExport = () => {
    if (!calculated || rows.length === 0) return;
    setExporting(true);
    setExportError("");
    try {
      exportPayrollExcel({ data, rows, totals, partial, search, contract, user });
    } catch {
      setExportError("Không tạo được file Excel. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  const columns = getPayrollColumns({ onOpenDetail: setDetailId });
  const footer = getPayrollFooter(totals);

  return (
    <PageCard
      title="Bảng lương"
      subtitle="Tính lương theo giờ thực tế đã đối soát và hệ số ca"
      tabs={HR_TABS}
      actions={
        <PeriodControl label="Kiểu chọn kỳ lương" options={PERIOD_OPTIONS} value={period} onChange={setPeriod}>
          {period === "month" ? (
            <input aria-label="Tháng/năm" type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-36 bg-transparent text-[14px] outline-none" />
          ) : (
            <DateRangeInputs from={fromDate} to={toDate} onFrom={setFromDate} onTo={setToDate} />
          )}
        </PeriodControl>
      }
      stats={statItems && <StatStrip items={statItems} compact />}
    >
      {notice && <Alert tone="success" className="mt-4">{notice}</Alert>}

      {/* THANH CÔNG CỤ */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <SearchInput value={search} onChange={setSearch} />

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-48">
            <select aria-label="Loại hợp đồng" value={contract} onChange={(e) => setContract(e.target.value)} className={inputClass}>
              <option value="all">Tất cả hợp đồng</option>
              {CONTRACTS.map((c) => (
                <option key={c} value={c}>
                  {contractLabel(c)}
                </option>
              ))}
            </select>
          </div>
          <Button type="button" variant="ghost" size="lg" onClick={resetFilters} disabled={!canClear}>
            Xóa bộ lọc
          </Button>
          <ExportButton onClick={handleExport} disabled={!calculated || rows.length === 0 || exporting || !!rangeError} loading={exporting} />
          <button
            type="button"
            onClick={handleRun}
            disabled={!!rangeError || loading}
            className="h-10 whitespace-nowrap rounded-lg bg-slate-900 px-5 text-[14px] font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Tính lương
          </button>
        </div>
      </div>

      {(rangeError || exportError) && <Alert tone="error">{rangeError || exportError}</Alert>}

      {/* Cảnh báo ca thiếu giờ ra */}
      {missing > 0 && !rangeError && (
        <Alert
          dot="#8b5cf6"
          action={
            <Link to="/manager/attendance" className="font-semibold text-slate-900 underline underline-offset-2 hover:text-slate-600">
              Đến trang Chấm công
            </Link>
          }
        >
          Có {missing} ca thiếu giờ ra nên đang được tính 0 giờ. Vào trang Chấm công, chọn “Điều chỉnh” để nhập giờ ra, bảng lương sẽ tự tính lại.
        </Alert>
      )}

      {/* BẢNG */}
      <div>
        <p className="mb-2 text-[13px] text-slate-500">
          <span className="font-medium text-slate-800">{calculated ? data.periodLabel : query.label ?? "—"}</span>
          {partial && <span className="ml-2 font-medium text-amber-700">• Kỳ chưa kết thúc, số liệu tạm tính</span>}
          <span className="ml-2 hidden lg:inline">• Bấm vào dòng để xem lương từng ca • Dữ liệu lương chỉ dùng nội bộ</span>
        </p>

        {error && <ErrorMessage message={error} />}
        {loading && !error && <Loading text="Đang tính lương..." />}
        {!loading && !error && rangeError && <p className="py-10 text-center text-[15px] text-slate-500">{rangeError}</p>}

        {!loading && !error && !rangeError && calculated &&
          (data.rows.length === 0 ? (
            <p className="py-10 text-center text-[15px] text-slate-500">Chưa có dữ liệu chấm công trong kỳ lương đã chọn.</p>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-[15px] text-slate-500">Không có nhân viên phù hợp với bộ lọc hiện tại.</p>
          ) : (
            <>
              <Table variant="clean" minWidth={1000} columns={columns} rows={pageRows} footer={footer} onRowClick={(r) => setDetailId(r.employeeId)} />
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
      </div>

      <PayrollDetailModal open={!!detailId} employeeId={detailId} query={query} periodLabel={data?.periodLabel} onClose={() => setDetailId(null)} />
    </PageCard>
  );
}