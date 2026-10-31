// Dịch vụ gọi Trợ lý AI (FR13 / US24).
// Frontend KHÔNG gọi thẳng LLM (sẽ lộ API key). Frontend chỉ gọi backend: POST /api/assistant/chat.
// Backend mới là nơi lấy dữ liệu, ẩn danh, gọi LLM rồi trả câu trả lời về.

export const IS_MOCK = true; // đổi thành false khi backend đã sẵn sàng
const TIMEOUT_MS = 20000; // quá 20 giây coi như AI bị chậm (NFR06)

// Đường dẫn các màn hình để AI hướng dẫn Manager (lấy từ menu ManagerLayout)
export const ROUTES = {
  dashboard: "/manager/dashboard",
  schedule: "/manager/schedule",
  openShifts: "/manager/open-shifts",
  leave: "/manager/leave",
  attendance: "/manager/attendance",
  hours: "/manager/work-hours",
  payroll: "/manager/payroll",
  reports: "/manager/reports",
};

export class AssistantError extends Error {
  constructor(code) {
    super(code);
    this.code = code; // "timeout" | "rate_limit" | "unavailable"
  }
}

// Biến câu trả lời thành văn bản thuần để gửi kèm làm lịch sử hội thoại
const blockText = (b) =>
  b.type === "text" ? b.text
  : b.type === "list" ? b.items.join("; ")
  : b.type === "insight" ? `${b.title ?? "Nhận xét"}: ${b.text}`
  : b.type === "stats" || b.type === "bars" ? b.items.map((i) => `${i.label} ${i.display ?? i.value}`).join(", ")
  : "";
export const blocksToText = (blocks = []) => blocks.map(blockText).filter(Boolean).join(" ");

// ---------- Gọi backend thật ----------
// Backend (LLM) trả về JSON gồm các khối để giao diện vẽ:
//   { blocks: [ text | list | table | stats | bars | insight | actions | source ], suggestions?: ["..."] }
// Xem MessageBubble.jsx để biết dạng của từng khối.
export const apiFetch = (path, options = {}) =>
  fetch(`${import.meta.env.VITE_API_URL ?? ""}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`, // thay bằng cách lấy token của dự án
    },
  });

async function callBackend(question, history, signal) {
  const res = await apiFetch("/api/assistant/chat", { method: "POST", body: JSON.stringify({ question, history }), signal });
  if (res.status === 429) throw new AssistantError("rate_limit");
  if (!res.ok) throw new AssistantError("unavailable");
  return res.json();
}

// ---------- Dữ liệu giả để làm giao diện khi chưa có backend ----------
const wait = (ms, signal) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

