import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Badge,
  Tabs,
  Tab,
  Paper,
  Divider,
  Stack,
  Tooltip,
  Alert,
  Collapse,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  FormControlLabel,
  Switch,
  Snackbar,
  Drawer,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery,
  InputAdornment,
  ButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { 
  LocalDining as LocalDiningIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  AccessTime as TimeIcon,
  Check as CheckIcon,
  LocalShipping as LocalShippingIcon,
  Done as DoneIcon,
  Cancel as CancelIcon,
  Notifications as NotificationsIcon,
  Today as TodayIcon,
  ExpandMore,
  ExpandMore as ExpandMoreIcon,
  ExpandLess,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { format, isSameDay, parseISO, addHours, isWithinInterval, differenceInMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import config from "../config";
import io from 'socket.io-client';

// Sound notification
const notificationSound = new Audio("/notification.mp3");

export default function AdminOrders() {
  const { token } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  
  // Refs for scrolling to specific time sections
  const timeRefs = useRef({});
  
  // State for orders and UI
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hiddenHours, setHiddenHours] = useState(new Set()); // Track hidden hours
  const [viewedOrders, setViewedOrders] = useState(() => {
    const saved = localStorage.getItem("viewedOrders");
    return saved ? JSON.parse(saved) : [];
  });
  const [viewMode, setViewMode] = useState("cards"); // 'cards' or 'list'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "info" });
  const [expandedItems, setExpandedItems] = useState({});
  const [modalExpandedSections, setModalExpandedSections] = useState({});
  
  // Socket.io connection
  const socket = useMemo(() => {
    const newSocket = io(config.WS_URL, {
      path: config.WS_PATH
    });
    
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setSocketConnected(true);
      
      // Join admin room
      newSocket.emit('join-admin', { token });
    });
    
    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setSocketConnected(false);
    });
    
    return newSocket;
  }, [token]);
  
  // Listen for new orders and updates
  useEffect(() => {
    if (!socket) return;
    
    // Handle new order notification
    const handleNewOrder = (data) => {
      console.log('New order received:', data);
      // Play notification sound
      notificationSound.play().catch(err => console.error('Error playing notification:', err));
      
      // Show notification
      setNotification({
        open: true,
        message: `Nouvelle commande #${data.order.id} reçue!`,
        severity: "success"
      });
      
      // Fetch fresh data
      fetchOrders();
    };
    
    // Handle order status update
    const handleOrderUpdate = (data) => {
      console.log('Order update received:', data);
      
      // Update the order in the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === data.orderId 
            ? {...order, status: data.status, statusText: data.statusText} 
            : order
        )
      );
    };
    
    // Register event listeners
    socket.on('newOrder', handleNewOrder);
    socket.on('orderStatusUpdate', handleOrderUpdate);
    
    // Cleanup on unmount
    return () => {
      socket.off('newOrder', handleNewOrder);
      socket.off('orderStatusUpdate', handleOrderUpdate);
    };
  }, [socket]);
  
  // Save viewed orders to localStorage
  useEffect(() => {
    localStorage.setItem("viewedOrders", JSON.stringify(viewedOrders));
  }, [viewedOrders]);

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    setRefreshing(true);
    try {
      let queryParams = '?';
      
      if (statusFilter !== "all") {
        queryParams += `status=${statusFilter}&`;
      }
      
      const response = await fetch(`${config.API_URL}/admin/orders${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des commandes");
      }

      const data = await response.json();
      setOrders(data.orders);
      setError(null);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Impossible de charger les commandes. Veuillez réessayer.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, statusFilter]);

  // Initial fetch
  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [fetchOrders, token]);

  // Handle status filter change
  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  // Mark an order as viewed
  const handleQuickStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${config.API_URL}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: newStatus,
          restaurantMessage: ''
        }),
      });

      if (response.ok) {
        fetchOrders(); // Refresh the orders
        console.log('Statut mis à jour avec succès');
      } else {
        console.error('Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const markOrderAsViewed = (orderId) => {
    if (!viewedOrders.includes(orderId)) {
      setViewedOrders([...viewedOrders, orderId]);
    }
  };

  // Handle order selection for details view
  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    setOrderDetailsOpen(true);
    markOrderAsViewed(order.id);
  };

  // Handle status edit dialog
  const handleStatusEdit = (order) => {
    setEditingOrderId(order.id);
    setNewStatus(order.status.toString());
    setStatusNotes("");
    setStatusDialogOpen(true);
  };

  // Update order status
  const updateOrderStatus = async () => {
    try {
      const response = await fetch(`${config.API_URL}/admin/orders/${editingOrderId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: Number.parseInt(newStatus),
          notes: statusNotes,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du statut");
      }

      setStatusDialogOpen(false);
      
      // Show success notification
      setNotification({
        open: true,
        message: "Statut de la commande mis à jour avec succès",
        severity: "success"
      });
      
      // Refresh orders
      fetchOrders();
    } catch (error) {
      console.error("Error updating status:", error);
      setNotification({
        open: true,
        message: "Erreur lors de la mise à jour du statut",
        severity: "error"
      });
    }
  };

  // Format price for display
  const formatPrice = (price) => {
    return `${price.toFixed(2)}€`;
  };

  // Format item details for display
  const formatItemDetails = (item) => {
    const details = [];

    if (item.versionSize) {
      details.push(`Taille: ${item.versionSize}`);
    }

    if (item.sauce) {
      details.push(`Sauce: ${item.sauce.name}`);
    }

    if (item.extra) {
      details.push(`Extra: ${item.extra.nom || item.extra.name}`);
    }

    if (item.platSauce) {
      details.push(`Sauce plat: ${item.platSauce.name}`);
    }

    if (item.addedExtras && item.addedExtras.length > 0) {
      const extras = item.addedExtras
        .map((e) => `${e.extra.nom || e.extra.name} (+€${e.price.toFixed(2)})`)
        .join(", ");
      details.push(`Extras ajoutés: ${extras}`);
    }

    if (item.removedIngredients && item.removedIngredients.length > 0) {
      const removed = item.removedIngredients.map((r) => r.ingredient.name).join(", ");
      details.push(`Sans: ${removed}`);
    }

    return details;
  };

  // Check if item has actual modifications (not just version/sauce selection)
  const hasItemModifications = (item) => {
    return (item.addedExtras && item.addedExtras.length > 0) ||
           (item.removedIngredients && item.removedIngredients.length > 0);
  };

  // Get color for status chip
  const getStatusColor = (status) => {
    const statusColors = {
      0: "default", // En attente
      1: "primary", // Confirmée
      2: "secondary", // En préparation
      3: "success", // Prête
      4: "info", // En livraison
      5: "success", // Livrée
      6: "success", // Terminée
      7: "error", // Annulée
    };
    return statusColors[status] || "default";
  };

  // Get icon for status
  const getStatusIcon = (status) => {
    switch (parseInt(status)) {
      case 0:
        return <TimeIcon />;
      case 1:
        return <CheckIcon />;
      case 2:
        return <LocalDiningIcon />;
      case 3:
        return <DoneIcon />;
      case 4:
        return <LocalShippingIcon />;
      case 5:
        return <DoneIcon />;
      case 6:
        return <DoneIcon />;
      case 7:
        return <CancelIcon />;
      default:
        return <TimeIcon />;
    }
  };

  // Status options for dropdown
  const statusOptions = [
    { value: 0, label: "En attente" },
    { value: 1, label: "Confirmée" },
    { value: 2, label: "En préparation" },
    { value: 3, label: "Prête" },
    { value: 4, label: "En livraison" },
    { value: 5, label: "Livrée" },
    { value: 6, label: "Terminée" },
    { value: 7, label: "Annulée" },
  ];

  // Status labels map
  const statusLabels = {
    0: "En attente",
    1: "Confirmée",
    2: "En préparation",
    3: "Prête",
    4: "En livraison",
    5: "Livrée",
    6: "Terminée",
    7: "Annulée",
  };

  // Toggle item expansion
  const toggleItemExpansion = (orderId, itemId) => {
    const key = `${orderId}-${itemId}`;
    setExpandedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Filter orders by date
  const filteredOrders = useMemo(() => {
    if (!orders.length) return [];
    
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return isSameDay(orderDate, selectedDate);
    });
  }, [orders, selectedDate]);

  // Group orders by time slot
  const groupedOrders = useMemo(() => {
    const groups = {
      asap: [],    // ASAP orders (takeoutTime is null)
      hours: {}    // Orders grouped by specific delivery hour
    };
    
    filteredOrders.forEach(order => {
      // Check if this is an ASAP order (no takeoutTime)
      if (!order.takeoutTime && order.OrderType === 'takeout') {
        groups.asap.push(order);
        return;
      }
      
      if (order.takeoutTime) {
        const takeoutDate = new Date(order.takeoutTime);
        const hour = takeoutDate.getHours();
        const minute = takeoutDate.getMinutes();
        const timeKey = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        if (!groups.hours[timeKey]) {
          groups.hours[timeKey] = [];
        }
        groups.hours[timeKey].push(order);
      }
    });
    
    // Sort hours
    const sortedHours = Object.keys(groups.hours).sort();
    const sortedGroupsHours = {};
    sortedHours.forEach(hour => {
      sortedGroupsHours[hour] = groups.hours[hour];
    });
    groups.hours = sortedGroupsHours;
    
    return groups;
  }, [filteredOrders]);

  // Calculate unfinished orders count for each time slot
  const hourStats = useMemo(() => {
    const stats = {};
    
    // ASAP orders count (unfinished)
    const asapUnfinished = groupedOrders.asap.filter(order => ![4, 5, 6, 7].includes(order.status)).length;
    if (asapUnfinished > 0) {
      stats.asap = asapUnfinished;
    }
    
    // Hours count (unfinished)
    Object.keys(groupedOrders.hours).forEach(hour => {
      const unfinished = groupedOrders.hours[hour].filter(order => ![4, 5, 6, 7].includes(order.status)).length;
      if (unfinished > 0) {
        stats[hour] = unfinished;
      }
    });
    
    return stats;
  }, [groupedOrders]);

  // Scroll to specific time section
  const scrollToTimeSection = (timeKey) => {
    const element = timeRefs.current[timeKey];
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }
  };

  // Toggle hour visibility
  const toggleHourVisibility = (hour) => {
    setHiddenHours(prev => {
      const newHidden = new Set(prev);
      if (newHidden.has(hour)) {
        newHidden.delete(hour);
      } else {
        newHidden.add(hour);
      }
      return newHidden;
    });
  };

  // Function to get status-based border color
  const getStatusBorderColor = (status) => {
    switch (status) {
      case 0: return '#ff7043'; // Orange - New/Pending
      case 1: return '#2196f3'; // Blue - Confirmed
      case 2: return '#4caf50'; // Green - In Preparation
      case 3: return '#9c27b0'; // Purple - Ready
      case 4: return '#00bcd4'; // Cyan - Completed
      case 5: return '#607d8b'; // Blue Grey - Delivered
      case 6: return '#4caf50'; // Green - Terminated
      case 7: return '#f44336'; // Red - Cancelled
      default: return '#9e9e9e'; // Grey - Default
    }
  };

  // Function to render an order card
  const renderOrderCard = (order) => {
    const isNew = !viewedOrders.includes(order.id);
    const isAsap = !order.takeoutTime && order.OrderType === 'takeout';
    const orderTime = new Date(order.createdAt);
    const formattedTime = format(orderTime, 'HH:mm');
    const timeSinceOrder = differenceInMinutes(new Date(), orderTime);
    const statusBorderColor = getStatusBorderColor(order.status);
    
    // Check if card should be greyed out (status 6: Terminée or status 7: Annulée)
    const isGreyedOut = order.status === 6 || order.status === 7;
    
    // Check if any item has modifications (extras, removed ingredients, etc.)
    const hasModifications = order.items.some(item => hasItemModifications(item));
    
    return (
      <Card 
        sx={{
          mb: 2,
          borderRadius: 3,
          position: 'relative',
          border: `3px solid ${statusBorderColor}`,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          height: '420px', // Increased height
          width: '100%', // Standardized width
          maxWidth: '320px', // Maximum width to prevent expansion
          minWidth: '280px', // Minimum width for consistency
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          overflow: 'hidden', // Prevent content overflow
            background: isGreyedOut 
              ? 'linear-gradient(135deg, #424242 0%, #616161 100%)' 
              : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            opacity: isGreyedOut ? 0.6 : 1,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
              transform: 'translateY(-4px) scale(1.02)',
              border: `3px solid ${statusBorderColor}`,
              background: isGreyedOut 
                ? 'linear-gradient(135deg, #616161 0%, #757575 100%)'
                : 'linear-gradient(135deg, #2d2d2d 0%, #3d3d3d 100%)',
              opacity: isGreyedOut ? 0.8 : 1,
            },
          }}
          onClick={() => handleOrderSelect(order)}
        >
          {isNew && (
            <Box sx={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: '#ff5722',
              zIndex: 1,
            }} />
          )}
          
          <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Simple Header with order ID and user name only */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" sx={{ 
                fontWeight: 800, 
                fontSize: '1.4rem', 
                color: '#ffffff',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}>
                #{order.id}
              </Typography>
              
              <Typography variant="body2" sx={{ 
                fontWeight: 600,
                color: '#ffffff',
                fontSize: '0.9rem',
                opacity: 0.8,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '120px'
              }}>
                {order.user?.name || "Client"}
              </Typography>
            </Box>

            {/* Time display */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                px: 2,
                py: 1,
                color: 'white',
                fontWeight: 600,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                width: 'fit-content'
              }}>
                <TimeIcon sx={{ fontSize: 18, mr: 0.5 }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'inherit' }}>
                  {order.takeoutTime ? format(new Date(order.takeoutTime), 'HH:mm') : 'ASAP'}
                </Typography>
              </Box>
            </Box>

            {/* Order type with ASAP mention */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ 
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'inline-block'
              }}>
                {order.OrderType === 'takeout' ? '📦 À emporter' : '🚚 Livraison'}
                {isAsap && (
                  <Typography component="span" sx={{ 
                    ml: 1, 
                    color: '#ff5722', 
                    fontWeight: 800,
                    fontSize: '0.8rem'
                  }}>
                    (ASAP)
                  </Typography>
                )}
              </Typography>
            </Box>

            {/* Items count */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" sx={{ 
                fontWeight: 700,
                color: '#ffffff',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <LocalDiningIcon sx={{ fontSize: 20, color: '#ffffff' }} />
                {order.items.reduce((total, item) => total + item.quantity, 0)} article{order.items.reduce((total, item) => total + item.quantity, 0) > 1 ? 's' : ''}
              </Typography>
            </Box>
            
            {/* Status dropdown and price */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select
                  value={order.status}
                  onChange={(e) => handleQuickStatusUpdate(order.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  sx={{ 
                    fontSize: '0.85rem',
                    borderRadius: 2,
                    fontWeight: 600,
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      borderWidth: 2,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.7)',
                    },
                    '& .MuiSelect-icon': {
                      color: '#ffffff',
                    }
                  }}
                >
                  <MenuItem value={0}>En attente</MenuItem>
                  <MenuItem value={1}>Confirmée</MenuItem>
                  <MenuItem value={2}>En préparation</MenuItem>
                  <MenuItem value={3}>Prête</MenuItem>
                  <MenuItem value={4}>En livraison</MenuItem>
                  <MenuItem value={5}>Livrée</MenuItem>
                  <MenuItem value={6}>Terminée</MenuItem>
                  <MenuItem value={7}>Annulée</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="h5" sx={{ 
                fontWeight: 600, 
                color: '#ffffff',
                fontSize: '1.2rem',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}>
                {formatPrice(order.totalPrice)}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 1.5, backgroundColor: 'rgba(255, 255, 255, 0.3)', height: 2 }} />
            
            {/* Quick items summary */}
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <Typography variant="body2" sx={{ 
                fontWeight: 700, 
                color: '#ffffff', 
                mb: 1,
                fontSize: '0.9rem'
              }}>
                Articles ({order.items.reduce((total, item) => total + item.quantity, 0)}):
              </Typography>
              <Box sx={{ maxHeight: '120px', overflowY: 'auto', pr: 1 }}>
                {order.items.slice(0, 6).map((item, idx) => (
                  <Box key={idx} sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 0.5,
                    py: 0.5,
                    px: 1.5,
                    borderRadius: 2,
                    backgroundColor: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid rgba(255, 255, 255, 0.2)`
                  }}>
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#ffffff',
                      flex: 1
                    }}>
                      <Typography component="span" sx={{ 
                        color: statusBorderColor, 
                        fontWeight: 800,
                        mr: 0.5
                      }}>
                        {item.quantity}x
                      </Typography>
                      {item.plat ? item.plat.name : item.sauce.name}
                      {item.versionSize && (
                        <Typography component="span" sx={{ 
                          fontSize: '0.75rem', 
                          color: 'rgba(255, 255, 255, 0.7)', 
                          ml: 0.5,
                          fontWeight: 500
                        }}>
                          ({item.versionSize})
                        </Typography>
                      )}
                    </Typography>
                    {hasItemModifications(item) && (
                      <Box sx={{
                        backgroundColor: '#ff9800',
                        color: 'white',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}>
                        !
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
              {order.items.length > 6 && (
                <Typography variant="body2" sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  fontSize: '0.8rem', 
                  fontStyle: 'italic', 
                  textAlign: 'center', 
                  mt: 1,
                  fontWeight: 600,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  py: 0.5,
                  borderRadius: 1
                }}>
                  + {order.items.length - 6} autres articles
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
    );
  };

  // Render time slot section
  const renderTimeSlot = (title, orders) => {
    if (!orders.length) return null;
    
    const isAsapSection = title.includes('ASAP');
    const timeKey = isAsapSection ? 'asap' : title;
    const isHidden = hiddenHours.has(timeKey);
    
    return (
      <Box 
        ref={(el) => timeRefs.current[timeKey] = el}
        sx={{ mb: 4 }}
        id={`time-section-${timeKey}`}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, width: '100%' }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 800, 
                display: 'flex', 
                alignItems: 'center',
                color: isAsapSection ? '#f44336' : '#2196f3',
                fontSize: '1.4rem',
                textShadow: isAsapSection ? '0 0 10px rgba(244, 68, 54, 0.5)' : '0 2px 4px rgba(0,0,0,0.3)',
                py: 2,
                px: 3,
                backgroundColor: isAsapSection ? 'rgba(244, 68, 54, 0.15)' : 'rgba(33, 150, 243, 0.15)',
                borderLeft: `6px solid ${isAsapSection ? '#f44336' : '#2196f3'}`,
                borderRadius: 2,
                border: `1px solid ${isAsapSection ? 'rgba(244, 68, 54, 0.3)' : 'rgba(33, 150, 243, 0.3)'}`,
                width: '100%',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {isAsapSection && <span style={{ marginRight: '8px' }}>🚨</span>}
                {title} 
                <Chip 
                  label={orders.length} 
                  size="small" 
                  sx={{ 
                    ml: 2, 
                    fontWeight: 700,
                    backgroundColor: isAsapSection ? '#f44336' : '#2196f3',
                    color: 'white'
                  }} 
                />
              </Box>
              
              <IconButton
                onClick={() => toggleHourVisibility(timeKey)}
                sx={{ 
                  color: '#ffffff',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                  },
                  ml: 2
                }}
                size="small"
              >
                {isHidden ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </IconButton>
            </Typography>
          </Box>
        </Box>
        
        {!isHidden && (
          <Grid container spacing={3}>
            {orders.map(order => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={order.id}>
                {renderOrderCard(order)}
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  };

  // Handle notification close
  const handleNotificationClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({...notification, open: false});
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 3, pb: 6 }}>
      {/* Header with controls */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          Gestion des Commandes
          {socketConnected ? (
            <Chip 
              label="WebSocket Connecté" 
              color="success" 
              size="small" 
              sx={{ ml: 2, fontWeight: 600 }}
            />
          ) : (
            <Chip 
              label="WebSocket Déconnecté" 
              color="error" 
              size="small" 
              sx={{ ml: 2, fontWeight: 600 }}
            />
          )}
        </Typography>
        
        <Grid container spacing={2} alignItems="center" sx={{ mt: 2 }}>
          <Grid item xs={12} md={3}>
            <TextField
              label="Date (YYYY-MM-DD)"
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              fullWidth
              variant="outlined"
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="status-filter-label">Filtrer par statut</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Filtrer par statut"
                onChange={handleStatusFilterChange}
              >
                <MenuItem value="all">Tous les statuts</MenuItem>
                {statusOptions.map(option => (
                  <MenuItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchOrders}
              disabled={refreshing}
              fullWidth
            >
              {refreshing ? 'Actualisation...' : 'Actualiser'}
            </Button>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <ButtonGroup variant="outlined" aria-label="view mode">
                <Button 
                  variant={viewMode === 'cards' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('cards')}
                  startIcon={<ViewModuleIcon />}
                >
                  Cartes
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('list')}
                  startIcon={<ViewListIcon />}
                >
                  Liste
                </Button>
              </ButtonGroup>
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      {/* Hour Banner - Shows hours with unfinished order counts */}
      {Object.keys(hourStats).length > 0 && (
        <Paper sx={{ 
          mb: 4, 
          p: 2, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          color: 'white',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Typography variant="h6" sx={{ 
            mb: 2, 
            fontWeight: 700,
            textAlign: 'center',
            fontSize: '1.2rem'
          }}>
            🕐 Créneaux horaires - Commandes en attente
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1.5, 
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {Object.entries(hourStats).map(([timeKey, count]) => (
              <Button
                key={timeKey}
                variant="contained"
                onClick={() => scrollToTimeSection(timeKey)}
                sx={{
                  minWidth: '90px',
                  height: '50px',
                  borderRadius: 3,
                  background: timeKey === 'asap' 
                    ? 'linear-gradient(135deg, #ff5722 0%, #f44336 100%)'
                    : 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-2px) scale(1.05)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  }
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ 
                    fontSize: '0.8rem', 
                    fontWeight: 600,
                    opacity: 0.9 
                  }}>
                    {timeKey === 'asap' ? 'ASAP' : timeKey}
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 800, 
                    fontSize: '1.1rem',
                    lineHeight: 1
                  }}>
                    {count}
                  </Typography>
                </Box>
                <Box sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: '#ffc107',
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}>
                  {count}
                </Box>
              </Button>
            ))}
          </Box>
          <Typography variant="body2" sx={{ 
            textAlign: 'center', 
            mt: 2, 
            opacity: 0.9,
            fontSize: '0.85rem'
          }}>
            Cliquez sur un créneau pour naviguer vers les commandes correspondantes
          </Typography>
        </Paper>
      )}
      
      {/* Display error if any */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Loading indicator */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : filteredOrders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h6">Aucune commande trouvée pour cette date</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Essayez de changer la date ou le filtre de statut
          </Typography>
        </Paper>
      ) : viewMode === 'cards' ? (
        /* Card view mode with hour-based grouping */
        <Box>
          {groupedOrders.asap.length > 0 && renderTimeSlot('ASAP - Dès que possible', groupedOrders.asap)}
          {Object.keys(groupedOrders.hours).map(hour => 
            renderTimeSlot(`${hour}`, groupedOrders.hours[hour])
          )}
        </Box>
      ) : (
        /* List view mode */
        <Paper sx={{ borderRadius: 2 }}>
          <List disablePadding>
            {filteredOrders.map((order, index) => {
              const isNew = !viewedOrders.includes(order.id);
              return (
                <React.Fragment key={order.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    button
                    onClick={() => handleOrderSelect(order)}
                    sx={{
                      py: 2,
                      backgroundColor: isNew ? 'rgba(255, 152, 0, 0.08)' : 'transparent',
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={1}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          #{order.id}
                        </Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Chip
                          icon={getStatusIcon(order.status)}
                          label={order.statusText}
                          size="small"
                          color={getStatusColor(order.status)}
                        />
                      </Grid>
                      <Grid item xs={2}>
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(order.createdAt), 'HH:mm')}
                        </Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant="body2">
                          {order.user?.name || "Client"}
                        </Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {formatPrice(order.totalPrice)}
                        </Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusEdit(order);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          {isNew && (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                markOrderAsViewed(order.id);
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        </Paper>
      )}
      
      {/* Order details dialog */}
      <Dialog
        open={orderDetailsOpen}
        onClose={() => setOrderDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        {selectedOrder && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Commande #{selectedOrder.id}
                </Typography>
                <IconButton onClick={() => setOrderDetailsOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {/* Header with pickup time and status */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {selectedOrder.takeoutTime ? (
                      `À emporter à ${format(new Date(selectedOrder.takeoutTime), 'HH:mm')}`
                    ) : selectedOrder.OrderType === 'takeout' ? (
                      'ASAP - Dès que possible'
                    ) : (
                      'Livraison'
                    )}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    icon={getStatusIcon(selectedOrder.status)}
                    label={selectedOrder.statusText}
                    color={getStatusColor(selectedOrder.status)}
                  />
                  <IconButton size="small" onClick={() => handleStatusEdit(selectedOrder)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* Articles commandés - Main focus */}
              <Paper sx={{ p: 3, mb: 3, backgroundColor: 'rgba(255, 152, 0, 0.05)' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                  Articles commandés
                </Typography>
                
                <List sx={{ py: 0 }}>
                  {selectedOrder.items.map((item) => {
                    const itemDetails = formatItemDetails(item);
                    
                    return (
                      <Box key={item.id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {item.quantity}x {item.plat ? item.plat.name : item.sauce.name}
                              {item.versionSize && (
                                <Chip
                                  label={item.versionSize}
                                  size="small"
                                  variant="outlined"
                                  sx={{ ml: 1, height: '20px', fontSize: '0.7rem' }}
                                />
                              )}
                            </Typography>
                            {itemDetails.length > 0 && (
                              <Box sx={{ mt: 0.5, pl: 1, borderLeft: '2px solid rgba(255, 152, 0, 0.3)' }}>
                                {itemDetails.map((detail, index) => (
                                  <Typography
                                    key={index}
                                    variant="body2"
                                    sx={{ color: "text.secondary", fontSize: '0.85rem', mb: 0.25 }}
                                  >
                                    • {detail}
                                  </Typography>
                                ))}
                              </Box>
                            )}
                          </Box>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main', ml: 2 }}>
                            {formatPrice(item.totalPrice)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </List>

                {/* Total */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  pt: 2,
                  borderTop: '2px solid',
                  borderColor: 'primary.main'
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Total
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {formatPrice(selectedOrder.totalPrice)}
                  </Typography>
                </Box>
              </Paper>

              {/* Expandable Sections */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* Client Information */}
                <Accordion 
                  expanded={modalExpandedSections.client || false}
                  onChange={() => setModalExpandedSections(prev => ({ ...prev, client: !prev.client }))}
                  sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Informations client
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Nom</Typography>
                        <Typography variant="body1">{selectedOrder.user?.name || "N/A"}</Typography>
                      </Box>
                      
                      {selectedOrder.user?.phone && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">Téléphone</Typography>
                          <Typography 
                            variant="body1" 
                            sx={{ display: 'flex', alignItems: 'center' }}
                          >
                            {selectedOrder.user.phone}
                            <IconButton 
                              size="small" 
                              color="primary" 
                              component="a" 
                              href={`tel:${selectedOrder.user.phone}`}
                              sx={{ ml: 1 }}
                            >
                              <PhoneIcon fontSize="small" />
                            </IconButton>
                          </Typography>
                        </Box>
                      )}
                      
                      {selectedOrder.user?.email && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">Email</Typography>
                          <Typography variant="body1">{selectedOrder.user.email}</Typography>
                        </Box>
                      )}
                      
                      {selectedOrder.deliveryAddress && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">Adresse de livraison</Typography>
                          <Typography variant="body1">{selectedOrder.deliveryAddress.street}</Typography>
                          <Typography variant="body1">
                            {selectedOrder.deliveryAddress.postalCode} {selectedOrder.deliveryAddress.city}
                          </Typography>
                          {selectedOrder.deliveryAddress.country && (
                            <Typography variant="body1">{selectedOrder.deliveryAddress.country}</Typography>
                          )}
                        </Box>
                      )}
                      
                      {selectedOrder.clientMessage && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">Message du client</Typography>
                          <Paper sx={{ p: 2, mt: 1, backgroundColor: 'rgba(255, 152, 0, 0.05)' }}>
                            <Typography variant="body2">{selectedOrder.clientMessage}</Typography>
                          </Paper>
                        </Box>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {/* Order Details */}
                <Accordion 
                  expanded={modalExpandedSections.details || false}
                  onChange={() => setModalExpandedSections(prev => ({ ...prev, details: !prev.details }))}
                  sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Détails de la commande
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Date de commande</Typography>
                        <Typography variant="body1">
                          {format(new Date(selectedOrder.createdAt), 'dd MMMM yyyy HH:mm')}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary">Type de commande</Typography>
                        <Typography variant="body1">
                          {selectedOrder.OrderType === 'takeout' ? 'À emporter' : 'Livraison'}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {/* Status History */}
                {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                  <Accordion 
                    expanded={modalExpandedSections.history || false}
                    onChange={() => setModalExpandedSections(prev => ({ ...prev, history: !prev.history }))}
                    sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Historique des statuts
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {selectedOrder.statusHistory.map((status, index) => (
                          <Box key={index} sx={{ p: 1, borderLeft: '3px solid', borderColor: 'primary.main', backgroundColor: 'rgba(255, 152, 0, 0.05)' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {status.status}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(status.timestamp), 'dd/MM/yyyy HH:mm')}
                            </Typography>
                            {status.notes && (
                              <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                {status.notes}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOrderDetailsOpen(false)}>Fermer</Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => handleStatusEdit(selectedOrder)}
              >
                Modifier le statut
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Status edit dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Modifier le statut de la commande</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="status-select-label">Statut</InputLabel>
            <Select
              labelId="status-select-label"
              value={newStatus}
              label="Statut"
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {statusOptions.map(option => (
                <MenuItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            margin="dense"
            label="Notes (optionnel)"
            fullWidth
            multiline
            rows={3}
            value={statusNotes}
            onChange={(e) => setStatusNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Annuler</Button>
          <Button onClick={updateOrderStatus} variant="contained" color="primary">
            Mettre à jour
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleNotificationClose} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
