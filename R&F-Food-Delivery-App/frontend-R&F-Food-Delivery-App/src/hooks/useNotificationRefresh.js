import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';

// Hook to refresh notifications on route changes
export const useNotificationRefresh = () => {
  const location = useLocation();
  
  let refreshNotifications;
  try {
    const notifications = useNotifications();
    refreshNotifications = notifications.refreshNotifications;
  } catch (error) {
    // Context not available, skip notifications
    console.log('Notification context not available');
    return;
  }

  useEffect(() => {
    // Refresh notifications whenever the route changes
    if (refreshNotifications) {
      console.log('Route changed, refreshing notifications:', location.pathname);
      refreshNotifications();
    }
  }, [location.pathname, refreshNotifications]);

  // Also refresh on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (refreshNotifications) {
        console.log('Window focused, refreshing notifications');
        refreshNotifications();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshNotifications]);

  // Also refresh on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && refreshNotifications) {
        console.log('Page became visible, refreshing notifications');
        refreshNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshNotifications]);
};
