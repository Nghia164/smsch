import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";
import Logo from "../components/Logo";
import MenuIcon from "../components/MenuIcon";

const menu = [
  { to: "/employees/Tong-quan", icon: "home", label: "Tổng quan" },
  { to: "/employees/schedule", icon: "calendar", label: "Lịch của tôi" },
  { to: "/employees/availability", icon: "calendarClock", label: "Đăng ký thời gian rảnh" },
  { to: "/employees/shift-exchange", icon: "swap", label: "Đổi ca" },
  { to: "/employees/open-shifts", icon: "userPlus", label: "Ca trực mở" },
  { to: "/employees/leave", icon: "fileText", label: "Nghỉ phép" },
  { to: "/employees/attendance", icon: "clipboardCheck", label: "Chấm công" },
  { to: "/employees/profile", icon: "user", label: "Thông tin cá nhân" },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
    isActive
      ? "bg-blue-500/25 font-medium text-white"
      : "text-slate-300 hover:bg-white/10 hover:text-white"
  }`;

export default function EmployeeLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="flex min-h-screen flex-col bg-slate-100 md:flex-row">
      <aside className="flex w-full shrink-0 flex-col bg-[#0B1D3F] p-4 text-white md:sticky md:top-0 md:h-screen md:w-60">
        <div className="mb-6 border-b border-white/10 px-3 pb-5">
          <Logo theme="dark" />
        </div>
        <nav className="flex min-h-0 max-h-[55vh] flex-col gap-1 overflow-y-auto overflow-x-hidden pr-1 md:max-h-none md:flex-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.25)_transparent]">
          {menu.map((m) => (
            <NavLink key={m.to} to={m.to} className={linkClass}>
              <MenuIcon name={m.icon} />
              {m.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 border-t border-white/10 px-3 pt-4 text-sm">
          <div className="font-medium text-slate-200">{user?.name}</div>
          <button onClick={logout} className="mt-1 text-slate-400 hover:text-white">
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="relative min-w-0 flex-1 p-5 md:p-8">
        <div className="absolute right-9 top-12 z-10 md:right-12 md:top-16">
          <NotificationBell />
        </div>
        <Outlet />
      </main>
    </div>
  );
}