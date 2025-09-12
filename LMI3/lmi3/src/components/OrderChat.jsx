import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
  IconButton,
  Chip,
  Divider
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  Store as StoreIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import config from '../config';

const OrderChat = ({ open, onClose, orderId, userId, userType = 'client' }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (open && orderId && userId) {
      // Load initial messages
      fetchMessages();

      // Set up polling for new messages every 5 seconds when chat is open
      const startPolling = () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        
        pollingIntervalRef.current = setInterval(() => {
          console.log('Polling chat messages...');
          fetchMessages();
        }, 5000); // 5 seconds for more responsive chat
      };

      startPolling();

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [open, orderId, userId, userType]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${config.API_URL}/orders/${orderId}/chat`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      if (response.ok) {
        const fetchedMessages = await response.json();
        setMessages(prev => {
          // Only update if there are changes to avoid unnecessary re-renders
          if (JSON.stringify(prev) !== JSON.stringify(fetchedMessages)) {
            return fetchedMessages;
          }
          return prev;
        });
      } else {
        const error = await response.json();
        console.error('Error fetching messages:', error);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageToSend = newMessage.trim();
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const tempMessage = {
      id: tempId,
      message: messageToSend,
      senderId: userId,
      senderType: userType,
      timestamp: new Date().toISOString(),
      sender: { name: userType === 'shop' ? 'Restaurant' : 'You' },
      isTemporary: true
    };

    // Add message to UI immediately for instant feedback
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${config.API_URL}/orders/${orderId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: messageToSend,
          senderId: userId,
          senderType: userType
        })
      });

      if (response.ok) {
        const sentMessage = await response.json();
        console.log('Message sent successfully:', sentMessage);
        // Replace the temporary message with the real message immediately
        setMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { ...sentMessage, sender: { name: sentMessage.senderType === 'shop' ? 'Restaurant' : 'You' } }
            : msg
        ));
        // Refresh messages to get any new ones
        setTimeout(() => fetchMessages(), 1000);
      } else {
        // Remove the temporary message if sending failed
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        setNewMessage(messageToSend);
        const error = await response.json();
        console.error('Error sending message:', error);
      }
    } catch (error) {
      // Remove the temporary message if sending failed
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setNewMessage(messageToSend);
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          height: '600px',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Typography variant="h6">
          Chat - Commande #{orderId}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        p: 0
      }}>
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto',
          p: 1
        }}>
          {messages.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              flexDirection: 'column',
              color: 'text.secondary'
            }}>
              <Typography>Aucun message pour le moment</Typography>
              <Typography variant="caption">
                Commencez la conversation avec le restaurant
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {messages.map((message) => (
                <ListItem
                  key={message.id}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: message.senderType === userType ? 'flex-end' : 'flex-start',
                    px: 1,
                    py: 0.5
                  }}
                >
                  <Paper
                    sx={{
                      p: 1.5,
                      maxWidth: '80%',
                      backgroundColor: message.senderType === userType 
                        ? 'primary.main' 
                        : 'background.paper',
                      color: message.senderType === userType 
                        ? 'primary.contrastText' 
                        : 'text.primary',
                      borderRadius: 2,
                      position: 'relative'
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      mb: 0.5 
                    }}>
                      {message.senderType === 'shop' ? (
                        <StoreIcon fontSize="small" />
                      ) : (
                        <PersonIcon fontSize="small" />
                      )}
                      <Chip 
                        label={message.senderType === 'shop' ? 'Restaurant' : 'Client'}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          height: 20,
                          '& .MuiChip-label': { fontSize: '0.75rem' }
                        }}
                      />
                      <Typography variant="caption">
                        {formatTime(message.timestamp)}
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      {message.message}
                    </Typography>
                  </Paper>
                </ListItem>
              ))}
              <div ref={messagesEndRef} />
            </List>
          )}
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, flexDirection: 'column', gap: 1 }}>
        <Box sx={{ 
          display: 'flex', 
          width: '100%', 
          gap: 1 
        }}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="Tapez votre message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="outlined"
            size="small"
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            <SendIcon />
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default OrderChat;
