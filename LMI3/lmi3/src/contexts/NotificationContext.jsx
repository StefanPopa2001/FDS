import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { Snackbar, Alert, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import config from '../config';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [currentNotification, setCurrentNotification] = useState(null);
  const audioRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user.userId) {
      const socketConnection = io(config.API_URL, {
        auth: {
          token: token
        }
      });

      // Join user-specific room for notifications
      socketConnection.emit('join-user', {
        token: token,
        userId: user.userId
      });

      // Listen for order status updates
      socketConnection.on('orderStatusUpdate', (data) => {
        addNotification({
          id: Date.now(),
          type: 'info',
          title: 'Mise à jour de commande',
          message: `Votre commande #${data.orderId} est maintenant: ${data.statusText}`,
          duration: 8000
        });
      });

      // Listen for visual/audio notifications
      socketConnection.on('orderNotification', (data) => {
        if (data.playSound) {
          playNotificationSound();
        }
        
        addNotification({
          id: Date.now(),
          type: 'success',
          title: data.title,
          message: data.message,
          duration: 8000
        });
      });

      // Listen for new chat messages
      socketConnection.on('newChatMessage', (data) => {
        if (data.isFromShop) {
          addNotification({
            id: Date.now(),
            type: 'info',
            title: 'Nouveau message du restaurant',
            message: `Commande #${data.orderId}: ${data.message.message.substring(0, 50)}...`,
            duration: 6000
          });
          playNotificationSound();
        }
      });

      socketConnection.on('connect', () => {
        console.log('Connected to notification server');
      });

      socketConnection.on('disconnect', () => {
        console.log('Disconnected from notification server');
      });

      setSocket(socketConnection);

      return () => {
        socketConnection.disconnect();
      };
    }
  }, []);

  // Initialize notification sound
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiRy/LNeSsFJHfE8d2QQQARX7Tq66hVFApGnt7wvmMcBjiP1/LPciwFJH')
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  const addNotification = (notification) => {
    setNotifications(prev => [...prev, notification]);
    setCurrentNotification(notification);

    // Auto remove notification after duration
    setTimeout(() => {
      removeNotification(notification.id);
    }, notification.duration || 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setCurrentNotification(null);
  };

  const joinOrderChat = (orderId) => {
    if (socket) {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      socket.emit('join-order-chat', {
        token: token,
        orderId: orderId,
        userId: user.userId
      });
    }
  };

  const value = {
    socket,
    notifications,
    addNotification,
    removeNotification,
    joinOrderChat,
    playNotificationSound
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Notification Display */}
      <Snackbar
        open={!!currentNotification}
        onClose={() => setCurrentNotification(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 8 }}
      >
        {currentNotification && (
          <Alert
            severity={currentNotification.type}
            action={
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={() => setCurrentNotification(null)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
            sx={{ width: '100%' }}
          >
            <strong>{currentNotification.title}</strong><br />
            {currentNotification.message}
          </Alert>
        )}
      </Snackbar>
    </NotificationContext.Provider>
  );
};