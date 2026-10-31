// Khung thẻ trắng dùng chung: tiêu đề + phụ đề + nội dung
export default function Card({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-[#0E1A3A]">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[13px] text-[#62718F]">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}