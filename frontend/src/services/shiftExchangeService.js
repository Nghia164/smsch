import httpClient from "./httpClient";
import * as mockStore from "../utils/shiftExchangeMockData";

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

// FR06 / US 2.13 - Đổi ca làm việc

export const getExchangeRequests = async (params) => {
  if (USE_MOCK) {
    return mockStore.getExchangeRequests();
  }
  return httpClient.get("/shift-exchange", { params }).then((r) => r.data);
};

export const sendExchangeRequest = async (data) => {
  if (USE_MOCK) {
    return mockStore.createExchangeRequest(data);
  }
  return httpClient.post("/shift-exchange", data).then((r) => r.data);
};

export const respondExchange = async (id, data) => {
  if (USE_MOCK) {
    if (data.action === "peer_respond") {
      return mockStore.peerRespondExchange(id, data);
    }
    if (data.action === "approve") {
      return mockStore.managerApproveExchange(id, data.managerNote);
    }
    if (data.action === "reject") {
      return mockStore.managerRejectExchange(id, data.rejectReason);
    }
    if (data.action === "cancel") {
      return mockStore.cancelExchangeRequest(id);
    }
  }
  return httpClient.patch(`/shift-exchange/${id}`, data).then((r) => r.data);
};

export {
  mockStore,
};
