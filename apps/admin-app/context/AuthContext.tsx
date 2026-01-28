
import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserInfo {
  name: string;
  email: string;
  role: string;
  dob?: string;
  gender?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserInfo | null;
  sendOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  updateUser: (data: { name: string; dob: string; gender: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('taaza_token');
    const savedUser = localStorage.getItem('taaza_user');
    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const sendOTP = async (email: string) => {
    const response = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type: 'admin' }),
    });
    if (!response.ok) throw new Error('Failed to send OTP');
  };

  const verifyOTP = async (email: string, otp: string) => {
    const response = await fetch('/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code: otp }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Verification failed');
    }

    if (data.role !== 'admin') {
      throw new Error('Access denied. Admin privileges required.');
    }

    const userData = { name: 'Admin', email, role: data.role };
    localStorage.setItem('taaza_token', data.token);
    localStorage.setItem('taaza_user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const updateUser = async (data: { name: string; dob: string; gender: string }) => {
    if (!user) throw new Error('Not authenticated');

    const response = await fetch(`/api/profile?email=${encodeURIComponent(user.email)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to update profile');

    const updatedUser = { ...user, ...data };
    localStorage.setItem('taaza_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const logout = () => {
    localStorage.removeItem('taaza_token');
    localStorage.removeItem('taaza_user');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, sendOTP, verifyOTP, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
