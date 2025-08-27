import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router, Routes, Route, useLocation, Outlet } from 'react-router-dom';

import NotFound from './views/not-found-page.tsx';
import Login from './views/login';
import Profile from './views/userProfile';
import AdminSauce from './views/adminSauce';
import AdminPlat from './views/adminPlat';
import AdminDashboard from './views/AdminDashboard';
import Menu from './views/Menu';
import Navbar from './components/Navbar';
import AdminTags from './views/adminTags';
import AdminUsers from './views/adminUsers';
import AdminExtra from './views/adminExtra';
import AdminOrders from './views/adminOrders';
import OrderHistory from './views/orderHistory';
import { AuthProvider } from './contexts/AuthContext';
import { BasketProvider } from './contexts/BasketContext';

const Layout = () => {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login';
  return (
    <>
      {!hideNavbar && <Navbar />}
      <Outlet />
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <BasketProvider>
        <Router>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Menu />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/sauces" element={<AdminSauce />} />
              <Route path="/admin/plats" element={<AdminPlat />} />
              <Route path="/admin/tags" element={<AdminTags />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/extras" element={<AdminExtra />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/orders" element={<OrderHistory />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="/login" element={<Login />} />
          </Routes>
        </Router>
      </BasketProvider>
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();
