// FR07 - Ca trống
// Cần làm:
//  - Xem ca trống
//  - Nhận ca
//  - Nếu người khác nhận trước: hiện thông báo lỗi
export default function OpenShiftPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Ca trống</h1>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <ul className="list-disc pl-5">
        <li>Xem ca trống</li>
        <li>Nhận ca</li>
        <li>Nếu người khác nhận trước: hiện thông báo lỗi</li>
        </ul>
      </div>
    </div>
  );
}
