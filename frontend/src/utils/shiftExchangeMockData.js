// =============================================================================
// QUẢN LÝ DỮ LIỆU ĐỔI CA (SHIFT EXCHANGE MOCK STORE - US 2.13)
// Đồng bộ với 5 nhân viên chuẩn (NV001 - NV005) và Lịch làm việc tuần
// =============================================================================

import {
  getEmployeeById,
  getSavedSchedules,
  saveSchedules,
} from "../mocks/scheduleMockData";

const EXCHANGE_STORAGE_KEY = "SMART_SCHEDULING_SHIFT_EXCHANGE_DATA";

// Danh sách yêu cầu đổi ca mẫu ban đầu (khớp 100% với Dashboard stats: 1 chờ duyệt)
export const initialExchangeRequests = [
  {
    id: "EX-2026-001",
    // Người yêu cầu: NV002 (Trần Thị Bích - Pha chế)
    requesterId: "NV002",
    requesterName: "Trần Thị Bích",
    requesterRole: "Pha chế",
    requesterRoleTag: "Barista",
    requesterShift: {
      date: "Thứ 6, 17/10/2026",
      dayId: "T6",
      shiftId: "afternoon",
      shiftName: "Ca chiều",
      time: "12:00 - 17:00",
    },
    // Người nhận đổi: NV004 (Phạm Thị Dung - Cùng kỹ năng Barista)
    targetEmployeeId: "NV004",
    targetEmployeeName: "Phạm Thị Dung",
    targetEmployeeRole: "Pha chế",
    targetEmployeeRoleTag: "Barista",
    targetShift: {
      date: "Thứ 6, 17/10/2026",
      dayId: "T6",
      shiftId: "morning",
      shiftName: "Ca sáng",
      time: "06:00 - 12:00",
    },
    exchangeType: "swap", // 'swap' (Đổi ca qua lại) hoặc 'cover' (Nhờ làm thay)
    reason: "Bận lịch học thêm kỹ năng pha chế vào buổi chiều thứ 6.",
    status: "pending_manager", // Đồng nghiệp đã đồng ý, đang chờ Quản lý duyệt
    createdAt: "12/10/2026 09:30",
    peerRespondedAt: "12/10/2026 10:15",
    managerNote: "",
  },
  {
    id: "EX-2026-002",
    // Người yêu cầu: NV003 (Lê Minh Cường - Thu ngân)
    requesterId: "NV003",
    requesterName: "Lê Minh Cường",
    requesterRole: "Thu ngân",
    requesterRoleTag: "Cashier",
    requesterShift: {
      date: "Thứ 3, 14/10/2026",
      dayId: "T3",
      shiftId: "morning",
      shiftName: "Ca sáng",
      time: "06:00 - 12:00",
    },
    // Người nhận: NV005 (Hoàng Văn Nam - Cùng kỹ năng Cashier)
    targetEmployeeId: "NV005",
    targetEmployeeName: "Hoàng Văn Nam",
    targetEmployeeRole: "Thu ngân",
    targetEmployeeRoleTag: "Cashier",
    targetShift: null, // Nhờ làm thay (Cover)
    exchangeType: "cover",
    reason: "Bận thi kết thúc học phần tại trường đại học sáng thứ 3.",
    status: "pending_peer", // Đang chờ đồng nghiệp NV005 phản hồi
    createdAt: "12/10/2026 11:00",
    peerRespondedAt: null,
    managerNote: "",
  },
  {
    id: "EX-2026-003",
    // Đã duyệt thành công tuần trước
    requesterId: "NV004",
    requesterName: "Phạm Thị Dung",
    requesterRole: "Pha chế",
    requesterRoleTag: "Barista",
    requesterShift: {
      date: "Thứ 2, 13/10/2026",
      dayId: "T2",
      shiftId: "evening",
      shiftName: "Ca tối",
      time: "17:00 - 22:00",
    },
    targetEmployeeId: "NV002",
    targetEmployeeName: "Trần Thị Bích",
    targetEmployeeRole: "Pha chế",
    targetEmployeeRoleTag: "Barista",
    targetShift: {
      date: "Thứ 2, 13/10/2026",
      dayId: "T2",
      shiftId: "afternoon",
      shiftName: "Ca chiều",
      time: "12:00 - 17:00",
    },
    exchangeType: "swap",
    reason: "Có hẹn khám nha khoa buổi tối.",
    status: "approved",
    createdAt: "10/10/2026 14:20",
    peerRespondedAt: "10/10/2026 15:00",
    managerRespondedAt: "10/10/2026 16:30",
    managerNote: "Đồng ý phê duyệt, cả hai nhân viên đã xác nhận.",
  },
  {
    id: "EX-2026-004",
    // Yêu cầu bị từ chối
    requesterId: "NV001",
    requesterName: "Nguyễn Văn An",
    requesterRole: "Phục vụ",
    requesterRoleTag: "Shift_Leader",
    requesterShift: {
      date: "Thứ 7, 18/10/2026",
      dayId: "T7",
      shiftId: "evening",
      shiftName: "Ca tối",
      time: "17:00 - 22:00",
    },
    targetEmployeeId: "NV003",
    targetEmployeeName: "Lê Minh Cường",
    targetEmployeeRole: "Thu ngân",
    targetEmployeeRoleTag: "Cashier",
    targetShift: null,
    exchangeType: "cover",
    reason: "Việc cá nhân cuối tuần.",
    status: "rejected",
    createdAt: "09/10/2026 08:00",
    peerRespondedAt: null,
    managerRespondedAt: "09/10/2026 09:10",
    rejectReason: "Khác kỹ năng chuyên môn (Phục vụ không thể nhờ Thu ngân trực thay ca Leader).",
  },
];

