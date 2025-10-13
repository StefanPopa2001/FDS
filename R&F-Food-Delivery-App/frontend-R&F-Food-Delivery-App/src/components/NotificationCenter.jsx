import React, { useState } from 'react';
import {
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Button,
  Divider,
  Chip,
  Paper,
  Alert
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Restaurant as RestaurantIcon,
  Chat as ChatIcon,
  Clear as ClearIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  NotificationsOff as NotificationsOffIcon
} from '@mui/icons-material';
import { useOrderNotifications } from '../hooks/useOrderNotifications';
import { safeNotification } from '../utils/safeNotification';

const NotificationCenter = ({ userId, orderId = null }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState(safeNotification.permission());
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    deleteNotification,
    clearNotifications, 
    markAllAsRead,
    refreshNotifications
  } = useOrderNotifications(userId, orderId);

  // Refresh notifications when component mounts and when userId changes
  React.useEffect(() => {
    if (userId) {
      refreshNotifications();
    }
  }, [userId, refreshNotifications]);

  // Refresh notifications when page becomes visible
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && userId) {
        refreshNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, refreshNotifications]);

  // Check notification permission periodically
  React.useEffect(() => {
    const checkPermission = () => {
      setBrowserNotificationPermission(safeNotification.permission());
    };
    
    checkPermission();
    const interval = setInterval(checkPermission, 5000);
    return () => clearInterval(interval);
  }, []);

  const requestNotificationPermission = async () => {
    if (safeNotification.permission() === 'default') {
      const permission = await safeNotification.requestPermission();
      setBrowserNotificationPermission(permission);
      if (permission === 'granted') {
        safeNotification.show('Notifications activées!', {
          body: 'Vous recevrez maintenant des notifications pour vos commandes',
          icon: '/favicon.ico'
        });
      }
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    // Refresh notifications when opening
    refreshNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const handleDeleteNotification = (e, notificationId) => {
    e.stopPropagation();
    deleteNotification(notificationId);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit'
      });
    }
  };

  const getIcon = (notification) => {
    if (notification.type === 'chat') {
      return <ChatIcon color="primary" />;
    }
    return <RestaurantIcon color="primary" />;
  };

  const getNotificationDetails = (notification) => {
    // Handle different notification data structures
    if (notification.data && typeof notification.data === 'object') {
      return {
        shopMessage: notification.data.notes,
        orderId: notification.data.orderId
      };
    }
    return {
      shopMessage: notification.shopMessage,
      orderId: notification.orderId
    };
  };

  return (
    <>
      <IconButton 
        onClick={handleClick}
        sx={{ 
          color: 'primary.main',
          position: 'relative'
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
        {/* Small indicator for browser notification status */}
        {browserNotificationPermission === 'granted' && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'success.main',
              border: '1px solid white'
            }}
          />
        )}
        {browserNotificationPermission === 'denied' && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'error.main',
              border: '1px solid white'
            }}
          />
        )}
      </IconButton>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Paper sx={{ width: 350, maxHeight: 500, overflow: 'auto' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton 
                  size="small" 
                  onClick={refreshNotifications}
                  title="Actualiser les notifications"
                >
                  <RefreshIcon />
                </IconButton>
                {unreadCount > 0 && (
                  <Button 
                    size="small" 
                    onClick={markAllAsRead}
                    startIcon={<MarkReadIcon />}
                    variant="outlined"
                  >
                    Tout lire
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button 
                    size="small" 
                    onClick={clearNotifications}
                    startIcon={<ClearIcon />}
                    color="error"
                    variant="outlined"
                  >
                    Effacer tout
                  </Button>
                )}
              </Box>
            </Box>
          </Box>

          {/* Browser notification permission alert */}
          {browserNotificationPermission === 'default' && (
            <Alert 
              severity="info" 
              sx={{ m: 2 }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={requestNotificationPermission}
                >
                  Activer
                </Button>
              }
            >
              Activez les notifications du navigateur pour être alerté même quand l'onglet n'est pas actif
            </Alert>
          )}
          {browserNotificationPermission === 'denied' && (
            <Alert 
              severity="warning" 
              sx={{ m: 2 }}
              icon={<NotificationsOffIcon />}
            >
              Les notifications du navigateur sont désactivées. Activez-les dans les paramètres de votre navigateur.
            </Alert>
          )}

          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Aucune notification
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notification, index) => {
                const details = getNotificationDetails(notification);
                return (
                  <React.Fragment key={notification.id}>
                    <ListItem
                      button
                      onClick={() => handleNotificationClick(notification)}
                      sx={{
                        backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                        '&:hover': {
                          backgroundColor: 'action.selected'
                        }
                      }}
                    >
                      <ListItemIcon>
                        {getIcon(notification)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2">
                                {notification.title}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {formatDate(notification.createdAt)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatTime(notification.createdAt)}
                                </Typography>
                              </Box>
                              {!notification.isRead && (
                                <Chip size="small" color="primary" label="Nouveau" />
                              )}
                              <IconButton 
                                size="small" 
                                onClick={(e) => handleDeleteNotification(e, notification.id)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {notification.message}
                            </Typography>
                            {details.shopMessage && (
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontStyle: 'italic',
                                  color: 'primary.main',
                                  backgroundColor: 'action.hover',
                                  p: 1,
                                  borderRadius: 1,
                                  mt: 1
                                }}
                              >
                                Message du restaurant: {details.shopMessage}
                              </Typography>
                            )}
                            {details.orderId && (
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ display: 'block', mt: 1 }}
                              >
                                Commande #{details.orderId}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < notifications.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Paper>
      </Popover>
    </>
  );
};

export default NotificationCenter;
