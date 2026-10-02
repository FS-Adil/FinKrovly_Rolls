export default function WelcomeScreen({ onLoginClick }: { onLoginClick: () => void }) {
  return (
    <div className="container">
      <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <h1>Добро пожаловать 👋</h1>
        <p style={{ color: '#666', maxWidth: 500, margin: '16px auto' }}>
            Данное приложение разработано для внутреннего пользования сотрудниками компании ФинКровля. 
            Для входа в приложение, перейдите на Домашнюю страницу и авторизуйтесь. 
            Если у Вас нет учетной записи для входа в приложение, обратитесь в ИТ-отдел компании ФинКровля.
        </p>
        <button className="btn-primary" onClick={onLoginClick}>Войти</button>
      </div>
    </div>
  )
}