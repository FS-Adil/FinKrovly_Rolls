export default function WelcomeScreen({ onLoginClick }: { onLoginClick: () => void }) {
  return (
    <div className="screen-center">
      <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
        <h1 style={{ marginTop: 0 }}>Добро пожаловать 👋</h1>
        <p style={{ color: 'var(--color-muted)', margin: '16px 0 28px' }}>
            Данное приложение разработано для внутреннего пользования сотрудниками компании ФинКровля. 
            Для входа в приложение, перейдите на Домашнюю страницу и авторизуйтесь. 
            Если у Вас нет учетной записи для входа в приложение, обратитесь в ИТ-отдел компании ФинКровля.
        </p>
        <button className="btn-primary" onClick={onLoginClick}>Войти</button>
      </div>
    </div>
  )
}