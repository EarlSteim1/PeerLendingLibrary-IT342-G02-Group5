import axios from "axios";

const API_BASE =
  process.env.REACT_APP_API_BASE?.replace(/\/$/, "") || "/api";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("peerReads:token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401 || status === 403) {
        localStorage.removeItem("peerReads:token");
        localStorage.removeItem("peerReads:user");
      }
      const message =
        data?.message ||
        data?.error ||
        `Request failed with status ${status}`;
      return Promise.reject(new Error(message));
    }
    return Promise.reject(
      new Error(error.message || "Network request failed"),
    );
  },
);

const apiClient = {
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  patch: (url, data, config) => api.patch(url, data, config),
  delete: (url, config) => api.delete(url, config),
};

export default apiClient;


