import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BasketProvider } from './contexts/BasketContext';
import Navbar from './components/Navbar';
import Menu from './views/Menu';

function App() {
  return (
    <AuthProvider>
      <BasketProvider>
        <Router>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/" element={<Menu />} />
              {/* Add other routes as needed */}
            </Routes>
          </div>
        </Router>
      </BasketProvider>
    </AuthProvider>
  );
}

export default App;
