"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Button,
  Container,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Fade,
  Zoom,
  keyframes,
} from "@mui/material"
import { Home as HomeIcon, Restaurant as RestaurantIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"

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
    h1: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h4: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: "none",
          fontWeight: 600,
          padding: "12px 24px",
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
  },
})

// Funny animations
const bounce = keyframes`
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0,0,0);
  }
  40%, 43% {
    transform: translate3d(0, -30px, 0);
  }
  70% {
    transform: translate3d(0, -15px, 0);
  }
  90% {
    transform: translate3d(0, -4px, 0);
  }
`

const wobble = keyframes`
  0% {
    transform: rotate(0deg);
  }
  15% {
    transform: rotate(-5deg);
  }
  30% {
    transform: rotate(3deg);
  }
  45% {
    transform: rotate(-3deg);
  }
  60% {
    transform: rotate(2deg);
  }
  75% {
    transform: rotate(-1deg);
  }
  100% {
    transform: rotate(0deg);
  }
`

const float = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
  100% {
    transform: translateY(0px);
  }
`

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

export default function NotFoundPage() {
  const [animationType, setAnimationType] = useState("bounce")
  const navigate = useNavigate();

  // Cycle through different animations
  useEffect(() => {
    const animations = ["bounce", "wobble", "float", "spin"]
    let currentIndex = 0

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % animations.length
      setAnimationType(animations[currentIndex])
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const getAnimation = () => {
    switch (animationType) {
      case "bounce":
        return bounce
      case "wobble":
        return wobble
      case "float":
        return float
      case "spin":
        return spin
      default:
        return bounce
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
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decorative elements */}
        <Box
          sx={{
            position: "absolute",
            top: "10%",
            left: "10%",
            width: { xs: 60, md: 100 },
            height: { xs: 60, md: 100 },
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255, 152, 0, 0.1) 0%, transparent 70%)",
            animation: `${float} 6s ease-in-out infinite`,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: "20%",
            right: "15%",
            width: { xs: 40, md: 80 },
            height: { xs: 40, md: 80 },
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255, 152, 0, 0.08) 0%, transparent 70%)",
            animation: `${float} 8s ease-in-out infinite reverse`,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "15%",
            left: "20%",
            width: { xs: 50, md: 90 },
            height: { xs: 50, md: 90 },
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255, 152, 0, 0.06) 0%, transparent 70%)",
            animation: `${float} 7s ease-in-out infinite`,
          }}
        />

        <Container maxWidth="md">
          <Box
            sx={{
              textAlign: "center",
              py: { xs: 4, md: 8 },
            }}
          >
            {/* Animated 404 Number */}
            <Fade in timeout={800}>
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  fontSize: { xs: "8rem", sm: "12rem", md: "16rem" },
                  fontWeight: 900,
                  background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
                  backgroundClip: "text",
                  textFillColor: "transparent",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  mb: 2,
                  lineHeight: 0.8,
                  animation: `${getAnimation()} 2s ease-in-out infinite`,
                  textShadow: "0 0 50px rgba(255, 152, 0, 0.3)",
                }}
              >
                404
              </Typography>
            </Fade>

            {/* Funny animated sauce bottle */}
            <Zoom in timeout={1000}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mb: 4,
                }}
              >
                <Box
                  sx={{
                    width: { xs: 120, md: 200 },
                    height: { xs: 120, md: 200 },
                    borderRadius: "50%",
                    background: "rgba(255, 152, 0, 0.1)",
                    border: "3px dashed rgba(255, 152, 0, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: `${wobble} 3s ease-in-out infinite`,
                    position: "relative",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      background: "rgba(255, 152, 0, 0.05)",
                      animation: `${spin} 20s linear infinite`,
                    },
                  }}
                >
                  <RestaurantIcon
                    sx={{
                      fontSize: { xs: 60, md: 100 },
                      color: "primary.main",
                      animation: `${float} 4s ease-in-out infinite`,
                      zIndex: 1,
                    }}
                  />
                </Box>
              </Box>
            </Zoom>

            {/* Error message */}
            <Fade in timeout={1200}>
              <Typography
                variant="h2"
                component="h2"
                sx={{
                  fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                  fontWeight: 700,
                  color: "text.primary",
                  mb: 2,
                }}
              >
                Oups ! Page introuvable
              </Typography>
            </Fade>

            <Fade in timeout={1400}>
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: "1.2rem", sm: "1.5rem", md: "1.8rem" },
                  color: "text.secondary",
                  mb: 1,
                  maxWidth: "600px",
                  mx: "auto",
                }}
              >
                Il semblerait que cette sauce ait disparu de notre menu ! 🍝
              </Typography>
            </Fade>

            <Fade in timeout={1600}>
              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: "1rem", md: "1.1rem" },
                  color: "text.secondary",
                  mb: 4,
                  maxWidth: "500px",
                  mx: "auto",
                  lineHeight: 1.6,
                }}
              >
                Ne vous inquiétez pas, nos chefs préparent quelque chose de délicieux pour vous. Retournons à la cuisine
                !
              </Typography>
            </Fade>

            {/* Action buttons */}
            <Fade in timeout={1800}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2,
                  justifyContent: "center",
                  alignItems: "center",
                  mt: 4,
                }}
              >
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<HomeIcon />}
                  sx={{
                    minWidth: { xs: "200px", sm: "auto" },
                    background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
                    "&:hover": {
                      background: "linear-gradient(45deg, #f57c00 30%, #ff9800 90%)",
                      transform: "translateY(-3px)",
                      boxShadow: "0 8px 25px rgba(255, 152, 0, 0.3)",
                    },
                  }}
                  onClick={() => navigate("/")}
                >
                  Retour à l'accueil
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<ArrowBackIcon />}
                  sx={{
                    minWidth: { xs: "200px", sm: "auto" },
                    borderColor: "rgba(255, 152, 0, 0.5)",
                    color: "primary.main",
                    "&:hover": {
                      borderColor: "#ff9800",
                      backgroundColor: "rgba(255, 152, 0, 0.1)",
                      transform: "translateY(-3px)",
                    },
                  }}
                  onClick={() => navigate(-1)}
                >
                  Page précédente
                </Button>
              </Box>
            </Fade>

            {/* Fun fact */}
            <Fade in timeout={2000}>
              <Box
                sx={{
                  mt: 6,
                  p: 3,
                  borderRadius: 3,
                  background: "rgba(26, 26, 26, 0.6)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  maxWidth: "400px",
                  mx: "auto",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "primary.main",
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  Le saviez-vous ? 🤔
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    fontStyle: "italic",
                  }}
                >
                  L'erreur 404 tire son nom du bureau 404 au CERN où se trouvait le premier serveur web !
                </Typography>
              </Box>
            </Fade>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  )
}
