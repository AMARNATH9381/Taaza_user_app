import React, { useState } from 'react';
import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Layout';

const AddMoney: React.FC = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');

  const handleProceed = () => {
    if (!amount) return;
    navigate(`/wallet/pay?amount=${amount}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Add Money" backPath="/home" />
      <div className="p-6 text-center">
        <p className="text-gray-500 text-sm mb-1">Current Balance</p>
        <h2 className="text-4xl font-bold text-gray-800 mb-8">₹570.00</h2>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[100, 500, 1000].map(val => (
            <button 
              key={val}
              onClick={() => setAmount(val.toString())}
              className="py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:border-zepto-blue hover:bg-blue-50 transition-colors"
            >
              ₹{val}
            </button>
          ))}
        </div>

        <div className="relative mb-8">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">₹</span>
          <input 
            type="number" 
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Enter custom amount"
            className="w-full py-4 pl-10 pr-4 bg-white border-2 border-transparent focus:border-zepto-blue rounded-xl text-xl font-bold text-gray-800 focus:outline-none shadow-sm"
          />
        </div>

        <button 
          onClick={handleProceed}
          disabled={!amount}
          className="w-full bg-zepto-blue text-white font-bold py-4 rounded-xl text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-900 transition-colors"
        >
          Proceed to Pay
        </button>
      </div>
    </div>
  );
};

const PaymentOptions: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const amount = searchParams.get('amount');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={`Pay ₹${amount}`} backPath="/wallet/add" />
      <div className="p-4 space-y-4">
        <h3 className="font-bold text-gray-700 ml-1">Payment Methods</h3>
        
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <div 
            onClick={() => navigate('/wallet/processing')}
            className="p-4 flex items-center gap-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <div>
              <p className="font-bold text-gray-800">UPI</p>
              <p className="text-xs text-gray-500">GPay, PhonePe, Paytm</p>
            </div>
            <span className="material-symbols-outlined ml-auto text-gray-400">chevron_right</span>
          </div>

          <div 
            onClick={() => navigate('/wallet/processing')}
            className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined">credit_card</span>
            </div>
            <div>
              <p className="font-bold text-gray-800">Card</p>
              <p className="text-xs text-gray-500">Visa, Mastercard</p>
            </div>
            <span className="material-symbols-outlined ml-auto text-gray-400">chevron_right</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Processing: React.FC = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    setTimeout(() => {
      navigate('/wallet/success');
    }, 2000);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 border-4 border-gray-100 border-t-zepto-blue rounded-full animate-spin mb-6"></div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Processing Payment</h2>
      <p className="text-gray-500">Please do not close this window...</p>
    </div>
  );
};

const Success: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-zepto-blue flex flex-col items-center justify-center p-6 text-center text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {/* Simple CSS confetti simulation using particles */}
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random()}s`
          }}></div>
        ))}
      </div>
      
      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl animate-bounce">
        <span className="material-symbols-outlined text-5xl">check</span>
      </div>
      <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
      <p className="text-blue-200 mb-8">Your wallet has been updated.</p>
      
      <button 
        onClick={() => navigate('/home')}
        className="w-full max-w-xs bg-white text-zepto-blue font-bold py-3.5 rounded-xl hover:bg-gray-100"
      >
        Back to Home
      </button>
    </div>
  );
};

const Wallet: React.FC = () => {
  return (
    <Routes>
      <Route path="add" element={<AddMoney />} />
      <Route path="pay" element={<PaymentOptions />} />
      <Route path="processing" element={<Processing />} />
      <Route path="success" element={<Success />} />
    </Routes>
  );
};

export default Wallet;