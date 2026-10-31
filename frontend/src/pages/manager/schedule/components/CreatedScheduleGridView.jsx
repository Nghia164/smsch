// Bảng ma trận lịch làm việc theo nhân viên x 7 ngày tuần (Grid View)

export default function CreatedScheduleGridView({
  days,
  pageGridEmployees,
  schedules,
  onOpenShiftModal,
}) {
  return (
    <div>
      {/* Chú thích màu ca */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-slate-100 px-4 py-2.5 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-sky-400" />
          Ca sáng (06:00 - 12:00)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
          Ca chiều (12:00 - 17:00)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-violet-400" />
          Ca tối (17:00 - 22:00)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-200" />
          Không có ca
        </span>
        <span className="ml-auto text-slate-400">💡 Bấm vào ô để điều chỉnh phân công ca</span>
      </div>

      {pageGridEmployees.length === 0 ? (
        <p className="py-10 text-center text-[15px] text-slate-500">
          Không có nhân viên phù hợp với bộ lọc hiện tại.
        </p>
      ) : (
        <div className="overflow-auto" style={{ maxHeight: "min(65vh, 560px)" }}>
          <table
            className="w-full table-fixed border-separate border-spacing-0 text-xs"
            style={{ minWidth: 200 + 72 + 84 + days.length * 85 }}
          >
            <thead>
              <tr>
                <th
                  style={{ width: 200 }}
                  className="sticky left-0 top-0 z-30 border-b border-r border-slate-200 bg-white px-4 py-2.5 text-left text-[13px] font-semibold text-[#59667a]"
                >
                  Nhân viên
                </th>
                {days.map((d) => {
                  const isWeekend = d.id === "T7" || d.id === "CN";
                  return (
                    <th
                      key={d.id}
                      className="sticky top-0 z-20 border-b border-slate-200 bg-white px-1 py-2 text-center"
                    >
                      <span className={`block text-[12px] font-semibold ${isWeekend ? "text-rose-500" : "text-[#59667a]"}`}>
                        {d.label}
                      </span>
                      <span className="block text-[11px] font-normal text-slate-400">
                        {d.date}
                      </span>
                    </th>
                  );
                })}
                <th
                  style={{ width: 72 }}
                  className="sticky top-0 z-20 border-b border-l border-slate-200 bg-white px-2 py-2.5 text-center text-[13px] font-semibold text-[#59667a]"
                >
                  Số ca
                </th>
                <th
                  style={{ width: 84 }}
                  className="sticky top-0 z-20 border-b border-slate-200 bg-white px-2 py-2.5 text-center text-[13px] font-semibold text-[#59667a]"
                >
                  Giờ làm
                </th>
              </tr>
            </thead>
            <tbody>
              {pageGridEmployees.map((e) => {
                let empShifts = 0;
                let empHours = 0;

                return (
                  <tr key={e.id}>
                    <td className="sticky left-0 z-10 border-b border-r border-slate-100 bg-white px-4 py-2">
                      <span className="block text-[13px] font-medium text-[#141f33]">{e.name}</span>
                      <span className="block text-[11px] text-slate-400">
                        {e.id} • {e.role}
                      </span>
                    </td>
                    {days.map((d) => {
                      const morningShift = schedules[`morning_${d.id}`]?.assigned?.some(
                        (item) => item.id === e.id
                      );
                      const afternoonShift = schedules[`afternoon_${d.id}`]?.assigned?.some(
                        (item) => item.id === e.id
                      );
                      const eveningShift = schedules[`evening_${d.id}`]?.assigned?.some(
                        (item) => item.id === e.id
                      );

                      let assignedShift = null;
                      if (morningShift) {
                        assignedShift = {
                          shiftKey: `morning_${d.id}`,
                          shiftId: "morning",
                          name: "Sáng",
                          start: "06:00",
                          end: "12:00",
                          hours: 6,
                        };
                      } else if (afternoonShift) {
                        assignedShift = {
                          shiftKey: `afternoon_${d.id}`,
                          shiftId: "afternoon",
                          name: "Chiều",
                          start: "12:00",
                          end: "17:00",
                          hours: 5,
                        };
                      } else if (eveningShift) {
                        assignedShift = {
                          shiftKey: `evening_${d.id}`,
                          shiftId: "evening",
                          name: "Tối",
                          start: "17:00",
                          end: "22:00",
                          hours: 5,
                        };
                      }

                      if (assignedShift) {
                        empShifts += 1;
                        empHours += assignedShift.hours;
                      }

                      return (
                        <td key={d.id} className="border-b border-slate-100 p-1">
                          {assignedShift ? (
                            <button
                              type="button"
                              onClick={() => onOpenShiftModal(assignedShift.shiftKey)}
                              className={`group relative flex h-11 w-full flex-col items-center justify-center rounded-lg border p-1 text-center transition-all hover:scale-[1.02] hover:shadow-xs ${
                                assignedShift.shiftId === "morning"
                                  ? "border-sky-200 bg-sky-50/80 text-sky-800 hover:border-sky-300"
                                  : assignedShift.shiftId === "afternoon"
                                  ? "border-amber-200 bg-amber-50/80 text-amber-800 hover:border-amber-300"
                                  : "border-violet-200 bg-violet-50/80 text-violet-800 hover:border-violet-300"
                              }`}
                            >
                              <span className="text-[11px] font-bold tracking-tight">
                                {assignedShift.name}
                              </span>
                              <span className="text-[9px] tabular-nums text-slate-500">
                                {assignedShift.start}-{assignedShift.end}
                              </span>
                            </button>
                          ) : (
                            <div className="flex h-11 w-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/40 text-[11px] text-slate-300">
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="border-b border-l border-slate-100 bg-slate-50/40 px-2 py-2 text-center tabular-nums">
                      <span className="text-[12px] font-semibold text-slate-700">{empShifts} ca</span>
                    </td>
                    <td className="border-b border-slate-100 bg-slate-50/40 px-2 py-2 text-center tabular-nums">
                      <span className="text-[12px] font-semibold text-slate-900">{empHours}g</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
