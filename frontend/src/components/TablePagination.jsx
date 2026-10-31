import { inputClass } from "./FilterBar";

// Thanh phân trang dưới bảng (giống trang Quản lý nhân viên).
// page: trang hiện tại (đã giới hạn trong 1..pageCount); unit: tên đơn vị, ví dụ "đơn", "nhân viên"

// Dãy số trang có dấu "…"
function pageList(page, count) {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const arr = [...new Set([1, count, page - 1, page, page + 1])].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b);
  const out = [];
  arr.forEach((n, i) => {
    if (i && n - arr[i - 1] > 1) out.push(`gap-${n}`);
    out.push(n);
  });
  return out;
}

function PageBtn({ children, active, ...props }) {
  return (
    <button
      type="button"
      className={`grid h-9 min-w-9 place-items-center rounded-lg border px-2 text-[14px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "border-slate-900 bg-white text-slate-900" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
      {...props}
    >
      {children}
    </button>
  );
}

export default function TablePagination({ page, pageCount, pageSize, total, unit = "mục", pageSizes = [7, 10, 20], onPageChange, onPageSizeChange }) {
  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-3 py-4 text-[14px] text-slate-600">
      <span>
        Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} trong {total} {unit}
      </span>
      <div className="flex items-center gap-1.5">
        <PageBtn onClick={() => onPageChange(1)} disabled={page === 1} aria-label="Trang đầu">«</PageBtn>
        <PageBtn onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label="Trang trước">‹</PageBtn>
        {pageList(page, pageCount).map((n) =>
          typeof n === "number" ? (
            <PageBtn key={n} active={n === page} onClick={() => onPageChange(n)}>{n}</PageBtn>
          ) : (
            <span key={n} className="px-1 text-slate-400">…</span>
          )
        )}
        <PageBtn onClick={() => onPageChange(page + 1)} disabled={page === pageCount} aria-label="Trang sau">›</PageBtn>
        <PageBtn onClick={() => onPageChange(pageCount)} disabled={page === pageCount} aria-label="Trang cuối">»</PageBtn>
      </div>
      <div className="w-32">
        <select aria-label="Số dòng mỗi trang" value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))} className={inputClass}>
          {pageSizes.map((n) => <option key={n} value={n}>{n} / trang</option>)}
        </select>
      </div>
    </div>
  );
}
