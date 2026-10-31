// Nút dùng chung cho cả web. Muốn đổi màu cả web: chỉ sửa object VARIANTS bên dưới.
// Cách dùng:
//   <Button>Lưu</Button>                              -> nút chính (xanh dịu)
//   <Button variant="outline">Xuất Excel</Button>     -> nút viền
//   <Button variant="soft" size="sm">Chi tiết</Button>
//   <Button variant="ghost">Hủy</Button>
//   <Button variant="danger">Xóa</Button>
//   <Button loading>Đang lưu...</Button>
//   <Button icon={<svg .../>}>Xuất Excel</Button>

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4A6FD0] " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTS = {
  primary: "bg-[#3F62C4] text-white hover:bg-[#3452A8]",
  outline: "border border-[#BFD0F5] bg-white text-[#3452A8] hover:bg-[#EEF3FD]",
  soft: "bg-[#E8EEFB] text-[#3452A8] hover:bg-[#DAE4F8]",
  ghost: "text-[#3B4C70] hover:bg-[#F2F6FC]",
  danger: "bg-[#D64550] text-white hover:bg-[#B93842]",
};

const SIZES = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-3.5 text-[13.5px]",
  lg: "h-10 px-4 text-[14px]",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon = null,
  className = "",
  disabled = false,
  children,
  ...props
}) {
  return (
    <button
      className={`${BASE} ${VARIANTS[variant] ?? VARIANTS.primary} ${SIZES[size] ?? SIZES.md} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}