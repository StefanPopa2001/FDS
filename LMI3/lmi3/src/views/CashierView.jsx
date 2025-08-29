"use client"

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Container,
  Chip,
  TextField,
  Button,
  useMediaQuery,
  useTheme,
  Paper,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Grid,
  Avatar,
  IconButton,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material"
import {
  Search as SearchIcon,
  Restaurant as RestaurantIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon,
  Calculate as CalculateIcon,
  Clear as ClearIcon,
} from "@mui/icons-material"
import { useAuth } from '../contexts/AuthContext'
import config from '../config'

const cashierTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#4caf50",
      light: "#81c784",
      dark: "#388e3c",
    },
    secondary: {
      main: "#ff9800",
    },
    background: {
      default: "#0a0a0a",
      paper: "#1a1a1a",
    },
    text: {
      primary: "#ffffff",
      secondary: "#b0b0b0",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontWeight: 700,
      letterSpacing: "-0.01em",
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
          border: "1px solid rgba(76, 175, 80, 0.2)",
          background: "linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))",
          backdropFilter: "blur(10px)",
          transition: "all 0.2s ease",
          "&:hover": {
            border: "1px solid rgba(76, 175, 80, 0.4)",
            boxShadow: "0 8px 25px rgba(76, 175, 80, 0.15)",
          },
        },
      },
    },
  },
})

