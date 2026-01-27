
import { api } from './api';
import { Order, OrderStatus } from '../types';

export const orderService = {
  getOrders: () => api.get('/orders'),
  getOrderById: (id: string) => api.get(`/orders/${id}`),
  updateStatus: (id: string, status: OrderStatus) => api.put(`/orders/${id}/status`, { status }),
  cancelOrder: (id: string) => api.put(`/orders/${id}/cancel`, { status: OrderStatus.CANCELLED })
};
