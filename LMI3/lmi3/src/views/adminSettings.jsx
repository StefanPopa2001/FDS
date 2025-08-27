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
  }, []);

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

  const handleSettingChange = (key, value, type) => {
    setSettings(prev => ({
      ...prev,
      [key]: type === "boolean" ? value.toString() : value
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
    
    return categorySettings.map(setting => {
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
                  type="time"
                  value={value}
                  onChange={(e) => handleSettingChange(setting.key, e.target.value, "time")}
                  InputLabelProps={{ shrink: true }}
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
