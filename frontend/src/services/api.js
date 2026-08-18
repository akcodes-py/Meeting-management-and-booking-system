import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

const client = axios.create({
  baseURL: `${API_URL}/api/v1`,
});

// Attach the JWT to every protected request.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (error.response && error.response.data) {
    const data = error.response.data;
    if (typeof data === "string") return data;
    if (data.detail) return data.detail;
    const firstValue = Object.values(data)[0];
    if (Array.isArray(firstValue)) return firstValue[0];
    if (typeof firstValue === "string") return firstValue;
  }
  if (error.message) return error.message;
  return fallback;
}

export const api = {
  signup: (data) => client.post("/auth/signup/", data),
  login: (data) => client.post("/auth/login/", data),

  eventTypes: {
    list: () => client.get("/event-types/"),
    create: (data) => client.post("/event-types/", data),
    update: (id, data) => client.patch(`/event-types/${id}/`, data),
    remove: (id) => client.delete(`/event-types/${id}/`),
  },

  availability: {
    list: () => client.get("/availability/"),
    create: (data) => client.post("/availability/", data),
    remove: (id) => client.delete(`/availability/${id}/`),
  },

  bookings: {
    list: () => client.get("/bookings/"),
    upcoming: () => client.get("/bookings/upcoming/"),
    cancel: (id) => client.post(`/bookings/${id}/cancel/`, {}),
  },

  calendar: {
    status: () => client.get("/calendar/status/"),
    connect: () => client.get("/calendar/connect/"),
    disconnect: () => client.post("/calendar/disconnect/"),
  },

  public: {
    eventType: (username, slug) => client.get(`/public/${username}/${slug}/`),
    availability: (username, slug, params) =>
      client.get(`/public/${username}/${slug}/availability/`, { params }),
    book: (username, slug, data) =>
      client.post(`/public/${username}/${slug}/book/`, data),
  },
};