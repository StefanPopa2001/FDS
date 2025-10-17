"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Pagination,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Collapse,
  Paper,
  ThemeProvider,
  createTheme,
  CssBaseline,
  useMediaQuery,
  useTheme,
  Button,
  Tabs,
  Tab,
} from "@mui/material"
import {
  ExpandMore as ExpandMoreIcon,
  Receipt as ReceiptIcon,
  Restaurant as RestaurantIcon,
  LocalShipping as ShippingIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  AccessTime as TimeIcon,
  ExpandLess,
  ExpandMore,
  ShoppingBag as ShoppingBagIcon,
  Chat as ChatIcon,
} from "@mui/icons-material"
import OrderChat from "../components/OrderChat"
import config from "../config.js"
import { useBasket } from '../contexts/BasketContext';
import { useNotifications } from '../contexts/NotificationContext';

// Format price for display
const formatPrice = (price) => {
  return `${price.toFixed(2)}€`;
};

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#ff9800",
      light: "#ffb74d",
      dark: "#f57c00",
    },
    secondary: {
      main: "#f44336",
    },
    background: {
      default: "#0a0a0a",
      paper: "#1a1a1a",
    },
    text: {
      primary: "#ffffff",
      secondary: "#b0b0b0",
    },
    success: {
      main: "#4caf50",
    },
    error: {
      main: "#f44336",
    },
    warning: {
      main: "#ff9800",
    },
    info: {
      main: "#2196f3",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h6: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(26, 26, 26, 0.9)",
          backdropFilter: "none",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 12px 40px rgba(255, 152, 0, 0.15)",
            border: "1px solid rgba(255, 152, 0, 0.2)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(26, 26, 26, 0.9)",
          backdropFilter: "none",
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
          boxShadow: "none",
          "&:before": {
            display: "none",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiPagination: {
      styleOverrides: {
        root: {
          "& .MuiPaginationItem-root": {
            color: "white",
            borderColor: "rgba(255, 255, 255, 0.2)",
            "&:hover": {
              backgroundColor: "rgba(255, 152, 0, 0.1)",
              borderColor: "#ff9800",
            },
            "&.Mui-selected": {
              backgroundColor: "#ff9800",
              color: "black",
              fontWeight: 700,
              "&:hover": {
                backgroundColor: "#f57c00",
              },
            },
          },
        },
      },
    },
  },
})

