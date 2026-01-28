
import { api } from './api';
import { User } from '../types';

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  getUserById: (id: number) => api.get(`/admin/users/${id}`),

  updateStatus: async (id: number, status: 'Active' | 'Blocked', reason?: string) => {
    return api.put('/admin/users/status', { id, status, reason });
  },

  blockUser: (id: number, reason: string) => userService.updateStatus(id, 'Blocked', reason),

  unblockUser: (id: number) => userService.updateStatus(id, 'Active'),

  sendNotification: (id: number, message: string) => api.post(`/users/${id}/notify`, { message })
};
