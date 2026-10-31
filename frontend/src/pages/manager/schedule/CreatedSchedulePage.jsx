import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Cpu } from "lucide-react";
import {
  PageCard,
  StatStrip,
  PeriodControl,
  SearchInput,
  ExportButton,
  Alert,
  Pagination,
  SCHEDULE_TABS,
} from "../../../components/PageKit";
import Button from "../../../components/Button";
import { inputClass } from "../../../components/FilterBar";
import {
  employeeRoster,
  isScheduleConfirmed,
  WEEK_LABEL,
} from "./scheduleShared";
import CreatedScheduleGridView from "./components/CreatedScheduleGridView";
import CreatedScheduleListView from "./components/CreatedScheduleListView";
import ShiftAssignmentModal from "./components/ShiftAssignmentModal";
import { exportScheduleExcel } from "./exportScheduleExcel";
import { useCreatedScheduleData } from "./hooks/useCreatedScheduleData.js";
import { usePagination } from "../../../hooks/usePagination";

const PERIOD_OPTIONS = [
  { value: "week", label: "Tuần này" },
  { value: "prev", label: "Tuần trước" },
  { value: "next", label: "Tuần sau" },
];

export default function CreatedSchedulePage() {
  const navigate = useNavigate();
  const [notice, setNotice] = useState("");
  const showToast = (msg) => setNotice(msg);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const {
    days,
    schedules,
    period,
    setPeriod,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    shiftFilter,
    setShiftFilter,
    view,
    setView,
    activeModalShiftKey,
    canClear,
    resetFilters,
    handleOpenShiftModal,
    handleCloseModal,
    handleSaveModal,
    handleGoToOpenShift,
    stats,
    statItems,
    filteredAssignments,
    filteredEmployees,
    modalData,
  } = useCreatedScheduleData({ showToast });

  const activeItems = view === "list" ? filteredAssignments : filteredEmployees;
  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
    pagedItems,
    resetPage,
  } = usePagination(activeItems, 7);

  // Về trang 1 khi đổi bộ lọc hoặc đổi kiểu xem
  useEffect(() => {
    resetPage();
  }, [period, roleFilter, shiftFilter, search, view]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = () => {
    try {
      exportScheduleExcel({ filteredAssignments, search, roleFilter });
      showToast("Xuất Excel lịch làm việc thành công!");
    } catch {
      showToast("Có lỗi khi tạo tệp Excel. Vui lòng thử lại.");
    }
  };

  return (
    <>
      <PageCard
        title="Lịch đã tạo"
        subtitle="Xem và quản lý chi tiết toàn bộ lịch phân công ca làm việc theo tuần đã được hệ thống tạo hoặc chỉnh sửa."
        tabs={SCHEDULE_TABS}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <PeriodControl label="Khoảng ngày" options={PERIOD_OPTIONS} value={period} onChange={setPeriod}>
              <span className="whitespace-nowrap tabular-nums">{WEEK_LABEL}</span>
            </PeriodControl>
            <Button onClick={() => navigate("/manager/schedule")}>
              <Cpu size={16} />
              <span>Xếp lịch tự động</span>
            </Button>
          </div>
        }
        stats={<StatStrip items={statItems} />}
      >
        {notice && <Alert tone="success" className="mt-4">{notice}</Alert>}

        {/* THANH CÔNG CỤ */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên hoặc mã NV..." />

          <div className="flex flex-wrap items-center gap-2">
            <div className="w-40">
              <select
                aria-label="Vai trò"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={inputClass}
              >
                <option value="all">Tất cả vai trò</option>
                <option value="Phục vụ">Phục vụ</option>
                <option value="Pha chế">Pha chế</option>
                <option value="Thu ngân">Thu ngân</option>
              </select>
            </div>

            <div className="w-44">
              <select
                aria-label="Ca làm việc"
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
                className={inputClass}
              >
                <option value="all">Tất cả các ca</option>
                <option value="morning">Ca sáng (06:00 - 12:00)</option>
                <option value="afternoon">Ca chiều (12:00 - 17:00)</option>
                <option value="evening">Ca tối (17:00 - 22:00)</option>
              </select>
            </div>

            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[14px]">
              {[["grid", "Bảng lịch tuần"], ["list", "Danh sách"]].map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                    view === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <Button type="button" variant="ghost" size="lg" onClick={resetFilters} disabled={!canClear}>
              Xóa bộ lọc
            </Button>
            <ExportButton onClick={handleExport} disabled={filteredAssignments.length === 0} />
          </div>
        </div>

        {/* CẢNH BÁO CA THIẾU NHÂN SỰ */}
        {stats.deficientShiftsCount > 0 && (
          <Alert
            tone="error"
            dot="#e11d48"
            action={
              <button
                type="button"
                onClick={() => {
                  const defKey = Object.keys(schedules).find((k) => (schedules[k]?.assigned?.length || 0) < 4);
                  if (defKey) handleOpenShiftModal(defKey);
                }}
                className="font-semibold text-rose-800 underline underline-offset-2 hover:text-rose-950"
              >
                Xem ca thiếu người
              </button>
            }
          >
            Có {stats.deficientShiftsCount} ca chưa đủ định biên nhân sự theo quy định. Mở chi tiết ca để phân công thêm hoặc tạo ca mở.
          </Alert>
        )}

        <p className="mb-2 text-[13px] text-slate-500">
          <span className="font-medium text-slate-800">{WEEK_LABEL}</span>
          <span className="ml-2 hidden lg:inline">
            • {view === "grid" ? "Bấm vào ô để điều chỉnh phân công ca • " : "Bấm vào dòng để xem chi tiết ca • "}Lịch làm việc chính thức đã được kích hoạt
          </span>
        </p>

        {/* NỘI DUNG CHÍNH */}
        <div>
          {view === "list" ? (
            <CreatedScheduleListView
              filteredAssignments={filteredAssignments}
              pageListRows={pagedItems}
              onOpenShiftModal={handleOpenShiftModal}
            />
          ) : (
            <CreatedScheduleGridView
              days={days}
              pageGridEmployees={pagedItems}
              schedules={schedules}
              onOpenShiftModal={handleOpenShiftModal}
            />
          )}
        </div>

        {/* PHÂN TRANG */}
        {activeItems.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            pageCount={pageCount}
            total={activeItems.length}
            unit={view === "list" ? "lượt phân công" : "nhân viên"}
            onPage={setPage}
            onPageSize={setPageSize}
            sizes={[7, 10, 20]}
          />
        )}

        {/* MODAL CHI TIẾT CA & ĐIỀU CHỈNH PHÂN CÔNG */}
        <ShiftAssignmentModal
          key={activeModalShiftKey || "none"}
          modalData={modalData}
          employeeRoster={employeeRoster}
          isConfirmed={isScheduleConfirmed()}
          onClose={handleCloseModal}
          onSave={handleSaveModal}
          onGoToOpenShift={handleGoToOpenShift}
        />
      </PageCard>
    </>
  );
}
