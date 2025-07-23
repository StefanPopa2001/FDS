import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Card,
  CardContent,
  Divider,
  Badge,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingBag as ShoppingBagIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useBasket } from '../contexts/BasketContext';
import { useAuth } from '../contexts/AuthContext';
import OrderConfirmation from './OrderConfirmation';
import config from '../config.js';

const BasketItem = ({ item }) => {
  const { updateQuantity, removeFromBasket, getItemDisplayName, getItemDescription, calculateItemPrice } = useBasket();
  
  const handleQuantityChange = (newQuantity) => {
    if (newQuantity <= 0) {
      removeFromBasket(item.id);
    } else {
      updateQuantity(item.id, newQuantity);
    }
  };
  
  return (
    <Card
      sx={{
        mb: 2,
        background: 'linear-gradient(145deg, rgba(30, 30, 30, 0.9), rgba(25, 25, 25, 0.9))',
        border: '1px solid rgba(255, 152, 0, 0.2)',
        borderRadius: 2,
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#ff9800', mb: 0.5 }}>
              {getItemDisplayName(item)}
            </Typography>
            {getItemDescription(item) && (
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', mb: 1 }}>
                {getItemDescription(item)}
              </Typography>
            )}
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#ff9800' }}>
              €{calculateItemPrice(item).toFixed(2)}
            </Typography>
          </Box>
          <Tooltip title="Supprimer">
            <IconButton
              size="small"
              onClick={() => removeFromBasket(item.id)}
              sx={{
                color: '#f44336',
                '&:hover': {
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              sx={{
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 152, 0, 0.2)',
                },
              }}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
            
            <Typography
              sx={{
                minWidth: '40px',
                textAlign: 'center',
                fontWeight: 600,
                color: '#ff9800',
              }}
            >
              {item.quantity}
            </Typography>
            
            <IconButton
              size="small"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              sx={{
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 152, 0, 0.2)',
                },
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
          
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            €{(calculateItemPrice(item) / item.quantity).toFixed(2)} / unité
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const BasketDialog = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { items, totalPrice, totalItems, clearBasket, handleLogout } = useBasket();
  const { isLoggedIn } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  
  const handleOrder = () => {
    // Check if user is logged in
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    // Show order confirmation dialog
    setShowOrderConfirmation(true);
  };

  const handleOrderConfirm = async (orderData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Vous devez être connecté pour passer une commande');
        return;
      }

      // Prepare order data for backend
      const orderPayload = {
        items: items.map(item => ({
          platId: item.plat?.id,
          quantity: item.quantity,
          version: item.version?.size || item.version,
          sauceId: item.sauce?.id,
          extraId: item.extra?.id,
          platSauceId: item.platSauce?.id,
          addedExtras: item.extras?.map(e => e.id) || [],
          removedIngredients: item.removedIngredients?.map(r => r.id) || [],
          notes: item.notes
        })),
        deliveryAddress: {
          street: orderData.address?.street,
          city: orderData.address?.city,
          postalCode: orderData.address?.postalCode,
          country: orderData.address?.country || 'Belgium'
        },
        paymentMethod: orderData.paymentMethod,
        notes: orderData.notes
      };

      console.log('Sending order payload:', orderPayload);

      // Send order to backend
      const response = await fetch(`${config.API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création de la commande');
      }

      const result = await response.json();
      
      // Store user delivery details in localStorage for future orders
      const userDeliveryData = {
        address: {
          street: orderData.address?.street,
          city: orderData.address?.city,
          postalCode: orderData.address?.postalCode,
          country: orderData.address?.country || 'Belgium'
        },
        phone: orderData.phone,
        paymentMethod: orderData.paymentMethod,
        savedAt: new Date().toISOString()
      };
      
      localStorage.setItem('userDeliveryData', JSON.stringify(userDeliveryData));
      
      // Show success message
      alert(`Commande confirmée! Numéro de commande: #${result.order.id}`);
      
      // Clear basket and close dialogs
      clearBasket();
      setShowOrderConfirmation(false);
      onClose();
    } catch (error) {
      console.error('Error confirming order:', error);
      alert(`Erreur lors de la confirmation de la commande: ${error.message}`);
    }
  };

  const handleLoginRedirect = () => {
    setShowLoginPrompt(false);
    onClose();
    navigate('/login');
  };

  const handleLoginPromptClose = () => {
    setShowLoginPrompt(false);
  };

  const handleOrderConfirmationClose = () => {
    setShowOrderConfirmation(false);
  };
  
  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
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
          <ShoppingBagIcon sx={{ color: '#ff9800' }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#ff9800', flex: 1 }}>
            Mon Panier ({totalItems} article{totalItems > 1 ? 's' : ''})
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          {items.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 4,
                textAlign: 'center',
              }}
            >
              <ShoppingCartIcon
                sx={{
                  fontSize: 64,
                  color: 'text.secondary',
                  mb: 2,
                }}
              />
              <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                Votre panier est vide
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Ajoutez des articles depuis le menu pour commencer
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ mb: 3 }}>
                {items.map((item) => (
                  <BasketItem key={item.id} item={item} />
                ))}
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  backgroundColor: 'rgba(255, 152, 0, 0.1)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 152, 0, 0.3)',
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#ff9800' }}>
                  Total
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#ff9800' }}>
                  €{totalPrice.toFixed(2)}
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              borderColor: 'rgba(255, 152, 0, 0.5)',
              color: '#ff9800',
              '&:hover': {
                borderColor: '#ff9800',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
              },
            }}
          >
            Continuer le shopping
          </Button>
          
          {items.length > 0 && (
            <>
              <Button
                variant="outlined"
                onClick={clearBasket}
                sx={{
                  borderColor: 'rgba(244, 67, 54, 0.5)',
                  color: '#f44336',
                  '&:hover': {
                    borderColor: '#f44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  },
                }}
              >
                Vider le panier
              </Button>
              
              <Button
                variant="contained"
                onClick={handleOrder}
                sx={{
                  background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #f57c00 30%, #ff9800 90%)',
                  },
                  fontWeight: 600,
                  px: 4,
                }}
              >
                Commander
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Login Prompt Dialog */}
      <Dialog
        open={showLoginPrompt}
        onClose={handleLoginPromptClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          elevation: 24,
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 152, 0, 0.2)',
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
          <LoginIcon sx={{ color: '#ff9800' }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#ff9800', flex: 1 }}>
            Connexion requise
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 2,
              textAlign: 'center',
            }}
          >
            <ShoppingCartIcon
              sx={{
                fontSize: 64,
                color: '#ff9800',
                mb: 2,
              }}
            />
            <Typography variant="h6" sx={{ color: 'text.primary', mb: 2 }}>
              Vous devez être connecté pour passer commande
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Connectez-vous à votre compte pour finaliser votre commande et profiter d'une expérience personnalisée.
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                borderRadius: 2,
                border: '1px solid rgba(255, 152, 0, 0.3)',
                width: '100%',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#ff9800' }}>
                Total de votre panier
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ff9800' }}>
                €{totalPrice.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleLoginPromptClose}
            sx={{
              borderColor: 'rgba(255, 152, 0, 0.5)',
              color: '#ff9800',
              '&:hover': {
                borderColor: '#ff9800',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
              },
            }}
          >
            Annuler
          </Button>
          
          <Button
            variant="contained"
            onClick={handleLoginRedirect}
            startIcon={<LoginIcon />}
            sx={{
              background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #f57c00 30%, #ff9800 90%)',
              },
              fontWeight: 600,
              px: 4,
            }}
          >
            Se connecter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Confirmation Dialog */}
      <OrderConfirmation
        open={showOrderConfirmation}
        onClose={handleOrderConfirmationClose}
        onConfirm={handleOrderConfirm}
      />
    </>
  );
};

const BasketIcon = () => {
  const { totalItems, isOpen, toggleBasket } = useBasket();
  
  return (
    <Tooltip title="Mon Panier" arrow>
      <IconButton
        onClick={toggleBasket}
        sx={{
          color: '#ff9800',
          '&:hover': {
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            transform: 'scale(1.1)',
          },
        }}
      >
        <Badge badgeContent={totalItems} color="error" max={99}>
          <ShoppingCartIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

const Basket = () => {
  const { isOpen, toggleBasket } = useBasket();
  
  return (
    <>
      <BasketIcon />
      <BasketDialog open={isOpen} onClose={toggleBasket} />
    </>
  );
};

export default Basket;
