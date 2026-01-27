
export enum OrderStatus {
  PENDING = 'Pending',
  PROCESSING = 'Processing',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled'
}

export enum SubscriptionStatus {
  ACTIVE = 'Active',
  PAUSED = 'Paused',
  CANCELLED = 'Cancelled'
}

export interface User {
  id: number;
  name: string;
  email: string;
  mobile: string;
  dob?: string;
  gender?: string;
  created_at: string;
  status: 'Active' | 'Blocked';
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'Milk' | 'Meat' | 'Fruits' | 'Vegetables';
  stock: number;
  weight: string;
  isAvailable: boolean;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  items: number;
  total: number;
  status: OrderStatus;
  date: string;
  address: string;
}

export interface Subscription {
  id: string;
  customerName: string;
  plan: 'Morning' | 'Evening' | 'Both';
  quantity: number;
  startDate: string;
  status: SubscriptionStatus;
  milkType: 'Cow' | 'Buffalo';
  address: string;
  timeSlot?: string;
}
