import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        // Call protected profile endpoint; server will read JWT from cookie or Authorization
        const response = await fetch('/api/profile', { credentials: 'include' });
        if (response.status === 401 || response.status === 403) {
          try { await fetch('/api/logout', { method: 'POST', credentials: 'include' }); } catch (e) {}
          localStorage.removeItem('taaza_user_name');
          navigate('/auth/login');
          return;
        }
        const userData = await response.json();
        if (userData && userData.status === 'Blocked') {
          localStorage.setItem('taaza_block_message', 'Account Restricted');
          navigate('/auth/login');
          return;
        }
        setIsChecking(false);
      } catch (error) {
        console.error('Error checking user status:', error);
        setIsChecking(false);
      }
    };

    checkUserStatus();
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-zepto-blue flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-sm">Checking account status...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;