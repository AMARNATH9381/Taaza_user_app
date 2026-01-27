import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Layout';

// --- Constants ---
const CHICKEN_SKINLESS_PRICE = 249;
const CHICKEN_WITH_SKIN_PRICE = 219;
const CHICKEN_BONELESS_PRICE = 320;

// Dropdown Options for Quantity
const generateQuantityOptions = () => {
    const options = [];
    for (let grams = 500; grams <= 5000; grams += 250) {
        const kgValue = grams / 1000;
        let label = '';
        if (kgValue < 1) {
            label = `${grams} g`;
        } else {
            label = `${kgValue} kg`;
        }
        options.push({ label, value: kgValue });
    }
    return options;
};

const QTY_DROPDOWN_OPTIONS = generateQuantityOptions();

const REGULAR_CUT_OPTIONS = [
    { label: 'Curry Cut (Small)', value: 'Curry Small' },
    { label: 'Curry Cut (Medium)', value: 'Curry Medium' },
    { label: 'Biryani Cut', value: 'Biryani' }
];

// Specific cuts for Natu Kodi as requested
const NATTI_CUTS_OPTIONS = [
    { id: 'curry_small', label: 'Curry Cut (Small)', desc: 'Small pieces, best for thick gravy & fry.' },
    { id: 'curry_medium', label: 'Curry Cut (Medium)', desc: 'Standard pieces, best for pulusu/curry.' }
];

// Mock Data for Available Birds
const AVAILABLE_BIRDS = [
    { 
        id: 'bird_1', 
        label: '#1', 
        weight: '1.30 kg', 
        price: 750, 
        image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=800&q=80', 
        images: [
            'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1598511797332-9df7ccdb6789?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1563281577-a7be47e20db9?auto=format&fit=crop&w=800&q=80'
        ],
        tag: 'Farm Fresh', 
        netWeight: '0.95 kg' 
    },
    { 
        id: 'bird_2', 
        label: '#2', 
        weight: '1.45 kg', 
        price: 780, 
        image: 'https://images.unsplash.com/photo-1598511797332-9df7ccdb6789?auto=format&fit=crop&w=800&q=80', 
        images: [
            'https://images.unsplash.com/photo-1598511797332-9df7ccdb6789?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1519641776997-7c703d7e9b04?auto=format&fit=crop&w=800&q=80'
        ],
        tag: 'Premium', 
        netWeight: '1.10 kg' 
    },
];

// --- MUTTON DATA ---
const AVAILABLE_MUTTON_STOCK = [
    {
        id: 'sheep_101',
        type: 'sheep',
        tag: 'Bannur Special',
        origin: 'Mandya Farm',
        age: '10 Months',
        liveWeight: '22 kg',
        netEstimate: '14 kg',
        yield: 64, // percentage
        fatLevel: 'High',
        pricePerKg: 850,
        image: 'https://images.unsplash.com/photo-1484557985045-6f5c9840309a?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1484557985045-6f5c9840309a?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1511117833895-4b473c0b85d6?auto=format&fit=crop&w=800&q=80'
        ],
        parts: [
            { id: 'head', name: 'Head (Talakaya)', price: 450, unit: 'Full Set', canRoast: true, icon: 'skull' },
            { id: 'legs', name: 'Legs (Paya)', price: 350, unit: 'Set of 4', canRoast: true, icon: 'pets' },
            { id: 'liver', name: 'Liver & Heart', price: 400, unit: 'Full Set', icon: 'favorite' },
            { id: 'boti', name: 'Boti (Cleaned)', price: 300, unit: 'Full Set', icon: 'water_drop' },
        ]
    },
    {
        id: 'sheep_102',
        type: 'sheep',
        tag: 'Tender Choice',
        origin: 'Local Grazing',
        age: '8 Months',
        liveWeight: '18 kg',
        netEstimate: '11 kg',
        yield: 61,
        fatLevel: 'Medium',
        pricePerKg: 800,
        image: 'https://images.unsplash.com/photo-1511117833895-4b473c0b85d6?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1511117833895-4b473c0b85d6?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1484557985045-6f5c9840309a?auto=format&fit=crop&w=800&q=80'
        ],
        parts: [
            { id: 'head', name: 'Head (Talakaya)', price: 400, unit: 'Full Set', canRoast: true, icon: 'skull' },
            { id: 'legs', name: 'Legs (Paya)', price: 300, unit: 'Set of 4', canRoast: true, icon: 'pets' },
            { id: 'liver', name: 'Liver & Heart', price: 380, unit: 'Full Set', icon: 'favorite' },
        ]
    },
    {
        id: 'goat_201',
        type: 'goat',
        tag: 'Telangana Potla',
        origin: 'Nalgonda',
        age: '12 Months',
        liveWeight: '15 kg',
        netEstimate: '10 kg',
        yield: 66,
        fatLevel: 'Low',
        pricePerKg: 900,
        image: 'https://images.unsplash.com/photo-1560709407-74272cb23321?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1560709407-74272cb23321?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?auto=format&fit=crop&w=800&q=80'
        ],
        parts: [
            { id: 'head', name: 'Head (Talakaya)', price: 500, unit: 'Full Set', canRoast: true, icon: 'skull' },
            { id: 'legs', name: 'Legs (Paya)', price: 400, unit: 'Set of 4', canRoast: true, icon: 'pets' },
            { id: 'liver', name: 'Liver & Heart', price: 450, unit: 'Full Set', icon: 'favorite' },
            { id: 'boti', name: 'Boti (Cleaned)', price: 350, unit: 'Full Set', icon: 'water_drop' },
        ]
    },
    {
        id: 'goat_202',
        type: 'goat',
        tag: 'Black Bengal',
        origin: 'Free Range',
        age: '9 Months',
        liveWeight: '12 kg',
        netEstimate: '8 kg',
        yield: 66,
        fatLevel: 'Medium',
        pricePerKg: 950,
        image: 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?auto=format&fit=crop&w=800&q=80'
        ],
        parts: [
            { id: 'head', name: 'Head (Talakaya)', price: 480, unit: 'Full Set', canRoast: true, icon: 'skull' },
            { id: 'legs', name: 'Legs (Paya)', price: 380, unit: 'Set of 4', canRoast: true, icon: 'pets' },
        ]
    }
];

