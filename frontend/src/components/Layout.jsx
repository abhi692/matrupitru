import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-left">
          <span className="logo">MatruPitru</span>
          {user && <span className="role-badge">{user.role.replace('_', ' ')}</span>}
        </div>
        {user && (
          <div className="app-header-right">
            <span>{user.name}</span>
            <button onClick={onLogout}>Log out</button>
          </div>
        )}
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
