import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../api/client';
import { getRolls, refreshRolls } from './rollsCache';
import './RollsTab.css';

/* ============================ ТИПЫ ============================ */

interface RollItem {
  id?: string | number;
  batch?: string | null;
  pricePerSquareMeter?: number | null;
  pricePerTon?: number | null;
  areaSquareMeters?: number | null;
  weightTons?: number | null;
  batchDate?: string | null;
}

interface RollGroup {
  id: string;
  title: string;
  type: 'roll';
  data: RollItem[];
}

interface ManufacturerGroup {
  id: string;
  title: string;
  type: 'manufacturer';
  organizationName: string;
  data: RollGroup[];
}

interface OrganizationGroup {
  id: string;
  title: string;
  type: 'organization';
  data: ManufacturerGroup[];
}

interface Product {
  id?: string | number;
  name?: string;
  organization?: string;
  manufacturer?: string;
  batch?: string | null;
  pricePerSquareMeter?: number | null;
  pricePerTon?: number | null;
  areaSquareMeters?: number | null;
  weightTons?: number | null;
  batchDate?: string | null;
}

/* ======================= УТИЛИТЫ ======================= */

const normalizeText = (text?: string | null) =>
  text?.toString().toLowerCase().replace(/\s+/g, ' ').trim() || '';

const getSearchTokens = (query: string) =>
  normalizeText(query).split(' ').filter(t => t.length > 0);

const containsAllTokens = (text: string, tokens: string[]) => {
  const normalizedText = normalizeText(text);
  return tokens.every(token => normalizedText.includes(token));
};

const groupProducts = (products: Product[]): OrganizationGroup[] => {
  if (!products?.length) return [];

  const grouped = new Map<string, Map<string, Map<string, Product[]>>>();

  for (const product of products) {
    if (!product) continue;
    const org = product.organization || 'Без организации';
    const manufacturer = product.manufacturer || 'Без производителя';
    const rollName = product.name || 'Без названия';

    if (!grouped.has(org)) grouped.set(org, new Map());
    const orgMap = grouped.get(org)!;

    if (!orgMap.has(manufacturer)) orgMap.set(manufacturer, new Map());
    const manufMap = orgMap.get(manufacturer)!;

    if (!manufMap.has(rollName)) manufMap.set(rollName, []);
    manufMap.get(rollName)!.push(product);
  }

  const result: OrganizationGroup[] = [];
  const orgs = Array.from(grouped.keys()).sort();

  for (const org of orgs) {
    const manufacturers = grouped.get(org)!;
    const manufacturerData: ManufacturerGroup[] = [];
    const manufKeys = Array.from(manufacturers.keys()).sort();

    for (const manufacturer of manufKeys) {
      const rollNames = manufacturers.get(manufacturer)!;
      const rollData: RollGroup[] = [];
      const rollKeys = Array.from(rollNames.keys()).sort();

      for (const rollName of rollKeys) {
        const items = rollNames.get(rollName)!;
        if (items.length > 0) {
          rollData.push({
            title: rollName,
            data: items as RollItem[],
            type: 'roll',
            id: `${org}_${manufacturer}_${rollName}`,
          });
        }
      }

      if (rollData.length > 0) {
        manufacturerData.push({
          title: manufacturer,
          data: rollData,
          type: 'manufacturer',
          organizationName: org,
          id: `${org}_${manufacturer}`,
        });
      }
    }

    if (manufacturerData.length > 0) {
      result.push({ title: org, data: manufacturerData, type: 'organization', id: org });
    }
  }

  return result;
};

const filterSections = (sections: OrganizationGroup[], query: string) => {
  if (!sections?.length) return [];
  if (!query.trim()) return sections;

  const tokens = getSearchTokens(query);
  if (tokens.length === 0) return sections;

  const filtered: OrganizationGroup[] = [];

  for (const org of sections) {
    if (!org?.data) continue;
    const filteredManuf: ManufacturerGroup[] = [];

    for (const manuf of org.data) {
      if (!manuf?.data) continue;
      const filteredRolls: RollGroup[] = [];

      for (const roll of manuf.data) {
        if (!roll?.data) continue;
        let matches = false;

        for (const item of roll.data) {
          if (!item) continue;
          const searchableText = [
            roll.title || '',
            manuf.title || '',
            org.title || '',
            (item as any).name || '',
            (item as any).manufacturer || '',
            (item as any).organization || '',
            item.batch || '',
            item.pricePerSquareMeter?.toString() || '',
            item.pricePerTon?.toString() || '',
            item.areaSquareMeters?.toString() || '',
            item.weightTons?.toString() || '',
            item.batchDate ? new Date(item.batchDate).toLocaleDateString() : '',
          ].join(' ');

          if (containsAllTokens(searchableText, tokens)) {
            matches = true;
            break;
          }
        }

        if (matches) filteredRolls.push(roll);
      }

      if (filteredRolls.length > 0) {
        filteredManuf.push({ ...manuf, data: filteredRolls });
      }
    }

    if (filteredManuf.length > 0) {
      filtered.push({ ...org, data: filteredManuf });
    }
  }

  return filtered;
};

