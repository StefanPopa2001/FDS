"use client"

import { useState } from "react"
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Tab,
  Tabs,
  Alert,
  IconButton,
  InputAdornment,
  Divider,
  Avatar,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Fade,
  Zoom,
} from "@mui/material"
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Phone,
  Google,
  Facebook,
  Login as LoginIcon,
  PersonAdd,
} from "@mui/icons-material"
import CryptoJS from "crypto-js"
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

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
          borderRadius: 24,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          background: "linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))",
          backdropFilter: "blur(20px)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
            backgroundColor: "rgba(255, 255, 255, 0.05)",
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
          padding: "12px 24px",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: "0 4px",
          textTransform: "none",
          fontWeight: 600,
          "&.Mui-selected": {
            backgroundColor: "rgba(255, 152, 0, 0.1)",
            color: "#ff9800",
          },
        },
      },
    },
  },
})

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState(0) // 0 for login, 1 for signup
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [alert, setAlert] = useState({ show: false, message: "", type: "info" })
  const navigate = useNavigate()

  // Use AuthContext instead of direct API calls
  const { login, register } = useAuth()

  // Form states
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  })

  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })

  // Backend integration for login using AuthContext
  const handleLogin = async (e) => {
    e.preventDefault()
    if (!loginForm.email || !loginForm.password) {
      setAlert({ show: true, message: "Please fill in all fields", type: "error" })
      return
    }
    try {
      const result = await login(loginForm.email, loginForm.password)
      if (result.success) {
        setAlert({ show: true, message: "Login successful!", type: "success" })
        // Redirect to home page
        navigate("/")
      } else {
        setAlert({ show: true, message: result.error || "Login failed", type: "error" })
      }
    } catch (error) {
      setAlert({ show: true, message: "Server error. Please try again.", type: "error" })
    }
  }

  // Backend integration for register using AuthContext
  const handleSignup = async (e) => {
    e.preventDefault()
    if (
      !signupForm.name ||
      !signupForm.email ||
      !signupForm.phone ||
      !signupForm.password
    ) {
      setAlert({ show: true, message: "Please fill in all fields", type: "error" })
      return
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      setAlert({ show: true, message: "Passwords do not match", type: "error" })
      return
    }
    if (signupForm.password.length < 6) {
      setAlert({ show: true, message: "Password must be at least 6 characters long", type: "error" })
      return
    }
    try {
      const salt = CryptoJS.lib.WordArray.random(128 / 8)
      const hashedPassword = CryptoJS.SHA256(signupForm.password + salt).toString()

      const userData = {
        name: signupForm.name,
        email: signupForm.email,
        phone: signupForm.phone,
        password: hashedPassword,
        salt: salt.toString(),
      }
      
      const result = await register(userData)
      if (result.success) {
        setAlert({ show: true, message: "Account created successfully!", type: "success" })
        // Redirect to home page
        navigate("/")
      } else {
        setAlert({ show: true, message: result.error || "Signup failed", type: "error" })
      }
    } catch (error) {
      setAlert({ show: true, message: "Server error. Please try again.", type: "error" })
    }
  }

  const handleSocialLogin = (provider) => {
    console.log(`${provider} login attempted`)
    setAlert({
      show: true,
      message: `${provider} login initiated (Mock response)`,
      type: "info",
    })
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
    setAlert({ show: false, message: "", type: "info" })
  }

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
          p: 2,
        }}
      >
        <Container maxWidth="sm">
          <Fade in timeout={800}>
            <Card
              elevation={24}
              sx={{
                maxWidth: 480,
                mx: "auto",
                overflow: "visible",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                {/* Logo Section */}
                <Zoom in timeout={600}>
                  <Box sx={{ textAlign: "center", mb: 4 }}>
                    <Avatar
                      src="https://www.fritmap.com/images/annonces/large/5000-9999/5750/img5951d615c1c92.jpg"
                      sx={{
                        width: 80,
                        height: 80,
                        mx: "auto",
                        mb: 2,
                        border: "3px solid",
                        borderColor: "primary.main",
                      }}
                    />
                    <Typography
                      variant="h4"
                      component="h1"
                      sx={{
                        background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
                        backgroundClip: "text",
                        textFillColor: "transparent",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        mb: 1,
                      }}
                    >
                      Rudy et Fanny
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Bienvenue dans votre espace personnel
                    </Typography>
                  </Box>
                </Zoom>

                {/* Alert */}
                {alert.show && (
                  <Fade in>
                    <Alert
                      severity={alert.type}
                      onClose={() => setAlert({ show: false, message: "", type: "info" })}
                      sx={{ mb: 3, borderRadius: 2 }}
                    >
                      {alert.message}
                    </Alert>
                  </Fade>
                )}

                {/* Tab Navigation */}
                <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                  <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{
                      "& .MuiTabs-indicator": {
                        backgroundColor: "primary.main",
                        height: 3,
                        borderRadius: "3px 3px 0 0",
                      },
                    }}
                  >
                    <Tab icon={<LoginIcon />} label="Connexion" iconPosition="start" />
                    <Tab icon={<PersonAdd />} label="Inscription" iconPosition="start" />
                  </Tabs>
                </Box>

                {/* Login Form */}
                {activeTab === 0 && (
                  <Fade in timeout={400}>
                    <Box component="form" onSubmit={handleLogin}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email color="primary" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 3 }}
                      />

                      <TextField
                        fullWidth
                        label="Mot de passe"
                        type={showPassword ? "text" : "password"}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock color="primary" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 4 }}
                      />

                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        startIcon={<LoginIcon />}
                        sx={{
                          mb: 3,
                          background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
                          "&:hover": {
                            background: "linear-gradient(45deg, #f57c00 30%, #ff9800 90%)",
                          },
                        }}
                      >
                        Se connecter
                      </Button>

                      <Divider sx={{ mb: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          Ou continuer avec
                        </Typography>
                      </Divider>

                      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<Google />}
                          onClick={() => handleSocialLogin("Google")}
                          sx={{
                            borderColor: "rgba(255, 255, 255, 0.2)",
                            "&:hover": {
                              borderColor: "primary.main",
                              backgroundColor: "rgba(255, 152, 0, 0.1)",
                            },
                          }}
                        >
                          Google
                        </Button>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<Facebook />}
                          onClick={() => handleSocialLogin("Facebook")}
                          sx={{
                            borderColor: "rgba(255, 255, 255, 0.2)",
                            "&:hover": {
                              borderColor: "primary.main",
                              backgroundColor: "rgba(255, 152, 0, 0.1)",
                            },
                          }}
                        >
                          Facebook
                        </Button>
                      </Box>

                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary">
                          Pas encore de compte ?{" "}
                          <Button
                            variant="text"
                            onClick={() => setActiveTab(1)}
                            sx={{ color: "primary.main", p: 0, minWidth: "auto" }}
                          >
                            Inscrivez-vous
                          </Button>
                        </Typography>
                      </Box>
                    </Box>
                  </Fade>
                )}

                {/* Sign Up Form */}
                {activeTab === 1 && (
                  <Fade in timeout={400}>
                    <Box component="form" onSubmit={handleSignup}>
                      <TextField
                        fullWidth
                        label="Nom"
                        value={signupForm.name}
                        onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person color="primary" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 3 }}
                      />

                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email color="primary" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 3 }}
                      />

                      <TextField
                        fullWidth
                        label="Téléphone"
                        type="tel"
                        value={signupForm.phone}
                        onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Phone color="primary" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 3 }}
                      />

                      <TextField
                        fullWidth
                        label="Mot de passe"
                        type={showPassword ? "text" : "password"}
                        value={signupForm.password}
                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock color="primary" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 3 }}
                      />

                      <TextField
                        fullWidth
                        label="Confirmer le mot de passe"
                        type={showConfirmPassword ? "text" : "password"}
                        value={signupForm.confirmPassword}
                        onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock color="primary" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 4 }}
                      />

                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        startIcon={<PersonAdd />}
                        sx={{
                          mb: 3,
                          background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
                          "&:hover": {
                            background: "linear-gradient(45deg, #f57c00 30%, #ff9800 90%)",
                          },
                        }}
                      >
                        Créer un compte
                      </Button>

                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary">
                          Déjà un compte ?{" "}
                          <Button
                            variant="text"
                            onClick={() => setActiveTab(0)}
                            sx={{ color: "primary.main", p: 0, minWidth: "auto" }}
                          >
                            Connectez-vous
                          </Button>
                        </Typography>
                      </Box>
                    </Box>
                  </Fade>
                )}
              </CardContent>
            </Card>
          </Fade>

          {/* Footer */}
          <Fade in timeout={1200}>
            <Box sx={{ textAlign: "center", mt: 4 }}>
              <Typography variant="body2" color="text.secondary">
                © 2024 Rudy et Fanny. Tous droits réservés.
              </Typography>
            </Box>
          </Fade>
        </Container>
      </Box>
    </ThemeProvider>
  )
}
            