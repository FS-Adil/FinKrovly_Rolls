import React from 'react'
import Tabs from './Tabs'

export interface ShellTab {
  id: string
  label: string
  icon?: string
}

interface Props {
//   onLogout: () => void
  tabs: ShellTab[]
  activeTab: string
  onTabChange: (id: string) => void
  children: React.ReactNode
}

/**
 * Каркас приложения: трёхстрочный grid.
 *  - header (профиль) — сверху, фиксированный
 *  - main   (данные)  — по центру, растягивается и скроллится
 *  - footer (вкладки) — снизу, фиксированный
 */
export default function AppShell({
//   onLogout,
  tabs,
  activeTab,
  onTabChange,
  children
}: Props) {
  return (
    <div className="app-shell">
      {/* <header className="app-header">
        <ProfileCard user={user} onLogout={onLogout} />
      </header> */}

      <main className="app-main">
        <div className="app-main__inner">{children}</div>
      </main>

      <footer className="app-footer">
        <Tabs tabs={tabs} active={activeTab} onChange={onTabChange} />
      </footer>
    </div>
  )
}