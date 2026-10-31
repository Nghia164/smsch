import httpClient from "./httpClient";
import { mockLogin } from "../mocks";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

/**
 * FR01 - Đăng nhập hệ thống
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ status: boolean, token: string, user: object }>}
 */
export async function login(email, password) {
  if (USE_MOCK) {
    return mockLogin(email);
  }

  const res = await httpClient.post("/auth/login", { email, password });
  const data = res.data;

  // Chuẩn hóa role sang chữ thường ('manager' | 'staff')
  if (data?.user) {
    data.user.role = (data.user.role || data.user.vai_tro || "").toLowerCase();
  }

  return data;
}

/**
 * FR02 - Đăng xuất khỏi hệ thống và thu hồi token trên backend
 * @returns {Promise<{ status: boolean }>}
 */
export async function logout() {
  if (USE_MOCK) {
    return { status: true };
  }

  try {
    const res = await httpClient.post("/logout");
    return res.data;
  } catch (err) {
    // Nếu token đã hết hạn hoặc lỗi mạng, vẫn coi như hoàn tất để dọn dẹp local
    console.warn("Lỗi khi gọi API đăng xuất:", err?.response?.data?.message || err.message);
    return { status: false, error: err };
  }
}

/**
 * Lấy thông tin người dùng hiện tại qua Sanctum token
 * @returns {Promise<object|null>}
 */
export async function getCurrentUser() {
  if (USE_MOCK) {
    return null;
  }

  try {
    const res = await httpClient.get("/user");
    const user = res.data?.user || res.data;
    if (user) {
      user.role = (user.role || user.vai_tro || "").toLowerCase();
    }
    return user;
  } catch {
    return null;
  }
}
