import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Splash from './pages/Splash';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import MeatOrder from './pages/MeatOrder';
import MilkPlan from './pages/MilkPlan';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import Orders from './pages/Orders';
import CategoryStore from './pages/CategoryStore';
import AuthGuard from './components/AuthGuard';
import { useUserStatusCheck } from './components/useUserStatusCheck';

// Component to add status checking to protected routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useUserStatusCheck();
  return <AuthGuard>{children}</AuthGuard>;
};

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/auth/*" element={<Auth />} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
        <Route path="/meat" element={<ProtectedRoute><MeatOrder /></ProtectedRoute>} />
        <Route path="/milk/*" element={<ProtectedRoute><MilkPlan /></ProtectedRoute>} />
        <Route path="/vegetables" element={<ProtectedRoute><CategoryStore type="vegetables" /></ProtectedRoute>} />
        <Route path="/fruits" element={<ProtectedRoute><CategoryStore type="fruits" /></ProtectedRoute>} />
        <Route path="/profile/*" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/wallet/*" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
      </Routes>
    </HashRouter>
  );
};

export default App;