"use client"

import React, { useState, useEffect } from "react"
import { useLocation, useNavigate } from 'react-router-dom'
import { useAdminNav } from '../contexts/AdminNavContext'
import {
  Box,
  Typography,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Card,
  CardContent,
  Fade,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material"
import {
  Restaurant as RestaurantIcon,
  Fastfood as FastfoodIcon,
  LocalOffer as TagIcon,
  Add as ExtraIcon,
  People as UsersIcon,
  Receipt as OrdersIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Kitchen as IngredientsIcon,
  HelpOutline as HelpIcon,
} from "@mui/icons-material"

// Import all admin components
import AdminUsers from "./adminUsers.jsx"
import AdminSauce from "./adminSauce.jsx"
import AdminPlat from "./adminPlat.jsx"
import AdminTags from "./adminTags.jsx"
import AdminExtra from "./adminExtra.jsx"
import AdminOrders from "./adminOrders.jsx"
import AdminSettings from "./adminSettings.jsx"
import AdminIngredients from "./adminIngredients.jsx"
import AdminInspection from "./adminInspection.jsx"
import HelpModal from "../components/HelpModal.jsx"

// Create dark theme with black/orange design
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
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h5: {
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    h6: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
  },
  components: {
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
            border: "1px solid rgba(255, 152, 0, 0.3)",
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
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          minWidth: "auto",
          padding: "8px 12px",
          "&.Mui-selected": {
            color: "#ff9800",
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          "& .MuiTabs-indicator": {
            backgroundColor: "#ff9800",
          },
        },
        scrollButtons: {
          color: "#ff9800",
          "&.Mui-disabled": {
            opacity: 0.3,
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: "4px 8px",
          "&:hover": {
            backgroundColor: "rgba(255, 152, 0, 0.1)",
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(255, 152, 0, 0.2)",
            "&:hover": {
              backgroundColor: "rgba(255, 152, 0, 0.25)",
            },
          },
        },
      },
    },
  },
})

