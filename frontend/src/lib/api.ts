const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');

  const headers = new Headers(options.headers as HeadersInit | undefined);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const text = await res.text();
    let errorData: any;
    try {
      errorData = JSON.parse(text);
    } catch {
      errorData = { message: text };
    }

    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    throw new ApiError(
      errorData.message || `API Error (${res.status})`,
      res.status,
      errorData.code
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  platform: 'twitter' | 'instagram' | 'facebook' | 'linkedin';
  username: string;
  status: 'active' | 'paused' | 'error';
  profileImage?: string;
  followerCount?: number;
  preferredHours: number[];
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  content: string;
  mediaUrls: string[];
  scheduledAt: string;
  publishedAt?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  accountId: string;
  account?: Account;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalAccounts: number;
  activeAccounts: number;
  postsToday: number;
  postsThisWeek: number;
  errorRate: number;
  nextPosts: Post[];
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
export async function getAccounts(): Promise<Account[]> {
  // TODO: Replace with real endpoint when backend implements /api/accounts
  // For now, return mock data until backend is ready
  return Promise.resolve([
    {
      id: 'acc-1',
      platform: 'twitter' as const,
      username: '@your_handle',
      status: 'active' as const,
      profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
      followerCount: 1250,
      preferredHours: [9, 12, 18],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'acc-2',
      platform: 'instagram' as const,
      username: '@your_insta',
      status: 'active' as const,
      followerCount: 2300,
      preferredHours: [11, 15, 20],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'acc-3',
      platform: 'linkedin' as const,
      username: 'Your Name',
      status: 'paused' as const,
      followerCount: 450,
      preferredHours: [9, 13, 17],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ]);
}

export async function createAccount(data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> {
  return request<Account>("/accounts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAccount(id: string, data: Partial<Account>): Promise<Account> {
  return request<Account>(`/accounts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteAccount(id: string): Promise<void> {
  return request<void>(`/accounts/${id}`, {
    method: "DELETE",
  });
}

// Posts API
export async function getPosts(params?: { accountId?: string; status?: string }): Promise<Post[]> {
  // TODO: Replace with real endpoint when backend implements /api/posts
  // For now, return mock data until backend is ready
  return Promise.resolve([
    {
      id: 'post-1',
      content: 'Just launched our new feature! 🚀 What do you think?',
      mediaUrls: [],
      scheduledAt: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
      status: 'scheduled' as const,
      accountId: 'acc-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'post-2',
      content: 'Monday motivation: Keep pushing forward! 💪',
      mediaUrls: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=300'],
      scheduledAt: new Date(Date.now() - 86400000).toISOString(), // yesterday
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      status: 'published' as const,
      accountId: 'acc-2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'post-3',
      content: 'Draft post about our upcoming webinar',
      mediaUrls: [],
      scheduledAt: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
      status: 'draft' as const,
      accountId: 'acc-3',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ].filter(post => {
    if (params?.accountId && post.accountId !== params.accountId) return false;
    if (params?.status && post.status !== params.status) return false;
    return true;
  }));
}

export async function createPost(data: Omit<Post, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Post> {
  return request<Post>("/posts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePost(id: string, data: Partial<Post>): Promise<Post> {
  return request<Post>(`/posts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePost(id: string): Promise<void> {
  return request<void>(`/posts/${id}`, {
    method: "DELETE",
  });
}

export async function uploadContent(formData: FormData): Promise<{ url: string }> {
  const token = localStorage.getItem('token');
  const headers = new Headers();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}/media/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(`Upload Error: ${text}`, res.status);
  }

  return await res.json();
}

// Dashboard API
export async function getDashboardStats(): Promise<DashboardStats> {
  // TODO: Replace with real endpoint when backend implements /api/dashboard/stats
  // For now, return mock data until backend is ready
  return Promise.resolve({
    totalAccounts: 3,
    activeAccounts: 2,
    postsToday: 5,
    postsThisWeek: 24,
    errorRate: 2.1,
    nextPosts: [
      {
        id: '1',
        content: 'Exciting news coming soon! 🚀',
        mediaUrls: [],
        scheduledAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        status: 'scheduled' as const,
        accountId: 'acc-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ]
  });
}

// Analytics API
export async function getAnalytics(params?: { accountId?: string; dateFrom?: string; dateTo?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.accountId) searchParams.append('accountId', params.accountId);
  if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) searchParams.append('dateTo', params.dateTo);

  const queryString = searchParams.toString();
  return request(`/analytics${queryString ? `?${queryString}` : ''}`);
}
