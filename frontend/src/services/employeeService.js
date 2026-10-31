import httpClient from "./httpClient";
import {
  getEmployees as dbGetEmployees,
  addEmployee as dbAddEmployee,
  updateEmployee as dbUpdateEmployee,
  subscribe as dbSubscribe,
} from "../mocks/db";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

// Quản lý listener để tự động cập nhật UI khi có thay đổi từ Backend
const apiListeners = new Set();
export const subscribeEmployees = (listener) => {
  if (USE_MOCK) {
    return dbSubscribe(listener);
  }
  apiListeners.add(listener);
  return () => apiListeners.delete(listener);
};

const notifyApiListeners = () => {
  apiListeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error("Lỗi cập nhật listener nhân viên:", e);
    }
  });
};

/**
 * Lấy danh sách nhân viên từ Backend
 */
export async function getEmployees(params) {
  if (USE_MOCK) return dbGetEmployees(params);
  try {
    const r = await httpClient.get("/admin/nhan-vien/data", { params });
    // Trả về mảng nhân viên từ { status: true, data: [...] }
    return r.data?.data || r.data || [];
  } catch (err) {
    console.error("Lỗi API getEmployees, fallback sang mock:", err);
    return dbGetEmployees(params);
  }
}

/**
 * Thêm mới nhân viên
 */
export async function createEmployee(data) {
  if (USE_MOCK) return dbAddEmployee(data);
  try {
    const r = await httpClient.post("/admin/nhan-vien/create", {
      name: data.name,
      ho_ten: data.name,
      phone: data.phone,
      so_dien_thoai: data.phone,
      birthDate: data.birthDate,
      ngay_sinh: data.birthDate,
      contract: data.contract,
      loai_hop_dong: data.contract,
      hourlyWage: data.hourlyWage,
      muc_luong_gio: data.hourlyWage,
      role: data.role,
      roleTag: data.roleTag,
      role_tag_id: data.role_tag_id,
      email: data.account?.email || data.email,
      password: data.account?.password || data.password,
    });
    notifyApiListeners();
    return r.data?.data || r.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || "Lỗi khi thêm nhân viên";
    throw new Error(msg);
  }
}

/**
 * Cập nhật thông tin nhân viên
 */
export async function updateEmployee(id, data) {
  if (USE_MOCK) return dbUpdateEmployee(id, data);
  try {
    const payload = {
      nhan_vien_id: id,
      id: id,
      is_grant: data.is_grant,
    };

    if (data.name !== undefined) {
      payload.name = data.name;
      payload.ho_ten = data.name;
    }
    if (data.phone !== undefined) {
      payload.phone = data.phone;
      payload.so_dien_thoai = data.phone;
    }
    if (data.birthDate !== undefined) {
      payload.birthDate = data.birthDate;
      payload.ngay_sinh = data.birthDate;
    }
    if (data.contract !== undefined) {
      payload.contract = data.contract;
      payload.loai_hop_dong = data.contract;
    }
    if (data.hourlyWage !== undefined) {
      payload.hourlyWage = data.hourlyWage;
      payload.muc_luong_gio = data.hourlyWage;
    }
    if (data.role !== undefined) payload.role = data.role;
    if (data.roleTag !== undefined) payload.roleTag = data.roleTag;
    if (data.role_tag_id !== undefined) payload.role_tag_id = data.role_tag_id;
    if (data.status !== undefined) {
      payload.status = data.status;
      payload.trang_thai = data.status;
    }

    const email = data.account?.email || data.email;
    if (email && typeof email === "string" && email.trim() !== "") {
      payload.email = email.trim();
    }

    // Chỉ gửi password nếu người dùng cố ý nhập mật khẩu mới
    const password = data.account?.password || data.password;
    if (password && typeof password === "string" && password.trim() !== "") {
      payload.password = password.trim();
    }

    if (data.account) {
      payload.account = {
        ...data.account,
        ...(payload.email ? { email: payload.email } : {}),
      };
      // Không gửi password rỗng trong account
      if (!payload.password) {
        delete payload.account.password;
      }
    }

    const r = await httpClient.post("/admin/nhan-vien/update", payload);
    notifyApiListeners();
    return r.data?.data || r.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || "Lỗi khi cập nhật nhân viên";
    throw new Error(msg);
  }
}

/**
 * Cho nhân viên nghỉ việc (Cập nhật trạng thái nghỉ việc, giữ nguyên dữ liệu lịch sử)
 */
export async function terminateEmployee(id) {
  if (USE_MOCK) {
    return dbUpdateEmployee(id, {
      status: "Nghỉ việc",
    });
  }
  try {
    const r = await httpClient.post("/admin/nhan-vien/delete", {
      nhan_vien_id: id,
      id: id,
    });
    notifyApiListeners();
    return r.data?.data || r.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || "Lỗi khi cho nhân viên nghỉ việc";
    throw new Error(msg);
  }
}

/**
 * Kiểm tra các ca làm việc trong tương lai của nhân viên
 */
export async function getFutureShifts(id) {
  if (USE_MOCK) {
    return { count: 0, data: [] };
  }
  try {
    const r = await httpClient.get(`/admin/nhan-vien/future-shifts/${id}`);
    return r.data || { count: 0, data: [] };
  } catch (err) {
    console.warn("Lỗi getFutureShifts:", err);
    return { count: 0, data: [] };
  }
}

/**
 * Khóa hoặc mở khóa tài khoản nhân viên
 */
export async function lockEmployee(id, data) {
  if (USE_MOCK) {
    const list = dbGetEmployees();
    const emp = list.find((e) => e.id === id);
    const locked = data?.locked ?? (emp?.account?.status !== "locked");
    return dbUpdateEmployee(id, {
      account: emp?.account ? { ...emp.account, status: locked ? "locked" : "active" } : null,
    });
  }
  try {
    const r = await httpClient.post("/admin/nhan-vien/change-status", {
      nhan_vien_id: id,
      id: id,
      locked: data?.locked,
    });
    notifyApiListeners();
    return r.data?.data || r.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || "Lỗi khi thay đổi trạng thái tài khoản";
    throw new Error(msg);
  }
}

/**
 * Lấy danh sách vai trò từ backend
 */
export async function getRoleTags() {
  try {
    const r = await httpClient.get("/admin/role-tag/data");
    return r.data?.data || [];
  } catch (err) {
    console.error("Lỗi getRoleTags:", err);
    return [];
  }
}

export async function getMyProfile(params) {
  if (USE_MOCK) {
    const list = dbGetEmployees();
    return list[0] ?? null;
  }
  const r = await httpClient.get("/me", { params });
  return r.data?.data || r.data;
}

export async function updateMyProfile(data) {
  if (USE_MOCK) {
    const list = dbGetEmployees();
    if (list[0]) return dbUpdateEmployee(list[0].id, data);
    return data;
  }
  const r = await httpClient.put("/me", data);
  return r.data?.data || r.data;
}
