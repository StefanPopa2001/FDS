import React, { createContext, useContext, useCallback } from 'react';
import { useOrderNotifications } from '../hooks/useOrderNotifications';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  // use the correct user id field from AuthContext
  const notifications = useOrderNotifications(user?.id);

  const refreshNotifications = useCallback(() => {
    if (notifications.refreshNotifications && user?.id) {
      console.log('Refreshing notifications for user:', user.id);
      notifications.refreshNotifications();
    }
  }, [notifications.refreshNotifications, user?.id]);

  const value = {
    ...notifications,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
