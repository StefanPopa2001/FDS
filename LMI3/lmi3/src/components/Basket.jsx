import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Divider,
  Badge,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Alert,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingBag as ShoppingBagIcon,
  Login as LoginIcon,
  LocalShipping as DeliveryIcon,
  Store as PickupIcon,
  Close as CloseIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  Money as CashIcon,
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
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 5px 10px rgba(0,0,0,0.2)',
          border: '1px solid rgba(255, 152, 0, 0.4)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#ff9800', mb: 0.5 }}>
              {getItemDisplayName(item)}
            </Typography>
            {getItemDescription(item) && (
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 1 }}>
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
                  backgroundColor: 'rgba(244, 67, 54, 0.2)',
                  transform: 'scale(1.1)',
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
  const [showTakeoutModal, setShowTakeoutModal] = useState(false);
  const [settings, setSettings] = useState({});

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${config.API_URL}/settings`);
        if (response.ok) {
          const data = await response.json();
          const settingsMap = {};
          data.forEach(setting => {
            settingsMap[setting.key] = setting.value;
          });
          setSettings(settingsMap);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };
    if (open) { // Only fetch when dialog is open
      fetchSettings();
    }
  }, [open]);
  
  const handleDelivery = () => {
    if (settings.enableOnlineDelivery === "false") {
      return; // Button is disabled, no action needed
    }
    // Delivery functionality - currently disabled even when setting is enabled
    alert('La livraison arrive bientôt !');
  };

  const handleTakeout = () => {
    if (settings.enableOnlinePickup === "false") {
      return; // Button is disabled, no action needed
    }
    
    // Check if user is logged in
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    // Show takeout modal
    setShowTakeoutModal(true);
  };

  const handleTakeoutConfirm = async (takeoutData) => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('Retrieved token from localStorage:', token ? 'Token exists' : 'No token found');
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
        OrderType: 'takeout',
        takeoutTime: takeoutData.takeoutTime,
        paymentMethod: takeoutData.paymentMethod,
        notes: takeoutData.notes
      };

      console.log('Sending takeout order payload:', orderPayload);
      console.log('Authorization header:', `Bearer ${token}`);

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
      
      // Show success message
      alert(`Commande confirmée pour emporter! Numéro de commande: #${result.order.id}`);
      
      // Clear basket and close dialogs
      clearBasket();
      setShowTakeoutModal(false);
      onClose();
    } catch (error) {
      console.error('Error confirming takeout order:', error);
      alert(`Erreur lors de la confirmation de la commande: ${error.message}`);
    }
  };

  const handleOrderConfirm = async (orderData) => {
    try {
      const token = localStorage.getItem('authToken');
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
        
        <DialogContent 
          sx={{ 
            p: 0, 
            display: 'flex',
            flexDirection: 'column',
            height: isMobile ? 'calc(100vh - 180px)' : '60vh', // Fixed height
            overflow: 'hidden' // Hide overflow for parent container
          }}
        >
          {items.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 6,
                px: 3,
                textAlign: 'center',
                height: '100%',
                justifyContent: 'center',
              }}
            >
              <ShoppingCartIcon
                sx={{
                  fontSize: 80,
                  color: 'text.secondary',
                  mb: 3,
                }}
              />
              <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
                Votre panier est vide
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Ajoutez des articles depuis le menu pour commencer
              </Typography>
            </Box>
          ) : (
            <>
              {/* Scrollable area for basket items */}
              <Box 
                sx={{ 
                  flex: 1,
                  overflow: 'auto',
                  p: 3,
                  pt: 2,
                  pb: 0,
                }}
              >
                {items.map((item) => (
                  <BasketItem key={item.id} item={item} />
                ))}
              </Box>
              
              {/* Fixed footer with total */}
              <Box sx={{ p: 3, pt: 2 }}>
                <Divider sx={{ mb: 2, borderColor: 'rgba(255, 152, 0, 0.2)' }} />
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
              </Box>
            </>
          )}
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 3, 
          pt: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          {/* First row of buttons */}
          <Box sx={{ 
            display: 'flex', 
            width: '100%', 
            gap: 2,
            justifyContent: items.length > 0 ? 'space-between' : 'center'
          }}>
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
                flex: items.length > 0 ? 1 : 'none',
                minWidth: '180px',
              }}
            >
              Continuer le shopping
            </Button>
            
            {items.length > 0 && (
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
                  flex: 1,
                }}
              >
                Vider le panier
              </Button>
            )}
          </Box>
          
          {items.length > 0 && (
            <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
              <Button
                variant="outlined"
                onClick={handleDelivery}
                disabled={settings.enableOnlineDelivery === "false"}
                sx={{
                  borderColor: settings.enableOnlineDelivery === "false" 
                    ? 'rgba(128, 128, 128, 0.3)'
                    : 'rgba(255, 152, 0, 0.5)',
                  color: settings.enableOnlineDelivery === "false" 
                    ? '#888'
                    : '#ff9800',
                  cursor: settings.enableOnlineDelivery === "false" 
                    ? 'not-allowed'
                    : 'pointer',
                  '&:hover': {
                    borderColor: settings.enableOnlineDelivery === "false" 
                      ? 'rgba(128, 128, 128, 0.3)'
                      : '#ff9800',
                    backgroundColor: settings.enableOnlineDelivery === "false" 
                      ? 'transparent'
                      : 'rgba(255, 152, 0, 0.1)',
                  },
                  fontWeight: 600,
                  px: 3,
                  flex: 1,
                }}
                startIcon={<DeliveryIcon />}
              >
                {settings.enableOnlineDelivery === "false" 
                  ? "Livraison Désactivée"
                  : "Livraison (Bientôt)"
                }
              </Button>
              
              <Button
                variant="contained"
                onClick={handleTakeout}
                disabled={settings.enableOnlinePickup === "false"}
                sx={{
                  background: settings.enableOnlinePickup === "false"
                    ? 'rgba(128, 128, 128, 0.3)'
                    : 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
                  '&:hover': {
                    background: settings.enableOnlinePickup === "false"
                      ? 'rgba(128, 128, 128, 0.3)'
                      : 'linear-gradient(45deg, #f57c00 30%, #ff9800 90%)',
                  },
                  color: settings.enableOnlinePickup === "false" ? '#666' : 'white',
                  cursor: settings.enableOnlinePickup === "false" ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  px: 3,
                  flex: 1,
                }}
                startIcon={<PickupIcon />}
              >
                {settings.enableOnlinePickup === "false" 
                  ? "À Emporter Désactivé"
                  : "À Emporter"
                }
              </Button>
            </Box>
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

      {/* Takeout Modal */}
      <TakeoutModal
        open={showTakeoutModal}
        onClose={() => setShowTakeoutModal(false)}
        onConfirm={handleTakeoutConfirm}
        items={items}
        totalPrice={totalPrice}
      />
    </>
  );
};

