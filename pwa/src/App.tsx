import Dashboard from './components/Dashboard'

/**
 * Корневой компонент-роутер (без react-router — в примере хватает
 * простого переключения состояний).
 *
 * Логика:
 *  - loading        → сплэш
 *  - нет user       → Welcome / Login
 *  - есть user      → Dashboard
 */
export default function App() {
  return <Dashboard />
}