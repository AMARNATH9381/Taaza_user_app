
import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/orders', label: 'Orders', icon: 'receipt' },
  { path: '/subscriptions', label: 'Subscriptions', icon: 'local_drink' },
  { path: '/products', label: 'Products', icon: 'inventory' },
  { path: '/users', label: 'Users', icon: 'people' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={onClose}
        />
      )}
      
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-zepto-blue text-white z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-zepto-yellow text-3xl">eco</span>
            <span className="text-xl font-bold tracking-tight">Taaza Admin</span>
          </div>
          <button className="lg:hidden" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${isActive 
                  ? 'bg-zepto-yellow text-zepto-blue font-semibold shadow-lg' 
                  : 'text-white/70 hover:bg-white/10 hover:text-white'}
              `}
              onClick={() => { if(window.innerWidth < 1024) onClose(); }}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-6 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zepto-yellow/20 flex items-center justify-center text-zepto-yellow font-bold">
              SA
            </div>
            <div>
              <p className="text-sm font-medium">Super Admin</p>
              <p className="text-xs text-white/50">taaza.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
