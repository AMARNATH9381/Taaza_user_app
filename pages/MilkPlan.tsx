import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Header } from '../components/Layout';

// --- Constants & Types ---
const MILK_PRICES = { buffalo: 90, cow: 60 };
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const QUANTITIES = [0.50, 0.75, 1.00, 1.25, 1.50, 1.75, 2.00];

type MilkType = 'buffalo' | 'cow';
type Frequency = 'daily' | 'alternate';

interface SlotConfig {
  enabled: boolean;
  expanded: boolean;
  type: MilkType;
  quantity: number;
  time: string;
  frequency: Frequency;
  days: string[];
}

// --- Toast Component ---
const Toast: React.FC<{ msg: string; onClose: () => void; type?: 'success' | 'error' }> = ({ msg, onClose, type = 'success' }) => {
    useEffect(() => {
        const t = setTimeout(onClose, 3000);
        return () => clearTimeout(t);
    }, [onClose]);
    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-sm text-white px-5 py-3 rounded-full shadow-xl text-sm font-bold animate-fade-in z-[60] flex items-center gap-3 whitespace-nowrap min-w-[200px] justify-center">
            <span className={`material-symbols-outlined text-lg ${type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                {type === 'error' ? 'error' : 'check_circle'}
            </span>
            {msg}
        </div>
    );
};

// --- Subscription Success Component ---
const SubscriptionSuccess: React.FC<{ planDetails: any; isUpdate?: boolean }> = ({ planDetails, isUpdate }) => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden animate-fade-in">
      <div className="absolute inset-0 pointer-events-none">
         {[...Array(30)].map((_, i) => (
            <div key={i} className="absolute animate-[fall_3s_linear_infinite]" style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                animationDelay: `${Math.random() * 2}s`,
                width: '8px',
                height: '8px',
                backgroundColor: ['#FFD700', '#10B981', '#3B82F6'][Math.floor(Math.random() * 3)],
                borderRadius: '50%',
            }}></div>
        ))}
      </div>
      <style>{`@keyframes fall { to { transform: translateY(110vh); } }`}</style>

      <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-200 animate-[bounce_1s_infinite]">
        <span className="material-symbols-outlined text-5xl text-white">check</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">{isUpdate ? 'Subscription Updated!' : 'Subscription Active!'}</h1>
      <p className="text-gray-500 mb-8 max-w-xs mx-auto">
        Your fresh milk delivery schedule has been {isUpdate ? 'updated' : 'set'} successfully.
      </p>

      {/* Mini Receipt */}
      <div className="bg-gray-50 p-6 rounded-2xl w-full max-w-sm border border-gray-100 mb-8 text-left shadow-sm">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Plan Details</h3>
        
        {planDetails.morning.enabled && (
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                    <span className="text-xl">☀️</span>
                    <div>
                        <p className="font-bold text-gray-800 text-sm">{planDetails.morning.quantity}L {planDetails.morning.type === 'buffalo' ? 'Buffalo' : 'Cow'}</p>
                        <p className="text-xs text-gray-500">Morning • {planDetails.morning.frequency === 'daily' ? 'Whole Week' : planDetails.morning.days.join(', ')}</p>
                    </div>
                </div>
                <span className="material-symbols-outlined text-green-600">check_circle</span>
            </div>
        )}

        {planDetails.evening.enabled && (
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                    <span className="text-xl">🌙</span>
                    <div>
                        <p className="font-bold text-gray-800 text-sm">{planDetails.evening.quantity}L {planDetails.evening.type === 'buffalo' ? 'Buffalo' : 'Cow'}</p>
                        <p className="text-xs text-gray-500">Evening • {planDetails.evening.frequency === 'daily' ? 'Whole Week' : planDetails.evening.days.join(', ')}</p>
                    </div>
                </div>
                <span className="material-symbols-outlined text-green-600">check_circle</span>
            </div>
        )}

        <div className="border-t border-dashed border-gray-200 mt-3 pt-3 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Weekly Total</span>
            <span className="font-bold text-lg text-zepto-blue">₹{planDetails.weeklyTotal}</span>
        </div>
        {planDetails.autoPay && (
            <div className="mt-3 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border border-green-100">
                <span className="material-symbols-outlined text-sm">autorenew</span>
                <div>
                   <p>Auto-Pay Active</p>
                   <p className="text-[9px] opacity-80 font-normal">Real-time setup via UPI / Card</p>
                </div>
            </div>
        )}
      </div>

      <div className="w-full max-w-sm space-y-3">
        <button 
            onClick={() => navigate('/milk/plan')}
            className="w-full bg-zepto-blue text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-900 transition-all active:scale-95"
        >
            View My Plan
        </button>
        <button 
            onClick={() => navigate('/home')}
            className="w-full bg-white text-gray-700 font-bold py-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all active:scale-95"
        >
            Go to Home
        </button>
      </div>
    </div>
  );
};

// --- New Subscription Page ---
const NewSubscription: React.FC = () => {
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  
  // Validation State
  const [errorFlags, setErrorFlags] = useState<string[]>([]);
  
  // Dynamic Back Path logic
  const [backPath, setBackPath] = useState('/home');
  const [isUpdateFlow, setIsUpdateFlow] = useState(false);

  // --- States ---
  // Defaulting to 'alternate' and empty days [] to force selection for BOTH Morning and Evening
  const [morning, setMorning] = useState<SlotConfig>({
    enabled: true,
    expanded: true,
    type: 'buffalo',
    quantity: 0.5,
    time: '7:00-7:30',
    frequency: 'alternate', 
    days: [] 
  });

  const [evening, setEvening] = useState<SlotConfig>({
    enabled: false,
    expanded: false,
    type: 'cow',
    quantity: 0.5,
    time: '18:00-18:30',
    frequency: 'alternate',
    days: []
  });

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [modalSlot, setModalSlot] = useState<'morning' | 'evening' | null>(null);
  
  // Address Flow States
  const [addressView, setAddressView] = useState<'none' | 'list' | 'map' | 'form'>('none');
  const [autoPay, setAutoPay] = useState(true);

  // Address Creation/Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState({
      houseNo: '',
      landmark: '',
      tag: 'Home',
      customTag: '',
      receiverName: '',
      receiverPhone: '',
      mapAddress: '12th Main Road, Indiranagar, Bengaluru',
      isDefault: false
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Map States
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLocating, setIsLocating] = useState(false);
  const [isConfirmingMap, setIsConfirmingMap] = useState(false);
  const [searchText, setSearchText] = useState('');


  // --- Effects ---
  useEffect(() => {
    // 1. Load Addresses
    const storedAddrs = localStorage.getItem('taaza_addresses');
    let parsedAddrs: any[] = [];
    if (storedAddrs) {
        parsedAddrs = JSON.parse(storedAddrs);
        setAddresses(parsedAddrs);
    }

    // 2. Load Existing Subscription for "Modify Plan"
    const savedSub = localStorage.getItem('taaza_milk_subscription');
    let preselectedAddrId = '';

    if (savedSub) {
        const parsedSub = JSON.parse(savedSub);
        setMorning(parsedSub.morning);
        setEvening(parsedSub.evening);
        setAutoPay(parsedSub.autoPay);
        setIsUpdateFlow(true);
        
        // Correctly set back path if subscription exists
        setBackPath('/milk/plan');
        
        // Try to match the address from subscription
        if (parsedSub.address && parsedSub.address.id) {
            preselectedAddrId = parsedSub.address.id;
        }
    } else {
        // If no subscription, back goes to home
        setBackPath('/home');
    }

    // 3. Set Default Address Selection
    if (preselectedAddrId) {
        setSelectedAddressId(preselectedAddrId);
    } else if (parsedAddrs.length > 0) {
        // If not editing existing plan, pick default
        const def = parsedAddrs.find((a: any) => a.isDefault) || parsedAddrs[0];
        if (def) setSelectedAddressId(def.id);
    }
  }, []); 

  // --- Helpers ---
  const updateSlot = (slot: 'morning' | 'evening', data: Partial<SlotConfig>) => {
    if (slot === 'morning') setMorning(prev => ({ ...prev, ...data }));
    else setEvening(prev => ({ ...prev, ...data }));

    // Clear specific error flag if user interacts with days or frequency
    if (data.days || data.frequency) {
        setErrorFlags(prev => prev.filter(e => e !== slot));
    }
  };

  const toggleSlot = (slot: 'morning' | 'evening') => {
    const target = slot === 'morning' ? morning : evening;
    updateSlot(slot, { enabled: !target.enabled, expanded: !target.enabled });
    // Clear error if disabled
    if (target.enabled) { // If it was enabled and now disabling
        setErrorFlags(prev => prev.filter(e => e !== slot));
    }
  };

  const getSlotWeeklyCost = (slot: SlotConfig) => {
    if (!slot.enabled) return 0;
    const days = slot.frequency === 'daily' ? 7 : slot.days.length;
    return slot.quantity * MILK_PRICES[slot.type] * days;
  };

  const calculateTotalWeeklyCost = () => {
      return getSlotWeeklyCost(morning) + getSlotWeeklyCost(evening);
  };

  const handleSubscribe = () => {
      const newErrors: string[] = [];

      // 1. Check if at least one slot is enabled
      if (!morning.enabled && !evening.enabled) {
          setToastMsg({ msg: "Select at least one slot (Morning or Evening)", type: 'error' });
          return;
      }

      // 2. Validate Morning Slot
      if (morning.enabled && morning.frequency === 'alternate' && morning.days.length === 0) {
          newErrors.push('morning');
          // Auto-expand if error
          if (!morning.expanded) setMorning(prev => ({...prev, expanded: true}));
      }

      // 3. Validate Evening Slot
      if (evening.enabled && evening.frequency === 'alternate' && evening.days.length === 0) {
          newErrors.push('evening');
          if (!evening.expanded) setEvening(prev => ({...prev, expanded: true}));
      }

      // 4. Validate Address
      if (!selectedAddressId) {
          newErrors.push('address');
      }

      // Handle Errors
      if (newErrors.length > 0) {
          setErrorFlags(newErrors);
          
          if (newErrors.includes('morning')) {
              setToastMsg({ msg: "Please select days for Morning delivery", type: 'error' });
          } else if (newErrors.includes('evening')) {
              setToastMsg({ msg: "Please select days for Evening delivery", type: 'error' });
          } else if (newErrors.includes('address')) {
              setToastMsg({ msg: "Please select a delivery address", type: 'error' });
              // Optional: Open list if address is the only issue
              if (newErrors.length === 1 && newErrors[0] === 'address') {
                  setTimeout(() => setAddressView('list'), 500); 
              }
          }
          
          // Haptic feedback if available
          if (navigator.vibrate) navigator.vibrate(100);
          
          return;
      }

      setIsSubmitting(true);
      
      const selectedAddr = addresses.find(a => a.id === selectedAddressId);
      
      const subscriptionData = {
          morning,
          evening,
          address: selectedAddr,
          autoPay,
          startDate: new Date().toISOString(),
          status: 'Active'
      };

      // Save to localStorage
      localStorage.setItem('taaza_milk_subscription', JSON.stringify(subscriptionData));

      // Simulate API call
      setTimeout(() => {
          setIsSubmitting(false);
          setIsSuccess(true);
      }, 1500);
  };

  const formatDaysDisplay = (days: string[]) => {
      if (days.length === 0) return 'Select Days';
      if (days.length === 7) return 'Whole Week';
      return days.join(', ');
  };

  // --- Address Logic ---

  const startAddNewAddress = () => {
    setEditingId(null);
    setNewAddress({
        houseNo: '',
        landmark: '',
        tag: 'Home',
        customTag: '',
        receiverName: localStorage.getItem('taaza_user_name') || '',
        receiverPhone: localStorage.getItem('taaza_mobile') || '',
        mapAddress: '12th Main Road, Indiranagar, Bengaluru',
        isDefault: addresses.length === 0 
    });
    setPan({x: 0, y: 0});
    setAddressView('map');
  };

  const startEditAddress = (e: React.MouseEvent, addr: any) => {
      e.stopPropagation();
      setEditingId(addr.id);
      setNewAddress({
          houseNo: addr.houseNo,
          landmark: addr.landmark || '',
          tag: ['Home', 'Work'].includes(addr.tag) ? addr.tag : 'Other',
          customTag: ['Home', 'Work'].includes(addr.tag) ? '' : addr.tag,
          receiverName: addr.receiverName || '',
          receiverPhone: addr.receiverPhone || '',
          mapAddress: addr.address,
          isDefault: addr.isDefault || false
      });
      setAddressView('form'); 
  };

  // ... Map Logic ...
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStart({ x: clientX - pan.x, y: clientY - pan.y });
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setPan({ x: clientX - dragStart.x, y: clientY - dragStart.y });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    if (Math.abs(pan.x) > 20 || Math.abs(pan.y) > 20) {
        const streets = ['100ft Road', 'CMH Road', '12th Main', '80ft Road', 'Cambridge Layout', 'Double Road'];
        const randomStreet = streets[Math.floor(Math.random() * streets.length)];
        const num = Math.floor(Math.random() * 200) + 1;
        setNewAddress(prev => ({...prev, mapAddress: `${num}, ${randomStreet}, Bengaluru`}));
    }
  };

  const handleLocateMe = () => {
    setIsLocating(true);
    setTimeout(() => {
        setIsLocating(false);
        setNewAddress(prev => ({...prev, mapAddress: 'Current Location: 5th Block, Koramangala, Bengaluru'}));
        setPan({ x: 0, y: 0 });
    }, 1500);
  };

  const confirmMapLocation = () => {
      setIsConfirmingMap(true);
      setTimeout(() => {
          setIsConfirmingMap(false);
          setAddressView('form');
      }, 800);
  };

  const saveNewAddress = () => {
    // Validate
    const errors: any = {};
    if (!newAddress.receiverName.trim()) errors.receiverName = "Name is required";
    if (!newAddress.receiverPhone.trim()) errors.receiverPhone = "Phone is required";
    else if (!/^\d{10}$/.test(newAddress.receiverPhone.replace(/\D/g, ''))) errors.receiverPhone = "Valid 10-digit number required";
    if (!newAddress.houseNo.trim()) errors.houseNo = "House/Flat No. is required";
    if (newAddress.tag === 'Other' && !newAddress.customTag.trim()) errors.customTag = "Address name required";
    
    if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
    }

    const finalTag = newAddress.tag === 'Other' ? newAddress.customTag.trim() : newAddress.tag;
    const newId = editingId || Date.now().toString();

    const addressObj = {
        id: newId,
        tag: finalTag,
        houseNo: newAddress.houseNo,
        landmark: newAddress.landmark,
        address: newAddress.mapAddress,
        isDefault: newAddress.isDefault,
        receiverName: newAddress.receiverName,
        receiverPhone: newAddress.receiverPhone
    };

    let updatedAddresses = [...addresses];
    
    if (newAddress.isDefault) {
        updatedAddresses = updatedAddresses.map(a => ({...a, isDefault: false}));
    }

    if (editingId) {
        updatedAddresses = updatedAddresses.map(a => a.id === editingId ? addressObj : a);
    } else {
        updatedAddresses.push(addressObj);
    }
    
    // Ensure one default exists
    if (!updatedAddresses.some(a => a.isDefault) && updatedAddresses.length > 0) {
        updatedAddresses[0].isDefault = true;
    }

    // Save and Select
    setAddresses(updatedAddresses);
    localStorage.setItem('taaza_addresses', JSON.stringify(updatedAddresses));
    setSelectedAddressId(newId);
    
    // Clear address errors if any
    setErrorFlags(prev => prev.filter(e => e !== 'address'));

    setAddressView('none'); 
    setEditingId(null);
  };

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  if (isSuccess) {
      return <SubscriptionSuccess planDetails={{ morning, evening, weeklyTotal: calculateTotalWeeklyCost(), autoPay }} isUpdate={isUpdateFlow} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-32 relative">
      <Header title={isUpdateFlow ? "Modify Subscription" : "New Subscription"} backPath={backPath} />

      <div className="p-4 space-y-5 animate-slide-up">
        
        {/* Delivery Schedule Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-zepto-blue">schedule</span>
                <h2 className="text-lg font-bold text-gray-800">Delivery Schedule</h2>
            </div>

            {/* Morning Slot Card */}
            <div className={`border-2 rounded-xl mb-4 overflow-hidden transition-all duration-300 ${morning.enabled ? 'border-zepto-blue bg-white shadow-md' : 'border-gray-200 bg-gray-50 opacity-80'}`}>
                {/* Header Toggle */}
                <div className="p-4 flex items-center justify-between cursor-pointer bg-white" onClick={() => updateSlot('morning', { expanded: !morning.expanded })}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-xl shadow-sm">☀️</div>
                        <div>
                            <h3 className={`font-bold text-sm ${morning.enabled ? 'text-gray-900' : 'text-gray-500'}`}>Morning Delivery</h3>
                            <p className="text-[10px] text-gray-500 font-medium">6:00 AM - 9:00 AM</p>
                            {/* Summary when collapsed */}
                            {morning.enabled && !morning.expanded && (
                                <p className="text-[10px] text-zepto-blue font-bold mt-0.5 animate-fade-in">
                                    {morning.quantity}L • {morning.frequency === 'daily' ? 'Whole Week' : formatDaysDisplay(morning.days)}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className={`text-[10px] font-bold ${!morning.enabled ? 'text-gray-600' : 'text-gray-300'}`}>OFF</span>
                        <div onClick={() => toggleSlot('morning')} className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${morning.enabled ? 'bg-zepto-blue' : 'bg-gray-300'}`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${morning.enabled ? 'translate-x-5' : ''}`}></div>
                        </div>
                        <span className={`text-[10px] font-bold ${morning.enabled ? 'text-zepto-blue' : 'text-gray-300'}`}>ON</span>
                    </div>
                </div>

                {/* Body */}
                {morning.enabled && morning.expanded && (
                    <div className="p-4 border-t border-gray-100 space-y-5 bg-white">
                        {/* Milk Type */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Milk Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['buffalo', 'cow'].map((t) => (
                                    <div 
                                        key={t}
                                        onClick={() => updateSlot('morning', { type: t as MilkType })}
                                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center ${morning.type === t ? 'border-zepto-blue bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <span className="text-2xl mb-1">{t === 'buffalo' ? '🐃' : '🐄'}</span>
                                        <span className="font-bold text-sm capitalize text-gray-800">{t} Milk</span>
                                        <span className="text-xs text-gray-500 mt-0.5">₹{MILK_PRICES[t as MilkType]}/L</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quantity & Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Quantity</label>
                                <select 
                                    value={morning.quantity}
                                    onChange={(e) => updateSlot('morning', { quantity: parseFloat(e.target.value) })}
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-zepto-blue"
                                >
                                    {QUANTITIES.map(q => (
                                        <option key={q} value={q}>{q.toFixed(2)} L</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Delivery Time</label>
                                <select 
                                    value={morning.time}
                                    onChange={(e) => updateSlot('morning', { time: e.target.value })}
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-zepto-blue"
                                >
                                    <option value="6:00-6:30">6:00 - 6:30 AM</option>
                                    <option value="6:30-7:00">6:30 - 7:00 AM</option>
                                    <option value="7:00-7:30">7:00 - 7:30 AM</option>
                                    <option value="7:30-8:00">7:30 - 8:00 AM</option>
                                    <option value="8:00-8:30">8:00 - 8:30 AM</option>
                                </select>
                            </div>
                        </div>

                        {/* Frequency */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Frequency</label>
                            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                                <button 
                                    onClick={() => updateSlot('morning', { frequency: 'daily' })}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${morning.frequency === 'daily' ? 'bg-zepto-blue text-white shadow-md' : 'text-gray-500 hover:bg-gray-200/50'}`}
                                >
                                    Daily <span className="block text-[9px] font-medium opacity-70">Whole Week</span>
                                </button>
                                <button 
                                    onClick={() => {
                                        updateSlot('morning', { frequency: 'alternate' });
                                        setModalSlot('morning');
                                    }}
                                    className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-all ${
                                        morning.frequency === 'alternate' 
                                        ? (errorFlags.includes('morning') ? 'bg-red-50 text-red-500 border border-red-200' : 'bg-zepto-blue text-white shadow-md') 
                                        : (errorFlags.includes('morning') ? 'text-red-500 border border-red-200' : 'text-gray-500 hover:bg-gray-200/50')
                                    }`}
                                >
                                    Custom <span className="block text-[9px] font-medium opacity-80 truncate max-w-[120px] mx-auto">{morning.frequency === 'alternate' ? formatDaysDisplay(morning.days) : 'Select Days'}</span>
                                </button>
                            </div>
                            {errorFlags.includes('morning') && (
                                <p className="text-[10px] text-red-500 font-bold mt-1.5 animate-fade-in flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[10px]">error</span> Please select specific days
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Evening Slot Card */}
            <div className={`border-2 rounded-xl overflow-hidden transition-all duration-300 ${evening.enabled ? 'border-zepto-blue bg-white shadow-md' : 'border-gray-200 bg-gray-50 opacity-80'}`}>
                <div className="p-4 flex items-center justify-between cursor-pointer bg-white" onClick={() => updateSlot('evening', { expanded: !evening.expanded })}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-xl shadow-sm">🌙</div>
                        <div>
                            <h3 className={`font-bold text-sm ${evening.enabled ? 'text-gray-900' : 'text-gray-500'}`}>Evening Delivery</h3>
                            <p className="text-[10px] text-gray-500 font-medium">5:30 PM - 7:30 PM</p>
                            {/* Summary when collapsed */}
                            {evening.enabled && !evening.expanded && (
                                <p className="text-[10px] text-zepto-blue font-bold mt-0.5 animate-fade-in">
                                    {evening.quantity}L • {evening.frequency === 'daily' ? 'Whole Week' : formatDaysDisplay(evening.days)}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className={`text-[10px] font-bold ${!evening.enabled ? 'text-gray-600' : 'text-gray-300'}`}>OFF</span>
                        <div onClick={() => toggleSlot('evening')} className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${evening.enabled ? 'bg-zepto-blue' : 'bg-gray-300'}`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${evening.enabled ? 'translate-x-5' : ''}`}></div>
                        </div>
                        <span className={`text-[10px] font-bold ${evening.enabled ? 'text-zepto-blue' : 'text-gray-300'}`}>ON</span>
                    </div>
                </div>

                {evening.enabled && evening.expanded && (
                    <div className="p-4 border-t border-gray-100 space-y-5 bg-white">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Milk Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['buffalo', 'cow'].map((t) => (
                                    <div 
                                        key={t}
                                        onClick={() => updateSlot('evening', { type: t as MilkType })}
                                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center ${evening.type === t ? 'border-zepto-blue bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <span className="text-2xl mb-1">{t === 'buffalo' ? '🐃' : '🐄'}</span>
                                        <span className="font-bold text-sm capitalize text-gray-800">{t} Milk</span>
                                        <span className="text-xs text-gray-500 mt-0.5">₹{MILK_PRICES[t as MilkType]}/L</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Quantity</label>
                                <select 
                                    value={evening.quantity}
                                    onChange={(e) => updateSlot('evening', { quantity: parseFloat(e.target.value) })}
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-zepto-blue"
                                >
                                    {QUANTITIES.map(q => (
                                        <option key={q} value={q}>{q.toFixed(2)} L</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Delivery Time</label>
                                <select 
                                    value={evening.time}
                                    onChange={(e) => updateSlot('evening', { time: e.target.value })}
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-zepto-blue"
                                >
                                    <option value="17:30-18:00">5:30 - 6:00 PM</option>
                                    <option value="18:00-18:30">6:00 - 6:30 PM</option>
                                    <option value="18:30-19:00">6:30 - 7:00 PM</option>
                                    <option value="19:00-19:30">7:00 - 7:30 PM</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Frequency</label>
                            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                                <button 
                                    onClick={() => updateSlot('evening', { frequency: 'daily' })}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${evening.frequency === 'daily' ? 'bg-zepto-blue text-white shadow-md' : 'text-gray-500 hover:bg-gray-200/50'}`}
                                >
                                    Daily <span className="block text-[9px] font-medium opacity-70">Whole Week</span>
                                </button>
                                <button 
                                    onClick={() => {
                                        updateSlot('evening', { frequency: 'alternate' });
                                        setModalSlot('evening');
                                    }}
                                    className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-all ${
                                        evening.frequency === 'alternate' 
                                        ? (errorFlags.includes('evening') ? 'bg-red-50 text-red-500 border border-red-200' : 'bg-zepto-blue text-white shadow-md') 
                                        : (errorFlags.includes('evening') ? 'text-red-500 border border-red-200' : 'text-gray-500 hover:bg-gray-200/50')
                                    }`}
                                >
                                    Custom <span className="block text-[9px] font-medium opacity-80 truncate max-w-[120px] mx-auto">{evening.frequency === 'alternate' ? formatDaysDisplay(evening.days) : 'Select Days'}</span>
                                </button>
                            </div>
                            {errorFlags.includes('evening') && (
                                <p className="text-[10px] text-red-500 font-bold mt-1.5 animate-fade-in flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[10px]">error</span> Please select specific days
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Improved Address Section */}
        <div className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${errorFlags.includes('address') ? 'border-red-500 shadow-red-100 ring-1 ring-red-100' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined ${errorFlags.includes('address') ? 'text-red-500' : 'text-zepto-blue'}`}>location_on</span>
                    <h2 className={`text-lg font-bold ${errorFlags.includes('address') ? 'text-red-500' : 'text-gray-800'}`}>Delivery Address</h2>
                </div>
                {selectedAddress && (
                     <button 
                        onClick={() => setAddressView('list')}
                        className="text-xs font-bold text-zepto-blue bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        CHANGE
                    </button>
                )}
            </div>

            {selectedAddress ? (
                <div 
                    onClick={() => setAddressView('list')}
                    className="flex items-start gap-4 p-3 rounded-xl border border-blue-100 bg-blue-50/30 cursor-pointer"
                >
                     <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${selectedAddress.tag === 'Home' ? 'bg-blue-100 text-blue-600' : selectedAddress.tag === 'Work' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                        <span className="material-symbols-outlined">
                            {selectedAddress.tag === 'Home' ? 'home' : selectedAddress.tag === 'Work' ? 'domain' : 'location_on'}
                        </span>
                    </div>
                    <div className="flex-grow">
                        <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                            {selectedAddress.tag} 
                            {selectedAddress.isDefault && <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded uppercase">Default</span>}
                        </h4>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{selectedAddress.houseNo} {selectedAddress.landmark ? `, ${selectedAddress.landmark}` : ''}</p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{selectedAddress.address}</p>
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-500 font-bold bg-white px-2 py-1 rounded border border-gray-100 w-fit">
                            <span className="material-symbols-outlined text-sm">person</span>
                            {selectedAddress.receiverName || 'User'} • {selectedAddress.receiverPhone}
                        </div>
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => setAddressView('list')}
                    className={`w-full py-4 border-2 border-dashed rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                        errorFlags.includes('address') 
                        ? 'border-red-300 text-red-500 bg-red-50 hover:bg-red-100' 
                        : 'border-gray-200 text-gray-500 hover:border-zepto-blue hover:text-zepto-blue bg-gray-50'
                    }`}
                >
                    <span className="material-symbols-outlined">add_location_alt</span> 
                    Select Delivery Address
                </button>
            )}
        </div>

        {/* Detailed Weekly Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
                <span className="material-symbols-outlined text-zepto-blue">receipt_long</span>
                <h2 className="text-lg font-bold text-gray-800">Subscription Summary</h2>
            </div>
            
            {!morning.enabled && !evening.enabled ? (
                <p className="text-center text-sm text-gray-400 italic py-4">No slots selected yet</p>
            ) : (
                <div className="space-y-6">
                    {/* Morning Breakdown */}
                    {morning.enabled && (
                        <div className="animate-slide-up">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">☀️</span>
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">Morning Slot</p>
                                        <p className="text-xs text-gray-500">{morning.quantity}L {morning.type === 'buffalo' ? 'Buffalo' : 'Cow'} Milk</p>
                                    </div>
                                </div>
                                <p className="font-bold text-gray-900 text-sm">₹{getSlotWeeklyCost(morning).toFixed(0)}<span className="text-xs font-normal text-gray-400">/week</span></p>
                            </div>
                            
                            {/* Day Visualizer */}
                            <div className="flex gap-1.5 mb-2">
                                {DAYS.map((d) => {
                                    const isActive = morning.frequency === 'daily' || morning.days.includes(d);
                                    return (
                                        <div key={d} className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border ${isActive ? 'bg-yellow-100 border-yellow-200 text-yellow-700' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
                                            {d.charAt(0)}
                                        </div>
                                    )
                                })}
                            </div>
                            <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[10px]">info</span>
                                {morning.frequency === 'daily' ? '7 days/week' : `${morning.days.length} days/week`} • ₹{MILK_PRICES[morning.type] * morning.quantity}/delivery
                            </p>
                        </div>
                    )}

                    {/* Divider if both active */}
                    {morning.enabled && evening.enabled && <div className="border-t border-dashed border-gray-100"></div>}

                    {/* Evening Breakdown */}
                    {evening.enabled && (
                        <div className="animate-slide-up">
                             <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🌙</span>
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">Evening Slot</p>
                                        <p className="text-xs text-gray-500">{evening.quantity}L {evening.type === 'buffalo' ? 'Buffalo' : 'Cow'} Milk</p>
                                    </div>
                                </div>
                                <p className="font-bold text-gray-900 text-sm">₹{getSlotWeeklyCost(evening).toFixed(0)}<span className="text-xs font-normal text-gray-400">/week</span></p>
                            </div>
                            
                             <div className="flex gap-1.5 mb-2">
                                {DAYS.map((d) => {
                                    const isActive = evening.frequency === 'daily' || evening.days.includes(d);
                                    return (
                                        <div key={d} className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border ${isActive ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
                                            {d.charAt(0)}
                                        </div>
                                    )
                                })}
                            </div>
                            <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[10px]">info</span>
                                {evening.frequency === 'daily' ? '7 days/week' : `${evening.days.length} days/week`} • ₹{MILK_PRICES[evening.type] * evening.quantity}/delivery
                            </p>
                        </div>
                    )}
                </div>
            )}

            <div className="border-t border-gray-100 my-4 pt-3 space-y-2">
                 <div className="flex justify-between items-center text-sm">
                     <span className="text-gray-500 font-medium">Weekly Total</span>
                     <span className="font-bold text-gray-800">₹{calculateTotalWeeklyCost().toFixed(0)}</span>
                 </div>
            </div>

            {/* Auto Pay Toggle */}
            <div className="mt-4">
                <div 
                    onClick={() => setAutoPay(!autoPay)}
                    className={`p-3 rounded-xl border transition-all duration-300 cursor-pointer ${autoPay ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${autoPay ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                <span className="material-symbols-outlined text-lg">autorenew</span>
                            </div>
                            <div>
                                <p className={`text-sm font-bold ${autoPay ? 'text-green-800' : 'text-gray-800'}`}>Real-time Auto-Pay</p>
                                <p className="text-xs text-gray-500">UPI • Credit/Debit Cards</p>
                            </div>
                        </div>
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${autoPay ? 'bg-green-500' : 'bg-gray-300'}`}>
                            <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${autoPay ? 'translate-x-4' : ''}`}></div>
                        </div>
                    </div>
                     {autoPay && (
                        <div className="mt-2 pt-2 border-t border-green-100/50">
                            <p className="text-[10px] text-green-700 leading-relaxed flex items-start gap-1">
                                <span className="material-symbols-outlined text-xs mt-0.5">verified_user</span>
                                <span>Securely link your UPI or Card. Amount deducted automatically at 5 PM before delivery.</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          <button 
            onClick={handleSubscribe}
            disabled={isSubmitting}
            className="w-full bg-zepto-yellow text-zepto-blue font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
                <>
                    <span className="w-5 h-5 border-2 border-zepto-blue border-t-transparent rounded-full animate-spin"></span>
                    Processing...
                </>
            ) : (
                <>
                    {isUpdateFlow ? 'Update Subscription' : 'Subscribe Now'}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
            )}
          </button>
      </div>

      {/* Day Selection Modal */}
      {modalSlot && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setModalSlot(null)}></div>
              <div className="relative bg-white w-full max-w-lg rounded-t-3xl p-6 animate-slide-up shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-gray-800">Select {modalSlot === 'morning' ? 'Morning' : 'Evening'} Days</h3>
                      <button onClick={() => setModalSlot(null)} className="p-2 bg-gray-100 rounded-full">
                          <span className="material-symbols-outlined text-gray-500">close</span>
                      </button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                      {DAYS.map((day) => {
                          const currentDays = modalSlot === 'morning' ? morning.days : evening.days;
                          const isSelected = currentDays.includes(day);
                          return (
                              <button 
                                key={day}
                                onClick={() => {
                                    const newDays = isSelected ? currentDays.filter(d => d !== day) : [...currentDays, day];
                                    updateSlot(modalSlot, { days: newDays });
                                }}
                                className={`
                                    relative flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm border-2 transition-all duration-200
                                    ${isSelected 
                                        ? 'bg-zepto-blue text-white border-zepto-blue shadow-md scale-[1.02]' 
                                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                    }
                                `}
                              >
                                  {isSelected && <span className="material-symbols-outlined text-lg">check_circle</span>}
                                  <span>{day}</span>
                              </button>
                          );
                      })}
                  </div>

                  <button 
                    onClick={() => setModalSlot(null)}
                    className="w-full bg-zepto-blue text-white font-bold py-3.5 rounded-xl shadow-lg"
                  >
                      Confirm Days
                  </button>
              </div>
          </div>
      )}

      {/* 1. Address Selection Bottom Sheet */}
      {addressView === 'list' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setAddressView('none')}></div>
            <div className="relative bg-gray-50 w-full max-w-lg rounded-t-3xl shadow-2xl animate-slide-up flex flex-col max-h-[80vh]">
                <div className="p-5 bg-white rounded-t-3xl border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
                    <h3 className="text-lg font-bold text-gray-800">Select Address</h3>
                    <button onClick={() => setAddressView('none')} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                        <span className="material-symbols-outlined text-gray-600">close</span>
                    </button>
                </div>

                <div className="p-4 overflow-y-auto space-y-3">
                    <button 
                        onClick={startAddNewAddress}
                        className="w-full py-3.5 border border-dashed border-zepto-blue bg-blue-50/50 rounded-xl text-zepto-blue font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Add New Address
                    </button>

                    {addresses.length === 0 ? (
                        <div className="text-center py-10 opacity-60">
                            <span className="material-symbols-outlined text-4xl text-gray-300">location_off</span>
                            <p className="text-sm text-gray-500 mt-2">No addresses saved</p>
                        </div>
                    ) : (
                        addresses.map((addr) => (
                            <div 
                                key={addr.id}
                                onClick={() => {
                                    setSelectedAddressId(addr.id);
                                    setAddressView('none');
                                    // Clear address error
                                    setErrorFlags(prev => prev.filter(e => e !== 'address'));
                                }}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex gap-3 relative overflow-hidden group ${selectedAddressId === addr.id ? 'bg-white border-zepto-blue shadow-md' : 'bg-white border-transparent hover:border-gray-200 shadow-sm'}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${addr.tag === 'Home' ? 'bg-blue-100 text-blue-600' : addr.tag === 'Work' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                                    <span className="material-symbols-outlined">
                                        {addr.tag === 'Home' ? 'home' : addr.tag === 'Work' ? 'domain' : 'location_on'}
                                    </span>
                                </div>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-gray-800 text-sm">{addr.tag}</h4>
                                        {selectedAddressId === addr.id && <span className="material-symbols-outlined text-zepto-blue text-lg">check_circle</span>}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-0.5">{addr.houseNo}</p>
                                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{addr.address}</p>
                                </div>
                                
                                {/* Edit Actions - Show on hover or touch */}
                                <div className="absolute right-2 bottom-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                        onClick={(e) => startEditAddress(e, addr)}
                                        className="p-1.5 bg-gray-100 hover:bg-blue-100 hover:text-blue-600 rounded-lg text-gray-500 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}

      {/* 2. Full Screen Map View */}
      {addressView === 'map' && (
          <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col animate-slide-up">
              {/* Header with Search */}
              <div className="absolute top-0 left-0 right-0 z-30 p-4 pt-4 bg-gradient-to-b from-black/50 to-transparent flex gap-3 pointer-events-none">
                  <button 
                    onClick={() => setAddressView('list')} 
                    className="pointer-events-auto w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 active:scale-95 transition-transform flex-shrink-0"
                  >
                      <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <div className="pointer-events-auto flex-grow bg-white rounded-full shadow-lg h-10 flex items-center px-4 animate-slide-up relative">
                      <span className="material-symbols-outlined text-gray-400">search</span>
                      <input 
                        type="text" 
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Search for area..." 
                        className="ml-2 flex-grow bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400" 
                      />
                  </div>
              </div>

              {/* Map Canvas */}
              <div 
                className="absolute inset-0 z-0 bg-[#e5e7eb] w-full h-full cursor-grab active:cursor-grabbing touch-none"
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
              >
                   <div 
                      className="w-full h-full relative will-change-transform"
                      style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
                   >
                        <div className="absolute inset-[-100%]" style={{
                            width: '300%', height: '300%',
                            backgroundImage: `linear-gradient(#d1d5db 1px, transparent 1px), linear-gradient(90deg, #d1d5db 1px, transparent 1px)`,
                            backgroundSize: '50px 50px', backgroundColor: '#f3f4f6'
                        }}></div>
                        
                        <div className="absolute top-[40%] left-[60%] w-64 h-24 bg-[#e5e7eb] transform -skew-y-3 border-y-8 border-white"></div>
                        <div className="absolute top-[60%] left-[20%] w-24 h-24 bg-white rounded-md shadow-sm border border-gray-200"></div>
                        <div className="absolute top-[45%] left-[45%] bg-white/90 px-2 py-0.5 text-[10px] font-bold text-gray-500 rounded-sm transform -rotate-12 shadow-sm pointer-events-none">12th Main Rd</div>
                   </div>
              </div>

              {/* Central Pin */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center pointer-events-none">
                   <div className="relative">
                       <span className={`material-symbols-outlined text-5xl text-zepto-order-red drop-shadow-2xl transition-transform ${isDragging ? '-translate-y-4' : 'animate-bounce'}`}>location_on</span>
                       <div className="w-4 h-2 bg-black/30 rounded-full mx-auto blur-[2px] mt-[-5px]"></div>
                   </div>
                   {!isDragging && (
                       <div className="bg-black/80 text-white text-xs px-3 py-1.5 rounded-full mt-2 backdrop-blur-md shadow-lg font-medium whitespace-nowrap animate-fade-in flex items-center gap-1">
                           <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                           Move map to adjust
                       </div>
                   )}
              </div>

              {/* Locate Me */}
              <button 
                onClick={handleLocateMe}
                className="absolute bottom-48 right-4 z-20 bg-white p-3.5 rounded-full shadow-xl text-zepto-blue hover:bg-gray-50 active:scale-95 transition-all border border-gray-100 group"
              >
                  {isLocating ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">my_location</span>}
              </button>

              {/* Bottom Sheet */}
              <div className="absolute bottom-0 left-0 right-0 bg-white z-20 rounded-t-3xl shadow-[0_-5px_30px_rgba(0,0,0,0.15)] p-6 animate-slide-up">
                  <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
                  <h3 className="font-bold text-gray-800 text-lg mb-2">Select Delivery Location</h3>
                  <div className="flex items-start gap-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 text-red-500">
                        <span className="material-symbols-outlined text-lg">location_on</span>
                      </div>
                      <div>
                          <p className="text-sm text-gray-800 font-bold leading-snug">{newAddress.mapAddress}</p>
                          <p className="text-xs text-gray-400 mt-1 font-medium">Bengaluru, Karnataka</p>
                      </div>
                  </div>
                  <button 
                      onClick={confirmMapLocation}
                      disabled={isConfirmingMap}
                      className="w-full bg-zepto-yellow text-zepto-blue font-bold py-4 rounded-xl shadow-lg hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                      {isConfirmingMap ? "Confirming..." : "Confirm Location"}
                  </button>
              </div>
          </div>
      )}

      {/* 3. Address Details Form */}
      {addressView === 'form' && (
          <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col animate-slide-up overflow-y-auto">
             <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center sticky top-0 z-10">
                <button 
                  onClick={() => setAddressView('map')} 
                  className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-gray-700"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold ml-2 text-gray-900">{editingId ? 'Edit Details' : 'Enter Address Details'}</h1>
             </div>
             
             <div className="p-4 space-y-6 pb-24">
                {/* Map Preview Snippet */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-zepto-blue">
                             <span className="material-symbols-outlined">map</span>
                        </div>
                        <div className="overflow-hidden">
                             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Selected Location</p>
                             <p className="text-sm text-gray-800 font-medium truncate max-w-[200px]">{newAddress.mapAddress}</p>
                        </div>
                    </div>
                    <button onClick={() => setAddressView('map')} className="text-xs font-bold text-zepto-blue hover:underline bg-blue-50 px-3 py-1.5 rounded-lg">CHANGE</button>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-5 animate-slide-up">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Receiver's Name *</label>
                            <input 
                                type="text" 
                                value={newAddress.receiverName}
                                onChange={(e) => {
                                    setNewAddress(prev => ({...prev, receiverName: e.target.value}));
                                    if(formErrors.receiverName) setFormErrors({...formErrors, receiverName: ''});
                                }}
                                className={`w-full p-3.5 bg-gray-50 border rounded-xl font-semibold text-gray-800 focus:outline-none focus:bg-white transition-all text-sm ${formErrors.receiverName ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-zepto-blue'}`}
                                placeholder="Name"
                            />
                        </div>
                         <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Phone Number *</label>
                            <input 
                                type="tel" 
                                value={newAddress.receiverPhone}
                                maxLength={10}
                                onChange={(e) => {
                                    setNewAddress(prev => ({...prev, receiverPhone: e.target.value.replace(/\D/g, '')}));
                                    if(formErrors.receiverPhone) setFormErrors({...formErrors, receiverPhone: ''});
                                }}
                                className={`w-full p-3.5 bg-gray-50 border rounded-xl font-semibold text-gray-800 focus:outline-none focus:bg-white transition-all text-sm ${formErrors.receiverPhone ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-zepto-blue'}`}
                                placeholder="Mobile"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">House / Flat / Block No. *</label>
                        <input 
                            type="text" 
                            value={newAddress.houseNo}
                            onChange={(e) => {
                                setNewAddress(prev => ({...prev, houseNo: e.target.value}));
                                if(formErrors.houseNo) setFormErrors({...formErrors, houseNo: ''});
                            }}
                            className={`w-full p-3.5 bg-gray-50 border rounded-xl font-semibold text-gray-800 focus:outline-none focus:bg-white transition-all text-sm ${formErrors.houseNo ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-zepto-blue'}`}
                            placeholder="Ex: Flat 402, Sunshine Apts"
                            autoFocus
                        />
                         {formErrors.houseNo && <p className="text-[10px] text-red-500 mt-1 font-medium">{formErrors.houseNo}</p>}
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Save As *</label>
                        <div className="flex gap-3 mb-3">
                            {['Home', 'Work', 'Other'].map(t => (
                                <button 
                                    key={t}
                                    onClick={() => {
                                        setNewAddress(prev => ({...prev, tag: t}));
                                        if (t !== 'Other') setNewAddress(prev => ({...prev, customTag: ''}));
                                    }}
                                    className={`flex-1 py-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-all ${newAddress.tag === t ? 'bg-zepto-blue text-white border-zepto-blue shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <span className="material-symbols-outlined text-lg">
                                        {t === 'Home' ? 'home' : t === 'Work' ? 'work' : 'location_on'}
                                    </span>
                                    {t}
                                </button>
                            ))}
                        </div>
                        {newAddress.tag === 'Other' && (
                            <input 
                                type="text" 
                                value={newAddress.customTag}
                                onChange={(e) => setNewAddress(prev => ({...prev, customTag: e.target.value}))}
                                className="w-full p-3.5 bg-blue-50 border border-zepto-blue rounded-xl font-semibold text-gray-800 focus:outline-none focus:bg-white transition-all text-sm"
                                placeholder="E.g. Friend's House"
                            />
                        )}
                    </div>
                </div>
             </div>

             <div className="p-4 bg-white border-t border-gray-100 fixed bottom-0 left-0 right-0">
                <button 
                    onClick={saveNewAddress}
                    className="w-full bg-zepto-yellow text-zepto-blue font-bold py-3.5 rounded-xl shadow-lg hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    {editingId ? 'Update Address' : 'Save & Use Address'}
                </button>
            </div>
          </div>
      )}

      {toastMsg && <Toast msg={toastMsg.msg} onClose={() => setToastMsg(null)} type={toastMsg.type} />}

    </div>
  );
};

// ... Rest of the file (ManagePlan and default export) remains largely the same ...
// Including the ManagePlan component here to ensure full file integrity is maintained in the output

// --- Updated Manage Plan Component ---
const ManagePlan: React.FC = () => {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<any>(null);
  const [nextDeliveries, setNextDeliveries] = useState<any[]>([]);
  const [skippedDates, setSkippedDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cancellation State
  const [cancellationView, setCancellationView] = useState(false);
  const [cancelSlot, setCancelSlot] = useState<'morning' | 'evening' | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [showToast, setShowToast] = useState<string | null>(null);

  const cancellationReasonsList = [
      "Moving out of town",
      "Milk quality issue",
      "Delivery timing issue",
      "Price is too high",
      "Taking a break",
      "Other"
  ];

  useEffect(() => {
      const savedSub = localStorage.getItem('taaza_milk_subscription');
      if (savedSub) {
          const parsed = JSON.parse(savedSub);
          setSubscription(parsed);
          
          // Load Skipped Dates
          const savedSkips = localStorage.getItem('taaza_milk_skipped');
          const skips = savedSkips ? JSON.parse(savedSkips) : [];
          setSkippedDates(skips);

          generateSchedule(parsed, skips);
          setIsLoading(false);
      } else {
          // Redirect to subscribe if no plan exists
          navigate('/milk/subscribe', { replace: true });
      }
  }, []);

  const calculateWeeklyTotal = (sub: any) => {
      let total = 0;
      if (sub.morning.enabled) {
          const days = sub.morning.frequency === 'daily' ? 7 : sub.morning.days.length;
          total += sub.morning.quantity * MILK_PRICES[sub.morning.type as MilkType] * days;
      }
      if (sub.evening.enabled) {
          const days = sub.evening.frequency === 'daily' ? 7 : sub.evening.days.length;
          total += sub.evening.quantity * MILK_PRICES[sub.evening.type as MilkType] * days;
      }
      return total;
  };

  const generateSchedule = (sub: any, skips: string[]) => {
      const schedule = [];
      const today = new Date();
      // Generate for next 5 days starting from tomorrow
      for (let i = 1; i <= 5; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          
          const fullDateStr = d.toISOString().split('T')[0];
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
          const dayDisplay = i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
          
          let morningItem = null;
          let eveningItem = null;

          if (sub.morning.enabled) {
              const isScheduled = sub.morning.frequency === 'daily' || sub.morning.days.includes(dayName);
              if (isScheduled) {
                  morningItem = {
                      type: sub.morning.type,
                      qty: sub.morning.quantity,
                      time: 'Morning',
                      isSkipped: skips.includes(`${fullDateStr}-morning`)
                  };
              }
          }

          if (sub.evening.enabled) {
              const isScheduled = sub.evening.frequency === 'daily' || sub.evening.days.includes(dayName);
              if (isScheduled) {
                  eveningItem = {
                      type: sub.evening.type,
                      qty: sub.evening.quantity,
                      time: 'Evening',
                      isSkipped: skips.includes(`${fullDateStr}-evening`)
                  };
              }
          }

          if (morningItem || eveningItem) {
              schedule.push({ 
                  date: dayDisplay, 
                  fullDate: fullDateStr,
                  morning: morningItem, 
                  evening: eveningItem
              });
          }
      }
      setNextDeliveries(schedule);
  };

  const handleSkip = (dateStr: string, slot: 'morning' | 'evening') => {
      const now = new Date();
      const targetDate = new Date(dateStr);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = targetDate.getDate() === tomorrow.getDate() && targetDate.getMonth() === tomorrow.getMonth();

      // Lock Logic
      if (isTomorrow && now.getHours() >= 17) {
          alert("Cut-off time passed. Cannot modify tomorrow's delivery after 5 PM.");
          return;
      }

      const skipKey = `${dateStr}-${slot}`;
      let newSkips = [...skippedDates];
      
      if (newSkips.includes(skipKey)) {
          newSkips = newSkips.filter(d => d !== skipKey); // Resume
      } else {
          newSkips.push(skipKey); // Skip
      }

      setSkippedDates(newSkips);
      localStorage.setItem('taaza_milk_skipped', JSON.stringify(newSkips));
      
      if (subscription) {
          generateSchedule(subscription, newSkips);
      }
  };

  const handleCancelClick = (slot: 'morning' | 'evening') => {
      setCancelSlot(slot);
      setCancelReason('');
      setOtherReason('');
      setCancellationView(true);
  };

  const processCancellation = () => {
      if (!cancelSlot || !subscription) return;

      const updatedSub = { 
          ...subscription,
          [cancelSlot]: {
              ...subscription[cancelSlot],
              enabled: false
          }
      };
      
      localStorage.setItem('taaza_milk_subscription', JSON.stringify(updatedSub));
      setSubscription(updatedSub);
      generateSchedule(updatedSub, skippedDates);
      
      setCancellationView(false);
      setShowToast(`${cancelSlot === 'morning' ? 'Morning' : 'Evening'} slot cancelled`);
  };

  const isLocked = (dateStr: string) => {
      const now = new Date();
      const targetDate = new Date(dateStr);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const isTomorrow = targetDate.getDate() === tomorrow.getDate() && targetDate.getMonth() === tomorrow.getMonth();
      return isTomorrow && now.getHours() >= 17;
  };

  if (cancellationView) {
      return (
          <div className="min-h-screen bg-white flex flex-col animate-slide-up relative z-50">
              <div className="p-4 border-b border-gray-50 flex items-center">
                  <button 
                    onClick={() => setCancellationView(false)}
                    className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-600"
                  >
                      <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <span className="font-bold text-lg ml-2 text-gray-800">Cancel Subscription</span>
              </div>

              <div className="flex-grow p-6 overflow-y-auto pb-32">
                  {/* Hero Illustration */}
                  <div className="flex flex-col items-center text-center mb-8">
                      <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-4 relative animate-fade-in">
                          <span className="material-symbols-outlined text-5xl text-red-400">sentiment_very_dissatisfied</span>
                          <div className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow-sm">
                              <span className="material-symbols-outlined text-xl text-gray-400">broken_image</span>
                          </div>
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 mb-2">Pausing fresh milk?</h2>
                      <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
                          You are cancelling your <span className="font-bold text-gray-800 capitalize">{cancelSlot}</span> slot. You won't receive deliveries starting tomorrow.
                      </p>
                  </div>

                  {/* Reasons */}
                  <div className="space-y-4 animate-slide-up">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Help us improve</p>
                      {cancellationReasonsList.map((r) => (
                          <label 
                            key={r} 
                            className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group ${
                                cancelReason === r 
                                ? 'border-red-500 bg-red-50/30' 
                                : 'border-gray-100 hover:border-gray-200 bg-white'
                            }`}
                          >
                              <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center transition-colors ${
                                  cancelReason === r ? 'border-red-500' : 'border-gray-300 group-hover:border-gray-400'
                              }`}>
                                  {cancelReason === r && <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>}
                              </div>
                              <input 
                                type="radio" 
                                name="reason" 
                                className="hidden" 
                                value={r} 
                                checked={cancelReason === r} 
                                onChange={() => setCancelReason(r)} 
                              />
                              <span className={`font-medium text-sm ${cancelReason === r ? 'text-red-900' : 'text-gray-600'}`}>{r}</span>
                          </label>
                      ))}
                  </div>

                  {/* Other Reason Textarea */}
                  <div className={`overflow-hidden transition-all duration-300 ${cancelReason === 'Other' ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                      <textarea 
                          value={otherReason} 
                          onChange={(e) => setOtherReason(e.target.value)}
                          placeholder="Tell us what went wrong..." 
                          className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:border-red-500 outline-none min-h-[100px] bg-gray-50 resize-none placeholder-gray-400"
                      />
                  </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] flex flex-col gap-3">
                  <button 
                      onClick={() => setCancellationView(false)} 
                      className="w-full py-4 bg-zepto-blue text-white font-bold rounded-xl hover:bg-blue-900 transition-colors shadow-lg active:scale-[0.98]"
                  >
                      No, Keep My Plan
                  </button>
                  <button 
                      onClick={processCancellation}
                      disabled={!cancelReason || (cancelReason === 'Other' && !otherReason.trim())}
                      className="w-full py-3 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                      Cancel Subscription
                  </button>
              </div>
          </div>
      )
  }

  if (isLoading || !subscription) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
             <div className="w-10 h-10 border-4 border-gray-200 border-t-zepto-blue rounded-full animate-spin"></div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="My Subscription" backPath="/home" />
      
      <div className="p-4 space-y-5 animate-slide-up">
        
        {/* Active Slots */}
        <div className="space-y-3">
             <h3 className="text-sm font-bold text-gray-700 ml-1">Your Plan</h3>
             
             {subscription.morning.enabled && (
                 <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-zepto-yellow border-gray-100 relative overflow-hidden">
                     <div className="flex justify-between items-start mb-2">
                         <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-xl shadow-sm">☀️</div>
                             <div>
                                 <h4 className="font-bold text-gray-800 text-sm">Morning Slot</h4>
                                 <p className="text-xs text-gray-500">{subscription.morning.quantity}L {subscription.morning.type} Milk</p>
                             </div>
                         </div>
                         <div className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Active</div>
                     </div>
                     <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                         <p className="text-xs text-gray-500 font-medium">
                            {subscription.morning.frequency === 'daily' ? 'Daily' : subscription.morning.days.join(', ')}
                         </p>
                         <button 
                            onClick={() => handleCancelClick('morning')}
                            className="text-[10px] font-bold text-white bg-red-500 border border-red-500 px-3 py-1.5 rounded hover:bg-red-600 transition-colors shadow-sm"
                         >
                            CANCEL
                         </button>
                     </div>
                 </div>
             )}

             {subscription.evening.enabled && (
                 <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-zepto-blue border-gray-100 relative overflow-hidden">
                     <div className="flex justify-between items-start mb-2">
                         <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-xl shadow-sm">🌙</div>
                             <div>
                                 <h4 className="font-bold text-gray-800 text-sm">Evening Slot</h4>
                                 <p className="text-xs text-gray-500">{subscription.evening.quantity}L {subscription.evening.type} Milk</p>
                             </div>
                         </div>
                         <div className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Active</div>
                     </div>
                     <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                         <p className="text-xs text-gray-500 font-medium">
                            {subscription.evening.frequency === 'daily' ? 'Daily' : subscription.evening.days.join(', ')}
                         </p>
                         <button 
                            onClick={() => handleCancelClick('evening')}
                            className="text-[10px] font-bold text-white bg-red-500 border border-red-500 px-3 py-1.5 rounded hover:bg-red-600 transition-colors shadow-sm"
                         >
                            CANCEL
                         </button>
                     </div>
                 </div>
             )}
             
             {!subscription.morning.enabled && !subscription.evening.enabled && (
                 <div className="bg-gray-50 p-6 rounded-xl text-center border-2 border-dashed border-gray-200">
                     <p className="text-sm text-gray-500 mb-4">You have cancelled all your plans.</p>
                     <button onClick={() => navigate('/milk/subscribe')} className="text-zepto-blue font-bold text-sm underline">Re-subscribe</button>
                 </div>
             )}
        </div>

        {/* Weekly Bill Summary */}
        {(subscription.morning.enabled || subscription.evening.enabled) && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estimated Weekly Bill</p>
                    <p className="text-xl font-bold text-gray-900">₹{calculateWeeklyTotal(subscription)}</p>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg">
                    <span className="material-symbols-outlined text-zepto-blue">receipt_long</span>
                </div>
            </div>
        )}

        {/* Schedule */}
        {(subscription.morning.enabled || subscription.evening.enabled) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-700">Upcoming Deliveries</h3>
                    <span className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-500 font-medium">Next 5 Days</span>
                </div>
                <div className="divide-y divide-gray-50">
                    {nextDeliveries.map((day, i) => {
                        const locked = isLocked(day.fullDate);
                        return (
                            <div key={i} className="p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 rounded uppercase">{day.date.split(' ')[0]}</span>
                                    <span className="text-sm font-bold text-gray-800">{day.date.split(' ')[1] || ''}</span>
                                </div>
                                
                                <div className="space-y-3 pl-2 border-l-2 border-gray-100 ml-1">
                                    {/* Morning Row */}
                                    {day.morning && (
                                        <div className={`flex justify-between items-center p-2 rounded-lg ${day.morning.isSkipped ? 'bg-red-50/50' : 'bg-yellow-50/30'}`}>
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg">☀️</span>
                                                <div>
                                                    <p className={`text-xs font-bold ${day.morning.isSkipped ? 'text-red-400 line-through' : 'text-gray-800'}`}>
                                                        {day.morning.qty}L {day.morning.type}
                                                    </p>
                                                    {day.morning.isSkipped && <p className="text-[9px] text-red-500 font-bold uppercase">Skipped</p>}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleSkip(day.fullDate, 'morning')}
                                                disabled={locked}
                                                className={`text-[10px] font-bold px-3 py-1.5 rounded border transition-all ${
                                                    locked 
                                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                                                    : day.morning.isSkipped
                                                        ? 'bg-white text-green-600 border-green-200 shadow-sm'
                                                        : 'bg-white text-red-500 border-red-100 hover:bg-red-50 shadow-sm'
                                                }`}
                                            >
                                                {locked ? 'LOCKED' : day.morning.isSkipped ? 'RESUME' : 'SKIP'}
                                            </button>
                                        </div>
                                    )}

                                    {/* Evening Row */}
                                    {day.evening && (
                                        <div className={`flex justify-between items-center p-2 rounded-lg ${day.evening.isSkipped ? 'bg-red-50/50' : 'bg-blue-50/30'}`}>
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg">🌙</span>
                                                <div>
                                                    <p className={`text-xs font-bold ${day.evening.isSkipped ? 'text-red-400 line-through' : 'text-gray-800'}`}>
                                                        {day.evening.qty}L {day.evening.type}
                                                    </p>
                                                    {day.evening.isSkipped && <p className="text-[9px] text-red-500 font-bold uppercase">Skipped</p>}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleSkip(day.fullDate, 'evening')}
                                                disabled={locked}
                                                className={`text-[10px] font-bold px-3 py-1.5 rounded border transition-all ${
                                                    locked 
                                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                                                    : day.evening.isSkipped
                                                        ? 'bg-white text-green-600 border-green-200 shadow-sm'
                                                        : 'bg-white text-red-500 border-red-100 hover:bg-red-50 shadow-sm'
                                                }`}
                                            >
                                                {locked ? 'LOCKED' : day.evening.isSkipped ? 'RESUME' : 'SKIP'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
        
        {/* Address Summary */}
        {subscription.address && (
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center">
                 <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
                     <span className="material-symbols-outlined">location_on</span>
                 </div>
                 <div>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Delivering To</p>
                     <p className="text-sm font-bold text-gray-800">{subscription.address.tag}</p>
                     <p className="text-xs text-gray-500 truncate max-w-[200px]">{subscription.address.houseNo}, {subscription.address.address}</p>
                 </div>
             </div>
        )}

        <button 
            onClick={() => navigate('/milk/subscribe')}
            className="w-full border border-zepto-blue text-zepto-blue font-bold py-3.5 rounded-xl hover:bg-blue-50 transition-colors"
        >
            Modify Plan
        </button>

      </div>
      
      {showToast && <Toast msg={showToast} onClose={() => setShowToast(null)} />}
    </div>
  );
};

const MilkPlan: React.FC = () => {
  return (
    <Routes>
      <Route path="plan" element={<ManagePlan />} />
      <Route path="subscribe" element={<NewSubscription />} />
    </Routes>
  );
};

export default MilkPlan;