async function mockReply(question, signal) {
  const q = question.toLowerCase();
  const has = (...words) => words.some((w) => q.includes(w)); // nhận cả tiếng Việt và tiếng Anh
  await wait(has("test chậm") ? 60000 : 1400 + Math.random() * 600, signal);

  if (has("test lỗi")) throw new AssistantError("unavailable");

  if (has("giờ ra", "check-out", "checkout"))
    return { blocks: [
      { type: "text", text: "Có 2 ca đang thiếu giờ ra nên chưa được tính giờ làm:" },
      { type: "table", columns: ["Nhân viên", "Ca", "Ngày"], rows: [["Nguyễn Văn An", "Sáng", "Hôm qua"], ["Trần Thị Bích", "Tối", "Thứ Ba"]] },
      { type: "insight", tone: "warn", title: "Cần xử lý trước khi chốt lương", text: "Nếu không nhập giờ ra, hai nhân viên này sẽ bị tính thiếu khoảng 8 giờ làm trong kỳ lương." },
      { type: "actions", items: [{ label: "Mở Chấm công để nhập giờ ra", to: ROUTES.attendance }] },
      { type: "source", text: "Nguồn: Chấm công 12/10 – 17/10/2026" },
    ] };

  if (has("tóm tắt", "summary"))
    return { blocks: [
      { type: "text", text: "Tuần này nhìn chung ổn định, có 3 việc cần bạn chú ý." },
      { type: "stats", items: [
        { label: "Lấp đầy ca", value: "92%", note: "▲ 3% so với tuần trước", tone: "good" },
        { label: "Đi trễ", value: "8%", note: "▼ 2% so với tuần trước", tone: "good" },
        { label: "Vắng", value: "3%", note: "▲ 1% so với tuần trước", tone: "bad" },
        { label: "Giờ thực tế", value: "412h", note: "trên 420h theo lịch" },
      ] },
      { type: "insight", tone: "warn", title: "Cần chú ý", text: "Ca Sáng thứ Ba còn thiếu 1 Pha chế, 2 đơn nghỉ đang chờ duyệt và 2 ca thiếu giờ ra chưa được tính lương." },
      { type: "insight", tone: "info", title: "Gợi ý thứ tự xử lý", text: "Duyệt đơn nghỉ trước, sau đó chọn người thay hoặc tạo Open Shift cho ca thiếu. Quyết định thuộc về bạn." },
      { type: "actions", items: [
        { label: "Xem Báo cáo và xuất PDF", to: ROUTES.reports },
        { label: "Đơn xin nghỉ", to: ROUTES.leave },
        { label: "Ca trực mở", to: ROUTES.openShifts },
      ] },
      { type: "source", text: "Nguồn: lịch Official, chấm công, đơn nghỉ tuần 12/10 – 18/10/2026" },
    ] };

  // Người thay thế: AI chỉ gợi ý, việc chọn người nằm ở màn hình Yêu cầu nghỉ (US18)
  if (has("thay", "replace"))
    return { blocks: [
      { type: "text", text: "Các ứng viên có thể thay ca Sáng thứ Ba của Nguyễn Văn An, xếp theo điểm phù hợp:" },
      { type: "table", columns: ["Ứng viên", "Vai trò", "Độ phù hợp", "Lý do"], rows: [
        ["Lê Minh Cường", "Pha chế", "92%", "Rảnh, đúng Role_Tag, giờ tuần 24/40"],
        ["Hoàng Văn Nam", "Pha chế", "85%", "Rảnh, đúng Role_Tag, giờ tuần 32/40"],
        ["Phạm Thị Dung", "Pha chế", "71%", "Rảnh, đúng Role_Tag, nghỉ vừa đủ"],
      ] },
      { type: "insight", tone: "info", title: "Nhận xét", text: "Lê Minh Cường phù hợp nhất vì còn dư 16 giờ trong tuần. Hoàng Văn Nam cũng ổn nhưng sát giới hạn giờ hơn." },
      { type: "text", text: "Mình chỉ gợi ý. Bạn chọn người thay trong chi tiết yêu cầu nghỉ." },
      { type: "actions", items: [{ label: "Mở Đơn xin nghỉ để chọn người thay", to: ROUTES.leave }] },
      { type: "source", text: "Nguồn: lịch rảnh, Role_Tag và giờ làm tuần này" },
    ] };

  if (has("giờ làm", "work hours", "hours report"))
    return { blocks: [
      { type: "stats", items: [
        { label: "Giờ theo lịch", value: "104h" },
        { label: "Giờ thực tế", value: "101h", note: "97% so với lịch" },
        { label: "Chênh lệch", value: "-3h", note: "Thiếu giờ làm", tone: "bad" },
      ] },
      { type: "table", columns: ["Nhân viên", "Giờ lịch", "Giờ thực tế", "Chênh lệch"], rows: [["Nguyễn Văn An", "40h", "41h", "+1h"], ["Trần Thị Bích", "40h", "38h", "-2h"], ["Lê Minh Cường", "24h", "22h", "-2h"]] },
      { type: "insight", tone: "info", title: "Nhận xét", text: "Tổng giờ thực tế đạt 97% so với lịch. Hai người làm thiếu 2 giờ là Trần Thị Bích và Lê Minh Cường, có thể do đi trễ hoặc về sớm." },
      { type: "actions", items: [{ label: "Mở Giờ làm để xem chi tiết và xuất báo cáo", to: ROUTES.hours }] },
      { type: "source", text: "Nguồn: Tổng hợp giờ làm tuần 12/10 – 18/10/2026" },
    ] };

  if (has("thiếu", "understaffed", "short"))
    return { blocks: [
      { type: "text", text: "Tuần này có 1 ca chưa đủ người so với nhu cầu." },
      { type: "bars", title: "Mức lấp đầy các ca", items: [
        { label: "Sáng thứ Ba (Pha chế)", value: 50, display: "1/2 người", color: "#f59e0b" },
        { label: "Chiều thứ Tư", value: 100, display: "3/3 người", color: "#10b981" },
        { label: "Tối thứ Sáu", value: 100, display: "2/2 người", color: "#10b981" },
      ] },
      { type: "insight", tone: "warn", title: "Ca thiếu người", text: "Ca Sáng thứ Ba cần 2 Pha chế nhưng mới có 1. Hiện còn 2 Pha chế rảnh ca này nhưng chưa được xếp." },
      { type: "insight", tone: "info", title: "Gợi ý", text: "Tạo Open Shift để nhân viên đăng ký, hoặc chạy lại xếp lịch sau khi nới ràng buộc. Quyết định thuộc về bạn." },
      { type: "actions", items: [{ label: "Tạo Open Shift", to: ROUTES.openShifts }, { label: "Mở Lịch làm việc", to: ROUTES.schedule }] },
      { type: "source", text: "Nguồn: lịch Official và nhu cầu nhân sự tuần 12/10 – 18/10/2026" },
    ] };

  if (has("trễ", "late"))
    return { blocks: [
      { type: "bars", title: "Số lần đi trễ trong tháng này", max: 4, items: [
        { label: "Lê Minh Cường", value: 4, display: "4 lần • 38 phút", color: "#f59e0b" },
        { label: "Hoàng Văn Nam", value: 2, display: "2 lần • 17 phút", color: "#f59e0b" },
        { label: "Phạm Thị Dung", value: 1, display: "1 lần • 5 phút", color: "#f59e0b" },
      ] },
      { type: "insight", tone: "warn", title: "Nhận xét", text: "Lê Minh Cường chiếm 57% số lần đi trễ (4/7), cả 4 lần đều ở ca Sáng. Có thể ca Sáng chưa phù hợp với bạn này." },
      { type: "insight", tone: "info", title: "Gợi ý", text: "Cân nhắc trao đổi trực tiếp hoặc xem lại lịch rảnh của nhân viên này trước khi xếp ca Sáng tiếp theo." },
      { type: "actions", items: [{ label: "Mở Chấm công", to: ROUTES.attendance }] },
      { type: "source", text: "Nguồn: Chấm công 01/10 – 17/10/2026" },
    ] };

  if (has("vượt", "overtime", "exceed"))
    return { blocks: [
      { type: "bars", title: "Giờ làm tuần này (giới hạn 40h)", max: 40, items: [
        { label: "Nguyễn Văn An", value: 38, display: "38/40h", color: "#f59e0b" },
        { label: "Trần Thị Bích", value: 32, display: "32/40h", color: "#10b981" },
        { label: "Lê Minh Cường", value: 24, display: "24/40h", color: "#10b981" },
      ] },
      { type: "insight", tone: "good", title: "Nhận xét", text: "Không ai vượt giới hạn 40h/tuần. Nguyễn Văn An sát ngưỡng nhất (38/40h), nên tránh xếp thêm ca cho bạn này." },
      { type: "source", text: "Nguồn: lịch Official tuần 12/10 – 18/10/2026" },
    ] };

  if (has("lương", "salary", "payroll"))
    return { blocks: [
      { type: "stats", items: [
        { label: "Tổng lương tạm tính", value: "24.350.000đ" },
        { label: "Nhân viên", value: "5" },
        { label: "Tổng giờ làm", value: "377,5h" },
      ] },
      { type: "table", columns: ["Nhân viên", "Giờ làm", "Tạm tính"], rows: [["Nguyễn Văn An", "96h", "6.240.000đ"], ["Trần Thị Bích", "92h", "6.440.000đ"], ["Phạm Thị Dung", "70h", "4.200.000đ"], ["Lê Minh Cường", "60h", "3.900.000đ"], ["Hoàng Văn Nam", "59,5h", "3.570.000đ"]] },
      { type: "insight", tone: "warn", title: "Lưu ý", text: "Đây là số tạm tính theo chấm công đã đối soát. 2 ca đang thiếu giờ ra chưa được tính, bạn nên chỉnh trước khi chốt kỳ lương." },
      { type: "actions", items: [{ label: "Mở Tính lương để xuất PDF", to: ROUTES.payroll }, { label: "Mở Chấm công", to: ROUTES.attendance }] },
      { type: "source", text: "Nguồn: Bảng lương tháng 10/2026 (tạm tính)" },
    ] };

  if (has("nghỉ", "leave", "day off"))
    return { blocks: [
      { type: "text", text: "Tuần này có 2 nhân viên nghỉ:" },
      { type: "table", columns: ["Nhân viên", "Vai trò", "Thời gian", "Người thay"], rows: [["Phạm Thị Dung", "Pha chế", "Thứ Hai – Thứ Tư", "Đã có"], ["Lê Minh Cường", "Phục vụ", "Thứ Sáu", "Chưa có"]] },
      { type: "insight", tone: "warn", title: "Cần xử lý", text: "Ngày nghỉ Thứ Sáu của Lê Minh Cường chưa có người thay, ca này sẽ thiếu 1 người nếu không xử lý." },
      { type: "actions", items: [{ label: "Xem gợi ý người thay", to: ROUTES.leave }, { label: "Tạo Open Shift", to: ROUTES.openShifts }] },
      { type: "source", text: "Nguồn: Đơn xin nghỉ tuần 12/10 – 18/10/2026" },
    ] };

  return {
    blocks: [{ type: "text", text: "Mình không tìm thấy dữ liệu phù hợp cho câu hỏi này. Bạn thử hỏi theo cách khác nhé:" }],
    suggestions: ["Ai nghỉ tuần này?", "Ca nào đang thiếu người?", "Tổng lương tháng này bao nhiêu?"],
  };
}

// ---------- Hàm cho giao diện dùng ----------
export async function askAssistant(question, history = []) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await (IS_MOCK ? mockReply(question, controller.signal) : callBackend(question, history, controller.signal));
  } catch (err) {
    if (err.name === "AbortError") throw new AssistantError("timeout");
    throw err instanceof AssistantError ? err : new AssistantError("unavailable");
  } finally {
    clearTimeout(timer);
  }
}