import { Users, Building, Calendar, Check } from "lucide-react";
import { createElement, useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getShiftConfig } from "../../../../services/shiftConfigService";
import {
  employeeRoster,
  initialDays,
  initialConstraints,
  initialShiftDemands,
  getSavedSchedules,
  saveSchedules,
  confirmSchedule,
  isScheduleConfirmed,
  getShiftInfo,
  mergeConfigConstraints,
  mergeConfigShifts,
} from "../scheduleShared";

/**
 * Hook quản lý trạng thái, thuật toán OR-Tools và tương tác lịch làm việc (US12)
 */
export function useScheduleManagement() {
  const navigate = useNavigate();

  const [activeModal, setActiveModal] = useState(null);
  const [constraints, setConstraints] = useState(initialConstraints);
  const [days, setDays] = useState(initialDays);
  const [shiftDemands, setShiftDemands] = useState(initialShiftDemands);
  const [schedules, setSchedules] = useState(getSavedSchedules);
  const [selectedShiftKey, setSelectedShiftKey] = useState("morning_T3");
  const [isConfirmedState, setIsConfirmedState] = useState(isScheduleConfirmed);

  const [editEmployeesList, setEditEmployeesList] = useState([]);
  const [showAddEmployeeDropdown, setShowAddEmployeeDropdown] = useState(false);
  const [weekendConfigured, setWeekendConfigured] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);

  // Tự động đồng bộ ca mẫu và ràng buộc từ module ShiftConfig
  useEffect(() => {
    getShiftConfig()
      .then((cfg) => {
        if (cfg?.constraints) {
          setConstraints((prev) => mergeConfigConstraints(prev, cfg.constraints));
        }
        if (cfg?.shifts) {
          setShiftDemands((prev) => mergeConfigShifts(prev, cfg.shifts));
        }
      })
      .catch((err) => {
        console.warn("Could not load shift config, using defaults:", err);
      });
  }, []);

  const selectedInfo = useMemo(
    () => getShiftInfo(schedules, shiftDemands, days, selectedShiftKey),
    [schedules, shiftDemands, days, selectedShiftKey]
  );

  const handleCellClick = (shiftId, dayId) => {
    setSelectedShiftKey(`${shiftId}_${dayId}`);
    setActiveModal("shiftDetail");
  };

  const handleOpenEditModal = () => {
    if (isConfirmedState) {
      alert("Lịch tuần này đã được xác nhận chính thức, không thể chỉnh sửa.");
      return;
    }
    const current = schedules[selectedShiftKey]?.assigned || [];
    setEditEmployeesList([...current]);
    setShowAddEmployeeDropdown(false);
    setActiveModal("editShift");
  };

  const handleGoToOpenShift = (targetShift) => {
    setActiveModal(null);
    const shiftData = targetShift || selectedInfo;
    navigate("/manager/open-shifts", {
      state: {
        shift: shiftData,
        fromSchedule: true,
      },
    });
  };

  const toggleConstraint = (id) => {
    setConstraints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const updateConstraintValue = (id, val) => {
    setConstraints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, value: val } : c))
    );
  };

  const updateDemandField = (shiftId, field, delta) => {
    setShiftDemands((prev) =>
      prev.map((item) => {
        if (item.id === shiftId) {
          const newVal = Math.max(0, item[field] + delta);
          const updated = { ...item, [field]: newVal };
          updated.total = updated.phucVu + updated.phaChe + updated.thuNgan;
          return updated;
        }
        return item;
      })
    );
  };

  const toggleDay = (dayId) => {
    setDays((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, active: !d.active } : d))
    );
  };

  const handleCopyWeekendDemand = () => {
    setDays((prev) =>
      prev.map((d) => (d.id === "T7" || d.id === "CN" ? { ...d, active: true } : d))
    );
    setWeekendConfigured(true);
  };

  const handleCustomWeekendDemand = () => {
    setDays((prev) =>
      prev.map((d) => (d.id === "T7" || d.id === "CN" ? { ...d, active: true } : d))
    );
    setWeekendConfigured(true);
  };

  const handleRemoveFromEditShift = (empId) => {
    setEditEmployeesList((prev) => prev.filter((e) => e.id !== empId));
  };

  const handleAddEmployeeToEditShift = (employee) => {
    if (employee.status === "Nghỉ việc" || employee.trang_thai === "INACTIVE") {
      alert("Không thể phân công ca cho nhân viên đã nghỉ việc.");
      return;
    }
    if (!editEmployeesList.some((e) => e.id === employee.id)) {
      setEditEmployeesList((prev) => [...prev, employee]);
    }
    setShowAddEmployeeDropdown(false);
  };

  const handleSaveEditShift = () => {
    if (isConfirmedState) {
      alert("Lịch tuần này đã được xác nhận chính thức, không thể chỉnh sửa.");
      setActiveModal(null);
      return;
    }
    setSchedules((prev) => {
      const next = {
        ...prev,
        [selectedShiftKey]: {
          ...prev[selectedShiftKey],
          assigned: editEmployeesList,
        },
      };
      saveSchedules(next);
      return next;
    });
    setActiveModal(null);
  };

  const handleConfirmSchedule = () => {
    confirmSchedule(schedules);
    setIsConfirmedState(true);
    setActiveModal(null);
  };

  const handleRunORTools = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setSchedules((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          const [sId] = key.split("_");
          const demand = shiftDemands.find((d) => d.id === sId) || shiftDemands[0];
          while (next[key].assigned.length < demand.total) {
            const missingRole =
              next[key].assigned.filter((e) => e.role === "Phục vụ").length < demand.phucVu
                ? "Phục vụ"
                : "Pha chế";
            const candidate =
              employeeRoster.find(
                (r) => r.role === missingRole && !next[key].assigned.some((a) => a.id === r.id)
              ) || employeeRoster[5];
            next[key].assigned = [...next[key].assigned, candidate];
          }
        });
        saveSchedules(next);
        return next;
      });

      setIsGenerating(false);
      setGenerationSuccess(true);
      setTimeout(() => {
        setGenerationSuccess(false);
        setActiveModal(null);
      }, 900);
    }, 1500);
  };

  const uniqueEmployeesCount = useMemo(() => {
    const s = new Set();
    Object.values(schedules).forEach((shift) => {
      shift.assigned?.forEach((e) => s.add(e.id));
    });
    return s.size || 26;
  }, [schedules]);

  const statItems = useMemo(
    () => [
      {
        key: "employees",
        icon: createElement(Users, { size: 18 }),
        color: "#3F62C4",
        label: "Nhân viên",
        value: String(employeeRoster.length),
        note: "Hồ sơ",
      },
      {
        key: "shifts",
        icon: createElement(Building, { size: 18 }),
        color: "#9333ea",
        label: "Ca làm việc",
        value: "21",
        note: "3 ca × 7 ngày",
      },
      {
        key: "days",
        icon: createElement(Calendar, { size: 18 }),
        color: "#0284c7",
        label: "Ngày",
        value: "7",
        note: "Thứ 2 – CN",
      },
      {
        key: "assigned",
        icon: createElement(Users, { size: 18 }),
        color: "#4f46e5",
        label: "Được phân công",
        value: uniqueEmployeesCount,
        note: "Nhân sự",
      },
      {
        key: "status",
        icon: createElement(Check, { size: 18 }),
        color: isConfirmedState ? "#16a34a" : "#059669",
        label: "Trạng thái",
        value: isConfirmedState ? "Đã xác nhận" : "Hoàn tất",
        note: isConfirmedState ? "Chính thức" : "Bản nháp",
      },
    ],
    [uniqueEmployeesCount, isConfirmedState]
  );

  return {
    activeModal,
    setActiveModal,
    constraints,
    days,
    shiftDemands,
    schedules,
    selectedShiftKey,
    isConfirmedState,
    statItems,
    editEmployeesList,
    showAddEmployeeDropdown,
    setShowAddEmployeeDropdown,
    weekendConfigured,
    isGenerating,
    generationSuccess,
    selectedInfo,
    uniqueEmployeesCount,
    employeeRoster,
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
  };
}
