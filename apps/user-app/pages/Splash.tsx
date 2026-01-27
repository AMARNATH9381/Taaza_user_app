import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Splash: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Check if user is logged in (mock)
      const user = localStorage.getItem('taaza_user_name');
      if (user) {
        navigate('/home');
      } else {
        navigate('/auth/onboarding');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-zepto-blue text-center p-4 overflow-hidden">
      <div className="shape-background"></div>

      <div className="relative z-10 space-y-8 animate-fade-in">
        <div className="flex flex-col items-center">
          <h1 className="text-6xl md:text-7xl font-display font-bold uppercase tracking-wider text-white mb-2 px-4">
            Taaza
          </h1>
          <p className="text-xl md:text-2xl text-primary font-medium max-w-sm mx-auto px-4">
            Straight from the Farm to Your Door
          </p>
        </div>

        <div className="pt-8">
          <div className="relative w-48 h-1 bg-white/20 rounded-full mx-auto overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-primary rounded-full animate-[loading_2s_ease-in-out_infinite]"
              style={{ width: '30%' }}
            ></div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes loading {
          0% { left: -30%; }
          50% { left: 100%; }
          100% { left: -30%; }
        }
      `}</style>
    </div>
  );
};

export default Splash;