export default function OrderHistory() {
  const [activeOrders, setActiveOrders] = useState([])
  const [archivedOrders, setArchivedOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activePage, setActivePage] = useState(1)
  const [archivedPage, setArchivedPage] = useState(1)
  const [activePagination, setActivePagination] = useState({})
  const [archivedPagination, setArchivedPagination] = useState({})
  const [expandedItems, setExpandedItems] = useState({})
  const [chatOpen, setChatOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [userId, setUserId] = useState(null)
  const [activeTab, setActiveTab] = useState(0)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const { getItemDisplayName: _getItemDisplayName } = useBasket()
  
  // Get notification refresh function
  let refreshNotifications;
  try {
    const notifications = useNotifications();
    refreshNotifications = notifications.refreshNotifications;
  } catch (error) {
    // Context not available, notifications won't be refreshed
    console.log('Notification context not available in OrderHistory');
  }

  const getOrderItemName = useCallback((item) => {
    // Prefer explicit fields returned by the API
    if (item.plat && item.plat.name) return item.plat.name
    if (item.sauce && item.sauce.name) return item.sauce.name
    if (item.extra && (item.extra.nom || item.extra.name)) return item.extra.nom || item.extra.name
    if (item.platSauce && item.platSauce.name) return item.platSauce.name
    if (item.versionSize) return item.versionSize
    // Fallback to basket helper if available
    try {
      return _getItemDisplayName(item)
    } catch (e) {
      return 'Article'
    }
  }, [_getItemDisplayName])

  const TabPanel = (props) => {
    const { children, value, index, ...other } = props
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`order-tabpanel-${index}`}
        aria-labelledby={`order-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
      </div>
    )
  }

  useEffect(() => {
    // Get user ID from token
    const token = localStorage.getItem("authToken")
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUserId(payload.userId)
      } catch (error) {
        console.error('Error parsing token:', error)
      }
    }
  }, [])

  useEffect(() => {
    fetchAllOrders()
  }, [activePage, archivedPage])

  // Refresh notifications when component mounts and when orders are fetched
  useEffect(() => {
    if (refreshNotifications) {
      console.log('OrderHistory: Refreshing notifications');
      refreshNotifications();
    }
  }, [refreshNotifications]);

  // Also refresh notifications after fetching orders
  useEffect(() => {
    if (refreshNotifications && !loading) {
      console.log('OrderHistory: Orders loaded, refreshing notifications');
      refreshNotifications();
    }
  }, [refreshNotifications, loading]);

  const fetchAllOrders = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("authToken")
      if (!token) return

      // Helper: safely parse JSON only when content-type indicates JSON
      const safeParse = async (res) => {
        if (!res || !res.headers) return null;
        const ct = res.headers.get('content-type') || '';
        if (!ct.toLowerCase().includes('application/json')) {
          console.warn('Non-JSON response received:', { status: res.status, contentType: ct });
          return null;
        }
        try {
          return await res.json();
        } catch (e) {
          console.error('JSON parse error:', e);
          return null;
        }
      };

      // Fetch all orders
      const response = await fetch(`${config.API_URL}/users/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await safeParse(response);
        if (!data || !data.orders) {
          console.error('Invalid response from server');
          return;
        }
        const allOrders = data.orders

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0]

        // Filter orders by date
        const todayOrders = allOrders.filter(order => {
          const orderDate = new Date(order.createdAt).toISOString().split('T')[0]
          return orderDate === today
        })

        const olderOrders = allOrders.filter(order => {
          const orderDate = new Date(order.createdAt).toISOString().split('T')[0]
          return orderDate !== today
        })

        // Paginate the filtered results
        const activeStart = (activePage - 1) * 5
        const activeEnd = activeStart + 5
        const archivedStart = (archivedPage - 1) * 5
        const archivedEnd = archivedStart + 5

        setActiveOrders(todayOrders.slice(activeStart, activeEnd))
        setArchivedOrders(olderOrders.slice(archivedStart, archivedEnd))

        // Set pagination info
        setActivePagination({
          totalOrders: todayOrders.length,
          totalPages: Math.ceil(todayOrders.length / 5),
          currentPage: activePage,
          hasNext: activeEnd < todayOrders.length,
          hasPrev: activePage > 1
        })

        setArchivedPagination({
          totalOrders: olderOrders.length,
          totalPages: Math.ceil(olderOrders.length / 5),
          currentPage: archivedPage,
          hasNext: archivedEnd < olderOrders.length,
          hasPrev: archivedPage > 1
        })
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError('Erreur lors du chargement des commandes')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case 0:
        return <TimeIcon /> // En attente
      case 1:
      case 2:
      case 3:
        return <RestaurantIcon /> // Confirmée, En préparation, Prête
      case 4:
        return <ShippingIcon /> // En livraison
      case 5:
      case 6:
        return <CheckIcon /> // Livrée, Terminée
      case 7:
        return <CancelIcon /> // Annulée
      default:
        return <ReceiptIcon />
    }
  }, [])

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 0:
        return "warning"
      case 1:
        return "info"
      case 2:
        return "warning"
      case 3:
        return "success"
      case 4:
        return "primary"
      case 5:
      case 6:
        return "success"
      case 7:
        return "error"
      default:
        return "default"
    }
  }, [])

  const handleActivePageChange = useCallback((event, newPage) => {
    setActivePage(newPage)
  }, [])

  const handleArchivedPageChange = useCallback((event, newPage) => {
    setArchivedPage(newPage)
  }, [])

  const openChat = useCallback((orderId) => {
    setSelectedOrderId(orderId)
    setChatOpen(true)
  }, [])

  const closeChat = useCallback(() => {
    setChatOpen(false)
    setSelectedOrderId(null)
  }, [])

  const toggleTimelineExpansion = useCallback((orderId) => {
    const timelineKey = `timeline-${orderId}`
    setExpandedItems(prev => ({
      ...prev,
      [timelineKey]: !prev[timelineKey]
    }))
  }, [])

  const handleChatClick = useCallback((event, orderId) => {
    event.preventDefault()
    event.stopPropagation()
    openChat(orderId)
  }, [openChat])

  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue)
  }, [])

  const formatItemDetails = useCallback((item) => {
    const details = []

    if (item.versionSize) {
      details.push(`Taille: ${item.versionSize}`)
    }

    if (item.sauce) {
      details.push(`Sauce: ${item.sauce.name}`)
    }

    if (item.extra) {
      details.push(`Extra: ${item.extra.nom || item.extra.name}`)
    }

    if (item.platSauce) {
      details.push(`Sauce plat: ${item.platSauce.name}`)
    }

    if (item.addedExtras && item.addedExtras.length > 0) {
      const extras = item.addedExtras.map((e) => `${e.extra.nom || e.extra.name} (+€${e.price.toFixed(2)})`).join(", ")
      details.push(`Extras ajoutés: ${extras}`)
    }

    if (item.removedIngredients && item.removedIngredients.length > 0) {
      const removed = item.removedIngredients.map((r) => r.ingredient.name).join(", ")
      details.push(`Sans: ${removed}`)
    }

    // Add item message if it exists
    if (item.message && item.message.trim()) {
      details.push(`💬 Message: ${item.message}`)
    }

    return details
  }, [])

  const renderOrders = useCallback((orders, pagination, page, handlePageChange, emptyMessage) => {
    if (orders.length === 0) {
      return (
        <Paper
          sx={{
            p: { xs: 3, md: 6 },
            textAlign: "center",
            borderRadius: 3,
          }}
        >
          <ShoppingBagIcon sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
            {emptyMessage}
          </Typography>
        </Paper>
      )
    }

    return (
      <>
        {orders.map((order) => (
          <Card key={order.id} sx={{ mb: 4 }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              {/* Mobile View: Compact Header */}
              {isMobile ? (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Commande #{order.id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.formattedDate}
                      </Typography>
                    </Box>
                    <Chip
                      label={order.statusText}
                      color={getStatusColor(order.status)}
                      icon={getStatusIcon(order.status)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ color: "primary.main", fontWeight: 700 }}>
                      {formatPrice(order.totalPrice)}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ChatIcon />}
                      onClick={(event) => handleChatClick(event, order.id)}
                      sx={{
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        }
                      }}
                    >
                      Chat
                    </Button>
                  </Box>
                </Box>
              ) : (
                // Desktop View: Full Header
                <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          backgroundColor: "rgba(255, 152, 0, 0.1)",
                          color: "primary.main",
                        }}
                      >
                        {getStatusIcon(order.status)}
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          Commande #{order.id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {order.formattedDate}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Statut actuel
                      </Typography>
                      <Chip
                        label={order.statusText}
                        color={getStatusColor(order.status)}
                        icon={getStatusIcon(order.status)}
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={6} md={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Total
                      </Typography>
                      <Typography variant="h6" sx={{ color: "primary.main", fontWeight: 700 }}>
                        {formatPrice(order.totalPrice)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={6} md={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Articles
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {order.items.reduce((s, it) => s + (it.quantity || 0), 0)} article{order.items.reduce((s, it) => s + (it.quantity || 0), 0) > 1 ? "s" : ""}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Button
                        variant="outlined"
                        startIcon={<ChatIcon />}
                        onClick={(event) => handleChatClick(event, order.id)}
                        sx={{
                          borderColor: 'primary.main',
                          color: 'primary.main',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 152, 0, 0.1)',
                          }
                        }}
                      >
                        Chat
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              )}

              {/* Admin Message Section */}
              {order.restaurantMessage && (
                <Box sx={{ mb: 3, p: 2, borderRadius: 2, backgroundColor: "rgba(255, 152, 0, 0.1)", border: "1px solid rgba(255, 152, 0, 0.3)" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main", mb: 1 }}>
                    Message du restaurant
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    {order.restaurantMessage}
                  </Typography>
                </Box>
              )}

              {/* Status History - Latest Status with Expandable Timeline */}
              {order.statusHistory && order.statusHistory.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Suivi de la commande
                    </Typography>
                    {order.statusHistory.length > 1 && (
                      <IconButton
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          toggleTimelineExpansion(order.id);
                        }}
                        size="small"
                        sx={{ color: "primary.main" }}
                      >
                        {expandedItems[`timeline-${order.id}`] ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    )}
                  </Box>
                  
                  {/* Latest Status Always Visible */}
                  <Box sx={{ position: 'relative', pl: 3, mb: 2 }}>
                    <Box
                      sx={{
                        position: 'absolute',
                        left: '10px',
                        top: '8px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                        border: '2px solid',
                        borderColor: 'primary.main',
                      }}
                    />
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {order.statusHistory[0].status}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(order.statusHistory[0].timestamp).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                      {order.statusHistory[0].notes && (
                        <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', color: 'text.secondary' }}>
                          Note: {order.statusHistory[0].notes}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Timeline History - Collapsible */}
                  {order.statusHistory.length > 1 && (
                    <Collapse in={expandedItems[`timeline-${order.id}`]}>
                      <Box sx={{ position: 'relative', pl: 3 }}>
                        <Box
                          sx={{
                            position: 'absolute',
                            left: '15px',
                            top: 0,
                            bottom: 0,
                            width: '2px',
                            backgroundColor: 'rgba(255, 152, 0, 0.3)',
                          }}
                        />
                        {order.statusHistory.slice(1).map((status, idx) => (
                          <Box key={idx} sx={{ position: 'relative', mb: 2 }}>
                            <Box
                              sx={{
                                position: 'absolute',
                                left: '-5px',
                                top: '8px',
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: 'background.paper',
                                border: '2px solid rgba(255, 152, 0, 0.6)',
                              }}
                            />
                            <Box sx={{ ml: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {status.status}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(status.timestamp).toLocaleString("fr-FR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </Typography>
                              {status.notes && (
                                <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', color: 'text.secondary' }}>
                                  Note: {status.notes}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Collapse>
                  )}
                </Box>
              )}

              {/* Client Message Section */}
              {order.clientMessage && order.clientMessage.trim() && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.palette.info.main}10 0%, ${theme.palette.info.main}05 100%)`,
                    border: `1px solid ${theme.palette.info.main}20`,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.info.main, fontSize: "0.85rem" }}>
                    💬 Message du client:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 400, fontSize: "0.85rem", lineHeight: 1.4, color: "text.primary" }}>
                    {order.clientMessage}
                  </Typography>
                </Box>
              )}

              {/* Restaurant Message Section */}
              {order.restaurantMessage && order.restaurantMessage.trim() && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.palette.success.main}10 0%, ${theme.palette.success.main}05 100%)`,
                    border: `1px solid ${theme.palette.success.main}20`,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.success.main, fontSize: "0.85rem" }}>
                    🏪 Message du restaurant:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 400, fontSize: "0.85rem", lineHeight: 1.4, color: "text.primary" }}>
                    {order.restaurantMessage}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 3, backgroundColor: "rgba(255, 255, 255, 0.1)" }} />

              {/* Compact Articles Section - Single Expandable */}
              <Accordion sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: "primary.main" }} />}
                  sx={{ padding: 0, minHeight: "auto" }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Articles commandés ({order.items.reduce((s, it) => s + (it.quantity || 0), 0)})
                    </Typography>
                    <Typography variant="h6" sx={{ color: "primary.main", fontWeight: 700 }}>
                      {formatPrice(order.totalPrice)}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ padding: 0, pt: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {order.items.map((item) => {
                      const itemDetails = formatItemDetails(item);
                      return (
                        <Box
                          key={item.id}
                          sx={{
                            p: 2,
                            borderRadius: 1,
                            backgroundColor: "rgba(255, 255, 255, 0.02)",
                            border: "1px solid rgba(255, 255, 255, 0.05)",
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {getOrderItemName(item)}
                            </Typography>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                x{item.quantity}
                              </Typography>
                              <Typography variant="body2" sx={{ color: "primary.main", fontWeight: 700 }}>
                                {formatPrice(item.totalPrice)}
                              </Typography>
                            </Box>
                          </Box>
                          {itemDetails.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: "text.secondary", fontSize: "0.8rem" }}>
                                📝 Détails:
                              </Typography>
                              {itemDetails.map((detail, index) => (
                                <Typography
                                  key={index}
                                  variant="body2"
                                  sx={{
                                    fontWeight: 400,
                                    mb: 0.3,
                                    fontSize: "0.8rem",
                                    color: "text.primary",
                                  }}
                                >
                                  • {detail}
                                </Typography>
                              ))}
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        ))}
        <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
          <Pagination
            count={pagination.totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size={isMobile ? "small" : "medium"}
          />
        </Box>
      </>
    )
  }, [isMobile, formatItemDetails, getOrderItemName, getStatusIcon, getStatusColor, handleChatClick, toggleTimelineExpansion, expandedItems, formatPrice])

  if (loading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          p: { xs: 2, sm: 3 },
          backgroundColor: "background.default",
        }}
      >
        <Container maxWidth="lg">
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                backgroundColor: "rgba(244, 67, 54, 0.1)",
                border: "1px solid #f44336",
                borderRadius: 2,
              }}
            >
              {error}
            </Alert>
          )}

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="order tabs">
              <Tab 
                label={`Aujourd'hui (${activePagination.totalOrders || 0})`} 
                sx={{ fontWeight: 600 }}
              />
              <Tab 
                label={`Historique (${archivedPagination.totalOrders || 0})`} 
                sx={{ fontWeight: 600 }}
              />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            {renderOrders(
              activeOrders, 
              activePagination, 
              activePage, 
              handleActivePageChange,
              "Aucune commande aujourd'hui"
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {renderOrders(
              archivedOrders, 
              archivedPagination, 
              archivedPage, 
              handleArchivedPageChange,
              "Aucune commande archivée"
            )}
          </TabPanel>
        </Container>
      </Box>

      {/* Order Chat Dialog */}
      <OrderChat
        open={chatOpen}
        onClose={closeChat}
        orderId={selectedOrderId}
        userId={userId}
        userType="client"
      />
    </ThemeProvider>
  )
}
