import type {
  LoginResponse,
  ReportName,
  ReportParams,
  ReportResponse,
  User
} from './types'

const BASE = '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  _retry?: boolean;
}

let refreshing: Promise<Response> | null = null;

async function refreshSession(): Promise<Response> {
  if (!refreshing) {
    refreshing = fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    }).finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await fetch(BASE + path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    },
    ...options
  });

  if (res.status === 401 && !options._retry) {
    const r = await refreshSession();
    if (r.ok) {
      return request<T>(path, { ...options, _retry: true });
    }
    window.location.href = '/login';
    throw new ApiError('Unauthorized', 401);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || `HTTP ${res.status}`, res.status);
  }

  if (res.status === 204) return undefined as T;

  const ct = res.headers.get('content-type') ?? '';
  return (ct.includes('application/json') ? await res.json() : await res.text()) as T;
}

export const api = {
  login: (email: string, password: string): Promise<LoginResponse> =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  logout: (): Promise<void> =>
    request<void>('/auth/logout', { method: 'POST' }),

  me: (): Promise<User> =>
    request<User>('/auth/me'),

  calculate: (report: ReportName, params: ReportParams = {}): Promise<ReportResponse> =>
    request<ReportResponse>(`/reports/${report}`, {
      method: 'POST',
      body: JSON.stringify(params)
    })
};