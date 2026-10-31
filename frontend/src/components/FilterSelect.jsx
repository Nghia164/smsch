// Bộ lọc dạng thẻ chọn (Dropdown) dùng chung cho các thanh công cụ (Toolbar)
export default function FilterSelect({ label, value, onChange, options = [], className = "" }) {
  const hasAll = options.some((o) => (typeof o === "object" ? o.value : o) === "all");
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-10 rounded-lg border border-slate-200 bg-white px-3 text-[14px] text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 ${className}`}
    >
      {!hasAll && <option value="all">Tất cả {label ? label.toLowerCase() : ""}</option>}
      {options.map((opt) => {
        const val = typeof opt === "object" ? opt.value : opt;
        const lbl = typeof opt === "object" ? opt.label : opt;
        return (
          <option key={val} value={val}>
            {lbl}
          </option>
        );
      })}
    </select>
  );
}
