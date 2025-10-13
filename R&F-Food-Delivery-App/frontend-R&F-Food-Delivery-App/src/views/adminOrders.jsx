"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
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
  Paper,
  Divider,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
  Snackbar,
  Drawer,
  useTheme,
  useMediaQuery,
} from "@mui/material"
import { alpha } from "@mui/material/styles"
import {
  LocalDining as LocalDiningIcon,
  Phone as PhoneIcon,
  AccessTime as TimeIcon,
  Check as CheckIcon,
  LocalShipping as LocalShippingIcon,
  Done as DoneIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Chat as ChatIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
  Archive as ArchiveIcon,
} from "@mui/icons-material"
import { useAuth } from "../contexts/AuthContext"
import { format, isSameDay, differenceInMinutes } from "date-fns"
import config from "../config"
import OrderChat from "../components/OrderChat"

// Sound notification
const notificationSound = new Audio("/notification.mp3")

export default function AdminOrders() {
  const { token } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  // Refs for scrolling to specific time sections
  const timeRefs = useRef({})

  // State for orders and UI
  const [orders, setOrders] = useState([])
  const [orderHours, setOrderHours] = useState([])
  const [settings, setSettings] = useState({})
  const [hoursDrawerOpen, setHoursDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [showArchived, setShowArchived] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [hiddenHours, setHiddenHours] = useState(new Set()) // Track hidden hours
  const [viewedOrders, setViewedOrders] = useState(() => {
    const saved = localStorage.getItem("viewedOrders")
    return saved ? JSON.parse(saved) : []
  })
  const [viewMode, setViewMode] = useState("cards") // 'cards' or 'list'
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [editingOrderId, setEditingOrderId] = useState(null)
  const [newStatus, setNewStatus] = useState("")
  const [statusNotes, setStatusNotes] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [notification, setNotification] = useState({ open: false, message: "", severity: "info" })
  const [expandedItems, setExpandedItems] = useState({})
  const [modalExpandedSections, setModalExpandedSections] = useState({})
  const [chatOpen, setChatOpen] = useState(false)
  const [chatOrderId, setChatOrderId] = useState(null)
  const [modalTab, setModalTab] = useState(0)

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    setRefreshing(true)
    try {
  let queryParams = "?"

      if (statusFilter !== "all") {
        queryParams += `status=${statusFilter}&`
      }
      if (showArchived) {
        queryParams += `includeArchived=true&`
      }

      const response = await fetch(`${config.API_URL}/admin/orders${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des commandes")
      }

      const data = await response.json()
      setOrders(data.orders)
      setError(null)
    } catch (err) {
      console.error("Error fetching orders:", err)
      setError("Impossible de charger les commandes. Veuillez réessayer.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token, statusFilter, showArchived])

  // Toggle include archived orders in admin view
  const handleShowArchivedChange = (event) => {
    setShowArchived(event.target.checked)
  }

  // Toggle archived status for a specific order
  const toggleOrderArchived = async (orderId, archived) => {
    try {
      const res = await fetch(`${config.API_URL}/admin/orders/${orderId}/archived`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ archived })
      })

      if (!res.ok) {
        throw new Error('Failed to update archived flag')
      }

      // Optimistic UI: refresh orders
      fetchOrders()
    } catch (err) {
      console.error('Error toggling archived:', err)
      setNotification({ open: true, message: "Erreur lors de la modification de l'état archivé", severity: 'error' })
    }
  }

  // Initial fetch and auto-refresh setup
  useEffect(() => {
    if (!token) return

    // Initial fetch
    fetchOrders()

    // Set up polling interval
    const interval = setInterval(() => {
      console.log('Auto-refreshing orders...')
      fetchOrders()
    }, 30000) // 30 seconds

    // Cleanup interval on unmount
    return () => {
      clearInterval(interval)
    }
  }, [token, statusFilter, showArchived]) // Remove fetchOrders from dependencies to avoid circular dependency

  // Refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && token) {
        console.log('Page became visible, refreshing orders')
        fetchOrders()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [token]) // Remove fetchOrders from dependencies to avoid circular dependency

  // Save viewed orders to localStorage
  useEffect(() => {
    localStorage.setItem("viewedOrders", JSON.stringify(viewedOrders))
  }, [viewedOrders])

  // Fetch order hours and settings for admin controls
  useEffect(() => {
    if (!token) return
    const getAuthHeaders = () => {
      const t = localStorage.getItem("authToken")
      return t ? { Authorization: `Bearer ${t}` } : {}
    }

    const fetchOrderHours = async () => {
      try {
        const res = await fetch(`${config.API_URL}/order-hours`, { headers: getAuthHeaders() })
        if (res.ok) {
          const data = await res.json()
          setOrderHours(data)
        }
      } catch (err) {
        console.error("Error fetching order hours:", err)
      }
    }

    const fetchSettings = async () => {
      try {
        const res = await fetch(`${config.API_URL}/settings`, { headers: getAuthHeaders() })
        if (res.ok) {
          const data = await res.json()
          // Lazy normalize: convert 'true'/'false' to booleans and numeric strings to numbers
          const map = {}
          data.forEach((s) => {
            let v = s.value
            if (v === 'true') v = true
            else if (v === 'false') v = false
            else if (!isNaN(v) && v !== '') v = Number(v)
            map[s.key] = v
          })
          setSettings(map)
        }
      } catch (err) {
        console.error("Error fetching settings:", err)
      }
    }

    fetchOrderHours()
    fetchSettings()
  }, [token])

  // Handle status filter change
  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value)
  }

  // Mark an order as viewed
  const handleQuickStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${config.API_URL}/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          restaurantMessage: "",
        }),
      })

      if (response.ok) {
        fetchOrders() // Refresh the orders
        console.log("Statut mis à jour avec succès")
      } else {
        console.error("Erreur lors de la mise à jour du statut")
      }
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const markOrderAsViewed = (orderId) => {
    if (!viewedOrders.includes(orderId)) {
      setViewedOrders([...viewedOrders, orderId])
    }
  }

  // Change status directly from a card
  const handleCardStatusChange = async (orderId, newStatus) => {
    // optimistic UI update
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: Number(newStatus) } : o)))
    try {
      await handleQuickStatusUpdate(orderId, Number(newStatus))
    } catch (err) {
      // On error, you might want to refetch or revert; simple refetch for now
      fetchOrders()
    }
  }

  // Handle order selection for details view
  const handleOrderSelect = (order) => {
    setSelectedOrder(order)
    setOrderDetailsOpen(true)
    markOrderAsViewed(order.id)
  }

  // Handle status edit dialog
  const handleStatusEdit = (order) => {
    setEditingOrderId(order.id)
    setNewStatus(order.status.toString())
    setStatusNotes("")
    setStatusDialogOpen(true)
  }

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
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du statut")
      }

      setStatusDialogOpen(false)

      // Show success notification
      setNotification({
        open: true,
        message: "Statut de la commande mis à jour avec succès",
        severity: "success",
      })

      // Refresh orders
      fetchOrders()
    } catch (error) {
      console.error("Error updating status:", error)
      setNotification({
        open: true,
        message: "Erreur lors de la mise à jour du statut",
        severity: "error",
      })
    }
  }

  // Format price for display
  const formatPrice = (price) => {
    return `${price.toFixed(2)}€`
  }

  // Format item details for display
  const formatItemDetails = (item) => {
    const details = []

    if (item.versionSize) {
      details.push(
        <Box key="version" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography variant="body2" sx={{ fontSize: "0.8rem", fontWeight: 500, color: theme.palette.info.main }}>
            📏 Taille: {item.versionSize}
          </Typography>
        </Box>
      )
    }

    if (item.sauce) {
      details.push(
        <Box key="sauce" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography variant="body2" sx={{ fontSize: "0.8rem", fontWeight: 500, color: theme.palette.secondary.main }}>
            🥄 Sauce: {item.sauce.name}
          </Typography>
        </Box>
      )
    }

    if (item.extra) {
      details.push(
        <Box key="extra" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography variant="body2" sx={{ fontSize: "0.8rem", fontWeight: 500, color: theme.palette.warning.main }}>
            ➕ Extra: {item.extra.nom || item.extra.name}
          </Typography>
        </Box>
      )
    }

    if (item.platSauce) {
      details.push(
        <Box key="platSauce" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography variant="body2" sx={{ fontSize: "0.8rem", fontWeight: 500, color: theme.palette.secondary.main }}>
            🍯 Sauce plat: {item.platSauce.name}
          </Typography>
        </Box>
      )
    }

    if (item.addedExtras && item.addedExtras.length > 0) {
      const extras = item.addedExtras.map((e) => `${e.extra.nom || e.extra.name} (+€${e.price.toFixed(2)})`).join(", ")
      details.push(
        <Box key="added" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography variant="body2" sx={{ fontSize: "0.8rem", fontWeight: 600, color: theme.palette.success.main }}>
            ➕ Extras ajoutés: {extras}
          </Typography>
        </Box>
      )
    }

    if (item.removedIngredients && item.removedIngredients.length > 0) {
      const removed = item.removedIngredients.map((r) => r.ingredient.name).join(", ")
      details.push(
        <Box key="removed" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography variant="body2" sx={{ fontSize: "0.8rem", fontWeight: 600, color: theme.palette.error.main }}>
            ❌ Sans: {removed}
          </Typography>
        </Box>
      )
    }

    // Add item message if it exists
    if (item.message && item.message.trim()) {
      details.push(
        <Box key="message" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
          <Typography variant="body2" sx={{ fontSize: "0.8rem", fontWeight: 500, color: theme.palette.info.main }}>
            💬 Message: {item.message}
          </Typography>
        </Box>
      )
    }

    return details
  }

  // Check if item has actual modifications (not just version/sauce selection)
  const hasItemModifications = (item) => {
    return (
      (item.addedExtras && item.addedExtras.length > 0) ||
      (item.removedIngredients && item.removedIngredients.length > 0)
    )
  }

  // Get color for status chip
  const getStatusColor = (status) => {
    const statusColors = {
      0: "#f57c00", // Amber - En attente
      1: "#1976d2", // Blue - Confirmée
      2: "#388e3c", // Green - En préparation
      3: "#7b1fa2", // Purple - Prête
      4: "#0097a7", // Teal - En livraison
      5: "#455a64", // Blue Grey - Livrée
      6: "#2e7d32", // Dark Green - Terminée
      7: "#d32f2f", // Red - Annulée
    }
    return statusColors[status] || "#757575"
  }

  // Get emoji for status
  const getStatusEmoji = (status) => {
    switch (Number.parseInt(status)) {
      case 0:
        return "⏳" // En attente - Hourglass
      case 1:
        return "✅" // Confirmée - Check mark
      case 2:
        return "�‍🍳" // En préparation - Chef
      case 3:
        return "�" // Prête - Package
      case 4:
        return "�" // En livraison - Delivery truck
      case 5:
        return "🏠" // Livrée - House
      case 6:
        return "🎉" // Terminée - Celebration
      case 7:
        return "❌" // Annulée - Cross mark
      default:
        return "❓"
    }
  }

  // Determine if an item has any associated image (plat image or selected version image)
  const itemHasAnyImage = (item) => {
    // Only plat items are relevant for this check
    if (!item || !item.plat) return false

    const platImage = item.plat.image
    if (platImage) return true

    const versions = Array.isArray(item.plat.versions) ? item.plat.versions : []

    // Try to match the selected version using likely keys
    let selectedVersion = null
    if (item.versionId) {
      selectedVersion = versions.find((v) => v.id === item.versionId)
    }
    if (!selectedVersion && item.versionSize) {
      const target = String(item.versionSize).toLowerCase()
      selectedVersion = versions.find((v) => {
        const candidates = [v?.size, v?.name, v?.label, v?.taille]
          .filter(Boolean)
          .map((x) => String(x).toLowerCase())
        return candidates.includes(target)
      })
    }

    const versionImage = selectedVersion?.image
    return Boolean(versionImage)
  }

  // Show a small camera icon when both plat image and the ordered version image are missing
  const shouldShowMissingImageIcon = (item) => {
    if (!item?.plat) return false
    return !itemHasAnyImage(item)
  }

  // Status options for dropdown
  const statusOptions = [
    { value: 0, label: "⏳ En attente" },
    { value: 1, label: "✅ Confirmée" },
    { value: 2, label: "👨‍🍳 En préparation" },
    { value: 3, label: "📦 Prête" },
    { value: 4, label: "🚚 En livraison" },
    { value: 5, label: "🏠 Livrée" },
    { value: 6, label: "🎉 Terminée" },
    { value: 7, label: "❌ Annulée" },
  ]

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
  }

  // Toggle item expansion
  const toggleItemExpansion = (orderId, itemId) => {
    const key = `${orderId}-${itemId}`
    setExpandedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  // Filter orders by date
  const filteredOrders = useMemo(() => {
    if (!orders.length) return []

    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt)
      return isSameDay(orderDate, selectedDate)
    })
  }, [orders, selectedDate])

  // Group orders by time slot
  const groupedOrders = useMemo(() => {
    const groups = {
      asap: [], // ASAP orders (takeoutTime is null)
      hours: {}, // Orders grouped by specific delivery hour
    }

    filteredOrders.forEach((order) => {
      // Check if this is an ASAP order (no takeoutTime)
      if (!order.takeoutTime && order.OrderType === "takeout") {
        groups.asap.push(order)
        return
      }

      if (order.takeoutTime) {
        const takeoutDate = new Date(order.takeoutTime)
        const hour = takeoutDate.getHours()
        const minute = takeoutDate.getMinutes()
        const timeKey = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`

        if (!groups.hours[timeKey]) {
          groups.hours[timeKey] = []
        }
        groups.hours[timeKey].push(order)
      }
    })

    // Sort hours
    const sortedHours = Object.keys(groups.hours).sort()
    const sortedGroupsHours = {}
    sortedHours.forEach((hour) => {
      sortedGroupsHours[hour] = groups.hours[hour]
    })
    groups.hours = sortedGroupsHours

    return groups
  }, [filteredOrders])

  // Calculate unfinished orders count for each time slot
  const hourStats = useMemo(() => {
    const stats = {}

    // ASAP orders count (unfinished)
    const asapUnfinished = groupedOrders.asap.filter((order) => ![4, 5, 6, 7].includes(order.status)).length
    if (asapUnfinished > 0) {
      stats.asap = asapUnfinished
    }

    // Hours count (unfinished)
    Object.keys(groupedOrders.hours).forEach((hour) => {
      const unfinished = groupedOrders.hours[hour].filter((order) => ![4, 5, 6, 7].includes(order.status)).length
      if (unfinished > 0) {
        stats[hour] = unfinished
      }
    })

    return stats
  }, [groupedOrders])

  // Scroll to specific time section
  const scrollToTimeSection = (timeKey) => {
    const element = timeRefs.current[timeKey]
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      })
    }
  }

  // Toggle hour visibility
  const toggleHourVisibility = (hour) => {
    setHiddenHours((prev) => {
      const newHidden = new Set(prev)
      if (newHidden.has(hour)) {
        newHidden.delete(hour)
      } else {
        newHidden.add(hour)
      }
      return newHidden
    })
  }

  // Function to get status-based border color
  const getStatusBorderColor = (status) => {
    switch (status) {
      case 0:
        return "#ff7043" // Orange - New/Pending
      case 1:
        return "#2196f3" // Blue - Confirmed
      case 2:
        return "#4caf50" // Green - In Preparation
      case 3:
        return "#9c27b0" // Purple - Ready
      case 4:
        return "#00bcd4" // Cyan - Completed
      case 5:
        return "#607d8b" // Blue Grey - Delivered
      case 6:
        return "#4caf50" // Green - Terminated
      case 7:
        return "#f44336" // Red - Cancelled
      default:
        return "#9e9e9e" // Grey - Default
    }
  }

  // Function to render an order card
  const renderOrderCard = (order) => {
    const isNew = !viewedOrders.includes(order.id)
    const isAsap = !order.takeoutTime && order.OrderType === "takeout"
    const orderTime = new Date(order.createdAt)
    const timeSinceOrder = differenceInMinutes(new Date(), orderTime)
  const statusColor = getStatusColor(order.status)
  const statusBorderColor = getStatusBorderColor(order.status)
    const isCompleted = [5, 6, 7].includes(order.status)
    const hasModifications = order.items.some((item) => hasItemModifications(item))

    const readyItems = order.items.filter((item) => item.isReady).length
    const totalItems = order.items.length
    const allItemsReady = readyItems === totalItems

    return (
      <Card
        sx={{
          mb: 2,
          borderRadius: 3,
          position: "relative",
          border: `2px solid ${statusBorderColor}`,
          boxShadow: isNew ? "0 0 15px rgba(245, 124, 0, 0.4)" : "0 2px 8px rgba(0, 0, 0, 0.2)",
          height: "380px",
          width: "280px",
          display: "flex",
          flexDirection: "column",
          cursor: "pointer",
          background: isCompleted ? theme.palette.action.disabledBackground : theme.palette.background.paper,
          color: theme.palette.text.primary,
          opacity: isCompleted ? 0.85 : 1,
          transition: "all 0.2s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: isNew ? "0 0 20px rgba(245, 124, 0, 0.5)" : "0 4px 12px rgba(0, 0, 0, 0.3)",
          },
        }}
        onClick={() => handleOrderSelect(order)}
      >
        {isNew && (
          <Box
            sx={{
              position: "absolute",
              top: -6,
              right: -6,
              width: 20,
              height: 20,
              borderRadius: "50%",
              backgroundColor: "#f57c00",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "bold",
              fontSize: "10px",
              zIndex: 2,
              animation: "pulse 2s infinite",
              "@keyframes pulse": {
                "0%": { transform: "scale(1)" },
                "50%": { transform: "scale(1.1)" },
                "100%": { transform: "scale(1)" },
              },
            }}
          >
            !
          </Box>
        )}

        <CardContent sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: statusColor, fontSize: "1.25rem" }}>
              #{order.id}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}
                 onClick={(e) => e.stopPropagation()}>
              <Select
                value={order.status}
                onChange={(e) => {
                  handleCardStatusChange(order.id, e.target.value)
                }}
                size="small"
                sx={{
                  backgroundColor: statusColor,
                  color: theme.palette.getContrastText(statusColor),
                  fontWeight: 700,
                  height: 34,
                  width: "160px",
                  borderRadius: 2,
                  "& .MuiSelect-select": { 
                    padding: "6px 26px 6px 10px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  },
                }}
              >
                {statusOptions.map((opt) => (
                  <MenuItem 
                    key={opt.value} 
                    value={opt.value}
                    sx={{
                      whiteSpace: "nowrap",
                      minWidth: "160px",
                      fontSize: "0.875rem"
                    }}
                  >
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
              {(order.status === 5 || order.status === 6 || order.status === 7) && (
                <IconButton
                  size="small"
                  sx={{ ml: 1 }}
                  onClick={async (e) => {
                    e.stopPropagation()
                    // Toggle archived state for this order
                    await toggleOrderArchived(order.id, !order.archived)
                  }}
                  title={order.archived ? 'Désarchiver' : 'Archiver'}
                >
                  <ArchiveIcon color={order.archived ? 'disabled' : 'action'} />
                </IconButton>
              )}
            </Box>
          </Box>

          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500, fontSize: "0.8rem" }}>
              {order.takeoutTime ? format(new Date(order.takeoutTime), "HH:mm") : "ASAP"} • {order.OrderType === "takeout" ? "À emporter" : "Livraison"}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.5, fontSize: "1.3rem" }}>
              {order.user?.name || "Client"}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {formatPrice(order.totalPrice)} • {order.items.reduce((total, item) => total + item.quantity, 0)} articles
            </Typography>
          </Box>

          {/* Items list - show all and make scrollable with larger area */}
          <Box 
            sx={{ 
              mb: 2, 
              height: "140px", 
              overflow: "hidden",
              display: "flex",
              flexDirection: "column"
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "text.secondary", fontSize: "0.95rem" }}>
              Articles:
            </Typography>
            <Box sx={{ overflowY: "auto", flex: 1, pr: 1 }}>
              {order.items.map((item) => {
                const hasAdded = item.addedExtras && item.addedExtras.length > 0
                const hasRemoved = item.removedIngredients && item.removedIngredients.length > 0
                const hasMessage = item.message && item.message.trim()
                const hasMod = hasAdded || hasRemoved || hasMessage

                return (
                  <Box key={item.id} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: "0.95rem",
                        color: item.isReady ? theme.palette.success.main : theme.palette.text.secondary,
                        fontWeight: item.isReady ? 700 : 500,
                      }}
                    >
                      {item.isReady ? "✅" : "⏳"} {item.quantity}× {item.plat ? item.plat.name : item.sauce?.name || "Article"}
                    </Typography>
                    {shouldShowMissingImageIcon(item) && (
                      <PhotoCameraIcon fontSize="small" sx={{ color: theme.palette.text.secondary, opacity: 0.7 }} />
                    )}
                    {hasMod && (
                      <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
                        {hasAdded && <Typography variant="caption" sx={{ color: theme.palette.success.main, fontSize: '0.7rem' }}>➕</Typography>}
                        {hasRemoved && <Typography variant="caption" sx={{ color: theme.palette.error.main, fontSize: '0.7rem' }}>❌</Typography>}
                        {hasMessage && <Typography variant="caption" sx={{ color: theme.palette.info.main, fontSize: '0.7rem' }}>💬</Typography>}
                      </Box>
                    )}
                  </Box>
                )
              })}
            </Box>
          </Box>

          <Box sx={{ mt: "auto" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Articles prêts:
              </Typography>
              <Chip
                label={`${readyItems}/${totalItems}`}
                size="small"
                sx={{
                  backgroundColor: allItemsReady ? theme.palette.success.main : theme.palette.warning.main,
                  color: theme.palette.getContrastText(allItemsReady ? theme.palette.success.main : theme.palette.warning.main),
                  fontWeight: 600,
                }}
              />
            </Box>

            <Box
              sx={{
                width: "100%",
                height: 6,
                  backgroundColor: theme.palette.action.disabledBackground,
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: `${(readyItems / totalItems) * 100}%`,
                  height: "100%",
                    backgroundColor: allItemsReady ? theme.palette.success.main : theme.palette.warning.main,
                  transition: "width 0.3s ease",
                }}
              />
            </Box>
          </Box>

          {hasModifications && (
            <Box
              sx={{
                position: "absolute",
                top: 8,
                left: 8,
                backgroundColor: theme.palette.error.main,
                color: theme.palette.getContrastText(theme.palette.error.main),
                borderRadius: "50%",
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              ⚠
            </Box>
          )}
        </CardContent>
      </Card>
    )
  }

  // Render time slot section
  const renderTimeSlot = (title, orders) => {
    if (!orders.length) return null

    const isAsapSection = title.includes("ASAP")
    const timeKey = isAsapSection ? "asap" : title
    const isHidden = hiddenHours.has(timeKey)
    const urgentCount = orders.filter((order) => !viewedOrders.includes(order.id)).length

    return (
      <Box ref={(el) => (timeRefs.current[timeKey] = el)} sx={{ mb: 4 }} id={`time-section-${timeKey}`}>
        <Paper
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 3,
            background: isAsapSection
              ? theme.palette.background.paper
              : theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            border: `1px solid ${theme.palette.divider}`,
            borderLeft: `4px solid ${isAsapSection ? theme.palette.error.main : theme.palette.info.main}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  fontSize: "1.5rem",
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                {isAsapSection ? "🚨 ASAP" : `🕐 ${title}`}
              </Typography>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Chip
                  label={`${orders.length} commandes`}
                  sx={{
                    backgroundColor: alpha(theme.palette.background.default, 0.8),
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    height: "28px",
                  }}
                />
                {urgentCount > 0 && (
                  <Chip
                    label={`${urgentCount} nouvelles`}
                    sx={{
                      backgroundColor: theme.palette.error.main,
                      color: theme.palette.getContrastText(theme.palette.error.main),
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      height: "28px",
                      animation: "pulse 2s infinite",
                    }}
                  />
                )}
              </Box>
            </Box>

            <IconButton
              onClick={() => toggleHourVisibility(timeKey)}
              sx={{
                color: theme.palette.text.primary,
                backgroundColor: alpha(theme.palette.background.default, 0.8),
                "&:hover": {
                  backgroundColor: alpha(theme.palette.background.default, 0.9),
                },
                width: 36,
                height: 36,
              }}
            >
              {isHidden ? <ExpandMoreIcon sx={{ fontSize: "1.5rem" }} /> : <ExpandLessIcon sx={{ fontSize: "1.5rem" }} />}
            </IconButton>
          </Box>
        </Paper>

        {!isHidden && (
          <Grid container spacing={3}>
            {orders.map((order) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={order.id}>
                {renderOrderCard(order)}
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    )
  }

  // Handle notification close
  const handleNotificationClose = (event, reason) => {
    if (reason === "clickaway") {
      return
    }
    setNotification({ ...notification, open: false })
  }

  const getStatusLabel = (status) => {
    return statusLabels[status] || "Inconnu"
  }

  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
      <Paper
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 3,
          background: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
            Commandes Restaurant
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Chip
              label="Auto-actualisation activée"
              sx={{
                backgroundColor: theme.palette.success.main,
                color: theme.palette.getContrastText(theme.palette.success.main),
                fontWeight: 600,
              }}
            />

            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={fetchOrders}
              disabled={refreshing}
              sx={{
                borderRadius: 2,
                px: 2,
                py: 1,
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              {refreshing ? "Actualisation..." : "Actualiser"}
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", mb: 2 }}>
          <TextField
            label="Date"
            type="text"
            value={format(selectedDate, 'dd/MM/yyyy')}
            onChange={(e) => {
              const value = e.target.value;
              // Parse DD/MM/YYYY format
              const parts = value.split('/');
              if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1; // JS months are 0-based
                const year = parseInt(parts[2], 10);
                if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                  const newDate = new Date(year, month, day);
                  if (!isNaN(newDate.getTime())) {
                    setSelectedDate(newDate);
                  }
                }
              }
            }}
            variant="outlined"
            size="small"
            sx={{
              minWidth: "140px",
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                fontSize: "0.9rem",
              },
            }}
          />

          <FormControlLabel
            control={<Switch checked={showArchived} onChange={handleShowArchivedChange} />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ArchiveIcon fontSize="small" />
                Afficher archivés
              </Box>
            }
          />

          <FormControl size="small" sx={{ minWidth: "160px" }}>
            <InputLabel sx={{ fontSize: "0.9rem" }}>Filtrer par statut</InputLabel>
            <Select
              value={statusFilter}
              label="Filtrer par statut"
              onChange={handleStatusFilterChange}
              sx={{
                borderRadius: 2,
                fontSize: "0.9rem",
              }}
            >
              <MenuItem value="all" sx={{ fontSize: "0.9rem" }}>
                Tous les statuts
              </MenuItem>
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value.toString()} sx={{ fontSize: "0.9rem" }}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<ScheduleIcon />}
            onClick={() => setHoursDrawerOpen(true)}
            size="small"
            sx={{
              borderRadius: 2,
              fontSize: "0.9rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            Horaires
          </Button>
        </Box>

        {Object.keys(hourStats).length > 0 && (
          <Paper
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 2,
              background: theme.palette.background.default,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                mb: 3,
                fontWeight: 800,
                textAlign: "center",
                fontSize: "1.5rem",
              }}
            >
              ⏰ Navigation rapide - Commandes en attente
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {Object.entries(hourStats).map(([timeKey, count]) => (
                <Button
                  key={timeKey}
                  variant="contained"
                  onClick={() => scrollToTimeSection(timeKey)}
                  sx={{
                    minWidth: "120px",
                    height: "80px",
                    borderRadius: 4,
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `2px solid ${timeKey === "asap" ? theme.palette.error.main : theme.palette.info.main}`,
                    fontWeight: 600,
                    fontSize: "1rem",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.3s ease",
                    position: "relative",
                    "&:hover": {
                      transform: "translateY(-2px) scale(1.02)",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                      background: timeKey === "asap" ? theme.palette.error.main : theme.palette.info.main,
                      color: theme.palette.getContrastText(timeKey === "asap" ? theme.palette.error.main : theme.palette.info.main),
                    },
                  }}
                >
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: "1.2rem",
                        fontWeight: 800,
                        lineHeight: 1,
                      }}
                    >
                      {timeKey === "asap" ? "🚨 ASAP" : `🕐 ${timeKey}`}
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 900,
                        fontSize: "2rem",
                        lineHeight: 1,
                        mt: 0.5,
                      }}
                    >
                      {count}
                    </Typography>
                  </Box>
                </Button>
              ))}
            </Box>
          </Paper>
        )}

        {/* Display error if any */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3, fontSize: "1.1rem" }}>
            {error}
          </Alert>
        )}

        {/* Loading indicator */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : filteredOrders.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: "center", borderRadius: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
              📭 Aucune commande trouvée
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Essayez de changer la date ou le filtre de statut
            </Typography>
          </Paper>
        ) : (
          /* Simplified card view only (removed list view for simplicity) */
          <Box>
            {groupedOrders.asap.length > 0 && renderTimeSlot("ASAP - Dès que possible", groupedOrders.asap)}
            {Object.keys(groupedOrders.hours).map((hour) => renderTimeSlot(`${hour}`, groupedOrders.hours[hour]))}
          </Box>
        )}

        {/* Drawer for managing order hours and ASAP */}
        <Drawer anchor="right" open={hoursDrawerOpen} onClose={() => setHoursDrawerOpen(false)}>
          <Box sx={{ width: 400, p: 4, background: theme.palette.background.paper, height: "100%", color: theme.palette.text.primary }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                ⚙️ Gestion des créneaux
              </Typography>
              <IconButton onClick={() => setHoursDrawerOpen(false)} sx={{ color: "white" }}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: theme.palette.text.primary }}>
                🚨 ASAP
              </Typography>
                <FormControlLabel
                control={
                  <Switch
                    checked={!!settings.enableASAP}
                    onChange={async (e) => {
                      const checked = e.target.checked;
                      try {
                        const res = await fetch(`${config.API_URL}/settings/enableASAP`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                          // send boolean; backend will convert to string via toString()
                          body: JSON.stringify({ value: checked }),
                        })
                        if (res.ok) {
                          setSettings((prev) => ({ ...prev, enableASAP: checked }))
                        }
                      } catch (err) {
                        console.error("Error updating ASAP setting:", err)
                      }
                    }}
                    size="large"
                  />
                }
                label={
                  <Typography sx={{ fontSize: "1.2rem", fontWeight: 600 }}>
                    { !!settings.enableASAP ? "✅ ASAP activé" : "❌ ASAP désactivé" }
                  </Typography>
                }
              />
            </Box>

            <Divider sx={{ my: 3, backgroundColor: "rgba(255, 255, 255, 0.2)" }} />

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
                🕐 Créneaux horaires
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {orderHours.map((hour) => (
                  <Paper
                    key={hour.id}
                    sx={{
                      p: 3,
                      backgroundColor: alpha(theme.palette.background.paper, 0.06),
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Typography sx={{ fontWeight: 800, fontSize: "1.3rem", color: theme.palette.text.primary }}>{hour.time}</Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={hour.enabled}
                            onChange={async (e) => {
                              try {
                                const res = await fetch(`${config.API_URL}/order-hours/${hour.id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                  body: JSON.stringify({ time: hour.time, enabled: e.target.checked }),
                                })
                                if (res.ok) {
                                  const updated = await res.json()
                                  setOrderHours((prev) => prev.map((h) => (h.id === updated.id ? updated : h)))
                                }
                              } catch (err) {
                                console.error("Error updating hour:", err)
                              }
                            }}
                            size="large"
                          />
                        }
                        label={
                          <Typography sx={{ fontSize: "1.1rem", fontWeight: 600, color: "white" }}>
                            {hour.enabled ? "✅ Activé" : "❌ Désactivé"}
                          </Typography>
                        }
                      />
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Box>
          </Box>
        </Drawer>

        {/* Order details dialog */}
        <Dialog
          open={orderDetailsOpen}
          onClose={() => setOrderDetailsOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              width: "900px",
              maxWidth: "95vw",
              maxHeight: "90vh",
            },
          }}
        >
          {selectedOrder && (
            <>
              <DialogTitle sx={{ pb: 1, pt: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: getStatusColor(selectedOrder.status), lineHeight: 1 }}>
                      Commande #{selectedOrder.id}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.secondary", mt: 0.5 }}>
                      {selectedOrder.user?.name || "Client"} • {selectedOrder.takeoutTime ? format(new Date(selectedOrder.takeoutTime), "HH:mm") : "ASAP"}
                    </Typography>
                  </Box>

                  <IconButton onClick={() => setOrderDetailsOpen(false)} size="large" sx={{ alignSelf: "flex-start" }}>
                    <CloseIcon />
                  </IconButton>
                </Box>

                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: `linear-gradient(135deg, ${getStatusColor(selectedOrder.status)}15 0%, ${getStatusColor(selectedOrder.status)}08 100%)`,
                    border: `1px solid ${getStatusColor(selectedOrder.status)}30`,
                  }}
                >
                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                        {selectedOrder.takeoutTime ? format(new Date(selectedOrder.takeoutTime), "HH:mm") : "ASAP"}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {selectedOrder.OrderType === "takeout" ? "À emporter" : "Livraison"}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                        {formatPrice(selectedOrder.totalPrice)}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {selectedOrder.items.reduce((total, item) => total + item.quantity, 0)} articles
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        {selectedOrder.user?.name || "Client"}
                      </Typography>
                      {selectedOrder.user?.phone && (
                        <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                          <Button
                            variant="outlined"
                            startIcon={<PhoneIcon />}
                            href={`tel:${selectedOrder.user.phone}`}
                            size="small"
                            sx={{ borderRadius: 2 }}
                          >
                            {selectedOrder.user.phone}
                          </Button>
                        </Box>
                      )}
                      <Button
                        variant="contained"
                        onClick={() => {
                          setChatOrderId(selectedOrder.id)
                          setChatOpen(true)
                        }}
                        startIcon={<ChatIcon />}
                        size="small"
                        sx={{ borderRadius: 2 }}
                      >
                        Chat client
                      </Button>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth>
                        <Select
                          value={selectedOrder.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            // Update local state immediately for UI feedback
                            setSelectedOrder(prev => ({ ...prev, status: newStatus }));
                            // Then update on server
                            await handleQuickStatusUpdate(selectedOrder.id, newStatus);
                          }}
                          sx={{
                            fontSize: "1rem",
                            fontWeight: 700,
                            borderRadius: 2,
                            height: "48px",
                            backgroundColor: getStatusColor(selectedOrder.status),
                            color: "white",
                            "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                            "& .MuiSelect-icon": { color: "white" },
                          }}
                        >
                          <MenuItem value={0}>⏳ En attente</MenuItem>
                          <MenuItem value={1}>✅​ Confirmée</MenuItem>
                          <MenuItem value={2}>👨‍🍳​ En préparation</MenuItem>
                          <MenuItem value={3}>📦​ Prête</MenuItem>
                          <MenuItem value={4}>🚗​ En livraison</MenuItem>
                          <MenuItem value={5}>🏠 Livrée</MenuItem>
                          <MenuItem value={6}>🎉 Terminée</MenuItem>
                          <MenuItem value={7}>❌ Annulée</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>

                {/* Simple Message Line */}
                {selectedOrder.clientMessage && selectedOrder.clientMessage.trim() && (
                  <Typography variant="body2" sx={{ mt: 1, fontSize: "0.9rem", color: "text.secondary" }}>
                    Message client: {selectedOrder.clientMessage}
                  </Typography>
                )}
              </DialogTitle>

              <DialogContent dividers sx={{ p: 4, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
                  Articles à préparer
                </Typography>

                <Box sx={{ flex: 1, overflowY: "auto", pr: 1, minHeight: 0 }}>
                  {selectedOrder.items.map((item) => {
                    const itemDetails = formatItemDetails(item)
                    return (
                      <Paper
                        key={item.id}
                        sx={{
                          p: 3,
                          mb: 2,
                          borderRadius: 3,
                          border: item.isReady ? `2px solid ${theme.palette.success.main}` : `2px solid ${theme.palette.warning.main}`,
                          backgroundColor: item.isReady ? "rgba(76, 175, 80, 0.08)" : "rgba(255, 152, 0, 0.08)",
                          transition: "all 0.3s ease",
                          width: "100%",
                          boxSizing: "border-box",
                          overflow: "hidden",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                          <FormControlLabel
                            control={
                              <input
                                type="checkbox"
                                checked={!!item.isReady}
                                onChange={async (e) => {
                                  const checked = e.target.checked
                                  try {
                                    const token = localStorage.getItem("authToken")
                                    const res = await fetch(
                                      `${config.API_URL}/admin/orders/${selectedOrder.id}/items/${item.id}/ready`,
                                      {
                                        method: "PUT",
                                        headers: {
                                          "Content-Type": "application/json",
                                          Authorization: `Bearer ${token}`,
                                        },
                                        body: JSON.stringify({ isReady: checked }),
                                      },
                                    )
                                    if (res.ok) {
                                      setSelectedOrder((prev) => ({
                                        ...prev,
                                        items: prev.items.map((it) =>
                                          it.id === item.id ? { ...it, isReady: checked } : it,
                                        ),
                                      }))
                                      fetchOrders()
                                    }
                                  } catch (err) {
                                    console.error("Error updating item ready:", err)
                                  }
                                }}
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  accentColor: theme.palette.success.main,
                                }}
                              />
                            }
                            label=""
                            sx={{ mr: 0 }}
                          />

                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                <Typography
                                  component="span"
                                  sx={{
                                    color: getStatusColor(selectedOrder.status),
                                    fontSize: "1.3rem",
                                    mr: 1,
                                  }}
                                >
                                  {item.quantity}×
                                </Typography>
                                {item.plat ? item.plat.name : item.sauce.name}
                              </Typography>
                              {shouldShowMissingImageIcon(item) && (
                                <PhotoCameraIcon fontSize="small" sx={{ color: theme.palette.text.secondary, opacity: 0.7 }} />
                              )}
                            </Box>

                            {item.versionSize && (
                              <Chip
                                label={item.versionSize}
                                size="small"
                                sx={{
                                  mb: 1,
                                  fontWeight: 600,
                                  backgroundColor: "rgba(33, 150, 243, 0.2)",
                                  color: "#2196f3",
                                }}
                              />
                            )}

                            {itemDetails.length > 0 && (
                              <Box
                                sx={{
                                  mt: 1,
                                  p: 2,
                                  borderRadius: 2,
                                  backgroundColor: "rgba(255, 152, 0, 0.08)",
                                  border: "1px solid rgba(255, 152, 0, 0.15)",
                                }}
                              >
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: "text.secondary", fontSize: "0.8rem" }}>
                                  📝 Détails de la commande:
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                  {itemDetails}
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Paper>
                    )
                  })}
                </Box>
              </DialogContent>

              <DialogActions sx={{ p: 3, gap: 2 }}>
                <Button
                  onClick={() => setOrderDetailsOpen(false)}
                  variant="outlined"
                  size="large"
                  sx={{ borderRadius: 3, px: 4 }}
                >
                  Fermer
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Status edit dialog */}
        <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              ✏️ Modifier le statut
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ fontSize: "1.1rem" }}>Statut</InputLabel>
              <Select
                value={newStatus}
                label="Statut"
                onChange={(e) => setNewStatus(e.target.value)}
                sx={{
                  fontSize: "1.1rem",
                  borderRadius: 3,
                  height: "56px",
                }}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value.toString()} sx={{ fontSize: "1.1rem", py: 1.5 }}>
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
              sx={{
                mt: 3,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  fontSize: "1.1rem",
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button
              onClick={() => setStatusDialogOpen(false)}
              variant="outlined"
              size="large"
              sx={{ borderRadius: 3, px: 4 }}
            >
              Annuler
            </Button>
            <Button onClick={updateOrderStatus} variant="contained" size="large" sx={{ borderRadius: 3, px: 4 }}>
              ✅ Mettre à jour
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notification snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleNotificationClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={handleNotificationClose}
            severity={notification.severity}
            sx={{
              width: "100%",
              borderRadius: 3,
              fontSize: "1.1rem",
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>

        {/* Order Chat Dialog */}
        <OrderChat
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          orderId={chatOrderId}
          userId={token ? JSON.parse(atob(token.split(".")[1])).userId : null}
          userType="shop"
        />
      </Paper>
    </Container>
  )
}
