import { NavLink } from "react-router-dom";
import Button from "./Button";
import { inputClass } from "./FilterBar";

// Các phần dùng chung của trang quản lý (Chấm công, Giờ làm, Bảng lương, ...).
// Đặt file tại: src/components/PageKit.jsx
// Sửa ở đây là mọi trang dùng nó đổi theo.

// ---------- nhãn tiếng Việt dùng chung ----------
export const ROLE_LABEL = { Shift_Leader: "Quản lý ca", Barista: "Pha chế", Cashier: "Thu ngân", Waiter: "Phục vụ", Manager: "Quản lý" };
export const roleLabel = (tag) => ROLE_LABEL[tag] ?? String(tag ?? "").replace(/_/g, " ");

export const CONTRACT_LABEL = { "Full-time": "Toàn thời gian", "Part-time": "Bán thời gian" };
export const contractLabel = (c) => CONTRACT_LABEL[c] ?? c ?? "—";

// ---------- dải tab nối các trang: giờ làm / chấm công / bảng lương ----------
export const HR_TABS = [
  { to: "/manager/work-hours", label: "Tổng hợp giờ làm" },
  { to: "/manager/attendance", label: "Đối soát chấm công" },
  { to: "/manager/payroll", label: "Bảng lương" },
];

// ---------- dải tab cho nhóm Lịch làm việc: Tạo lịch tự động / Lịch đã tạo ----------
export const SCHEDULE_TABS = [
  { to: "/manager/schedule", label: "Tạo lịch tự động" },
  { to: "/manager/schedule/created", label: "Lịch đã tạo" },
];

