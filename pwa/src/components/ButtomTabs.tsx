import { NavLink } from 'react-router-dom';
import type { Role } from '../api/types';

export interface TabDef {
  to: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const TABS: TabDef[] = [
  { to: '/app/settings',  label: 'Настройки', icon: '⚙️', adminOnly: true },
  { to: '/app/financial', label: 'Финансы',   icon: '💰' },
  { to: '/app/sales',     label: 'Продажи',   icon: '📈' },
  { to: '/app/rolls',     label: 'Рулоны',    icon: '🧻' },
  { to: '/app/goods',     label: 'Товары',    icon: '📦' }
];

export default function BottomTabs({ role }: { role: Role }) {
  const visible = TABS.filter(t => !t.adminOnly || role === 'ADMIN');
  return (
    <nav className="tabs">
      {visible.map(t => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) =>
            'tabs__item' + (isActive ? ' tabs__item--active' : '')
          }
        >
          <span className="tabs__icon">{t.icon}</span>
          <span className="tabs__label">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}