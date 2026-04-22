import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, Globe, LayoutDashboard, User, LogOut, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

export const Navbar = () => {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggle } = useThemeStore();
  const { t } = useTranslation();

  const toggleLanguage = () => {
    const next = i18n.language === 'en' ? 'es' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('fintrack_lang', next);
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav
      className="sticky top-0 z-40 border-b ft-border"
      style={{ backgroundColor: 'var(--bg-card)', backdropFilter: 'blur(12px)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-sm font-bold ft-text tracking-tight shrink-0 hover:opacity-80 transition-opacity"
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--primary)', color: 'white' }}
          >
            <TrendingUp size={14} strokeWidth={2.5} />
          </div>
          <span>FinTrack</span>
        </Link>

        {/* Center nav — hidden on mobile */}
        <div className="hidden sm:flex items-center gap-1">
          <Link
            to="/dashboard"
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150',
              isActive('/dashboard')
                ? 'ft-primary-subtle ft-primary'
                : 'ft-text-2 hover:ft-text hover:ft-hover',
            ].join(' ')}
          >
            <LayoutDashboard size={13} />
            {t('nav.dashboard')}
          </Link>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1">
          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            title={t('nav.language')}
            className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-medium ft-text-2 hover:ft-text hover:ft-hover transition-colors cursor-pointer"
          >
            <Globe size={14} />
            <span className="hidden sm:inline uppercase">{i18n.language}</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            title={t('nav.theme')}
            className="h-8 w-8 flex items-center justify-center rounded-lg ft-text-2 hover:ft-text hover:ft-hover transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Divider */}
          <div className="h-5 w-px ft-border mx-1" />

          {/* Profile */}
          <Link
            to="/profile"
            className={[
              'flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs transition-colors',
              isActive('/profile')
                ? 'ft-primary-subtle ft-primary font-medium'
                : 'ft-text-2 hover:ft-text hover:ft-hover',
            ].join(' ')}
          >
            <User size={13} />
            <span className="hidden sm:inline max-w-[100px] truncate">
              {user?.name ?? user?.email}
            </span>
          </Link>

          {/* Sign out */}
          <button
            onClick={() => { logout(); navigate('/login'); }}
            title={t('auth.logout')}
            className="h-8 w-8 flex items-center justify-center rounded-lg ft-text-2 hover:text-[var(--negative)] hover:ft-negative-bg transition-colors cursor-pointer"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </nav>
  );
};
