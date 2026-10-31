// Thành phần dùng chung cho các màn có bộ lọc (Dashboard, Tổng hợp giờ làm, ...)
// để giao diện luôn giống nhau: tiêu đề trang, ô lọc, nút "Xóa bộ lọc" và "Xuất Excel".

export const PERIOD_OPTIONS = [
  { value: "week", label: "Tuần này" },
  { value: "month", label: "Tháng này" },
  { value: "range", label: "Tùy chọn" },
];

export const inputClass =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-[#475466] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

// Tiêu đề trang: thẻ trắng sạch, vạch xanh mảnh bên trái, tiêu đề vừa phải (semibold).
// pr-20 chừa chỗ bên phải cho chuông thông báo.
export function PageHeader({ title, subtitle }) {
  return (
    <header className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-6 py-5 pr-20 shadow-sm">
      <span className="h-10 w-1 shrink-0 rounded-full bg-[#1459db]" />
      <div className="min-w-0">
        <h1 className="text-[28px] font-semibold leading-tight text-[#0B1D3F]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
    </header>
  );
}

export function Field({ label, className = "", children }) {
  return (
    <div className={`w-full ${className}`}>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      {children}
    </div>
  );
}

// children: các <Field> lọc. onClear + canClear: nút "Xóa bộ lọc" (mờ đi khi đang là mặc định).
// onExport: nút "Xuất Excel" (bỏ qua nếu màn không cần). errors: danh sách thông báo lỗi nhỏ phía dưới.
export default function FilterBar({
  children,
  onClear,
  canClear = true,
  onExport,
  exportDisabled = false,
  exporting = false,
  errors = [],
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-4">
        {children}

        <div className="flex w-full shrink-0 gap-3 sm:ml-auto sm:w-auto">
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              disabled={!canClear}
              className="h-11 flex-1 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              Xóa bộ lọc
            </button>
          )}
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              disabled={exportDisabled}
              className="h-11 flex-1 rounded-lg bg-[#1459db] px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              {exporting ? "Đang tạo file…" : "Xuất Excel"}
            </button>
          )}
        </div>
      </div>

      {errors.filter(Boolean).map((m) => (
        <p key={m} className="mt-3 text-xs text-rose-600">
          {m}
        </p>
      ))}
    </div>
  );
}