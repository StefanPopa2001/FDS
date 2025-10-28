import React, { useState, useRef } from 'react';
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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Restaurant as RestaurantIcon,
  Chat as ChatIcon,
  Clear as ClearIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  NotificationsOff as NotificationsOffIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useOrderNotifications } from '../hooks/useOrderNotifications';
import { safeNotification } from '../utils/safeNotification';
import config from '../config';
import { useAuth } from '../contexts/AuthContext';

const NotificationCenter = ({ userId, orderId = null }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState(safeNotification.permission());
  const { isAdmin } = useAuth();
  const lastSeenIdsRef = useRef(new Set());
  const [autoModal, setAutoModal] = useState({ open: false, notification: null, latestOrder: null });
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

  // Fetch the latest order for the logged-in client
  const fetchLatestOrder = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return null;
      const res = await fetch(`${config.API_URL}/users/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) return null;
      const ct = res.headers.get('content-type') || '';
      if (!ct.toLowerCase().includes('application/json')) return null;
      const data = await res.json();
      const orders = data?.orders || [];
      if (orders.length === 0) return null;
      // Sort by createdAt desc
      const latest = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      return latest || null;
    } catch (e) {
      console.error('Failed to fetch latest order', e);
      return null;
    }
  }, []);

  // Track new incoming notifications and auto-open modal for client
  React.useEffect(() => {
    // seed last seen ids on first run to avoid popping for historical notifications
    if (lastSeenIdsRef.current.size === 0 && notifications.length > 0) {
      notifications.forEach(n => lastSeenIdsRef.current.add(n.id));
      return; // don't process existing ones as new
    }

    if (isAdmin && isAdmin()) return; // only for normal clients

    const currentIds = new Set(notifications.map(n => n.id));
    const newOnes = notifications
      .filter(n => !lastSeenIdsRef.current.has(n.id))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // oldest first

    const process = async () => {
      for (const n of newOnes) {
        const type = n.type;
        const orderIdFromNotif = n?.data?.orderId || n.orderId;
        if (!orderIdFromNotif) continue;
        if (type !== 'chat' && type !== 'order_status') continue;
        const latest = await fetchLatestOrder();
        if (latest && latest.id === orderIdFromNotif) {
          setAutoModal({ open: true, notification: n, latestOrder: latest });
          // mark as read proactively
          if (!n.isRead) {
            markAsRead(n.id);
          }
          break; // show one at a time
        }
      }
      // update last seen ids after processing
      lastSeenIdsRef.current = currentIds;
    };

    if (newOnes.length > 0) {
      process();
    } else {
      // keep in sync even if no new ones (handles deletions)
      lastSeenIdsRef.current = currentIds;
    }
  }, [notifications, fetchLatestOrder, markAsRead, isAdmin]);

  const closeAutoModal = () => setAutoModal({ open: false, notification: null, latestOrder: null });

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
    // Navigate to order history with the specific order
    const details = getNotificationDetails(notification);
    if (details.orderId) {
      navigate(`/orders?orderId=${details.orderId}`);
      handleClose();
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

  const getStatusColor = (status) => {
    switch (status) {
      case 0: return 'warning';
      case 1: return 'info';
      case 2: return 'warning';
      case 3: return 'success';
      case 4: return 'primary';
      case 5:
      case 6: return 'success';
      case 7: return 'error';
      default: return 'default';
    }
  };

  return (
    <>
      {/* Auto popup modal for client notifications about latest order */}
      <Dialog
        open={autoModal.open}
        onClose={closeAutoModal}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          elevation: 24,
          sx: {
            borderRadius: isMobile ? 0 : 3,
            background: 'linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 152, 0, 0.2)'
          }
        }}
     >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff9800' }}>
              {autoModal.notification?.type === 'chat' ? 'Nouveau message du restaurant' : 'Statut de votre commande mis à jour'}
            </Typography>
            <IconButton size="small" onClick={closeAutoModal} sx={{ color: '#ff9800' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {autoModal.notification && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getIcon(autoModal.notification)}
                <Typography variant="body2" color="text.secondary">
                  {formatDate(autoModal.notification.createdAt)} à {formatTime(autoModal.notification.createdAt)}
                </Typography>
              </Box>

              {/* Message content for chat */}
              {autoModal.notification.type === 'chat' && (
                <Paper sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(255, 152, 0, 0.06)', border: '1px solid rgba(255,152,0,0.2)' }}>
                  <Typography variant="subtitle2" sx={{ color: 'primary.main', mb: 0.5, fontWeight: 700 }}>
                    Message du restaurant
                  </Typography>
                  <Typography variant="body1">
                    {getNotificationDetails(autoModal.notification).shopMessage || autoModal.notification.message}
                  </Typography>
                </Paper>
              )}

              {/* Status display (for status update or alongside chat) */}
              {(autoModal.notification.type === 'order_status' || autoModal.latestOrder) && (
                <Paper sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                        Commande #{getNotificationDetails(autoModal.notification).orderId || autoModal.latestOrder?.id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Statut actuel
                      </Typography>
                    </Box>
                    <Chip
                      label={autoModal.notification?.data?.statusText || autoModal.latestOrder?.statusText || 'Mis à jour'}
                      color={getStatusColor(autoModal.notification?.data?.status ?? autoModal.latestOrder?.status)}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                  {autoModal.notification?.data?.notes && (
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}>
                      Note: {autoModal.notification.data.notes}
                    </Typography>
                  )}
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          {autoModal.notification && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                const details = getNotificationDetails(autoModal.notification);
                if (details.orderId) {
                  navigate(`/orders?orderId=${details.orderId}`);
                } else if (autoModal.latestOrder?.id) {
                  navigate(`/orders?orderId=${autoModal.latestOrder.id}`);
                } else {
                  navigate('/orders');
                }
                closeAutoModal();
              }}
              fullWidth={isMobile}
            >
              Voir mes commandes
            </Button>
          )}
          <Button onClick={closeAutoModal} sx={{ ml: 'auto' }}>Fermer</Button>
        </DialogActions>
      </Dialog>
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

      <Dialog
        open={Boolean(anchorEl)}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          elevation: 24,
          sx: {
            borderRadius: isMobile ? 0 : 3,
            background: 'linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 152, 0, 0.2)',
            maxHeight: isMobile ? '100vh' : '80vh',
            height: isMobile ? '100vh' : 'auto',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            pb: 2,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#ff9800' }}>
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton 
                size="small" 
                onClick={refreshNotifications}
                title="Actualiser les notifications"
                sx={{ color: '#ff9800' }}
              >
                <RefreshIcon />
              </IconButton>
              {isMobile && (
                <IconButton 
                  size="small" 
                  onClick={handleClose}
                  title="Fermer"
                  sx={{ color: '#ff9800' }}
                >
                  <CloseIcon />
                </IconButton>
              )}
            </Box>
          </Box>
        </DialogTitle>

        {/* Action buttons under header */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          p: 2, 
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          backgroundColor: 'rgba(0,0,0,0.05)'
        }}>
          <Button 
            size="small" 
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            startIcon={<MarkReadIcon />}
            variant="outlined"
            sx={{
              flex: 1,
              borderColor: 'rgba(255, 152, 0, 0.5)',
              color: unreadCount === 0 ? 'text.disabled' : '#ff9800',
              '&:hover': {
                borderColor: unreadCount === 0 ? 'rgba(255, 152, 0, 0.3)' : '#ff9800',
                backgroundColor: unreadCount === 0 ? 'transparent' : 'rgba(255, 152, 0, 0.1)',
              },
              '&.Mui-disabled': {
                borderColor: 'rgba(255, 152, 0, 0.3)',
                color: 'text.disabled'
              }
            }}
          >
            Tout lire
          </Button>
          <Button 
            size="small" 
            onClick={clearNotifications}
            disabled={notifications.length === 0}
            startIcon={<ClearIcon />}
            color="error"
            variant="outlined"
            sx={{ 
              flex: 1,
              '&.Mui-disabled': {
                borderColor: 'rgba(244, 67, 54, 0.3)',
                color: 'text.disabled'
              }
            }}
          >
            Effacer tout
          </Button>
        </Box>

        <DialogContent 
          sx={{ 
            p: 0, 
            display: 'flex',
            flexDirection: 'column',
            height: isMobile ? 'calc(100vh - 180px)' : '60vh',
            overflow: 'hidden'
          }}
        >

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
                        },
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        py: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', width: '100%', mb: 1 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {getIcon(notification)}
                        </ListItemIcon>
                        <Box sx={{ flex: 1 }}>
                          {/* First line: time and hour */}
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            {formatDate(notification.createdAt)} à {formatTime(notification.createdAt)}
                          </Typography>
                          {/* Second line: notification title and message */}
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            {notification.title}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {notification.message}
                          </Typography>
                          {/* Last line: concerned command */}
                          {details.orderId && (
                            <Typography 
                              variant="caption" 
                              color="primary.main"
                              sx={{ display: 'block', fontWeight: 500 }}
                            >
                              Commande #{details.orderId}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
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
                      {details.shopMessage && (
                        <Box sx={{ width: '100%', pl: 6 }}>
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
                        </Box>
                      )}
                    </ListItem>
                    {index < notifications.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationCenter;