const CashierView = () => {
  const { token } = useAuth()
  const [sauces, setSauces] = useState([])
  const [plats, setPlats] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [searchableTags, setSearchableTags] = useState([])
  const [selectedTagFilter, setSelectedTagFilter] = useState("all")
  const [settings, setSettings] = useState({})

  // Order state
  const [currentOrder, setCurrentOrder] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [selectedSauce, setSelectedSauce] = useState(null)
  const [quantity, setQuantity] = useState(1)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  // Check if user is admin
  const isAdmin = useMemo(() => {
    if (!token) return false
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      console.log('Token payload:', payload) // Debug log
      return payload.type === 1
    } catch (error) {
      console.error('Error parsing token:', error) // Debug log
      return false
    }
  }, [token])

  // Redirect if not admin
  useEffect(() => {
    if (!loading && !isAdmin && token) {
      console.log('Not admin, redirecting...') // Debug log
      window.location.href = '/'
    }
  }, [isAdmin, loading, token])

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 200)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch sauces
  useEffect(() => {
    const fetchSauces = async () => {
      try {
        const response = await fetch(`${config.API_URL}/sauces`)
        if (response.ok) {
          const data = await response.json()
          setSauces(data)
        }
      } catch (error) {
        console.error("Failed to fetch sauces:", error)
      }
    }
    fetchSauces()
  }, [])

  // Fetch plats
  useEffect(() => {
    const fetchPlats = async () => {
      try {
        const response = await fetch(`${config.API_URL}/plats`)
        if (response.ok) {
          const data = await response.json()
          setPlats(data)
        }
      } catch (error) {
        console.error("Failed to fetch plats:", error)
      }
    }
    fetchPlats()
  }, [])

  // Fetch searchable tags
  useEffect(() => {
    const fetchSearchableTags = async () => {
      try {
        const response = await fetch(`${config.API_URL}/tags/searchable`)
        if (response.ok) {
          const data = await response.json()
          setSearchableTags(data)
        } else {
          setSearchableTags([])
        }
      } catch (error) {
        setSearchableTags([])
      }
    }
    fetchSearchableTags()
  }, [])

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
    fetchSettings();
  }, []);

  // Set loading to false when data is loaded
  useEffect(() => {
    if (sauces.length >= 0 && plats.length >= 0 && searchableTags !== null) {
      setLoading(false)
    }
  }, [sauces, plats, searchableTags])

  // Filtered items
  const filteredItems = useMemo(() => {
    const allItems = [
      ...plats.map(p => ({ ...p, type: 'plat' })),
      ...sauces.map(s => ({ ...s, type: 'sauce' }))
    ]

    let filtered = [...allItems]

    if (selectedTagFilter !== "all") {
      filtered = filtered.filter((item) => {
        if (!item.tags || item.tags.length === 0) return false
        return item.tags.some(tag => tag.id === parseInt(selectedTagFilter))
      })
    }

    if (settings.enableSpecialites === "false") {
      filtered = filtered.map((item) => ({
        ...item,
        available: item.speciality ? false : item.available
      }))
    }

    if (debouncedSearchTerm) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    }

    return filtered.filter(item => item.available)
  }, [plats, sauces, selectedTagFilter, settings, debouncedSearchTerm])

  // Calculate order total
  const orderTotal = useMemo(() => {
    return currentOrder.reduce((total, item) => total + (item.price * item.quantity), 0)
  }, [currentOrder])

  const handleTagFilterSelect = (tagId) => {
    setSelectedTagFilter(tagId)
  }

  const handleItemClick = (item) => {
    setSelectedItem(item)
    if (item.type === 'plat' && item.versions && item.versions.length > 0) {
      setSelectedVersion(item.versions[0])
    }
    setSelectedSauce(null)
    setQuantity(1)
    setItemDialogOpen(true)
  }

  const handleAddToOrder = () => {
    if (!selectedItem) return

    let itemPrice = selectedItem.price
    let itemName = selectedItem.name

    // Handle plat with version
    if (selectedItem.type === 'plat' && selectedVersion) {
      itemPrice += selectedVersion.extraPrice
      itemName += ` (${selectedVersion.size})`
    }

    // Handle sauce selection for plat
    if (selectedItem.type === 'plat' && selectedSauce && selectedItem.saucePrice > 0) {
      itemPrice += selectedItem.saucePrice
      itemName += ` avec ${selectedSauce.name}`
    }

    const orderItem = {
      id: `${selectedItem.id}-${Date.now()}`,
      name: itemName,
      price: itemPrice,
      quantity: quantity,
      originalItem: selectedItem,
      version: selectedVersion,
      sauce: selectedSauce,
    }

    setCurrentOrder(prev => [...prev, orderItem])
    setItemDialogOpen(false)
    setSelectedItem(null)
    setSelectedVersion(null)
    setSelectedSauce(null)
    setQuantity(1)
  }

  const handleRemoveFromOrder = (itemId) => {
    setCurrentOrder(prev => prev.filter(item => item.id !== itemId))
  }

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromOrder(itemId)
      return
    }
    setCurrentOrder(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  const handleClearOrder = () => {
    setCurrentOrder([])
  }

  if (!token || !isAdmin) {
    return (
      <ThemeProvider theme={cashierTheme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h4" color="text.secondary">
            {!token ? 'Veuillez vous connecter' : 'Accès non autorisé - Admin uniquement'}
          </Typography>
        </Box>
      </ThemeProvider>
    )
  }

  if (loading) {
    return (
      <ThemeProvider theme={cashierTheme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 4 }}>
          <Container maxWidth="xl">
            <Skeleton variant="text" width={300} height={60} sx={{ mx: 'auto', mb: 4 }} />
            <Grid container spacing={3}>
              {[...Array(8)].map((_, i) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                  <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={cashierTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 2 }}>
        <Container maxWidth="xl">
          <Grid container spacing={3}>
            {/* Left side - Menu Items */}
            <Grid item xs={12} lg={8}>
              {/* Header */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h1" sx={{ mb: 2, textAlign: 'center' }}>
                  🧾 Caisse
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
                  Calcul rapide des prix
                </Typography>
              </Box>

              {/* Search and Filters */}
              <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip
                        label="Tous"
                        onClick={() => handleTagFilterSelect("all")}
                        variant={selectedTagFilter === "all" ? "filled" : "outlined"}
                        size="small"
                        sx={{
                          borderRadius: 2,
                          '&.MuiChip-filled': {
                            background: 'linear-gradient(45deg, #4caf50 30%, #81c784 90%)',
                          }
                        }}
                      />
                      {searchableTags.map((tag) => (
                        <Chip
                          key={tag.id}
                          label={`${tag.emoji} ${tag.nom}`}
                          onClick={() => handleTagFilterSelect(tag.id.toString())}
                          variant={selectedTagFilter === tag.id.toString() ? "filled" : "outlined"}
                          size="small"
                          sx={{
                            borderRadius: 2,
                            '&.MuiChip-filled': {
                              background: 'linear-gradient(45deg, #4caf50 30%, #81c784 90%)',
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Menu Items Grid */}
              <Grid container spacing={2}>
                {filteredItems.map((item) => (
                  <Grid item xs={6} sm={4} md={3} lg={2.4} key={item.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        width: { xs: 160, md: 220 },
                        height: { xs: 200, md: 280 },
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                        }
                      }}
                      onClick={() => handleItemClick(item)}
                    >
                      <CardContent sx={{ flex: 1, p: { xs: 1, md: 1.5 }, height: { xs: 120, md: 180 }, overflow: 'hidden' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 600, 
                            flex: 1, 
                            mr: 1,
                            fontSize: { xs: '0.9rem', md: '1.1rem' },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {item.name}
                          </Typography>
                          <Typography variant="h6" sx={{ 
                            color: 'primary.main', 
                            fontWeight: 600, 
                            whiteSpace: 'nowrap',
                            fontSize: { xs: '0.9rem', md: '1rem' }
                          }}>
                            {item.price.toFixed(2)} €
                          </Typography>
                        </Box>

                        {item.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ 
                            mb: 1, 
                            lineHeight: 1.3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: { xs: 1, md: 2 },
                            WebkitBoxOrient: 'vertical',
                            fontSize: { xs: '0.75rem', md: '0.875rem' }
                          }}>
                            {item.description.length > 60 ? `${item.description.substring(0, 60)}...` : item.description}
                          </Typography>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {item.tags?.slice(0, 2).map((tag) => (
                              <Chip
                                key={tag.id}
                                label={tag.emoji}
                                size="small"
                                sx={{
                                  height: { xs: 16, md: 20 },
                                  width: { xs: 16, md: 20 },
                                  fontSize: { xs: '0.6rem', md: '0.75rem' },
                                  '& .MuiChip-label': { padding: 0 }
                                }}
                              />
                            ))}
                          </Box>
                          <Chip
                            label={item.type === 'plat' ? 'Plat' : 'Sauce'}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              borderRadius: 1,
                              fontSize: { xs: '0.6rem', md: '0.75rem' },
                              height: { xs: 20, md: 24 }
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {/* Right side - Current Order */}
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 3, borderRadius: 2, position: 'sticky', top: 20 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <ReceiptIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Commande Actuelle
                  </Typography>
                </Box>

                {currentOrder.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    <ShoppingCartIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                    <Typography variant="body1">
                      Aucune commande
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <List sx={{ mb: 3 }}>
                      {currentOrder.map((item) => (
                        <ListItem key={item.id} sx={{ px: 0, py: 1 }}>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {item.name}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                  {item.price.toFixed(2)} € × {item.quantity}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
                                  {(item.price * item.quantity).toFixed(2)} €
                                </Typography>
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                sx={{ color: 'text.secondary' }}
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                              <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>
                                {item.quantity}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                sx={{ color: 'text.secondary' }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveFromOrder(item.id)}
                                sx={{ color: 'error.main', ml: 1 }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Total:
                      </Typography>
                      <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 700 }}>
                        {orderTotal.toFixed(2)} €
                      </Typography>
                    </Box>

                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={handleClearOrder}
                      sx={{ mb: 1 }}
                    >
                      <ClearIcon sx={{ mr: 1 }} />
                      Vider la commande
                    </Button>
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Item Selection Dialog */}
      <Dialog
        open={itemDialogOpen}
        onClose={() => setItemDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            Ajouter: {selectedItem?.name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedItem?.type === 'plat' && selectedItem.versions && selectedItem.versions.length > 1 && (
            <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
              <InputLabel>Taille</InputLabel>
              <Select
                value={selectedVersion?.id || ''}
                onChange={(e) => {
                  const version = selectedItem.versions.find(v => v.id === e.target.value)
                  setSelectedVersion(version)
                }}
              >
                {selectedItem.versions.map((version) => (
                  <MenuItem key={version.id} value={version.id}>
                    {version.size} (+{version.extraPrice.toFixed(2)} €)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {selectedItem?.type === 'plat' && selectedItem.saucePrice > 0 && sauces.length > 0 && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Sauce (+{selectedItem.saucePrice.toFixed(2)} €)</InputLabel>
              <Select
                value={selectedSauce?.id || ''}
                onChange={(e) => {
                  const sauce = sauces.find(s => s.id === e.target.value)
                  setSelectedSauce(sauce)
                }}
              >
                <MenuItem value="">
                  <em>Aucune</em>
                </MenuItem>
                {sauces.filter(s => s.available).map((sauce) => (
                  <MenuItem key={sauce.id} value={sauce.id}>
                    {sauce.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
            <Typography variant="body2">Quantité:</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                size="small"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <RemoveIcon />
              </IconButton>
              <Typography sx={{ minWidth: 30, textAlign: 'center' }}>{quantity}</Typography>
              <IconButton
                size="small"
                onClick={() => setQuantity(quantity + 1)}
              >
                <AddIcon />
              </IconButton>
            </Box>
          </Box>

          {selectedItem && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Prix unitaire: {(() => {
                  let price = selectedItem.price
                  if (selectedVersion) price += selectedVersion.extraPrice
                  if (selectedSauce && selectedItem.saucePrice > 0) price += selectedItem.saucePrice
                  return price.toFixed(2)
                })()} €
              </Typography>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                Total: {(() => {
                  let price = selectedItem.price
                  if (selectedVersion) price += selectedVersion.extraPrice
                  if (selectedSauce && selectedItem.saucePrice > 0) price += selectedItem.saucePrice
                  return (price * quantity).toFixed(2)
                })()} €
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemDialogOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleAddToOrder} variant="contained" color="primary">
            <AddIcon sx={{ mr: 1 }} />
            Ajouter ({quantity})
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  )
}

export default CashierView
