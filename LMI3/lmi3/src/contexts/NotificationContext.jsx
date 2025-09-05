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
  const notifications = useOrderNotifications(user?.userId);

  const refreshNotifications = useCallback(() => {
    if (notifications.refreshNotifications && user?.userId) {
      console.log('Refreshing notifications for user:', user.userId);
      notifications.refreshNotifications();
    }
  }, [notifications.refreshNotifications, user?.userId]);

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
