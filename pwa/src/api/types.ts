export type Role = 'ADMIN' | 'USER';

export interface User {
  username: string;
  fullName: string;
  role: Role;
  organization: string;
}

export interface LoginResponse {
  username: string;
  fullName: string;
  role: Role;
  organization: string;
}

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