// Lấy danh sách yêu cầu từ localStorage
export const getExchangeRequests = () => {
  try {
    const raw = localStorage.getItem(EXCHANGE_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Lỗi khi đọc exchange requests:", err);
  }
  return initialExchangeRequests;
};

// Lưu danh sách yêu cầu
export const saveExchangeRequests = (requests) => {
  try {
    localStorage.setItem(EXCHANGE_STORAGE_KEY, JSON.stringify(requests));
  } catch (err) {
    console.error("Lỗi khi lưu exchange requests:", err);
  }
};

// Tạo yêu cầu đổi ca mới (Dành cho Staff)
export const createExchangeRequest = ({
  requesterId,
  requesterShift,
  targetEmployeeId,
  targetShift = null,
  exchangeType = "swap",
  reason = "",
}) => {
  const requester = getEmployeeById(requesterId);
  const target = getEmployeeById(targetEmployeeId);

  if (!requester || !target) {
    throw new Error("Không tìm thấy thông tin nhân viên!");
  }

  // Kiểm tra ràng buộc kỹ năng (Role_Tag) theo US 2.13
  if (requester.role !== target.role) {
    throw new Error(
      `Không thể đổi ca khác chuyên môn! Bạn là "${requester.role}", đồng nghiệp là "${target.role}".`
    );
  }

  const newId = `EX-2026-${String(Math.floor(100 + Math.random() * 900))}`;
  const now = new Date();
  const timeStr = `${String(now.getDate()).padStart(2, "0")}/${String(
    now.getMonth() + 1
  ).padStart(2, "0")}/${now.getFullYear()} ${String(now.getHours()).padStart(
    2,
    "0"
  )}:${String(now.getMinutes()).padStart(2, "0")}`;

  const newReq = {
    id: newId,
    requesterId: requester.id,
    requesterName: requester.name,
    requesterRole: requester.role,
    requesterRoleTag: requester.roleTag,
    requesterShift,
    targetEmployeeId: target.id,
    targetEmployeeName: target.name,
    targetEmployeeRole: target.role,
    targetEmployeeRoleTag: target.roleTag,
    targetShift,
    exchangeType,
    reason,
    status: "pending_peer", // Chờ đồng nghiệp xác nhận
    createdAt: timeStr,
    peerRespondedAt: null,
    managerNote: "",
  };

  const requests = getExchangeRequests();
  const updated = [newReq, ...requests];
  saveExchangeRequests(updated);
  return newReq;
};

// Đồng nghiệp phản hồi yêu cầu (Chấp nhận hoặc Từ chối)
export const peerRespondExchange = (requestId, { accepted, rejectReason = "" }) => {
  const requests = getExchangeRequests();
  const now = new Date();
  const timeStr = `${String(now.getDate()).padStart(2, "0")}/${String(
    now.getMonth() + 1
  ).padStart(2, "0")}/${now.getFullYear()} ${String(now.getHours()).padStart(
    2,
    "0"
  )}:${String(now.getMinutes()).padStart(2, "0")}`;

  const updated = requests.map((req) => {
    if (req.id !== requestId) return req;

    if (accepted) {
      return {
        ...req,
        status: "pending_manager", // Chuyển cho Quản lý duyệt
        peerRespondedAt: timeStr,
      };
    } else {
      return {
        ...req,
        status: "rejected",
        peerRespondedAt: timeStr,
        rejectReason: rejectReason || "Đồng nghiệp từ chối đổi ca.",
      };
    }
  });

  saveExchangeRequests(updated);
  return updated.find((r) => r.id === requestId);
};

// Quản lý phê duyệt yêu cầu đổi ca
export const managerApproveExchange = (requestId, managerNote = "") => {
  const requests = getExchangeRequests();
  const now = new Date();
  const timeStr = `${String(now.getDate()).padStart(2, "0")}/${String(
    now.getMonth() + 1
  ).padStart(2, "0")}/${now.getFullYear()} ${String(now.getHours()).padStart(
    2,
    "0"
  )}:${String(now.getMinutes()).padStart(2, "0")}`;

  const targetReq = requests.find((r) => r.id === requestId);
  if (!targetReq) throw new Error("Không tìm thấy yêu cầu đổi ca!");

  // Cập nhật trạng thái yêu cầu
  const updated = requests.map((req) => {
    if (req.id !== requestId) return req;
    return {
      ...req,
      status: "approved",
      managerRespondedAt: timeStr,
      managerNote: managerNote || "Quản lý đã phê duyệt thành công.",
    };
  });
  saveExchangeRequests(updated);

  // Đồng bộ hoán đổi trực tiếp trong Lịch tuần (schedules)
  try {
    const schedules = getSavedSchedules();
    const { requesterId, targetEmployeeId, requesterShift, targetShift, exchangeType } = targetReq;

    if (requesterShift?.dayId && requesterShift?.shiftId) {
      const shiftKey1 = `${requesterShift.shiftId}_${requesterShift.dayId}`;
      const shift1 = schedules[shiftKey1];

      if (shift1) {
        const emp1 = getEmployeeById(requesterId);
        const emp2 = getEmployeeById(targetEmployeeId);

        if (exchangeType === "swap" && targetShift?.dayId && targetShift?.shiftId) {
          const shiftKey2 = `${targetShift.shiftId}_${targetShift.dayId}`;
          const shift2 = schedules[shiftKey2];

          if (shift2) {
            // Đổi chỗ emp1 và emp2 giữa 2 ca
            shift1.assigned = shift1.assigned.filter((e) => e.id !== requesterId);
            if (emp2 && !shift1.assigned.some((e) => e.id === targetEmployeeId)) {
              shift1.assigned.push(emp2);
            }

            shift2.assigned = shift2.assigned.filter((e) => e.id !== targetEmployeeId);
            if (emp1 && !shift2.assigned.some((e) => e.id === requesterId)) {
              shift2.assigned.push(emp1);
            }
          }
        } else {
          // Làm thay (Cover): thay emp1 bằng emp2
          shift1.assigned = shift1.assigned.filter((e) => e.id !== requesterId);
          if (emp2 && !shift1.assigned.some((e) => e.id === targetEmployeeId)) {
            shift1.assigned.push(emp2);
          }
        }
        saveSchedules(schedules);
      }
    }
  } catch (err) {
    console.error("Lỗi khi cập nhật lịch làm sau khi đổi ca:", err);
  }

  return updated.find((r) => r.id === requestId);
};

// Quản lý từ chối yêu cầu đổi ca
export const managerRejectExchange = (requestId, reason = "") => {
  const requests = getExchangeRequests();
  const now = new Date();
  const timeStr = `${String(now.getDate()).padStart(2, "0")}/${String(
    now.getMonth() + 1
  ).padStart(2, "0")}/${now.getFullYear()} ${String(now.getHours()).padStart(
    2,
    "0"
  )}:${String(now.getMinutes()).padStart(2, "0")}`;

  const updated = requests.map((req) => {
    if (req.id !== requestId) return req;
    return {
      ...req,
      status: "rejected",
      managerRespondedAt: timeStr,
      rejectReason: reason || "Quản lý từ chối yêu cầu đổi ca.",
    };
  });

  saveExchangeRequests(updated);
  return updated.find((r) => r.id === requestId);
};

// Người gửi hủy yêu cầu (khi chưa được Manager duyệt)
export const cancelExchangeRequest = (requestId) => {
  const requests = getExchangeRequests();
  const updated = requests.map((req) => {
    if (req.id !== requestId) return req;
    if (req.status === "approved") {
      throw new Error("Không thể hủy yêu cầu đã được Quản lý duyệt!");
    }
    return {
      ...req,
      status: "cancelled",
    };
  });

  saveExchangeRequests(updated);
  return updated.find((r) => r.id === requestId);
};