const getUpcomingSundays = () => {
    const dates = [];
    const today = new Date();
    const daysUntilSunday = (7 - today.getDay()) % 7;
    let nextSunday = new Date(today);
    
    // If today is Sunday, usually pre-booking closes previous day, so assume next Sunday.
    nextSunday.setDate(today.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));

    for (let i = 0; i < 3; i++) {
        dates.push(nextSunday.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }));
        nextSunday.setDate(nextSunday.getDate() + 7);
    }
    return dates;
};

const DYNAMIC_SUNDAYS = getUpcomingSundays();

// --- Components ---
const Toast: React.FC<{ msg: string; onClose: () => void }> = ({ msg, onClose }) => {
    useEffect(() => {
        const t = setTimeout(onClose, 2000);
        return () => clearTimeout(t);
    }, [onClose]);
    return (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-xl z-[60] animate-fade-in flex items-center gap-2 font-medium whitespace-nowrap">
            <span className="material-symbols-outlined text-xl text-green-400">check_circle</span>
            {msg}
        </div>
    );
};

const YieldMeter: React.FC<{ live: string; net: string; percent: number }> = ({ live, net, percent }) => (
    <div className="bg-gray-50 rounded-lg p-2 border border-gray-100 mb-3">
        <div className="flex justify-between text-[10px] text-gray-500 mb-1 font-bold">
            <span>Live: {live}</span>
            <span>Net: ~{net}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden relative">
            <div className="h-full bg-gradient-to-r from-orange-400 to-green-500" style={{ width: `${percent}%` }}></div>
        </div>
        <div className="flex justify-center mt-1">
            <span className="text-[9px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-bold border border-green-100 flex items-center gap-1">
                {percent}% Meat Yield
                <span className="material-symbols-outlined text-[10px] text-gray-400">info</span>
            </span>
        </div>
    </div>
);

