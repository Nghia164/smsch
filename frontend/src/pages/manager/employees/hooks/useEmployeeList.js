import { useState, useEffect, useMemo } from "react";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  terminateEmployee,
  lockEmployee,
  getFutureShifts,
  subscribeEmployees,
} from "../../../../services/employeeService";

/**
 * Hook quản lý danh sách và nghiệp vụ CRUD nhân viên (US10 / US11)
 */
export function useEmployeeList() {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadData = () => {
      getEmployees()
        .then((data) => {
          if (isMounted) setEmployees(data || []);
        })
        .catch((err) => console.error("Lỗi tải danh sách nhân viên:", err));
    };

    loadData();
    const unsub = subscribeEmployees(loadData);
    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  // Bộ lọc
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [contractFilter, setContractFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal state: null | "add" | "edit" | "account" | "success" | "delete" | "toggle_account"
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const [notice, setNotice] = useState("");
  const [futureShifts, setFutureShifts] = useState([]);
  const [loadingShifts, setLoadingShifts] = useState(false);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const keyword = search.toLowerCase().trim();
  const baseFiltered = useMemo(
    () =>
      employees.filter(
        (e) =>
          (!keyword || e.name.toLowerCase().includes(keyword) || e.id.toLowerCase().includes(keyword)) &&
          (!roleFilter || e.role === roleFilter) &&
          (!contractFilter || e.contract === contractFilter)
      ),
    [employees, keyword, roleFilter, contractFilter]
  );

  const rows = useMemo(
    () => baseFiltered.filter((e) => !statusFilter || e.status === statusFilter),
    [baseFiltered, statusFilter]
  );

  const countOf = (s) => (s ? baseFiltered.filter((e) => e.status === s).length : baseFiltered.length);
  const canClear = search || roleFilter || contractFilter || statusFilter;

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("");
    setContractFilter("");
    setStatusFilter("");
  };

  const openModal = (type, emp = null) => {
    setSelected(emp);
    setError("");

    if (type === "delete" && emp) {
      setFutureShifts([]);
      setLoadingShifts(true);
      getFutureShifts(emp.id)
        .then((res) => {
          setFutureShifts(res.data || []);
        })
        .catch((err) => {
          console.warn("Lỗi lấy ca tương lai:", err);
        })
        .finally(() => {
          setLoadingShifts(false);
        });
    }

    setForm(
      emp
        ? {
            ...emp,
            email: emp.account?.email || "",
            password: "",
            hourlyWage: emp.hourlyWage ?? 28000,
            changePasswordFirstLogin: true,
          }
        : {}
    );
    setModal(type);
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setError("");
    setFutureShifts([]);
    setLoadingShifts(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const isEmailTaken = (email, exceptId) =>
    employees.some(
      (e) => e.id !== exceptId && e.account?.email?.toLowerCase() === email.trim().toLowerCase()
    );

  const handleAdd = async (emp) => {
    try {
      const added = await createEmployee(emp);
      if (emp.account) {
        setCreated({ name: added?.name || emp.name, email: emp.account.email });
        setModal("success");
      } else {
        setNotice(`Đã thêm nhân viên ${added?.name || emp.name}.`);
        setModal(null);
      }
      return added;
    } catch (err) {
      setError(err.message || "Lỗi khi thêm nhân viên.");
      throw err;
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const hasAccount = !!selected.account;
    if (!form.name?.trim()) return setError("Vui lòng nhập họ và tên.");
    if (!form.phone?.trim()) return setError("Vui lòng nhập số điện thoại.");
    if (hasAccount && !form.email?.trim()) return setError("Vui lòng nhập email đăng nhập.");
    if (hasAccount && isEmailTaken(form.email, selected.id))
      return setError("Email này đã được dùng cho tài khoản khác.");

    const updatedWage = form.hourlyWage ? Number(form.hourlyWage) : selected.hourlyWage || 28000;

    try {
      const updatePayload = {
        ...selected,
        name: form.name.trim(),
        phone: form.phone.trim(),
        birthDate: form.birthDate || null,
        contract: form.contract,
        role: form.role,
        roleTag: form.role,
        hourlyWage: updatedWage,
        account: hasAccount ? { ...selected.account, email: form.email.trim() } : null,
      };

      // Chỉ gửi mật khẩu khi người dùng cố ý nhập mật khẩu mới
      if (form.password && typeof form.password === "string" && form.password.trim() !== "") {
        updatePayload.password = form.password.trim();
      }

      await updateEmployee(selected.id, updatePayload);
      setNotice(`Đã lưu thay đổi cho ${form.name.trim()}.`);
      closeModal();
    } catch (err) {
      setError(err.message || "Lỗi khi cập nhật nhân viên.");
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!form.email?.trim()) return setError("Vui lòng nhập email đăng nhập.");
    if (isEmailTaken(form.email)) return setError("Email này đã được dùng cho tài khoản khác.");
    if (!form.password?.trim()) return setError("Vui lòng nhập mật khẩu.");
    if (form.password.trim().length < 6) return setError("Mật khẩu phải có ít nhất 6 ký tự.");

    try {
      await updateEmployee(selected.id, {
        is_grant: true,
        account: {
          email: form.email.trim(),
          password: form.password.trim(),
          status: "active",
          changePasswordFirstLogin: !!form.changePasswordFirstLogin,
        },
      });
      setCreated({ name: selected.name, email: form.email.trim() });
      setSelected(null);
      setModal("success");
    } catch (err) {
      setError(err.message || "Lỗi khi cấp tài khoản.");
    }
  };

  const openLockConfirm = (emp) => {
    if (!emp.account) {
      setNotice("Nhân viên này chưa được cấp tài khoản.");
      return;
    }
    if (emp.status === "Nghỉ việc" && emp.account.status === "locked") {
      setNotice("Không thể mở khóa tài khoản cho nhân viên đã nghỉ việc.");
      return;
    }
    openModal("toggle_account", emp);
  };

  const confirmToggleAccount = async () => {
    if (!selected) return;
    const isLocked = selected.account?.status === "locked";
    try {
      const res = await lockEmployee(selected.id, {
        locked: !isLocked,
      });
      setNotice(res?.message || `Đã ${isLocked ? "mở khóa" : "khóa"} tài khoản của ${selected.name}.`);
      closeModal();
    } catch (err) {
      setError(err.message || "Lỗi khi thay đổi trạng thái tài khoản.");
    }
  };

  const confirmDelete = async () => {
    if (!selected) return;
    try {
      const res = await terminateEmployee(selected.id);
      setNotice(res?.message || `Đã chuyển ${selected.name} sang trạng thái nghỉ việc.`);
      closeModal();
    } catch (err) {
      setError(err.message || "Lỗi khi cho nhân viên nghỉ việc.");
    }
  };

  const menuItems = (emp) => [
    { label: "Sửa thông tin", onClick: () => openModal("edit", emp) },
    ...(emp.account
      ? emp.status === "Nghỉ việc"
        ? [] // Tài khoản nhân viên đã nghỉ việc luôn bị khóa theo nghiệp vụ
        : [
            {
              label: emp.account.status === "locked" ? "Mở khóa tài khoản" : "Khóa tài khoản",
              onClick: () => openLockConfirm(emp),
            },
          ]
      : [{ label: "Cấp tài khoản", onClick: () => openModal("account", emp) }]),
    ...(emp.status !== "Nghỉ việc"
      ? [{ label: "Cho nghỉ việc", danger: true, onClick: () => openModal("delete", emp) }]
      : []),
  ];

  return {
    employees,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    contractFilter,
    setContractFilter,
    statusFilter,
    setStatusFilter,
    rows,
    countOf,
    canClear,
    resetFilters,
    modal,
    selected,
    form,
    error,
    created,
    notice,
    futureShifts,
    loadingShifts,
    openModal,
    closeModal,
    handleChange,
    isEmailTaken,
    handleAdd,
    handleUpdate,
    handleCreateAccount,
    openLockConfirm,
    confirmToggleAccount,
    confirmDelete,
    menuItems,
  };
}
