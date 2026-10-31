// =============================================================================
// QUẢN LÝ DỮ LIỆU ĐƠN XIN NGHỈ (LEAVE & TIME-OFF MOCK STORE - US 2.16 - US 2.19)
// Đồng bộ 100% với danh sách 5 nhân viên chuẩn (NV001 - NV005), Dashboard (2 đơn chờ)
// =============================================================================

import { employeeRoster } from "./scheduleMockData";

const LEAVE_STORAGE_KEY = "SMART_SCHEDULING_LEAVE_DATA_V1";

export const initialLeaveRequests = [
  {
    id: "LV-2026-001",
    employeeId: "NV002",
    employeeName: "Trần Thị Bích",
    employeeRole: "Pha chế",
    roleTag: "Barista",
    shiftDate: "Thứ 6, 17/10/2026",
    isoDate: "2026-10-17",
    shiftId: "afternoon",
    shiftName: "Ca chiều",
    shiftTime: "12:00 - 17:00",
    leaveType: "emergency",
    leaveTypeName: "Nghỉ ốm đột xuất",
    reason: "Sốt cao và đau đầu sau ca làm tối qua, xin phép nghỉ đột xuất để đi khám tại bệnh viện.",
    status: "pending", // pending | approved | replacement_pending | replacement_confirmed | rejected
    createdAt: "15/10/2026 08:30",
    replacementId: null,
    replacementName: null,
    replacementRole: null,
    replacementAssignedAt: null,
    managerNote: "",
    openShiftCreated: false,
  },
  {
    id: "LV-2026-002",
    employeeId: "NV003",
    employeeName: "Lê Minh Cường",
    employeeRole: "Thu ngân",
    roleTag: "Cashier",
    shiftDate: "Thứ 7, 18/10/2026",
    isoDate: "2026-10-18",
    shiftId: "night",
    shiftName: "Ca tối",
    shiftTime: "17:00 - 22:00",
    leaveType: "emergency",
    leaveTypeName: "Việc gia đình khẩn cấp",
    reason: "Gia đình ở quê có việc đột xuất cần về xử lý gấp trong dịp cuối tuần.",
    status: "pending",
    createdAt: "15/10/2026 10:15",
    replacementId: null,
    replacementName: null,
    replacementRole: null,
    replacementAssignedAt: null,
    managerNote: "",
    openShiftCreated: false,
  },
  {
    id: "LV-2026-003",
    employeeId: "NV001",
    employeeName: "Nguyễn Văn An",
    employeeRole: "Quản lý ca / Phục vụ",
    roleTag: "Shift_Leader",
    shiftDate: "Thứ 2, 13/10/2026",
    isoDate: "2026-10-13",
    shiftId: "morning",
    shiftName: "Ca sáng",
    shiftTime: "06:00 - 12:00",
    leaveType: "planned",
    leaveTypeName: "Nghỉ phép cá nhân",
    reason: "Tham gia khám sức khỏe định kỳ và chuẩn bị hồ sơ tốt nghiệp đại học.",
    status: "replacement_confirmed",
    createdAt: "11/10/2026 14:00",
    replacementId: "NV005",
    replacementName: "Hoàng Văn Nam",
    replacementRole: "Thu ngân / Phụ tá",
    replacementAssignedAt: "11/10/2026 16:30",
    managerNote: "Đã duyệt và chọn Hoàng Văn Nam nhận ca thay thế. Đã xác nhận trên hệ thống.",
    openShiftCreated: false,
  },
  {
    id: "LV-2026-004",
    employeeId: "NV004",
    employeeName: "Phạm Thị Dung",
    employeeRole: "Pha chế",
    roleTag: "Barista",
    shiftDate: "Thứ 4, 15/10/2026",
    isoDate: "2026-10-15",
    shiftId: "morning",
    shiftName: "Ca sáng",
    shiftTime: "06:00 - 12:00",
    leaveType: "emergency",
    leaveTypeName: "Nghỉ ốm đột xuất",
    reason: "Bị ngộ độc thực phẩm nhẹ từ tối qua, cần nghỉ ngơi 1 buổi để hồi phục.",
    status: "approved",
    createdAt: "14/10/2026 21:00",
    replacementId: null,
    replacementName: null,
    replacementRole: null,
    replacementAssignedAt: null,
    managerNote: "Đã duyệt nghỉ. Đã tạo Ca trực mở (Open Shift) để các nhân viên khác nhận ca.",
    openShiftCreated: true,
  },
  {
    id: "LV-2026-005",
    employeeId: "NV005",
    employeeName: "Hoàng Văn Nam",
    employeeRole: "Thu ngân",
    roleTag: "Cashier",
    shiftDate: "Chủ nhật, 12/10/2026",
    isoDate: "2026-10-12",
    shiftId: "morning",
    shiftName: "Ca sáng",
    shiftTime: "06:00 - 12:00",
    leaveType: "planned",
    leaveTypeName: "Việc riêng",
    reason: "Bận lịch thi kết thúc học phần nhưng báo quá cận giờ bắt đầu ca.",
    status: "rejected",
    createdAt: "12/10/2026 05:45",
    replacementId: null,
    replacementName: null,
    replacementRole: null,
    replacementAssignedAt: null,
    managerNote: "Đơn gửi quá sát giờ bắt đầu ca (trước 15 phút) không kịp sắp xếp người thay thế. Vui lòng liên hệ trực tiếp Quản lý ca.",
    openShiftCreated: false,
  },
];

