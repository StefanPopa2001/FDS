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
  Storefront as StorefrontIcon,
} from "@mui/icons-material";
import config from "../config";
import { normalizeSettingsArray } from "../utils/apiService";

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
    // Opening hours are managed via RestaurantConfig (auto/manual schedule)
    // NOTE: restaurant open schedule is stored in RestaurantConfig; admin UI exposes it separately.
    // Opening hours are managed via RestaurantConfig (auto/manual schedule).
    // The admin UI shows a single auto/manual toggle and related controls in the "Ouverture du restaurant" block below.
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
    fetchRestaurantConfig();
  }, []);

  const [restaurantCfg, setRestaurantCfg] = useState(null);

  // Safe JSON parse to avoid throwing in render when stored strings are malformed
  const safeParseJSON = (maybeJson, fallback = null) => {
    if (maybeJson == null) return fallback;
    if (typeof maybeJson !== 'string') return maybeJson;
    try {
      // allow leading/trailing whitespace
      return JSON.parse(maybeJson);
    } catch (e) {
      // attempt to fix common issues like single-quoted arrays or bare numbers
      try {
        // replace single quotes with double quotes
        const replaced = maybeJson.replace(/'/g, '"');
        return JSON.parse(replaced);
      } catch (e2) {
        console.warn('safeParseJSON failed to parse:', maybeJson);
        return fallback;
      }
    }
  };

  const fetchRestaurantConfig = async () => {
    try {
      const res = await fetch(`${config.API_URL}/restaurant-config`);
      if (res.ok) {
        const data = await res.json();
        // normalize server-side JSON field defensively
        if (data && data.openDays) {
          data.openDays = safeParseJSON(data.openDays, data.openDays || []);
        }
        setRestaurantCfg(data || null);
        // also merge into settings so Menu can read it via settings if necessary
  setSettings(prev => ({ ...prev, restaurantAutoMode: data?.openMode !== 'manual', restaurantOpenDays: data?.openDays || prev.restaurantOpenDays, restaurantOpenStart: data?.openStart || prev.restaurantOpenStart, restaurantOpenEnd: data?.openEnd || prev.restaurantOpenEnd, restaurantManualOpen: data?.manualOpen ?? prev.restaurantManualOpen }));
      }
    } catch (err) {
      console.error('Failed to fetch restaurant config', err);
    }
  };

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
        // Normalize values (booleans/numbers) and convert to map
        const settingsMap = normalizeSettingsArray(data);
        
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
    
    // Keep typed values in local state so UI components behave correctly
    let parsedValue = value;
    if (type === 'number') {
      parsedValue = value === '' ? '' : Number(value);
    }
    if (type === 'boolean') {
      parsedValue = !!value;
    }

    setSettings(prev => ({
      ...prev,
      [key]: parsedValue
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const settingsArray = Object.entries(settings).map(([key, value]) => {
        const defaultSetting = defaultSettings.find(s => s.key === key);
        // Convert booleans and numbers to strings for backend storage
        let outValue = value;
        if (typeof value === 'boolean') outValue = value ? 'true' : 'false';
        if (typeof value === 'number') outValue = value.toString();

        return {
          key,
          value: outValue,
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

  // Save restaurant config (if admin toggles changed)
  const saveRestaurantConfig = async () => {
    try {
      const payload = {
        openMode: settings.restaurantAutoMode === false ? 'manual' : 'auto',
  openDays: Array.isArray(settings.restaurantOpenDays) ? settings.restaurantOpenDays : (Array.isArray(restaurantCfg?.openDays) ? restaurantCfg.openDays : safeParseJSON(settings.restaurantOpenDays, [])),
        openStart: settings.restaurantOpenStart || restaurantCfg?.openStart || '11:00',
        openEnd: settings.restaurantOpenEnd || restaurantCfg?.openEnd || '22:00',
        manualOpen: !!settings.restaurantManualOpen,
      };

      const res = await fetch(`${config.API_URL}/restaurant-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setRestaurantCfg(data);
        // Broadcast the updated config so other components (e.g. Menu) can update immediately
        try { window.dispatchEvent(new CustomEvent('restaurant-config-updated', { detail: { restaurantCfg: data } })); } catch (e) {}
        setMessage({ type: 'success', text: 'Configuration du restaurant sauvegardée' });
        setOpenSnackbar(true);
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Erreur serveur');
      }
    } catch (err) {
      console.error('Save restaurant config error', err);
      setMessage({ type: 'error', text: 'Échec de la sauvegarde de la configuration du restaurant' });
      setOpenSnackbar(true);
    }
  };

  const renderSettingsByCategory = (category) => {
    const categorySettings = defaultSettings.filter(s => s.category === category);
    
    const settingsElements = categorySettings.map(setting => {
      // Use nullish coalescing to preserve falsy values like false or 0
      const rawValue = settings.hasOwnProperty(setting.key) ? settings[setting.key] : setting.defaultValue;
      // Normalize booleans so Switch receives a boolean instead of string
      const value = setting.type === 'boolean' ? (rawValue === true || rawValue === 'true') : rawValue;
      
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
                      checked={!!value}
                      onChange={(e) => handleSettingChange(setting.key, e.target.checked, "boolean")}
                      color="primary"
                    />
                  }
                  label={value ? "Activé" : "Désactivé"}
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

    // Add order hours management and restaurant config for hours category
    if (category === "hours") {
      // days labels in French
      // EU order: Monday -> Sunday, keep idx mapping where 0 = Sunday
      const jours = [
        { label: 'Lundi', short: 'Lun', idx: 1 },
        { label: 'Mardi', short: 'Mar', idx: 2 },
        { label: 'Mercredi', short: 'Mer', idx: 3 },
        { label: 'Jeudi', short: 'Jeu', idx: 4 },
        { label: 'Vendredi', short: 'Ven', idx: 5 },
        { label: 'Samedi', short: 'Sam', idx: 6 },
        { label: 'Dimanche', short: 'Dim', idx: 0 },
      ];

      // current restaurant settings (fall back to defaults)
  const mode = (settings.restaurantAutoMode === false) ? 'manual' : (settings.restaurantAutoMode === true ? 'auto' : (restaurantCfg?.openMode || 'auto'));
      const days = Array.isArray(settings.restaurantOpenDays)
        ? settings.restaurantOpenDays
        : Array.isArray(restaurantCfg?.openDays)
        ? restaurantCfg.openDays
        : safeParseJSON(settings.restaurantOpenDays, []);
      const start = settings.restaurantOpenStart || restaurantCfg?.openStart || '11:00';
      const end = settings.restaurantOpenEnd || restaurantCfg?.openEnd || '22:00';
      const manualOpen = settings.hasOwnProperty('restaurantManualOpen') ? !!settings.restaurantManualOpen : !!restaurantCfg?.manualOpen;

      settingsElements.push(
        <Grid item xs={12} key="order-hours">
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <StorefrontIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6" gutterBottom color="primary.main">Ouverture du restaurant</Typography>
                <Tooltip title="Basculer automatique / manuel">
                  <FormControlLabel
                    sx={{ ml: 'auto' }}
                    control={<Switch checked={mode === 'auto'} onChange={(e) => setSettings(prev => ({ ...prev, restaurantAutoMode: e.target.checked }))} />}
                    label={mode === 'auto' ? 'Automatique' : 'Manuel'}
                  />
                </Tooltip>
              </Box>

              {mode === 'auto' ? (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>Sélectionnez les jours d'ouverture</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {jours.map(j => (
                      <Card
                        key={j.idx}
                        onClick={() => {
                          const cur = Array.isArray(days) ? [...days] : [];
                          const found = cur.indexOf(j.idx);
                          if (found === -1) cur.push(j.idx); else cur.splice(found, 1);
                          setSettings(prev => ({ ...prev, restaurantOpenDays: cur.sort() }));
                        }}
                        sx={{
                          cursor: 'pointer',
                          p: 1,
                          minWidth: 88,
                          textAlign: 'center',
                          background: days.includes(j.idx) ? 'linear-gradient(90deg, rgba(255,152,0,0.12), rgba(255,152,0,0.06))' : undefined,
                          border: days.includes(j.idx) ? '1px solid rgba(255,152,0,0.25)' : '1px solid rgba(255,255,255,0.04)'
                        }}
                      >
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{j.short}</Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>{j.label}</Typography>
                      </Card>
                    ))}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                      label="Début"
                      size="small"
                      value={start}
                      onChange={(e) => setSettings(prev => ({ ...prev, restaurantOpenStart: e.target.value }))}
                      sx={{ width: 140 }}
                    />
                    <TextField
                      label="Fin"
                      size="small"
                      value={end}
                      onChange={(e) => setSettings(prev => ({ ...prev, restaurantOpenEnd: e.target.value }))}
                      sx={{ width: 140 }}
                    />
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControlLabel
                    control={<Switch checked={manualOpen} onChange={(e) => {
                      const manual = e.target.checked;
                      setSettings(prev => ({ ...prev, restaurantManualOpen: manual, restaurantAutoMode: manual ? false : prev.restaurantAutoMode }));
                    }} />}
                    label={manualOpen ? 'Ouvert' : 'Fermé'}
                  />
                </Box>
              )}

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
              onClick={async () => { await saveSettings(); await saveRestaurantConfig(); }}
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
