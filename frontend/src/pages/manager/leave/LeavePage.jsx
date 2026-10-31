import { employeeRoster } from "../../../mocks/scheduleMockData";
import Button from "../../../components/Button";
import TablePagination from "../../../components/TablePagination";
import LeaveDetailModal from "./components/LeaveDetailModal";
import RejectLeaveModal from "./components/RejectLeaveModal";
import CreateLeaveModal from "./components/CreateLeaveModal";
import LeaveToolbar from "./LeaveToolbar";
import LeaveTable from "./LeaveTable";
import { NOTICE_STYLE, PAGE_SIZES } from "./leaveShared";
import { useLeaveRequests } from "./hooks/useLeaveRequests";

// Ảnh đại diện cho hộp thoại chi tiết: lấy từ danh sách nhân viên, không có thì dùng chữ cái đầu.
const avatarOf = (id) =>
  employeeRoster.find((e) => e.id === id)?.avatar || `https://ui-avatars.com/api/?background=F1F5F9&color=475569&name=${id}`;

export default function LeavePage() {
  const {
    filters,
    page,
    pageSize,
    selected,
    setSelected,
    candidates,
    loadingCands,
    rejecting,
    setRejecting,
    creating,
    setCreating,
    notice,
    counts,
    coverageRate,
    rows,
    pageRows,
    pageCount,
    handleFilterChange,
    handlePageSizeChange,
    setPage,
    openDetail,
    approve,
    reject,
    pickReplacement,
    answerReplacement,
    cancelRequest,
    openShift,
    createLeave,
    resetData,
  } = useLeaveRequests();

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* TIÊU ĐỀ */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
        <div>
          <h1 className="text-[18px] font-semibold leading-tight text-slate-900">Đơn xin nghỉ</h1>
          <p className="mt-1 text-[14px] text-slate-500">
            Theo dõi, phê duyệt đơn xin nghỉ và để AI gợi ý người thay ca phù hợp. Tỷ lệ lấp ca bằng AI:{" "}
            <b className="font-semibold tabular-nums text-slate-700">{coverageRate}%</b>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="lg" onClick={resetData}>
            Đặt lại dữ liệu mẫu
          </Button>
          <Button type="button" onClick={() => setCreating(true)}>
            + Tạo đơn xin nghỉ
          </Button>
        </div>
      </div>

      <div className="px-6">
        {notice && (
          <div
            role={notice.type === "error" ? "alert" : "status"}
            className={`mt-4 rounded-lg border px-4 py-3 text-[14px] ${NOTICE_STYLE[notice.type] ?? NOTICE_STYLE.success}`}
          >
            {notice.message}
          </div>
        )}

        {/* TAB TRẠNG THÁI + BỘ LỌC */}
        <LeaveToolbar filters={filters} onChange={handleFilterChange} counts={counts} />

        {/* BẢNG */}
        {rows.length === 0 ? (
          <p className="py-10 text-center text-[15px] text-slate-500">
            Không có đơn xin nghỉ phù hợp với bộ lọc hiện tại.
          </p>
        ) : (
          <LeaveTable rows={pageRows} onOpen={openDetail} onApprove={approve} onReject={setRejecting} />
        )}

        {/* PHÂN TRANG */}
        {rows.length > 0 && (
          <TablePagination
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            total={rows.length}
            unit="đơn"
            pageSizes={PAGE_SIZES}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>

      <LeaveDetailModal
        req={selected}
        avatar={selected && avatarOf(selected.employeeId)}
        candidates={candidates}
        loading={loadingCands}
        onClose={() => setSelected(null)}
        onApprove={approve}
        onReject={setRejecting}
        onPick={pickReplacement}
        onRespond={answerReplacement}
        onCancelRequest={cancelRequest}
        onOpenShift={openShift}
      />
      <RejectLeaveModal
        key={rejecting?.id}
        item={rejecting}
        onClose={() => setRejecting(null)}
        onConfirm={reject}
      />
      {creating && (
        <CreateLeaveModal
          employees={employeeRoster}
          onClose={() => setCreating(false)}
          onSubmit={createLeave}
        />
      )}
    </div>
  );
}
