import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";
import Logo from "../components/Logo";
import MenuIcon from "../components/MenuIcon";

// Font: thêm vào index.html (trong <head>):
// <link rel="preconnect" href="https://fonts.googleapis.com" />
// <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap" rel="stylesheet" />
// Be Vietnam Pro được thiết kế riêng cho tiếng Việt nên dấu hiển thị rất gọn.
const FONT = '"Be Vietnam Pro", ui-sans-serif, system-ui, "Segoe UI", sans-serif';

// Mục có "children" là mục cha: bấm vào sẽ sổ ra các mục con.
// "base" là đường dẫn gốc của nhóm - đang ở trang con nào thì nhóm tự mở và sáng lên.
const MENU_GROUPS = [
  {
    title: "Chính",
    items: [{ to: "/manager/dashboard", icon: "home", label: "Tổng quan" }],
  },
  {
    title: "Lịch và ca",
    items: [
      { to: "/manager/shift-config", icon: "sliders", label: "Ca & ràng buộc" },
      {
        label: "Lịch làm việc",
        icon: "calendar",
        base: "/manager/schedule",
        children: [
          { to: "/manager/schedule", label: "Tạo lịch tự động" },
          { to: "/manager/schedule/created", label: "Lịch đã tạo" },
        ],
      },
      { to: "/manager/shift-exchange", icon: "swap", label: "Đổi ca" },
      { to: "/manager/open-shifts", icon: "userPlus", label: "Ca trực mở" },
    ],
  },
  {
    title: "Nhân sự",
    items: [
      { to: "/manager/employees", icon: "users", label: "Quản lý nhân viên" },
      { to: "/manager/leave", icon: "fileText", label: "Đơn xin nghỉ" },
      { to: "/manager/attendance", icon: "clipboardCheck", label: "Chấm công" },
      { to: "/manager/work-hours", icon: "clock", label: "Giờ làm" },
    ],
  },
  {
    title: "Tài chính",
    items: [
      { to: "/manager/payroll", icon: "wallet", label: "Tính lương" },
      { to: "/manager/reports", icon: "chart", label: "Báo cáo" },
    ],
  },
  {
    title: "Công cụ",
    items: [{ to: "/manager/assistant", icon: "sparkles", label: "Trợ lý AI" }],
  },
];

const ACTIVE_PILL =
  "bg-white font-semibold text-[#1550E8] shadow-[0_1px_2px_rgba(21,80,232,0.14),0_6px_16px_-4px_rgba(21,80,232,0.22)]";
const IDLE_PILL = "text-[#3B4C70] hover:bg-white/60 hover:text-[#0E1A3A]";

// ---------- Đồng hồ chạy theo giây ----------
// Tách thành component riêng: chỉ dòng giờ này render lại mỗi giây, menu và nội dung trang không bị ảnh hưởng.
const DATE_FMT = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  day: "numeric",
  month: "numeric",
  year: "numeric",
});
const TIME_FMT = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <p className="truncate text-[12.5px] capitalize text-[#62718F]">
      {DATE_FMT.format(now)}, <span className="tabular-nums">{TIME_FMT.format(now)}</span>
    </p>
  );
}

function Chevron({ open }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path d="M5 8l5 5 5-5" />
    </svg>
  );
}

function initials(name = "") {
  if (!name || typeof name !== "string") return "U";
  // Loại bỏ các phần trong ngoặc đơn như (mock), (quản lý)...
  const clean = name.replace(/\([^)]*\)/g, "").trim();
  const words = clean.split(/\s+/).filter((w) => /[a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/.test(w));
  if (words.length === 0) {
    const raw = name.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, "");
    return raw ? raw.slice(0, 1).toUpperCase() : "U";
  }
  if (words.length === 1) {
    // 1 từ duy nhất (vd: "Manager") -> lấy chữ cái đầu "M" để cân đối gọn gàng trong avatar
    return words[0].slice(0, 1).toUpperCase();
  }
  // Nhiều từ (vd: "Nguyễn Văn A" -> "NA", "Lê Tuấn" -> "LT")
  const first = words[0].match(/[a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/)?.[0] || "";
  const last = words[words.length - 1].match(/[a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/)?.[0] || "";
  return (first + last).toUpperCase() || "U";
}

// Mục đơn
function MenuLink({ item, collapsed }) {
  return (
    <NavLink
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `flex items-center rounded-xl px-3 py-2.5 text-[14px] transition-colors ${
          collapsed ? "gap-0 md:justify-center md:px-0" : "gap-3"
        } ${isActive ? ACTIVE_PILL : IDLE_PILL}`
      }
    >
      <MenuIcon name={item.icon} />
      <span className={collapsed ? "md:hidden" : ""}>{item.label}</span>
    </NavLink>
  );
}

