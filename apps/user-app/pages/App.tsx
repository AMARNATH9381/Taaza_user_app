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
import Orders from './pages/Orders';

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
        <Route path="/home" element={<Home />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/meat" element={<MeatOrder />} />
        <Route path="/milk/*" element={<MilkPlan />} />
        <Route path="/profile/*" element={<Profile />} />
        <Route path="/orders" element={<Orders />} />
      </Routes>
    </HashRouter>
  );
};

export default App;