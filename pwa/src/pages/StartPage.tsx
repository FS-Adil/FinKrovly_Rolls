import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function StartPage() {
  const nav = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) nav('/app', { replace: true });
  }, [user, nav]);

  return (
    <div className="start">
      <div className="start__logo">📊</div>
      <h1 className="start__title">Reports PWA</h1>
      <p className="start__sub">Отчёты и аналитика в одном месте</p>
      <button className="btn btn--primary btn--xl" onClick={() => nav('/login')}>
        Войти
      </button>
    </div>
  );
}