// Mục cha + các mục con sổ xuống
function MenuGroup({ item, collapsed, onExpand }) {
  const { pathname } = useLocation();
  const active = pathname === item.base || pathname.startsWith(`${item.base}/`);
  const [open, setOpen] = useState(active);
  const [prevActive, setPrevActive] = useState(active);

  if (active !== prevActive) {
    setPrevActive(active);
    if (active) setOpen(true);
  }

  const handleClick = () => {
    if (collapsed) {
      onExpand(); // menu đang thu gọn: mở rộng menu rồi sổ nhóm
      setOpen(true);
    } else {
      setOpen((o) => !o);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleClick}
        aria-expanded={open}
        title={collapsed ? item.label : undefined}
        className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-[14px] transition-colors ${
          collapsed ? "justify-center md:px-0" : "justify-between"
        } ${active && !open ? ACTIVE_PILL : active ? "font-semibold text-[#1550E8]" : IDLE_PILL}`}
      >
        <span className={`flex items-center ${collapsed ? "gap-0" : "gap-3"}`}>
          <MenuIcon name={item.icon} />
          <span className={collapsed ? "md:hidden" : ""}>{item.label}</span>
        </span>
        <span className={collapsed ? "md:hidden" : ""}>
          <Chevron open={open} />
        </span>
      </button>

      {open && (
        <div className={`ml-[21px] mt-1 flex flex-col gap-0.5 border-l-2 border-[#BFD5FB] pl-3 ${collapsed ? "md:hidden" : ""}`}>
          {item.children.map((c) => (
            <NavLink
              key={c.to}
              to={c.to}
              end
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-[13px] transition-colors ${
                  isActive ? "bg-white font-semibold text-[#1550E8] shadow-sm" : "text-[#4A5B80] hover:bg-white/60 hover:text-[#0E1A3A]"
                }`
              }
            >
              {c.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function IconButton({ label, onClick, className = "", children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-10 w-10 place-items-center rounded-xl border border-[#DCE6F5] bg-white text-[#3B4C70] transition-colors hover:border-[#1550E8]/40 hover:text-[#1550E8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1550E8] ${className}`}
    >
      {children}
    </button>
  );
}

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "h-[18px] w-[18px]",
  "aria-hidden": true,
};

export default function ManagerLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false); // chỉ áp dụng từ màn hình md trở lên
  const [mobileOpen, setMobileOpen] = useState(false);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-[#F2F6FC] text-[#0E1A3A]" style={{ fontFamily: FONT }}>
      {/* Lớp phủ khi menu mở trên mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-[#0E1A3A]/40 md:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      {/* ===== Menu bên trái ===== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[272px] shrink-0 flex-col border-r border-[#D3E1F7] transition-[transform,width] duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-[84px]" : "md:w-[272px]"}`}
        style={{ background: "linear-gradient(180deg,#C7DCFF 0%,#DDEAFF 38%,#F0F6FF 100%)" }}
      >
        <div className={`flex h-[72px] shrink-0 items-center px-5 transition-all ${collapsed ? "md:justify-center md:px-0" : ""}`}>
          <Link to="/manager/dashboard" aria-label="Smart Scheduling - Trang tổng quan" className="flex items-center justify-center">
            <span className="hidden md:inline-flex">
              <Logo compact={collapsed} theme="light" />
            </span>
            <span className="inline-flex md:hidden">
              <Logo theme="light" />
            </span>
          </Link>
        </div>

        <nav
          className={`flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overflow-x-hidden px-3 pb-4 pt-2 [scrollbar-width:thin] [scrollbar-color:rgba(21,80,232,0.25)_transparent] ${
            collapsed ? "md:px-3" : ""
          }`}
        >
          {MENU_GROUPS.map((g) => (
            <div key={g.title} className="flex flex-col gap-1">
              <p className={`px-3 pb-1 text-[12px] font-medium text-[#5D7099] ${collapsed ? "md:hidden" : ""}`}>{g.title}</p>
              {collapsed && <div className="mx-3 hidden h-px bg-[#B9CFF3] md:block" />}
              {g.items.map((m) =>
                m.children ? (
                  <MenuGroup key={m.label} item={m} collapsed={collapsed} onExpand={() => setCollapsed(false)} />
                ) : (
                  <MenuLink key={m.to} item={m} collapsed={collapsed} />
                )
              )}
            </div>
          ))}
        </nav>

        {/* Thẻ người dùng */}
        <div className={`shrink-0 transition-all ${collapsed ? "p-2" : "p-3"}`}>
          <div
            className={`flex items-center rounded-2xl bg-white shadow-[0_1px_3px_rgba(21,80,232,0.12)] transition-all ${
              collapsed
                ? "flex-col gap-2 p-2 justify-center"
                : "gap-3 p-3"
            }`}
          >
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[15px] font-bold text-white shadow-sm transition-transform hover:scale-105"
              style={{ background: "linear-gradient(135deg,#1550E8,#19B0DC)" }}
              title={`${user?.name || "Người dùng"} (Quản lý)`}
            >
              {initials(user?.name)}
            </span>
            <div className={`min-w-0 flex-1 ${collapsed ? "md:hidden" : ""}`}>
              <p className="truncate text-[14px] font-semibold leading-tight text-[#0E1A3A]" title={user?.name}>
                {user?.name}
              </p>
              <p className="text-[12px] text-[#62718F]">Quản lý</p>
            </div>
            <button
              type="button"
              onClick={logout}
              aria-label="Đăng xuất"
              title="Đăng xuất"
              className={`grid shrink-0 place-items-center rounded-xl text-[#E5484D] transition-colors hover:bg-[#FFF0F0] hover:text-[#D9383E] focus-visible:outline-2 focus-visible:outline-[#E5484D] ${
                collapsed ? "h-8 w-8" : "h-9 w-9"
              }`}
            >
              <svg {...svgProps} className={collapsed ? "h-4 w-4" : "h-[18px] w-[18px]"}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="m16 17 5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ===== Khu vực nội dung ===== */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-[72px] shrink-0 items-center gap-3 border-b border-[#E3EAF5] bg-white/85 px-4 backdrop-blur md:px-8">
          <IconButton label="Mở menu" onClick={() => setMobileOpen(true)} className="md:hidden">
            <svg {...svgProps}>
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </IconButton>
          <IconButton
            label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
            onClick={() => setCollapsed((c) => !c)}
            className="hidden md:grid"
          >
            <svg {...svgProps}>
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <path d="M9 4v16" />
            </svg>
          </IconButton>

          <div className="min-w-0">
            <p className="truncate text-[17px] font-bold leading-tight tracking-tight">Xin chào, {user?.name}</p>
            <LiveClock />
          </div>

          <div className="ml-auto flex items-center gap-2.5">
            <label className="relative hidden lg:block">
              <span className="sr-only">Tìm kiếm</span>
              <svg {...svgProps} className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C8BAA]">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                placeholder="Tìm nhân viên, ca làm, đơn từ..."
                className="h-10 w-[300px] rounded-xl border border-[#DCE6F5] bg-[#F7FAFF] pl-10 pr-4 text-[13.5px] outline-none placeholder:text-[#8795B1] focus:border-[#1550E8] focus:bg-white focus:ring-4 focus:ring-[#1550E8]/10"
              />
            </label>

            {/* NotificationBell tự có nút và danh sách thông báo của nó */}
            <NotificationBell />

            <Link
              to="/manager/schedule"
              className="hidden h-10 items-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold text-white transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1550E8] sm:inline-flex"
              style={{ background: "linear-gradient(135deg,#1550E8,#0F8BD9)" }}
            >
              <MenuIcon name="sparkles" size={16} />
              Xếp lịch tự động
            </Link>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 pb-10 pt-6 md:px-8">
          <div className="mx-auto w-full max-w-[1440px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}