const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Token helpers ──────────────────────────────────────────────────
export const getToken = () => localStorage.getItem("synapse_token");
export const setToken = (t) => localStorage.setItem("synapse_token", t);
export const removeToken = () => localStorage.removeItem("synapse_token");

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("synapse_user"));
  } catch {
    return null;
  }
};
export const setUser = (u) =>
  localStorage.setItem("synapse_user", JSON.stringify(u));
export const removeUser = () => localStorage.removeItem("synapse_user");

// ── Base request ───────────────────────────────────────────────────
async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Something went wrong");
  }
  return data;
}

// ── Auth ───────────────────────────────────────────────────────────
export const authAPI = {
  register: (username, email, password) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }),

  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request("/auth/me"),
};

// ── Chat ───────────────────────────────────────────────────────────
export const chatAPI = {
  send: (message, mode, conversationId = null) =>
    request("/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        mode,
        conversation_id: conversationId,
      }),
    }),
};

// ── History ────────────────────────────────────────────────────────
export const historyAPI = {
  getAll: () => request("/conversations"),

  getOne: (id) => request(`/conversations/${id}`),

  delete: (id) =>
    request(`/conversations/${id}`, { method: "DELETE" }),

  rename: (id, title) =>
    request(`/conversations/${id}/title`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    }),

  clearAll: () =>
    request("/conversations", { method: "DELETE" }),
};
// ── Profile ────────────────────────────────────────────────────────
export const profileAPI = {
  update: (username) =>
    request("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify({ username }),
    }),

  changePassword: (current_password, new_password) =>
    request("/auth/change-password", {
      method: "PATCH",
      body: JSON.stringify({ current_password, new_password }),
    }),
};