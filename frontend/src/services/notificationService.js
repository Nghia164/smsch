import httpClient from "./httpClient";

// Thông báo in-app
// TODO: kiểm tra lại đường dẫn API với Backend (Laravel)

export const getNotifications = (params) => httpClient.get("/notifications", { params }).then((r) => r.data);
