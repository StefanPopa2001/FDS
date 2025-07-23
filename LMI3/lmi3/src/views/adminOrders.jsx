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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
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
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material"
import { styled, keyframes } from "@mui/material/styles"
import config from "../config.js"

const blink = keyframes`
  0% { 
    border-color: #ff9800; 
    box-shadow: 0 0 10px rgba(255, 152, 0, 0.4);
    transform: scale(1);
  }
  50% { 
    border-color: #f57c00; 
    box-shadow: 0 0 25px rgba(255, 152, 0, 0.8);
    transform: scale(1.02);
  }
  100% { 
    border-color: #ff9800; 
    box-shadow: 0 0 10px rgba(255, 152, 0, 0.4);
    transform: scale(1);
  }
`

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
          borderRadius: 12,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          background: "linear-gradient(145deg, rgba(26, 26, 26, 0.9), rgba(20, 20, 20, 0.9))",
          backdropFilter: "blur(10px)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 32px rgba(255, 152, 0, 0.15)",
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
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 600,
        },
        contained: {
          background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
          "&:hover": {
            background: "linear-gradient(45deg, #f57c00 30%, #ff9800 90%)",
          },
        },
        outlined: {
          borderColor: "rgba(255, 152, 0, 0.5)",
          "&:hover": {
            borderColor: "#ff9800",
            backgroundColor: "rgba(255, 152, 0, 0.1)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            "&:hover fieldset": {
              borderColor: "#ff9800",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#ff9800",
            },
          },
          "& .MuiInputLabel-root": {
            color: "#ff9800",
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#ff9800",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#ff9800",
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          background: "linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))",
          backdropFilter: "blur(20px)",
        },
      },
    },
  },
})

