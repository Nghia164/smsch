import { useEffect, useState } from "react";
import { getAttendanceHistory } from "../../../../services/attendanceService";
import Modal from "../../../../components/Modal";
import Loading from "../../../../components/Loading";
import Table from "../../../../components/Table";

const historyColumns = [
  { key: "at", label: "Thời điểm" },
  { key: "by", label: "Người sửa" },
  { key: "before", label: "Trước" },
  { key: "after", label: "Sau" },
  { key: "reason", label: "Lý do" },
];

/**
 * Hộp thoại lịch sử điều chỉnh chấm công
 */
export default function AttendanceHistoryModal({ historyRow, onClose }) {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    if (!historyRow?.id) return;
    let ignore = false;
    getAttendanceHistory(historyRow.id)
      .then((data) => {
        if (!ignore) setHistory(data);
      })
      .catch(() => {
        if (!ignore) setHistory([]);
      });
    return () => {
      ignore = true;
    };
  }, [historyRow?.id]);

  if (!historyRow) return null;

  return (
    <Modal
      open={!!historyRow}
      title={`Lịch sử điều chỉnh - ${historyRow?.employeeName ?? ""} (${historyRow?.date ?? ""})`}
      onClose={onClose}
    >
      {!history && <Loading text="Đang tải lịch sử..." />}
      {history && history.length === 0 && (
        <p className="py-6 text-center text-[14px] text-slate-500">Chưa có lần điều chỉnh nào.</p>
      )}
      {history && history.length > 0 && <Table columns={historyColumns} rows={history} />}
    </Modal>
  );
}
