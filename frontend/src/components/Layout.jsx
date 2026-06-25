import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HeartHandshake, LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Badge } from './ui/Badge';
import { cn } from '../lib/utils';

const NAV_BY_ROLE = {
  buyer: [
    { to: '/buyer', label: 'Dashboard' },
    { to: '/buyer/book', label: 'Book a service' },
    { to: '/buyer/billing', label: 'Billing' },
    { to: '/buyer/sos', label: 'SOS' },
  ],
  care_manager: [{ to: '/care_manager', label: 'Console' }],
  caregiver: [{ to: '/caregiver', label: 'My visits' }],
  parent: [{ to: '/parent', label: 'Home' }],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function onLogout() {
    logout();
    navigate('/login');
  }

  const navItems = user ? NAV_BY_ROLE[user.role] || [] : [];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white">
                <HeartHandshake className="h-4.5 w-4.5" />
              </span>
              <span className="font-bold text-brand-700 text-lg">MatruPitru</span>
            </Link>
            {user && (
              <Badge variant="brand" className="capitalize hidden sm:inline-flex">
                {user.role.replace('_', ' ')}
              </Badge>
            )}
            {navItems.length > 0 && (
              <nav className="hidden md:flex items-center gap-1 ml-2">
                {navItems.map((item) => {
                  const active = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        'px-3 py-1.5 rounded-control text-sm font-medium transition-colors',
                        active ? 'bg-brand-50 text-brand-700' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
          {user && (
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm text-stone-600 hidden sm:inline">{user.name}</span>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-rose-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          )}
        </div>
        {navItems.length > 0 && (
          <nav className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'px-3 py-1.5 rounded-control text-sm font-medium whitespace-nowrap transition-colors',
                    active ? 'bg-brand-50 text-brand-700' : 'text-stone-500 hover:bg-stone-50'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
