import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import config from '../config';

export const useOrderNotifications = (userId, orderId = null) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);
  const audioRef = useRef(null);

  // Function to show browser notification
  const showBrowserNotification = useCallback((notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
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

        const browserNotif = new Notification(title, {
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

        setTimeout(() => {
          browserNotif.close();
        }, autoCloseTime);

        // Handle clicks on the notification
        browserNotif.onclick = () => {
          window.focus(); // Focus the window
          browserNotif.close();
          
          // Navigate to order history if it's an order notification
          if (notification.data && notification.data.orderId) {
            console.log('Notification clicked for order:', notification.data.orderId);
            // Optional: you could use react-router's navigate here if available
            window.location.hash = '#/orders';
          }
        };

        console.log('Browser notification shown:', title);
      } catch (error) {
        console.error('Error showing browser notification:', error);
      }
    } else {
      console.log('Cannot show browser notification - permission:', Notification.permission);
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
                if (audioRef.current) {
                  audioRef.current.play().catch(e => 
                    console.log('Audio play failed:', e)
                  );
                }
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
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.preload = 'auto';

    // Fetch initial notifications
    fetchNotifications();

    // Set up periodic refresh every 30 seconds
    const intervalId = setInterval(() => {
      if (userId) {
        fetchNotifications();
      }
    }, 30000);

    // Connect to socket
    if (userId) {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      socketRef.current = io(config.WS_URL, {
        path: config.WS_PATH,
        forceNew: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 5000,
        transports: ['websocket', 'polling'],
      });

      socketRef.current.on('connect', () => {
        console.log('Client socket connected for notifications');
        
        // Join as client to receive notifications
        socketRef.current.emit('join-client', { token });
        
        // Join order-specific room if orderId is provided
        if (orderId) {
          socketRef.current.emit('join-order-chat', { 
            orderId, 
            userId, 
            userType: 'client' 
          });
        }
      });

      // Listen for new notifications from server
      socketRef.current.on('new-notification', (notification) => {
        console.log('New notification received via websocket:', notification);
        setNotifications(prev => [notification, ...prev]);
        
        if (!notification.isRead) {
          setUnreadCount(prev => prev + 1);
        }

        // Play audio notification
        if (audioRef.current) {
          audioRef.current.play().catch(e => 
            console.log('Audio play failed:', e)
          );
        }

        // Show browser notification
        showBrowserNotification(notification);
      });

      // Listen for order status updates (legacy support)
      socketRef.current.on('order-status-update', (data) => {
        const { orderId: updateOrderId, status, statusText, message, timestamp } = data;
        
        // This will be handled by the new notification system
        // but we keep it for backwards compatibility
        console.log('Order status update received:', data);
        
        // Also refresh notifications to make sure we have the latest
        setTimeout(() => fetchNotifications(), 1000);
      });

      // Listen for chat messages
      if (orderId) {
        socketRef.current.on(`chat-message`, (chatMessage) => {
          // Only show notification if the message is for this order and from the other party
          if (chatMessage.orderId === parseInt(orderId) && chatMessage.senderType === 'shop') {
            // Chat notifications are now handled by the backend notification system
            console.log('Chat message received:', chatMessage);
            
            // Refresh notifications to get the new chat notification
            setTimeout(() => fetchNotifications(), 1000);
          }
        });
      }

      return () => {
        clearInterval(intervalId);
        if (socketRef.current) {
          if (orderId) {
            socketRef.current.emit('leave-order-chat', { orderId });
          }
          socketRef.current.disconnect();
        }
      };
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [userId, orderId, fetchNotifications]);

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
    refreshNotifications: fetchNotifications,
    socket: socketRef.current
  };
};
