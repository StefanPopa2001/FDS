import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Card,
  CardContent,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
  Alert,
} from '@mui/material';
import {
  LocalShipping as DeliveryIcon,
  Store as PickupIcon,
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  Money as CashIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Map as MapIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useBasket } from '../contexts/BasketContext';
import config from '../config';
import useMobileBackToClose from '../hooks/useMobileBackToClose';

// Memoized card component for order items
const OrderItemCard = React.memo(({ item, getItemDisplayName, getItemDescription, calculateItemPrice }) => (
  <Card sx={{ 
    mb: 1, 
    backgroundColor: 'rgba(255, 152, 0, 0.05)',
    border: '1px solid rgba(255, 152, 0, 0.1)',
    boxShadow: 'none',
    transition: 'none'
  }}>
    <CardContent sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 600, color: '#ff9800' }}>
            {getItemDisplayName(item)} x{item.quantity}
          </Typography>
          {getItemDescription(item) && (
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
              {getItemDescription(item)}
            </Typography>
          )}
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
            {(calculateItemPrice(item) / item.quantity).toFixed(2)}€ / unité
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ fontWeight: 600, color: '#ff9800' }}>
          {calculateItemPrice(item).toFixed(2)}€
        </Typography>
      </Box>
    </CardContent>
  </Card>
));

