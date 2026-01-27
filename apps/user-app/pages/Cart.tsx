import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Layout';

// Mock Suggestions
const lastMinuteBuys = [
  { id: 's1', name: "Coriander", price: 10, image: "https://images.unsplash.com/photo-1588879461622-4a7b700140d3?auto=format&fit=crop&w=200&q=80", weight: "1 bunch" },
  { id: 's2', name: "Lemon", price: 15, image: "https://images.unsplash.com/photo-1568569350062-ebfa3cb195df?auto=format&fit=crop&w=200&q=80", weight: "3 pcs" },
  { id: 's3', name: "Green Chili", price: 12, image: "https://images.unsplash.com/photo-1623190827289-48281358b839?auto=format&fit=crop&w=200&q=80", weight: "100g" },
  { id: 's4', name: "Ginger", price: 20, image: "https://images.unsplash.com/photo-1615485500704-8e99099928b3?auto=format&fit=crop&w=200&q=80", weight: "100g" },
  { id: 's5', name: "Curry Leaves", price: 5, image: "https://images.unsplash.com/photo-1615485925763-867862889005?auto=format&fit=crop&w=200&q=80", weight: "1 bunch" },
];

interface DeliveryOption {
    id: string;
    type: 'standard' | 'milk_sub';
    label: string;
    subLabel: string;
    fee: number;
    isFree: boolean;
    date?: string; // ISO date string for sorting/logic
}

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  
  // Checkout State
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  // Advanced Delivery Logic
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>('standard');
  
  // Address State
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Constants
  const FREE_DELIVERY_THRESHOLD = 299;
  const STANDARD_DELIVERY_FEE = 35;

  useEffect(() => {
    // 1. Load Cart
    const saved = localStorage.getItem('taaza_cart');
    if (saved) {
      setItems(JSON.parse(saved));
    }

    // 2. Load Addresses
    const storedAddrs = localStorage.getItem('taaza_addresses');
    if (storedAddrs) {
        const parsed = JSON.parse(storedAddrs);
        setAddresses(parsed);
        const def = parsed.find((a: any) => a.isDefault) || parsed[0];
        if(def) setSelectedAddressId(def.id);
    } else {
        setAddresses([]);
        setSelectedAddressId(null);
    }

    // 3. Calculate Delivery Options
    calculateDeliveryOptions();
  }, []);

  const calculateDeliveryOptions = () => {
      const options: DeliveryOption[] = [];
      const now = new Date();
      
      // -- Option A: Standard Delivery (Always Available) --
      // Simple logic: If current hour is late, show tomorrow slot, else show ETA
      const hour = now.getHours();
      let standardLabel = "Standard Delivery";
      let standardSub = "";
      
      if (hour >= 6 && hour < 22) {
          standardLabel = "Immediate Delivery";
          standardSub = "In 15-20 minutes";
      } else {
          standardLabel = "Standard Delivery";
          standardSub = "Tomorrow, 6:00 AM - 8:00 AM";
      }

      options.push({
          id: 'standard',
          type: 'standard',
          label: standardLabel,
          subLabel: standardSub,
          fee: STANDARD_DELIVERY_FEE,
          isFree: false // Will be recalculated based on cart value
      });

      // -- Option B: Subscription Slots (Based on Actual Days) --
      const subData = localStorage.getItem('taaza_milk_subscription');
      if (subData) {
          const sub = JSON.parse(subData);
          const foundSlots: DeliveryOption[] = [];
          
          // Look ahead 3 days to find valid subscription slots
          // Start from Tomorrow (Assuming bundled orders need cut-off or planning)
          for (let i = 1; i <= 3; i++) {
              const targetDate = new Date();
              targetDate.setDate(now.getDate() + i);
              
              const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue...
              const dateDisplay = i === 1 ? 'Tomorrow' : targetDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              
              // Check Morning Config
              if (sub.morning?.enabled) {
                  const isValidDay = sub.morning.frequency === 'daily' || (sub.morning.days || []).includes(dayName);
                  if (isValidDay) {
                      foundSlots.push({
                          id: `milk_morning_${i}`,
                          type: 'milk_sub',
                          label: `With Morning Milk`,
                          subLabel: `${dateDisplay}, 6:00 - 7:30 AM`,
                          fee: 0,
                          isFree: true,
                          date: targetDate.toISOString()
                      });
                  }
              }

              // Check Evening Config
              if (sub.evening?.enabled) {
                  const isValidDay = sub.evening.frequency === 'daily' || (sub.evening.days || []).includes(dayName);
                  if (isValidDay) {
                      foundSlots.push({
                          id: `milk_evening_${i}`,
                          type: 'milk_sub',
                          label: `With Evening Milk`,
                          subLabel: `${dateDisplay}, 5:30 - 7:30 PM`,
                          fee: 0,
                          isFree: true,
                          date: targetDate.toISOString()
                      });
                  }
              }
              
              // Stop if we found enough options to avoid clutter
              if (foundSlots.length >= 2) break;
          }
          
          options.push(...foundSlots);
      }

      setDeliveryOptions(options);
      
      // Auto-select logic: 
      // If a free milk slot is available tomorrow, default to it? 
      // Or default to standard? 
      // Let's default to the first milk slot if available (to promote free delivery), else standard.
      const firstMilkSlot = options.find(o => o.type === 'milk_sub');
      if (firstMilkSlot) {
          setSelectedDeliveryId(firstMilkSlot.id);
      } else {
          setSelectedDeliveryId('standard');
      }
  };

  const updateStorage = (newItems: any[]) => {
      setItems(newItems);
      localStorage.setItem('taaza_cart', JSON.stringify(newItems));
  }

  const updateQty = (id: string | number, delta: number) => {
    const newItems = items.map(item => {
      if (item.id === id) return { ...item, quantity: Math.max(0, item.quantity + delta) };
      return item;
    }).filter(item => item.quantity > 0);
    updateStorage(newItems);
  };

  const addSuggestion = (item: any) => {
      const existing = items.find(i => i.id === item.id);
      if (existing) {
          updateQty(item.id, 1);
      } else {
          updateStorage([...items, { ...item, quantity: 1 }]);
      }
  };

  // --- Financial Calculations ---
  const itemTotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const handlingCharge = items.length > 0 ? 5 : 0;
  
  const currentOption = deliveryOptions.find(o => o.id === selectedDeliveryId) || deliveryOptions[0];
  
  // Delivery Fee Logic:
  // If Subscription Slot -> Always 0
  // If Standard -> 0 if itemTotal > 299, else 35
  let finalDeliveryFee = 0;
  if (currentOption?.type === 'standard') {
      finalDeliveryFee = itemTotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
  } else {
      finalDeliveryFee = 0;
  }
  
  const grandTotal = Math.max(0, itemTotal + handlingCharge + finalDeliveryFee);
  
  // Savings Calculation
  const standardFeeAssumingPaid = STANDARD_DELIVERY_FEE;
  const actualFee = finalDeliveryFee;
  const totalSavings = standardFeeAssumingPaid - actualFee;
  
  const toFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - itemTotal);
  const progressPercent = Math.min(100, (itemTotal / FREE_DELIVERY_THRESHOLD) * 100);

  const selectedAddress = addresses.find(a => a.id === selectedAddressId) || addresses[0];

  const handlePlaceOrder = () => {
      setIsPlacingOrder(true);
      
      const newOrder = {
          id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
          date: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }),
          status: 'Processing',
          amount: grandTotal,
          deliveryOption: currentOption, 
          items: items.map(i => ({ 
              id: i.id,
              name: i.name, 
              quantity: i.quantity, 
              price: i.price, 
              image: i.image,
              weight: i.weight 
          })),
          billDetails: {
              itemTotal,
              handlingCharge,
              deliveryFee: finalDeliveryFee,
              grandTotal,
              savings: totalSavings
          },
          paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'upi' ? 'UPI' : 'Card',
          deliveryAddress: selectedAddress || { tag: 'Home', address: 'Unknown Address' }
      };

      setTimeout(() => {
          const existingOrders = JSON.parse(localStorage.getItem('taaza_orders') || '[]');
          localStorage.setItem('taaza_orders', JSON.stringify([newOrder, ...existingOrders]));
          localStorage.removeItem('taaza_cart');
          navigate('/order-success', { state: { order: newOrder } });
      }, 2000);
  };

  const getButtonText = () => {
      if (isPlacingOrder) return 'Processing...';
      if (paymentMethod === 'upi') return `Pay ₹${grandTotal}`;
      return `Pay ₹${grandTotal}`;
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
        <Header title="My Cart" backPath="/home" />
        <div className="absolute top-[15%] -left-10 w-64 h-64 bg-yellow-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
        <div className="absolute bottom-[20%] -right-10 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

        <div className="flex-grow flex flex-col items-center justify-center p-8 text-center animate-fade-in relative z-10">
          <div className="relative mb-8 group">
             <div className="w-56 h-56 bg-gray-50 rounded-full flex items-center justify-center shadow-inner relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-tr from-white to-gray-50 opacity-50"></div>
                 <img src="https://cdn-icons-png.flaticon.com/512/11329/11329060.png" alt="Empty Cart" className="w-28 h-28 relative z-10 opacity-60 grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500" />
             </div>
          </div>
          <h2 className="text-3xl font-display font-bold text-gray-800 mb-3">Your cart is empty</h2>
          <p className="text-gray-500 mb-10 text-base max-w-[280px] mx-auto leading-relaxed">It feels too light in here. Let's add some fresh farm produce!</p>
          <button onClick={() => navigate('/home')} className="bg-zepto-yellow text-zepto-blue font-bold py-4 px-10 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 group">
            <span>Start Shopping</span><span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title="Checkout" backPath="/home" />
      
      <main className="flex-grow p-4 pb-48 overflow-y-auto no-scrollbar space-y-5">
        
        {/* 1. Free Delivery Progress */}
        {currentOption?.type === 'standard' ? (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-slide-up relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm transition-colors ${toFreeDelivery > 0 ? 'bg-blue-50 text-zepto-blue' : 'bg-green-100 text-green-600'}`}>
                            <span className="material-symbols-outlined text-2xl">{toFreeDelivery > 0 ? 'local_shipping' : 'celebration'}</span>
                        </div>
                        <div>
                            {toFreeDelivery > 0 ? (
                                <p className="text-gray-800 font-medium leading-tight">Add <span className="font-bold text-zepto-blue">₹{toFreeDelivery}</span> more for <br/><span className="text-green-600 font-bold">Free Standard Delivery</span></p>
                            ) : (
                                <div><p className="font-bold text-green-600 text-lg">Free Delivery Unlocked!</p><p className="text-xs text-gray-400">Standard delivery fee waived</p></div>
                            )}
                        </div>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-gradient-to-r from-zepto-blue to-green-400 transition-all duration-700 ease-out" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex items-center gap-3 animate-slide-up">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <span className="material-symbols-outlined">verified</span>
                </div>
                <div>
                    <p className="font-bold text-green-800 text-sm">Free Delivery Active</p>
                    <p className="text-xs text-green-700">Bundled with your subscription</p>
                </div>
            </div>
        )}

        {/* 2. Cart Items */}
        <div className="space-y-4 animate-slide-up" style={{animationDelay: '0.1s'}}>
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider ml-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-gray-400">shopping_bag</span> Items ({items.reduce((acc, i) => acc + i.quantity, 0)})
            </h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
            {items.map((item) => (
                <div key={item.id} className="p-4 flex items-center hover:bg-gray-50 transition-colors group">
                    <div className="w-16 h-16 bg-white rounded-xl flex-shrink-0 overflow-hidden border border-gray-100 shadow-sm">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="ml-4 flex-grow min-w-0">
                        <h3 className="font-bold text-gray-800 text-sm truncate mb-0.5">{item.name}</h3>
                        <p className="text-xs text-gray-500 mb-1 font-medium">{item.weight || '1 pc'} | ₹{item.price}</p>
                        <p className="font-bold text-gray-900">₹{item.price * item.quantity}</p>
                    </div>
                    <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm h-9 overflow-hidden">
                        <button onClick={() => updateQty(item.id, -1)} className="w-9 h-full flex items-center justify-center text-zepto-blue hover:bg-blue-50">
                            <span className="material-symbols-outlined text-sm font-bold">remove</span>
                        </button>
                        <span className="font-bold w-6 text-center text-sm text-gray-800">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-9 h-full flex items-center justify-center text-zepto-blue hover:bg-blue-50">
                            <span className="material-symbols-outlined text-sm font-bold">add</span>
                        </button>
                    </div>
                </div>
            ))}
            </div>
        </div>

        {/* 3. Delivery Options (Enhanced Logic) */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-slide-up">
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-3 ml-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-zepto-blue">local_shipping</span> Delivery Options
            </h3>
            
            <div className="space-y-3">
                {deliveryOptions.map(option => (
                    <div 
                        key={option.id}
                        onClick={() => setSelectedDeliveryId(option.id)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 relative ${selectedDeliveryId === option.id ? (option.type === 'milk_sub' ? 'border-green-500 bg-green-50/30' : 'border-zepto-blue bg-blue-50/30') : 'border-gray-100 hover:border-gray-200'}`}
                    >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedDeliveryId === option.id ? (option.type === 'milk_sub' ? 'border-green-500' : 'border-zepto-blue') : 'border-gray-300'}`}>
                            {selectedDeliveryId === option.id && <div className={`w-2.5 h-2.5 rounded-full ${option.type === 'milk_sub' ? 'bg-green-500' : 'bg-zepto-blue'}`}></div>}
                        </div>
                        <div className="flex-grow">
                            <p className="font-bold text-gray-800 text-sm">{option.label}</p>
                            <p className="text-xs text-gray-500">{option.subLabel}</p>
                        </div>
                        {option.type === 'milk_sub' ? (
                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded">FREE</span>
                        ) : (
                            <span className={`text-xs font-bold ${option.isFree || itemTotal >= FREE_DELIVERY_THRESHOLD ? 'text-green-600' : 'text-gray-500'}`}>
                                {itemTotal >= FREE_DELIVERY_THRESHOLD ? 'FREE' : `₹${option.fee}`}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* 4. Last Minute Adds */}
        <div className="animate-slide-up" style={{animationDelay: '0.2s'}}>
            <h3 className="font-bold text-gray-800 text-xs mb-3 flex items-center gap-1 uppercase tracking-wider ml-1">
                <span className="material-symbols-outlined text-orange-500 text-sm">bolt</span> Quick Adds
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
                {lastMinuteBuys.map((s) => (
                    <div key={s.id} className="min-w-[140px] bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col relative overflow-hidden group hover:border-blue-100 transition-colors">
                        <div className="w-full aspect-square bg-gray-50 rounded-xl mb-3 overflow-hidden relative border border-gray-50">
                            <img src={s.image} alt={s.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <button onClick={() => addSuggestion(s)} className="absolute bottom-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg shadow-md flex items-center justify-center text-zepto-blue hover:bg-zepto-blue hover:text-white transition-all active:scale-95">
                                <span className="material-symbols-outlined text-lg font-bold">add</span>
                            </button>
                        </div>
                        <p className="font-bold text-sm text-gray-800 truncate w-full mb-0.5">{s.name}</p>
                        <p className="text-[10px] text-gray-400 mb-2 font-medium">{s.weight}</p>
                        <span className="font-bold text-sm text-gray-900 mt-auto">₹{s.price}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* 5. Address Section */}
        {selectedAddress ? (
            <div className="bg-white p-0 rounded-2xl shadow-sm border border-gray-100 animate-slide-up overflow-hidden group" style={{animationDelay: '0.25s'}}>
                <div className="p-4 border-b border-gray-50 bg-gradient-to-r from-blue-50/50 to-transparent">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-110 ${selectedAddress.tag === 'Home' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                <span className="material-symbols-outlined">{selectedAddress.tag === 'Home' ? 'home' : 'work'}</span>
                            </div>
                            <div className="flex-grow min-w-0">
                                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">Delivery to {selectedAddress.tag}</h3>
                                <p className="text-xs text-gray-500 mt-0.5 truncate">{selectedAddress.houseNo}, {selectedAddress.address}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowAddressSheet(true)} className="text-zepto-blue text-[10px] font-bold bg-white border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex-shrink-0 ml-2">CHANGE</button>
                    </div>
                </div>
            </div>
        ) : (
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-slide-up" style={{animationDelay: '0.25s'}}>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><span className="material-symbols-outlined text-zepto-blue">location_on</span> Delivery Address</h2>
                </div>
                <button onClick={() => setShowAddressSheet(true)} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-2 text-gray-500 font-bold hover:border-zepto-blue hover:text-zepto-blue transition-colors bg-gray-50">
                    <span className="material-symbols-outlined">add_location_alt</span> Select Address
                </button>
            </div>
        )}

        {/* 6. Bill Details */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-slide-up" style={{animationDelay: '0.3s'}}>
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-4 pb-2 border-b border-gray-50">Bill Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600"><span>Item Total</span><span className="font-medium text-gray-800">₹{itemTotal}</span></div>
            <div className="flex justify-between text-gray-600"><span className="flex items-center gap-1">Handling Charge</span><span className="font-medium text-gray-800">₹{handlingCharge}</span></div>
            <div className="flex justify-between text-gray-600 items-center">
              <span>Delivery Fee</span>
              {finalDeliveryFee === 0 ? <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-0.5 rounded"><span className="line-through text-green-800/50 mr-1">₹{STANDARD_DELIVERY_FEE}</span> FREE</span> : <span className="font-medium text-gray-800">₹{finalDeliveryFee}</span>}
            </div>
            {totalSavings > 0 && (
                <div className="mt-3 bg-blue-50/50 border border-blue-100 rounded-lg p-2.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">savings</span> Total Savings</span>
                    <span className="font-bold text-sm text-blue-700">₹{totalSavings}</span>
                </div>
            )}
            <div className="border-t border-dashed border-gray-200 pt-4 mt-2">
                <div className="flex justify-between items-center">
                    <div><span className="font-bold text-gray-900 text-lg block">To Pay</span><span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded">Incl. of all taxes</span></div>
                    <span className="font-bold text-gray-900 text-2xl">₹{grandTotal}</span>
                </div>
            </div>
          </div>
        </div>

        {/* 7. Payment Options */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-slide-up" style={{animationDelay: '0.35s'}}>
             <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider">Payment</h3>
                <span className="flex items-center gap-1 text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-100"><span className="material-symbols-outlined text-xs">lock</span> Secure</span>
             </div>
             <div className="space-y-3">
                 <div onClick={() => setPaymentMethod('upi')} className={`rounded-xl border transition-all cursor-pointer relative overflow-hidden ${paymentMethod === 'upi' ? 'border-zepto-blue bg-blue-50/30' : 'border-gray-100 hover:bg-gray-50'}`}>
                     <div className="p-3 flex items-center">
                         <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${paymentMethod === 'upi' ? 'border-zepto-blue' : 'border-gray-300'}`}>{paymentMethod === 'upi' && <div className="w-2.5 h-2.5 rounded-full bg-zepto-blue"></div>}</div>
                         <div className="flex-grow">
                             <div className="flex items-center gap-2 mb-1"><span className="font-bold text-gray-800 text-sm">UPI</span><span className="bg-orange-100 text-orange-700 text-[9px] font-bold px-1.5 py-0.5 rounded">RECOMMENDED</span></div>
                             <div className="flex items-center gap-2 opacity-80 mt-1"><span className="text-[10px] text-gray-500">Google Pay, PhonePe, Paytm</span></div>
                         </div>
                     </div>
                 </div>
                 <div onClick={() => setPaymentMethod('cod')} className={`rounded-xl border transition-all cursor-pointer relative overflow-hidden ${paymentMethod === 'cod' ? 'border-zepto-blue bg-blue-50/30' : 'border-gray-100 hover:bg-gray-50'}`}>
                     <div className="p-3 flex items-center">
                         <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${paymentMethod === 'cod' ? 'border-zepto-blue' : 'border-gray-300'}`}>{paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-zepto-blue"></div>}</div>
                         <div className="flex-grow"><div className="flex items-center justify-between mb-1"><span className="font-bold text-gray-800 text-sm">Cash on Delivery</span></div><p className="text-[10px] text-gray-500">Pay cash/UPI to partner</p></div>
                     </div>
                 </div>
             </div>
        </div>

        {/* 8. Policy */}
        <div className="bg-gray-100/50 p-4 rounded-xl text-[10px] text-gray-500 flex gap-3 animate-slide-up border border-gray-100" style={{animationDelay: '0.4s'}}>
            <span className="material-symbols-outlined text-lg text-gray-400">policy</span>
            <p className="leading-relaxed">You can cancel your order within <span className="font-bold text-gray-700">5 minutes</span> of placing it for a full refund.</p>
        </div>
      </main>

      {/* Sticky Checkout Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-20 rounded-t-3xl">
        <button 
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder || !selectedAddressId}
            className="w-full bg-zepto-yellow text-zepto-blue font-bold py-4 rounded-2xl shadow-lg shadow-yellow-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all flex items-center justify-between px-6 disabled:opacity-70 disabled:cursor-not-allowed"
        >
            <div className="text-left flex flex-col"><span className="text-[10px] uppercase tracking-wider opacity-70 font-bold mb-0.5">Total to Pay</span><span className="text-xl leading-none">₹{grandTotal}</span></div>
            <div className="flex items-center gap-2 text-lg">{getButtonText()}{!isPlacingOrder && <span className="material-symbols-outlined font-bold bg-white/20 rounded-full p-1">arrow_forward</span>}</div>
        </button>
      </div>

      {/* Address Selection Bottom Sheet */}
      {showAddressSheet && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowAddressSheet(false)}></div>
              <div className="relative bg-gray-50 rounded-t-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl animate-slide-up">
                   <div className="p-5 bg-white rounded-t-3xl border-b border-gray-100 sticky top-0 z-10">
                       <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4"></div>
                       <div className="flex justify-between items-center"><h3 className="text-lg font-bold text-gray-800">Select Delivery Location</h3><button onClick={() => setShowAddressSheet(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><span className="material-symbols-outlined text-gray-600">close</span></button></div>
                   </div>
                   <div className="p-4 overflow-y-auto space-y-4">
                       <button onClick={() => navigate('/profile/addresses')} className="w-full p-4 border border-dashed border-zepto-blue bg-blue-50/50 rounded-2xl flex items-center justify-center gap-2 text-zepto-blue font-bold hover:bg-blue-50 transition-colors"><span className="material-symbols-outlined">add_location_alt</span> Add New Address</button>
                       <div className="space-y-3">
                           {addresses.length === 0 ? (<p className="text-center text-gray-400 text-sm py-4">No saved addresses found.</p>) : (
                               addresses.map((addr) => (
                               <div key={addr.id} onClick={() => { setSelectedAddressId(addr.id); setShowAddressSheet(false); }} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 relative overflow-hidden ${selectedAddressId === addr.id ? 'bg-white border-zepto-blue shadow-md' : 'bg-white border-transparent hover:border-gray-200'}`}>
                                   <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${addr.tag === 'Home' ? 'bg-blue-100 text-blue-600' : addr.tag === 'Work' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}><span className="material-symbols-outlined">{addr.tag === 'Home' ? 'home' : addr.tag === 'Work' ? 'work' : 'location_on'}</span></div>
                                   <div className="flex-grow"><div className="flex justify-between items-start"><h4 className="font-bold text-gray-800">{addr.tag}</h4>{selectedAddressId === addr.id && <span className="material-symbols-outlined text-zepto-blue text-xl">check_circle</span>}</div><p className="text-sm text-gray-600 font-medium mt-0.5">{addr.houseNo}</p><p className="text-xs text-gray-400 mt-1 leading-relaxed">{addr.address}</p></div>
                                   {selectedAddressId === addr.id && <div className="absolute top-0 left-0 w-1 h-full bg-zepto-blue"></div>}
                               </div>
                           ))
                           )}
                       </div>
                   </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Cart;