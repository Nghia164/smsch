// Giả lập backend /shift-config qua src/mocks/db.js
import { getShiftConfig, saveShiftConfig } from "./db";

export function getSavedShiftConfig() {
  return getShiftConfig();
}

export function saveShiftConfigData(data) {
  return saveShiftConfig(data);
}