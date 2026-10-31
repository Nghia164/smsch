// Dữ liệu cho US24 - Dashboard quản lý.
// Mọi số liệu đều tính ĐỘNG từ sổ cái chung src/mocks/db.js.
import { buildDashboard as dbBuildDashboard } from "./db";

export function buildDashboard(params) {
  return dbBuildDashboard(params);
}