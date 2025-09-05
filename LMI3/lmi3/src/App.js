import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BasketProvider } from './contexts/BasketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useNotificationRefresh } from './hooks/useNotificationRefresh';
import Navbar from './components/Navbar';
import Menu from './views/Menu';
import MenuView from './views/MenuView';
import CashierView from './views/CashierView';
import AdminDashboard from './views/AdminDashboard';
import OrderHistory from './views/orderHistory';
import UserProfile from './views/userProfile';
import NotFoundPage from './views/not-found-page';
import './App.css';

// Component that uses the notification refresh hook
const AppContent = () => {
  useNotificationRefresh();

  return (
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
  );
};

function App() {
  useEffect(() => {
    document.title = 'Rudy et Fanny';
    
    // Request notification permission on app startup
    if ('Notification' in window && Notification.permission === 'default') {
      console.log('Requesting notification permission...');
      Notification.requestPermission().then((permission) => {
        console.log('Notification permission result:', permission);
        if (permission === 'granted') {
          console.log('Notification permission granted');
        } else if (permission === 'denied') {
          console.log('Notification permission denied');
        }
      }).catch((error) => {
        console.error('Error requesting notification permission:', error);
      });
    } else if ('Notification' in window) {
      console.log('Current notification permission:', Notification.permission);
    } else {
      console.log('Browser does not support notifications');
    }
  }, []);

  return (
    <AuthProvider>
      <BasketProvider>
        <NotificationProvider>
          <Router>
            <AppContent />
          </Router>
        </NotificationProvider>
      </BasketProvider>
    </AuthProvider>
  );
}

export default App;
