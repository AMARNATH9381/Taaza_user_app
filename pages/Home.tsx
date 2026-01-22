import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Layout';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('User');
  const [greeting, setGreeting] = useState('Good morning');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const name = localStorage.getItem('taaza_user_name') || 'User';
    setUserName(name);

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour >= 12 && hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Initialize cart count from local storage
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('taaza_cart') || '[]');
      const count = cart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
      setCartCount(count);
    };

    updateCartCount();

    // Optional: Listen for storage events if cart is updated in other tabs/windows
    window.addEventListener('storage', updateCartCount);
    return () => window.removeEventListener('storage', updateCartCount);
  }, []);

  const addToCart = (item: any) => {
    const cart = JSON.parse(localStorage.getItem('taaza_cart') || '[]');
    const existing = cart.find((c: any) => c.id === item.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }
    localStorage.setItem('taaza_cart', JSON.stringify(cart));
    
    // Update local state immediately
    const newCount = cart.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0);
    setCartCount(newCount);
    
    // Show Toast
    const toast = document.createElement('div');
    toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-zepto-green text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in flex items-center gap-2';
    toast.innerHTML = `<span class="material-symbols-outlined text-sm">check_circle</span> <span>${item.name} added!</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const upcomingDeliveries = [
    {
      id: 'd1',
      type: 'milk',
      date: 'Tomorrow',
      fullDate: 'Thu, Nov 2',
      status: 'Scheduled',
      items: '1L Taaza Milk',
      time: '7-9 AM',
      icon: 'local_drink',
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      action: 'Skip',
      actionColor: 'text-red-500 border-red-200 hover:bg-red-50'
    },
    {
      id: 'd2',
      type: 'meat',
      date: 'Sunday',
      fullDate: 'Sun, Nov 5',
      status: 'Pre-booked',
      items: '500g Chicken Curry Cut',
      time: '8-10 AM',
      icon: 'set_meal',
      bg: 'bg-red-50',
      iconColor: 'text-red-600',
      action: 'Manage',
      actionColor: 'text-zepto-blue border-blue-200 hover:bg-blue-50'
    }
  ];

  const recommendedProducts = [
    { id: 'p1', name: 'Organic Bananas', price: 149, image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=200&q=80' },
    { id: 'p2', name: 'Avocados', price: 330, image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=200&q=80' },
    { id: 'p3', name: 'Strawberries', price: 240, image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=200&q=80' },
    { id: 'p4', name: 'Fresh Apples', price: 330, image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=200&q=80' },
  ];

  return (
    <div className="min-h-screen bg-zepto-light-bg pb-20">
      {/* Header Area */}
      <header className="bg-zepto-blue text-white p-4 pb-6 sticky top-0 z-20 shadow-md rounded-b-xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{greeting}, {userName}!</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/cart')} className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined">shopping_cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-zepto-order-red text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-zepto-blue animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>
            <button onClick={() => navigate('/profile')} className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined">person</span>
            </button>
          </div>
        </div>

        {/* Next Delivery (Moved from Main) */}
        <div className="bg-white/10 p-4 rounded-xl flex justify-between items-center backdrop-blur-sm border border-white/10 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-sm text-gray-300 mb-1">Your next delivery</p>
            <div>
              <p className="text-xl font-bold">Tomorrow, 7-9 AM</p>
              <p className="text-sm text-blue-100 opacity-90">1L Milk + 500g Chicken</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-4xl text-white/80 relative z-10">motorcycle</span>
          <div className="absolute right-0 top-0 h-full w-1/2 bg-white/5 skew-x-12"></div>
        </div>
      </header>

      <main className="p-4 space-y-6 animate-slide-up">
        {/* Upcoming */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-gray-900">Upcoming Deliveries</h2>
            <button className="text-sm text-zepto-blue font-medium">View all</button>
          </div>
          <div className="space-y-3">
            {upcomingDeliveries.map((delivery) => (
              <div key={delivery.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${delivery.bg} rounded-lg flex items-center justify-center`}>
                    <span className={`material-symbols-outlined ${delivery.iconColor}`}>{delivery.icon}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-800">{delivery.fullDate}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${delivery.status === 'Pre-booked' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                        {delivery.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{delivery.items}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{delivery.time}</p>
                  </div>
                </div>
                <button className={`border px-3 py-1 rounded-lg text-xs font-semibold ${delivery.actionColor}`}>
                  {delivery.action}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Recommended For You</h2>
          <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar">
            {recommendedProducts.map((p) => (
              <div key={p.id} className="bg-white rounded-xl shadow-sm p-3 min-w-[140px] flex flex-col">
                <img src={p.image} alt={p.name} className="w-full h-24 object-cover rounded-lg mb-2" />
                <h3 className="font-semibold text-gray-800 text-sm truncate">{p.name}</h3>
                <p className="text-zepto-blue font-bold text-sm mb-2">₹{p.price}</p>
                <button 
                  onClick={() => addToCart(p)}
                  className="bg-zepto-yellow text-zepto-blue font-bold py-1.5 rounded-lg text-xs w-full mt-auto hover:bg-yellow-500 active:scale-95 transition-transform"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 left-4 right-4 flex gap-3 z-10">
        <button 
          onClick={() => navigate('/milk/plan')}
          className="flex-1 bg-zepto-manage-blue text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-700 flex items-center justify-center"
        >
          Manage Milk
        </button>
        <button 
          onClick={() => navigate('/meat')}
          className="flex-1 bg-zepto-order-red text-white font-bold py-3 rounded-xl shadow-lg hover:bg-red-600 flex items-center justify-center"
        >
          Fresh Meats
        </button>
      </div>
    </div>
  );
};

export default Home;