import ReportTab from './ReportTab';
import type { ColumnDef, ReportRow } from '../../api/types';

interface FinancialRow extends ReportRow {
  period: string;
  revenue: number;
  cost: number;
  profit: number;
}

const columns: ColumnDef<FinancialRow>[] = [
  { key: 'period',  title: 'Период',       type: 'date' },
  { key: 'revenue', title: 'Выручка',      type: 'number' },
  { key: 'cost',    title: 'Себестоимость', type: 'number' },
  { key: 'profit',  title: 'Прибыль',      type: 'number' }
];

export default function FinancialTab() {
  return (
    <ReportTab<FinancialRow>
      title="Финансовый отчёт"
      report="financial"
      showDates
      columns={columns}
    />
  );
}