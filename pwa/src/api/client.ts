import type {
  ApiEnvelope,
  AuthPayload,
  AuthResponse,
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

/* ======================= CSRF ======================= */

/** Читает cookie по имени. Spring кладёт CSRF-токен в cookie `XSRF-TOKEN`. */
function getCookie(name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + escaped + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Методы, для которых Spring Security требует CSRF-токен. */
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Страховка: если cookie `XSRF-TOKEN` ещё нет — делаем GET /auth/me,
 * чтобы CsrfFilter сгенерировал токен и выставил cookie.
 */
let csrfWarmed = false;
async function ensureCsrf(): Promise<void> {
  if (csrfWarmed || getCookie('XSRF-TOKEN')) {
    csrfWarmed = true;
    return;
  }
  try {
    await fetch(BASE + '/auth/me', { credentials: 'include', method: 'GET' });
  } catch {
    // игнорируем — если и тут ошибка, сам запрос вернёт 401/403
  } finally {
    csrfWarmed = true;
  }
}

/* ======================= АДАПТЕРЫ БЭК → ФРОНТ ======================= */

/** Разворачивает конверт `{ code, data, ... }` → `data`. */
function unwrap<T>(envelope: ApiEnvelope<T>): T {
  return envelope.data;
}

/** Мапит payload бэка (`{ user, organization }`) в плоский `User`. */
function mapAuthPayload(payload: AuthPayload): User {
  const u = payload?.user;
  const org = payload?.organization;
  const email = u?.email ?? '';
  return {
    username: email,
    fullName: u?.fullName ?? u?.name ?? email,
    role: (u?.role as User['role']) ?? 'USER',
    organization: org?.name ?? ''
  };
}

/* ======================= REQUEST ======================= */

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuthRedirect, ...fetchOptions } = options;
  const method = (fetchOptions.method ?? 'GET').toUpperCase();
  const hasBody = fetchOptions.body != null;

  const headers: Record<string, string> = {
    // Content-Type нужен только когда есть тело; на GET он лишний
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(fetchOptions.headers as Record<string, string> ?? {})
  };

  // CSRF-заголовок для небезопасных методов
  if (UNSAFE_METHODS.has(method)) {
    const csrf = getCookie('XSRF-TOKEN');
    if (csrf) headers['X-XSRF-TOKEN'] = csrf;
  }

  const res = await fetch(BASE + path, {
    credentials: 'include',
    ...fetchOptions,
    method,
    headers
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

/* ======================= ТИПЫ ОТЧЁТА «РУЛОНЫ» ======================= */

/** Сырая строка отчёта «рулоны» — то, что реально приходит с бэка. */
export interface RollsApiRow {
  id?: string | number;
  sku?: string;
  name?: string;
  organization?: string;
  manufacturer?: string;
  batch?: string | null;
  pricePerSquareMeter?: number | null;
  pricePerTon?: number | null;
  areaSquareMeters?: number | null;
  weightTons?: number | null;
  quantity?: number | null;
  weight?: number | null;
  batchDate?: string | null;
  [key: string]: unknown;
}

function normalizeRows<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && 'rows' in data) {
    const rows = (data as { rows: unknown }).rows;
    if (Array.isArray(rows)) return rows as T[];
  }
  return [];
}

/* ======================= API ======================= */

export const api = {
  login: async (email: string, password: string): Promise<User> => {
    const envelope = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuthRedirect: true // 401 здесь = неверные креды, редирект не нужен
    });
    return mapAuthPayload(unwrap(envelope));
  },

  logout: (): Promise<void> =>
    request<void>('/auth/logout', { method: 'POST' }),

  me: async (opts?: { skipAuthRedirect?: boolean }): Promise<User> => {
    const envelope = await request<AuthResponse>('/auth/me', {
      skipAuthRedirect: opts?.skipAuthRedirect
    });
    return mapAuthPayload(unwrap(envelope));
  },

  calculate: (report: ReportName, params: ReportParams = {}): Promise<ReportResponse> =>
    request<ReportResponse>(`/v1/reports/${report}`, {
      method: 'POST',
      body: JSON.stringify(params)
    }),

  /** Отчёт «остатки рулонов» — уже нормализованный в массив строк. */
  rolls: async (params: ReportParams = {}): Promise<RollsApiRow[]> => {
    await ensureCsrf();
    const data = await request<ReportResponse>('/v1/reports/rolls', {
      method: 'POST',
      body: JSON.stringify(params)
    });
    return normalizeRows<RollsApiRow>(data);
  }
};