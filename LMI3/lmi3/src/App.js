import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BasketProvider } from './contexts/BasketContext';
import Navbar from './components/Navbar';
import Menu from './views/Menu';
import AdminUsers from './views/adminUsers';
import AdminSauce from './views/adminSauce';
import AdminPlat from './views/adminPlat';
import AdminExtra from './views/adminExtra';
import AdminOrders from './views/adminOrders';
import OrderHistory from './views/orderHistory';
import UserProfile from './views/userProfile';
import NotFoundPage from './views/not-found-page';
import './App.css';


function App() {
  return (
    <AuthProvider>
      <BasketProvider>
        <Router>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/" element={<Menu />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/orders" element={<OrderHistory />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/sauces" element={<AdminSauce />} />
              <Route path="/admin/plats" element={<AdminPlat />} />
              <Route path="/admin/extras" element={<AdminExtra />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="*" element={<NotFoundPage />} />
              {/* Add other routes as needed */}
            </Routes>
          </div>
        </Router>
      </BasketProvider>
    </AuthProvider>
  );
}

export default App;
