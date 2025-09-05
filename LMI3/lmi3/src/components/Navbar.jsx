"use client"

import { useState, useEffect } from "react"
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  useTheme,
  useMediaQuery,
  ThemeProvider,
  createTheme,
} from "@mui/material"
import {
  Menu as MenuIcon,
  Restaurant as RestaurantIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  Fastfood as FastfoodIcon,
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material"
import { Link, useNavigate } from "react-router-dom"
import Basket from './Basket'
import NotificationCenter from './NotificationCenter'
import { useAuth } from '../contexts/AuthContext'
import { useBasket } from '../contexts/BasketContext'

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
    h6: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h5: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
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
            backgroundColor: "rgba(255, 152, 0, 0.1)",
            transform: "translateY(-2px)",
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          background: "linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: "4px 8px",
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor: "rgba(255, 152, 0, 0.1)",
            transform: "translateX(4px)",
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: "2px solid #ff9800",
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "scale(1.1)",
            boxShadow: "0 0 20px rgba(255, 152, 0, 0.4)",
          },
        },
      },
    },
  },
})

const Navbar = () => {
  const [anchorElNav, setAnchorElNav] = useState(null)
  const [anchorElUser, setAnchorElUser] = useState(null)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const navigate = useNavigate()

  // Use real authentication
  const { user, isLoggedIn, isAdmin, getUserInitials, logout: authLogout, loading } = useAuth()
  const { toggleBasket, handleLogout: basketLogout, handleLogin: basketLogin } = useBasket()

  // Update basket when user changes - use handleLogin for login, handleLogout for logout
  useEffect(() => {
    if (!loading) {
      if (user?.id) {
        // User just logged in - keep current basket
        basketLogin(user.id);
      }
      // Don't call basketLogout here - it will be called explicitly when user logs out
    }
  }, [user?.id, loading, basketLogin]);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget)
  }

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget)
  }

  const handleCloseNavMenu = () => {
    setAnchorElNav(null)
  }

  const handleCloseUserMenu = () => {
    setAnchorElUser(null)
  }

  const handleLogout = () => {
    // First clear basket, then clear auth
    basketLogout() // This will clear the basket
    authLogout()   // This will clear the auth state
    handleCloseUserMenu()
    navigate("/login")
  }

  const menuItems = []

  const userMenuItems = [
    { text: "Mon Panier", icon: <ShoppingCartIcon />, onClick: () => { toggleBasket(); handleCloseUserMenu(); } },
    { text: "Menu", icon: <FastfoodIcon />, path: "/menu" },
    { text: "Profil", icon: <PersonIcon />, path: "/profile" },
    { text: "Mes Commandes", icon: <ReceiptIcon />, path: "/orders" },
    ...(isAdmin() ? [
      { text: "Tableau de bord Admin", icon: <AdminIcon />, path: "/admin" },
    ] : []),
    { text: "Déconnexion", icon: <LogoutIcon />, onClick: handleLogout },
  ]

  // Show simplified navbar while auth is loading
  if (loading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <AppBar
          position="sticky"
          sx={{
            mb: 2,
            background: "linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          }}
        >
          <Container maxWidth="xl">
            <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 70 } }}>
              <Box
                component="img"
                src="/rudyetfannylogo.png"
                alt="Rudy et Fanny Logo"
                sx={{
                  height: { xs: 32, md: 40 },
                  width: "auto",
                  mr: 1.5,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "scale(1.1)",
                  },
                }}
              />
              <Typography
                variant="h6"
                noWrap
                component={Link}
                to="/"
                sx={{
                  mr: 2,
                  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                  fontWeight: 800,
                  background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
                  backgroundClip: "text",
                  textFillColor: "transparent",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textDecoration: "none",
                  fontSize: { xs: "1.3rem", md: "1.5rem" },
                  letterSpacing: "-0.02em",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "scale(1.05)",
                  },
                }}
              >
                Rudy et Fanny
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Basket />
            </Toolbar>
          </Container>
        </AppBar>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <AppBar
        position="sticky"
        sx={{
          mb: 2,
          background: "linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 70 } }}>
            {/* Logo and Title - left aligned */}
            <Box
              component="img"
              src="/rudyetfannylogo.png"
              alt="Rudy et Fanny Logo"
              sx={{
                height: { xs: 32, md: 40 },
                width: "auto",
                mr: 1.5,
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "scale(1.1)",
                },
              }}
            />
            <Typography
              variant="h6"
              noWrap
              component={Link}
              to="/"
              sx={{
                mr: 2,
                fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                fontWeight: 800,
                background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
                backgroundClip: "text",
                textFillColor: "transparent",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textDecoration: "none",
                fontSize: { xs: "1.3rem", md: "1.5rem" },
                letterSpacing: "-0.02em",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                },
              }}
            >
              Rudy et Fanny
            </Typography>
            
            {/* Spacer */}
            <Box sx={{ flexGrow: 1 }} />

            {/* User menu */}
            <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Notifications - Only for logged in users */}
              {isLoggedIn && (
                <NotificationCenter userId={user?.userId} />
              )}
              
              {/* Basket Icon - Always visible */}
              <Basket />
              
              {isLoggedIn ? (
                <Box sx={{ flexGrow: 0 }}>
                  <Tooltip title="Paramètres du compte" arrow>
                    <IconButton
                      onClick={handleOpenUserMenu}
                      sx={{
                        p: 0,
                        "&:hover": {
                          transform: "scale(1.1)",
                        },
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: "primary.main",
                          color: "black",
                          fontWeight: 700,
                          border: "2px solid",
                          borderColor: "primary.main",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            boxShadow: "0 0 20px rgba(255, 152, 0, 0.4)",
                          },
                        }}
                      >
                        {getUserInitials()}
                      </Avatar>
                    </IconButton>
                  </Tooltip>
                  <Menu
                    sx={{
                      mt: "45px",
                      "& .MuiPaper-root": {
                        background: "linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: 2,
                        minWidth: 180,
                      },
                    }}
                    id="menu-appbar"
                    anchorEl={anchorElUser}
                    anchorOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                    open={Boolean(anchorElUser)}
                    onClose={handleCloseUserMenu}
                  >
                    {userMenuItems.map((item) => (
                      <MenuItem
                        key={item.text}
                        onClick={() => {
                          if (item.onClick) {
                            item.onClick()
                          } else {
                            navigate(item.path)
                            handleCloseUserMenu()
                          }
                        }}
                        sx={{
                          color: "text.primary",
                          borderRadius: 1,
                          mx: 1,
                          my: 0.5,
                          "&:hover": {
                            backgroundColor: "rgba(255, 152, 0, 0.1)",
                            transform: "translateX(4px)",
                          },
                        }}
                      >
                        <Box sx={{ color: "primary.main", mr: 1 }}>{item.icon}</Box>
                        <Typography sx={{ fontWeight: 600 }}>{item.text}</Typography>
                      </MenuItem>
                    ))}
                  </Menu>
                </Box>
              ) : (
                <Button
                  component={Link}
                  to="/login"
                  startIcon={<PersonIcon sx={{ color: "primary.main" }} />}
                  sx={{
                    color: "white",
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    "&:hover": {
                      backgroundColor: "rgba(255, 152, 0, 0.1)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  Connexion
                </Button>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </ThemeProvider>
  )
}

export default Navbar
