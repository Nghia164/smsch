import { useNavigate } from "react-router-dom";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Cpu,
  CalendarDays,
  FileCheck2,
} from "lucide-react";

import { PageCard, StatStrip } from "../../../components/PageKit";
import {
  SCHEDULE_TABS,
  WEEK_LABEL,
} from "./scheduleShared";

import ScheduleConstraintsCard from "./components/ScheduleConstraintsCard";
import ShiftDemandCard from "./components/ShiftDemandCard";
import ScheduleMatrixCard from "./components/ScheduleMatrixCard";

import ShiftDetailModal from "./components/ShiftDetailModal";
import EditShiftModal from "./components/EditShiftModal";
import AutoGenerateModal from "./components/AutoGenerateModal";
import ConfirmScheduleModal from "./components/ConfirmScheduleModal";
import { useScheduleManagement } from "./hooks/useScheduleManagement.js";

/**
 * US12 - Xếp lịch tự động (Manager)
 */
export default function SchedulePage() {
  const navigate = useNavigate();
  const {
    activeModal,
    setActiveModal,
    constraints,
    days,
    shiftDemands,
    schedules,
    selectedShiftKey,
    isConfirmedState,
    editEmployeesList,
    showAddEmployeeDropdown,
    setShowAddEmployeeDropdown,
    weekendConfigured,
    isGenerating,
    generationSuccess,
    selectedInfo,
    uniqueEmployeesCount,
    employeeRoster,
    statItems,
    handleCellClick,
    handleOpenEditModal,
    handleGoToOpenShift,
    toggleConstraint,
    updateConstraintValue,
    updateDemandField,
    toggleDay,
    handleCopyWeekendDemand,
    handleCustomWeekendDemand,
    handleRemoveFromEditShift,
    handleAddEmployeeToEditShift,
    handleSaveEditShift,
    handleConfirmSchedule,
    handleRunORTools,
  } = useScheduleManagement();

  return (
    <PageCard
      title="Tạo lịch tự động"
      subtitle="Cấu hình nhu cầu nhân sự và các ràng buộc để hệ thống sử dụng OR-Tools tạo lịch làm việc tự động."
      tabs={SCHEDULE_TABS}
      actions={
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bộ chọn tuần */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 shadow-xs">
            <Calendar size={16} className="text-slate-600" />
            <span className="text-sm font-medium text-slate-700">{WEEK_LABEL}</span>
            <div className="ml-1 flex items-center border-l border-slate-200 pl-2">
              <button
                type="button"
                className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                title="Tuần trước"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                title="Tuần sau"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Xem lịch chi tiết */}
          <button
            type="button"
            onClick={() => navigate("/manager/schedule/created", { state: { schedules } })}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-xs transition hover:border-[#3F62C4]/40 hover:bg-slate-50 hover:text-[#3F62C4] active:scale-[0.98]"
          >
            <CalendarDays size={16} />
            <span>Xem lịch chi tiết</span>
          </button>

          {/* Xác nhận lịch */}
          <button
            type="button"
            onClick={() => {
              if (isConfirmedState) {
                alert("Lịch tuần này đã được xác nhận chính thức.");
                return;
              }
              setActiveModal("confirmSchedule");
            }}
            disabled={isConfirmedState}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-white shadow-xs transition ${
              isConfirmedState ? "bg-slate-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]"
            }`}
          >
            <FileCheck2 size={16} />
            <span>{isConfirmedState ? "Đã xác nhận" : "Xác nhận lịch"}</span>
          </button>

          {/* Tạo lịch bằng OR-Tools */}
          <button
            type="button"
            onClick={() => {
              if (isConfirmedState) {
                alert("Lịch tuần này đã được xác nhận chính thức, không thể tạo lại.");
                return;
              }
              setActiveModal("createSchedule");
            }}
            disabled={isConfirmedState}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-xs transition ${
              isConfirmedState ? "bg-slate-400 cursor-not-allowed" : "bg-[#3F62C4] hover:bg-[#3452A8] active:scale-[0.98]"
            }`}
          >
            <Cpu size={16} />
            <span>Tạo lịch bằng OR-Tools</span>
          </button>
        </div>
      }
      stats={<StatStrip items={statItems} />}
    >
      {/* 3 Cột chức năng */}
      <div className="pt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Cột 1: Ràng buộc */}
        <div className="xl:col-span-4">
          <ScheduleConstraintsCard
            constraints={constraints}
            onToggle={toggleConstraint}
            onUpdateValue={updateConstraintValue}
          />
        </div>

        {/* Cột 2: Nhu cầu nhân sự */}
        <div className="xl:col-span-4">
          <ShiftDemandCard
            days={days}
            shiftDemands={shiftDemands}
            weekendConfigured={weekendConfigured}
            onToggleDay={toggleDay}
            onUpdateDemandField={updateDemandField}
            onCopyWeekendDemand={handleCopyWeekendDemand}
            onCustomWeekendDemand={handleCustomWeekendDemand}
          />
        </div>

        {/* Cột 3: Kết quả & ma trận */}
        <div className="xl:col-span-4">
          <ScheduleMatrixCard
            days={days}
            shiftDemands={shiftDemands}
            schedules={schedules}
            selectedShiftKey={selectedShiftKey}
            onSelectShift={handleCellClick}
            onOpenFullSchedule={() => navigate("/manager/schedule/created", { state: { schedules } })}
            onGoToOpenShift={handleGoToOpenShift}
          />
        </div>
      </div>

      {/* Modal Chi tiết ca */}
      <ShiftDetailModal
        open={activeModal === "shiftDetail"}
        selectedInfo={selectedInfo}
        onClose={() => setActiveModal(null)}
        onOpenEdit={handleOpenEditModal}
        onGoToOpenShift={handleGoToOpenShift}
      />

      {/* Modal Chỉnh sửa ca */}
      <EditShiftModal
        open={activeModal === "editShift"}
        selectedInfo={selectedInfo}
        editEmployeesList={editEmployeesList}
        employeeRoster={employeeRoster.filter((e) => e.status !== "Nghỉ việc" && e.trang_thai !== "INACTIVE")}
        showAddDropdown={showAddEmployeeDropdown}
        onClose={() => setActiveModal(null)}
        onToggleAddDropdown={() => setShowAddEmployeeDropdown((prev) => !prev)}
        onRemoveEmployee={handleRemoveFromEditShift}
        onAddEmployee={handleAddEmployeeToEditShift}
        onSave={handleSaveEditShift}
      />

      {/* Modal Tạo lịch OR-Tools */}
      <AutoGenerateModal
        open={activeModal === "createSchedule"}
        isGenerating={isGenerating}
        generationSuccess={generationSuccess}
        constraints={constraints}
        onClose={() => setActiveModal(null)}
        onRun={handleRunORTools}
      />

      {/* Modal Xác nhận lịch */}
      <ConfirmScheduleModal
        open={activeModal === "confirmSchedule"}
        assignedEmployeesCount={uniqueEmployeesCount}
        onClose={() => setActiveModal(null)}
        onConfirm={handleConfirmSchedule}
      />
    </PageCard>
  );
}