import logoUrl from "../assets/logo.png";

// Logo + tên hệ thống (dùng trên thanh menu nền sáng).
// Đặt file logo của bạn tại src/assets/logo.png
// compact: chỉ hiện biểu tượng (khi menu thu gọn)
export default function Logo({ compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src={logoUrl} alt="Smart Scheduling" className="h-10 w-10 shrink-0 object-contain" />
      {!compact && (
        <div className="leading-[1.05]">
          <p className="text-[17px] font-bold tracking-tight text-[#0E1A3A]">Smart</p>
          <p className="text-[17px] font-bold tracking-tight text-[#1550E8]">Scheduling</p>
        </div>
      )}
    </div>
  );
}