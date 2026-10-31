import { RowActions } from "../../../../components/TableKit";
import { Pagination } from "../../../../components/PageKit";
import {
  SHIFT_STATUS,
  fmtDuration,
  getShiftDurationMin,
  isOvernightShift,
} from "../shiftConfigData";

const th = "px-4 py-3 text-left text-[13px] font-semibold text-slate-600";

// Huy hiệu: nền màu nhạt + chấm màu (giống trang Quản lý nhân viên)
function Pill({ hex, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-medium text-slate-800" style={{ backgroundColor: `${hex}1f` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: hex }} />
      {children}
    </span>
  );
}

export default function ShiftTemplatesTab({
  shifts,
  rows,
  pageRows,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}) {
  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-[15px] text-slate-500">
        {shifts.length === 0 ? "Chưa có ca mẫu nào. Bấm “Thêm ca mẫu” để tạo." : "Không có ca mẫu phù hợp với bộ lọc hiện tại."}
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-[14px]">
          <thead>
            <tr className="bg-slate-50">
              <th className={`${th} rounded-l-lg`}>Tên ca</th>
              <th className={th}>Giờ làm</th>
              <th className={th}>Thời lượng</th>
              <th className={th}>Hệ số lương</th>
              <th className={th}>Trạng thái</th>
              <th className={`${th} rounded-r-lg`} />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((s) => {
              const duration = getShiftDurationMin(s.startTime, s.endTime);
              const isOvernight = isOvernightShift(s.startTime, s.endTime);
              return (
                <tr
                  key={s.id}
                  onClick={() => onEdit(s)}
                  className="cursor-pointer border-b border-slate-100 text-slate-900 transition-colors last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3.5 font-medium">{s.name}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 tabular-nums">
                    {s.startTime} – {s.endTime}
                    {isOvernight && (
                      <span className="ml-1.5 text-[12px] font-medium text-indigo-600">(hôm sau)</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 tabular-nums">
                    {fmtDuration(duration)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[12px] font-semibold text-slate-700">
                      x{Number(s.multiplier || 1.0).toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <Pill hex={SHIFT_STATUS[s.status].hex}>{SHIFT_STATUS[s.status].label}</Pill>
                  </td>
                  <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <RowActions
                      label={`Thao tác với ca ${s.name}`}
                      items={[
                        { label: "Sửa ca mẫu", onClick: () => onEdit(s) },
                        { label: "Xóa ca mẫu", danger: true, onClick: () => onDelete(s) },
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={rows.length}
        unit="ca"
        onPage={onPageChange}
        onPageSize={onPageSizeChange}
        sizes={[7, 10, 20]}
      />
    </>
  );
}
