import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Avatar,
  Divider,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  Store as StoreIcon,
  Person as PersonIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNotification } from '../contexts/NotificationContext';
import config from '../config';

const OrderChat = ({ orderId, onClose, isOpen }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const { socket, joinOrderChat } = useNotification();

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Join the order chat room when component mounts
  useEffect(() => {
    if (isOpen && orderId) {
      joinOrderChat(orderId);
      fetchMessages();
    }
  }, [isOpen, orderId, joinOrderChat]);

  // Listen for new chat messages via WebSocket
  useEffect(() => {
    if (socket) {
      const handleNewMessage = (data) => {
        if (data.orderId === orderId) {
          setMessages(prev => [...prev, data.message]);
        }
      };

      socket.on('newChatMessage', handleNewMessage);
      
      return () => {
        socket.off('newChatMessage', handleNewMessage);
      };
    }
  }, [socket, orderId]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${config.API_URL}/orders/${orderId}/chat`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        console.error('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${config.API_URL}/orders/${orderId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: newMessage.trim()
        })
      });

      if (response.ok) {
        setNewMessage('');
        // Message will be added via WebSocket
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
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

  if (!isOpen) return null;

  return (
    <Card 
      sx={{ 
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 400,
        height: 500,
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        background: 'linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 152, 0, 0.3)',
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid rgba(255, 152, 0, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 152, 0, 0.1)'
      }}>
        <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 600 }}>
          Chat - Commande #{orderId}
        </Typography>
        <IconButton 
          size="small" 
          onClick={onClose}
          sx={{ color: '#ff9800' }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Messages */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        p: 1,
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(255, 152, 0, 0.1)',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255, 152, 0, 0.5)',
          borderRadius: '3px',
        },
      }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} sx={{ color: '#ff9800' }} />
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {messages.map((message, index) => (
              <ListItem 
                key={message.id || index} 
                sx={{ 
                  display: 'flex',
                  flexDirection: message.isFromShop ? 'row' : 'row-reverse',
                  alignItems: 'flex-start',
                  px: 1,
                  py: 1
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: message.isFromShop ? 'flex-start' : 'flex-end',
                  maxWidth: '75%'
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: 1,
                    mb: 0.5
                  }}>
                    <Avatar 
                      sx={{ 
                        width: 24, 
                        height: 24,
                        backgroundColor: message.isFromShop ? '#ff9800' : '#4caf50'
                      }}
                    >
                      {message.isFromShop ? <StoreIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
                    </Avatar>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {message.isFromShop ? 'Restaurant' : 'Vous'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {formatTime(message.timestamp)}
                    </Typography>
                  </Box>
                  
                  <Paper sx={{ 
                    p: 1.5,
                    backgroundColor: message.isFromShop 
                      ? 'rgba(255, 152, 0, 0.15)' 
                      : 'rgba(76, 175, 80, 0.15)',
                    border: `1px solid ${message.isFromShop 
                      ? 'rgba(255, 152, 0, 0.3)' 
                      : 'rgba(76, 175, 80, 0.3)'}`,
                    borderRadius: 2,
                    maxWidth: '100%'
                  }}>
                    <Typography variant="body2" sx={{ 
                      color: 'text.primary',
                      wordBreak: 'break-word'
                    }}>
                      {message.message}
                    </Typography>
                  </Paper>
                </Box>
              </ListItem>
            ))}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>

      {/* Message Input */}
      <Box sx={{ 
        p: 2, 
        borderTop: '1px solid rgba(255, 152, 0, 0.3)',
        backgroundColor: 'rgba(255, 152, 0, 0.05)'
      }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="Tapez votre message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 152, 0, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 152, 0, 0.7)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#ff9800',
                },
              },
            }}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending}
            sx={{
              minWidth: 'auto',
              px: 2,
              backgroundColor: '#ff9800',
              '&:hover': {
                backgroundColor: '#f57c00',
              },
              '&:disabled': {
                backgroundColor: 'rgba(255, 152, 0, 0.3)',
              }
            }}
          >
            {isSending ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : (
              <SendIcon />
            )}
          </Button>
        </Box>
      </Box>
    </Card>
  );
};

export default OrderChat;