function SubNav({ tabs }) {
  return (
    <nav aria-label="Chuyển trang" className="mt-5 flex flex-wrap items-center gap-8 text-[15px] font-medium">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end
          className={({ isActive }) =>
            `pb-3 transition-colors ${
              isActive ? "border-b-2 border-slate-900 text-slate-900" : "text-slate-600 hover:text-slate-900"
            }`
          }
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}

// ---------- khung trắng bo góc + đầu trang ----------
// title, subtitle : tiêu đề và dòng mô tả
// actions         : phần bên phải tiêu đề (thường là <PeriodControl>)
// tabs            : mảng tab, ví dụ HR_TABS (bỏ qua nếu trang không có tab)
// stats           : <StatStrip> hiện sát mép khung, ngay dưới đầu trang
// children        : phần nội dung còn lại (có lề hai bên)
export function PageCard({ title, subtitle, actions, tabs, stats, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className={`border-b border-slate-200 px-6 pt-5 ${tabs ? "" : "pb-5"}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[18px] font-semibold leading-tight text-slate-900">{title}</h1>
            {subtitle && <p className="mt-1 text-[14px] text-slate-500">{subtitle}</p>}
          </div>
          {actions}
        </div>
        {tabs && <SubNav tabs={tabs} />}
      </div>
      {stats}
      <div className="px-6 pb-4">{children}</div>
    </div>
  );
}

// ---------- hàng ô số liệu tóm tắt ----------
// items: [{ key, icon (node), label, value, note?, color?, dot? (mã màu), active?, onClick? }]
// Có onClick thì ô bấm được (dùng để lọc nhanh). compact: cỡ số nhỏ hơn cho số tiền dài.
const COLS = { 2: "xl:grid-cols-2", 3: "xl:grid-cols-3", 4: "xl:grid-cols-4", 5: "xl:grid-cols-5" };

export function StatStrip({ items, compact = false }) {
  return (
    <div className={`grid border-b border-slate-200 sm:grid-cols-2 xl:divide-x xl:divide-slate-200 ${COLS[items.length] ?? "xl:grid-cols-5"}`}>
      {items.map((it) => {
        const body = (
          <>
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white shadow-sm"
              style={{ color: it.color ?? "#475569" }}
            >
              {it.icon}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-[14px] font-medium text-slate-600">
                {it.dot && <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: it.dot }} />}
                {it.label}
              </span>
              <span className="flex flex-wrap items-baseline gap-x-2">
                <b className={`font-semibold leading-tight tabular-nums text-slate-900 ${compact ? "text-[20px]" : "text-[24px]"}`}>{it.value}</b>
                {it.note && <span className="text-[12px] text-slate-500">{it.note}</span>}
              </span>
            </span>
          </>
        );
        const base = "flex items-center gap-3 px-5 py-5 text-left";
        return it.onClick ? (
          <button
            key={it.key}
            type="button"
            aria-pressed={!!it.active}
            onClick={it.onClick}
            className={`${base} transition-colors hover:bg-slate-50 ${it.active ? "bg-slate-100" : ""}`}
          >
            {body}
          </button>
        ) : (
          <div key={it.key} className={base}>
            {body}
          </div>
        );
      })}
    </div>
  );
}

// ---------- ô chọn kỳ "Tuần này | 📅 12/10 – 18/10/2026" ----------
// children: phần bên phải dấu | (nhãn ngày, ô nhập tháng, hoặc <DateRangeInputs>)
export function PeriodControl({ label, options, value, onChange, children }) {
  return (
    <div className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white shadow-sm">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full cursor-pointer rounded-l-lg bg-transparent pl-3 pr-2 text-[14px] text-slate-800 outline-none hover:bg-slate-50"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="h-6 w-px bg-slate-200" />
      <div className="flex items-center gap-2 px-3 text-[14px] text-slate-800">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        {children}
      </div>
    </div>
  );
}

export function DateRangeInputs({ from, to, onFrom, onTo }) {
  const cls = "w-36 bg-transparent text-[14px] outline-none";
  return (
    <>
      <input aria-label="Từ ngày" type="date" value={from} max={to || undefined} onChange={(e) => onFrom(e.target.value)} className={cls} />
      <span className="text-slate-400">–</span>
      <input aria-label="Đến ngày" type="date" value={to} min={from || undefined} onChange={(e) => onTo(e.target.value)} className={cls} />
    </>
  );
}

// ---------- ô tìm kiếm ----------
export function SearchInput({ value, onChange, placeholder = "Tìm tên hoặc mã nhân viên..." }) {
  return (
    <label className="relative block w-full sm:w-80">
      <span className="sr-only">Tìm nhân viên</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[14px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
      />
    </label>
  );
}

// ---------- nút "Xuất Excel" ----------
export function ExportButton({ onClick, disabled, loading }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="whitespace-nowrap"
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="m7 10 5 5 5-5" />
          <path d="M12 15V3" />
        </svg>
      }
    >
      {loading ? "Đang xuất..." : "Xuất Excel"}
    </Button>
  );
}

// ---------- hộp thông báo ----------
// tone: "success" (xanh lá) | "error" (đỏ) | "info" (xám)
// dot: mã màu chấm đầu dòng; action: nút/liên kết bên phải
const TONES = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-rose-200 bg-rose-50 text-rose-800",
  info: "border-slate-200 bg-slate-50 text-slate-800",
};
export function Alert({ tone = "info", dot, action, className = "mb-3", children }) {
  return (
    <div role={tone === "info" ? undefined : tone === "error" ? "alert" : "status"} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 text-[14px] ${TONES[tone]} ${className}`}>
      <span className="flex items-center gap-2.5">
        {dot && <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: dot }} />}
        {children}
      </span>
      {action}
    </div>
  );
}

// ---------- phân trang ----------
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

export function Pagination({ page, pageCount, total, pageSize, onPage, onPageSize, sizes = [7, 10, 20], unit = "bản ghi" }) {
  const count = pageCount ?? Math.max(1, Math.ceil((total || 0) / (pageSize || 10)));
  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-[14px] text-slate-600">
      <span>
        Trang {page} / {count} • {total} {unit}
      </span>
      <div className="flex items-center gap-1.5">
        <PageBtn onClick={() => onPage(1)} disabled={page === 1} aria-label="Trang đầu">«</PageBtn>
        <PageBtn onClick={() => onPage(page - 1)} disabled={page === 1} aria-label="Trang trước">‹</PageBtn>
        {pageList(page, count).map((n) =>
          typeof n === "number" ? (
            <PageBtn key={n} active={n === page} onClick={() => onPage(n)} aria-current={n === page ? "page" : undefined}>
              {n}
            </PageBtn>
          ) : (
            <span key={n} className="px-1 text-slate-400">…</span>
          )
        )}
        <PageBtn onClick={() => onPage(page + 1)} disabled={page === count} aria-label="Trang sau">›</PageBtn>
        <PageBtn onClick={() => onPage(count)} disabled={page === count} aria-label="Trang cuối">»</PageBtn>
      </div>
      <div className="w-32">
        <select aria-label="Số dòng mỗi trang" value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} className={inputClass}>
          {sizes.map((n) => (
            <option key={n} value={n}>
              {n} / trang
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}