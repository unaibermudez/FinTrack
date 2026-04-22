import api from './axiosInstance';

export interface UserProfile {
  _id: string;
  email: string;
  name?: string;
  createdAt: string;
}

export interface UpdateMeInput {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export const getMe = () =>
  api.get<{ user: UserProfile }>('/users/me').then((r) => r.data.user);

export const updateMe = (data: UpdateMeInput) =>
  api.put<{ user: { id: string; email: string; name?: string } }>('/users/me', data).then((r) => r.data.user);
