import { useState, useEffect } from 'react';
import { useProfile } from '../hooks/useProfile';
import { Navbar } from '../components/ui/Navbar';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const Profile = () => {
  const { profile, loading, saving, error, success, update } = useProfile();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setEmail(profile.email);
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update({
      name,
      email,
      ...(changingPassword && newPassword ? { currentPassword, newPassword } : {}),
    });
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-10">
        <h1 className="text-xl font-bold text-slate-100 mb-6">Profile</h1>

        {loading ? (
          <div className="h-64 rounded-xl bg-[#1a1d27] animate-pulse" />
        ) : (
          <Card>
            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2 text-sm text-green-400">
                Profile updated successfully.
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="border-t border-[#2a2d3a] pt-4">
                <button
                  type="button"
                  onClick={() => setChangingPassword((v) => !v)}
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  {changingPassword ? '— Cancel password change' : '+ Change password'}
                </button>
              </div>

              {changingPassword && (
                <>
                  <Input
                    label="Current password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <Input
                    label="New password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                  />
                </>
              )}

              <Button type="submit" loading={saving} className="mt-1">
                Save changes
              </Button>
            </form>
          </Card>
        )}
      </main>
    </div>
  );
};
