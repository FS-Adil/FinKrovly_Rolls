import ReportTab from './ReportTab';
import type { ColumnDef, ReportRow } from '../../api/types';

interface GoodsRow extends ReportRow {
  sku: string;
  name: string;
  unit: string;
  quantity: number;
  price: number;
}

const columns: ColumnDef<GoodsRow>[] = [
  { key: 'sku',      title: 'Артикул' },
  { key: 'name',     title: 'Наименование' },
  { key: 'unit',     title: 'Ед.' },
  { key: 'quantity', title: 'Остаток', type: 'number' },
  { key: 'price',    title: 'Цена',    type: 'number' }
];

export default function GoodsTab() {
  return (
    <ReportTab<GoodsRow>
      title="Отчёт об остатках товаров"
      report="goods"
      showDates={false}
      columns={columns}
    />
  );
}