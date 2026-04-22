import { useState, useEffect } from 'react';
import * as usersApi from '../api/users';
import type { UserProfile, UpdateMeInput } from '../api/users';
import { useAuthStore } from '../store/authStore';

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { setAuth, user, accessToken } = useAuthStore();

  useEffect(() => {
    usersApi.getMe()
      .then(setProfile)
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const update = async (data: UpdateMeInput) => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await usersApi.updateMe(data);
      if (user && accessToken) {
        setAuth({ id: updated.id, email: updated.email, name: updated.name }, accessToken);
      }
      setProfile((prev) => prev ? { ...prev, ...updated } : prev);
      setSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Update failed';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return { profile, loading, saving, error, success, update };
};
