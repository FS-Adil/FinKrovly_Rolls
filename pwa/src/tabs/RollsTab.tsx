import { useState } from 'react'

/** Вкладка «Рулоны» — доступна всем аутентифицированным пользователям. */
export default function RollsTab() {
  const [count, setCount] = useState('')
  const [comment, setComment] = useState('')
  const [result, setResult] = useState<string>('')


  return (
    <div className="card">
      <h3>Отправка данных о рулонах</h3>
    </div>
  )
}