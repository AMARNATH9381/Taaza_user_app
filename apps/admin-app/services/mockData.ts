
import { OrderStatus, SubscriptionStatus, Order, Subscription, User, Product } from '../types';

export const mockOrders: Order[] = [
  { id: 'ORD-001', customerName: 'Rahul Sharma', phone: '9876543210', items: 5, total: 1250, status: OrderStatus.PENDING, date: '2023-11-20', address: 'Indiranagar, Bangalore' },
  { id: 'ORD-002', customerName: 'Priya Singh', phone: '8765432109', items: 3, total: 850, status: OrderStatus.DELIVERED, date: '2023-11-19', address: 'Koramangala, Bangalore' },
  { id: 'ORD-003', customerName: 'Amit Verma', phone: '7654321098', items: 8, total: 2450, status: OrderStatus.PROCESSING, date: '2023-11-20', address: 'HSR Layout, Bangalore' },
  { id: 'ORD-004', customerName: 'Sneha Rao', phone: '6543210987', items: 2, total: 450, status: OrderStatus.CANCELLED, date: '2023-11-18', address: 'Whitefield, Bangalore' },
  { id: 'ORD-005', customerName: 'Vikram Mehta', phone: '5432109876', items: 6, total: 1800, status: OrderStatus.DELIVERED, date: '2023-11-17', address: 'JP Nagar, Bangalore' },
];

export const mockSubscriptions: Subscription[] = [
  { id: 'SUB-101', customerName: 'Anjali Gupta', plan: 'Morning', quantity: 2, startDate: '2023-10-01', status: SubscriptionStatus.ACTIVE, milkType: 'Cow', address: 'MG Road, Area A', timeSlot: '6:00-7:00 AM' },
  { id: 'SUB-102', customerName: 'Karthik S', plan: 'Both', quantity: 1, startDate: '2023-09-15', status: SubscriptionStatus.ACTIVE, milkType: 'Buffalo', address: 'Vimanapura, Area B', timeSlot: '6:00-7:00 AM' },
  { id: 'SUB-103', customerName: 'Deepa M', plan: 'Evening', quantity: 2, startDate: '2023-11-05', status: SubscriptionStatus.PAUSED, milkType: 'Cow', address: 'Domlur, Area C', timeSlot: '5:00-6:00 PM' },
];

export const mockUsers: User[] = [
  { id: 'USR-001', name: 'John Doe', email: 'john@example.com', phone: '9988776655', registeredDate: '2023-01-10', totalOrders: 15, status: 'Active' },
  { id: 'USR-002', name: 'Jane Smith', email: 'jane@example.com', phone: '8877665544', registeredDate: '2023-03-22', totalOrders: 8, status: 'Active' },
  { id: 'USR-003', name: 'Blocked User', email: 'blocked@example.com', phone: '1122334455', registeredDate: '2023-05-15', totalOrders: 1, status: 'Blocked' },
];

export const mockProducts: Product[] = [
  { id: 'PROD-001', name: 'Fresh Buffalo Milk', description: 'Raw, unpasteurized buffalo milk from local farms.', price: 75, image: 'https://picsum.photos/400/300?random=1', category: 'Milk', stock: 500, weight: '1L', isAvailable: true },
  { id: 'PROD-002', name: 'Organic Cow Milk', description: 'Pasteurized organic cow milk.', price: 65, image: 'https://picsum.photos/400/300?random=2', category: 'Milk', stock: 450, weight: '1L', isAvailable: true },
  { id: 'PROD-003', name: 'Fresh Mutton Curry Cut', description: 'Premium quality mutton curry pieces.', price: 750, image: 'https://picsum.photos/400/300?random=3', category: 'Meat', stock: 40, weight: '1kg', isAvailable: true },
  { id: 'PROD-004', name: 'Alphonso Mangoes', description: 'Sweetest seasonal mangoes from Ratnagiri.', price: 900, image: 'https://picsum.photos/400/300?random=4', category: 'Fruits', stock: 100, weight: '1 Dozen', isAvailable: false },
];

export const revenueData = [
  { name: 'Mon', revenue: 45000 },
  { name: 'Tue', revenue: 52000 },
  { name: 'Wed', revenue: 48000 },
  { name: 'Thu', revenue: 61000 },
  { name: 'Fri', revenue: 55000 },
  { name: 'Sat', revenue: 72000 },
  { name: 'Sun', revenue: 68000 },
];

export const distributionData = [
  { name: 'Milk', value: 45 },
  { name: 'Meat', value: 25 },
  { name: 'Fruits', value: 15 },
  { name: 'Vegetables', value: 15 },
];

export const areaDeliveries = [
  { area: 'Indiranagar', count: 120 },
  { area: 'Koramangala', count: 95 },
  { area: 'HSR Layout', count: 85 },
  { area: 'Whitefield', count: 70 },
  { area: 'Jayanagar', count: 110 },
];
