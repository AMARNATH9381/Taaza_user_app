import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Layout';

interface StoreItem {
  id: string;
  name: string;
  price: number;
  weight: string;
  image: string;
}

const VEG_ITEMS: StoreItem[] = [
  { id: 'v1', name: 'Fresh Tomato (Local)', price: 38, weight: '1 kg', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=300&q=80' },
  { id: 'v2', name: 'Red Onion', price: 45, weight: '1 kg', image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=300&q=80' },
  { id: 'v3', name: 'Potato (New Crop)', price: 32, weight: '1 kg', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=300&q=80' },
  { id: 'v4', name: 'Green Chili', price: 12, weight: '100g', image: 'https://images.unsplash.com/photo-1623190827289-48281358b839?auto=format&fit=crop&w=300&q=80' },
  { id: 'v5', name: 'Coriander Leaves', price: 10, weight: '1 bunch', image: 'https://images.unsplash.com/photo-1588879461622-4a7b700140d3?auto=format&fit=crop&w=300&q=80' },
  { id: 'v6', name: 'Carrot (Ooty)', price: 65, weight: '500g', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=300&q=80' },
  { id: 'v7', name: 'Ladies Finger', price: 28, weight: '250g', image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=300&q=80' },
  { id: 'v8', name: 'Capsicum (Green)', price: 42, weight: '500g', image: 'https://images.unsplash.com/photo-1563565375-f3fdf5d2e374?auto=format&fit=crop&w=300&q=80' },
];

const FRUIT_ITEMS: StoreItem[] = [
  { id: 'f1', name: 'Robusta Banana', price: 48, weight: '1 kg', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=300&q=80' },
  { id: 'f2', name: 'Fuji Apple', price: 180, weight: '4 pcs', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=300&q=80' },
  { id: 'f3', name: 'Pomegranate', price: 145, weight: '1 kg', image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=300&q=80' },
  { id: 'f4', name: 'Papaya (Semi-Ripe)', price: 55, weight: '1 pc', image: 'https://images.unsplash.com/photo-1617112848923-cc5c3893bdf7?auto=format&fit=crop&w=300&q=80' },
  { id: 'f5', name: 'Watermelon', price: 49, weight: '1 pc', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=300&q=80' },
  { id: 'f6', name: 'Pineapple', price: 85, weight: '1 pc', image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=300&q=80' },
];

interface Props {
  type: 'vegetables' | 'fruits';
}

const CategoryStore: React.FC<Props> = ({ type }) => {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [searchQuery, setSearchQuery] = useState('');

  const items = type === 'vegetables' ? VEG_ITEMS : FRUIT_ITEMS;
  const title = type === 'vegetables' ? 'Farm Fresh Veggies' : 'Seasonal Fruits';

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    updateCartFromStorage();
  }, []);

  const updateCartFromStorage = () => {
    const cart = JSON.parse(localStorage.getItem('taaza_cart') || '[]');
    const count = cart.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
    setCartCount(count);

    const qtyMap: { [key: string]: number } = {};
    cart.forEach((item: any) => {
      if (item.id) qtyMap[item.id] = item.quantity;
    });
    setQuantities(qtyMap);
  };

  const updateCart = (item: StoreItem, delta: number) => {
    const cart = JSON.parse(localStorage.getItem('taaza_cart') || '[]');
    const existingIdx = cart.findIndex((c: any) => c.id === item.id);

    if (existingIdx > -1) {
      cart[existingIdx].quantity += delta;
      if (cart[existingIdx].quantity <= 0) {
        cart.splice(existingIdx, 1);
      }
    } else if (delta > 0) {
      cart.push({ ...item, quantity: 1 });
    }

    localStorage.setItem('taaza_cart', JSON.stringify(cart));
    updateCartFromStorage();
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const HeaderAction = (
    <button onClick={() => navigate('/cart')} className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
        <span className="material-symbols-outlined text-white">shopping_cart</span>
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-zepto-order-red text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-zepto-blue animate-bounce">
            {cartCount}
          </span>
        )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title={title} backPath="/home" rightAction={HeaderAction} />
      
      {/* Search Bar */}
      <div className="px-4 pt-4 pb-2 sticky top-[56px] z-10 bg-gray-50">
        <div className="relative shadow-sm rounded-xl">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search for ${type}...`} 
                className="w-full bg-white rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-zepto-blue/10 transition-all text-gray-700 border border-gray-100"
            />
            {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <span className="material-symbols-outlined text-lg">close</span>
                </button>
            )}
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-4 pb-24 animate-slide-up">
        {filteredItems.length === 0 ? (
            <div className="col-span-2 text-center py-10 opacity-60">
                <span className="material-symbols-outlined text-4xl text-gray-300">search_off</span>
                <p className="text-sm text-gray-500 mt-2">No items found</p>
            </div>
        ) : (
            filteredItems.map((item) => (
            <div key={item.id} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col group">
                <div className="w-full aspect-square bg-gray-50 rounded-xl mb-3 overflow-hidden relative">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                
                <h3 className="font-bold text-gray-800 text-sm truncate mb-0.5">{item.name}</h3>
                <p className="text-xs text-gray-500 font-medium mb-3">{item.weight}</p>
                
                <div className="mt-auto flex items-center justify-between">
                <span className="font-bold text-gray-900">₹{item.price}</span>
                
                {quantities[item.id] ? (
                    <div className="flex items-center bg-green-50 rounded-lg border border-green-200 h-8 overflow-hidden">
                    <button 
                        onClick={() => updateCart(item, -1)}
                        className="w-8 h-full flex items-center justify-center text-green-700 hover:bg-green-100 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm font-bold">remove</span>
                    </button>
                    <span className="font-bold w-4 text-center text-sm text-green-800">{quantities[item.id]}</span>
                    <button 
                        onClick={() => updateCart(item, 1)}
                        className="w-8 h-full flex items-center justify-center text-green-700 hover:bg-green-100 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm font-bold">add</span>
                    </button>
                    </div>
                ) : (
                    <button 
                    onClick={() => updateCart(item, 1)}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-zepto-blue hover:bg-zepto-blue hover:text-white transition-all shadow-sm"
                    >
                    <span className="material-symbols-outlined text-lg font-bold">add</span>
                    </button>
                )}
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
};

export default CategoryStore;