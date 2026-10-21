export type Role = 'ADMIN' | 'USER';

/** Плоский пользователь, которым оперирует фронт. */
export interface User {
  username: string;
  fullName: string;
  role: Role;
  organization: string;
}

/** Конверт, в котором бэк отдаёт все ответы. */
export interface ApiEnvelope<T> {
  code: number;
  status: string;
  message: string;
  data: T;
  timestamp: string;
  traceId: string;
}

/** Полезная нагрузка /auth/me и /auth/login. */
export interface AuthPayload {
  user: {
    id: number;
    email: string;
    role: Role;
    // если бэк отдаёт ФИО — добавь сюда:
    fullName?: string;
    name?: string;
  };
  organization: {
    id: string;
    name: string;
  };
}

/** То, что реально возвращает /auth/me и /auth/login. */
export type AuthResponse = ApiEnvelope<AuthPayload>;

export interface ReportParams {
  from?: string;
  to?: string;
}

export type ReportRow = Record<string, string | number | null | undefined>;

export interface ReportResponseRows {
  rows: ReportRow[];
}

export type ReportResponse = ReportRow[] | ReportResponseRows;

export type ReportName = 'financial' | 'sales' | 'rolls' | 'goods';

export interface ColumnDef<T = ReportRow> {
  key: keyof T & string;
  title: string;
  type?: 'number' | 'date' | 'string';
}