const OrderConfirmation = ({ open, onClose, onConfirm }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const { items, totalPrice, totalItems, getItemDisplayName, getItemDescription, calculateItemPrice } = useBasket();
  
  const [activeStep, setActiveStep] = useState(0);
  const [orderData, setOrderData] = useState({
    deliveryType: 0, // Only delivery for now
    address: {
      street: '',
      city: '',
      postalCode: '',
      instructions: '',
    },
    deliveryTime: '',
    paymentMethod: 'card', // 'card', 'cash', 'payconic', 'bancontact'
    paymentDetails: {},
    message: '',
    phone: user?.phone || '',
  });

  const [addressData, setAddressData] = useState({
    coordinates: null,
    distance: null,
    restaurantAddress: null
  });

  const [orderHours, setOrderHours] = useState([]);
  const [loadingHours, setLoadingHours] = useState(false);

  // Close on mobile back gesture
  useMobileBackToClose(open, onClose);

  const steps = ['Adresse de livraison', 'Heure de livraison', 'Frais de livraison', 'Paiement', 'Confirmation'];

  // Load saved delivery data when component opens
  useEffect(() => {
    if (open) {
      const savedData = localStorage.getItem('userDeliveryData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          // Load the saved data without date expiration check
          setOrderData(prev => ({
            ...prev,
            address: {
              ...prev.address,
              ...parsedData.address
            },
            phone: parsedData.phone || prev.phone,
            paymentMethod: parsedData.paymentMethod || prev.paymentMethod
          }));
        } catch (error) {
          console.error('Error loading saved delivery data:', error);
          // If there's an error, remove the corrupted data
          localStorage.removeItem('userDeliveryData');
        }
      }
    }
  }, [open]);

  // Fetch order hours
  useEffect(() => {
    const fetchOrderHours = async () => {
      try {
        setLoadingHours(true);
        const response = await fetch(`${config.API_URL}/order-hours`);
        if (response.ok) {
          const data = await response.json();
          setOrderHours(data);
        } else {
          console.error('Failed to fetch order hours');
          setOrderHours([]);
        }
      } catch (error) {
        console.error('Error fetching order hours:', error);
        setOrderHours([]);
      } finally {
        setLoadingHours(false);
      }
    };

    if (open) {
      fetchOrderHours();
    }
  }, [open]);

  // Calculate delivery fee based on order total
  const calculateDeliveryFee = () => {
    return totalPrice >= 25.00 ? 0 : 2.50;
  };

  const calculateFinalTotal = () => {
    return totalPrice + calculateDeliveryFee();
  };

  // Generate OpenStreetMap embed URL (free alternative)
  const generateMapUrl = () => {
    if (!orderData.address.street || !orderData.address.city || !orderData.address.postalCode) {
      return null;
    }
    
    const fullAddress = `${orderData.address.street}, ${orderData.address.city} ${orderData.address.postalCode}, France`;
    const encodedAddress = encodeURIComponent(fullAddress);
    
    // Using OpenStreetMap with Nominatim search (free, no API key needed)
    return `https://www.openstreetmap.org/export/embed.html?bbox=2.224,48.815,2.470,48.902&layer=mapnik&marker=48.8566,2.3522`;
  };

  // Generate Google Maps search URL (opens in new tab)
  const generateMapSearchUrl = () => {
    if (!orderData.address.street || !orderData.address.city || !orderData.address.postalCode) {
      return null;
    }
    
    const fullAddress = `${orderData.address.street}, ${orderData.address.city} ${orderData.address.postalCode}, Belgium`;
    const encodedAddress = encodeURIComponent(fullAddress);
    
    return `https://www.openstreetmap.org/search?query=${encodedAddress}`;
  };

  // Fetch address coordinates and distance when address is complete
  const fetchAddressData = useCallback(async () => {
    if (orderData.address.street && orderData.address.city && orderData.address.postalCode) {
      try {
        const response = await fetch(`${config.API_URL}/geocode`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address: orderData.address }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setAddressData({
            coordinates: { lat: data.lat, lng: data.lng },
            distance: data.distance,
            restaurantAddress: data.restaurantAddress
          });
        }
      } catch (error) {
        console.error('Error fetching address data:', error);
      }
    } else {
      setAddressData({
        coordinates: null,
        distance: null,
        restaurantAddress: null
      });
    }
  }, [orderData.address]);

  // Fetch address data when address changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAddressData();
    }, 500); // Debounce the API calls

    return () => clearTimeout(timeoutId);
  }, [fetchAddressData]);

  // Generate Google Maps URL with directions
  const generateDirectionsUrl = () => {
    if (!addressData.coordinates || !addressData.restaurantAddress) {
      return null;
    }
    
    const origin = `${addressData.restaurantAddress.street}, ${addressData.restaurantAddress.city} ${addressData.restaurantAddress.postalCode}, ${addressData.restaurantAddress.country}`;
    const destination = `${orderData.address.street}, ${orderData.address.city} ${orderData.address.postalCode}, Belgium`;
    
    // Use simplified maps URL for faster loading on mobile
    return `https://www.google.com/maps/search/${encodeURIComponent(destination)}/`;
  };
  
  // Generate lightweight map link instead of embedded iframe
  const generateMapLink = () => {
    if (!orderData.address.street || !orderData.address.city || !orderData.address.postalCode) {
      return null;
    }
    const destination = `${orderData.address.street}, ${orderData.address.city} ${orderData.address.postalCode}, Belgium`;
    return `https://www.google.com/maps/search/${encodeURIComponent(destination)}/`;
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleInputChange = (section, field, value) => {
    setOrderData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSimpleInputChange = (field, value) => {
    setOrderData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isStepValid = (step) => {
    switch (step) {
      case 0:
        return orderData.address.street && orderData.address.city && orderData.address.postalCode && orderData.phone;
      case 1:
        return orderData.deliveryTime !== '';
      case 2:
        return true; // Always valid for delivery fee step
      case 3:
        return orderData.paymentMethod !== '';
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleConfirmOrder = () => {
    const finalOrderData = {
      ...orderData,
      items,
      totalPrice,
      deliveryFee: calculateDeliveryFee(),
      finalTotal: calculateFinalTotal(),
      distance: addressData.distance,
      coordinates: addressData.coordinates,
      userId: user.id,
    };
    onConfirm(finalOrderData);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" sx={{ mb: 3, color: '#ff9800' }}>
              Adresse de livraison
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                label="Rue et numéro"
                value={orderData.address.street}
                onChange={(e) => handleInputChange('address', 'street', e.target.value)}
                required
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Ville"
                  value={orderData.address.city}
                  onChange={(e) => handleInputChange('address', 'city', e.target.value)}
                  required
                  sx={{ flex: 2 }}
                />
                <TextField
                  label="Code postal"
                  value={orderData.address.postalCode}
                  onChange={(e) => handleInputChange('address', 'postalCode', e.target.value)}
                  required
                  sx={{ flex: 1 }}
                  placeholder="1000"
                  inputProps={{ maxLength: 4 }}
                />
              </Box>
              <TextField
                fullWidth
                label="Instructions de livraison (optionnel)"
                value={orderData.address.instructions}
                onChange={(e) => handleInputChange('address', 'instructions', e.target.value)}
                multiline
                rows={2}
                placeholder="Étage, code d'accès, etc."
              />
              <TextField
                fullWidth
                label="Numéro de téléphone"
                value={orderData.phone}
                onChange={(e) => handleSimpleInputChange('phone', e.target.value)}
                required
                placeholder="+32 X XX XX XX XX"
              />
            </Box>

            {/* Lightweight Map Link */}
            {orderData.address.street && orderData.address.city && orderData.address.postalCode && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#ff9800', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MapIcon />
                  Localisation et itinéraire
                </Typography>
                
                {/* Distance Information */}
                {addressData.distance && (
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: 'rgba(255, 152, 0, 0.1)', 
                    borderRadius: 2, 
                    border: '1px solid rgba(255, 152, 0, 0.3)',
                    mb: 2
                  }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                      📍 Restaurant: Rue Grande 110, 7301 Boussu
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#ff9800' }}>
                      📍 Distance: {addressData.distance} km
                    </Typography>
                  </Box>
                )}
                
                {/* Lightweight map button instead of iframe */}
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => window.open(generateMapLink())}
                  sx={{
                    borderColor: '#ff9800',
                    color: '#ff9800',
                    py: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 152, 0, 0.1)',
                      borderColor: '#ffb74d',
                    }
                  }}
                >
                  Voir sur Google Maps
                </Button>
                
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', textAlign: 'center' }}>
                  {addressData.distance ? 
                    `Distance: ${addressData.distance} km` :
                    'Vérifiez que l\'adresse affichée correspond bien à votre adresse de livraison'
                  }
                </Typography>
              </Box>
            )}
          </Box>
        );

      case 1:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" sx={{ mb: 3, color: '#ff9800' }}>
              Heure de livraison
            </Typography>
            
            <FormControl component="fieldset" sx={{ width: '100%' }}>
              <FormLabel component="legend" sx={{ mb: 2, color: 'text.primary', fontWeight: 600 }}>
                Choisissez votre heure de livraison préférée
              </FormLabel>
              <RadioGroup
                value={orderData.deliveryTime}
                onChange={(e) => handleSimpleInputChange('deliveryTime', e.target.value)}
                sx={{ gap: 1 }}
              >
                {/* ASAP Option */}
                <FormControlLabel
                  value=""
                  control={<Radio sx={{ color: '#ff9800', '&.Mui-checked': { color: '#ff9800' } }} />}
                  label={
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        Dès que possible
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Livraison dans les plus brefs délais
                      </Typography>
                    </Box>
                  }
                  sx={{
                    border: '1px solid rgba(255, 152, 0, 0.3)',
                    borderRadius: 2,
                    p: 2,
                    m: 0,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 152, 0, 0.05)',
                      border: '1px solid rgba(255, 152, 0, 0.5)',
                    },
                    '& .MuiFormControlLabel-label': { width: '100%' }
                  }}
                />
                
                {/* Configured delivery hours */}
                {orderHours.map((hour) => {
                  const [hours, minutes] = hour.time.split(':').map(Number);
                  const now = new Date();
                  const currentHour = now.getHours();
                  const currentMinute = now.getMinutes();
                  const isPastTime = (hours < currentHour) || (hours === currentHour && minutes <= currentMinute);
                  
                  return (
                    <FormControlLabel
                      key={hour.id}
                      value={hour.time}
                      control={<Radio sx={{ color: '#ff9800', '&.Mui-checked': { color: '#ff9800' } }} />}
                      label={
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {hour.time}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Livraison programmée
                          </Typography>
                        </Box>
                      }
                      disabled={!hour.enabled || isPastTime}
                      sx={{
                        border: '1px solid rgba(255, 152, 0, 0.3)',
                        borderRadius: 2,
                        p: 2,
                        m: 0,
                        opacity: (!hour.enabled || isPastTime) ? 0.5 : 1,
                        '&:hover': {
                          backgroundColor: (!hour.enabled || isPastTime) ? 'transparent' : 'rgba(255, 152, 0, 0.05)',
                          border: (!hour.enabled || isPastTime) ? '1px solid rgba(255, 152, 0, 0.3)' : '1px solid rgba(255, 152, 0, 0.5)',
                        },
                        '& .MuiFormControlLabel-label': { width: '100%' }
                      }}
                    />
                  );
                })}
              </RadioGroup>
            </FormControl>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" sx={{ mb: 3, color: '#ff9800' }}>
              Frais de livraison
            </Typography>
            
            {/* Address summary with distance */}
            <Box sx={{ 
              p: 2, 
              backgroundColor: 'rgba(255, 152, 0, 0.1)', 
              borderRadius: 2, 
              border: '1px solid rgba(255, 152, 0, 0.3)',
              mb: 3
            }}>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                Adresse de livraison:
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                {orderData.address.street}, {orderData.address.city} {orderData.address.postalCode}
              </Typography>
              {addressData.distance && (
                <Typography variant="body2" sx={{ color: '#ff9800', fontWeight: 600 }}>
                  Distance du restaurant: {addressData.distance} km
                </Typography>
              )}
            </Box>

            {/* Delivery fee explanation */}
            <Box sx={{ 
              p: 2, 
              backgroundColor: 'rgba(255, 152, 0, 0.05)', 
              borderRadius: 2, 
              border: '1px solid rgba(255, 152, 0, 0.2)',
              mb: 3
            }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#ff9800' }}>
                Frais de livraison
              </Typography>
              
              {totalPrice >= 25.00 ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    🎉 Félicitations ! Votre commande dépasse 25€, la livraison est offerte !
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    💡 Ajoutez {(25.00 - totalPrice).toFixed(2)}€ de plus pour bénéficier de la livraison gratuite !
                  </Typography>
                </Alert>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Sous-total de la commande:</Typography>
                <Typography sx={{ fontWeight: 600 }}>{totalPrice.toFixed(2)}€</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Frais de livraison:</Typography>
                <Typography sx={{ 
                  fontWeight: 600,
                  color: calculateDeliveryFee() === 0 ? '#4caf50' : 'inherit',
                  textDecoration: calculateDeliveryFee() === 0 ? 'line-through' : 'none'
                }}>
                  {calculateDeliveryFee() === 0 ? 'GRATUIT' : `€${calculateDeliveryFee().toFixed(2)}`}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff9800' }}>
                  Total:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff9800' }}>
                  {calculateFinalTotal().toFixed(2)}€
                </Typography>
              </Box>
            </Box>

            {/* Pickup option (coming soon) */}
            <Box sx={{ 
              p: 2, 
              backgroundColor: 'rgba(158, 158, 158, 0.1)', 
              borderRadius: 2, 
              border: '1px solid rgba(158, 158, 158, 0.3)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PickupIcon sx={{ color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Retrait en magasin
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Bientôt disponible
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" sx={{ mb: 3, color: '#ff9800' }}>
              Méthode de paiement
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                value={orderData.paymentMethod}
                onChange={(e) => handleSimpleInputChange('paymentMethod', e.target.value)}
              >
                <FormControlLabel
                  value="card"
                  control={<Radio sx={{ color: '#ff9800' }} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                      <CreditCardIcon sx={{ color: '#ff9800' }} />
                      <Typography variant="body1">Carte bancaire (à la livraison)</Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="cash"
                  control={<Radio sx={{ color: '#ff9800' }} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                      <CashIcon sx={{ color: '#ff9800' }} />
                      <Typography variant="body1">Espèces (à la livraison)</Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="payconic"
                  control={<Radio sx={{ color: '#ff9800' }} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                      <PaymentIcon sx={{ color: '#ff9800' }} />
                      <Typography variant="body1">Payconic (à la livraison)</Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="bancontact"
                  disabled
                  control={<Radio sx={{ color: 'text.secondary' }} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                      <BankIcon sx={{ color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                          Bancontact (Stripe)
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                          Bientôt disponible
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
            
            <TextField
              fullWidth
              label="Message pour le restaurant (optionnel)"
              value={orderData.message}
              onChange={(e) => handleSimpleInputChange('message', e.target.value)}
              multiline
              rows={3}
              sx={{ mt: 3 }}
              placeholder="Allergies, préférences de cuisson, etc."
            />
          </Box>
        );

      case 4:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" sx={{ mb: 3, color: '#ff9800', textAlign: 'center' }}>
              Récapitulatif de la commande
            </Typography>
            
            {/* Order Items */}
            <Box sx={{ mb: 3 }}>
              {items.map((item) => (
                <OrderItemCard 
                  key={item.id} 
                  item={item} 
                  getItemDisplayName={getItemDisplayName}
                  getItemDescription={getItemDescription}
                  calculateItemPrice={calculateItemPrice}
                />
              ))}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Order Details */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Livraison à:</strong> {orderData.address.street}, {orderData.address.postalCode} {orderData.address.city}, Belgique
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Paiement:</strong> {
                  orderData.paymentMethod === 'card' ? 'Carte bancaire (à la livraison)' :
                  orderData.paymentMethod === 'cash' ? 'Espèces (à la livraison)' :
                  orderData.paymentMethod === 'payconic' ? 'Payconic (à la livraison)' : 'Bancontact (Stripe)'
                }
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Téléphone:</strong> {orderData.phone}
              </Typography>
              {orderData.message && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Message:</strong> {orderData.message}
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Price Summary */}
            <Box sx={{ backgroundColor: 'rgba(255, 152, 0, 0.1)', p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Sous-total:</Typography>
                <Typography>{totalPrice.toFixed(2)}€</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Frais de livraison:</Typography>
                <Typography sx={{ 
                  color: calculateDeliveryFee() === 0 ? '#4caf50' : 'inherit',
                  fontWeight: calculateDeliveryFee() === 0 ? 600 : 'normal'
                }}>
                  {calculateDeliveryFee() === 0 ? 'GRATUIT' : `${calculateDeliveryFee().toFixed(2)}€`}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff9800' }}>
                  Total:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff9800' }}>
                  {calculateFinalTotal().toFixed(2)}€
                </Typography>
              </Box>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        elevation: isMobile ? 0 : 24,
        sx: {
          borderRadius: isMobile ? 0 : 3,
          background: isMobile 
            ? 'rgba(26, 26, 26, 0.95)'
            : 'rgba(26, 26, 26, 0.95)',
          backdropFilter: 'none',
          border: '1px solid rgba(255, 152, 0, 0.2)',
          minHeight: isMobile ? '100vh' : '600px',
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
        <PaymentIcon sx={{ color: '#ff9800' }} />
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#ff9800', flex: 1 }}>
          Finaliser la commande
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255, 152, 0, 0.7)' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Stepper */}
        <Stepper 
          activeStep={activeStep} 
          sx={{ 
            mb: 4,
            '& .MuiStepIcon-root': {
              transition: isMobile ? 'none' : 'all 0.3s ease',
            },
            '& .MuiStep-root': {
              transition: isMobile ? 'none' : 'all 0.2s ease',
            }
          }}
        >
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel
                sx={{
                  '& .MuiStepLabel-label': {
                    color: index <= activeStep ? '#ff9800' : 'text.secondary',
                    fontWeight: index === activeStep ? 600 : 400,
                  },
                  '& .MuiStepIcon-root': {
                    color: index <= activeStep ? '#ff9800' : 'rgba(255,255,255,0.3)',
                  },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step Content */}
        <Box sx={{ minHeight: '300px' }}>
          {renderStepContent(activeStep)}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            borderColor: 'rgba(255, 152, 0, 0.5)',
            color: '#ff9800',
            transition: isMobile ? 'none' : 'all 0.2s',
            '&:hover': isMobile ? {} : {
              borderColor: '#ff9800',
              backgroundColor: 'rgba(255, 152, 0, 0.1)',
            },
          }}
        >
          Annuler
        </Button>

        <Box sx={{ flex: 1 }} />

        {activeStep > 0 && (
          <Button
            variant="outlined"
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            sx={{
              borderColor: 'rgba(255, 152, 0, 0.5)',
              color: '#ff9800',
              transition: isMobile ? 'none' : 'all 0.2s',
              '&:hover': isMobile ? {} : {
                borderColor: '#ff9800',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
              },
            }}
          >
            Précédent
          </Button>
        )}

        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!isStepValid(activeStep)}
            endIcon={<ArrowForwardIcon />}
            sx={{
              background: '#ff9800',
              transition: isMobile ? 'none' : 'all 0.2s',
              '&:hover': isMobile ? {} : {
                background: '#f57c00',
              },
              '&:disabled': {
                background: 'rgba(255, 152, 0, 0.3)',
              },
            }}
          >
            Suivant
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleConfirmOrder}
            startIcon={<CheckCircleIcon />}
            sx={{
              background: '#4caf50',
              transition: isMobile ? 'none' : 'all 0.2s',
              '&:hover': isMobile ? {} : {
                background: '#388e3c',
              },
              fontWeight: 600,
              px: 4,
            }}
          >
            Confirmer la commande
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default OrderConfirmation;
