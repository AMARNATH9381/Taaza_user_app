
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('amarnathm9945@gmail.com'); // Default for dev convenience
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { sendOTP, verifyOTP } = useAuth();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await sendOTP(email);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await verifyOTP(email, otp);
      // Navigation is handled by App.tsx detecting isAuthenticated state change
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 -left-20 w-80 h-80 bg-zepto-blue rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-0 -right-20 w-80 h-80 bg-zepto-yellow rounded-full filter blur-3xl opacity-20 animate-pulse"></div>

      <div className="bg-white/95 backdrop-blur w-full max-w-md rounded-3xl shadow-2xl p-8 md:p-12 relative z-10 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-zepto-blue rounded-2xl mb-6 shadow-xl transform -rotate-6">
            <span className="material-symbols-outlined text-white text-5xl">admin_panel_settings</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Taaza Admin</h1>
          <p className="text-slate-500 mt-2 font-medium">
            {step === 1 ? 'Enter email to receive OTP' : 'Enter verification code'}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-500 p-4 rounded-xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                <input
                  type="email"
                  className="w-full pl-12 pr-4 py-4 bg-slate-100 border-none rounded-2xl outline-none focus:ring-4 focus:ring-zepto-blue/5 transition-all text-slate-900 font-medium"
                  placeholder="amarnathm9945@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Send OTP</span>
                  <span className="material-symbols-outlined">send</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">OTP Code</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">key</span>
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-4 bg-slate-100 border-none rounded-2xl outline-none focus:ring-4 focus:ring-zepto-blue/5 transition-all text-slate-900 font-medium tracking-widest text-center text-xl"
                  placeholder="------"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 bg-zepto-blue text-white font-black py-4 rounded-2xl shadow-xl hover:bg-opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Verify & Login</span>
                    <span className="material-symbols-outlined">login</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-xs text-slate-400">
              Did not receive code? <button type="button" onClick={handleSendOTP} className="text-zepto-blue font-bold hover:underline">Resend</button>
            </p>
          </form>
        )}

        <p className="text-center text-slate-400 text-sm mt-12 font-medium">
          Powered by <span className="text-zepto-blue font-bold">Taaza Labs</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
