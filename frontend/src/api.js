// Centralized API client for NGO Work Tracker
// All requests go through these helpers so the JWT header is always attached.

// Safety guard: only allow plain http/https URLs.
// If DATABASE_URL or any credential-bearing URL leaks into VITE_API_URL, reject it and fall back.
const _raw = import.meta.env.VITE_API_URL || '';

function _isSafeApiUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    // Must be http or https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    // Must not contain embedded credentials (username/password in URL)
    if (parsed.username || parsed.password) return false;
    return true;
  } catch {
    return false;
  }
}

const API_BASE = _isSafeApiUrl(_raw)
  ? _raw.replace(/\/$/, '')       // strip trailing slash
  : (() => {
      if (_raw) {
        console.error(
          '[api.js] VITE_API_URL is invalid or contains credentials:\n',
          _raw.replace(/:\/\/.*@/, '://***@'), // mask password in log
          '\nFalling back to http://localhost:8000.',
          '\nFix: set VITE_API_URL to your backend URL (e.g. https://your-backend.onrender.com) in your Vercel project → Settings → Environment Variables.',
        );
      }
      return 'http://localhost:8000';
    })();

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

export async function approveUser(userId) {
  return request(`/api/admin/users/${userId}/approve`, { method: 'PATCH' });
}

export async function deleteUser(userId) {
  return request(`/api/admin/users/${userId}`, { method: 'DELETE' });
}