const AdminDashboard = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { activeView, setActiveView } = useAdminNav()
  const [helpOpen, setHelpOpen] = useState(false)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const menuItems = [
    {
      id: "dashboard",
      label: "Tableau de bord",
      icon: <DashboardIcon />,
      description: "Vue d'ensemble du panneau d'administration",
    },
    {
      id: "orders",
      label: "Commandes",
      icon: <OrdersIcon />,
      description: "Gérer les commandes des clients",
    },
    {
      id: "inspection",
      label: "Inspection Menu",
      icon: <FastfoodIcon />,
      description: "Vérifier et modifier facilement les plats",
    },
    {
      id: "plats",
      label: "Plats",
      icon: <FastfoodIcon />,
      description: "Gérer le menu et les plats",
    },
    {
      id: "sauces",
      label: "Sauces",
      icon: <RestaurantIcon />,
      description: "Gérer les sauces disponibles",
    },
    {
      id: "extras",
      label: "Extras",
      icon: <ExtraIcon />,
      description: "Gérer les extras et accompagnements",
    },
    {
      id: "ingredients",
      label: "Ingrédients",
      icon: <IngredientsIcon />,
      description: "Gérer les ingrédients des plats",
    },
    {
      id: "tags",
      label: "Tags",
      icon: <TagIcon />,
      description: "Gérer les tags et catégories",
    },
    {
      id: "users",
      label: "Utilisateurs",
      icon: <UsersIcon />,
      description: "Gérer les comptes utilisateurs",
    },
    {
      id: "settings",
      label: "Paramètres",
      icon: <SettingsIcon />,
      description: "Configurer les paramètres du restaurant",
    },
  ]

  const handleTabChange = (event, newValue) => {
    setActiveView(newValue)
  }

  const renderDashboardOverview = () => (
    <Fade in={true} timeout={500}>
      <Box>
        <Typography
          variant={isMobile ? "h5" : "h4"}
          gutterBottom
          sx={{
            color: "#ff9800",
            mb: { xs: 2, md: 4 },
            textAlign: { xs: "center", md: "left" },
          }}
        >
          🏢 Panneau d'Administration
        </Typography>

        <Typography
          variant="h6"
          gutterBottom
          sx={{
            color: "text.secondary",
            mb: { xs: 3, md: 4 },
            textAlign: { xs: "center", md: "left" },
            fontSize: { xs: "1rem", md: "1.25rem" },
          }}
        >
          Bienvenue dans le panneau d'administration. Sélectionnez une section pour commencer.
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(4, 1fr)",
              xl: "repeat(4, 1fr)",
            },
            gap: { xs: 2, md: 3 },
            width: "100%",
            minHeight: { xs: "auto", md: "60vh" },
            alignContent: "start",
          }}
        >
          {menuItems.slice(1).map((item) => (
            <Card
              key={item.id}
              sx={{
                cursor: "pointer",
                height: { xs: 140, sm: 160, md: 180, lg: 200 },
                display: "flex",
                flexDirection: "column",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  transform: "translateY(-6px) scale(1.02)",
                  boxShadow: "0 16px 48px rgba(255, 152, 0, 0.2)",
                  border: "1px solid rgba(255, 152, 0, 0.4)",
                },
              }}
              onClick={() => setActiveView(item.id)}
            >
              <CardContent
                sx={{
                  textAlign: "center",
                  p: { xs: 2, md: 3 },
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: { xs: 1, md: 1.5 },
                }}
              >
                <Box
                  sx={{
                    color: "#ff9800",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: { xs: 48, md: 56 },
                  }}
                >
                  {item.icon &&
                    React.cloneElement(item.icon, {
                      sx: { fontSize: { xs: 40, md: 48, lg: 52 } },
                    })}
                </Box>
                <Typography
                  variant={isMobile ? "subtitle1" : "h6"}
                  sx={{
                    color: "#ff9800",
                    fontWeight: 600,
                    fontSize: { xs: "1rem", md: "1.1rem", lg: "1.25rem" },
                    lineHeight: 1.2,
                    textAlign: "center",
                  }}
                >
                  {item.label}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    fontSize: { xs: "0.75rem", md: "0.875rem" },
                    lineHeight: 1.3,
                    textAlign: "center",
                    display: "-webkit-box",
                    WebkitLineClamp: { xs: 2, md: 3 },
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    flex: 1,
                    minHeight: { xs: "2.4em", md: "3.6em" },
                  }}
                >
                  {item.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    </Fade>
  )

  const renderActiveComponent = () => {
    switch (activeView) {
      case "orders":
        return <AdminOrders />
      case "inspection":
        return <AdminInspection />
      case "plats":
        return <AdminPlat />
      case "sauces":
        return <AdminSauce />
      case "extras":
        return <AdminExtra />
      case "ingredients":
        return <AdminIngredients />
      case "tags":
        return <AdminTags />
      case "users":
        return <AdminUsers />
      case "settings":
        return <AdminSettings />
      default:
        return renderDashboardOverview()
    }
  }

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 3, borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
        <Typography variant="h6" sx={{ color: "#ff9800", fontWeight: 800 }}>
          🔧 Administration
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
          Panneau de gestion
        </Typography>
      </Box>

      <List sx={{ flexGrow: 1, p: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={activeView === item.id}
              onClick={() => {
                setActiveView(item.id)
              }}
            >
              <ListItemIcon sx={{ color: activeView === item.id ? "#ff9800" : "inherit" }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: activeView === item.id ? 600 : 400,
                  color: activeView === item.id ? "#ff9800" : "inherit",
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "background.default",
        }}
      >
        {/* Top Navigation for all screen sizes */}
        {/* Removed: now handled by AdminBar */}

        {/* Main content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 4 },
            width: "100%",
          }}
        >
          <Box sx={{ maxWidth: "100%", mx: "auto" }}>{renderActiveComponent()}</Box>
        </Box>
      </Box>
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </ThemeProvider>
  )
}

export default AdminDashboard
