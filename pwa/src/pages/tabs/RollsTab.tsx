import ReportTab from './ReportTab';
import type { ColumnDef, ReportRow } from '../../api/types';

interface RollsRow extends ReportRow {
  sku: string;
  name: string;
  width: number;
  weight: number;
  quantity: number;
}

const columns: ColumnDef<RollsRow>[] = [
  { key: 'sku',      title: 'Артикул' },
  { key: 'name',     title: 'Наименование' },
  { key: 'width',    title: 'Ширина, мм', type: 'number' },
  { key: 'weight',   title: 'Вес, кг',    type: 'number' },
  { key: 'quantity', title: 'Остаток',    type: 'number' }
];

export default function RollsTab() {
  return (
    <ReportTab<RollsRow>
      title="Отчёт об остатках рулонов"
      report="rolls"
      showDates={false}
      columns={columns}
    />
  );
}