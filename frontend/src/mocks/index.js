// Dữ liệu giả để code giao diện khi Backend chưa xong.
// Khi Backend sẵn sàng thì đặt VITE_USE_MOCK=false.

export const mockLogin = (email) => ({
  token: "mock-jwt-token",
  user: {
    id: 1,
    name: email.startsWith("manager") ? "Manager (mock)" : "Staff (mock)",
    email,
    // email bắt đầu bằng "manager" -> role manager, còn lại -> staff
    role: email.startsWith("manager") ? "manager" : "staff",
  },
});
