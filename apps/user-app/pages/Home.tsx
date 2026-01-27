import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [subscription, setSubscription] = useState<any>(null);
  const [nextDeliverySlot, setNextDeliverySlot] = useState<string>('');
  const [nextDeliveryDetail, setNextDeliveryDetail] = useState<string>('');
  const [address, setAddress] = useState('Home');
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [userInitial, setUserInitial] = useState('U');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // 1. User & Address
    const storedAddrs = JSON.parse(localStorage.getItem('taaza_addresses') || '[]');
    const defaultAddr = storedAddrs.find((a: any) => a.isDefault) || storedAddrs[0];
    if (defaultAddr) setAddress(defaultAddr.tag);
    
    const name = localStorage.getItem('taaza_user_name') || 'User';
    setUserInitial(name.charAt(0).toUpperCase());

    // 2. Cart & Quantities
    const updateCartData = () => {
      const cart = JSON.parse(localStorage.getItem('taaza_cart') || '[]');
      const count = cart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
      setCartCount(count);

      const qtyMap: { [key: string]: number } = {};
      cart.forEach((item: any) => {
        if (item.id) qtyMap[item.id] = item.quantity;
      });
      setQuantities(qtyMap);
    };
    
    updateCartData();
    window.addEventListener('storage', updateCartData);

    // 3. Subscription Status Logic
    const subData = localStorage.getItem('taaza_milk_subscription');
    if (subData) {
        const parsed = JSON.parse(subData);
        setSubscription(parsed);
        calculateNextDelivery(parsed);
    }

    return () => window.removeEventListener('storage', updateCartData);
  }, []);

  const calculateNextDelivery = (sub: any) => {
      const DAYS_MAP = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const now = new Date();
      const currentHour = now.getHours();
      
      const MORNING_CUTOFF = 9; // 9 AM
      const EVENING_CUTOFF = 19; // 7 PM

      // Helper: Check if schedule is active for a specific date
      const isScheduled = (slot: any, date: Date) => {
          if (!slot || !slot.enabled) return false;
          if (slot.frequency === 'daily') return true;
          const dayName = DAYS_MAP[date.getDay()];
          return slot.days && slot.days.includes(dayName);
      };

      let label = 'Paused';
      let detail = 'No active deliveries';

      // 1. Check Morning Today
      if (currentHour < MORNING_CUTOFF && isScheduled(sub.morning, now)) {
          setNextDeliverySlot('Morning (Today)');
          setNextDeliveryDetail(`${sub.morning.quantity}L ${sub.morning.type} Milk`);
          return;
      }

      // 2. Check Evening Today
      if (currentHour < EVENING_CUTOFF && isScheduled(sub.evening, now)) {
          setNextDeliverySlot('Evening (Today)');
          setNextDeliveryDetail(`${sub.evening.quantity}L ${sub.evening.type} Milk`);
          return;
      }

      // 3. Find Next Slot in upcoming days (Look ahead 7 days)
      for (let i = 1; i <= 7; i++) {
          const futureDate = new Date();
          futureDate.setDate(now.getDate() + i);
          
          if (isScheduled(sub.morning, futureDate)) {
              const dayStr = i === 1 ? 'Tomorrow' : DAYS_MAP[futureDate.getDay()];
              setNextDeliverySlot(`Morning (${dayStr})`);
              setNextDeliveryDetail(`${sub.morning.quantity}L ${sub.morning.type} Milk`);
              return;
          }

          if (isScheduled(sub.evening, futureDate)) {
              const dayStr = i === 1 ? 'Tomorrow' : DAYS_MAP[futureDate.getDay()];
              setNextDeliverySlot(`Evening (${dayStr})`);
              setNextDeliveryDetail(`${sub.evening.quantity}L ${sub.evening.type} Milk`);
              return;
          }
      }

      setNextDeliverySlot('Paused');
      setNextDeliveryDetail('No upcoming deliveries');
  };

  const updateCart = (item: any, delta: number) => {
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
    
    // Trigger update manually since storage event works across tabs usually
    const count = cart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
    setCartCount(count);
    const qtyMap: { [key: string]: number } = {};
    cart.forEach((item: any) => {
      if (item.id) qtyMap[item.id] = item.quantity;
    });
    setQuantities(qtyMap);

    // Haptic
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const categories = [
      { id: 'milk', label: 'Fresh Milk', img: 'https://cdn-icons-png.flaticon.com/512/2674/2674486.png', bg: 'bg-blue-50', path: '/milk/plan' },
      { id: 'meat', label: 'Fresh Meat', img: 'https://cdn-icons-png.flaticon.com/512/1134/1134447.png', bg: 'bg-red-50', path: '/meat' },
      { id: 'veg', label: 'Vegetables', img: 'https://cdn-icons-png.flaticon.com/512/2329/2329903.png', bg: 'bg-green-50', path: '/vegetables' },
      { id: 'fruit', label: 'Fruits', img: 'https://cdn-icons-png.flaticon.com/512/3194/3194766.png', bg: 'bg-orange-50', path: '/fruits' },
  ];

  const promos = [
      { id: 1, title: 'Get 20% Off', sub: 'On Country Chicken', color: 'from-orange-400 to-red-500', img: 'https://cdn-icons-png.flaticon.com/512/10760/10760677.png' },
      { id: 2, title: 'Free Delivery', sub: 'On Recharge of ₹500', color: 'from-blue-400 to-indigo-500', img: 'https://cdn-icons-png.flaticon.com/512/2543/2543369.png' },
  ];

  const allProducts = [
    { id: 'p1', name: 'Organic Bananas', price: 149, weight: '1 kg', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=200&q=80' },
    { id: 'p2', name: 'Farm Eggs', price: 89, weight: '6 pcs', image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=200&q=80' },
    { id: 'p3', name: 'Fresh Paneer', price: 120, weight: '200g', image: 'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&w=200&q=80' },
    { id: 'p4', name: 'Brown Bread', price: 55, weight: '400g', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=200&q=80' },
    { id: 'p5', name: 'Fresh Tomato', price: 38, weight: '1 kg', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=200&q=80' },
    { id: 'p6', name: 'Curd (Dahi)', price: 40, weight: '500g', image: 'https://images.unsplash.com/photo-1563575313964-26df9e215972?auto=format&fit=crop&w=200&q=80' },
  ];

  const filteredProducts = allProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      
      {/* --- 1. Custom Header --- */}
      <header className="bg-zepto-blue sticky top-0 z-30 px-4 pt-4 pb-4 shadow-md rounded-b-3xl text-white">
          <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col">
                  <div className="flex items-center gap-1 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => navigate('/profile/addresses')}>
                      <span className="material-symbols-outlined text-xl text-zepto-yellow">location_on</span>
                      <span className="font-bold text-sm truncate max-w-[200px] text-white">{address}</span>
                      <span className="material-symbols-outlined text-sm text-white/70">keyboard_arrow_down</span>
                  </div>
                  <p className="text-xs text-blue-200 pl-6">Bengaluru, Karnataka</p>
              </div>
              
              {/* Header Right Icons - Clean Look */}
              <div className="flex items-center gap-4">
                  <button onClick={() => navigate('/cart')} className="relative text-white hover:text-zepto-yellow transition-colors">
                      <span className="material-symbols-outlined text-3xl">shopping_cart</span>
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-zepto-order-red text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-zepto-blue animate-bounce">
                          {cartCount}
                        </span>
                      )}
                  </button>
                  <button onClick={() => navigate('/profile')} className="text-white hover:text-zepto-yellow transition-colors">
                      <span className="material-symbols-outlined text-3xl">account_circle</span>
                  </button>
              </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-blue-200">search</span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for 'Milk', 'Paneer', 'Eggs'..." 
                className="w-full bg-white/10 rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-zepto-yellow/50 transition-all placeholder-blue-300/70 text-white"
              />
              {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200">
                      <span className="material-symbols-outlined text-sm">close</span>
                  </button>
              )}
          </div>
      </header>

      <main className="p-4 space-y-6">
          
          {/* --- 2. Subscription Status / Hero --- */}
          <div className="animate-slide-up">
              {subscription && (subscription.morning?.enabled || subscription.evening?.enabled) ? (
                  <div 
                    onClick={() => navigate('/milk/plan')}
                    className="bg-gradient-to-r from-zepto-blue to-[#1a3b66] rounded-2xl p-4 text-white shadow-lg shadow-blue-200 relative overflow-hidden cursor-pointer border border-white/10"
                  >
                      <div className="relative z-10 flex justify-between items-center">
                          <div>
                              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Next Delivery</p>
                              <h3 className="text-xl font-bold mb-1">{nextDeliverySlot}</h3>
                              <p className="text-sm opacity-90 text-blue-100 flex items-center gap-1 font-medium capitalize">
                                  {nextDeliveryDetail}
                              </p>
                          </div>
                          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                              <span className="material-symbols-outlined text-2xl">local_shipping</span>
                          </div>
                      </div>
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                      <div className="absolute bottom-0 left-0 w-20 h-20 bg-zepto-yellow/10 rounded-full blur-xl"></div>
                  </div>
              ) : (
                  <div 
                    onClick={() => navigate('/milk/subscribe')}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer group hover:border-zepto-blue transition-colors"
                  >
                      <div>
                          <h3 className="font-bold text-gray-800 text-lg">Setup Daily Milk</h3>
                          <p className="text-xs text-gray-500 mt-1">Get fresh milk delivered every morning.</p>
                          <span className="text-xs font-bold text-zepto-blue mt-2 inline-block group-hover:underline">Subscribe Now →</span>
                      </div>
                      <img src="https://cdn-icons-png.flaticon.com/512/869/869687.png" alt="Milk" className="w-16 h-16 object-contain drop-shadow-sm group-hover:scale-110 transition-transform" />
                  </div>
              )}
          </div>

          {/* --- 3. Categories Grid (Images) --- */}
          <div className="animate-slide-up" style={{animationDelay: '0.1s'}}>
              <h3 className="font-bold text-gray-800 mb-3 text-sm ml-1">Shop by Category</h3>
              <div className="grid grid-cols-4 gap-3">
                  {categories.map((cat) => (
                      <div 
                        key={cat.id} 
                        onClick={() => navigate(cat.path)}
                        className="flex flex-col items-center gap-2 cursor-pointer group"
                      >
                          <div className={`w-16 h-16 rounded-2xl ${cat.bg} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform overflow-hidden p-2`}>
                              <img src={cat.img} alt={cat.label} className="w-full h-full object-contain drop-shadow-sm" />
                          </div>
                          <span className="text-[10px] font-bold text-gray-600 text-center leading-tight">{cat.label}</span>
                      </div>
                  ))}
              </div>
          </div>

          {/* --- 4. Promo Banners --- */}
          {!searchQuery && (
              <div className="overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 flex gap-4 animate-slide-up" style={{animationDelay: '0.2s'}}>
                  {promos.map((promo) => (
                      <div 
                        key={promo.id}
                        className={`min-w-[260px] h-32 rounded-2xl bg-gradient-to-r ${promo.color} p-4 relative overflow-hidden shadow-md flex items-center`}
                      >
                          <div className="relative z-10 w-2/3">
                              <h3 className="text-xl font-display font-bold text-white leading-tight mb-1">{promo.title}</h3>
                              <p className="text-xs text-white/90 font-medium mb-3">{promo.sub}</p>
                              <button className="bg-white text-gray-800 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm">Claim Now</button>
                          </div>
                          <img src={promo.img} alt="Offer" className="absolute right-2 bottom-2 w-24 h-24 object-contain opacity-90 drop-shadow-md transform rotate-12" />
                      </div>
                  ))}
              </div>
          )}

          {/* --- 5. Fresh Essentials (Products with Counter) --- */}
          <div className="animate-slide-up" style={{animationDelay: '0.3s'}}>
              <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-gray-800 text-sm ml-1">
                      {searchQuery ? `Search Results for "${searchQuery}"` : 'Fresh Essentials'}
                  </h3>
                  {!searchQuery && <button onClick={() => navigate('/vegetables')} className="text-xs font-bold text-zepto-blue">See All</button>}
              </div>
              
              {filteredProducts.length === 0 ? (
                  <div className="text-center py-10 opacity-60">
                      <span className="material-symbols-outlined text-4xl text-gray-300">search_off</span>
                      <p className="text-sm text-gray-500 mt-2">No items found matching "{searchQuery}"</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-2 gap-4">
                      {filteredProducts.map((p) => (
                          <div key={p.id} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm relative group">
                              <div className="w-full h-32 bg-gray-50 rounded-xl mb-3 overflow-hidden">
                                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              </div>
                              <h4 className="font-bold text-gray-800 text-sm truncate">{p.name}</h4>
                              <p className="text-[10px] text-gray-500 font-medium mb-2">{p.weight}</p>
                              <div className="flex justify-between items-center">
                                  <span className="text-sm font-bold text-gray-900">₹{p.price}</span>
                                  
                                  {quantities[p.id] ? (
                                    <div className="flex items-center bg-green-50 rounded-lg border border-green-200 h-8 overflow-hidden">
                                      <button 
                                        onClick={() => updateCart(p, -1)}
                                        className="w-8 h-full flex items-center justify-center text-green-700 hover:bg-green-100 transition-colors"
                                      >
                                        <span className="material-symbols-outlined text-sm font-bold">remove</span>
                                      </button>
                                      <span className="font-bold w-4 text-center text-sm text-green-800">{quantities[p.id]}</span>
                                      <button 
                                        onClick={() => updateCart(p, 1)}
                                        className="w-8 h-full flex items-center justify-center text-green-700 hover:bg-green-100 transition-colors"
                                      >
                                        <span className="material-symbols-outlined text-sm font-bold">add</span>
                                      </button>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => updateCart(p, 1)}
                                      className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-zepto-blue hover:bg-zepto-blue hover:text-white transition-colors shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-lg font-bold">add</span>
                                    </button>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>

      </main>
    </div>
  );
};

export default Home;