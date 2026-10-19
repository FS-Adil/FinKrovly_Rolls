import type {
  LoginResponse,
  ReportName,
  ReportParams,
  ReportResponse,
  User
} from './types';

const APP_BASE = import.meta.env.VITE_APP_BASE;
const BFF_URL = import.meta.env.VITE_BFF_URL;
const BASE = `${BFF_URL}/api`;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  /** Не редиректить на /login при 401 (для проверочных запросов вроде /auth/me) */
  skipAuthRedirect?: boolean;
}

function redirectToLogin(): void {
  const loginPath = `${APP_BASE.replace(/\/$/, '')}/login`;
  // Уже на странице логина — не редиректим, иначе получим петлю
  if (window.location.pathname === loginPath) return;
  window.location.href = loginPath;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuthRedirect, ...fetchOptions } = options;

  const res = await fetch(BASE + path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers ?? {})
    },
    ...fetchOptions
  });

  if (res.status === 401) {
    if (!skipAuthRedirect) {
      redirectToLogin();
    }
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
      body: JSON.stringify({ email, password }),
      skipAuthRedirect: true // 401 здесь = неверные креды, редирект не нужен
    }),

  logout: (): Promise<void> =>
    request<void>('/auth/logout', { method: 'POST' }),

  me: (opts?: { skipAuthRedirect?: boolean }): Promise<User> =>
    request<User>('/auth/me', { skipAuthRedirect: opts?.skipAuthRedirect }),

  calculate: (report: ReportName, params: ReportParams = {}): Promise<ReportResponse> =>
    request<ReportResponse>(`/reports/${report}`, {
      method: 'POST',
      body: JSON.stringify(params)
    })
};