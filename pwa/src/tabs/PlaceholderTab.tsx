/** Универсальная заглушка для вкладок, которые не несут логики в примере. */
export default function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p style={{ color: '#666' }}>Раздел в разработке.</p>
    </div>
  )
}