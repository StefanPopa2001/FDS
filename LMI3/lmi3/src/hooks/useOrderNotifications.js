import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import config from '../config';

export const useOrderNotifications = (userId, orderId = null) => {
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.preload = 'auto';

    // Connect to socket
    if (userId) {
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
        // Join order-specific room if orderId is provided
        if (orderId) {
          socketRef.current.emit('join-order-chat', { 
            orderId, 
            userId, 
            userType: 'client' 
          });
        }
      });

      // Listen for order status updates
      socketRef.current.on('order-status-update', (data) => {
        const { orderId: updateOrderId, status, statusText, message, timestamp } = data;
        
        // Create notification
        const notification = {
          id: Date.now(),
          orderId: updateOrderId,
          title: 'Mise à jour de commande',
          message: `Votre commande #${updateOrderId} est maintenant: ${statusText}`,
          shopMessage: message,
          timestamp: new Date(timestamp),
          read: false
        };

        setNotifications(prev => [notification, ...prev]);

        // Play audio notification
        if (audioRef.current) {
          audioRef.current.play().catch(e => 
            console.log('Audio play failed:', e)
          );
        }

        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: `order-${updateOrderId}`,
            renotify: true
          });
        }
      });

      // Listen for chat messages
      if (orderId) {
        socketRef.current.on(`chat-message`, (chatMessage) => {
          // Only show notification if the message is for this order and from the other party
          if (chatMessage.orderId === parseInt(orderId) && chatMessage.senderType === 'shop') {
            const notification = {
              id: Date.now(),
              orderId,
              title: 'Nouveau message',
              message: `Nouveau message pour votre commande #${orderId}`,
              chatMessage: chatMessage.message,
              timestamp: new Date(chatMessage.timestamp),
              read: false
            };

            setNotifications(prev => [notification, ...prev]);

            // Play audio notification
            if (audioRef.current) {
              audioRef.current.play().catch(e => 
                console.log('Audio play failed:', e)
              );
            }

            // Show browser notification
            if (Notification.permission === 'granted') {
              new Notification(notification.title, {
                body: chatMessage.message,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: `chat-${orderId}`,
                renotify: true
              });
            }
          }
        });
      }

      return () => {
        if (socketRef.current) {
          if (orderId) {
            socketRef.current.emit('leave-order-chat', { orderId });
          }
          socketRef.current.disconnect();
        }
      };
    }
  }, [userId, orderId]);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const clearNotification = (notificationId) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    );
  };

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markAsRead,
    clearNotifications,
    clearNotification,
    socket: socketRef.current
  };
};
