import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const OrderSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order;
  const orderId = order?.id || `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

  // Confetti effect colors
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#FFFFFF'];

  return (
    <div className="min-h-screen bg-zepto-blue flex flex-col items-center justify-center p-6 text-center text-white relative overflow-hidden">
      
      {/* Confetti Background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
            <div key={i} className="absolute animate-[fall_4s_linear_infinite]" style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                animationDelay: `${Math.random() * 2}s`,
                width: '8px',
                height: '8px',
                backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }}></div>
        ))}
      </div>
      <style>{`
        @keyframes fall {
            to { transform: translateY(110vh) rotate(720deg); }
        }
      `}</style>

      {/* Success Icon with Ripple */}
      <div className="relative mb-8 mt-10">
          <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-25"></div>
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center relative z-10 shadow-2xl shadow-green-900/50 animate-[bounce_1s_infinite]">
            <span className="material-symbols-outlined text-5xl text-white">check</span>
          </div>
      </div>
      
      <h1 className="text-3xl font-display font-bold mb-2 animate-fade-in">Order Placed!</h1>
      <p className="text-blue-200 mb-8 max-w-xs animate-fade-in delay-75">
        Thanks for your order. We've sent the receipt to your email.
      </p>

      {/* Order Card */}
      <div className="bg-white text-gray-800 p-6 rounded-3xl w-full max-w-sm mb-6 shadow-2xl animate-slide-up transform transition-all hover:scale-[1.02]">
        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order ID</span>
            <span className="font-mono font-bold text-zepto-blue bg-blue-50 px-2 py-1 rounded">{orderId}</span>
        </div>

        {/* Visual Timeline */}
        <div className="relative flex justify-between items-center mb-6 px-2">
            {/* Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 -z-10 rounded-full"></div>
            <div className="absolute top-1/2 left-0 w-1/2 h-1 bg-green-500 -z-10 rounded-full"></div>
            
            <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white shadow-sm ring-4 ring-white">
                    <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                </div>
                <span className="text-[10px] font-bold text-green-600">Placed</span>
            </div>
            <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 bg-white border-2 border-green-500 rounded-full flex items-center justify-center text-green-500 shadow-sm ring-4 ring-white">
                    <span className="material-symbols-outlined text-[14px] animate-pulse">sync</span>
                </div>
                <span className="text-[10px] font-bold text-gray-800">Processing</span>
            </div>
            <div className="flex flex-col items-center gap-1 opacity-50">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 shadow-sm ring-4 ring-white">
                    <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                </div>
                <span className="text-[10px] font-bold text-gray-500">Delivery</span>
            </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                <span className="material-symbols-outlined">schedule</span>
            </div>
            <div>
                <p className="text-xs text-blue-600 font-bold uppercase">Estimated Delivery</p>
                <p className="text-gray-800 font-bold">Tomorrow, 7 AM - 9 AM</p>
            </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col w-full max-w-sm gap-3 animate-slide-up" style={{animationDelay: '0.3s'}}>
        <button 
          onClick={() => navigate('/orders', { state: { highlightOrderId: orderId } })}
          className="w-full bg-zepto-yellow text-zepto-blue font-bold py-4 rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-yellow-500/20"
        >
          Track Order
        </button>
        <button 
          onClick={() => navigate('/home')}
          className="w-full bg-white/10 border border-white/20 text-white font-bold py-4 rounded-2xl hover:bg-white/20 active:scale-[0.98] transition-all"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default OrderSuccess;