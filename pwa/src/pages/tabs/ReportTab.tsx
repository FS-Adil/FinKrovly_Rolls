import { useState, type ChangeEvent } from 'react';
import { api, ApiError } from '../../api/client';
import type { ColumnDef, ReportName, ReportRow } from '../../api/types';
import { formatDate, formatNumber } from '../../utils/format';

export interface ReportTabProps<T extends ReportRow> {
  title: string;
  report: ReportName;
  showDates?: boolean;
  columns: ColumnDef<T>[];
}

function normalize<T extends ReportRow>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && 'rows' in data) {
    const rows = (data as { rows: unknown }).rows;
    if (Array.isArray(rows)) return rows as T[];
  }
  return [];
}

export default function ReportTab<T extends ReportRow>({
  title,
  report,
  showDates = true,
  columns
}: ReportTabProps<T>) {
  const today = new Date();
  const monthAgo = new Date(today.getTime() - 30 * 24 * 3600 * 1000);

  const [from, setFrom] = useState(monthAgo.toISOString().slice(0, 10));
  const [to, setTo] = useState(today.toISOString().slice(0, 10));
  const [rows, setRows] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculate = async () => {
    setLoading(true);
    setError('');
    try {
      const params = showDates ? { from, to } : {};
      const data = await api.calculate(report, params);
      setRows(normalize<T>(data));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Ошибка расчёта');
      setRows(null);
    } finally {
      setLoading(false);
    }
  };

  const cellValue = (row: T, key: keyof T & string, type?: ColumnDef<T>['type']) => {
    const v = row[key];
    if (type === 'number') return formatNumber(v as number | string | null | undefined);
    if (type === 'date') return formatDate(v as string | null | undefined);
    return v == null ? '—' : String(v);
  };

  return (
    <div className="report">
      <h2 className="report__title">{title}</h2>

      <div className="report__filters">
        {showDates && (
          <>
            <label>
              С
              <input
                type="date"
                value={from}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFrom(e.target.value)}
              />
            </label>
            <label>
              По
              <input
                type="date"
                value={to}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTo(e.target.value)}
              />
            </label>
          </>
        )}
        <button className="btn btn--primary" onClick={calculate} disabled={loading}>
          {loading ? 'Считаем…' : 'Рассчитать'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {rows && rows.length === 0 && <div className="empty">Нет данных</div>}

      {rows && rows.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {columns.map(c => (
                  <th key={c.key}>{c.title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {columns.map(c => (
                    <td key={c.key}>{cellValue(r, c.key, c.type)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}