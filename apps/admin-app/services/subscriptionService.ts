
import { api } from './api';

export const subscriptionService = {
  getSubscriptions: () => api.get('/subscriptions'),
  getTodayDeliveries: () => api.get('/subscriptions/today'),
  updateSubscription: (id: string, data: any) => api.put(`/subscriptions/${id}`, data),
  pauseSubscription: (id: string) => api.put(`/subscriptions/${id}/pause`, { status: 'Paused' }),
  resumeSubscription: (id: string) => api.put(`/subscriptions/${id}/resume`, { status: 'Active' })
};
