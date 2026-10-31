import { useEffect } from "react";
import Button from "../../../components/Button";
import { PageCard, Pagination, SearchInput, Alert } from "../../../components/PageKit";
import { inputClass } from "../../../components/FilterBar";
import AddEmployeeModal from "./AddEmployeeModal";
import EditEmployeeModal from "./components/EditEmployeeModal";
import { GrantAccountModal, AccountSuccessModal, ToggleAccountModal } from "./components/AccountModals";
import TerminateEmployeeModal from "./components/TerminateEmployeeModal";
import EmployeeTable from "./components/EmployeeTable";
import { ROLES, CONTRACTS } from "./employeeShared";
import { STATUSES, PAGE_SIZES } from "./employeeData";
import { useEmployeeList } from "./hooks/useEmployeeList";
import { usePagination } from "../../../hooks/usePagination";

/**
 * Quản lý nhân viên (US10 / US11)
 */
export default function EmployeeListPage() {
  const {
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
    confirmToggleAccount,
    confirmDelete,
    menuItems,
  } = useEmployeeList();

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
    pagedItems: pageRows,
    resetPage,
  } = usePagination(rows, 7);

  // Về trang 1 khi đổi bộ lọc
  useEffect(() => {
    resetPage();
  }, [search, roleFilter, contractFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const select = (label, value, set, allLabel, options, width) => (
    <div className={width}>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => {
          set(e.target.value);
          resetPage();
        }}
        className={inputClass}
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      <PageCard
        title="Quản lý nhân viên"
        subtitle="Danh sách nhân viên và thông tin phục vụ việc xếp lịch."
        actions={<Button onClick={() => openModal("add")}>+ Thêm nhân viên</Button>}
      >
        {notice && (
          <Alert tone="success" className="mb-4">
            {notice}
          </Alert>
        )}

        {/* TAB TRẠNG THÁI + BỘ LỌC */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[14px]">
            {["", ...STATUSES].map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={statusFilter === s}
                onClick={() => {
                  setStatusFilter(s);
                  resetPage();
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${
                  statusFilter === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {s || "Tất cả"}
                <span className="text-[12px] tabular-nums text-slate-400">{countOf(s)}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                resetPage();
              }}
              placeholder="Tìm tên hoặc mã nhân viên..."
            />
            {select("Vai trò", roleFilter, setRoleFilter, "Tất cả vai trò", ROLES, "w-40")}
            {select("Loại hợp đồng", contractFilter, setContractFilter, "Tất cả hợp đồng", CONTRACTS, "w-44")}
            {canClear && (
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={() => {
                  resetFilters();
                  resetPage();
                }}
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>

        {/* BẢNG */}
        {rows.length === 0 ? (
          <p className="py-10 text-center text-[15px] text-slate-500">Không có nhân viên phù hợp với bộ lọc hiện tại.</p>
        ) : (
          <EmployeeTable
            pageRows={pageRows}
            onRowClick={(emp) => openModal("edit", emp)}
            menuItems={menuItems}
          />
        )}

        {/* PHÂN TRANG */}
        {rows.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            pageCount={pageCount}
            total={rows.length}
            unit="nhân viên"
            onPage={setPage}
            onPageSize={setPageSize}
            sizes={PAGE_SIZES}
          />
        )}
      </PageCard>

      {/* THÊM NHÂN VIÊN */}
      <AddEmployeeModal
        open={modal === "add"}
        nextId={`NV${String(employees.length + 1).padStart(3, "0")}`}
        isEmailTaken={isEmailTaken}
        onClose={closeModal}
        onCreate={handleAdd}
      />

      {/* SỬA NHÂN VIÊN */}
      <EditEmployeeModal
        open={modal === "edit"}
        selected={selected}
        form={form}
        onChange={handleChange}
        error={error}
        onClose={closeModal}
        onSubmit={handleUpdate}
      />

      {/* CẤP TÀI KHOẢN */}
      <GrantAccountModal
        open={modal === "account"}
        selected={selected}
        form={form}
        onChange={handleChange}
        error={error}
        onClose={closeModal}
        onSubmit={handleCreateAccount}
      />

      {/* CẤP TÀI KHOẢN THÀNH CÔNG */}
      <AccountSuccessModal
        open={modal === "success"}
        created={created}
        onClose={closeModal}
      />

      {/* XÁC NHẬN CHO NGHỈ VIỆC */}
      <TerminateEmployeeModal
        open={modal === "delete"}
        selected={selected}
        futureShifts={futureShifts}
        loadingShifts={loadingShifts}
        error={error}
        onClose={closeModal}
        onConfirm={confirmDelete}
      />

      {/* XÁC NHẬN KHÓA / MỞ KHÓA TÀI KHOẢN */}
      <ToggleAccountModal
        open={modal === "toggle_account"}
        selected={selected}
        error={error}
        onClose={closeModal}
        onConfirm={confirmToggleAccount}
      />
    </>
  );
}