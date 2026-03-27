/**
 * Central API service that communicates with the ProFlow backend.
 * All requests go through /api (proxied by Vite to http://make:5000/api in dev).
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// ─── Token helpers ────────────────────────────────────────────────────────────
export const getToken = (): string | null => localStorage.getItem('proflow_token');
export const setToken = (token: string) => localStorage.setItem('proflow_token', token);
export const removeToken = () => localStorage.removeItem('proflow_token');

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (let browser set multipart boundary)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed') as any;
    error.statusCode = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ─── Convenience methods ───────────────────────────────────────────────────────
export const api = {
  get: <T>(url: string) => request<T>(url, { method: 'GET' }),

  post: <T>(url: string, body?: any) =>
    request<T>(url, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),

  put: <T>(url: string, body?: any) =>
    request<T>(url, { method: 'PUT', body: JSON.stringify(body) }),

  patch: <T>(url: string, body?: any) =>
    request<T>(url, { method: 'PATCH', body: body instanceof FormData ? body : JSON.stringify(body) }),

  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};

// ─── Response types ────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string; role: string; organizationId?: string }) =>
    api.post<ApiResponse<{ user: any; token: string }>>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: any; token: string }>>('/auth/login', data),

  logout: () => api.post<ApiResponse<null>>('/auth/logout'),

  me: () => api.get<ApiResponse<any>>('/auth/me'),

  forgotPassword: (email: string) =>
    api.post<ApiResponse<any>>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post<ApiResponse<any>>('/auth/reset-password', { token, password }),
};

// ─── PROJECTS ─────────────────────────────────────────────────────────────────
export const projectApi = {
  getAll: () => api.get<ApiResponse<any[]>>('/projects'),
  get: (id: string) => api.get<ApiResponse<any>>(`/projects/${id}`),
  create: (data: any) => api.post<ApiResponse<any>>('/projects', data),
  update: (id: string, data: any) => api.put<ApiResponse<any>>(`/projects/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/projects/${id}`),

  addMember: (id: string, userId: string) =>
    api.post<ApiResponse<any>>(`/projects/${id}/members`, { userId }),
  removeMember: (id: string, userId: string) =>
    api.delete<ApiResponse<any>>(`/projects/${id}/members/${userId}`),

  getFiles: (id: string) => api.get<ApiResponse<any[]>>(`/projects/${id}/files`),
  uploadFile: (id: string, formData: FormData) =>
    api.post<ApiResponse<any>>(`/projects/${id}/files`, formData),
  deleteFile: (id: string, fileId: string) =>
    api.delete<ApiResponse<null>>(`/projects/${id}/files/${fileId}`),

  getChat: (id: string) => api.get<ApiResponse<any[]>>(`/projects/${id}/chat`),
  sendChat: (id: string, text: string) =>
    api.post<ApiResponse<any>>(`/projects/${id}/chat`, { text }),

  getActivity: (id: string) => api.get<ApiResponse<any[]>>(`/projects/${id}/activity`),
};

// ──────────────────────────────────── TASKS ────────────────────────────────────────────────────────────────────
export const taskApi = {
  getAll: () => api.get<ApiResponse<any[]>>('/tasks'),
  getByProject: (projectId: string) =>
    api.get<ApiResponse<any[]>>(`/projects/${projectId}/tasks`),
  get: (projectId: string, taskId: string) =>
    api.get<ApiResponse<any>>(`/projects/${projectId}/tasks/${taskId}`),
  create: (projectId: string, data: any) =>
    api.post<ApiResponse<any>>(`/projects/${projectId}/tasks`, data),
  update: (projectId: string, taskId: string, data: any) =>
    api.put<ApiResponse<any>>(`/projects/${projectId}/tasks/${taskId}`, data),
  delete: (projectId: string, taskId: string) =>
    api.delete<ApiResponse<null>>(`/projects/${projectId}/tasks/${taskId}`),
  updateStatus: (projectId: string, taskId: string, status: string) =>
    api.patch<ApiResponse<any>>(`/projects/${projectId}/tasks/${taskId}/status`, { status }),

  addComment: (projectId: string, taskId: string, text: string) =>
    api.post<ApiResponse<any>>(`/projects/${projectId}/tasks/${taskId}/comments`, { text }),
  deleteComment: (projectId: string, taskId: string, commentId: string) =>
    api.delete<ApiResponse<null>>(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`),

  addAttachment: (projectId: string, taskId: string, formData: FormData) =>
    api.post<ApiResponse<any>>(`/projects/${projectId}/tasks/${taskId}/attachments`, formData),
  deleteAttachment: (projectId: string, taskId: string, attachId: string) =>
    api.delete<ApiResponse<null>>(`/projects/${projectId}/tasks/${taskId}/attachments/${attachId}`),
};

// ─── USERS ────────────────────────────────────────────────────────────────────
export const userApi = {
  getAll: () => api.get<ApiResponse<any[]>>('/users'),
  get: (id: string) => api.get<ApiResponse<any>>(`/users/${id}`),
  create: (data: any) => api.post<ApiResponse<any>>('/users', data),
  update: (id: string, data: any) => api.put<ApiResponse<any>>(`/users/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/users/${id}`),
  updateProfile: (data: any) => api.patch<ApiResponse<any>>('/users/me/profile', data),
  updateAvatar: (formData: FormData) => api.patch<ApiResponse<any>>('/users/me/avatar', formData),
};

// ─── TIMESHEETS ───────────────────────────────────────────────────────────────
export const timesheetApi = {
  getAll: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<ApiResponse<any[]>>(`/timesheets${qs}`);
  },
  get: (id: string) => api.get<ApiResponse<any>>(`/timesheets/${id}`),
  create: (data: any) => api.post<ApiResponse<any>>('/timesheets', data),
  update: (id: string, data: any) => api.put<ApiResponse<any>>(`/timesheets/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/timesheets/${id}`),
  approve: (id: string) => api.patch<ApiResponse<any>>(`/timesheets/${id}/approve`),
  reject: (id: string) => api.patch<ApiResponse<any>>(`/timesheets/${id}/reject`),
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const notificationApi = {
  getAll: () => api.get<ApiResponse<any[]>>('/notifications'),
  markRead: (id: string) => api.patch<ApiResponse<any>>(`/notifications/${id}/read`),
  markAllRead: () => api.patch<ApiResponse<any>>('/notifications/read-all'),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/notifications/${id}`),
};

// ─── ACTIVITIES ───────────────────────────────────────────────────────────────
export const activityApi = {
  getAll: () => api.get<ApiResponse<any[]>>('/activities'),
  getByProject: (projectId: string) =>
    api.get<ApiResponse<any[]>>(`/activities/project/${projectId}`),
};
