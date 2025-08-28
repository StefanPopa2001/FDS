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
  Paper
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Restaurant as RestaurantIcon,
  Chat as ChatIcon,
  Clear as ClearIcon,
  MarkEmailRead as MarkReadIcon
} from '@mui/icons-material';
import { useOrderNotifications } from '../hooks/useOrderNotifications';

const NotificationCenter = ({ userId, orderId = null }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    clearNotifications, 
    clearNotification 
  } = useOrderNotifications(userId, orderId);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIcon = (notification) => {
    if (notification.chatMessage) {
      return <ChatIcon color="primary" />;
    }
    return <RestaurantIcon color="primary" />;
  };

  return (
    <>
      <IconButton 
        onClick={handleClick}
        sx={{ color: 'primary.main' }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
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
                Notifications
              </Typography>
              {notifications.length > 0 && (
                <Button 
                  size="small" 
                  onClick={clearNotifications}
                  startIcon={<ClearIcon />}
                >
                  Tout effacer
                </Button>
              )}
            </Box>
          </Box>

          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Aucune notification
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    button
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      backgroundColor: notification.read ? 'transparent' : 'action.hover',
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2">
                            {notification.title}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatTime(notification.timestamp)}
                            </Typography>
                            {!notification.read && (
                              <Chip size="small" color="primary" label="Nouveau" />
                            )}
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                clearNotification(notification.id);
                              }}
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {notification.message}
                          </Typography>
                          {notification.shopMessage && (
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
                              Message du restaurant: {notification.shopMessage}
                            </Typography>
                          )}
                          {notification.chatMessage && (
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
                              {notification.chatMessage}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      </Popover>
    </>
  );
};

export default NotificationCenter;
