import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

// --- Shared Components for Legal Pages ---
const LegalPageLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white flex flex-col animate-slide-up">
      <div className="bg-white sticky top-0 z-20 px-4 py-3 border-b border-gray-100 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-gray-700"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold ml-2 text-gray-900">{title}</h1>
      </div>
      <div className="p-6 text-gray-600 text-sm leading-relaxed space-y-4 overflow-y-auto max-w-2xl mx-auto w-full">
        {children}
      </div>
    </div>
  );
};

const TermsOfService: React.FC = () => (
  <LegalPageLayout title="Terms of Service">
    <p><strong>Last Updated: October 26, 2023</strong></p>
    <p>Welcome to Taaza. By accessing or using our mobile application and services, you agree to be bound by these Terms of Service.</p>

    <h3 className="text-gray-900 font-bold text-base mt-4">1. Use of Services</h3>
    <p>You must be at least 18 years old to use our services. You agree to provide accurate and complete information during registration and to keep your account information updated.</p>

    <h3 className="text-gray-900 font-bold text-base mt-4">2. Orders and Deliveries</h3>
    <p>All orders are subject to availability. We reserve the right to cancel orders at our discretion. Delivery times are estimates and may vary based on traffic, weather, and other factors.</p>

    <h3 className="text-gray-900 font-bold text-base mt-4">3. Pricing and Payments</h3>
    <p>Prices are listed in Indian Rupees (INR) and are subject to change without notice. Payment must be made at the time of order or via approved payment methods upon delivery.</p>

    <h3 className="text-gray-900 font-bold text-base mt-4">4. Cancellation and Refunds</h3>
    <p>You may cancel your order within 5 minutes of placing it. Refunds for cancelled orders or quality issues will be processed to your Taaza Wallet or original payment method within 5-7 business days.</p>

    <h3 className="text-gray-900 font-bold text-base mt-4">5. User Conduct</h3>
    <p>You agree not to misuse our services, including but not limited to fraudulent activities, harassment of delivery partners, or violation of applicable laws.</p>
  </LegalPageLayout>
);

const PrivacyPolicy: React.FC = () => (
  <LegalPageLayout title="Privacy Policy">
    <p><strong>Effective Date: October 26, 2023</strong></p>
    <p>At Taaza, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information.</p>

    <h3 className="text-gray-900 font-bold text-base mt-4">1. Information We Collect</h3>
    <p>We collect information you provide directly to us, such as your name, email address, phone number, and delivery address. We also collect transaction data and location information to facilitate deliveries.</p>

    <h3 className="text-gray-900 font-bold text-base mt-4">2. How We Use Your Information</h3>
    <ul className="list-disc pl-5 space-y-1">
      <li>To process and deliver your orders.</li>
      <li>To communicate with you regarding updates, offers, and support.</li>
      <li>To improve our app functionality and user experience.</li>
      <li>To prevent fraud and ensure the safety of our platform.</li>
    </ul>

    <h3 className="text-gray-900 font-bold text-base mt-4">3. Data Sharing</h3>
    <p>We do not sell your personal data. We may share information with third-party service providers (e.g., payment processors, delivery partners) solely for the purpose of fulfilling our services.</p>

    <h3 className="text-gray-900 font-bold text-base mt-4">4. Data Security</h3>
    <p>We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.</p>
  </LegalPageLayout>
);

// --- Auth Components ---

// 1. Onboarding
const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-zepto-blue text-center p-4 overflow-hidden">
      <div className="shape-background"></div>
      <div className="relative z-10 space-y-8 animate-fade-in w-full max-w-md mx-auto">
        <div className="flex flex-col items-center">
          <h1 className="text-6xl font-display font-bold uppercase tracking-wider text-white mb-2">
            Taaza
          </h1>
          <p className="text-xl text-primary font-medium">
            Straight from the Farm to Your Door
          </p>
        </div>
        <div className="pt-8 w-full px-6">
          <button
            onClick={() => navigate('/auth/login')}
            className="w-full bg-primary text-zepto-blue py-4 rounded-full text-lg font-bold shadow-lg hover:bg-yellow-400 transition-transform active:scale-95 mb-4"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. Login
