import { useState, useMemo } from "react";
import {
  ArrowLeftRight,
  Plus,
  CheckCircle2,
  AlertTriangle,
  X,
  Inbox,
  Send,
  History,
  Info,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getExchangeRequests,
  createExchangeRequest,
  peerRespondExchange,
  cancelExchangeRequest,
} from "../../utils/shiftExchangeMockData";
import {
  employeeRoster,
  getEmployeeById,
  initialDays,
} from "../../mocks/scheduleMockData";
import { WEEKLY_PATTERN } from "../../mocks/workHours";

const STATUS_CONFIG = {
  pending_peer: {
    label: "Chờ đồng nghiệp",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  pending_manager: {
    label: "Chờ quản lý duyệt",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  approved: {
    label: "Đã phê duyệt",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Bị từ chối",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
  cancelled: {
    label: "Đã hủy",
    badge: "bg-slate-100 text-slate-500 border-slate-200",
    dot: "bg-slate-400",
  },
};

const SHIFT_HOURS = {
  "Sáng": { id: "morning", time: "06:00 - 12:00" },
  "Chiều": { id: "afternoon", time: "12:00 - 17:00" },
  "Tối": { id: "evening", time: "17:00 - 22:00" },
};

export default function EmployeeShiftExchangePage() {
  const { user } = useAuth();

  // Nhân viên đang đăng nhập (mặc định NV004 hoặc NV002 nếu test)
  const [currentStaffId, setCurrentStaffId] = useState(() => {
    if (user?.email?.includes("bich")) return "NV002";
    if (user?.email?.includes("cuong")) return "NV003";
    if (user?.email?.includes("dung")) return "NV004";
    if (user?.email?.includes("nam")) return "NV005";
    return "NV004"; // Mặc định Phạm Thị Dung (Pha chế - có yêu cầu cần duyệt demo)
  });

  const currentStaff = getEmployeeById(currentStaffId) || employeeRoster[1];

  // Danh sách yêu cầu
  const [requests, setRequests] = useState(getExchangeRequests);

  // Tab: 'incoming' (Gửi đến tôi) | 'outgoing' (Tôi đã gửi) | 'all' (Tất cả)
  const [activeTab, setActiveTab] = useState("incoming");

  // Modal tạo yêu cầu
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form tạo yêu cầu
  const [selectedMyShift, setSelectedMyShift] = useState("");
  const [targetEmployeeId, setTargetEmployeeId] = useState("");
  const [exchangeType, setExchangeType] = useState("swap"); // 'swap' | 'cover'
  const [selectedTargetShift, setSelectedTargetShift] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Ca làm việc trong tuần của nhân viên hiện tại
  const myShifts = useMemo(() => {
    const pattern = WEEKLY_PATTERN[currentStaffId] || {};
    return Object.entries(pattern).map(([dayIdx, shiftName]) => {
      const day = initialDays[Number(dayIdx)] || initialDays[0];
      const hours = SHIFT_HOURS[shiftName] || SHIFT_HOURS["Sáng"];
      return {
        key: `${day.id}_${hours.id}`,
        dayId: day.id,
        shiftId: hours.id,
        shiftName: `Ca ${shiftName.toLowerCase()}`,
        date: `${day.fullDate.split(",")[0]}, ${day.date}`,
        time: hours.time,
      };
    });
  }, [currentStaffId]);

  // Đồng nghiệp có CÙNG VAI TRÒ (Role_Tag) theo US 2.13
  const eligibleCoworkers = useMemo(() => {
    return employeeRoster.filter(
      (e) => e.id !== currentStaffId && e.role === currentStaff.role
    );
  }, [currentStaffId, currentStaff.role]);

  // Ca của đồng nghiệp được chọn
  const targetCoworkerShifts = useMemo(() => {
    if (!targetEmployeeId) return [];
    const pattern = WEEKLY_PATTERN[targetEmployeeId] || {};
    return Object.entries(pattern).map(([dayIdx, shiftName]) => {
      const day = initialDays[Number(dayIdx)] || initialDays[0];
      const hours = SHIFT_HOURS[shiftName] || SHIFT_HOURS["Sáng"];
      return {
        key: `${day.id}_${hours.id}`,
        dayId: day.id,
        shiftId: hours.id,
        shiftName: `Ca ${shiftName.toLowerCase()}`,
        date: `${day.fullDate.split(",")[0]}, ${day.date}`,
        time: hours.time,
      };
    });
  }, [targetEmployeeId]);

  // Yêu cầu gửi đến tôi (cần phản hồi)
  const incomingRequests = useMemo(() => {
    return requests.filter((r) => r.targetEmployeeId === currentStaffId);
  }, [requests, currentStaffId]);

  const pendingIncomingCount = incomingRequests.filter(
    (r) => r.status === "pending_peer"
  ).length;

  // Yêu cầu tôi đã gửi
  const outgoingRequests = useMemo(() => {
    return requests.filter((r) => r.requesterId === currentStaffId);
  }, [requests, currentStaffId]);

  // Mở modal tạo yêu cầu
  const handleOpenCreateModal = () => {
    setFormError("");
    setSelectedMyShift(myShifts[0]?.key || "");
    setTargetEmployeeId(eligibleCoworkers[0]?.id || "");
    setExchangeType("swap");
    setSelectedTargetShift("");
    setReason("");
    setIsCreateModalOpen(true);
  };

  // Đồng nghiệp chấp nhận đổi ca
  const handleAccept = (reqId) => {
    try {
      peerRespondExchange(reqId, { accepted: true });
      setRequests(getExchangeRequests());
      showToast(
        "Bạn đã chấp nhận yêu cầu! Yêu cầu đã được chuyển tới Quản lý phê duyệt.",
        "success"
      );
    } catch (err) {
      showToast(err.message, "warning");
    }
  };

  // Đồng nghiệp từ chối đổi ca
  const handleReject = (reqId) => {
    const reasonPrompt = window.prompt("Nhập lý do từ chối (tùy chọn):", "Bận việc cá nhân.");
    if (reasonPrompt !== null) {
      peerRespondExchange(reqId, { accepted: false, rejectReason: reasonPrompt });
      setRequests(getExchangeRequests());
      showToast("Đã từ chối yêu cầu đổi ca.", "info");
    }
  };

  // Người gửi hủy yêu cầu
  const handleCancelMyRequest = (reqId) => {
    if (window.confirm("Bạn có chắc chắn muốn hủy yêu cầu đổi ca này không?")) {
      try {
        cancelExchangeRequest(reqId);
        setRequests(getExchangeRequests());
        showToast("Đã hủy yêu cầu đổi ca.", "info");
      } catch (err) {
        showToast(err.message, "warning");
      }
    }
  };

  // Submit form tạo yêu cầu
  const handleSubmitCreate = (e) => {
    e.preventDefault();
    setFormError("");

    const myShiftObj = myShifts.find((s) => s.key === selectedMyShift);
    if (!myShiftObj) {
      setFormError("Vui lòng chọn ca làm việc của bạn cần đổi!");
      return;
    }

    if (!targetEmployeeId) {
      setFormError("Vui lòng chọn đồng nghiệp muốn đổi ca!");
      return;
    }

    let targetShiftObj = null;
    if (exchangeType === "swap") {
      targetShiftObj = targetCoworkerShifts.find((s) => s.key === selectedTargetShift);
      if (!targetShiftObj && targetCoworkerShifts.length > 0) {
        setFormError("Vui lòng chọn ca của đồng nghiệp mà bạn muốn đổi lấy!");
        return;
      }
    }

    try {
      createExchangeRequest({
        requesterId: currentStaffId,
        requesterShift: myShiftObj,
        targetEmployeeId,
        targetShift: targetShiftObj,
        exchangeType,
        reason: reason.trim() || "Bận việc đột xuất.",
      });

      setRequests(getExchangeRequests());
      setIsCreateModalOpen(false);
      setActiveTab("outgoing");
      showToast("Đã gửi yêu cầu đổi ca đến đồng nghiệp thành công!", "success");
    } catch (err) {
      setFormError(err.message || "Lỗi khi tạo yêu cầu đổi ca");
    }
  };

  return (
    <div className="min-h-full space-y-6 font-sans">
      {/* Toast thông báo */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl animate-in fade-in slide-in-from-bottom-2">
          {toast.type === "warning" ? (
            <AlertTriangle size={18} className="text-amber-400" />
          ) : toast.type === "info" ? (
            <Info size={18} className="text-blue-400" />
          ) : (
            <CheckCircle2 size={18} className="text-emerald-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ========================================================
          1. HEADER NHÂN VIÊN ĐỔI CA
      ======================================================== */}
      <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 pr-20 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <span className="h-10 w-1 shrink-0 rounded-full bg-[#1459db]" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0B1D3F]">
              Đổi ca
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              Gửi yêu cầu hoán đổi ca cho đồng nghiệp cùng chuyên môn hoặc phản hồi yêu cầu đổi ca gửi đến bạn.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick switcher nhân viên để test thuận tiện */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1 text-xs">
            <span className="text-slate-400">Đang xem:</span>
            <select
              value={currentStaffId}
              onChange={(e) => setCurrentStaffId(e.target.value)}
              className="bg-transparent font-bold text-blue-700 outline-none cursor-pointer"
            >
              {employeeRoster.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 active:scale-[0.98] sm:text-sm"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Tạo yêu cầu đổi ca</span>
          </button>
        </div>
      </header>

      {/* ========================================================
          2. TABS ĐIỀU HƯỚNG YÊU CẦU
      ======================================================== */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("incoming")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === "incoming"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Inbox size={17} />
          <span>Yêu cầu gửi đến tôi</span>
          {pendingIncomingCount > 0 && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white animate-pulse">
              {pendingIncomingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("outgoing")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === "outgoing"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Send size={17} />
          <span>Yêu cầu tôi đã gửi</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {outgoingRequests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === "all"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <History size={17} />
          <span>Tất cả yêu cầu liên quan</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {requests.filter(
              (r) => r.requesterId === currentStaffId || r.targetEmployeeId === currentStaffId
            ).length}
          </span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: YÊU CẦU GỬI ĐẾN TÔI (CẦN PHẢN HỒI)
      ======================================================== */}
      {activeTab === "incoming" && (
        <div className="space-y-4">
          {incomingRequests.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-400">
              <Inbox size={36} className="mx-auto mb-2 text-slate-300" />
              <div className="font-semibold text-slate-600">Không có yêu cầu đổi ca nào gửi đến bạn</div>
              <p className="mt-1 text-xs">
                Khi đồng nghiệp cùng chuyên môn cần đổi ca với bạn, yêu cầu sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            incomingRequests.map((req) => {
              const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.cancelled;
              const isWaitingMyResponse = req.status === "pending_peer";
              const requester = getEmployeeById(req.requesterId);

              return (
                <div
                  key={req.id}
                  className={`rounded-xl border p-5 bg-white shadow-xs transition ${
                    isWaitingMyResponse ? "border-amber-300 ring-2 ring-amber-100" : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <img
                        src={
                          requester?.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            req.requesterName
                          )}&background=0D8ABC&color=fff`
                        }
                        alt=""
                        className="h-10 w-10 rounded-full object-cover border border-slate-200 mt-0.5"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-base">
                            {req.requesterName}
                          </span>
                          <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                            {req.requesterRole}
                          </span>
                          <span className="font-mono text-xs text-slate-400">({req.id})</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Gửi lúc: {req.createdAt}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border self-start ${statusCfg.badge}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Chi tiết ca đề nghị đổi */}
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-xl bg-slate-50/80 p-4 border border-slate-100">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase">
                        Ca đồng nghiệp muốn nhờ bạn:
                      </div>
                      <div className="mt-1 font-bold text-slate-800 text-sm">
                        {req.requesterShift.shiftName} ({req.requesterShift.time})
                      </div>
                      <div className="text-xs text-slate-600 font-mono">
                        {req.requesterShift.date}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase">
                        {req.targetShift ? "Ca bạn đổi lại:" : "Hình thức:"}
                      </div>
                      {req.targetShift ? (
                        <>
                          <div className="mt-1 font-bold text-slate-800 text-sm">
                            {req.targetShift.shiftName} ({req.targetShift.time})
                          </div>
                          <div className="text-xs text-slate-600 font-mono">
                            {req.targetShift.date}
                          </div>
                        </>
                      ) : (
                        <div className="mt-1 text-sm font-semibold text-teal-700">
                          Nhờ bạn trực thay ca này
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lý do */}
                  <div className="mt-3 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Lý do: </span>
                    <span>{req.reason}</span>
                  </div>

                  {/* Nút phản hồi */}
                  {isWaitingMyResponse && (
                    <div className="mt-4 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => handleReject(req.id)}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                      >
                        Từ chối
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAccept(req.id)}
                        className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                      >
                        Đồng ý đổi ca
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: YÊU CẦU TÔI ĐÃ GỬI
      ======================================================== */}
      {activeTab === "outgoing" && (
        <div className="space-y-4">
          {outgoingRequests.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-400">
              <Send size={36} className="mx-auto mb-2 text-slate-300" />
              <div className="font-semibold text-slate-600">Bạn chưa gửi yêu cầu đổi ca nào</div>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={14} />
                <span>Tạo yêu cầu ngay</span>
              </button>
            </div>
          ) : (
            outgoingRequests.map((req) => {
              const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.cancelled;
              const canCancel = req.status === "pending_peer" || req.status === "pending_manager";

              return (
                <div key={req.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {req.id}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500">Gửi đến:</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {req.targetEmployeeName} ({req.targetEmployeeRole})
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-400">Gửi lúc: {req.createdAt}</div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border self-start ${statusCfg.badge}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-xl bg-slate-50/80 p-4 border border-slate-100 text-xs">
                    <div>
                      <span className="font-semibold text-slate-500">Ca của bạn:</span>
                      <div className="font-bold text-slate-800 text-sm mt-0.5">
                        {req.requesterShift.shiftName} ({req.requesterShift.time})
                      </div>
                      <div className="text-slate-600 font-mono">{req.requesterShift.date}</div>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Đổi với:</span>
                      {req.targetShift ? (
                        <>
                          <div className="font-bold text-slate-800 text-sm mt-0.5">
                            {req.targetShift.shiftName} ({req.targetShift.time})
                          </div>
                          <div className="text-slate-600 font-mono">{req.targetShift.date}</div>
                        </>
                      ) : (
                        <div className="mt-0.5 text-teal-700 font-semibold">
                          Nhờ đồng nghiệp làm thay
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-700">Lý do: </span>
                      <span className="text-slate-600">{req.reason}</span>
                    </div>

                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => handleCancelMyRequest(req.id)}
                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-rose-600 transition"
                      >
                        Hủy yêu cầu
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================
          TAB 3: TẤT CẢ LỊCH SỬ
      ======================================================== */}
      {activeTab === "all" && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-[#FAFAFC] text-slate-500 font-semibold">
                  <th className="px-4 py-3">Mã yêu cầu</th>
                  <th className="px-4 py-3">Người gửi</th>
                  <th className="px-4 py-3">Người nhận</th>
                  <th className="px-4 py-3">Ca hoán đổi</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => {
                  const statusCfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.cancelled;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{r.id}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{r.requesterName}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{r.targetEmployeeName}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {r.requesterShift.shiftName} ({r.requesterShift.date})
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${statusCfg.badge}`}
                        >
                          {statusCfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          3. MODAL TẠO YÊU CẦU ĐỔI CA (US 2.13)
      ======================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl animate-in zoom-in-95">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ArrowLeftRight size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Tạo yêu cầu đổi ca mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
                <AlertTriangle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitCreate} className="space-y-4">
              {/* Bước 1: Chọn ca của bạn */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  1. Chọn ca làm việc của bạn cần đổi <span className="text-rose-500">*</span>
                </label>
                {myShifts.length === 0 ? (
                  <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                    Bạn không có ca làm việc nào được phân công trong tuần này!
                  </div>
                ) : (
                  <select
                    value={selectedMyShift}
                    onChange={(e) => setSelectedMyShift(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500"
                  >
                    {myShifts.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.shiftName} ({s.time}) - {s.date}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Bước 2: Chọn đồng nghiệp cùng kỹ năng */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  2. Chọn đồng nghiệp đổi ca (Bắt buộc cùng chuyên môn: {currentStaff.role}){" "}
                  <span className="text-rose-500">*</span>
                </label>
                {eligibleCoworkers.length === 0 ? (
                  <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
                    Không tìm thấy đồng nghiệp nào cùng kỹ năng ({currentStaff.role}) để đổi ca!
                  </div>
                ) : (
                  <select
                    value={targetEmployeeId}
                    onChange={(e) => {
                      setTargetEmployeeId(e.target.value);
                      setSelectedTargetShift("");
                    }}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500"
                  >
                    {eligibleCoworkers.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} - Vị trí: {e.role} ({e.roleTag})
                      </option>
                    ))}
                  </select>
                )}
                <p className="mt-1 text-[11px] text-slate-400">
                  * Theo quy tắc US 2.13, chỉ những nhân viên có cùng kỹ năng chuyên môn mới hợp lệ đổi ca.
                </p>
              </div>

              {/* Bước 3: Hình thức đổi ca */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  3. Hình thức đổi ca
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer text-xs font-semibold transition ${
                      exchangeType === "swap"
                        ? "border-blue-500 bg-blue-50/50 text-blue-800"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="ex_type"
                      checked={exchangeType === "swap"}
                      onChange={() => setExchangeType("swap")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Hoán đổi lấy ca của bạn ấy</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer text-xs font-semibold transition ${
                      exchangeType === "cover"
                        ? "border-blue-500 bg-blue-50/50 text-blue-800"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="ex_type"
                      checked={exchangeType === "cover"}
                      onChange={() => setExchangeType("cover")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Nhờ bạn ấy trực thay</span>
                  </label>
                </div>
              </div>

              {/* Chọn ca của đồng nghiệp (nếu là Swap) */}
              {exchangeType === "swap" && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Ca của đồng nghiệp mà bạn muốn đổi lấy:
                  </label>
                  {targetCoworkerShifts.length === 0 ? (
                    <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                      Đồng nghiệp này chưa có ca phân công nào trong tuần để hoán đổi. Bạn có thể chọn "Nhờ bạn ấy trực thay".
                    </div>
                  ) : (
                    <select
                      value={selectedTargetShift}
                      onChange={(e) => setSelectedTargetShift(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500"
                    >
                      <option value="">-- Chọn ca đổi lại --</option>
                      {targetCoworkerShifts.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.shiftName} ({s.time}) - {s.date}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Bước 4: Lý do */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  4. Lý do đổi ca
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="VD: Bận thi kết thúc môn, việc gia đình đột xuất..."
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={myShifts.length === 0 || eligibleCoworkers.length === 0}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                >
                  Gửi yêu cầu đổi ca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
