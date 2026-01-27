
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const { logout, user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    setShowProfile(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
          onClick={onMenuClick}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        
        <div className="hidden md:flex items-center bg-slate-100 px-3 py-2 rounded-lg w-80">
          <span className="material-symbols-outlined text-slate-400 mr-2">search</span>
          <input 
            type="text" 
            placeholder="Search orders, products, users..." 
            className="bg-transparent outline-none text-sm w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <button className="relative p-2 hover:bg-slate-100 rounded-full text-slate-600">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-zepto-danger rounded-full ring-2 ring-white"></span>
        </button>

        <div className="relative">
          <button 
            className="flex items-center gap-2 hover:bg-slate-100 p-1 pr-3 rounded-full transition-colors"
            onClick={() => setShowProfile(!showProfile)}
          >
            <div className="w-8 h-8 rounded-full bg-zepto-blue text-white flex items-center justify-center text-xs font-bold">
              {user?.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold leading-tight">{user?.name}</p>
              <p className="text-[10px] text-slate-500">{user?.role}</p>
            </div>
            <span className="material-symbols-outlined text-slate-400">expand_more</span>
          </button>

          {showProfile && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)}></div>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Account</p>
                  <p className="text-sm font-medium text-slate-900 truncate">{user?.email}</p>
                </div>
                <button 
                  onClick={() => handleNavigate('/profile')}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">person</span>
                  Profile
                </button>
                <button 
                  onClick={() => handleNavigate('/settings')}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">settings</span>
                  Settings
                </button>
                <button 
                  className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 text-zepto-danger flex items-center gap-2 border-t border-slate-100"
                  onClick={logout}
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
