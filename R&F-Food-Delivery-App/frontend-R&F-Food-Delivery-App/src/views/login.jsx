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
  Login as LoginIcon,
  PersonAdd,
} from "@mui/icons-material"
import CryptoJS from "crypto-js"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import TermsOfUseModal from "../components/TermsOfUseModal"

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
  const [termsModalOpen, setTermsModalOpen] = useState(false)
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
      setAlert({ show: true, message: "Veuillez remplir tous les champs", type: "error" })
      return
    }
    try {
      const result = await login(loginForm.email, loginForm.password)
      if (result.success) {
        setAlert({ show: true, message: "Connexion réussie !", type: "success" })
        // Redirect to home page
        navigate("/")
      } else {
        // Clear password on any login error
        setLoginForm({ ...loginForm, password: "" })
        setAlert({ show: true, message: result.error || "Échec de la connexion", type: "error" })
      }
    } catch (error) {
      // Clear password on exception as well
      setLoginForm({ ...loginForm, password: "" })
      setAlert({ show: true, message: "Erreur serveur. Veuillez réessayer.", type: "error" })
    }
  }

  // Backend integration for register using AuthContext
  const handleSignup = async (e) => {
    e.preventDefault()
    if (!signupForm.name || !signupForm.email || !signupForm.phone || !signupForm.password) {
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
          p: { xs: 0, sm: 2 },
        }}
      >
        <Container
          maxWidth="md"
          sx={{
            px: { xs: 0, sm: 2 },
            width: "100%",
            display: { md: "flex" },
            flexDirection: { md: "column" },
            justifyContent: { md: "center" },
            alignItems: { md: "center" },
            minHeight: { md: "100vh" },
          }}
        >
          <Fade in timeout={800}>
            <Box
              sx={{
                maxWidth: { xs: "100vw", md: 720 },
                width: { xs: "100vw", md: "100%" },
                mx: { xs: 0, md: "auto" },
                overflow: "visible",
                minHeight: { xs: "100vh", md: "auto" },
                height: "auto",
                borderRadius: { xs: 0, md: 28 },
                boxShadow: { xs: "none", md: undefined },
                p: { xs: 3, md: 6 },
                py: { xs: 6, md: 6 },
                display: "flex",
                flexDirection: "column",
                justifyContent: { xs: "center", md: "flex-start" },
                alignItems: "center",
                minHeight: "auto",
                width: "100%",
                boxSizing: "border-box",
                "& .MuiOutlinedInput-root": {
                  minHeight: { md: 56 },
                  fontSize: { md: "1rem" },
                },
                "& .MuiInputBase-input": {
                  fontSize: { md: "1rem" },
                  padding: { md: "16px 14px" },
                },
                "& .MuiButton-root": {
                  minHeight: { md: 52 },
                  fontSize: { md: "1rem" },
                  fontWeight: { md: 600 },
                },
                "& .MuiAvatar-root": {
                  width: { md: 100 },
                  height: { md: 100 },
                },
                "& h4": {
                  fontSize: { md: "2.2rem" },
                },
              }}
            >
                {/* Logo Section */}
                <Zoom in timeout={600}>
                  <Box sx={{ 
                    textAlign: { xs: "left", md: "center" }, 
                    mb: { xs: 3, md: 4 },
                    display: { xs: "flex", md: "block" },
                    alignItems: { xs: "center", md: "unset" },
                    gap: { xs: 2, md: 0 }
                  }}>
                    <Avatar
                      src="/rudyetfanny-logo-personnages.png"
                      sx={{
                        width: { xs: 48, sm: 80 },
                        height: { xs: 48, sm: 80 },
                        mx: { md: "auto" },
                        mb: { md: 1.5, sm: 2 },
                        border: "3px solid",
                        borderColor: "primary.main",
                      }}
                    />
                    <Box>
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
                          fontSize: { xs: "1.5rem", md: "2.2rem" },
                        }}
                      >
                        Rudy et Fanny
                      </Typography>
                      <Typography variant="body2" color="text.primary" sx={{ fontSize: { xs: "0.8rem", md: "1rem" } }}>
                        Site de commande en ligne
                      </Typography>
                    </Box>
                  </Box>
                </Zoom>

                {/* Alert */}
                {alert.show && (
                  <Fade in>
                    <Alert
                      severity={alert.type}
                      onClose={() => setAlert({ show: false, message: "", type: "info" })}
                      sx={{
                        mb: { xs: 2.5, sm: 3 },
                        borderRadius: 2,
                        width: { md: "100%" },
                        maxWidth: { md: 500 },
                      }}
                    >
                      {alert.message}
                    </Alert>
                  </Fade>
                )}

                {/* Login Form */}
                {activeTab === 0 && (
                  <Fade in timeout={400}>
                    <Box
                      component="form"
                      onSubmit={handleLogin}
                      sx={{
                        width: { xs: "100%", md: "100%" },
                        maxWidth: { md: 500 },
                        mx: "auto",
                      }}
                    >
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
                        sx={{ mb: { xs: 2, md: 3 } }}
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
                        sx={{ mb: { xs: 2.5, md: 4 } }}
                      />

                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        startIcon={<LoginIcon />}
                        sx={{
                          mb: { xs: 2, md: 3 },
                          background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
                          "&:hover": {
                            background: "linear-gradient(45deg, #f57c00 30%, #ff9800 90%)",
                          },
                        }}
                      >
                        Se connecter
                      </Button>

                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary">
                          Pas encore de compte ?{" "}
                          <Typography
                            component="span"
                            onClick={() => setActiveTab(1)}
                            sx={{
                              color: "primary.main",
                              cursor: "pointer",
                              textDecoration: "underline",
                              "&:hover": { textDecoration: "underline" },
                            }}
                          >
                            Inscrivez-vous
                          </Typography>
                        </Typography>

                      </Box>
                    </Box>
                  </Fade>
                )}

                {/* Sign Up Form */}
                {activeTab === 1 && (
                  <Fade in timeout={400}>
                    <Box
                      component="form"
                      onSubmit={handleSignup}
                      sx={{
                        width: { xs: "100%", md: "100%" },
                        maxWidth: { md: 500 },
                        mx: "auto",
                      }}
                    >
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
                        sx={{ mb: { xs: 2, md: 3 } }}
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
                        sx={{ mb: { xs: 2, md: 3 } }}
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
                        sx={{ mb: { xs: 2, md: 3 } }}
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
                        sx={{ mb: { xs: 2, md: 3 } }}
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
                        sx={{ mb: { xs: 2.5, md: 4 } }}
                      />

                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        startIcon={<PersonAdd />}
                        sx={{
                          mb: { xs: 2, md: 3 },
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
                          <Typography
                            component="span"
                            onClick={() => setActiveTab(0)}
                            sx={{
                              color: "primary.main",
                              cursor: "pointer",
                              textDecoration: "underline",
                              "&:hover": { textDecoration: "underline" },
                            }}
                          >
                            Connectez-vous
                          </Typography>
                        </Typography>

                      </Box>
                    </Box>
                  </Fade>
                )}

                {/* Footer content */}
                <Box sx={{ textAlign: "center", mt: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    En continuant, vous acceptez nos{" "}
                    <Typography
                      component="span"
                      onClick={() => setTermsModalOpen(true)}
                      sx={{
                        color: "text.secondary",
                        cursor: "pointer",
                        textDecoration: "underline",
                        fontSize: "inherit",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      conditions d'utilisation, politique de confidentialité et politique de cookies
                    </Typography>
                    <br />
                    © 2025 Rudy et Fanny. Tous droits réservés.
                  </Typography>
                </Box>
              </Box>
            </Fade>
        </Container>
      </Box>

      {/* Terms of Use Modal */}
      <TermsOfUseModal open={termsModalOpen} onClose={() => setTermsModalOpen(false)} />
    </ThemeProvider>
  )
}
