
import React from 'react';
import { useAuth } from '../context/AuthContext';

const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-zepto-blue"></div>
        <div className="relative pt-16 flex flex-col items-center">
          <div className="w-32 h-32 rounded-[2.5rem] bg-white p-2 shadow-2xl">
            <div className="w-full h-full rounded-[2rem] bg-zepto-yellow text-zepto-blue flex items-center justify-center text-4xl font-black">
              {user?.name.charAt(0)}
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-black text-slate-900 tracking-tight">{user?.name}</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">{user?.role} Access</p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2">Account Details</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Full Name</label>
                <div className="p-4 bg-slate-50 rounded-2xl font-black text-slate-900">{user?.name}</div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email Address</label>
                <div className="p-4 bg-slate-50 rounded-2xl font-black text-slate-900">{user?.email}</div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2">Security</h3>
            <div className="space-y-4">
              <button className="w-full p-4 border-2 border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-between">
                <span>Change Password</span>
                <span className="material-symbols-outlined">key</span>
              </button>
              <button className="w-full p-4 border-2 border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-between">
                <span>Two-Factor Auth</span>
                <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-500">OFF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
