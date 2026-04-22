import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { User, Mail, Lock, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProfile } from '../hooks/useProfile';
import { Navbar } from '../components/ui/Navbar';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const Profile = () => {
  const { profile, loading, saving, error, update } = useProfile();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [toasted, setToasted] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setEmail(profile.email);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToasted(false);
    try {
      await update({
        name,
        email,
        ...(changingPassword && newPassword ? { currentPassword, newPassword } : {}),
      });
      if (changingPassword) {
        toast.success(t('profile.passwordUpdated'));
        setChangingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
      } else {
        toast.success(t('profile.profileUpdated'));
      }
      setToasted(true);
    } catch {
      toast.error(error ?? t('profile.updateError'));
    }
  };

  return (
    <div className="min-h-screen ft-bg">
      <Navbar />
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold ft-text tracking-tight">{t('profile.title')}</h1>
          <p className="text-sm ft-text-2 mt-0.5">{t('profile.subtitle')}</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-48 rounded-xl ft-card border ft-border animate-pulse" />
            <div className="h-32 rounded-xl ft-card border ft-border animate-pulse" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
            {/* Account info */}
            <Card title={t('profile.accountSection')}>
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Input
                    label={t('profile.fullName')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Smith"
                    autoComplete="name"
                  />
                  <User size={14} className="absolute right-3 top-[34px] ft-text-3 pointer-events-none" />
                </div>
                <div className="relative">
                  <Input
                    label={t('profile.email')}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <Mail size={14} className="absolute right-3 top-[34px] ft-text-3 pointer-events-none" />
                </div>
              </div>
            </Card>

            {/* Security */}
            <Card title={t('profile.securitySection')}>
              <div className="flex flex-col gap-4">
                <button
                  type="button"
                  onClick={() => setChangingPassword((v) => !v)}
                  className="flex items-center gap-2 text-sm ft-primary hover:opacity-80 transition-opacity cursor-pointer w-fit"
                >
                  <ShieldCheck size={14} />
                  {changingPassword ? t('common.cancel') : t('profile.changePassword')}
                </button>

                {changingPassword && (
                  <div className="flex flex-col gap-4 pt-1 border-t ft-border">
                    <div className="relative">
                      <Input
                        label={t('profile.currentPassword')}
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required={changingPassword}
                        autoComplete="current-password"
                      />
                      <Lock size={14} className="absolute right-3 top-[34px] ft-text-3 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <Input
                        label={t('profile.newPassword')}
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required={changingPassword}
                        minLength={8}
                        placeholder="Min. 8 characters"
                        autoComplete="new-password"
                      />
                      <Lock size={14} className="absolute right-3 top-[34px] ft-text-3 pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {error && !toasted && (
              <div className="rounded-xl ft-negative-bg border border-[var(--negative)]/25 px-4 py-2.5 text-sm ft-negative">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" loading={saving} size="md">
                {t('common.save')}
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};
