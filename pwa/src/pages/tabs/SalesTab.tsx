import ReportTab from './ReportTab';
import type { ColumnDef, ReportRow } from '../../api/types';

interface SalesRow extends ReportRow {
  date: string;
  product: string;
  quantity: number;
  amount: number;
}

const columns: ColumnDef<SalesRow>[] = [
  { key: 'date',     title: 'Дата',   type: 'date' },
  { key: 'product',  title: 'Товар' },
  { key: 'quantity', title: 'Кол-во', type: 'number' },
  { key: 'amount',   title: 'Сумма',  type: 'number' }
];

export default function SalesTab() {
  return (
    <ReportTab<SalesRow>
      title="Отчёт о продажах за период"
      report="sales"
      showDates
      columns={columns}
    />
  );
}