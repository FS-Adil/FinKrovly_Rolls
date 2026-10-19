import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../api/client';

export default function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Если пользователь уже вошёл — уводим на /app. 401 здесь ожидаем и НЕ редиректит.
  useEffect(() => {
    let cancelled = false;
    api
      .me({ skipAuthRedirect: true })
      .then(() => {
        if (!cancelled) nav('/app', { replace: true });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          // Нормальный сценарий: показываем форму логина
          setChecking(false);
        } else {
          setError(err instanceof ApiError ? err.message : 'Не удалось проверить сессию');
          setChecking(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [nav]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      nav('/app', { replace: true });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Не удалось войти';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="login">
        <div className="card">Проверяем сессию…</div>
      </div>
    );
  }

  return (
    <div className="login">
      <form className="card" onSubmit={onSubmit}>
        <h2>Вход</h2>
        <label>
          Логин
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          Пароль
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <div className="error">{error}</div>}
        <button className="btn btn--primary" disabled={loading}>
          {loading ? 'Входим…' : 'Войти'}
        </button>
      </form>
    </div>
  );
}