// Lấy danh sách đơn từ localStorage hoặc khởi tạo mặc định
export function getSavedLeaveRequests() {
  try {
    const raw = localStorage.getItem(LEAVE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LEAVE_STORAGE_KEY, JSON.stringify(initialLeaveRequests));
      return initialLeaveRequests;
    }
    return JSON.parse(raw);
  } catch {
    return initialLeaveRequests;
  }
}

// Lưu danh sách đơn vào localStorage
export function saveLeaveRequests(requests) {
  try {
    localStorage.setItem(LEAVE_STORAGE_KEY, JSON.stringify(requests));
  } catch (e) {
    console.error("Lỗi lưu localStorage đơn nghỉ:", e);
  }
}

// Lấy danh sách ứng viên AI gợi ý thay thế (US 2.18)
export function getAIReplacementCandidates(leaveRequest) {
  if (!leaveRequest) return [];

  // Lấy các nhân viên khác (không phải người xin nghỉ)
  // Bỏ người xin nghỉ và những người đã từ chối nhận ca thay cho đơn này
  const declined = leaveRequest.declinedIds ?? [];
  const candidates = employeeRoster.filter((e) => e.id !== leaveRequest.employeeId && !declined.includes(e.id));

  // Tính điểm phù hợp dựa trên Role_Tag, lịch rảnh và định mức giờ
  return candidates.map((cand) => {
    const sameRole = cand.roleTag === leaveRequest.roleTag;
    const isLeader = cand.roleTag === "Shift_Leader";
    
    // Giả lập điểm phù hợp dựa theo tiêu chí nghiệp vụ
    let matchScore = 75;
    const reasons = [];

    if (sameRole) {
      matchScore += 18;
      reasons.push(`Cùng vị trí chuyên môn: ${cand.role} (${cand.roleTag})`);
    } else if (isLeader) {
      matchScore += 12;
      reasons.push(`Quản lý ca có thể bao quát đa nhiệm vị trí ${leaveRequest.roleTag}`);
    } else {
      reasons.push(`Có kỹ năng hỗ trợ vị trí ${leaveRequest.roleTag}`);
    }

    reasons.push(`Đang rảnh khung giờ ${leaveRequest.shiftTime} ngày ${leaveRequest.shiftDate.split(", ")[1] || "này"}`);
    
    // Giờ làm tuần mẫu
    const currentHours = cand.id === "NV001" ? 32 : cand.id === "NV002" ? 30 : cand.id === "NV003" ? 22 : cand.id === "NV004" ? 24 : 20;
    const maxHours = 40;
    const remaining = maxHours - currentHours;

    if (remaining >= 5) {
      matchScore += 5;
      reasons.push(`Giờ làm tuần: ${currentHours}h/${maxHours}h (còn ${remaining}h định mức, không vượt trần)`);
    } else {
      reasons.push(`Giờ làm tuần: ${currentHours}h/${maxHours}h`);
    }

    reasons.push(`Đạt tiêu chuẩn thời gian nghỉ giữa 2 ca liên tiếp (> 14 giờ)`);

    return {
      id: cand.id,
      name: cand.name,
      role: cand.role,
      roleTag: cand.roleTag,
      avatar: cand.avatar,
      contract: cand.contract,
      phone: cand.phone,
      matchScore: Math.min(99, matchScore),
      reasons,
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}