const MeatOrder: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'chicken' | 'mutton'>('chicken');
  const [chickenType, setChickenType] = useState<'broiler' | 'natti'>('broiler');
  
  const [cartCount, setCartCount] = useState(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  // --- Chicken State ---
  const [skinlessWeight, setSkinlessWeight] = useState(0.5);
  const [skinlessCut, setSkinlessCut] = useState('Curry Small');
  const [skinWeight, setSkinWeight] = useState(0.5);
  const [skinCut, setSkinCut] = useState('Curry Small');
  const [bonelessWeight, setBonelessWeight] = useState(0.5);

  // Natti State
  const [selectedBirdId, setSelectedBirdId] = useState(AVAILABLE_BIRDS[0].id);
  const [previewItem, setPreviewItem] = useState<any | null>(null); 
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [nattiPrepType, setNattiPrepType] = useState<'live' | 'cut'>('cut');
  const [nattiCut, setNattiCut] = useState(NATTI_CUTS_OPTIONS[0].id);
  const [includeOffals, setIncludeOffals] = useState(true);
  const [includeHeadLegs, setIncludeHeadLegs] = useState(true);

  // --- Mutton State ---
  const [muttonAnimalType, setMuttonAnimalType] = useState<'sheep' | 'goat'>('sheep');
  const [selectedMuttonId, setSelectedMuttonId] = useState<string>(''); 
  const [muttonBookingMode, setMuttonBookingMode] = useState<'meat' | 'parts'>('meat');
  const [muttonQty, setMuttonQty] = useState(1.0);
  const [muttonDate, setMuttonDate] = useState(DYNAMIC_SUNDAYS[0]);
  const [muttonCutType, setMuttonCutType] = useState('Mixed Curry Cut');
  const [reservedParts, setReservedParts] = useState<string[]>([]);
  
  // Track cleaning preferences for parts: key = `${animalId}-${partId}`
  const [roastPreferences, setRoastPreferences] = useState<Record<string, boolean>>({});

  useEffect(() => {
    updateCartMetrics();
    const defaultMutton = AVAILABLE_MUTTON_STOCK.find(m => m.type === muttonAnimalType);
    if(defaultMutton) setSelectedMuttonId(defaultMutton.id);
  }, [muttonAnimalType]);

  const updateCartMetrics = () => {
    const cart = JSON.parse(localStorage.getItem('taaza_cart') || '[]');
    const count = cart.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
    setCartCount(count);
    
    // Sync reserved parts
    const reserved = cart
        .filter((item: any) => item.id.startsWith('mutton-part-'))
        .map((item: any) => item.uniqueId);
    setReservedParts(reserved);
  };

  const addToCart = (item: any, btnId: string, isPart = false) => {
    const cart = JSON.parse(localStorage.getItem('taaza_cart') || '[]');
    
    const uniqueVariantId = isPart ? item.id : `${item.id}-${item.weight}-${JSON.stringify(item.options || {})}`;
    const existingIdx = cart.findIndex((c: any) => c.uniqueId === uniqueVariantId);
    
    if (isPart && existingIdx > -1) {
        setToastMsg("You have already reserved this part.");
        return;
    }

    if (existingIdx > -1) {
        cart[existingIdx].quantity += 1;
    } else {
        cart.push({ ...item, uniqueId: uniqueVariantId, quantity: 1 });
    }
    
    localStorage.setItem('taaza_cart', JSON.stringify(cart));
    updateCartMetrics();
    setAddingId(btnId);
    setTimeout(() => setAddingId(null), 1500);
    if(navigator.vibrate) navigator.vibrate(50);
  };

  // Chicken Handlers
  const handleAddSkinless = () => {
      const price = Math.round(CHICKEN_SKINLESS_PRICE * skinlessWeight);
      addToCart({
          id: 'chicken-skinless', name: `Chicken Skinless (${skinlessCut})`, price: price, image: 'https://images.unsplash.com/photo-1587332278432-1698f5dd1c0b?auto=format&fit=crop&w=600&q=80', weight: skinlessWeight < 1 ? `${skinlessWeight*1000}g` : `${skinlessWeight}kg`, options: { cut: skinlessCut, type: 'Skinless' }
      }, 'skinless');
  };
  const handleAddWithSkin = () => {
      const price = Math.round(CHICKEN_WITH_SKIN_PRICE * skinWeight);
      addToCart({
          id: 'chicken-skin', name: `Chicken With Skin (${skinCut})`, price: price, image: 'https://images.unsplash.com/photo-1615937657715-bc7b4b7962c1?auto=format&fit=crop&w=600&q=80', weight: skinWeight < 1 ? `${skinWeight*1000}g` : `${skinWeight}kg`, options: { cut: skinCut, type: 'With Skin' }
      }, 'with-skin');
  };
  const handleAddBoneless = () => {
      const price = Math.round(CHICKEN_BONELESS_PRICE * bonelessWeight);
      addToCart({
          id: 'chicken-boneless', name: `Chicken Boneless`, price: price, image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80', weight: bonelessWeight < 1 ? `${bonelessWeight*1000}g` : `${bonelessWeight}kg`, options: { type: 'Boneless' }
      }, 'boneless');
  };
  const handleAddNatti = () => {
      const bird = AVAILABLE_BIRDS.find(b => b.id === selectedBirdId) || AVAILABLE_BIRDS[0];
      const cutLabel = nattiPrepType === 'live' ? 'Live Bird (Whole)' : (NATTI_CUTS_OPTIONS.find(c => c.id === nattiCut)?.label || 'Curry Cut');
      const options: any = { cut: cutLabel, type: 'Natu Kodi', prep: nattiPrepType, birdId: bird.id };
      if (nattiPrepType === 'cut') { options.offals = includeOffals ? 'Yes' : 'No'; options.headLegs = includeHeadLegs ? 'Yes' : 'No'; }
      addToCart({
          id: `country-chicken-${bird.id}`, name: `Natu Kodi (${cutLabel})`, price: bird.price, image: bird.image, weight: bird.weight, options: options
      }, 'natti-main');
  };

  // --- Mutton Handlers ---
  const handleAddMuttonMeat = () => {
      const animal = AVAILABLE_MUTTON_STOCK.find(a => a.id === selectedMuttonId) || AVAILABLE_MUTTON_STOCK[0];
      const totalPrice = Math.round(animal.pricePerKg * muttonQty);
      
      addToCart({
          id: `mutton-meat-${animal.id}`,
          name: `${animal.tag} Meat (${muttonCutType})`,
          price: totalPrice,
          image: animal.image,
          weight: muttonQty < 1 ? `${muttonQty*1000}g` : `${muttonQty}kg`,
          options: { 
              animalId: animal.id,
              origin: animal.origin,
              deliveryDate: muttonDate 
          }
      }, 'mutton-meat');
  };

  const handleReservePart = (part: any, animal: any) => {
      const prefKey = `${animal.id}-${part.id}`;
      const isRoasted = roastPreferences[prefKey] || false;
      const finalPrice = isRoasted ? part.price + 50 : part.price;
      const nameSuffix = isRoasted ? ' (Roasted)' : '';

      addToCart({
          id: `mutton-part-${animal.id}-${part.id}`,
          name: `${part.name}${nameSuffix}`,
          price: finalPrice,
          image: animal.image,
          weight: part.unit,
          options: {
              animalId: animal.id,
              partType: part.id,
              deliveryDate: muttonDate,
              preparation: isRoasted ? 'Roasted & Cleaned' : 'Standard'
          }
      }, `btn-part-${part.id}`, true);
  };

  const toggleRoast = (partId: string) => {
      const key = `${selectedMuttonId}-${partId}`;
      setRoastPreferences(prev => ({...prev, [key]: !prev[key]}));
  };

  // Preview Modal
  const openPreview = (item: any) => {
      setPreviewItem(item);
      setCurrentImageIndex(0);
  };
  const nextImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!previewItem) return;
      const total = previewItem.images?.length || 1;
      setCurrentImageIndex((prev) => (prev + 1) % total);
  };
  const prevImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!previewItem) return;
      const total = previewItem.images?.length || 1;
      setCurrentImageIndex((prev) => (prev - 1 + total) % total);
  };

  const selectedBird = AVAILABLE_BIRDS.find(b => b.id === selectedBirdId) || AVAILABLE_BIRDS[0];
  const filteredMuttonStock = AVAILABLE_MUTTON_STOCK.filter(m => m.type === muttonAnimalType);
  const selectedMutton = filteredMuttonStock.find(m => m.id === selectedMuttonId) || filteredMuttonStock[0];

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
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      <Header title="Fresh Meats" backPath="/home" rightAction={HeaderAction} />
      
      {/* Main Tab Switcher */}
      <div className="bg-white px-4 pb-2 pt-2 sticky top-[60px] z-10 shadow-sm border-b border-gray-100">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setActiveTab('chicken')} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'chicken' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>🍗 Chicken</button>
            <button onClick={() => setActiveTab('mutton')} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'mutton' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>🐑 Mutton</button>
          </div>
      </div>

      <div className="p-4 flex-grow pb-10 space-y-6 animate-slide-up">
        
        {/* --- Chicken Content --- */}
        {activeTab === 'chicken' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h2 className="text-base font-bold text-gray-800 mb-3">Select Chicken Type</h2>
                <div className="grid grid-cols-2 gap-3">
                    <div onClick={() => setChickenType('broiler')} className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center flex flex-col items-center justify-center relative ${chickenType === 'broiler' ? 'border-zepto-blue bg-blue-50/30' : 'border-gray-100 hover:border-gray-200'}`}>
                        {chickenType === 'broiler' && <div className="absolute top-2 right-2 bg-zepto-blue text-white rounded-full w-4 h-4 flex items-center justify-center"><span className="material-symbols-outlined text-[10px]">check</span></div>}
                        <span className="text-2xl mb-1">🐔</span><span className="text-sm font-bold text-gray-800">Broiler</span><span className="text-xs text-gray-500">Daily Essentials</span>
                    </div>
                    <div onClick={() => setChickenType('natti')} className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center flex flex-col items-center justify-center relative ${chickenType === 'natti' ? 'border-zepto-blue bg-blue-50/30' : 'border-gray-100 hover:border-gray-200'}`}>
                        {chickenType === 'natti' && <div className="absolute top-2 right-2 bg-zepto-blue text-white rounded-full w-4 h-4 flex items-center justify-center"><span className="material-symbols-outlined text-[10px]">check</span></div>}
                        <span className="text-2xl mb-1">🐓</span><span className="text-sm font-bold text-gray-800">Natu Kodi</span><span className="text-xs text-gray-500">Country Chicken</span>
                    </div>
                </div>
            </div>

            {chickenType === 'broiler' && (
                <div className="space-y-5 animate-fade-in">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex gap-4 mb-4">
                            <img src="https://images.unsplash.com/photo-1587332278432-1698f5dd1c0b?auto=format&fit=crop&w=600&q=80" alt="Skinless" className="w-20 h-20 object-cover rounded-xl bg-gray-100" />
                            <div className="flex-grow"><h2 className="text-base font-bold text-gray-800">Chicken (Skinless)</h2><p className="text-xs text-gray-500 mt-1 mb-2">Lean, clean meat.</p><p className="text-lg font-bold text-zepto-blue">₹{CHICKEN_SKINLESS_PRICE}<span className="text-xs font-normal text-gray-400">/kg</span></p></div>
                        </div>
                        <div className="mb-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Select Cut</p>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">{REGULAR_CUT_OPTIONS.map(c => <button key={c.value} onClick={() => setSkinlessCut(c.value)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all whitespace-nowrap ${skinlessCut === c.value ? 'bg-blue-50 border-zepto-blue text-zepto-blue' : 'border-gray-200 text-gray-600'}`}>{c.label}</button>)}</div>
                        </div>
                        <div className="mb-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Quantity</p>
                            <div className="relative"><select value={skinlessWeight} onChange={(e) => setSkinlessWeight(parseFloat(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 outline-none">{QTY_DROPDOWN_OPTIONS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}</select></div>
                        </div>
                        <button onClick={handleAddSkinless} className={`w-full font-bold py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 ${addingId === 'skinless' ? 'bg-green-500 text-white' : 'bg-zepto-yellow text-zepto-blue'}`}>{addingId === 'skinless' ? 'Added' : 'Add Item'}</button>
                    </div>
                    {/* With Skin Card */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex gap-4 mb-4">
                            <img src="https://images.unsplash.com/photo-1615937657715-bc7b4b7962c1?auto=format&fit=crop&w=600&q=80" alt="With Skin" className="w-20 h-20 object-cover rounded-xl bg-gray-100" />
                            <div className="flex-grow"><h2 className="text-base font-bold text-gray-800">Chicken (With Skin)</h2><p className="text-xs text-gray-500 mt-1 mb-2">Juicy & flavorful.</p><p className="text-lg font-bold text-zepto-blue">₹{CHICKEN_WITH_SKIN_PRICE}<span className="text-xs font-normal text-gray-400">/kg</span></p></div>
                        </div>
                        <div className="mb-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Select Cut</p>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">{REGULAR_CUT_OPTIONS.map(c => <button key={c.value} onClick={() => setSkinCut(c.value)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all whitespace-nowrap ${skinCut === c.value ? 'bg-blue-50 border-zepto-blue text-zepto-blue' : 'border-gray-200 text-gray-600'}`}>{c.label}</button>)}</div>
                        </div>
                        <div className="mb-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Quantity</p>
                            <div className="relative"><select value={skinWeight} onChange={(e) => setSkinWeight(parseFloat(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 outline-none">{QTY_DROPDOWN_OPTIONS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}</select></div>
                        </div>
                        <button onClick={handleAddWithSkin} className={`w-full font-bold py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 ${addingId === 'with-skin' ? 'bg-green-500 text-white' : 'bg-zepto-yellow text-zepto-blue'}`}>{addingId === 'with-skin' ? 'Added' : 'Add Item'}</button>
                    </div>
                </div>
            )}

            {chickenType === 'natti' && (
                <div className="space-y-5 animate-fade-in">
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 mb-3 ml-1 flex items-center gap-2"><span className="material-symbols-outlined text-zepto-blue">pets</span>Select Your Bird</h3>
                        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-4 px-4">
                            {AVAILABLE_BIRDS.map((bird) => (
                                <div key={bird.id} onClick={() => setSelectedBirdId(bird.id)} className={`relative min-w-[200px] rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group ${selectedBirdId === bird.id ? 'border-orange-500 shadow-md ring-2 ring-orange-100 scale-[1.02]' : 'border-transparent shadow-sm hover:scale-[1.01]'}`}>
                                    <div className="h-36 w-full bg-gray-200 relative">
                                        <img src={bird.image} alt="Bird" className="w-full h-full object-cover" />
                                        <div className="absolute top-2 right-2 z-10" onClick={(e) => { openPreview(bird); }}><div className="bg-black/30 backdrop-blur-md p-1.5 rounded-lg text-white hover:bg-black/50 transition-colors flex items-center gap-1 shadow-sm"><span className="material-symbols-outlined text-lg">zoom_in</span></div></div>
                                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded">{bird.tag}</div>
                                        {selectedBirdId === bird.id && <div className="absolute inset-0 bg-orange-500/10 flex items-center justify-center pointer-events-none"><div className="bg-white rounded-full p-1 shadow-lg"><span className="material-symbols-outlined text-orange-500 font-bold">check</span></div></div>}
                                    </div>
                                    <div className={`p-3 bg-white ${selectedBirdId === bird.id ? 'bg-orange-50' : ''}`}>
                                        <div className="flex justify-between items-center mb-1"><span className="font-bold text-gray-800 text-sm">{bird.weight}</span><span className="text-[10px] text-gray-500">Live Weight</span></div>
                                        <p className="text-sm font-bold text-zepto-blue">₹{bird.price}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex gap-4 mb-4 border-b border-gray-50 pb-4">
                            <div className="relative w-24 h-24 flex-shrink-0 cursor-pointer" onClick={() => openPreview(selectedBird)}>
                                <img src={selectedBird.image} alt="Selected Bird" className="w-full h-full object-cover rounded-xl bg-gray-100" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 rounded-xl transition-colors"><span className="material-symbols-outlined text-white drop-shadow-md">zoom_in</span></div>
                            </div>
                            <div className="flex-grow"><h2 className="text-base font-bold text-gray-800">Selected: Natu Kodi</h2><p className="text-xl font-bold text-zepto-blue mt-2">₹{selectedBird.price}</p></div>
                        </div>
                        <div className="mb-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">How do you want it?</p>
                            <div className="flex bg-gray-50 p-1 rounded-xl">
                                <button onClick={() => setNattiPrepType('live')} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${nattiPrepType === 'live' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-500'}`}>Live Bird</button>
                                <button onClick={() => setNattiPrepType('cut')} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${nattiPrepType === 'cut' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-500'}`}>Cut & Cleaned</button>
                            </div>
                        </div>
                        {nattiPrepType === 'cut' && (
                            <div className="animate-fade-in space-y-4 mb-4">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Inclusions</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className={`flex items-center p-2.5 rounded-lg border cursor-pointer ${includeOffals ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}><input type="checkbox" className="hidden" checked={includeOffals} onChange={() => setIncludeOffals(!includeOffals)} /><span className={`text-xs font-bold ${includeOffals ? 'text-green-800' : 'text-gray-600'}`}>Liver & Gizzard</span></label>
                                        <label className={`flex items-center p-2.5 rounded-lg border cursor-pointer ${includeHeadLegs ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}><input type="checkbox" className="hidden" checked={includeHeadLegs} onChange={() => setIncludeHeadLegs(!includeHeadLegs)} /><span className={`text-xs font-bold ${includeHeadLegs ? 'text-green-800' : 'text-gray-600'}`}>Head & Legs</span></label>
                                    </div>
                                </div>
                            </div>
                        )}
                        <button onClick={handleAddNatti} className={`w-full font-bold py-3.5 rounded-xl shadow-sm transition-all ${addingId === 'natti-main' ? 'bg-green-500 text-white' : 'bg-zepto-yellow text-zepto-blue'}`}>{addingId === 'natti-main' ? 'Added' : 'Add to Cart'}</button>
                    </div>
                </div>
            )}
          </div>
        )}

        {/* --- Mutton Content (ENHANCED) --- */}
        {activeTab === 'mutton' && (
          <div className="space-y-5 animate-fade-in">
            {/* Delivery Info Banner */}
            <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-600 text-lg mt-0.5">info</span>
                <div>
                    <p className="text-xs text-blue-800 font-bold">Pre-booking Only</p>
                    <p className="text-[10px] text-blue-600 leading-relaxed mt-0.5">
                        Orders close Saturday 6 PM for Sunday delivery. Freshly cut on delivery morning.
                    </p>
                </div>
            </div>

            {/* 1. Select Animal Type */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h2 className="text-base font-bold text-gray-800 mb-3">1. Select Meat Type</h2>
                <div className="grid grid-cols-2 gap-3">
                    <div onClick={() => setMuttonAnimalType('sheep')} className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center flex flex-col items-center justify-center relative ${muttonAnimalType === 'sheep' ? 'border-zepto-blue bg-blue-50/30' : 'border-gray-100 hover:border-gray-200'}`}>
                        {muttonAnimalType === 'sheep' && <div className="absolute top-2 right-2 bg-zepto-blue text-white rounded-full w-4 h-4 flex items-center justify-center"><span className="material-symbols-outlined text-[10px]">check</span></div>}
                        <span className="text-2xl mb-1">🐑</span><span className="text-sm font-bold text-gray-800">Sheep</span><span className="text-xs text-gray-500">Premium Breed</span>
                    </div>
                    <div onClick={() => setMuttonAnimalType('goat')} className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center flex flex-col items-center justify-center relative ${muttonAnimalType === 'goat' ? 'border-zepto-blue bg-blue-50/30' : 'border-gray-100 hover:border-gray-200'}`}>
                        {muttonAnimalType === 'goat' && <div className="absolute top-2 right-2 bg-zepto-blue text-white rounded-full w-4 h-4 flex items-center justify-center"><span className="material-symbols-outlined text-[10px]">check</span></div>}
                        <span className="text-2xl mb-1">🐐</span><span className="text-sm font-bold text-gray-800">Goat</span><span className="text-xs text-gray-500">Tender Meat</span>
                    </div>
                </div>
            </div>

            {/* 2. Select Specific Animal (Gallery) */}
            <div>
                <h3 className="text-sm font-bold text-gray-800 mb-3 ml-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-zepto-blue">pets</span>
                    Select Your Animal
                </h3>
                <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-4 px-4">
                    {filteredMuttonStock.map((animal) => (
                        <div 
                            key={animal.id}
                            onClick={() => setSelectedMuttonId(animal.id)}
                            className={`relative min-w-[220px] rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group ${
                                selectedMuttonId === animal.id 
                                ? 'border-zepto-blue shadow-md ring-2 ring-blue-100 scale-[1.02]' 
                                : 'border-transparent shadow-sm hover:scale-[1.01]'
                            }`}
                        >
                            <div className="h-40 w-full bg-gray-200 relative">
                                <img src={animal.image} alt={animal.tag} className="w-full h-full object-cover" />
                                
                                {/* Overlay Badges */}
                                <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                                    <div className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded">
                                        {animal.tag}
                                    </div>
                                    <div className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                        Only 1 Available
                                    </div>
                                    {animal.yield >= 65 && (
                                        <div className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                                            <span className="material-symbols-outlined text-[10px]">trending_up</span> High Yield
                                        </div>
                                    )}
                                </div>

                                <div className="absolute bottom-2 left-2 bg-white/90 text-gray-800 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm border border-white">
                                    {animal.origin}
                                </div>
                                {selectedMuttonId === animal.id && (
                                    <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center pointer-events-none">
                                        <div className="bg-white rounded-full p-1 shadow-lg">
                                            <span className="material-symbols-outlined text-zepto-blue font-bold">check</span>
                                        </div>
                                    </div>
                                )}
                                {/* Zoom Icon */}
                                <div className="absolute top-2 right-2 z-10" onClick={(e) => { openPreview(animal); }}>
                                    <div className="bg-black/30 backdrop-blur-md p-1.5 rounded-lg text-white hover:bg-black/50 transition-colors flex items-center gap-1 shadow-sm">
                                        <span className="material-symbols-outlined text-lg">zoom_in</span>
                                    </div>
                                </div>
                            </div>
                            <div className={`p-3 bg-white ${selectedMuttonId === animal.id ? 'bg-blue-50' : ''}`}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-gray-800 text-sm">{animal.liveWeight}</span>
                                    <span className="text-[10px] text-gray-500">Live Weight</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                        animal.fatLevel === 'High' ? 'bg-red-50 text-red-700' :
                                        animal.fatLevel === 'Medium' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'
                                    }`}>
                                        {animal.fatLevel} Fat
                                    </span>
                                    <p className="text-sm font-bold text-zepto-blue">₹{animal.pricePerKg}<span className="text-[10px] font-normal text-gray-400">/kg</span></p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Booking Options */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-slide-up">
                {/* Header */}
                <div className="flex gap-4 mb-4 border-b border-gray-50 pb-4">
                    <div className="relative w-24 h-24 flex-shrink-0 cursor-pointer" onClick={() => openPreview(selectedMutton)}>
                        <img src={selectedMutton.image} alt="Selected" className="w-full h-full object-cover rounded-xl bg-gray-100" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 rounded-xl transition-colors"><span className="material-symbols-outlined text-white drop-shadow-md">zoom_in</span></div>
                    </div>
                    <div className="flex-grow">
                        <h2 className="text-base font-bold text-gray-800">{selectedMutton.tag}</h2>
                        <div className="flex flex-wrap gap-2 mt-2 mb-2">
                            <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-1 rounded border border-blue-100">Age: {selectedMutton.age}</span>
                        </div>
                        {/* Yield Meter in Header */}
                        <YieldMeter live={selectedMutton.liveWeight} net={selectedMutton.netEstimate} percent={selectedMutton.yield} />
                    </div>
                </div>

                {/* Mode Switcher */}
                <div className="flex bg-gray-50 p-1 rounded-xl mb-6">
                    <button onClick={() => setMuttonBookingMode('meat')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${muttonBookingMode === 'meat' ? 'bg-white text-gray-800 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}><span>Buy Meat (Kg)</span></button>
                    <button onClick={() => setMuttonBookingMode('parts')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${muttonBookingMode === 'parts' ? 'bg-white text-gray-800 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}><span>Reserve Parts</span></button>
                </div>

                {/* Mode: Buy Meat */}
                {muttonBookingMode === 'meat' && (
                    <div className="space-y-5 animate-fade-in">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery Date</p>
                            <div className="relative"><select value={muttonDate} onChange={(e) => setMuttonDate(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 outline-none">{DYNAMIC_SUNDAYS.map(date => <option key={date} value={date}>{date}</option>)}</select></div>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Quantity (Kg)</p>
                            <select value={muttonQty} onChange={(e) => setMuttonQty(parseFloat(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none">{QTY_DROPDOWN_OPTIONS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}</select>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Preferred Cut</p>
                            <div className="flex flex-wrap gap-2">{['Mixed Curry Cut', 'Biryani Cut', 'Ribs & Chops'].map(cut => <button key={cut} onClick={() => setMuttonCutType(cut)} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${muttonCutType === cut ? 'bg-blue-50 border-zepto-blue text-zepto-blue' : 'border-gray-200 text-gray-600'}`}>{cut}</button>)}</div>
                        </div>
                        <button onClick={handleAddMuttonMeat} className={`w-full font-bold py-3.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 ${addingId === 'mutton-meat' ? 'bg-green-500 text-white' : 'bg-zepto-yellow text-zepto-blue'}`}>{addingId === 'mutton-meat' ? 'Pre-booked' : <><span>Pre-book Meat</span><span className="font-mono text-sm opacity-80">|</span><span className="font-mono text-sm">₹{(muttonQty * selectedMutton.pricePerKg).toFixed(0)}</span></>}</button>
                    </div>
                )}

                {/* Mode: Reserve Parts */}
                {muttonBookingMode === 'parts' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-xl flex gap-2 items-start">
                            <span className="material-symbols-outlined text-yellow-600 text-sm mt-0.5">warning</span>
                            <p className="text-[10px] text-yellow-800 leading-relaxed"><strong>Limited Stock:</strong> Only 1 unit of each part available. Cleaning options available for Head/Legs.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {selectedMutton.parts.map((part) => {
                                const isReserved = reservedParts.includes(`mutton-part-${selectedMutton.id}-${part.id}`);
                                // Scoped preferences to Animal ID + Part ID
                                const prefKey = `${selectedMutton.id}-${part.id}`;
                                const isRoastSelected = roastPreferences[prefKey] || false;
                                
                                return (
                                    <div key={part.id} className={`border rounded-xl p-3 flex flex-col gap-3 transition-all ${isReserved ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-200'}`}>
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0">
                                                    <span className="material-symbols-outlined">{part.icon || 'set_meal'}</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800 text-sm">{part.name}</h4>
                                                    <p className="text-xs text-gray-500">{part.unit}</p>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <p className="text-sm font-bold text-zepto-blue">₹{isRoastSelected ? part.price + 50 : part.price}</p>
                                                        {isRoastSelected && <span className="text-[9px] text-orange-600 font-bold bg-orange-50 px-1 rounded">+₹50 Cleaning</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => !isReserved && handleReservePart(part, selectedMutton)}
                                                disabled={isReserved}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${isReserved ? 'bg-gray-200 text-gray-500' : addingId === `btn-part-${part.id}` ? 'bg-green-500 text-white' : 'bg-zepto-yellow text-zepto-blue'}`}
                                            >
                                                {isReserved ? 'Reserved' : addingId === `btn-part-${part.id}` ? 'Added' : 'Add +'}
                                            </button>
                                        </div>
                                        
                                        {/* Cleaning Option Toggle */}
                                        {part.canRoast && !isReserved && (
                                            <div 
                                                onClick={() => toggleRoast(part.id)}
                                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all ${isRoastSelected ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-transparent hover:bg-gray-100'}`}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${isRoastSelected ? 'bg-orange-500 border-orange-500' : 'border-gray-400 bg-white'}`}>
                                                    {isRoastSelected && <span className="material-symbols-outlined text-white text-[10px]">check</span>}
                                                </div>
                                                <span className={`text-[10px] font-bold ${isRoastSelected ? 'text-orange-800' : 'text-gray-600'}`}>
                                                    Burn & Clean (Kalsina)
                                                </span>
                                                <span className="material-symbols-outlined text-orange-500 text-sm ml-auto">local_fire_department</span>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
          </div>
        )}

      </div>

      {toastMsg && <Toast msg={toastMsg} onClose={() => setToastMsg(null)} />}

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in" onClick={() => setPreviewItem(null)}>
            <div className="relative w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <button onClick={() => setPreviewItem(null)} className="absolute -top-10 right-0 text-white p-2 rounded-full hover:bg-white/10"><span className="material-symbols-outlined text-3xl">close</span></button>
                <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                    <div className="relative aspect-square w-full bg-gray-100 group">
                        <img src={previewItem.images && previewItem.images.length > 0 ? previewItem.images[currentImageIndex] : previewItem.image} alt="Preview" className="w-full h-full object-cover transition-opacity duration-300" />
                        {previewItem.images && previewItem.images.length > 1 && (
                            <>
                                <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm"><span className="material-symbols-outlined text-xl">chevron_left</span></button>
                                <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm"><span className="material-symbols-outlined text-xl">chevron_right</span></button>
                                <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm">{currentImageIndex + 1} / {previewItem.images.length}</div>
                            </>
                        )}
                        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-lg border border-white/20">{previewItem.tag}</div>
                    </div>
                    <div className="flex gap-2 p-3 overflow-x-auto no-scrollbar bg-gray-50 border-b border-gray-100">
                        {previewItem.images?.map((img: string, idx: number) => (
                            <div key={idx} onClick={() => setCurrentImageIndex(idx)} className={`relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${currentImageIndex === idx ? 'border-zepto-blue opacity-100 ring-1 ring-zepto-blue' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                                <img src={img} className="w-full h-full object-cover" alt="" />
                            </div>
                        ))}
                    </div>
                    <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">{previewItem.label || previewItem.tag}</h3>
                                {previewItem.liveWeight ? (
                                    <div>
                                        <p className="text-sm text-gray-500 mt-1">Live: {previewItem.liveWeight} • Net: ~{previewItem.netEstimate}</p>
                                        <div className="mt-2 flex gap-2">
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${previewItem.fatLevel === 'High' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{previewItem.fatLevel} Fat</span>
                                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">{previewItem.yield}% Yield</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 mt-1">Live: {previewItem.weight} • Net: ~{previewItem.netWeight}</p>
                                )}
                            </div>
                            <div className="text-right">
                                {previewItem.pricePerKg ? (
                                    <p className="text-2xl font-bold text-zepto-blue">₹{previewItem.pricePerKg}<span className="text-xs font-normal text-gray-400">/kg</span></p>
                                ) : (
                                    <p className="text-2xl font-bold text-zepto-blue">₹{previewItem.price}</p>
                                )}
                            </div>
                        </div>
                        <button onClick={() => { if (previewItem.type === 'sheep' || previewItem.type === 'goat') { setSelectedMuttonId(previewItem.id); } else { setSelectedBirdId(previewItem.id); } setPreviewItem(null); }} className="w-full bg-zepto-yellow text-zepto-blue font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2"><span>Select This Animal</span><span className="material-symbols-outlined">check_circle</span></button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default MeatOrder;