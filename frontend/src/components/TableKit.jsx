import { useEffect, useRef, useState } from "react";

// Các ô dùng chung bên trong bảng (dùng cùng components/Table.jsx): người, huy hiệu trạng thái, nút ⋮.
// Đặt file tại: src/components/TableKit.jsx

// ---------- ảnh đại diện chữ cái đầu ----------
export const initialsOf = (name = "") => {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  return (p.length === 1 ? p[0].slice(0, 2) : p[p.length - 2][0] + p[p.length - 1][0]).toUpperCase();
};

export function Avatar({ name, size = "md" }) {
  const cls = size === "lg" ? "h-11 w-11 text-[14px]" : "h-9 w-9 text-[12px]";
  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-slate-100 font-semibold text-slate-600 ${cls}`}>
      {initialsOf(name)}
    </span>
  );
}

// Ô "Nhân viên": ảnh + tên + dòng phụ
export function Person({ name, sub }) {
  return (
    <span className="flex items-center gap-3">
      <Avatar name={name} />
      <span>
        <span className="block font-medium">{name}</span>
        {sub && <span className="block text-[12px] text-slate-500">{sub}</span>}
      </span>
    </span>
  );
}

// ---------- huy hiệu trạng thái: nền màu nhạt + chấm màu, cùng độ rộng ----------
export function StatusPill({ hex = "#94a3b8", children }) {
  return (
    <span
      className="inline-flex w-36 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-medium text-slate-800"
      style={{ backgroundColor: `${hex}1f` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: hex }} />
      {children}
    </span>
  );
}

// ---------- nút "⋮" + menu thao tác ----------
// items: [{ label, onClick, disabled?, danger? }]
export function RowActions({ items, label = "Thao tác" }) {
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [anchor, setAnchor] = useState(null);

  useEffect(() => {
    if (!anchor) return undefined;
    const close = (e) => {
      if (e.type === "mousedown" && (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target))) return;
      setAnchor(null);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [anchor]);

  const toggle = (e) => {
    e.stopPropagation(); // không kích hoạt "bấm cả dòng"
    if (anchor) return setAnchor(null);
    const r = e.currentTarget.getBoundingClientRect();
    setAnchor({ right: r.right, top: r.top, bottom: r.bottom });
  };

  const openUp = anchor && anchor.bottom + 40 * items.length + 20 > window.innerHeight;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        onClick={toggle}
        className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>

      {anchor && (
        <div
          ref={menuRef}
          role="menu"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            right: window.innerWidth - anchor.right,
            top: openUp ? undefined : anchor.bottom + 4,
            bottom: openUp ? window.innerHeight - anchor.top + 4 : undefined,
          }}
          className="z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-lg"
        >
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              disabled={it.disabled}
              onClick={() => {
                setAnchor(null);
                it.onClick();
              }}
              className={`block w-full px-4 py-2 text-left text-[14px] hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white ${it.danger ? "text-rose-600" : "text-slate-800"}`}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}