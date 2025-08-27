"use client"

import { useState, useEffect } from "react"
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
  Fade,
  useMediaQuery,
  useTheme,
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
} from "@mui/icons-material"
import config from "../config.js"

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
          background: "linear-gradient(145deg, rgba(26, 26, 26, 0.9), rgba(20, 20, 20, 0.9))",
          backdropFilter: "blur(10px)",
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
          background: "linear-gradient(145deg, rgba(26, 26, 26, 0.9), rgba(20, 20, 20, 0.9))",
          backdropFilter: "blur(10px)",
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
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [expandedItems, setExpandedItems] = useState({})

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  useEffect(() => {
    fetchOrders()
  }, [page])

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        throw new Error("Non authentifié")
      }

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "5",
      })

      const response = await fetch(`${config.API_URL}/users/orders?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des commandes")
      }

      const data = await response.json()
      setOrders(data.orders)
      setPagination(data.pagination)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (event, newPage) => {
    setPage(newPage)
  }

  const toggleItemExpansion = (orderId, itemId) => {
    const key = `${orderId}-${itemId}`
    setExpandedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const formatPrice = (price) => {
    return `${price.toFixed(2)}€`
  }

  const formatItemDetails = (item) => {
    const details = []

    // Show version/size if available
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

    // Show added extras with better formatting
    if (item.addedExtras && item.addedExtras.length > 0) {
      const extras = item.addedExtras.map((e) => `${e.extra.nom || e.extra.name} (+€${e.price.toFixed(2)})`).join(", ")
      details.push(`Extras ajoutés: ${extras}`)
    }

    if (item.removedIngredients && item.removedIngredients.length > 0) {
      const removed = item.removedIngredients.map((r) => r.ingredient.name).join(", ")
      details.push(`Sans: ${removed}`)
    }

    return details
  }

  const getStatusIcon = (status) => {
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
  }

  const getStatusColor = (status) => {
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
  }

  if (loading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
            py: 4,
          }}
        >
          <Container maxWidth="lg">
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress sx={{ color: "#ff9800" }} />
            </Box>
          </Container>
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
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          <Fade in timeout={800}>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 800,
                background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
                backgroundClip: "text",
                textFillColor: "transparent",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 4,
                display: "flex",
                alignItems: "center",
                gap: 2,
                fontSize: { xs: "2rem", md: "2.5rem" },
              }}
            >
              <ReceiptIcon sx={{ fontSize: { xs: 32, md: 40 }, color: "primary.main" }} />
              Historique des commandes
            </Typography>
          </Fade>

          {error && (
            <Fade in timeout={1000}>
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
            </Fade>
          )}

          {orders.length === 0 ? (
            <Fade in timeout={1200}>
              <Paper
                sx={{
                  p: { xs: 3, md: 6 },
                  textAlign: "center",
                  borderRadius: 3,
                }}
              >
                <ShoppingBagIcon sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Aucune commande trouvée
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Vous n'avez pas encore passé de commande.
                </Typography>
              </Paper>
            </Fade>
          ) : (
            <>
              {orders.map((order, index) => (
                <Fade in timeout={1000 + index * 200} key={order.id}>
                  <Card sx={{ mb: 4 }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
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
                              {order.items.length} article{order.items.length > 1 ? "s" : ""}
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid item xs={12} md={2}>
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Type de commande
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {order.OrderType === 'takeout' ? 'À emporter' : 'Livraison'}
                            </Typography>
                            {order.takeoutTime ? (
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {new Date(order.takeoutTime).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Typography>
                            ) : order.OrderType === 'takeout' ? (
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                ASAP
                              </Typography>
                            ) : null}
                          </Box>
                        </Grid>
                      </Grid>

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
                                onClick={() => {
                                  const timelineKey = `timeline-${order.id}`;
                                  setExpandedItems(prev => ({
                                    ...prev,
                                    [timelineKey]: !prev[timelineKey]
                                  }));
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
                                {new Date(order.statusHistory[0].timestamp).toLocaleDateString("fr-FR", {
                                  day: "2-digit",
                                  month: "2-digit",
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

                          {/* Expandable Full Timeline */}
                          {order.statusHistory.length > 1 && (
                            <Collapse in={expandedItems[`timeline-${order.id}`]}>
                              <Box sx={{ position: 'relative', pl: 3, borderLeft: '2px solid rgba(255, 152, 0, 0.3)', ml: '10px' }}>
                                {order.statusHistory.slice(1).map((status, index) => (
                                  <Box key={index} sx={{ position: 'relative', mb: 2, display: 'flex', alignItems: 'center' }}>
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        left: '-15px',
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(255, 152, 0, 0.5)',
                                        border: '2px solid rgba(255, 152, 0, 0.5)',
                                      }}
                                    />
                                    <Box sx={{ ml: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {status.status}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {new Date(status.timestamp).toLocaleDateString("fr-FR", {
                                          day: "2-digit",
                                          month: "2-digit",
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

                      <Divider sx={{ my: 3, backgroundColor: "rgba(255, 255, 255, 0.1)" }} />

                      {/* Compact Articles Section - Single Expandable */}
                      <Accordion sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon sx={{ color: "primary.main" }} />}
                          sx={{ padding: 0, minHeight: "auto" }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                              Articles commandés ({order.items.length})
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
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: itemDetails.length > 0 ? 1 : 0 }}>
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
                                    </Box>
                                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main', ml: 2 }}>
                                      {formatPrice(item.totalPrice)}
                                    </Typography>
                                  </Box>
                                  
                                  {/* Item Details */}
                                  {itemDetails.length > 0 && (
                                    <Box sx={{ pl: 1, borderLeft: '2px solid rgba(255, 152, 0, 0.3)' }}>
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
                              );
                            })}
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    </CardContent>
                  </Card>
                </Fade>
              ))}

              {pagination.totalPages > 1 && (
                <Fade in timeout={1500}>
                  <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
                    <Pagination
                      count={pagination.totalPages}
                      page={page}
                      onChange={handlePageChange}
                      color="primary"
                      size={isMobile ? "small" : "medium"}
                    />
                  </Box>
                </Fade>
              )}
            </>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  )
}
