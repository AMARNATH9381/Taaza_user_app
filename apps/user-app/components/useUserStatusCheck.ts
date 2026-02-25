import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useUserStatusCheck = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = async () => {
      const email = localStorage.getItem('taaza_user_email');
      if (!email) return;

      try {
        const response = await fetch(`/api/profile?email=${email}`, { credentials: 'include' });
        if (response.status === 403) {
          const data = await response.json();
          try { await fetch('/api/logout', { method: 'POST', credentials: 'include' }); } catch (e) {}
          localStorage.removeItem('taaza_user_name');
          localStorage.setItem('taaza_block_message', 'Account Restricted');
          navigate('/auth/login');
        }
      } catch (error) {
        console.error('Status check failed:', error);
      }
    };

    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [navigate]);
};