/** Адаптер: сырая строка API → Product, который ждёт groupProducts. */
const mapRowToProduct = (row: import('../../api/client').RollsApiRow): Product => ({
  id: row.id ?? row.sku,
  name: row.name,
  organization: row.organization,
  manufacturer: row.manufacturer,
  batch: row.batch,
  pricePerSquareMeter: row.pricePerSquareMeter,
  pricePerTon: row.pricePerTon,
  areaSquareMeters: row.areaSquareMeters ?? row.quantity ?? null,
  weightTons: row.weightTons ?? row.weight ?? null,
  batchDate: row.batchDate,
});

/* ======================= ПОДКОМПОНЕНТЫ ======================= */

function RollTable({ items }: { items: RollItem[] }) {
  if (!items?.length) return null;

  const totalArea = items.reduce((s, i) => s + (i.areaSquareMeters || 0), 0);
  const totalWeight = items.reduce((s, i) => s + (i.weightTons || 0), 0);

  return (
    <div className="roll-table-wrap">
      <table className="roll-table">
        <thead>
          <tr>
            <th>Партия</th>
            <th>Цена м²</th>
            <th>Цена тонна</th>
            <th>Остаток м²</th>
            <th>Остаток тонн</th>
            <th>Дата партии</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id ?? index} className={index % 2 === 0 ? 'even' : 'odd'}>
              <td>{item.batch || 'Н/Д'}</td>
              <td>{item.pricePerSquareMeter?.toLocaleString() ?? 0} ₽</td>
              <td>{item.pricePerTon?.toLocaleString() ?? 0} ₽</td>
              <td>{item.areaSquareMeters?.toLocaleString() ?? 0} м²</td>
              <td>{item.weightTons?.toFixed(3) ?? 0} т</td>
              <td>{item.batchDate ? new Date(item.batchDate).toLocaleDateString() : 'Н/Д'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Итого:</td>
            <td />
            <td />
            <td>{totalArea.toLocaleString()} м²</td>
            <td>{totalWeight.toFixed(3)} т</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function RollItemView({ roll }: { roll: RollGroup }) {
  if (!roll?.data?.length) return null;

  return (
    <div className="roll-card">
      <div className="roll-card__header">
        <span className="roll-card__icon">📄</span>
        <span className="roll-card__name">{roll.title || 'Без названия'}</span>
        <span className="roll-card__badge">{roll.data.length} парт.</span>
      </div>
      <RollTable items={roll.data} />
    </div>
  );
}

interface ManufacturerProps {
  manufacturer: ManufacturerGroup;
  organizationTitle: string;
  isCollapsed: boolean;
  onToggle: (key: string) => void;
}

function ManufacturerSection({ manufacturer, organizationTitle, isCollapsed, onToggle }: ManufacturerProps) {
  if (!manufacturer?.title) return null;
  const key = `${organizationTitle}_${manufacturer.title}`;

  return (
    <div className="manufacturer">
      <button type="button" className="manufacturer__header" onClick={() => onToggle(key)}>
        <span className="manufacturer__title">
          <span className="chevron">{isCollapsed ? '▶' : '▼'}</span>
          <span className="manufacturer__icon">🏭</span>
          {manufacturer.title}
        </span>
        <span className="manufacturer__badge">{manufacturer.data?.length ?? 0} цвет.</span>
      </button>

      {!isCollapsed && manufacturer.data?.map(roll => (
        <RollItemView key={roll.id ?? roll.title} roll={roll} />
      ))}
    </div>
  );
}

interface OrganizationProps {
  organization: OrganizationGroup;
  collapsedOrganizations: Record<string, boolean>;
  collapsedManufacturers: Record<string, boolean>;
  onToggleOrganization: (name: string) => void;
  onToggleManufacturer: (key: string) => void;
}

function OrganizationSection({
  organization,
  collapsedOrganizations,
  collapsedManufacturers,
  onToggleOrganization,
  onToggleManufacturer,
}: OrganizationProps) {
  if (!organization?.title) return null;
  const isCollapsed = !!collapsedOrganizations[organization.title];

  let totalPositions = 0;
  organization.data?.forEach(m => m.data?.forEach(r => { totalPositions += r.data?.length ?? 0; }));

  return (
    <section className="organization">
      <button type="button" className="organization__header" onClick={() => onToggleOrganization(organization.title)}>
        <span className="organization__title">
          <span className="chevron">{isCollapsed ? '▶' : '▼'}</span>
          <span className="organization__icon">🏠</span>
          {organization.title}
        </span>
        <span className="organization__info">
          <span>{totalPositions} рул.</span>
          <span>{organization.data?.length ?? 0} произв.</span>
        </span>
      </button>

      {!isCollapsed && organization.data?.map(manufacturer => {
        const key = `${organization.title}_${manufacturer.title}`;
        return (
          <ManufacturerSection
            key={manufacturer.id ?? key}
            manufacturer={manufacturer}
            organizationTitle={organization.title}
            isCollapsed={!!collapsedManufacturers[key]}
            onToggle={onToggleManufacturer}
          />
        );
      })}
    </section>
  );
}

/* ======================= ГЛАВНЫЙ КОМПОНЕНТ ======================= */

export default function RollsTab() {
  const [sections, setSections] = useState<OrganizationGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [collapsedOrganizations, setCollapsedOrganizations] = useState<Record<string, boolean>>({});
  const [collapsedManufacturers, setCollapsedManufacturers] = useState<Record<string, boolean>>({});

  const load = useCallback(async (force = false) => {
    setIsLoading(true);
    setErr(null);
    try {
      const rows = force ? await refreshRolls() : await getRolls();
      setSections(groupProducts(rows.map(mapRowToProduct)));
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Ошибка загрузки данных');
      setSections([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredSections = useMemo(
    () => (searchQuery.trim() ? filterSections(sections, searchQuery) : sections),
    [sections, searchQuery]
  );

  const searchResultsCount = useMemo(() => {
    if (!searchQuery.trim() || !filteredSections.length) return null;
    let count = 0;
    filteredSections.forEach(org => org.data?.forEach(m => m.data?.forEach(r => {
      count += r.data?.length ?? 0;
    })));
    return count;
  }, [filteredSections, searchQuery]);

  const toggleOrganization = useCallback((name: string) => {
    setCollapsedOrganizations(p => ({ ...p, [name]: !p[name] }));
  }, []);

  const toggleManufacturer = useCallback((key: string) => {
    setCollapsedManufacturers(p => ({ ...p, [key]: !p[key] }));
  }, []);

  const collapseAll = useCallback(() => {
    const orgs: Record<string, boolean> = {};
    const manufs: Record<string, boolean> = {};
    sections.forEach(org => {
      orgs[org.title] = true;
      org.data?.forEach(m => { manufs[`${org.title}_${m.title}`] = true; });
    });
    setCollapsedOrganizations(orgs);
    setCollapsedManufacturers(manufs);
  }, [sections]);

  const expandAll = useCallback(() => {
    setCollapsedOrganizations({});
    setCollapsedManufacturers({});
  }, []);

  return (
    <div className="rolls-page">
      <div className="rolls-page__toolbar">
        <h2 className="rolls-page__title">Список рулонов</h2>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => load(true)}
          disabled={isLoading}
        >
          {isLoading ? 'Загрузка…' : 'Обновить'}
        </button>
      </div>

      <div className="rolls-page__search">
        <input
          type="search"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Поиск по всем параметрам..."
        />
      </div>

      {searchResultsCount !== null && (
        <div className="rolls-page__results">Найдено: {searchResultsCount} позиций</div>
      )}

      {filteredSections.length > 0 && (
        <div className="rolls-page__controls">
          <button type="button" className="btn" onClick={collapseAll}>Свернуть все</button>
          <button type="button" className="btn" onClick={expandAll}>Развернуть все</button>
        </div>
      )}

      {err && (
        <div className="error" onClick={() => setErr(null)} role="alert">{err}</div>
      )}

      {!isLoading && filteredSections.length === 0 && !err && (
        <div className="empty">
          {searchQuery ? 'По вашему запросу ничего не найдено' : 'Товары не найдены'}
        </div>
      )}

      {filteredSections.map(org => (
        <OrganizationSection
          key={org.id ?? org.title}
          organization={org}
          collapsedOrganizations={collapsedOrganizations}
          collapsedManufacturers={collapsedManufacturers}
          onToggleOrganization={toggleOrganization}
          onToggleManufacturer={toggleManufacturer}
        />
      ))}
    </div>
  );
}