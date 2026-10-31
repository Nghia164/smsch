import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { ROLES } from "./constants";

import LoginPage from "./pages/LoginPage";
import ManagerLayout from "./layouts/ManagerLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";

import EmployeeListPage from "./pages/manager/employees/EmployeeListPage";
import ShiftConfigPage from "./pages/manager/shiftconfig/ShiftConfigPage";
import SchedulePage from "./pages/manager/schedule/SchedulePage";
import CreatedSchedulePage from "./pages/manager/schedule/CreatedSchedulePage";
import WorkHoursPage from "./pages/manager/workHours/WorkHoursPage";
import ShiftExchangePage from "./pages/manager/shiftExchange/ShiftExchangePage";
import OpenShiftPage from "./pages/manager/openshifts/OpenShiftPage";
import LeavePage from "./pages/manager/leave/LeavePage";
import AttendancePage from "./pages/manager/attendance/AttendancePage";
import PayrollPage from "./pages/manager/payroll/PayrollPage";
import DashboardPage from "./pages/manager/DashboardPage";
import ReportPage from "./pages/manager/ReportPage";
import AssistantPage from "./pages/manager/assistant/AssistantPage";

import EmployeeProfilePage from "./pages/employees/ProfilePage";
import EmployeeAvailabilityPage from "./pages/employees/AvailabilityPage";
import EmployeeMySchedulePage from "./pages/employees/MySchedulePage";
import EmployeeShiftExchangePage from "./pages/employees/ShiftExchangePage";
import EmployeeOpenShiftPage from "./pages/employees/OpenShiftPage";
import EmployeeLeavePage from "./pages/employees/LeavePage";
import EmployeeAttendancePage from "./pages/employees/AttendancePage";
import TongQuan from "./pages/employees/TongQuan";


const normalizeRole = (role) => (role ? String(role).toLowerCase() : "");

const homeOf = (role) =>
  normalizeRole(role) === ROLES.MANAGER ? "/manager/schedule" : "/employees/schedule";

function Protected({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (normalizeRole(user.role) !== normalizeRole(role)) {
    return <Navigate to={homeOf(user.role)} replace />;
  }
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/manager" element={<Protected role={ROLES.MANAGER}><ManagerLayout /></Protected>}>
        <Route index element={<Navigate to="schedule" replace />} />
        <Route path="employees" element={<EmployeeListPage />} />
        <Route path="shift-config" element={<ShiftConfigPage />} />
        {/* Menu "Lịch làm việc" sổ ra 3 mục con: Tạo lịch tự động, Lịch đã tạo, Quản lý ca mẫu */}
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="schedule/created" element={<CreatedSchedulePage />} />
        <Route path="work-hours" element={<WorkHoursPage />} />
        <Route path="shift-exchange" element={<ShiftExchangePage />} />
        <Route path="open-shifts" element={<OpenShiftPage />} />
        <Route path="leave" element={<LeavePage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="payroll" element={<PayrollPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="reports" element={<ReportPage />} />
        <Route path="assistant" element={<AssistantPage />} />
      </Route>

      <Route path="/employees" element={<Protected role={ROLES.STAFF}><EmployeeLayout /></Protected>}>
        <Route index element={<Navigate to="schedule" replace />} />
        <Route path="profile" element={<EmployeeProfilePage />} />
        <Route path="availability" element={<EmployeeAvailabilityPage />} />
        <Route path="schedule" element={<EmployeeMySchedulePage />} />
        <Route path="shift-exchange" element={<EmployeeShiftExchangePage />} />
        <Route path="open-shifts" element={<EmployeeOpenShiftPage />} />
        <Route path="leave" element={<EmployeeLeavePage />} />
        <Route path="attendance" element={<EmployeeAttendancePage />} />
        <Route path="Tong-quan" element={<TongQuan />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? homeOf(user.role) : "/login"} replace />} />
    </Routes>
  );
}