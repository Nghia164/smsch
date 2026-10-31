import { useEffect, useMemo, useState } from "react";
import { getExchangeRequests, managerApproveExchange, managerRejectExchange } from "../../../utils/shiftExchangeMockData";
import TablePagination from "../../../components/TablePagination";
import { ExchangeDetailModal, RejectModal } from "./ExchangeModals";
import ExchangeToolbar from "./ExchangeToolbar";
import ExchangeTable from "./ExchangeTable";
import { DEFAULT_FILTERS, NOTICE_STYLE, PAGE_SIZES, TABS, inTab } from "./exchangeShared";

// Đổi ca - xem xét, đối soát ràng buộc và phê duyệt yêu cầu hoán đổi ca. Bố cục đồng bộ với trang Đơn xin nghỉ.
// Trang này giữ dữ liệu và các thao tác; phần hiển thị nằm trong ExchangeToolbar, ExchangeTable và ExchangeModals.

export default function ShiftExchangePage() {
  const [requests, setRequests] = useState(getExchangeRequests);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);

  const [detail, setDetail] = useState(null); // yêu cầu đang xem chi tiết
  const [rejecting, setRejecting] = useState(null); // yêu cầu đang từ chối
  const [notice, setNotice] = useState(null); // { message, type } hoặc null

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1);
  };

  // ---------- thao tác ----------
  const approve = (id) => {
    try {
      managerApproveExchange(id, "Quản lý đã phê duyệt và cập nhật vào lịch tuần.");
      setRequests(getExchangeRequests());
      setNotice({ message: "Đã phê duyệt yêu cầu đổi ca. Lịch tuần đã được cập nhật.", type: "success" });
      setDetail(null);
    } catch (err) {
      setNotice({ message: err?.message || "Lỗi khi duyệt yêu cầu.", type: "error" });
    }
  };

  const reject = (reason) => {
    try {
      managerRejectExchange(rejecting.id, reason);
      setRequests(getExchangeRequests());
      setNotice({ message: "Đã từ chối yêu cầu đổi ca.", type: "success" });
      setRejecting(null);
    } catch (err) {
      setNotice({ message: err?.message || "Lỗi khi từ chối yêu cầu.", type: "error" });
    }
  };

  // ---------- lọc + phân trang ----------
  const baseFiltered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return requests.filter((r) => {
      const matchRole =
        filters.role === "all" ||
        r.requesterRole === filters.role ||
        r.targetEmployeeRole === filters.role;
      const matchQ =
        !q ||
        [r.id, r.requesterName, r.targetEmployeeName, r.reason, r.rejectReason].some((v) =>
          v?.toLowerCase().includes(q)
        );
      return matchRole && matchQ;
    });
  }, [requests, filters.q, filters.role]);

  const counts = useMemo(() => {
    const res = {};
    TABS.forEach(([key]) => {
      res[key] = baseFiltered.filter((r) => inTab(r, key)).length;
    });
    return res;
  }, [baseFiltered]);

  const rows = baseFiltered.filter((r) => inTab(r, filters.status));
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* TIÊU ĐỀ */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
        <div>
          <h1 className="text-[18px] font-semibold leading-tight text-slate-900">Đổi ca làm việc</h1>
          <p className="mt-1 text-[14px] text-slate-500">
            Xem xét, đối soát ràng buộc và phê duyệt các yêu cầu hoán đổi ca giữa các nhân viên.
          </p>
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
        <ExchangeToolbar filters={filters} onChange={handleFilterChange} counts={counts} />

        {/* BẢNG */}
        {rows.length === 0 ? (
          <p className="py-10 text-center text-[15px] text-slate-500">
            Không có yêu cầu đổi ca phù hợp với bộ lọc hiện tại.
          </p>
        ) : (
          <ExchangeTable
            rows={pageRows}
            onOpen={setDetail}
            onApprove={approve}
            onReject={setRejecting}
          />
        )}

        {/* PHÂN TRANG */}
        {rows.length > 0 && (
          <TablePagination
            page={safePage}
            pageCount={pageCount}
            pageSize={pageSize}
            total={rows.length}
            unit="yêu cầu"
            pageSizes={PAGE_SIZES}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>

      <ExchangeDetailModal
        req={detail}
        onClose={() => setDetail(null)}
        onApprove={approve}
        onReject={(req) => {
          setDetail(null);
          setRejecting(req);
        }}
      />

      <RejectModal
        key={rejecting?.id}
        req={rejecting}
        onClose={() => setRejecting(null)}
        onConfirm={reject}
      />
    </div>
  );
}