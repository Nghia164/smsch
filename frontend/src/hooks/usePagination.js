import { useMemo, useState } from "react";

/**
 * Hook quản lý phân trang dùng chung cho các bảng danh sách
 * @param {Array} items Danh sách đầy đủ cần phân trang
 * @param {number} initialPageSize Số dòng mặc định trên một trang (mặc định 10)
 */
export function usePagination(items = [], initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);

  const pagedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return {
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    total,
    pageCount,
    pagedItems,
    resetPage: () => setPage(1),
  };
}
