"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Container,
  Avatar,
  Paper,
  Grid,
  Button,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Fade,
  Zoom,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material"
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
  Logout as LogoutIcon,
  Restaurant as RestaurantIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Lock as LockIcon,
  AccountCircle as AccountCircleIcon,
  ContactMail as ContactMailIcon,
  AccountBox as AccountBoxIcon,
  Settings as SettingsIcon,
  ShoppingCart as ShoppingCartIcon,
  RestaurantMenu as RestaurantMenuIcon,
} from "@mui/icons-material"
import { useAuth } from '../contexts/AuthContext'
import config from '../config'

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
    h3: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
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
  },
})

export default function UserProfile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    phone: ''
  })
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const { changePassword } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  // Fetch user profile from backend
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Get user token from localStorage
        const token = localStorage.getItem('authToken') || localStorage.getItem('token')
        
        if (!token) {
          setError("Vous devez être connecté pour voir votre profil")
          setLoading(false)
          return
        }

        // Make API call to get user profile
        const response = await fetch(`${config.API_URL}/users/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Session expirée, veuillez vous reconnecter")
          }
          throw new Error("Erreur lors du chargement du profil")
        }

        const responseData = await response.json()
        const userData = responseData.user // The API returns { user: {...} }
        
        // Set user data from backend response
        setUser(userData)
        setEditForm({
          phone: userData.phone || ''
        })
      } catch (err) {
        console.error('Error fetching user profile:', err)
        setError(err.message || "Erreur lors du chargement du profil")
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [])

  const handleEditClick = () => {
    setEditForm({
      phone: user.phone
    })
    setEditDialogOpen(true)
  }

  const openPasswordDialog = () => {
    setNewPassword('')
    setConfirmPassword('')
    setPasswordDialogOpen(true)
  }

  const handleSaveChanges = async () => {
    try {
      // Get user token
      const token = localStorage.getItem('authToken') || localStorage.getItem('token')
      
      if (!token) {
        alert('Session expirée, veuillez vous reconnecter')
        return
      }

      // Validate form data
      if (!editForm.phone) {
        alert('Veuillez remplir le champ téléphone')
        return
      }

      // Make API call to update user profile
      const response = await fetch(`${config.API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: editForm.phone
        })
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expirée, veuillez vous reconnecter")
        }
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la mise à jour du profil")
      }

      const updatedUser = await response.json()
      
      // Update local state with response from backend
      setUser(updatedUser)
      setEditDialogOpen(false)
      
      alert('Profil mis à jour avec succès!')
      
    } catch (err) {
      console.error('Error updating profile:', err)
      alert(err.message || 'Erreur lors de la mise à jour du profil')
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      alert('Veuillez remplir les deux champs de mot de passe')
      return
    }
    if (newPassword !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas')
      return
    }
    if (newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères')
      return
    }
    const res = await changePassword(newPassword)
    if (res.success) {
      alert('Mot de passe mis à jour avec succès')
      setPasswordDialogOpen(false)
    } else {
      alert(res.error || 'Échec de la mise à jour du mot de passe')
    }
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token')
      
      // Clear all authentication data
      localStorage.removeItem('authToken')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // Redirect to login page
      window.location.href = '/login'
      
    } catch (err) {
      console.error('Error during logout:', err)
      // Even if logout fails, clear local storage and redirect
      localStorage.removeItem('authToken')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <RestaurantIcon
              sx={{
                fontSize: 60,
                color: "primary.main",
                mb: 2,
                animation: "spin 2s linear infinite",
                "@keyframes spin": {
                  "0%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(360deg)" },
                },
              }}
            />
            <Typography variant="h6" color="text.secondary">
              Chargement du profil...
            </Typography>
          </Box>
        </Box>
      </ThemeProvider>
    )
  }

  if (error) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Paper sx={{ p: 4, textAlign: "center", maxWidth: 400 }}>
            <Typography variant="h6" color="error" gutterBottom>
              Erreur
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {error}
            </Typography>
          </Paper>
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
          py: { xs: 2, md: 4 },
        }}
      >
        <Container maxWidth="xl">
          {/* Profile Header Card */}
          <Fade in timeout={800}>
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ textAlign: "center", p: { xs: 2, md: 3 } }}>
                <Zoom in timeout={1000}>
                  <Avatar
                    sx={{
                      width: { xs: 80, md: 100 },
                      height: { xs: 80, md: 100 },
                      mx: "auto",
                      mb: 2,
                      bgcolor: "primary.main",
                      color: "black",
                      fontSize: { xs: "2rem", md: "2.5rem" },
                      fontWeight: 800,
                      border: "4px solid",
                      borderColor: "primary.main",
                      boxShadow: "0 8px 32px rgba(255, 152, 0, 0.3)",
                    }}
                  >
                    {user?.name?.charAt(0) || "U"}
                  </Avatar>
                </Zoom>

                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    fontSize: { xs: "1.5rem", md: "2rem" },
                    fontWeight: 800,
                    background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
                    backgroundClip: "text",
                    textFillColor: "transparent",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {user?.name}
                </Typography>
              </CardContent>
            </Card>
          </Fade>

          {/* Action Buttons */}
          <Fade in timeout={1000}>
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: "primary.main",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 3,
                  }}
                >
                  <SettingsIcon />
                  Actions du compte
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: 2,
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={handleEditClick}
                    sx={{
                      borderColor: "primary.main",
                      color: "primary.main",
                      "&:hover": {
                        borderColor: "primary.light",
                        backgroundColor: "rgba(255, 152, 0, 0.1)",
                      },
                    }}
                  >
                    Modifier le profil
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<LockIcon />}
                    onClick={openPasswordDialog}
                    sx={{
                      borderColor: "primary.main",
                      color: "primary.main",
                      "&:hover": {
                        borderColor: "primary.light",
                        backgroundColor: "rgba(255, 152, 0, 0.1)",
                      },
                    }}
                  >
                    Changer le mot de passe
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                    color="error"
                    sx={{
                      borderColor: "error.main",
                      "&:hover": {
                        backgroundColor: "rgba(244, 67, 54, 0.1)",
                        borderColor: "error.main",
                      },
                    }}
                  >
                    Déconnexion
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Fade>

          <Grid container spacing={3} justifyContent="center">
            {/* Contact Information */}
            <Grid item xs={12} md={7}>
              <Fade in timeout={1200}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: "primary.main",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 3,
                      }}
                    >
                      <ContactMailIcon />
                      Informations de contact
                    </Typography>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                        }}
                      >
                        <AccountCircleIcon sx={{ color: "primary.main" }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Nom complet
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {user?.name}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                        }}
                      >
                        <EmailIcon sx={{ color: "primary.main" }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Email
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {user?.email}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                        }}
                      >
                        <PhoneIcon sx={{ color: "primary.main" }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Téléphone
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {user?.phone}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>

            {/* Account Information */}
            <Grid item xs={12} md={7}>
              <Fade in timeout={1400}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: "primary.main",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 3,
                      }}
                    >
                      <AccountBoxIcon />
                      Informations du compte
                    </Typography>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                        }}
                      >
                        <CalendarIcon sx={{ color: "primary.main" }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Membre depuis
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {new Date(user?.createdAt).toLocaleDateString("fr-FR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                        }}
                      >
                        <ShoppingCartIcon sx={{ color: "primary.main" }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Nombre de commandes
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {user?.orderCount || 0}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                        }}
                      >
                        <RestaurantMenuIcon sx={{ color: "primary.main" }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Plat favori
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {user?.favoritePlat || "Aucun"}
                          </Typography>
                        </Box>
                      </Box>

                      {user?.role && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: "rgba(255, 255, 255, 0.03)",
                          }}
                        >
                          <PersonIcon sx={{ color: "primary.main" }} />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Rôle
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {user.role}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          </Grid>
        </Container>

        {/* Edit Profile Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background: "linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 152, 0, 0.2)",
            },
          }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "primary.main",
              fontWeight: 700,
            }}
          >
            Modifier les informations
            <IconButton onClick={() => setEditDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
              <TextField
                label="Téléphone"
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                fullWidth
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "rgba(255, 152, 0, 0.3)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255, 152, 0, 0.5)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "text.secondary",
                    "&.Mui-focused": {
                      color: "primary.main",
                    },
                  },
                }}
              />
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setEditDialogOpen(false)}
              sx={{
                borderColor: "text.secondary",
                color: "text.secondary",
                "&:hover": {
                  borderColor: "text.primary",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                },
              }}
            >
              Annuler
            </Button>
            
            <Button
              variant="contained"
              onClick={handleSaveChanges}
              startIcon={<SaveIcon />}
              sx={{
                background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
                "&:hover": {
                  background: "linear-gradient(45deg, #f57c00 30%, #ff9800 90%)",
                },
              }}
            >
              Sauvegarder
            </Button>
          </DialogActions>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog
          open={passwordDialogOpen}
          onClose={() => setPasswordDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background: "linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 152, 0, 0.2)",
            },
          }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "primary.main",
              fontWeight: 700,
            }}
          >
            Changer le mot de passe
            <IconButton onClick={() => setPasswordDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
              <TextField
                label="Nouveau mot de passe"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "rgba(255, 152, 0, 0.3)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255, 152, 0, 0.5)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "text.secondary",
                    "&.Mui-focused": {
                      color: "primary.main",
                    },
                  },
                }}
              />
              <TextField
                label="Confirmer le mot de passe"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "rgba(255, 152, 0, 0.3)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255, 152, 0, 0.5)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "text.secondary",
                    "&.Mui-focused": {
                      color: "primary.main",
                    },
                  },
                }}
              />
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setPasswordDialogOpen(false)}
              sx={{
                borderColor: "text.secondary",
                color: "text.secondary",
                "&:hover": {
                  borderColor: "text.primary",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                },
              }}
            >
              Annuler
            </Button>
            
            <Button
              variant="contained"
              onClick={handleChangePassword}
              startIcon={<SaveIcon />}
              sx={{
                background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
                "&:hover": {
                  background: "linear-gradient(45deg, #f57c00 30%, #ff9800 90%)",
                },
              }}
            >
              Sauvegarder
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  )
}
