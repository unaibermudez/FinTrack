import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, Mail, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useTranslation } from 'react-i18next';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const registered = (location.state as { registered?: boolean })?.registered;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <div className="min-h-screen ft-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[380px] animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--primary)', color: 'white' }}
          >
            <TrendingUp size={22} strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold ft-text tracking-tight">FinTrack</h1>
          <p className="text-sm ft-text-2 mt-1">{t('auth.signInSubtitle')}</p>
        </div>

        {/* Card */}
        <div className="ft-card border ft-border rounded-2xl p-6 ft-shadow-md">
          {registered && (
            <div className="mb-5 rounded-xl ft-positive-bg border border-[var(--positive)]/25 px-4 py-2.5 text-sm ft-positive flex items-center gap-2">
              <span className="text-base">✓</span>
              {t('auth.registerSuccess')}
            </div>
          )}
          {error && (
            <div className="mb-5 rounded-xl ft-negative-bg border border-[var(--negative)]/25 px-4 py-2.5 text-sm ft-negative">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <Input
                label={t('auth.email')}
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <Mail size={14} className="absolute right-3 top-[34px] ft-text-3 pointer-events-none" />
            </div>

            <div className="relative">
              <Input
                label={t('auth.password')}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <Lock size={14} className="absolute right-3 top-[34px] ft-text-3 pointer-events-none" />
            </div>

            <Button type="submit" size="lg" loading={loading} className="mt-1 w-full">
              {t('auth.signIn')}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm ft-text-2 mt-5">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="ft-primary hover:underline font-medium">
            {t('auth.signUpLink')}
          </Link>
        </p>
      </div>
    </div>
  );
};
