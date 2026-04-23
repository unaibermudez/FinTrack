import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, Globe, LayoutDashboard, User, LogOut, TrendingUp, Menu, X } from 'lucide-react';
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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

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
          {/* Language toggle — hidden on mobile (in drawer) */}
          <button
            onClick={toggleLanguage}
            title={t('nav.language')}
            className="hidden sm:flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-medium ft-text-2 hover:ft-text hover:ft-hover transition-colors cursor-pointer"
          >
            <Globe size={14} />
            <span className="uppercase">{i18n.language}</span>
          </button>

          {/* Theme toggle — hidden on mobile (in drawer) */}
          <button
            onClick={toggle}
            title={t('nav.theme')}
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg ft-text-2 hover:ft-text hover:ft-hover transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Divider — desktop only */}
          <div className="hidden sm:block h-5 w-px ft-border mx-1" />

          {/* Profile — desktop only */}
          <Link
            to="/profile"
            className={[
              'hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs transition-colors',
              isActive('/profile')
                ? 'ft-primary-subtle ft-primary font-medium'
                : 'ft-text-2 hover:ft-text hover:ft-hover',
            ].join(' ')}
          >
            <User size={13} />
            <span className="max-w-[100px] truncate">{user?.name ?? user?.email}</span>
          </Link>

          {/* Sign out — desktop only */}
          <button
            onClick={() => { logout(); navigate('/login'); }}
            title={t('auth.logout')}
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg ft-text-2 hover:text-[var(--negative)] hover:ft-negative-bg transition-colors cursor-pointer"
          >
            <LogOut size={13} />
          </button>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="sm:hidden h-8 w-8 flex items-center justify-center rounded-lg ft-text-2 hover:ft-text hover:ft-hover transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          className="sm:hidden border-t ft-border px-4 py-3 flex flex-col gap-1 animate-fade-in"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <Link
            to="/dashboard"
            className={[
              'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive('/dashboard')
                ? 'ft-primary-subtle ft-primary'
                : 'ft-text-2 hover:ft-text hover:ft-hover',
            ].join(' ')}
          >
            <LayoutDashboard size={15} />
            {t('nav.dashboard')}
          </Link>

          <Link
            to="/profile"
            className={[
              'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors',
              isActive('/profile')
                ? 'ft-primary-subtle ft-primary font-medium'
                : 'ft-text-2 hover:ft-text hover:ft-hover',
            ].join(' ')}
          >
            <User size={15} />
            {user?.name ?? user?.email}
          </Link>

          <div className="h-px ft-border my-1" />

          <div className="flex items-center gap-2 px-1">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm ft-text-2 hover:ft-text hover:ft-hover transition-colors cursor-pointer"
            >
              <Globe size={14} />
              <span className="uppercase font-medium">{i18n.language}</span>
            </button>

            <button
              onClick={toggle}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm ft-text-2 hover:ft-text hover:ft-hover transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>

          <div className="h-px ft-border my-1" />

          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm ft-text-2 hover:text-[var(--negative)] hover:ft-negative-bg transition-colors cursor-pointer text-left"
          >
            <LogOut size={15} />
            {t('auth.logout')}
          </button>
        </div>
      )}
    </nav>
  );
};
