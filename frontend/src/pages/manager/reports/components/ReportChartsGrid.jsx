import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS_TICK, GRID_COLOR, PIE_COLORS, fmtNum, fmtMoney } from "../reportData";

function ChartCard({ title, subtitle, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3">
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-[13px] text-slate-600">{subtitle}</p>}
      </div>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default function ReportChartsGrid({ overview }) {
  if (!overview || overview.empty) return null;

  return (
    <div className="grid gap-4 border-b border-slate-200 py-5 lg:grid-cols-3">
      {/* 1. Chi phí lương */}
      <ChartCard title="Chi phí lương theo nhân viên" subtitle={overview.periodLabel}>
        <BarChart data={overview.charts.payrollPerEmployee}>
          <CartesianGrid stroke={GRID_COLOR} vertical={false} />
          <XAxis
            dataKey="name"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v.split(" ").slice(-1)[0]}
            interval={0}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v) => `${Math.round(v / 1000)}k`}
          />
          <Tooltip cursor={{ fill: "#F1F5F9" }} formatter={(v) => fmtMoney(v)} />
          <Bar dataKey="total" name="Tổng lương" fill="#93C5FD" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ChartCard>

      {/* 2. Giờ làm */}
      <ChartCard title="Giờ theo lịch so với giờ thực tế" subtitle={overview.periodLabel}>
        <BarChart data={overview.charts.hoursPerEmployee}>
          <CartesianGrid stroke={GRID_COLOR} vertical={false} />
          <XAxis
            dataKey="name"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v.split(" ").slice(-1)[0]}
            interval={0}
          />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={36} />
          <Tooltip cursor={{ fill: "#F1F5F9" }} formatter={(v) => `${fmtNum(v)} giờ`} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(v) => <span className="text-xs text-slate-600">{v}</span>}
          />
          <Bar dataKey="scheduled" name="Giờ theo lịch" fill="#A5B4FC" radius={[4, 4, 0, 0]} maxBarSize={20} />
          <Bar dataKey="actual" name="Giờ thực tế" fill="#6EE7B7" radius={[4, 4, 0, 0]} maxBarSize={20} />
        </BarChart>
      </ChartCard>

      {/* 3. Tình hình chấm công */}
      <ChartCard title="Tình hình chấm công" subtitle={overview.periodLabel}>
        <PieChart>
          <Pie
            data={overview.charts.attendance}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            stroke="none"
          >
            {overview.charts.attendance.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v, n) => [`${v} ca`, n]} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(v) => <span className="text-xs text-slate-600">{v}</span>}
          />
        </PieChart>
      </ChartCard>
    </div>
  );
}
