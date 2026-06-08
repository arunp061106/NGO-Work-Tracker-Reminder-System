// Centralized API client for NGO Work Tracker
// All requests go through these helpers so the JWT header is always attached.

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ─── Token helpers ────────────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem('ngo_token');
export const setToken = (token) => localStorage.setItem('ngo_token', token);
export const removeToken = () => localStorage.removeItem('ngo_token');

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    removeToken();
    window.location.reload();
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ─── Authentication ───────────────────────────────────────────────────────────
export async function loginUser(email, password) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  return data;
}

export async function registerUser(name, email, password, role) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  });
}

export async function getMe() {
  return request('/api/auth/me');
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export async function fetchTasks() {
  return request('/api/tasks');
}

export async function createTask(taskData) {
  return request('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
}

export async function updateTask(taskId, taskData) {
  return request(`/api/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(taskData),
  });
}

export async function completeTask(taskId) {
  return request(`/api/tasks/${taskId}/complete`, { method: 'PATCH' });
}

export async function deleteTask(taskId) {
  return request(`/api/tasks/${taskId}`, { method: 'DELETE' });
}

// ─── Attendance ───────────────────────────────────────────────────────────────
export async function punchIn() {
  return request('/api/attendance/punch-in', { method: 'POST' });
}

export async function punchOut() {
  return request('/api/attendance/punch-out', { method: 'POST' });
}

// ─── Daily Logs ───────────────────────────────────────────────────────────────
export async function fetchLogs() {
  return request('/api/logs');
}

export async function createLog(formData) {
  // Must send as multipart/form-data for image uploads — do NOT set Content-Type
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/logs`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Log creation failed: ${res.status}`);
  }
  return res.json();
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export async function fetchUsers() {
  return request('/api/admin/users');
}

export async function toggleUserRole(userId) {
  return request(`/api/admin/users/${userId}/toggle-role`, { method: 'PATCH' });
}