// Takeout Modal Component
const TakeoutModal = ({ open, onClose, onConfirm, items, totalPrice }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { getItemDisplayName, getItemDescription, calculateItemPrice } = useBasket();
  
  const [takeoutData, setTakeoutData] = useState({
    takeoutTime: '',
    paymentMethod: 'cash',
    notes: ''
  });

  // Generate time slots from 18:00 to 21:00 (every 15 minutes) + ASAP option
  const generateTimeSlots = () => {
    const slots = [];
    
    // Add ASAP option first
    slots.push({
      value: null, // null value means ASAP
      label: 'Dès que possible',
      isAsap: true
    });
    
    const start = 18; // 18:00
    const end = 21; // 21:00
    
    for (let hour = start; hour <= end; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        if (hour === end && minute > 0) break; // Stop at 21:00
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Create a date object for today with this time
        const today = new Date();
        const slotDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute);
        
        slots.push({
          value: slotDate.toISOString(),
          label: timeString,
          isAsap: false
        });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleSubmit = () => {
    // Allow takeoutTime to be null (ASAP) or a valid time
    if (takeoutData.takeoutTime === '') {
      alert('Veuillez sélectionner une heure de retrait ou choisir ASAP');
      return;
    }
    
    onConfirm(takeoutData);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
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
        <PickupIcon sx={{ color: '#ff9800' }} />
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#ff9800', flex: 1 }}>
          Commande à Emporter
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {/* Order Summary */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#ff9800', fontWeight: 600 }}>
            Récapitulatif de votre commande
          </Typography>
          {items.map((item, index) => (
            <Card
              key={index}
              sx={{
                mb: 1,
                background: 'rgba(30, 30, 30, 0.6)',
                border: '1px solid rgba(255, 152, 0, 0.1)',
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {getItemDisplayName(item)} x{item.quantity}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {getItemDescription(item)}
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 600 }}>
                    €{(calculateItemPrice(item) * item.quantity).toFixed(2)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
          
          <Divider sx={{ my: 2, borderColor: 'rgba(255, 152, 0, 0.3)' }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff9800' }}>
              Total
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#ff9800' }}>
              €{totalPrice.toFixed(2)}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3, borderColor: 'rgba(255, 152, 0, 0.3)' }} />

        {/* Takeout Time Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#ff9800', fontWeight: 600 }}>
            Heure de retrait
          </Typography>
          <FormControl fullWidth>
            <FormLabel sx={{ color: 'text.primary', mb: 1 }}>
              Choisissez votre heure de retrait (Dès que possible ou 18h00 - 21h00)
            </FormLabel>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 1, mt: 1 }}>
              {timeSlots.map((slot) => (
                <Button
                  key={slot.value || 'asap'}
                  variant={takeoutData.takeoutTime === slot.value ? 'contained' : 'outlined'}
                  onClick={() => setTakeoutData(prev => ({ ...prev, takeoutTime: slot.value }))}
                  sx={{
                    borderColor: takeoutData.takeoutTime === slot.value ? '#ff9800' : 'rgba(255, 152, 0, 0.3)',
                    color: takeoutData.takeoutTime === slot.value ? '#fff' : '#ff9800',
                    backgroundColor: takeoutData.takeoutTime === slot.value ? '#ff9800' : 'transparent',
                    '&:hover': {
                      backgroundColor: takeoutData.takeoutTime === slot.value ? '#f57c00' : 'rgba(255, 152, 0, 0.1)',
                      borderColor: '#ff9800',
                    },
                    minHeight: '40px',
                    maxHeight: '40px',
                    fontSize: '0.75rem',
                    fontWeight: slot.isAsap ? 600 : 400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    // Make ASAP button use normal styling but with green color
                    ...(slot.isAsap && {
                      backgroundColor: takeoutData.takeoutTime === slot.value ? '#4caf50' : 'rgba(76, 175, 80, 0.1)',
                      borderColor: takeoutData.takeoutTime === slot.value ? '#4caf50' : 'rgba(76, 175, 80, 0.5)',
                      color: takeoutData.takeoutTime === slot.value ? '#fff' : '#4caf50',
                      '&:hover': {
                        backgroundColor: takeoutData.takeoutTime === slot.value ? '#388e3c' : 'rgba(76, 175, 80, 0.2)',
                        borderColor: '#4caf50',
                      },
                    }),
                  }}
                >
                  {slot.label}
                </Button>
              ))}
            </Box>
          </FormControl>
        </Box>

        {/* Payment Method */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#ff9800', fontWeight: 600 }}>
            Mode de paiement
          </Typography>
          <FormControl>
            <RadioGroup
              value={takeoutData.paymentMethod}
              onChange={(e) => setTakeoutData(prev => ({ ...prev, paymentMethod: e.target.value }))}
            >
              <FormControlLabel
                value="cash"
                control={<Radio sx={{ color: '#ff9800', '&.Mui-checked': { color: '#ff9800' } }} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CashIcon />
                    <span>Espèces</span>
                  </Box>
                }
              />
              <FormControlLabel
                value="card"
                control={<Radio sx={{ color: '#ff9800', '&.Mui-checked': { color: '#ff9800' } }} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CreditCardIcon />
                    <span>Carte bancaire</span>
                  </Box>
                }
              />
              <FormControlLabel
                value="bancontact"
                control={<Radio sx={{ color: '#ff9800', '&.Mui-checked': { color: '#ff9800' } }} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BankIcon />
                    <span>Bancontact</span>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>
        </Box>

        {/* Notes */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2, color: '#ff9800', fontWeight: 600 }}>
            Notes (optionnel)
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Demandes spéciales, allergies, etc..."
            value={takeoutData.notes}
            onChange={(e) => setTakeoutData(prev => ({ ...prev, notes: e.target.value }))}
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
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, gap: 2 }}>
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
          Annuler
        </Button>
        
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #f57c00 30%, #ff9800 90%)',
            },
            fontWeight: 600,
            px: 4,
          }}
        >
          Confirmer la commande
        </Button>
      </DialogActions>
    </Dialog>
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
