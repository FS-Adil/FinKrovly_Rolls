import { useState } from 'react'

/** Вкладка «Настройки» — доступна только роли admin. */
export default function SettingsTab() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'user' | 'admin'>('user')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  return (
    <div className="card">
      <h3>Регистрация нового пользователя</h3>
    </div>
  )
}