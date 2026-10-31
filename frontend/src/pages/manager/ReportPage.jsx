import { Link } from "react-router-dom";
import { CheckCircle2, Download } from "lucide-react";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";
import Table from "../../components/Table";
import Button from "../../components/Button";
import { PERIOD_OPTIONS, inputClass } from "../../components/FilterBar";
import { REPORT_TYPES, PREVIEW_LIMIT } from "./reports/reportData";
import ReportStatsOverview from "./reports/components/ReportStatsOverview";
import ReportChartsGrid from "./reports/components/ReportChartsGrid";
import { useReportData } from "./reports/hooks/useReportData";

export default function ReportPage() {
  const {
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
  } = useReportData();

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Thông báo */}
      {notice && (
        <div role="status" className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-[14px] font-medium text-white shadow-lg">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}

      {/* 1. TIÊU ĐỀ */}
      <div className="border-b border-slate-200 px-6 py-5">
        <h1 className="text-[18px] font-semibold leading-tight text-slate-900">Báo cáo</h1>
        <p className="mt-1 text-[14px] text-slate-500">
          Xem nhanh số liệu tháng hiện tại và xuất báo cáo ra file Excel: lịch làm việc, giờ làm, chấm công, bảng lương, Dashboard.
        </p>
      </div>

      {/* 2. SỐ LIỆU TÓM TẮT (tổng của cả tháng) */}
      {showOverview && <ReportStatsOverview overview={overview} />}

      <div className="px-6 pb-4">
        {/* Biểu đồ tổng quan (cùng kỳ với thẻ chỉ số) */}
        {showOverview && <ReportChartsGrid overview={overview} />}

        {/* 3. THANH CÔNG CỤ */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="w-full sm:w-64">
            <select aria-label="Loại báo cáo" value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="w-36">
              <select aria-label="Khoảng ngày" value={period} onChange={(e) => setPeriod(e.target.value)} className={inputClass}>
                {PERIOD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-44">
              <select aria-label="Role_Tag" value={roleTag} onChange={(e) => setRoleTag(e.target.value)} className={inputClass}>
                <option value="all">Tất cả Role_Tag</option>
                {roleTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>

            <Button type="button" variant="ghost" size="lg" onClick={resetFilters} disabled={!canClear}>
              Xóa bộ lọc
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="whitespace-nowrap"
              onClick={handleExport}
              disabled={exportDisabled}
              loading={exporting}
              icon={<Download size={16} />}
            >
              {exporting ? "Đang xuất..." : "Xuất Excel"}
            </Button>
          </div>
        </div>

        {/* Khoảng ngày tùy chọn */}
        {period === "range" && (
          <div className="mb-3 flex flex-wrap items-center gap-3 text-[14px] text-slate-700">
            <label className="flex items-center gap-2">
              <span className="font-medium">Từ ngày</span>
              <input type="date" value={fromDate} max={toDate || undefined} onChange={(e) => setFromDate(e.target.value)} className={`${inputClass} w-44`} />
            </label>
            <label className="flex items-center gap-2">
              <span className="font-medium">Đến ngày</span>
              <input type="date" value={toDate} min={fromDate || undefined} onChange={(e) => setToDate(e.target.value)} className={`${inputClass} w-44`} />
            </label>
          </div>
        )}

        {(rangeError || exportError) && (
          <p role="alert" className="mb-3 rounded-md border border-slate-300 bg-slate-50 px-4 py-2.5 text-[14px] text-slate-900">
            {rangeError || exportError}
          </p>
        )}

        {/* 4. BẢNG XEM TRƯỚC của loại báo cáo đang chọn */}
        {error && <ErrorMessage message={error} />}
        {(loadingOverview || loadingReport) && !error && <Loading />}
        {!loadingOverview && !loadingReport && !error && rangeError && (
          <p className="py-10 text-center text-[15px] text-slate-500">{rangeError}</p>
        )}

        {!loadingOverview && !loadingReport && !error && !rangeError && report && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
              <p className="text-[14px] text-slate-600">
                Kỳ báo cáo: <span className="font-medium text-slate-900">{report.title} • {report.periodLabel}</span>
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <p className="text-[13px] text-slate-500">
                  {report.rows.length > PREVIEW_LIMIT
                    ? `Xem trước ${PREVIEW_LIMIT}/${report.rows.length} dòng đầu; file Excel gồm đầy đủ`
                    : "Xem trước dữ liệu sẽ xuất ra file Excel"}
                </p>
                <Link to={meta.to} className="text-[14px] font-medium text-blue-600 hover:underline">
                  {meta.link}
                </Link>
              </div>
            </div>

            {report.rows.length > 0 ? (
              <Table columns={preview.columns} rows={preview.rows} footer={preview.footer} maxHeight="min(60vh, 520px)" />
            ) : (
              <p className="px-4 py-10 text-center text-[15px] text-slate-500">Chưa có dữ liệu trong khoảng đã chọn.</p>
            )}

            {report.extraSheets?.length > 0 && (
              <p className="border-t border-slate-200 px-4 py-3 text-[13px] text-slate-500">
                File Excel còn có thêm các sheet dữ liệu biểu đồ: {report.extraSheets.map((s) => s.name).join(", ")}.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}