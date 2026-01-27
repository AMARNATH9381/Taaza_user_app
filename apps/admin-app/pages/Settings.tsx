
import React, { useState } from 'react';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    minOrderValue: 199,
    deliveryStart: "06:00",
    deliveryEnd: "21:00",
    autoAssignRider: true,
    notificationEmails: true,
    platformFee: 5
  });

  const handleSave = () => {
    alert("System configurations updated successfully!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Configure global platform parameters and rules</p>
        </div>
        <button 
          onClick={handleSave}
          className="bg-zepto-blue text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-zepto-blue/20 hover:bg-black transition-all"
        >
          Save All Changes
        </button>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {/* Logistics Section */}
        <section className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-zepto-blue/5 text-zepto-blue flex items-center justify-center">
              <span className="material-symbols-outlined">local_shipping</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Logistics & Delivery</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global delivery rules</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Minimum Order Value (₹)</label>
               <input 
                 type="number" 
                 value={settings.minOrderValue}
                 onChange={e => setSettings({...settings, minOrderValue: parseInt(e.target.value)})}
                 className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-zepto-blue transition-all outline-none rounded-2xl font-black" 
               />
            </div>
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Platform Convenience Fee (₹)</label>
               <input 
                 type="number" 
                 value={settings.platformFee}
                 onChange={e => setSettings({...settings, platformFee: parseInt(e.target.value)})}
                 className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-zepto-blue transition-all outline-none rounded-2xl font-black" 
               />
            </div>
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Delivery Start Window</label>
               <input 
                 type="time" 
                 value={settings.deliveryStart}
                 onChange={e => setSettings({...settings, deliveryStart: e.target.value})}
                 className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-zepto-blue transition-all outline-none rounded-2xl font-black" 
               />
            </div>
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Delivery End Window</label>
               <input 
                 type="time" 
                 value={settings.deliveryEnd}
                 onChange={e => setSettings({...settings, deliveryEnd: e.target.value})}
                 className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-zepto-blue transition-all outline-none rounded-2xl font-black" 
               />
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined">notifications_active</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Automation & Notifications</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">System event triggers</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl">
               <div>
                  <p className="text-sm font-black text-slate-900">Auto-assign Delivery Partners</p>
                  <p className="text-[11px] text-slate-500 font-medium">Automatically dispatch riders based on distance</p>
               </div>
               <button 
                 onClick={() => setSettings({...settings, autoAssignRider: !settings.autoAssignRider})}
                 className={`w-14 h-8 rounded-full p-1 transition-all ${settings.autoAssignRider ? 'bg-zepto-blue' : 'bg-slate-300'}`}
               >
                 <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all ${settings.autoAssignRider ? 'translate-x-6' : 'translate-x-0'}`}></div>
               </button>
            </div>
            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl">
               <div>
                  <p className="text-sm font-black text-slate-900">Admin Email Notifications</p>
                  <p className="text-[11px] text-slate-500 font-medium">Receive daily summaries and high-value order alerts</p>
               </div>
               <button 
                 onClick={() => setSettings({...settings, notificationEmails: !settings.notificationEmails})}
                 className={`w-14 h-8 rounded-full p-1 transition-all ${settings.notificationEmails ? 'bg-zepto-blue' : 'bg-slate-300'}`}
               >
                 <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all ${settings.notificationEmails ? 'translate-x-6' : 'translate-x-0'}`}></div>
               </button>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <div className="text-center pb-10">
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Running Taaza Admin v2.1.0-stable</p>
           <button className="mt-4 text-zepto-blue text-[11px] font-black uppercase tracking-widest hover:underline">Download System Logs</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
