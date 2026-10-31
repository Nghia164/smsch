// FR11 - Chấm công
// Cần làm:
//  - Check-in / check-out từng ca
//  - Hiện kết quả: hợp lệ / trễ / ngoài khu vực
export default function AttendancePage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Chấm công</h1>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <ul className="list-disc pl-5">
        <li>Check-in / check-out từng ca</li>
        <li>Hiện kết quả: hợp lệ / trễ / ngoài khu vực</li>
        </ul>
      </div>
    </div>
  );
}
