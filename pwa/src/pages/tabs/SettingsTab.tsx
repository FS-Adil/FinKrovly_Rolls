import { useAuth } from '../../context/AuthContext';

export default function SettingsTab() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="report">
      <h2 className="report__title">Настройки</h2>
      <div className="card card--flat">
        <p><b>Пользователь:</b> {user.username}</p>
        <p><b>Организация:</b> {user.organization}</p>
        <p><b>Роль:</b> {user.role}</p>
      </div>
    </div>
  );
}