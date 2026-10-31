import httpClient from "./httpClient";

// FR04 - đăng ký rảnh/bận hằng tuần
// TODO: kiểm tra lại đường dẫn API với Backend (Laravel)

export const getMyAvailability = (params) => httpClient.get("/availability", { params }).then((r) => r.data);
export const saveMyAvailability = (data) => httpClient.put("/availability", data).then((r) => r.data);
