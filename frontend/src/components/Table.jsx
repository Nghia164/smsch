// columns: [{ key, label, align?: "left" | "right", render?: (row) => ..., className?: string }]
// rows: [{ id, ... }]
// footer?: object cùng shape với columns (giá trị đã format sẵn), hiện dòng "Tổng cộng" trong <tfoot>
// onRowClick?: (row) => void      bấm cả dòng (dòng sẽ có con trỏ tay + hiệu ứng hover)
// minWidth?: number               độ rộng tối thiểu, bảng cuộn ngang khi màn hình hẹp
// variant?: "default" | "clean"   "clean" = kiểu mới của các trang Chấm công, Giờ làm (đầu bảng xám nhạt, chữ 14px)
//                                 không truyền thì giữ nguyên giao diện cũ, các trang đang dùng Table không bị đổi.
export default function Table({ columns, rows, footer, maxHeight, onRowClick, minWidth, variant = "default" }) {
  const alignClass = (c) => (c.align === "right" ? "text-right" : "text-left");
  const clean = variant === "clean";

  const wrapStyle = maxHeight ? { maxHeight, overflowY: "auto" } : undefined;
  const tableStyle = minWidth ? { minWidth } : undefined;

  // ---------- kiểu mới ----------
  if (clean) {
    const last = columns.length - 1;
    return (
      <div className="overflow-x-auto" style={wrapStyle}>
        <table className="w-full text-[14px]" style={tableStyle}>
          <thead>
            <tr className="bg-slate-50">
              {columns.map((c, i) => (
                <th
                  key={c.key}
                  className={`whitespace-nowrap bg-slate-50 px-4 py-3 text-[13px] font-semibold text-slate-600 ${alignClass(c)} ${
                    i === 0 ? "rounded-l-lg" : ""
                  } ${i === last ? "rounded-r-lg" : ""} ${maxHeight ? "sticky top-0 z-10" : ""}`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id ?? i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-slate-100 text-slate-900 transition-colors last:border-0 ${
                  onRowClick ? "cursor-pointer hover:bg-slate-50" : ""
                }`}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3.5 ${alignClass(c)} ${c.className ?? ""}`}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {footer && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900">
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3.5 tabular-nums ${alignClass(c)}`}>
                    {footer[c.key] ?? ""}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    );
  }

  // ---------- kiểu cũ (giữ nguyên) ----------
  return (
    <div className="overflow-x-auto" style={wrapStyle}>
      <table className="w-full border-collapse text-sm" style={tableStyle}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={`whitespace-nowrap px-3 py-2.5 text-[12px] font-semibold text-[#59667a] ${alignClass(c)}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id ?? i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`${i % 2 === 0 ? "bg-white" : "bg-[#fafbfe]"} ${onRowClick ? "cursor-pointer" : ""}`}
            >
              {columns.map((c) => (
                <td key={c.key} className={`px-3 py-3 text-[12px] text-[#2e384a] ${alignClass(c)}`}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && (
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-[#fafbfe] font-semibold text-[#141f33]">
              {columns.map((c) => (
                <td key={c.key} className={`px-3 py-3 text-[12px] ${alignClass(c)}`}>
                  {footer[c.key] ?? ""}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}