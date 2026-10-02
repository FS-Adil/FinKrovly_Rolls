import { useState, type JSX } from 'react'
// import { useAuth } from '../auth/AuthContext'
import SettingsTab from '../tabs/SettingsTab'
import RollsTab from '../tabs/RollsTab'
import PlaceholderTab from '../tabs/PlaceholderTab'

interface TabDef {
  id: string
  label: string
  icon: string           // эмодзи-иконка для tabbar
  adminOnly?: boolean
  render: () => JSX.Element
}

/**
 * Дашборд: сверху профиль, снизу — фиксированная панель вкладок.
 * Для admin — 4 вкладки (включая Настройки),
 * для user — 3 вкладки (без Настроек).
 */
export default function Dashboard() {
//   const { user, logout } = useAuth()
//   if (!user) return null

//   const isAdmin = user.roles.includes('admin')

  const allTabs: TabDef[] = [
    { id: 'overview', label: 'Обзор',    icon: '🏠', render: () => <PlaceholderTab title="Обзор" /> },
    { id: 'rolls',    label: 'Рулоны',   icon: '📦', render: () => <RollsTab /> },
    { id: 'reports',  label: 'Отчёты',   icon: '📊', render: () => <PlaceholderTab title="Отчёты" /> },
    { id: 'settings', label: 'Настройки', icon: '⚙️', adminOnly: true, render: () => <SettingsTab /> },
  ]

  const tabs = allTabs.filter(t => !t.adminOnly || true)
  const [active, setActive] = useState(tabs[0].id)
  const activeTab = tabs.find(t => t.id === active) ?? tabs[0]

  return (
    <div className="dashboard">
      {/* -------- HEADER: профиль --------
      <header className="dashboard-header">
        <div className="inner">
          <div className="profile-info">
            <h2>{user.username}</h2>
            <p className="meta">ID: {user.userId}</p>
            <div className="roles">
              {user.roles.map(r => (
                <span key={r} className={`role-badge ${r === 'admin' ? 'admin' : ''}`}>
                  {r}
                </span>
              ))}
            </div>
          </div>
          <button className="btn-ghost" onClick={logout}>Выйти</button>
        </div>
      </header> */}

      {/* -------- MAIN: контент активной вкладки -------- */}
      <main className="dashboard-main">
        {activeTab.render()}
      </main>

      {/* -------- TABBAR: фиксированная панель вкладок снизу -------- */}
      <nav className="tabbar" role="tablist">
        <div className="tabbar-inner">
          {tabs.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={active === t.id}
              className={`tab ${active === t.id ? 'active' : ''}`}
              onClick={() => setActive(t.id)}
            >
              <span className="tab-icon" aria-hidden>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}