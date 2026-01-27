
import React, { useState, useMemo, useEffect } from 'react';
import { mockSubscriptions as initialSubs } from '../services/mockData';
import { SubscriptionStatus, Subscription } from '../types';

const Subscriptions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'List' | 'Today' | 'Routes'>('List');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubs);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [isNewPlanModalOpen, setIsNewPlanModalOpen] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<Record<string, boolean>>({});

  // Local state for the Edit/Modify Modal
  const [editFormData, setEditFormData] = useState<Partial<Subscription>>({});

  useEffect(() => {
    if (selectedSub) {
      setEditFormData({ ...selectedSub });
    }
  }, [selectedSub]);

  const handleToggleStatus = (id: string) => {
    setSubscriptions(prev => prev.map(s => {
      if (s.id === id) {
        const nextStatus = s.status === SubscriptionStatus.ACTIVE ? SubscriptionStatus.PAUSED : SubscriptionStatus.ACTIVE;
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  const markDelivered = (id: string) => {
    setDeliveryStatus(prev => ({ ...prev, [id]: true }));
  };

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Customer', 'Plan', 'Quantity', 'Milk Type', 'Address', 'Status'];
    const rows = subscriptions.map(s => [
      s.id,
      s.customerName,
      s.plan,
      s.quantity,
      s.milkType,
      `"${s.address}"`,
      s.status
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `taaza_delivery_sheet_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreatePlan = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newPlan: Subscription = {
      id: `SUB-${Math.floor(Math.random() * 900) + 200}`,
      customerName: formData.get('customerName') as string,
      plan: formData.get('plan') as any,
      quantity: Number(formData.get('quantity')),
      startDate: new Date().toISOString().split('T')[0],
      status: SubscriptionStatus.ACTIVE,
      milkType: formData.get('milkType') as any,
      address: formData.get('address') as string,
      timeSlot: formData.get('plan') === 'Evening' ? '5:00-6:00 PM' : '6:00-7:00 AM'
    };

    setSubscriptions(prev => [newPlan, ...prev]);
    setIsNewPlanModalOpen(false);
  };

  const handleSaveChanges = () => {
    if (!selectedSub) return;
    setSubscriptions(prev => prev.map(s => s.id === selectedSub.id ? { ...s, ...editFormData } : s));
    setSelectedSub(null);
  };

  const routeGroups = useMemo(() => {
    const groups: Record<string, Subscription[]> = {};
    subscriptions.forEach(s => {
      const area = s.address.split(',')[1]?.trim() || 'Other';
      if (!groups[area]) groups[area] = [];
      groups[area].push(s);
    });
    return groups;
  }, [subscriptions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Milk Subscriptions</h1>
          <p className="text-slate-500 text-sm font-medium">Manage {subscriptions.length} active household delivery plans</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportCSV} 
            className="bg-white border-2 border-slate-100 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Delivery Sheet
          </button>
          <button 
            onClick={() => setIsNewPlanModalOpen(true)}
            className="bg-zepto-blue text-white px-5 py-2.5 rounded-xl font-black shadow-lg hover:bg-black transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add_circle</span>
            New Plan
          </button>
        </div>
      </div>

      <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
        {['List', 'Today', 'Routes'].map((tab) => (
          <button 
            key={tab}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === tab ? 'bg-white text-zepto-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab(tab as any)}
          >
            {tab === 'List' ? 'All Plans' : tab === 'Today' ? "Today's Deliveries" : "Route Optimization"}
          </button>
        ))}
      </div>

      {activeTab === 'List' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
              <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-zepto-blue text-white flex items-center justify-center font-black text-lg shadow-inner">
                      {sub.customerName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 leading-tight">{sub.customerName}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">#{sub.id}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    sub.status === SubscriptionStatus.ACTIVE ? 'bg-emerald-100 text-emerald-600' : 
                    sub.status === SubscriptionStatus.PAUSED ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {sub.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Schedule</p>
                    <p className="text-xs font-black text-slate-900">{sub.plan}</p>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Volume</p>
                    <p className="text-xs font-black text-zepto-blue">{sub.quantity}L ({sub.milkType})</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl">
                  <span className="material-symbols-outlined text-slate-400 text-sm mt-0.5">location_on</span>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">{sub.address}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setSelectedSub(sub)} className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">Manage</button>
                  <button onClick={() => handleToggleStatus(sub.id)} className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                    sub.status === SubscriptionStatus.ACTIVE ? 'bg-slate-900 text-white hover:bg-black' : 'bg-emerald-500 text-white'
                  }`}>
                    {sub.status === SubscriptionStatus.ACTIVE ? 'Pause' : 'Resume'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Today' && (
        <div className="space-y-6">
          {['6:00-7:00 AM', '7:00-8:00 AM', '5:00-6:00 PM'].map(slot => {
            const slotSubs = subscriptions.filter(s => s.timeSlot === slot);
            if (slotSubs.length === 0) return null;
            
            return (
              <div key={slot} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4">
                <div className="bg-slate-50/80 backdrop-blur px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zepto-blue text-white flex items-center justify-center">
                      <span className="material-symbols-outlined">schedule</span>
                    </div>
                    <h3 className="font-black text-slate-900 tracking-tight">{slot} Window</h3>
                  </div>
                  <button 
                     onClick={() => slotSubs.forEach(s => markDelivered(s.id))}
                     className="text-zepto-blue text-xs font-black uppercase tracking-widest hover:underline"
                  >
                    Mark All Delivered
                  </button>
                </div>
                <div className="divide-y divide-slate-50">
                  {slotSubs.map(sub => (
                    <div key={sub.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center justify-center w-6 h-6 rounded border-2 border-slate-200">
                           {deliveryStatus[sub.id] && <span className="material-symbols-outlined text-zepto-green text-xl font-black">check</span>}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{sub.customerName}</p>
                          <p className="text-[11px] text-slate-500 font-medium">{sub.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm font-black text-zepto-blue">{sub.quantity} Liters</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sub.milkType} Milk</p>
                        </div>
                        <button 
                          disabled={deliveryStatus[sub.id]}
                          onClick={() => markDelivered(sub.id)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            deliveryStatus[sub.id] ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600 hover:bg-zepto-blue hover:text-white'
                          }`}
                        >
                          {deliveryStatus[sub.id] ? 'Delivered' : 'Mark Delivered'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'Routes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {Object.entries(routeGroups).map(([area, subs]) => {
            const typedSubs = subs as Subscription[];
            return (
              <div key={area} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-slate-900">{area} Route</h3>
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    {typedSubs.length} Drops
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-zepto-blue/5 rounded-2xl border border-zepto-blue/10">
                    <span className="text-xs font-bold text-zepto-blue uppercase tracking-widest">Total Demand</span>
                    <span className="text-lg font-black text-zepto-blue">
                      {typedSubs.reduce((acc, curr) => acc + curr.quantity, 0)} Liters
                    </span>
                  </div>
                  <div className="space-y-2">
                    {typedSubs.map(s => (
                      <div key={s.id} className="flex items-center gap-3 text-xs font-medium text-slate-500">
                        <span className="material-symbols-outlined text-[14px]">radio_button_checked</span>
                        <span className="font-bold text-slate-700">{s.customerName}</span>
                        <span className="ml-auto">{s.quantity}L</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button className="w-full mt-6 py-3 border-2 border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:border-zepto-blue hover:text-zepto-blue transition-all">
                  Generate Map Sequence
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* NEW PLAN MODAL */}
      {isNewPlanModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsNewPlanModalOpen(false)}></div>
          <form 
            onSubmit={handleCreatePlan}
            className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative p-8 md:p-12 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Onboard Subscriber</h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Add a new household delivery plan</p>
              </div>
              <button type="button" onClick={() => setIsNewPlanModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer Name</label>
                  <input required name="customerName" placeholder="e.g. Amit Kumar" className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-zepto-blue transition-all outline-none rounded-2xl font-black" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Daily Liters</label>
                  <input required name="quantity" type="number" step="0.5" defaultValue="1" className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-zepto-blue transition-all outline-none rounded-2xl font-black" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Milk Type</label>
                  <select name="milkType" className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-zepto-blue transition-all outline-none rounded-2xl font-black">
                    <option>Cow</option>
                    <option>Buffalo</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Frequency</label>
                  <select name="plan" className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-zepto-blue transition-all outline-none rounded-2xl font-black">
                    <option value="Morning">Morning Only</option>
                    <option value="Evening">Evening Only</option>
                    <option value="Both">Twice Daily (Both)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Delivery Address</label>
                <textarea required name="address" rows={2} placeholder="Indiranagar, Sector 2, Lane 4..." className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-zepto-blue transition-all outline-none rounded-2xl font-black resize-none" />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button type="button" onClick={() => setIsNewPlanModalOpen(false)} className="flex-1 p-4 border-2 border-slate-100 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-all">Discard</button>
              <button type="submit" className="flex-1 p-4 bg-zepto-blue text-white rounded-2xl font-black shadow-xl shadow-zepto-blue/20 hover:bg-black transition-all">Onboard Plan</button>
            </div>
          </form>
        </div>
      )}

      {/* MODIFY MODAL (Now fully functional) */}
      {selectedSub && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setSelectedSub(null)}></div>
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative p-10 animate-in zoom-in-95 duration-200">
             <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">Modify Subscription</h2>
               <button onClick={() => setSelectedSub(null)} className="p-2 hover:bg-slate-100 rounded-full">
                 <span className="material-symbols-outlined">close</span>
               </button>
             </div>
             
             <div className="space-y-6">
               <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                 <div className="w-12 h-12 rounded-full bg-zepto-blue flex items-center justify-center text-white font-black text-lg">
                   {selectedSub.customerName.charAt(0)}
                 </div>
                 <div>
                   <p className="font-black text-slate-900">{selectedSub.customerName}</p>
                   <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Subscriber since {selectedSub.startDate}</p>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Daily Quantity (L)</label>
                    <input 
                      type="number" 
                      step="0.5" 
                      value={editFormData.quantity || 0}
                      onChange={(e) => setEditFormData({...editFormData, quantity: Number(e.target.value)})}
                      className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-black focus:border-zepto-blue transition-all outline-none" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Milk Type</label>
                    <select 
                      className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-black focus:border-zepto-blue transition-all outline-none" 
                      value={editFormData.milkType}
                      onChange={(e) => setEditFormData({...editFormData, milkType: e.target.value as any})}
                    >
                      <option>Cow</option>
                      <option>Buffalo</option>
                    </select>
                 </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Delivery Frequency</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Morning', 'Evening', 'Both'].map(p => (
                      <button 
                        key={p} 
                        onClick={() => setEditFormData({...editFormData, plan: p as any})}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${editFormData.plan === p ? 'bg-zepto-blue text-white border-zepto-blue' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Delivery Address</label>
                  <textarea 
                    rows={2}
                    value={editFormData.address || ''}
                    onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                    className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-black focus:border-zepto-blue transition-all outline-none resize-none"
                  />
               </div>
             </div>

             <div className="flex gap-4 mt-10">
                <button onClick={() => setSelectedSub(null)} className="flex-1 p-4 border-2 border-slate-100 rounded-[1.25rem] font-black text-slate-500 hover:bg-slate-50 transition-all">Discard</button>
                <button onClick={handleSaveChanges} className="flex-1 p-4 bg-zepto-blue text-white rounded-[1.25rem] font-black shadow-xl shadow-zepto-blue/20 hover:bg-black transition-all">Save Changes</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
