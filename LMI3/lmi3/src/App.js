import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BasketProvider } from './contexts/BasketContext';
import Navbar from './components/Navbar';
import Menu from './views/Menu';
import MenuView from './views/MenuView';
import CashierView from './views/CashierView';
import AdminDashboard from './views/AdminDashboard';
import OrderHistory from './views/orderHistory';
import UserProfile from './views/userProfile';
import NotFoundPage from './views/not-found-page';
import './App.css';


function App() {
  useEffect(() => {
    document.title = 'Rudy et Fanny';
  }, []);

  return (
    <AuthProvider>
      <BasketProvider>
        <Router>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/" element={<Menu />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/borne" element={<MenuView />} />
              <Route path="/caisse" element={<CashierView />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/orders" element={<OrderHistory />} />
              <Route path="/admin" element={<AdminDashboard />} />
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
