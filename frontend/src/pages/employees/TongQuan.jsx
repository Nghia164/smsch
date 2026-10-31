export default function ShiftExchangePage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Đổi ca</h1>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <ul className="list-disc pl-5">
        <li>Gửi yêu cầu đổi ca</li>
        <li>Nhận / xác nhận yêu cầu từ đồng nghiệp</li>
        <li>Bị từ chối tự động nếu kỹ năng thấp hơn yêu cầu (kết quả từ API)</li>
        </ul>
      </div>
    </div>
  );
}
