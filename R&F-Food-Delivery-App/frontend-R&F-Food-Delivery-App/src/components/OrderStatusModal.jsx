import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Alert,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import useMobileBackToClose from '../hooks/useMobileBackToClose';

const OrderStatusModal = ({ open, onClose, orderId, status }) => {
  // Close on mobile back gesture
  useMobileBackToClose(open, onClose);
  const getStatusInfo = (status) => {
    switch (status) {
      case 0:
        return {
          title: 'Commande en attente de confirmation',
          message: 'Votre commande a été reçue et est en attente de confirmation par le restaurant. Vous serez notifié dès qu\'elle sera confirmée.',
          icon: <TimeIcon sx={{ fontSize: 48, color: 'warning.main' }} />,
          severity: 'warning',
          actionText: 'Compris'
        };
      case 1:
        return {
          title: 'Commande confirmée',
          message: 'Votre commande a été confirmée par le restaurant et sera préparée prochainement.',
          icon: <CheckIcon sx={{ fontSize: 48, color: 'success.main' }} />,
          severity: 'success',
          actionText: 'Parfait'
        };
      default:
        return {
          title: 'Statut de la commande',
          message: 'Votre commande a été enregistrée.',
          icon: <InfoIcon sx={{ fontSize: 48, color: 'info.main' }} />,
          severity: 'info',
          actionText: 'OK'
        };
    }
  };

  const statusInfo = getStatusInfo(status);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))',
          backdropFilter: 'blur(10px)',
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box display="flex" justifyContent="center" mb={2}>
          {statusInfo.icon}
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
          {statusInfo.title}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ textAlign: 'center', pb: 3 }}>
        <Typography variant="body1" sx={{ mb: 3, color: 'text.primary' }}>
          {statusInfo.message}
        </Typography>

        {status === 0 && (
          <Alert
            severity="info"
            sx={{
              mb: 2,
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              border: '1px solid rgba(33, 150, 243, 0.3)',
              borderRadius: 2,
            }}
          >
            <Typography variant="body2">
              <strong>Important:</strong> Votre commande peut être annulée ou retardée si elle n'est pas confirmée.
              Vous recevrez une notification dès qu'il y aura une mise à jour.
            </Typography>
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Chip
            label={`Commande #${orderId}`}
            sx={{
              backgroundColor: 'rgba(255, 152, 0, 0.1)',
              color: 'primary.main',
              fontWeight: 600,
              border: '1px solid rgba(255, 152, 0, 0.3)',
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            minWidth: 120,
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark',
            }
          }}
        >
          {statusInfo.actionText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderStatusModal;
