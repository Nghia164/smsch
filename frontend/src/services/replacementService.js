// Gợi ý người thay thế bằng AI (US18 / FR08).
// Backend lọc ứng viên theo ràng buộc (rảnh, đúng Role_Tag, giới hạn giờ tuần, thời gian nghỉ, không trùng ca, đang Active),
// sau đó AI chấm điểm và giải thích. AI chỉ gợi ý, Manager chọn.
//   GET  /api/leave-requests/:id/replacement-suggestions        -> [{ id, name, roleTag, score, reasons: [] }]  (tối đa 5, điểm giảm dần)
//   POST /api/leave-requests/:id/replacement  { candidateId }   -> xác nhận người thay (cập nhật lịch, gửi thông báo)
import { apiFetch } from "./assistantService";

const IS_MOCK = true; // đổi thành false khi backend đã sẵn sàng
const TIMEOUT_MS = 8000; // mục tiêu trả về trong 5 giây, chờ tối đa 8 giây rồi báo lỗi

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const withTimeout = (promise) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS))]);

// ---------- Dữ liệu giả ----------
// Để thử các trạng thái: mã yêu cầu kết thúc bằng "-empty" (không có ứng viên) hoặc "-error" (lỗi).
const MOCK_CANDIDATES = [
  { id: "NV003", name: "Lê Minh Cường", roleTag: "Barista", score: 92, reasons: ["Rảnh ca này", "Đúng Role_Tag", "Giờ tuần hiện tại 24/40", "Đủ thời gian nghỉ"] },
  { id: "NV005", name: "Hoàng Văn Nam", roleTag: "Barista", score: 85, reasons: ["Rảnh ca này", "Đúng Role_Tag", "Giờ tuần hiện tại 32/40", "Đủ thời gian nghỉ"] },
  { id: "NV004", name: "Phạm Thị Dung", roleTag: "Barista", score: 71, reasons: ["Rảnh ca này", "Đúng Role_Tag", "Giờ tuần hiện tại 36/40", "Nghỉ vừa đủ tối thiểu"] },
];

async function mockSuggest(requestId) {
  await wait(900);
  if (String(requestId).endsWith("-error")) throw new Error("unavailable");
  return String(requestId).endsWith("-empty") ? [] : MOCK_CANDIDATES;
}

// ---------- Hàm cho giao diện dùng ----------
export function getReplacementSuggestions(requestId) {
  const real = async () => {
    const res = await apiFetch(`/api/leave-requests/${requestId}/replacement-suggestions`);
    if (!res.ok) throw new Error("unavailable");
    return res.json();
  };
  return withTimeout(IS_MOCK ? mockSuggest(requestId) : real());
}

export async function confirmReplacement(requestId, candidateId) {
  if (IS_MOCK) {
    await wait(500);
    return { status: "Replacement Confirmed" };
  }
  const res = await apiFetch(`/api/leave-requests/${requestId}/replacement`, { method: "POST", body: JSON.stringify({ candidateId }) });
  if (!res.ok) throw new Error("unavailable");
  return res.json();
}