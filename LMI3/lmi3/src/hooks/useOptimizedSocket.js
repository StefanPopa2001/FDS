import { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import config from '../config';

// Singleton socket instance to prevent multiple connections
let socketInstance = null;
let listeners = new Map();

export const useOptimizedSocket = (token) => {
  const listenersRef = useRef(new Map());

  useEffect(() => {
    // Create socket only if it doesn't exist
    if (!socketInstance && token) {
      socketInstance = io(config.WS_URL, {
        path: config.WS_PATH,
        forceNew: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 5000,
        transports: ['websocket', 'polling'],
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected');
        socketInstance.emit('join-admin', { token });
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    }

    return () => {
      // Clean up listeners but keep socket alive for other components
      listenersRef.current.forEach((handler, event) => {
        if (socketInstance) {
          socketInstance.off(event, handler);
        }
      });
      listenersRef.current.clear();
    };
  }, [token]);

  const addListener = (event, handler) => {
    if (socketInstance && !listenersRef.current.has(event)) {
      socketInstance.on(event, handler);
      listenersRef.current.set(event, handler);
    }
  };

  const removeListener = (event) => {
    if (socketInstance && listenersRef.current.has(event)) {
      const handler = listenersRef.current.get(event);
      socketInstance.off(event, handler);
      listenersRef.current.delete(event);
    }
  };

  const emit = (event, data) => {
    if (socketInstance && socketInstance.connected) {
      socketInstance.emit(event, data);
    }
  };

  return {
    socket: socketInstance,
    addListener,
    removeListener,
    emit,
    connected: socketInstance?.connected || false,
  };
};

// Clean up socket on app unmount
export const cleanupSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    listeners.clear();
  }
};