const StyledCard = styled(Card)(({ theme, isBlinking }) => ({
  marginBottom: theme.spacing(1.5),
  animation: isBlinking ? `${blink} 2s infinite` : "none",
  minHeight: "auto",
}))

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [statusFilter, setStatusFilter] = useState("all")
  const [expandedItems, setExpandedItems] = useState({})
  const [viewedOrders, setViewedOrders] = useState(new Set())
  const [editingStatus, setEditingStatus] = useState(null)
  const [newStatus, setNewStatus] = useState("")
  const [statusNotes, setStatusNotes] = useState("")

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const statusOptions = [
    { value: "all", label: "Toutes les commandes" },
    { value: 0, label: "En attente" },
    { value: 1, label: "Confirmée" },
    { value: 2, label: "En préparation" },
    { value: 3, label: "Prête" },
    { value: 4, label: "En livraison" },
    { value: 5, label: "Livrée" },
    { value: 6, label: "Terminée" },
    { value: 7, label: "Annulée" },
  ]

  const statusLabels = {
    0: "En attente",
    1: "Confirmée",
    2: "En préparation",
    3: "Prête",
    4: "En livraison",
    5: "Livrée",
    6: "Terminée",
    7: "Annulée",
  }

  useEffect(() => {
    fetchOrders()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [page, statusFilter])

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
        limit: "10",
      })

      if (statusFilter !== "all") {
        queryParams.append("status", statusFilter.toString())
      }

      const response = await fetch(`${config.API_URL}/admin/orders?${queryParams}`, {
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

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value)
    setPage(1)
  }

  const toggleItemExpansion = (orderId, itemId) => {
    const key = `${orderId}-${itemId}`
    setExpandedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const markOrderAsViewed = (orderId) => {
    setViewedOrders((prev) => new Set([...prev, orderId]))
  }

  const handleStatusEdit = (order) => {
    setEditingStatus(order.id)
    setNewStatus(order.status)
    setStatusNotes("")
  }

  const handleStatusUpdate = async () => {
    try {
      const token = localStorage.getItem("authToken")
      const response = await fetch(`${config.API_URL}/admin/orders/${editingStatus}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: Number.parseInt(newStatus),
          notes: statusNotes,
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du statut")
      }

      // Refresh orders
      await fetchOrders()
      setEditingStatus(null)
      setNewStatus("")
      setStatusNotes("")
    } catch (error) {
      console.error("Error updating status:", error)
      alert("Erreur lors de la mise à jour du statut")
    }
  }

  const formatPrice = (price) => {
    return `${price.toFixed(2)}€`
  }

  const formatItemDetails = (item) => {
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

    return details
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 0:
        return <TimeIcon />
      case 1:
      case 2:
      case 3:
        return <RestaurantIcon />
      case 4:
        return <ShippingIcon />
      case 5:
      case 6:
        return <CheckIcon />
      case 7:
        return <CancelIcon />
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

  const shouldBlink = (order) => {
    return order.status === 0 && !viewedOrders.has(order.id)
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
          <Container maxWidth="xl">
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress sx={{ color: "primary.main" }} />
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
        <Container maxWidth="xl">
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
                mb: 3,
                display: "flex",
                alignItems: "center",
                gap: 2,
                fontSize: { xs: "1.8rem", md: "2.2rem" },
              }}
            >
              <RestaurantIcon sx={{ fontSize: { xs: 28, md: 36 }, color: "primary.main" }} />
              Gestion des commandes
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

          <Fade in timeout={1200}>
            <Paper
              sx={{
                mb: 3,
                p: 2,
                borderRadius: 2,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                alignItems: { xs: "stretch", sm: "center" },
              }}
            >
              <FormControl sx={{ minWidth: { xs: "100%", sm: 200 } }}>
                <InputLabel>Filtrer par statut</InputLabel>
                <Select value={statusFilter} onChange={handleStatusFilterChange} label="Filtrer par statut">
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button variant="outlined" onClick={fetchOrders} startIcon={<RefreshIcon />}>
                Actualiser
              </Button>
            </Paper>
          </Fade>

          {orders.length === 0 ? (
            <Fade in timeout={1400}>
              <Paper
                sx={{
                  p: { xs: 3, md: 6 },
                  textAlign: "center",
                  borderRadius: 3,
                }}
              >
                <ReceiptIcon sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Aucune commande trouvée
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {statusFilter === "all"
                    ? "Aucune commande n'a été passée."
                    : "Aucune commande trouvée avec ce statut."}
                </Typography>
              </Paper>
            </Fade>
          ) : (
            <>
              {orders.map((order, index) => (
                <Fade in timeout={1000 + index * 100} key={order.id}>
                  <StyledCard isBlinking={shouldBlink(order)}>
                    <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={2}>
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
                              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
                                #{order.id}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                                {order.formattedDate}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={6} md={2}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={order.statusText}
                              color={getStatusColor(order.status)}
                              size="small"
                              sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => handleStatusEdit(order)}
                              sx={{ color: "primary.main" }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Grid>

                        <Grid item xs={6} sm={6} md={2}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                            Client
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 700, fontSize: "0.9rem" }}>
                            {order.user?.name || "Client supprimé"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                            {order.user?.phone}
                          </Typography>
                        </Grid>

                        <Grid item xs={6} sm={6} md={2}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                            Total
                          </Typography>
                          <Typography variant="h6" sx={{ color: "primary.main", fontWeight: 700, fontSize: "1.1rem" }}>
                            {formatPrice(order.finalTotal || order.totalPrice)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                            {order.items.length} article{order.items.length > 1 ? "s" : ""}
                          </Typography>
                        </Grid>

                        <Grid item xs={8} md={3}>
                          {order.deliveryAddress && (
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                                Livraison
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.85rem" }}>
                                {order.deliveryAddress.street}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.85rem" }}>
                                {order.deliveryAddress.city} {order.deliveryAddress.postalCode}
                              </Typography>
                            </Box>
                          )}
                        </Grid>

                        <Grid item xs={4} md={1}>
                          <IconButton onClick={() => markOrderAsViewed(order.id)} sx={{ color: "primary.main" }}>
                            <VisibilityIcon />
                          </IconButton>
                        </Grid>
                      </Grid>

                      {/* Quick Order Summary for Staff */}
                      <Box
                        sx={{
                          mt: 2,
                          p: 1.5,
                          backgroundColor: "rgba(255, 152, 0, 0.05)",
                          borderRadius: 2,
                          border: "1px solid rgba(255, 152, 0, 0.2)",
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main", mb: 1 }}>
                          Résumé rapide:
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {order.items.map((item, idx) => (
                            <Chip
                              key={idx}
                              label={`${item.quantity}x ${item.plat.name}${
                                formatItemDetails(item).length > 0 ? " (modifié)" : ""
                              }`}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: formatItemDetails(item).length > 0 ? "warning.main" : "primary.main",
                                color: formatItemDetails(item).length > 0 ? "warning.main" : "primary.main",
                                fontSize: "0.75rem",
                              }}
                            />
                          ))}
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2, backgroundColor: "rgba(255, 255, 255, 0.1)" }} />

                      <Accordion>
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon sx={{ color: "primary.main" }} />}
                          sx={{ padding: 0, minHeight: "auto" }}
                        >
                          <Typography variant="body2" sx={{ color: "primary.main", fontWeight: 700 }}>
                            Voir les détails complets
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ padding: 0, pt: 2 }}>
                          <Grid container spacing={3}>
                            {/* Customer Information */}
                            <Grid item xs={12} md={4}>
                              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 2, fontSize: "1rem" }}>
                                <PersonIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                                Informations client
                              </Typography>
                              <Box
                                sx={{
                                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                                  p: 2,
                                  borderRadius: 2,
                                  border: "1px solid rgba(255, 255, 255, 0.08)",
                                }}
                              >
                                <Typography variant="body2" sx={{ mb: 1, fontSize: "0.85rem" }}>
                                  <strong>Nom:</strong> {order.user?.name || "N/A"}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1, fontSize: "0.85rem" }}>
                                  <strong>Email:</strong> {order.user?.email || "N/A"}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1, fontSize: "0.85rem" }}>
                                  <PhoneIcon sx={{ mr: 1, verticalAlign: "middle", fontSize: 16 }} />
                                  {order.user?.phone || "N/A"}
                                </Typography>
                                {order.deliveryAddress && (
                                  <Box sx={{ mt: 2 }}>
                                    <Typography variant="body2" sx={{ mb: 1, fontSize: "0.85rem" }}>
                                      <LocationIcon sx={{ mr: 1, verticalAlign: "middle", fontSize: 16 }} />
                                      <strong>Adresse de livraison:</strong>
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{ color: "text.secondary", ml: 3, fontSize: "0.8rem" }}
                                    >
                                      {order.deliveryAddress.street}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{ color: "text.secondary", ml: 3, fontSize: "0.8rem" }}
                                    >
                                      {order.deliveryAddress.city} {order.deliveryAddress.postalCode}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{ color: "text.secondary", ml: 3, fontSize: "0.8rem" }}
                                    >
                                      {order.deliveryAddress.country}
                                    </Typography>
                                  </Box>
                                )}
                                <Typography variant="body2" sx={{ mt: 2, fontSize: "0.85rem" }}>
                                  <strong>Paiement:</strong> {order.paymentMethod}
                                </Typography>
                                {order.message && (
                                  <Typography variant="body2" sx={{ mt: 1, fontSize: "0.85rem" }}>
                                    <strong>Message:</strong> {order.message}
                                  </Typography>
                                )}
                              </Box>
                            </Grid>

                            {/* Order Items */}
                            <Grid item xs={12} md={8}>
                              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 2, fontSize: "1rem" }}>
                                Articles commandés
                              </Typography>

                              <List sx={{ p: 0 }}>
                                {order.items.map((item) => {
                                  const itemKey = `${order.id}-${item.id}`
                                  const isExpanded = expandedItems[itemKey]
                                  const itemDetails = formatItemDetails(item)

                                  return (
                                    <ListItem
                                      key={item.id}
                                      sx={{
                                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                                        borderRadius: 2,
                                        mb: 1,
                                        flexDirection: "column",
                                        alignItems: "stretch",
                                        border: "1px solid rgba(255, 255, 255, 0.08)",
                                        p: 1.5,
                                      }}
                                    >
                                      <Box
                                        display="flex"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        width="100%"
                                      >
                                        <ListItemText
                                          primary={
                                            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                              <Typography variant="body1" sx={{ fontWeight: 700, fontSize: "0.9rem" }}>
                                                {item.plat.name}
                                              </Typography>
                                              {item.quantity > 1 && (
                                                <Chip
                                                  label={`x${item.quantity}`}
                                                  size="small"
                                                  color="primary"
                                                  sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                                                />
                                              )}
                                              {itemDetails.length > 0 && (
                                                <Chip
                                                  label="MODIFIÉ"
                                                  size="small"
                                                  color="warning"
                                                  sx={{ fontWeight: 600, fontSize: "0.65rem" }}
                                                />
                                              )}
                                            </Box>
                                          }
                                          secondary={
                                            <Typography
                                              variant="body2"
                                              color="text.secondary"
                                              sx={{ fontSize: "0.8rem" }}
                                            >
                                              {formatPrice(item.unitPrice)}
                                              {item.quantity > 1 && ` (${formatPrice(item.totalPrice)} total)`}
                                            </Typography>
                                          }
                                        />

                                        {itemDetails.length > 0 && (
                                          <IconButton
                                            onClick={() => toggleItemExpansion(order.id, item.id)}
                                            sx={{ color: "primary.main" }}
                                            size="small"
                                          >
                                            {isExpanded ? <ExpandLess /> : <ExpandMore />}
                                          </IconButton>
                                        )}
                                      </Box>

                                      {itemDetails.length > 0 && (
                                        <Collapse in={isExpanded}>
                                          <Box
                                            sx={{
                                              mt: 1,
                                              pl: 2,
                                              borderLeft: "3px solid",
                                              borderColor: "primary.main",
                                              backgroundColor: "rgba(255, 152, 0, 0.05)",
                                              borderRadius: 1,
                                              p: 1.5,
                                            }}
                                          >
                                            <Typography
                                              variant="body2"
                                              sx={{ color: "primary.main", fontWeight: 700, mb: 1, fontSize: "0.8rem" }}
                                            >
                                              MODIFICATIONS:
                                            </Typography>
                                            {itemDetails.map((detail, index) => (
                                              <Typography
                                                key={index}
                                                variant="body2"
                                                sx={{ color: "text.secondary", mb: 0.5, fontSize: "0.8rem" }}
                                              >
                                                • {detail}
                                              </Typography>
                                            ))}
                                          </Box>
                                        </Collapse>
                                      )}
                                    </ListItem>
                                  )
                                })}
                              </List>

                              {/* Order Summary */}
                              <Box
                                sx={{
                                  mt: 3,
                                  p: 2,
                                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                                  borderRadius: 2,
                                  border: "1px solid rgba(255, 255, 255, 0.08)",
                                }}
                              >
                                <Typography variant="h6" sx={{ color: "primary.main", mb: 2, fontSize: "1rem" }}>
                                  Résumé de la commande
                                </Typography>
                                <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                                  <Typography sx={{ fontSize: "0.85rem" }}>Sous-total:</Typography>
                                  <Typography sx={{ fontSize: "0.85rem" }}>{formatPrice(order.totalPrice)}</Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                                  <Typography sx={{ fontSize: "0.85rem" }}>Frais de livraison:</Typography>
                                  <Typography sx={{ fontSize: "0.85rem" }}>
                                    {formatPrice(order.deliveryFee || 0)}
                                  </Typography>
                                </Box>
                                {order.tipAmount > 0 && (
                                  <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                                    <Typography sx={{ fontSize: "0.85rem" }}>Pourboire:</Typography>
                                    <Typography sx={{ fontSize: "0.85rem" }}>{formatPrice(order.tipAmount)}</Typography>
                                  </Box>
                                )}
                                <Divider sx={{ my: 1, backgroundColor: "rgba(255, 255, 255, 0.2)" }} />
                                <Box display="flex" justifyContent="space-between">
                                  <Typography
                                    variant="h6"
                                    sx={{ color: "primary.main", fontWeight: 700, fontSize: "1rem" }}
                                  >
                                    Total:
                                  </Typography>
                                  <Typography
                                    variant="h6"
                                    sx={{ color: "primary.main", fontWeight: 700, fontSize: "1rem" }}
                                  >
                                    {formatPrice(order.finalTotal || order.totalPrice)}
                                  </Typography>
                                </Box>
                              </Box>

                              {/* Status History */}
                              {order.statusHistory && order.statusHistory.length > 0 && (
                                <Box sx={{ mt: 3 }}>
                                  <Typography
                                    variant="h6"
                                    gutterBottom
                                    sx={{ fontWeight: 700, mb: 2, fontSize: "1rem" }}
                                  >
                                    Historique du statut
                                  </Typography>
                                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                    {order.statusHistory.map((status, index) => (
                                      <Chip
                                        key={index}
                                        label={`${status.status} - ${new Date(status.timestamp).toLocaleDateString(
                                          "fr-FR",
                                          {
                                            day: "2-digit",
                                            month: "2-digit",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          },
                                        )}`}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                          borderColor: "rgba(255, 152, 0, 0.3)",
                                          color: "text.secondary",
                                          fontSize: "0.7rem",
                                        }}
                                      />
                                    ))}
                                  </Box>
                                </Box>
                              )}
                            </Grid>
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    </CardContent>
                  </StyledCard>
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
                      sx={{
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
                      }}
                    />
                  </Box>
                </Fade>
              )}
            </>
          )}

          {/* Status Edit Dialog */}
          <Dialog open={!!editingStatus} onClose={() => setEditingStatus(null)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ color: "primary.main" }}>Modifier le statut de la commande</DialogTitle>
            <DialogContent>
              <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                <InputLabel>Nouveau statut</InputLabel>
                <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} label="Nouveau statut">
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Notes (optionnel)"
                multiline
                rows={3}
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditingStatus(null)} color="inherit">
                Annuler
              </Button>
              <Button onClick={handleStatusUpdate} variant="contained">
                Mettre à jour
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </ThemeProvider>
  )
}
