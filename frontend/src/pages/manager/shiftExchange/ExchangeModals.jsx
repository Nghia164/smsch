import { useState } from "react";
import Modal from "../../../components/Modal";
import { StatusPill } from "../../../components/TableKit";
import { STATUS_META, shiftText } from "./exchangeShared";

const outlineBtn = "h-10 rounded-lg border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-800 hover:bg-slate-50";

// Một bên của yêu cầu (người xin đổi / người nhận đổi) trong hộp thoại chi tiết
function Side({ title, name, role, tag, shift }) {
  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-[16px] font-semibold text-slate-900">{name}</p>
      <p className="text-[13px] text-slate-500">{role} • {tag}</p>
      <div className="mt-3 border-t border-slate-100 pt-3 text-[14px]">
        {shift ? (
          <>
            <p className="font-medium tabular-nums">{shift.date}</p>
            <p className="text-slate-600">{shiftText(shift)}</p>
          </>
        ) : (
          <p className="font-medium text-teal-700">Trực thay ca (không đổi lại ca)</p>
        )}
      </div>
    </div>
  );
}

const CHECKS = [
  (r) => <>Kỹ năng tương thích: cả hai đều có vai trò <b>{r.requesterRole}</b></>,
  () => <>Không trùng với ca làm khác trong ngày</>,
  () => <>Thời gian nghỉ tối thiểu giữa hai ca (≥ 8 giờ)</>,
];

// Hộp thoại chi tiết + đối soát ràng buộc (US 2.13)
export function ExchangeDetailModal({ req, onClose, onApprove, onReject }) {
  const meta = req ? STATUS_META[req.status] ?? STATUS_META.cancelled : null;

  return (
    <Modal open={!!req} title={req ? `Chi tiết yêu cầu đổi ca (${req.id})` : ""} onClose={onClose}>
      {req && (
        <div className="space-y-5 text-[14px]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] text-slate-500">Gửi lúc: {req.createdAt}</span>
            <StatusPill hex={meta.hex}>{meta.label}</StatusPill>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 sm:divide-x sm:divide-slate-100">
            <Side title="Người xin đổi" name={req.requesterName} role={req.requesterRole} tag={req.requesterRoleTag} shift={req.requesterShift} />
            <div className="sm:pl-6">
              <Side title="Người nhận đổi" name={req.targetEmployeeName} role={req.targetEmployeeRole} tag={req.targetEmployeeRoleTag} shift={req.targetShift} />
            </div>
          </div>

          <div>
            <p className="mb-2 font-semibold">Kiểm tra điều kiện xếp lịch</p>
            <ul className="space-y-1.5 text-[13px] text-slate-700">
              {CHECKS.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <svg viewBox="0 0 20 20" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
                    <path d="m4 10 4 4 8-8" />
                  </svg>
                  <span>{c(req)}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[13px] text-slate-600">
            <b className="font-semibold text-slate-800">Lý do xin đổi: </b>
            {req.reason || "Không ghi lý do."}
          </p>
          {req.rejectReason && <p className="text-[13px] font-medium text-rose-600">Lý do từ chối: {req.rejectReason}</p>}

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className={outlineBtn}>Đóng</button>
            {req.status === "pending_manager" && (
              <>
                <button type="button" onClick={() => onReject(req)} className="h-10 rounded-lg border border-rose-200 bg-white px-4 text-[14px] font-medium text-rose-600 hover:bg-rose-50">
                  Từ chối
                </button>
                <button type="button" onClick={() => onApprove(req.id)} className="h-10 rounded-lg bg-blue-600 px-4 text-[14px] font-medium text-white hover:bg-blue-700">
                  Phê duyệt & cập nhật lịch
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

// Hộp thoại từ chối. Dùng key={req?.id} ở nơi gọi để ô lý do được xóa sạch mỗi lần mở.
export function RejectModal({ req, onClose, onConfirm }) {
  const [reason, setReason] = useState("");

  return (
    <Modal open={!!req} title="Từ chối yêu cầu đổi ca" onClose={onClose}>
      {req && (
        <div className="space-y-4 text-[14px]">
          <p className="text-[13px] leading-relaxed text-slate-600">
            Bạn đang từ chối yêu cầu <b>{req.id}</b> giữa <b>{req.requesterName}</b> và <b>{req.targetEmployeeName}</b>.
          </p>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-slate-700">Lý do từ chối (gửi đến cả hai nhân viên)</span>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: không đảm bảo định biên ca tối, trùng lịch đào tạo..."
              className="w-full rounded-lg border border-slate-200 p-3 text-[14px] outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className={outlineBtn}>Hủy bỏ</button>
            <button type="button" onClick={() => onConfirm(reason)} className="h-10 rounded-lg bg-rose-600 px-4 text-[14px] font-medium text-white hover:bg-rose-700">
              Xác nhận từ chối
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
