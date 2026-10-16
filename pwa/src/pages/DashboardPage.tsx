import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BottomTabs from '../components/ButtomTabs';
import SettingsTab from '../tabs/SettingsTab';
import FinancialTab from './tabs/FinancialTab';
import SalesTab from './tabs/SalesTab';
import RollsTab from '../tabs/RollsTab';
import GoodsTab from './tabs/GoodsTab';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';
  const defaultPath = isAdmin ? '/app/settings' : '/app/financial';

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__user">
          <div className="app__user-name">{user.fullName || user.username}</div>
          <div className="app__user-org">{user.organization}</div>
        </div>
        <button className="btn btn--ghost" onClick={logout}>Выйти</button>
      </header>

      <main className="app__content">
        <Routes>
          <Route path="/" element={<Navigate to={defaultPath} replace />} />
          {isAdmin && <Route path="settings" element={<SettingsTab />} />}
          <Route path="financial" element={<FinancialTab />} />
          <Route path="sales" element={<SalesTab />} />
          <Route path="rolls" element={<RollsTab />} />
          <Route path="goods" element={<GoodsTab />} />
          <Route path="*" element={<Navigate to={defaultPath} replace />} />
        </Routes>
      </main>

      <BottomTabs role={user.role} />
    </div>
  );
}