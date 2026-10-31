import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login } from "../services/authService";
import { ROLES } from "../constants";
import Logo from "../components/Logo";

// FR01 - Đăng nhập hệ thống Smart Scheduling
export default function LoginPage() {
  const { user, saveLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Nếu đã đăng nhập thì tự động chuyển hướng theo vai trò
  if (user) {
    const role = (user.role || user.vai_tro || "").toLowerCase();
    const target = role === ROLES.MANAGER ? "/manager/schedule" : "/employees/schedule";
    return <Navigate to={target} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const data = await login(email.trim(), password);

      if (!data || !data.token || !data.user) {
        throw new Error("Phản hồi từ máy chủ không hợp lệ. Vui lòng thử lại.");
      }

      saveLogin(data);

      const role = (data.user.role || data.user.vai_tro || "").toLowerCase();
      const target = role === ROLES.MANAGER ? "/manager/schedule" : "/employees/schedule";
      navigate(target, { replace: true });
    } catch (err) {
      if (err.response) {
        // Lỗi từ backend trả về (401, 403, 422, ...)
        const backendMessage = err.response.data?.message;
        const validationErrors = err.response.data?.errors;

        if (validationErrors && typeof validationErrors === "object") {
          const firstErr = Object.values(validationErrors).flat()[0];
          setError(firstErr || "Dữ liệu nhập không hợp lệ.");
        } else if (backendMessage) {
          setError(backendMessage);
        } else if (err.response.status === 401) {
          setError("Email hoặc mật khẩu không chính xác.");
        } else if (err.response.status === 403) {
          setError("Tài khoản của bạn đã bị khóa hoặc không có quyền truy cập.");
        } else {
          setError(`Máy chủ phản hồi lỗi (${err.response.status}). Vui lòng thử lại.`);
        }
      } else if (err.request) {
        // Lỗi mạng, không kết nối được backend
        setError("Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra kết nối mạng.");
      } else {
        setError(err.message || "Đã xảy ra lỗi trong quá trình đăng nhập.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0B1D3F] via-[#112D60] to-[#1550E8] p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl transition-all">
        {/* Header / Logo */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3">
            <Logo theme="light" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Đăng nhập hệ thống</h1>
         
        </div>

        {/* Thông báo lỗi */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800"
          >
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1 font-medium leading-relaxed">{error}</div>
          </div>
        )}

        {/* Form đăng nhập */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email đăng nhập
            </label>
            <div className="mt-1">
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                placeholder="name@example.com"
                className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-gray-100 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                placeholder="Nhập mật khẩu"
                className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 pr-10 text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-gray-100 sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={loading}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="flex w-full items-center justify-center rounded-lg bg-[#1550E8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Đang đăng nhập...
              </span>
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>

        {import.meta.env.VITE_USE_MOCK === "true" && (
          <div className="mt-4 rounded-lg bg-gray-50 p-2.5 text-xs text-gray-500">
            Chế độ Mock: email bắt đầu bằng &quot;manager&quot; = Manager, còn lại = Staff.
          </div>
        )}
      </div>
    </div>
  );
}
