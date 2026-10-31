import Button from "../../../components/Button";
import FilterSelect from "../../../components/FilterSelect";
import StatusTabs from "../../../components/StatusTabs";
import { DEFAULT_FILTERS, ROLE_OPTIONS, TABS } from "./exchangeShared";

// Hàng tab trạng thái (kèm số yêu cầu) + ô tìm kiếm + bộ lọc vai trò.
// filters = { status, role, q }; counts = số yêu cầu theo từng tab.
export default function ExchangeToolbar({ filters, onChange, counts }) {
  const set = (key) => (value) => onChange({ ...filters, [key]: value });
  const canClear = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4">
      <StatusTabs tabs={TABS} value={filters.status} onChange={set("status")} counts={counts} />

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={filters.q}
          onChange={(e) => set("q")(e.target.value)}
          placeholder="Tìm tên nhân viên, mã yêu cầu, lý do..."
          aria-label="Tìm yêu cầu đổi ca"
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-[14px] outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 sm:w-72"
        />
        <FilterSelect label="Vai trò" value={filters.role} onChange={set("role")} options={ROLE_OPTIONS} />
        {canClear && (
          <Button type="button" variant="ghost" size="lg" onClick={() => onChange(DEFAULT_FILTERS)}>
            Xóa bộ lọc
          </Button>
        )}
      </div>
    </div>
  );
}
