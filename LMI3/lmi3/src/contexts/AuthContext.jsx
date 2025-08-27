import React, { createContext, useContext, useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import config from '../config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
          // Verify token with backend
          const response = await fetch(`${config.API_URL}/users/profile`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setToken(storedToken);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('authToken');
            setUser(null);
            setToken(null);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('authToken');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    try {
      // First, get the user's salt (endpoint always returns a salt to prevent timing attacks)
      const saltResponse = await fetch(`${config.API_URL}/users/getSalt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!saltResponse.ok) {
        return { success: false, error: 'Network error' };
      }

      const { salt } = await saltResponse.json();

      // Hash the password with the retrieved salt (same as registration)
      const hashedPassword = CryptoJS.SHA256(password + salt).toString();

      // Now perform the login with the hashed password
      const response = await fetch(`${config.API_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password: hashedPassword }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store auth data first
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        setToken(data.token);
        
        return { success: true, user: data.user };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    // Clear auth state
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    
    // Clear saved delivery data when user logs out
    localStorage.removeItem('userDeliveryData');
    
    // Navigation will be handled by the component calling logout
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${config.API_URL}/users/createUser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store auth data first
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        setToken(data.token);
        
        return { success: true, user: data.user };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const getUserInitials = () => {
    if (!user || !user.name) return 'U';
    return user.name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const isAdmin = () => {
    return user && user.type === 1;
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    register,
    getUserInitials,
    isAdmin,
    isLoggedIn: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
