import httpClient from "./httpClient";
import { getSavedShiftConfig, saveShiftConfigData } from "../mocks/shiftConfigMock";

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

// Ca mẫu + ràng buộc lập lịch (chỉ gồm mã và số, xem toPayload trong shiftConfigData.js)
// TODO: kiểm tra lại đường dẫn API và dạng dữ liệu với Backend (Laravel)

export const getShiftConfig = (params) =>
  USE_MOCK ? Promise.resolve(getSavedShiftConfig()) : httpClient.get("/shift-config", { params }).then((r) => r.data);

export const saveShiftConfig = (data) => {
  if (!USE_MOCK) return httpClient.put("/shift-config", data).then((r) => r.data);
  saveShiftConfigData(data);
  return Promise.resolve(data);
};