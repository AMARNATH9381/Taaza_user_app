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
      const token = localStorage.getItem('taaza_auth_token');
      const email = localStorage.getItem('taaza_user_email');

      if (!token || !email) {
        navigate('/auth/login');
        return;
      }

      try {
        // Check user status with backend
        const response = await fetch(`/api/profile?email=${email}`);
        const userData = await response.json();

        if (response.status === 403 || userData.status === 'Blocked') {
          // User is blocked, clear local storage and redirect to login
          localStorage.removeItem('taaza_auth_token');
          localStorage.removeItem('taaza_user_name');
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