const API_BASE = "http://localhost:3000/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers ?? {}),
    },
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error (${res.status}): ${text}`);
  }

  return (await res.json()) as T;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Auth API
export async function register(data: RegisterData): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function login(data: LoginData): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMe(): Promise<User> {
  return request<User>("/auth/me");
}

// Tools API
export async function runCaptionsTool(payload: { topic: string; tone?: string }) {
  return request<{ caption: string }>("/tools/captions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Accounts API
export async function getAccounts() {
  return request("/account");
}

export async function createAccount(data: any) {
  return request("/account", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Content API
export async function uploadContent(formData: FormData) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/content/upload`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload Error (${res.status}): ${text}`);
  }

  return await res.json();
}

export async function scheduleContent(data: any) {
  return request("/content/schedule", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Analytics API
export async function getAnalytics() {
  return request("/analytics");
}