const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [shake, setShake] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [blockMessage, setBlockMessage] = useState('');

  useEffect(() => {
    // Check if user was redirected due to account being blocked
    const message = localStorage.getItem('taaza_block_message');
    if (message) {
      setBlockMessage(message);
      localStorage.removeItem('taaza_block_message');
    }
  }, []);

  // Common email domain typos dictionary
  const getTypoSuggestion = (emailStr: string) => {
    const parts = emailStr.split('@');
    if (parts.length !== 2) return '';

    const domain = parts[1].toLowerCase();
    const typos: Record<string, string> = {
      'gmil.com': 'gmail.com',
      'gmal.com': 'gmail.com',
      'gmali.com': 'gmail.com',
      'gmaill.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'gamil.com': 'gmail.com',
      'gnail.com': 'gmail.com',
      'gmail.cmo': 'gmail.com',
      'gmail.co': 'gmail.com',
      'yaho.com': 'yahoo.com',
      'yahooo.com': 'yahoo.com',
      'yho.com': 'yahoo.com',
      'hotmal.com': 'hotmail.com',
      'hotmai.com': 'hotmail.com',
      'outlok.com': 'outlook.com',
      'iclud.com': 'icloud.com',
      'iclod.com': 'icloud.com'
    };

    if (typos[domain]) {
      return `${parts[0]}@${typos[domain]}`;
    }
    return '';
  };

  const isValidEmail = (email: string) => {
    // Strict regex: requires chars + @ + chars + . + at least 2 chars
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  };

  const validate = (emailToCheck: string = email) => {
    if (!emailToCheck) {
      setError('Email is required');
      return false;
    }
    if (!isValidEmail(emailToCheck)) {
      setError('Please enter a valid email address');
      return false;
    }
    setError('');

    // Final check for typos before proceeding
    const suggested = getTypoSuggestion(emailToCheck);
    if (suggested) {
      setSuggestion(suggested);
    }
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);

    if (error) setError('');

    // Real-time typo detection
    const typo = getTypoSuggestion(val);
    setSuggestion(typo);
  };

  const handleSendOtp = () => {
    if (validate()) {
      setIsLoading(true);
      setBlockMessage(''); // Clear any previous block message

      fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to send OTP');
          return res.json();
        })
        .then(() => {
          localStorage.setItem('taaza_user_email', email);
          setIsLoading(false);
          navigate('/auth/otp');
        })
        .catch(err => {
          setIsLoading(false);
          setError('Failed to send OTP. Please try again.');
          console.error(err);
        });
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleApplySuggestion = () => {
    setEmail(suggestion);
    setSuggestion('');
    setError('');
    // Optional: Focus back on input or auto-validate
  };

  return (
    <div className="relative flex flex-col h-screen p-6 bg-zepto-blue">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
      <div className="shape-background"></div>
      <div className="flex-grow flex flex-col justify-center max-w-sm mx-auto w-full relative z-10">
        <div className="text-center">
          <h1 className="text-5xl font-display font-bold uppercase tracking-wider text-white mb-2">
            Taaza
          </h1>
          <p className="text-lg text-primary font-medium mb-8">
            Straight from the Farm to Your Door
          </p>

          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
            {/* Account Blocked Message */}
            {blockMessage && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-500/30 rounded-xl">
                <div className="flex items-center gap-2 text-red-200 text-sm font-medium">
                  <span className="material-symbols-outlined text-lg">block</span>
                  <span className="font-bold">{blockMessage}</span>
                </div>
              </div>
            )}

            <h2 className="text-xl font-medium text-white mb-6">Login or Sign up</h2>

            <div className="relative mb-8">
              <div
                className={`flex shadow-inner rounded-xl overflow-hidden border bg-white transition-all duration-300 ${error ? 'border-red-500' : isFocused ? 'border-primary ring-2 ring-primary/20' : 'border-white/20'} ${shake ? 'animate-shake' : ''}`}
              >
                <div className={`flex items-center justify-center w-14 bg-gray-50 border-r border-gray-200 transition-colors ${error ? 'text-red-500' : isFocused ? 'text-primary' : 'text-gray-500'}`}>
                  <span className="material-symbols-outlined">mail</span>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => { setIsFocused(false); validate(); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                  className="w-full h-14 px-4 bg-white text-zepto-blue placeholder-gray-400 focus:outline-none font-semibold text-lg"
                  placeholder="Email Address"
                  autoFocus
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="absolute -bottom-7 left-0 right-0 flex items-center justify-center gap-1 text-red-300 text-xs animate-slide-up font-medium bg-red-900/20 p-2 rounded-lg border border-red-500/20">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {error}
                </div>
              )}

              {/* Typo Suggestion */}
              {!error && suggestion && (
                <div
                  className="absolute -bottom-7 left-0 right-0 flex items-center justify-center gap-1 text-zepto-yellow text-xs animate-slide-up cursor-pointer hover:underline bg-black/20 py-1 rounded-full backdrop-blur-sm"
                  onClick={handleApplySuggestion}
                >
                  <span className="material-symbols-outlined text-sm">lightbulb</span>
                  Did you mean <span className="font-bold">{suggestion}</span>?
                </div>
              )}
            </div>

            <button
              onClick={handleSendOtp}
              disabled={isLoading || !email}
              className={`w-full bg-primary text-zepto-blue font-bold py-4 rounded-xl text-lg shadow-lg hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 ${(isLoading || !email) ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.98]'
                }`}
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-zepto-blue border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  Continue
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-blue-200 mt-6 leading-tight max-w-xs mx-auto">
              By continuing, you agree to our{' '}
              <button
                onClick={() => navigate('/auth/terms')}
                className="underline cursor-pointer hover:text-white transition-colors font-medium"
              >
                Terms of Service
              </button>
              {' '}&{' '}
              <button
                onClick={() => navigate('/auth/privacy')}
                className="underline cursor-pointer hover:text-white transition-colors font-medium"
              >
                Privacy Policy
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. OTP
const OTP: React.FC = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const userEmail = localStorage.getItem('taaza_user_email') || 'user@example.com';

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1); // Take last char
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    // Auto-submit on last digit
    if (index === 5 && value !== '') {
      verifyOtp([...newOtp.slice(0, 5), value]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    if (pastedData.length === 0) return;

    const newOtp = [...otp];
    pastedData.forEach((value, index) => {
      if (index < 6 && /^\d$/.test(value)) {
        newOtp[index] = value;
      }
    });
    setOtp(newOtp);

    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, 5);
    inputsRef.current[nextIndex]?.focus();

    // Auto submit if filled
    if (newOtp.every(d => d !== '') && newOtp.length === 6) {
      verifyOtp(newOtp);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const verifyOtp = (currentOtp: string[]) => {
    if (currentOtp.join('').length === 6) {
      setIsVerifying(true);
      setError('');

      const code = currentOtp.join('');
      fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, code })
      })
        .then(res => res.json())
        .then(data => {
          setIsVerifying(false);
          if (data.success) {
            // Save token if needed, for now just flow
            localStorage.setItem('taaza_auth_token', data.token); // Mock token

            if (data.isNewUser) {
              navigate('/auth/register');
            } else {
              // Fetch profile to get name for welcome screen if existing
              fetch(`/api/profile?email=${userEmail}`)
                .then(res => res.json())
                .then(user => {
                  if (user.id) localStorage.setItem('taaza_user_id', user.id.toString());
                  if (user.name) localStorage.setItem('taaza_user_name', user.name);
                  navigate('/auth/welcome');
                })
                .catch(() => navigate('/auth/welcome'));
            }
          } else if (data.blocked) {
            // User is blocked, redirect to login with error message
            localStorage.setItem('taaza_block_message', data.message);
            navigate('/auth/login');
          } else {
            setError('Invalid OTP');
            setShake(true);
            setTimeout(() => setShake(false), 500);
          }
        })
        .catch(err => {
          setIsVerifying(false);
          setError('Invalid or expired OTP');
          setShake(true);
          setTimeout(() => setShake(false), 500);
          console.error(err);
        });
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleVerifyClick = () => verifyOtp(otp);

  const handleResend = () => {
    setTimer(30);
    setOtp(['', '', '', '', '', '']);
    inputsRef.current[0]?.focus();

    // Actually resend OTP via API
    fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to resend');
        console.log('OTP resent successfully');
      })
      .catch(err => console.error('Failed to resend OTP:', err));
  };

  return (
    <div className="relative flex flex-col h-screen p-6 bg-zepto-blue">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
      <div className="shape-background"></div>

      {/* Back Button */}
      <button
        onClick={() => navigate('/auth/login')}
        className="absolute top-6 left-6 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 z-20 backdrop-blur-md"
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </button>

      <div className="flex-grow flex flex-col justify-center max-w-sm mx-auto w-full relative z-10">
        <div className="text-center">
          {/* IDENTICAL HEADER TO LOGIN PAGE */}
          <h1 className="text-5xl font-display font-bold uppercase tracking-wider text-white mb-2">
            Taaza
          </h1>
          <p className="text-lg text-primary font-medium mb-8">
            Straight from the Farm to Your Door
          </p>

          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
            {/* CARD TITLE: VERIFICATION */}
            <h2 className="text-xl font-medium text-white mb-2">Verification Code</h2>
            <p className="text-blue-200 text-xs mb-6">Please enter the 6-digit code sent to your email</p>

            {/* Improved Email Display */}
            <div className="flex items-center justify-between bg-white/5 rounded-xl p-3 px-4 mb-6 border border-white/10 shadow-inner">
              <div className="flex flex-col text-left overflow-hidden mr-2">
                <span className="text-sm font-semibold text-white truncate" title={userEmail}>
                  {userEmail}
                </span>
              </div>
              <button
                onClick={() => navigate('/auth/login')}
                className="text-primary text-xs font-bold hover:text-white transition-colors shrink-0 bg-white/5 px-2 py-1 rounded hover:bg-white/10"
              >
                CHANGE
              </button>
            </div>

            <div className={`flex justify-between gap-2 mb-8 ${shake ? 'animate-shake' : ''}`}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputsRef.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onPaste={index === 0 ? handlePaste : undefined}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-11 h-14 text-center text-xl font-bold rounded-xl transition-all outline-none 
                    ${digit
                      ? 'bg-white text-zepto-blue shadow-lg scale-105 transform border-2 border-white'
                      : 'bg-white/5 text-white border border-white/20 focus:border-primary focus:bg-white/10'}
                  `}
                />
              ))}
            </div>

            <button
              onClick={handleVerifyClick}
              disabled={isVerifying || otp.join('').length !== 6}
              className={`w-full bg-primary text-zepto-blue font-bold py-3.5 rounded-xl text-lg shadow-lg hover:bg-yellow-400 transition-all mb-4 flex items-center justify-center gap-2 ${(isVerifying || otp.join('').length !== 6) ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.98]'
                }`}
            >
              {isVerifying ? (
                <span className="w-5 h-5 border-2 border-zepto-blue border-t-transparent rounded-full animate-spin"></span>
              ) : 'Verify & Proceed'}
            </button>

            <div className="text-center h-5">
              {timer > 0 ? (
                <p className="text-blue-300 text-xs">
                  Resend code in <span className="font-bold text-white">00:{timer.toString().padStart(2, '0')}</span>
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  className="text-white font-semibold text-xs hover:text-primary transition-colors flex items-center justify-center gap-1 mx-auto"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Resend Code
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. Register
const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleRegister = () => {
    // Basic Validation
    if (name.trim().length < 2) {
      setError('Please enter your full name');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    // Indian Mobile Validation (Starts with 6-9, 10 digits)
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Enter a valid 10-digit Indian mobile number');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setIsLoading(true);
    const email = localStorage.getItem('taaza_user_email');

    fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, mobile, dob: '', gender: '' })
    })
      .then(res => {
        if (res.status === 409) throw new Error('Mobile number already registered');
        if (!res.ok) throw new Error('Registration failed');
        return res.json();
      })
      .then(() => {
        localStorage.setItem('taaza_user_name', name.trim());
        localStorage.setItem('taaza_mobile', mobile);
        setIsLoading(false);
        navigate('/auth/welcome');
      })
      .catch(err => {
        setIsLoading(false);
        setError(err.message || 'Registration failed');
      });
  };

  return (
    <div className="relative flex flex-col h-screen p-6 bg-zepto-blue">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
      <div className="shape-background"></div>

      {/* Back Button */}
      <button
        onClick={() => navigate('/auth/login')}
        className="absolute top-6 left-6 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 z-20 backdrop-blur-md"
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </button>

      <div className="flex-grow flex flex-col justify-center max-w-sm mx-auto w-full relative z-10">
        <div className="text-center">
          <h1 className="text-5xl font-display font-bold uppercase tracking-wider text-white mb-2">
            Taaza
          </h1>
          <p className="text-lg text-primary font-medium mb-8">
            Straight from the Farm to Your Door
          </p>

          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
            <h2 className="text-xl font-medium text-white mb-6">Complete Profile</h2>

            <div className={`space-y-5 mb-8 ${shake ? 'animate-shake' : ''}`}>

              {/* Name Input */}
              <div className="relative">
                <div className={`flex shadow-inner rounded-xl overflow-hidden border bg-white transition-all duration-300 ${error && name.length < 2 ? 'border-red-500' : 'border-white/20'}`}>
                  <div className="flex items-center justify-center w-14 bg-gray-50 border-r border-gray-200 text-gray-400">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError('');
                    }}
                    className="w-full h-14 px-4 bg-white text-zepto-blue placeholder-gray-400 focus:outline-none font-semibold text-lg"
                    placeholder="Full Name"
                    autoFocus
                  />
                </div>
              </div>

              {/* Mobile Input */}
              <div className="relative">
                <div className={`flex shadow-inner rounded-xl overflow-hidden border bg-white transition-all duration-300 ${error && !/^[6-9]\d{9}$/.test(mobile) ? 'border-red-500' : 'border-white/20'}`}>
                  <div className="flex items-center justify-center px-3 bg-gray-50 border-r border-gray-200 text-gray-800 font-bold min-w-[80px]">
                    <img src="https://flagcdn.com/w20/in.png" alt="IN" className="w-5 h-auto mr-1.5 shadow-sm rounded-sm" />
                    +91
                  </div>
                  <input
                    type="tel"
                    value={mobile}
                    maxLength={10}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setMobile(val);
                      if (error) setError('');
                    }}
                    className="w-full h-14 px-4 bg-white text-zepto-blue placeholder-gray-400 focus:outline-none font-semibold text-lg tracking-wider"
                    placeholder="Mobile Number"
                  />
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-center justify-center gap-2 text-red-300 text-xs font-medium bg-red-900/20 p-2 rounded-lg border border-red-500/20 animate-slide-up">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {error}
                </div>
              )}

            </div>

            <button
              onClick={handleRegister}
              disabled={isLoading}
              className={`w-full bg-primary text-zepto-blue font-bold py-4 rounded-xl text-lg shadow-lg hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.98]'
                }`}
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-zepto-blue border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  Finish Setup
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. Welcome
const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('taaza_user_name') || 'Friend';

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/home');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-zepto-blue p-6 text-center overflow-hidden">
      <div className="shape-background"></div>

      {/* Confetti Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute animate-[fall_3s_linear_infinite]" style={{
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 20}%`,
            animationDelay: `${Math.random() * 2}s`,
            width: '8px',
            height: '8px',
            backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#FFFFFF'][Math.floor(Math.random() * 4)],
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
          }}></div>
        ))}
      </div>
      <style>{`
        @keyframes fall {
            to { transform: translateY(100vh) rotate(360deg); }
        }
      `}</style>

      <div className="relative z-10 w-full max-w-sm mx-auto">
        <h1 className="text-5xl font-display font-bold uppercase tracking-wider text-white mb-2 animate-fade-in">
          Taaza
        </h1>
        <p className="text-lg text-primary font-medium mb-8 animate-fade-in delay-100">
          Straight from the Farm to Your Door
        </p>

        <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-2xl animate-slide-up">
          <div className="w-24 h-24 bg-gradient-to-tr from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/30 animate-[bounce_2s_infinite]">
            <span className="material-symbols-outlined text-5xl text-white">celebration</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Welcome, {userName}!</h2>
          <p className="text-blue-100/80 mb-8 text-sm leading-relaxed">
            Your account has been created successfully.<br />Get ready for fresh deliveries!
          </p>

          <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-green-400 flex items-center justify-center">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <span className="text-white font-medium text-sm tracking-wide">Redirecting to Home...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Auth: React.FC = () => {
  return (
    <Routes>
      <Route path="onboarding" element={<Onboarding />} />
      <Route path="login" element={<Login />} />
      <Route path="otp" element={<OTP />} />
      <Route path="register" element={<Register />} />
      <Route path="welcome" element={<Welcome />} />
      <Route path="terms" element={<TermsOfService />} />
      <Route path="privacy" element={<PrivacyPolicy />} />
    </Routes>
  );
};

export default Auth;