// FR08 - Nghỉ phép
// Cần làm:
//  - Gửi đơn nghỉ đột xuất
//  - Xem kết quả
//  - Nút Hủy đơn bị vô hiệu sau khi đã xác nhận người thay
export default function LeavePage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Nghỉ phép</h1>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <ul className="list-disc pl-5">
        <li>Gửi đơn nghỉ đột xuất</li>
        <li>Xem kết quả</li>
        <li>Nút Hủy đơn bị vô hiệu sau khi đã xác nhận người thay</li>
        </ul>
      </div>
    </div>
  );
}
