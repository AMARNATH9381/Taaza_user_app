import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Footer } from '../components/Layout';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('upi');

  const handlePlaceOrder = () => {
    // Clear cart and redirect
    localStorage.removeItem('taaza_cart');
    navigate('/order-success');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title="Checkout" backPath="/cart" />
      
      <main className="flex-grow p-4 space-y-4">
        {/* Address Section */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-zepto-blue">location_on</span>
              Delivery Address
            </h3>
            <button className="text-xs text-blue-600 font-medium">CHANGE</button>
          </div>
          <div>
            <p className="font-semibold text-sm">Home</p>
            <p className="text-sm text-gray-500 mt-1">123 Elm Street, Apt 4B, Mumbai, Maharashtra 400001</p>
          </div>
        </div>

        {/* Slot Section */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-zepto-blue">schedule</span>
            Delivery Slot
          </h3>
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm text-blue-900">Tomorrow Morning</p>
              <p className="text-xs text-blue-700">7:00 AM - 9:00 AM</p>
            </div>
            <span className="material-symbols-outlined text-blue-600">check_circle</span>
          </div>
        </div>

        {/* Payment Section */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-zepto-blue">payments</span>
            Payment Method
          </h3>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="radio" name="payment" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} className="accent-zepto-blue w-5 h-5" />
              <span className="material-symbols-outlined text-green-600">account_balance_wallet</span>
              <span className="flex-grow font-medium text-sm">UPI Payment</span>
            </label>
            
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="accent-zepto-blue w-5 h-5" />
              <span className="material-symbols-outlined text-gray-600">money</span>
              <span className="flex-grow font-medium text-sm">Cash on Delivery</span>
            </label>
          </div>
        </div>
      </main>

      <Footer className="bg-white border-t p-4">
        <button 
          onClick={handlePlaceOrder}
          className="w-full bg-zepto-blue text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-blue-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>Place Order</span>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </Footer>
    </div>
  );
};

export default Checkout;