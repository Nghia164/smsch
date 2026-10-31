import { createContext, useContext, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logout as apiLogout } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (!savedUser || !token) {
        return null;
      }
      const parsed = JSON.parse(savedUser);
      if (parsed) {
        parsed.role = (parsed.role || parsed.vai_tro || "").toLowerCase();
      }
      return parsed;
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return null;
    }
  });

  // Lưu thông tin đăng nhập sau khi xác thực thành công
  const saveLogin = useCallback(({ user: rawUser, token }) => {
    if (!token || !rawUser) return;
    const normalizedUser = {
      ...rawUser,
      role: (rawUser.role || rawUser.vai_tro || "").toLowerCase(),
    };

    localStorage.setItem("user", JSON.stringify(normalizedUser));
    localStorage.setItem("token", token);
    setUser(normalizedUser);
  }, []);

  // Đăng xuất: gọi API thu hồi token backend, xóa dữ liệu local & chuyển hướng về /login
  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch (e) {
      console.warn("Lỗi thu hồi token phía backend:", e);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setUser(null);
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, saveLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
