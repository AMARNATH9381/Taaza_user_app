export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category?: string;
  quantity?: number;
  weight?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  status: 'delivered' | 'processing' | 'shipped' | 'cancelled';
  total: number;
  items: CartItem[];
  deliveryDate?: string;
}

export interface Address {
  id: string;
  label: string;
  line: string;
  city: string;
  zip: string;
  isDefault?: boolean;
}

export interface User {
  name: string;
  mobile: string;
  email?: string;
}
