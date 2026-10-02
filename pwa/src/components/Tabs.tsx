interface Tab {
  id: string
  label: string
  icon?: string
}

interface Props {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
}

/**
 * Панель вкладок для подвала приложения.
 * Отображается как иконка + подпись, активная подсвечивается.
 */
export default function Tabs({ tabs, active, onChange }: Props) {
  return (
    <nav className="tabs" role="tablist">
      {tabs.map(t => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          className={`tab ${active === t.id ? 'tab--active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.icon && <span className="tab__icon" aria-hidden>{t.icon}</span>}
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}