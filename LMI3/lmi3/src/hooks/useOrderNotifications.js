import { useEffect, useRef, useState, useCallback } from 'react';
import config from '../config';
import { safeNotification } from '../utils/safeNotification';
import { playNotificationSound, primeNotificationSound } from '../utils/notificationSound';

export const useOrderNotifications = (userId, orderId = null) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const audioRef = useRef(null); // legacy ref (can remove later)
  const pollingIntervalRef = useRef(null);

  // Function to show browser notification
  const showBrowserNotification = useCallback((notification) => {
  if (safeNotification.permission() === 'granted') {
      try {
        // Customize notification based on type and status
        let title = notification.title;
        let body = notification.message;
        let icon = '/favicon.ico';
        
        if (notification.type === 'order_status' && notification.data) {
          const { status, statusText, notes, orderTotal, orderType } = notification.data;
          
          // Customize title and body based on status
          switch (status) {
            case 1: // Confirmée
              title = '✅ Commande confirmée!';
              body = `Votre commande #${notification.data.orderId} a été confirmée${orderTotal ? ` (${orderTotal.toFixed(2)}€)` : ''}`;
              break;
            case 2: // En préparation
              title = '👨‍🍳 Commande en préparation';
              body = `Votre commande #${notification.data.orderId} est en cours de préparation`;
              break;
            case 3: // Prête
              title = '🍽️ Commande prête!';
              body = `Votre commande #${notification.data.orderId} est prête ${orderType === 'takeout' ? 'à récupérer' : 'pour la livraison'}`;
              break;
            case 4: // En livraison
              title = '🚗 Commande en livraison';
              body = `Votre commande #${notification.data.orderId} est en cours de livraison`;
              break;
            case 5: // Livrée
              title = '📦 Commande livrée!';
              body = `Votre commande #${notification.data.orderId} a été livrée. Bon appétit!`;
              break;
            case 6: // Terminée
              title = '✅ Commande terminée';
              body = `Votre commande #${notification.data.orderId} est terminée. Merci!`;
              break;
            case 7: // Annulée
              title = '❌ Commande annulée';
              body = `Votre commande #${notification.data.orderId} a été annulée`;
              break;
            default:
              title = notification.title;
              body = notification.message;
          }
          
          // Add restaurant notes if available
          if (notes) {
            body += `\n💬 ${notes}`;
          }
        } else if (notification.type === 'chat') {
          title = '💬 Nouveau message';
          icon = '/favicon.ico';
        }

        const browserNotif = safeNotification.show(title, {
          body: body,
          icon: icon,
          badge: '/favicon.ico',
          tag: `notification-${notification.id}`,
          renotify: true,
          requireInteraction: notification.type === 'order_status' && [3, 5].includes(notification.data?.status), // Keep visible for ready/delivered orders
          silent: false,
          data: {
            notificationId: notification.id,
            orderId: notification.data?.orderId,
            type: notification.type
          }
        });

        // Auto-close after different times based on importance
        const autoCloseTime = notification.type === 'order_status' && [3, 5].includes(notification.data?.status) 
          ? 15000 // 15 seconds for important statuses (ready, delivered)
          : 8000;  // 8 seconds for others

        if (browserNotif) {
          setTimeout(() => {
            browserNotif.close();
          }, autoCloseTime);
        }

        // Handle clicks on the notification
        if (browserNotif) {
          browserNotif.onclick = () => {
            window.focus(); // Focus the window
            browserNotif.close();
            if (notification.data && notification.data.orderId) {
              console.log('Notification clicked for order:', notification.data.orderId);
              window.location.hash = '#/orders';
            }
          };
        }

        console.log('Browser notification shown:', title);
      } catch (error) {
        console.error('Error showing browser notification:', error);
      }
    } else {
      console.log('Cannot show browser notification - permission:', safeNotification.permission());
    }
  }, []);

  // Fetch notifications from server
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      console.log('fetchNotifications: No userId provided');
      return;
    }
    
    console.log('fetchNotifications: Starting fetch for user', userId);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('fetchNotifications: No auth token found');
        return;
      }

      console.log('fetchNotifications: Making API request...');
      const response = await fetch(`${config.API_URL}/notifications?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('fetchNotifications: Received data:', data);
        
        // Get current notifications for comparison
        setNotifications(currentNotifications => {
          // Check for new notifications compared to current state
          const currentNotificationIds = new Set(currentNotifications.map(n => n.id));
          const newNotifications = data.notifications.filter(n => !currentNotificationIds.has(n.id));
          
          // Show browser notifications for new notifications (only if they're unread and recent)
          if (newNotifications.length > 0) {
            const recentThreshold = Date.now() - (5 * 60 * 1000); // 5 minutes ago
            newNotifications.forEach(notification => {
              const notificationTime = new Date(notification.createdAt).getTime();
              if (!notification.isRead && notificationTime > recentThreshold) {
                console.log('Showing browser notification for new notification:', notification.title);
                showBrowserNotification(notification);
                
                // Play audio for new notifications
                playNotificationSound();
              }
            });
          }
          
          return data.notifications || [];
        });
        
        // Update unread count
        const unread = data.notifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
        console.log('fetchNotifications: Updated notifications count:', data.notifications.length, 'unread:', unread);
      } else {
        console.log('fetchNotifications: API request failed with status:', response.status);
      }
    } catch (error) {
      console.error('fetchNotifications: Error:', error);
    }
  }, [userId, showBrowserNotification]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${config.API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${config.API_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => {
          const notification = prev.find(n => n.id === notificationId);
          const newNotifications = prev.filter(notif => notif.id !== notificationId);
          
          // Update unread count if notification was unread
          if (notification && !notification.isRead) {
            setUnreadCount(prevCount => Math.max(0, prevCount - 1));
          }
          
          return newNotifications;
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${config.API_URL}/notifications`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${config.API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  useEffect(() => {
    // Initialize audio
  // prime sound in case user interacts later (additional auto-prime also in utility)
  primeNotificationSound();

    // Fetch initial notifications
    if (userId) {
      fetchNotifications();
    }

    // Set up periodic refresh every 30 seconds
    const startPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      pollingIntervalRef.current = setInterval(() => {
        if (userId) {
          console.log('Polling notifications...');
          fetchNotifications();
        }
      }, 30000); // 30 seconds
    };

    // Start polling if user is logged in
    if (userId) {
      startPolling();
    }

    // Cleanup interval on unmount or userId change
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [userId, fetchNotifications]);

  // Refresh notifications when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && userId) {
        console.log('Page became visible, refreshing notifications');
        fetchNotifications();
      }
    };

    const handleFocus = () => {
      if (userId) {
        console.log('Window focused, refreshing notifications');
        fetchNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [userId, fetchNotifications]);

  // Request notification permission and setup
  useEffect(() => {
    const requestNotificationPermission = async () => {
      if ('Notification' in window) {
        if (Notification.permission === 'default') {
          console.log('Requesting notification permission...');
          const permission = await Notification.requestPermission();
          console.log('Notification permission:', permission);
        } else {
          console.log('Current notification permission:', Notification.permission);
        }
      } else {
        console.log('Browser does not support notifications');
      }
    };

    requestNotificationPermission();
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    deleteNotification,
    clearNotifications,
    markAllAsRead,
    refreshNotifications: fetchNotifications
  };
};
