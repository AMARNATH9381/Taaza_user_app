import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Splash: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(async () => {
      // Check if user is logged in
      const user = localStorage.getItem('taaza_user_name');
      const email = localStorage.getItem('taaza_user_email');
      
      if (user && email) {
        try {
          // Check if user is still active
          const response = await fetch(`/api/profile?email=${email}`);
          
          if (response.status === 403) {
            // User is blocked
            const data = await response.json();
            localStorage.removeItem('taaza_auth_token');
            localStorage.removeItem('taaza_user_name');
            localStorage.setItem('taaza_block_message', 'Account Restricted');
            navigate('/auth/login');
          } else if (response.ok) {
            // User is active, proceed to home
            navigate('/home');
          } else {
            // Other error, go to onboarding
            navigate('/auth/onboarding');
          }
        } catch (error) {
          console.error('Error checking user status:', error);
          navigate('/home'); // Fallback to home if API fails
        }
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