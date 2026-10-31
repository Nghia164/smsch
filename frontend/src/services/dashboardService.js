import httpClient from "./httpClient";
import { buildDashboard } from "../mocks/dashboardStats";
import { subscribe as dbSubscribe } from "../mocks/db";

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

// US24 - Dashboard quản lý (Manager)
// Toàn bộ đọc/ghi mock đều đi qua src/mocks/db.js (Single Source of Truth)

export const subscribeDashboard = (listener) => dbSubscribe(listener);

export async function getDashboardStats(params) {
  if (USE_MOCK) return buildDashboard(params);
  const res = await httpClient.get("/dashboard", { params });
  return res.data;
}
