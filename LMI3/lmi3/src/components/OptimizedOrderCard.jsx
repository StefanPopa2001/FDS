import React, { memo, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Grid,
} from '@mui/material';
import { format } from 'date-fns';

// Memoized order card component to prevent unnecessary re-renders
const OrderCard = memo(({ 
  order, 
  onStatusChange, 
  onViewDetails, 
  isViewed 
}) => {
  // Memoize click handlers to prevent function recreation
  const handleStatusChange = useCallback(() => {
    onStatusChange(order.id);
  }, [order.id, onStatusChange]);

  const handleViewDetails = useCallback(() => {
    onViewDetails(order);
  }, [order, onViewDetails]);

  // Memoize expensive calculations
  const formattedDate = React.useMemo(() => {
    return format(new Date(order.createdAt), 'HH:mm');
  }, [order.createdAt]);

  const totalPrice = React.useMemo(() => {
    return order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  }, [order.items]);

  return (
    <Card
      sx={{
        mb: 2,
        border: !isViewed ? '2px solid #ff9800' : '1px solid rgba(255, 255, 255, 0.1)',
        opacity: isViewed ? 0.8 : 1,
        transform: 'translateZ(0)', // Force GPU acceleration
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6" fontWeight="bold">
                #{order.id}
              </Typography>
              <Chip
                label={order.status}
                color={getStatusColor(order.status)}
                size="small"
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {formattedDate}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Typography variant="h6" color="primary">
              €{totalPrice.toFixed(2)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Box display="flex" gap={1}>
              <Button
                size="small"
                onClick={handleViewDetails}
                variant="outlined"
              >
                Voir
              </Button>
              <Button
                size="small"
                onClick={handleStatusChange}
                variant="contained"
              >
                Statut
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
});

// Helper function for status colors
const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'warning';
    case 'confirmed': return 'info';
    case 'preparing': return 'primary';
    case 'ready': return 'success';
    case 'completed': return 'success';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};

OrderCard.displayName = 'OrderCard';

export default OrderCard;
