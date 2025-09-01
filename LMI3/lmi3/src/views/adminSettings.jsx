import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Switch,
  FormControl,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  Snackbar,
  Paper,
  Chip,
  useTheme,
  useMediaQuery,
  ThemeProvider,
  createTheme,
  CssBaseline,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  Restaurant as RestaurantIcon,
  Message as MessageIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import config from "../config";

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
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
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
            boxShadow: "0 12px 24px rgba(255, 152, 0, 0.1)",
            border: "1px solid rgba(255, 152, 0, 0.1)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
            "&:hover fieldset": {
              borderColor: "#ff9800",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#ff9800",
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: "none",
          fontWeight: 600,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-2px)",
          },
        },
      },
    },
  },
});

const AdminSettings = () => {
  const [settings, setSettings] = useState({});
  const [orderHours, setOrderHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Helper to get token from localStorage
  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Default settings structure
  const defaultSettings = [
    {
      key: "enableOnlinePickup",
      type: "boolean",
      category: "orders",
      description: "Permettre les commandes à emporter en ligne",
      defaultValue: "true",
    },
    {
      key: "enableASAP",
      type: "boolean",
      category: "orders",
  description: 'Permettre l\'option ASAP pour les retraits',
      defaultValue: "true",
    },
    {
      key: "enableOnlineDelivery",
      type: "boolean",
      category: "orders",
      description: "Permettre les commandes en livraison en ligne",
      defaultValue: "true",
    },
    {
      key: "enableSpecialites",
      type: "boolean",
      category: "menu",
      description: "Afficher les spécialités dans le menu",
      defaultValue: "true",
    },
    {
      key: "menuMessage",
      type: "string",
      category: "menu",
      description: "Message affiché sur la page du menu",
      defaultValue: "Découvrez notre sélection de spécialités",
    },
    {
      key: "heureOuverture",
      type: "time",
      category: "hours",
      description: "Heure d'ouverture",
      defaultValue: "11:00",
    },
    {
      key: "heureFermeture",
      type: "time",
      category: "hours",
      description: "Heure de fermeture",
      defaultValue: "22:00",
    },
    {
      key: "restaurantPhone",
      type: "string",
      category: "general",
      description: "Numéro de téléphone du restaurant",
      defaultValue: "",
    },
    {
      key: "deliveryRadius",
      type: "number",
      category: "orders",
      description: "Rayon de livraison (en km)",
      defaultValue: "10",
    },
    {
      key: "minimumOrderAmount",
      type: "number",
      category: "orders",
      description: "Montant minimum de commande (€)",
      defaultValue: "15",
    },
  ];

  useEffect(() => {
    fetchSettings();
    fetchOrderHours();
  }, []);

  const fetchOrderHours = async () => {
    try {
      const response = await fetch(`${config.API_URL}/order-hours`, {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrderHours(data);
      } else {
        console.error("Erreur lors du chargement des heures de commande");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des heures de commande:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_URL}/settings`, {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        const settingsMap = {};
        
        // Convert array to map for easier access
        data.forEach(setting => {
          settingsMap[setting.key] = setting.value;
        });
        
        // Fill in any missing settings with defaults
        defaultSettings.forEach(defaultSetting => {
          if (!(defaultSetting.key in settingsMap)) {
            settingsMap[defaultSetting.key] = defaultSetting.defaultValue;
          }
        });
        
        setSettings(settingsMap);
      } else {
        // If no settings exist, use defaults
        const defaultMap = {};
        defaultSettings.forEach(setting => {
          defaultMap[setting.key] = setting.defaultValue;
        });
        setSettings(defaultMap);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres:", error);
      setMessage({ type: "error", text: "Erreur lors du chargement des paramètres" });
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const addOrderHour = async (time) => {
    try {
      const response = await fetch(`${config.API_URL}/order-hours`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ time, enabled: true }),
      });

      if (response.ok) {
        const newHour = await response.json();
        setOrderHours(prev => [...prev, newHour].sort((a, b) => a.time.localeCompare(b.time)));
        setMessage({ type: "success", text: "Heure ajoutée avec succès" });
        setOpenSnackbar(true);
      } else {
        const error = await response.json();
        setMessage({ type: "error", text: error.error || "Erreur lors de l'ajout" });
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'heure:", error);
      setMessage({ type: "error", text: "Erreur lors de l'ajout de l'heure" });
      setOpenSnackbar(true);
    }
  };

  const deleteOrderHour = async (id) => {
    try {
      const response = await fetch(`${config.API_URL}/order-hours/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setOrderHours(prev => prev.filter(hour => hour.id !== id));
        setMessage({ type: "success", text: "Heure supprimée avec succès" });
        setOpenSnackbar(true);
      } else {
        const error = await response.json();
        setMessage({ type: "error", text: error.error || "Erreur lors de la suppression" });
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'heure:", error);
      setMessage({ type: "error", text: "Erreur lors de la suppression de l'heure" });
      setOpenSnackbar(true);
    }
  };

  const handleSettingChange = (key, value, type) => {
    // Validate time format for time type settings
    if (type === "time" && value) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(value)) {
        setMessage({ type: "error", text: `Format d'heure invalide pour ${key === 'heureOuverture' ? "l'heure d'ouverture" : "l'heure de fermeture"}. Utilisez HH:MM (ex: 14:30)` });
        setOpenSnackbar(true);
        return;
      }
    }
    
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const settingsArray = Object.entries(settings).map(([key, value]) => {
        const defaultSetting = defaultSettings.find(s => s.key === key);
        return {
          key,
          value,
          type: defaultSetting?.type || "string",
          category: defaultSetting?.category || "general",
          description: defaultSetting?.description || "",
        };
      });

      const response = await fetch(`${config.API_URL}/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ settings: settingsArray }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Paramètres sauvegardés avec succès!" });
        setOpenSnackbar(true);
      } else {
        throw new Error("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setMessage({ type: "error", text: "Erreur lors de la sauvegarde des paramètres" });
      setOpenSnackbar(true);
    } finally {
      setSaving(false);
    }
  };

  const renderSettingsByCategory = (category) => {
    const categorySettings = defaultSettings.filter(s => s.category === category);
    
    const settingsElements = categorySettings.map(setting => {
      const value = settings[setting.key] || setting.defaultValue;
      
      return (
        <Grid item xs={12} md={6} key={setting.key}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="primary.main">
                {setting.description}
              </Typography>
              
              {setting.type === "boolean" ? (
                <FormControlLabel
                  control={
                    <Switch
                      checked={value === "true"}
                      onChange={(e) => handleSettingChange(setting.key, e.target.checked, "boolean")}
                      color="primary"
                    />
                  }
                  label={value === "true" ? "Activé" : "Désactivé"}
                />
              ) : setting.type === "time" ? (
                <TextField
                  fullWidth
                  placeholder="HH:MM"
                  value={value}
                  onChange={(e) => handleSettingChange(setting.key, e.target.value, "time")}
                  inputProps={{
                    pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$",
                    title: "Format: HH:MM (ex: 14:30)"
                  }}
                  helperText={`Format 24h: HH:MM (ex: 14:30) - Actuellement: ${value || 'Non défini'}`}
                />
              ) : setting.type === "number" ? (
                <TextField
                  fullWidth
                  type="number"
                  value={value}
                  onChange={(e) => handleSettingChange(setting.key, e.target.value, "number")}
                  inputProps={{ min: 0, step: setting.key.includes("Amount") ? 0.01 : 1 }}
                />
              ) : (
                <TextField
                  fullWidth
                  multiline={setting.key === "menuMessage"}
                  rows={setting.key === "menuMessage" ? 3 : 1}
                  value={value}
                  onChange={(e) => handleSettingChange(setting.key, e.target.value, "string")}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      );
    });

    // Add order hours management for hours category
    if (category === "hours") {
      settingsElements.push(
        <Grid item xs={12} key="order-hours">
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="primary.main">
                Heures d'ouverture pour les commandes
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
                Heures d'ouverture pour les commandes (format HHMM ou HH:MM)
              </Typography>
              <Box 
                sx={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", 
                  gap: 1, 
                  mb: 2,
                  maxHeight: "120px",
                  overflowY: "auto",
                  p: 1,
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: 1,
                  backgroundColor: "rgba(0, 0, 0, 0.05)"
                }}
              >
                {orderHours.map((hour) => (
                  <Box key={hour.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={hour.time}
                      onDelete={() => deleteOrderHour(hour.id)}
                      color="primary"
                      variant="outlined"
                      size="small"
                      sx={{ 
                        "& .MuiChip-deleteIcon": {
                          color: "error.main",
                        },
                        fontSize: "0.75rem",
                        height: "28px"
                      }}
                    />
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                <TextField
                  placeholder="HHMM ou HH:MM"
                  size="small"
                  sx={{ flex: 1, minWidth: "120px" }}
                  inputRef={(ref) => {
                    if (ref) window.orderHourRef = ref;
                  }}
                  inputProps={{
                    pattern: "^([0-1]?[0-9]|2[0-3])([0-5][0-9])$|^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$",
                    title: "Format: HHMM (ex: 1430) ou HH:MM (ex: 14:30)"
                  }}
                />
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  sx={{ minWidth: "100px" }}
                  onClick={() => {
                    const input = window.orderHourRef?.value;
                    if (input) {
                      let formattedHour = input;
                      
                      // Convert HHMM to HH:MM format
                      if (/^([0-1]?[0-9]|2[0-3])([0-5][0-9])$/.test(input)) {
                        formattedHour = input.slice(0, 2) + ':' + input.slice(2, 4);
                      }
                      
                      // Validate format
                      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
                      if (!timeRegex.test(formattedHour)) {
                        setMessage({ type: "error", text: "Format invalide. Utilisez HHMM (ex: 1430) ou HH:MM (ex: 14:30)" });
                        setOpenSnackbar(true);
                        return;
                      }
                      
                      addOrderHour(formattedHour);
                      window.orderHourRef.value = "";
                    }
                  }}
                >
                  Ajouter
                </Button>
              </Box>
              {/* ASAP toggle removed from Settings per user request */}
            </CardContent>
          </Card>
        </Grid>
      );
    }

    return settingsElements;
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "orders": return <ShoppingCartIcon />;
      case "menu": return <RestaurantIcon />;
      case "hours": return <ScheduleIcon />;
      case "general": return <SettingsIcon />;
      default: return <SettingsIcon />;
    }
  };

  const getCategoryTitle = (category) => {
    switch (category) {
      case "orders": return "Commandes";
      case "menu": return "Menu";
      case "hours": return "Horaires";
      case "general": return "Général";
      default: return "Paramètres";
    }
  };

  if (loading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Typography variant="h4" align="center">
            Chargement des paramètres...
          </Typography>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100vh",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
          zIndex: -1,
        }}
      />
      
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <SettingsIcon sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
                backgroundClip: "text",
                textFillColor: "transparent",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Paramètres du Restaurant
            </Typography>
          </Box>
          
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={saveSettings}
              disabled={saving}
              sx={{ minWidth: 140 }}
            >
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchSettings}
              disabled={saving}
            >
              Actualiser
            </Button>
          </Box>
        </Box>

        {/* Settings by Category */}
        {["orders", "menu", "hours", "general"].map(category => (
          <Box key={category} sx={{ mb: 4 }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                background: "rgba(26, 26, 26, 0.8)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Box sx={{ color: "primary.main", mr: 2 }}>
                  {getCategoryIcon(category)}
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: "primary.main" }}>
                  {getCategoryTitle(category)}
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                {renderSettingsByCategory(category)}
              </Grid>
            </Paper>
          </Box>
        ))}

        {/* Snackbar for messages */}
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={() => setOpenSnackbar(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setOpenSnackbar(false)}
            severity={message.type === "error" ? "error" : "success"}
            sx={{ width: "100%" }}
          >
            {message.text}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
};

export default AdminSettings;
