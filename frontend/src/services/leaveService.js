import httpClient from "./httpClient";
import {
  getSavedLeaveRequests,
  saveLeaveRequests,
  getAIReplacementCandidates,
  initialLeaveRequests,
} from "../mocks/leaveMockData";

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

// FR08 - Quản lý đơn xin nghỉ (Manager & Staff)
//
// Vòng đời của một đơn:
//
//   pending ──duyệt──▶ approved ──gửi đề nghị──▶ replacement_pending ──người thay nhận──▶ replacement_confirmed
//      │                  │  ▲                          │
//      │                  │  └──người thay từ chối / đổi người──┘
//      │                  └──tạo ca trực mở (vẫn là approved, openShiftCreated = true)
//      └──từ chối──▶ rejected   (kết thúc, không bố trí người thay nữa)
//
// Mỗi thao tác chỉ hợp lệ ở một số trạng thái nhất định (bảng ALLOWED bên dưới).

const ALLOWED = {
  approve: ["pending"],
  reject: ["pending"],
  requestReplacement: ["approved"],
  respond: ["replacement_pending"],
  cancelRequest: ["replacement_pending"],
  openShift: ["approved"],
};

const NO_REPLACEMENT = {
  replacementId: null,
  replacementName: null,
  replacementRole: null,
  replacementRequestedAt: null,
  replacementAssignedAt: null,
};

const now = () => `${new Date().toLocaleDateString("vi-VN")} ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;

// Lỗi nghiệp vụ: giao diện hiển thị nguyên văn câu này cho người dùng.
const businessError = (message) => Object.assign(new Error(message), { business: true });

// Kiểm tra đơn có đang ở trạng thái cho phép thao tác không, rồi ghi thay đổi và trả về đơn mới.
function transition(id, action, patch) {
  const list = getSavedLeaveRequests();
  const req = list.find((r) => r.id === id);
  if (!req) throw businessError("Không tìm thấy đơn xin nghỉ.");
  if (!ALLOWED[action].includes(req.status)) {
    throw businessError(
      req.status === "rejected"
        ? "Đơn này đã bị từ chối nên không thể xử lý tiếp."
        : "Trạng thái đơn đã thay đổi, vui lòng tải lại danh sách."
    );
  }
  const next = { ...req, ...patch(req) };
  saveLeaveRequests(list.map((r) => (r.id === id ? next : r)));
  return next;
}

export async function getLeaveRequests(params) {
  if (USE_MOCK) {
    let list = getSavedLeaveRequests();
    if (params?.status && params.status !== "all") list = list.filter((r) => r.status === params.status);
    if (params?.employeeId && params.employeeId !== "all") list = list.filter((r) => r.employeeId === params.employeeId);
    return list;
  }
  const res = await httpClient.get("/leave", { params });
  return res.data;
}

export async function submitLeave(data) {
  if (USE_MOCK) {
    const list = getSavedLeaveRequests();
    const newReq = {
      id: `LV-2026-${String(list.length + 1).padStart(3, "0")}`,
      status: "pending",
      createdAt: now(),
      managerNote: "",
      openShiftCreated: false,
      declinedIds: [],
      ...NO_REPLACEMENT,
      ...data,
    };
    saveLeaveRequests([newReq, ...list]);
    return newReq;
  }
  const res = await httpClient.post("/leave", data);
  return res.data;
}

export async function getReplacementSuggestions(id) {
  if (USE_MOCK) {
    const item = getSavedLeaveRequests().find((r) => r.id === id);
    if (!item) throw businessError("Không tìm thấy đơn xin nghỉ.");
    return getAIReplacementCandidates(item);
  }
  const res = await httpClient.get(`/leave/${id}/suggestions`);
  return res.data;
}

// Quản lý duyệt đơn: pending -> approved
export async function approveLeave(id, managerNote = "") {
  if (USE_MOCK) return transition(id, "approve", () => ({ status: "approved", managerNote: managerNote || "Đã duyệt đơn nghỉ." }));
  const res = await httpClient.post(`/leave/${id}/approve`, { managerNote });
  return res.data;
}

// Quản lý từ chối đơn: pending -> rejected. Bắt buộc có lý do để báo cho nhân viên.
export async function rejectLeave(id, managerNote = "") {
  if (!managerNote.trim()) throw businessError("Vui lòng nhập lý do từ chối.");
  if (USE_MOCK) return transition(id, "reject", () => ({ status: "rejected", managerNote: managerNote.trim() }));
  const res = await httpClient.post(`/leave/${id}/reject`, { managerNote });
  return res.data;
}

// Quản lý chọn người thay: approved -> replacement_pending.
// Mới chỉ là gửi đề nghị; chưa tính là có người thay cho tới khi người đó nhận ca.
export async function requestReplacement(id, { replacementId, replacementName, replacementRole }) {
  if (USE_MOCK) {
    return transition(id, "requestReplacement", (r) => {
      if (r.openShiftCreated) throw businessError("Ca trực mở đã được đăng, không thể chỉ định người thay trực tiếp.");
      return {
        status: "replacement_pending",
        replacementId,
        replacementName,
        replacementRole,
        replacementRequestedAt: now(),
        replacementAssignedAt: null,
        managerNote: `Đã gửi đề nghị nhận ca cho ${replacementName}, đang chờ xác nhận.`,
      };
    });
  }
  const res = await httpClient.post(`/leave/${id}/replacement`, { replacementId });
  return res.data;
}

// Người thay phản hồi đề nghị.
//   nhận ca   -> replacement_confirmed
//   từ chối   -> quay lại approved, ghi nhớ để không gợi ý lại người này cho đơn này
export async function respondReplacement(id, accepted) {
  if (USE_MOCK) {
    return transition(id, "respond", (r) =>
      accepted
        ? { status: "replacement_confirmed", replacementAssignedAt: now(), managerNote: `${r.replacementName} đã xác nhận nhận ca thay.` }
        : {
            status: "approved",
            ...NO_REPLACEMENT,
            declinedIds: [...(r.declinedIds ?? []), r.replacementId],
            managerNote: `${r.replacementName} từ chối nhận ca. Hãy chọn người khác hoặc tạo ca trực mở.`,
          }
    );
  }
  const res = await httpClient.post(`/leave/${id}/replacement/respond`, { accepted });
  return res.data;
}

// Quản lý rút đề nghị để đổi người: replacement_pending -> approved
export async function cancelReplacementRequest(id) {
  if (USE_MOCK) {
    return transition(id, "cancelRequest", (r) => ({
      status: "approved",
      ...NO_REPLACEMENT,
      managerNote: `Đã rút đề nghị gửi cho ${r.replacementName}.`,
    }));
  }
  const res = await httpClient.post(`/leave/${id}/replacement/cancel`);
  return res.data;
}

// Đăng ca trực mở để cả đội cùng nhận: chỉ khi đơn đã duyệt và chưa có đề nghị nào đang chờ.
export async function createOpenShiftFromLeave(id) {
  if (USE_MOCK) {
    return transition(id, "openShift", (r) => ({
      openShiftCreated: true,
      managerNote: `${r.managerNote ? `${r.managerNote} ` : ""}Đã đăng ca trực mở cho cả đội.`,
    }));
  }
  const res = await httpClient.post(`/leave/${id}/open-shift`);
  return res.data;
}

export function resetMockLeaveData() {
  saveLeaveRequests(initialLeaveRequests);
  return initialLeaveRequests;
}