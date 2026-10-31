// Hàng tab trạng thái kèm số lượng (Badge count) dùng chung cho các trang danh sách
export default function StatusTabs({ tabs = [], value, onChange, counts = {} }) {
  return (
    <div className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[14px]">
      {tabs.map((item) => {
        const id = Array.isArray(item) ? item[0] : item.id ?? item.value;
        const label = Array.isArray(item) ? item[1] : item.label;
        const count = counts?.[id];
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(id)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${
              active
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>{label}</span>
            {count != null && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[11px] font-semibold ${
                  active ? "bg-slate-100 text-slate-900" : "bg-slate-200 text-slate-600"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
