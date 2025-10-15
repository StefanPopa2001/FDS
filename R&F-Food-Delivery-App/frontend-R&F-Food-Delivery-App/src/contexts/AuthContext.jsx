import React, { createContext, useContext, useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import config from '../config';
import { clientLogger, setClientLoggerUser } from '../utils/clientLogger';

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
        // Try optimistic restore of user from previous session to avoid flashing logged-out state
        try {
          const storedUser = localStorage.getItem('authUser');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
            setClientLoggerUser(JSON.parse(storedUser));
          }
        } catch (e) {
          // ignore malformed stored user
        }
        if (storedToken) {
          // Verify token with backend
          const response = await fetch(`${config.API_URL}/users/profile`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });

          // Helper: parse JSON only when content-type indicates JSON
          const tryParseJson = async (res) => {
            const ct = res.headers.get('content-type') || '';
            if (!ct.toLowerCase().includes('application/json')) return null;
            try {
              return await res.json();
            } catch (e) {
              return null;
            }
          };

          if (response.ok) {
            const data = await tryParseJson(response);
            if (data && data.user) {
              setUser(data.user);
              setToken(storedToken);
              // persist small user snapshot for next reload
              try { localStorage.setItem('authUser', JSON.stringify(data.user)); } catch {}
              setClientLoggerUser(data.user);
            } else {
              // Received a non-JSON or malformed body from profile endpoint.
              // Don't aggressively remove the token; treat as transient and keep token until we get an explicit 401/403.
              clientLogger && clientLogger.warn && clientLogger.warn('Auth check: non-JSON or empty profile response', { status: response.status, ct: response.headers.get('content-type') });
              setToken(storedToken);
            }
          } else {
            // If backend explicitly reports unauthorized, remove token. Otherwise keep it (transient server errors shouldn't log the user out)
            if (response.status === 401 || response.status === 403) {
              localStorage.removeItem('authToken');
              localStorage.removeItem('authUser');
              setUser(null);
              setToken(null);
              setClientLoggerUser(null);
            } else {
              clientLogger && clientLogger.warn && clientLogger.warn('Auth check: non-ok profile response', { status: response.status });
              setToken(storedToken);
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // On unexpected errors (network, parse), do not aggressively remove the token to avoid logging users out on reload.
        // Keep token in storage; components can handle eventual failures when they make authenticated requests.
        // Optionally remove corrupted stored user
        try { localStorage.removeItem('authUser'); } catch {}
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Small helper shared inside the module to safely parse JSON only when content-type is JSON
  const safeParse = async (res) => {
    if (!res || !res.headers) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.toLowerCase().includes('application/json')) return null;
    try {
      return await res.json();
    } catch (e) {
      return null;
    }
  };

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
        return { success: false, error: 'Erreur réseau' };
      }

  const saltBody = await safeParse(saltResponse);
  const { salt } = saltBody || {};

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
        const data = await safeParse(response) || {};
        
        // Store auth data first
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('authUser', JSON.stringify(data.user));
        setUser(data.user);
        setToken(data.token);
        setClientLoggerUser(data.user);
        
        return { success: true, user: data.user };
      } else {
  const errorData = await safeParse(response) || {};
        // Prefer backend-provided message (now in French), fallback to generic French message
        return { success: false, error: errorData.error || 'Échec de la connexion' };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Erreur réseau' };
    }
  };

  const logout = () => {
    // Clear auth state
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    
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
        const data = await safeParse(response) || {};
        
        // Store auth data first
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('authUser', JSON.stringify(data.user));
        setUser(data.user);
        setToken(data.token);
        setClientLoggerUser(data.user);
        
        return { success: true, user: data.user };
      } else {
  const errorData = await safeParse(response) || {};
        return { success: false, error: errorData.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const changePassword = async (newPassword) => {
    try {
      const storedToken = localStorage.getItem('authToken');
      if (!storedToken) return { success: false, error: 'Not authenticated' };

      const salt = CryptoJS.lib.WordArray.random(128 / 8);
      const hashedPassword = CryptoJS.SHA256(newPassword + salt).toString();

      const res = await fetch(`${config.API_URL}/users/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
        },
        body: JSON.stringify({ password: hashedPassword, salt: salt.toString() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.error || 'Failed to change password' };
      }
      return { success: true };
    } catch (e) {
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
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
