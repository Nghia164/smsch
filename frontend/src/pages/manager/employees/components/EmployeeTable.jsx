import { RowActions } from "../../../../components/TableKit";
import { initialsOf } from "../../../../utils/format";
import { fmtBirth, STATUS_HEX } from "../employeeData";

function Pill({ hex, children }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-medium text-slate-800"
      style={{ backgroundColor: `${hex}1f` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: hex }} />
      {children}
    </span>
  );
}

const th = "px-4 py-3 text-left font-medium text-slate-600";

/**
 * Bảng hiển thị danh sách nhân viên
 */
export default function EmployeeTable({
  pageRows = [],
  onRowClick,
  menuItems,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-[14px]">
        <thead>
          <tr className="bg-slate-50">
            <th className={`${th} rounded-l-lg`}>Nhân viên</th>
            <th className={th}>Vai trò</th>
            <th className={th}>Loại hợp đồng</th>
            <th className={th}>Ngày sinh</th>
            <th className={th}>Tài khoản</th>
            <th className={th}>Trạng thái</th>
            <th className={`${th} rounded-r-lg`} />
          </tr>
        </thead>
        <tbody>
          {pageRows.map((emp) => {
            const locked = emp.account?.status === "locked";
            return (
              <tr
                key={emp.id}
                onClick={() => onRowClick(emp)}
                className="cursor-pointer border-b border-slate-100 text-slate-900 transition-colors last:border-0 hover:bg-slate-50"
              >
                <td className="px-4 py-3.5">
                  <span className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-[12px] font-semibold text-slate-600">
                      {initialsOf(emp.name)}
                    </span>
                    <span>
                      <span className="block font-medium">{emp.name}</span>
                      <span className="block text-[12px] text-slate-500">
                        {emp.id} • {emp.phone}
                      </span>
                    </span>
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">{emp.role}</td>
                <td className="whitespace-nowrap px-4 py-3.5">{emp.contract}</td>
                <td className="whitespace-nowrap px-4 py-3.5 tabular-nums">{fmtBirth(emp.birthDate)}</td>
                <td className="px-4 py-3.5">
                  {emp.account ? (
                    <>
                      <Pill hex={locked ? "#f43f5e" : "#10b981"}>{locked ? "Đã khóa" : "Đã cấp"}</Pill>
                      <span className="mt-1 block text-[12px] text-slate-500">{emp.account.email}</span>
                    </>
                  ) : (
                    <span className="text-slate-400">Chưa cấp</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <Pill hex={STATUS_HEX[emp.status]}>{emp.status}</Pill>
                </td>
                <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                  <RowActions label={`Thao tác với ${emp.name}`} items={menuItems(emp)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
