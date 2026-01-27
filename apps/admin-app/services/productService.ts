
import { api } from './api';
import { Product } from '../types';

export const productService = {
  getProducts: () => api.get('/products'),
  createProduct: (product: Omit<Product, 'id'>) => api.post('/products', product),
  updateProduct: (id: string, product: Partial<Product>) => api.put(`/products/${id}`, product),
  deleteProduct: (id: string) => api.delete(`/products/${id}`),
  updateStock: (id: string, stock: number) => api.put(`/products/${id}/stock`, { stock })
};
