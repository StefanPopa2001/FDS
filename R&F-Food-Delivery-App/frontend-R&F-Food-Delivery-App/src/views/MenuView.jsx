"use client"

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Container,
  Chip,
  TextField,
  useMediaQuery,
  useTheme,
  Paper,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Skeleton,
  Fade,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Grid,
  Avatar,
} from "@mui/material"
import {
  Search as SearchIcon,
  Restaurant as RestaurantIcon,
  ExpandMore as ExpandMoreIcon,
  LocalDining as LocalDiningIcon,
  Star as StarIcon,
} from "@mui/icons-material"
import LazyImage from '../components/LazyImage'
import PlatCard from '../components/PlatCard'
import SauceCard from '../components/SauceCard'
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
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
      fontSize: "3rem",
    },
    h2: {
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    h3: {
      fontWeight: 600,
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
          borderRadius: 20,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          background: "linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))",
          backdropFilter: "blur(10px)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 20px 40px rgba(255, 152, 0, 0.15), 0 0 0 1px rgba(255, 152, 0, 0.1)",
            border: "1px solid rgba(255, 152, 0, 0.2)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
})

// Enhanced placeholder component
const PlaceholderImage = ({ alt, sx, ...props }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255, 152, 0, 0.1)",
      border: "2px dashed rgba(255, 152, 0, 0.3)",
      width: "100%",
      height: "100%",
      minHeight: "300px",
      flexShrink: 0,
      ...sx,
    }}
    {...props}
  >
    <RestaurantIcon
      sx={{
        fontSize: { xs: 48, md: 64 },
        color: "rgba(255, 152, 0, 0.5)",
        opacity: 0.7,
      }}
    />
  </Box>
)

const MenuView = () => {
  const [sauces, setSauces] = useState([])
  const [plats, setPlats] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [searchableTags, setSearchableTags] = useState([])
  const [selectedTagFilter, setSelectedTagFilter] = useState("all")
  const [settings, setSettings] = useState({})
  const [visibleCountPlats, setVisibleCountPlats] = useState(12)
  const [visibleCountSauces, setVisibleCountSauces] = useState(12)
  const sentinelPlatsRef = useRef(null)
  const sentinelSaucesRef = useRef(null)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch sauces and plats in parallel
  useEffect(() => {
    let cancelled = false
    const fetchAll = async () => {
      try {
        const [sRes, pRes] = await Promise.allSettled([
          fetch(`${config.API_URL}/sauces`),
          fetch(`${config.API_URL}/plats`)
        ])

        if (!cancelled && sRes.status === 'fulfilled') {
          const text = await sRes.value.text()
          try {
            const data = JSON.parse(text)
            setSauces(Array.isArray(data) ? data : [])
          } catch (e) {
            console.error('Failed to parse sauces JSON:', e, 'raw:', text)
            setSauces([])
          }
        }
        if (!cancelled && pRes.status === 'fulfilled') {
          const text = await pRes.value.text()
          try {
            const data = JSON.parse(text)
            setPlats(Array.isArray(data) ? data : [])
          } catch (e) {
            console.error('Failed to parse plats JSON:', e, 'raw:', text)
            setPlats([])
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchAll()
    return () => { cancelled = true }
  }, [])

  // Fetch searchable tags
  useEffect(() => {
    const fetchSearchableTags = async () => {
      try {
        const response = await fetch(`${config.API_URL}/tags/searchable`)
        if (response.ok) {
          const text = await response.text()
          try {
            const data = JSON.parse(text)
            setSearchableTags(data)
          } catch (err) {
            console.error('Failed to parse searchable tags JSON:', err, 'raw:', text)
            setSearchableTags([])
          }
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
          const text = await response.text();
          try {
            const data = JSON.parse(text);
            const settingsMap = {};
            data.forEach(setting => {
              let val = setting.value;
              if (val === 'true') val = true;
              else if (val === 'false') val = false;
              else if (!isNaN(val) && val !== '') val = Number(val);
              settingsMap[setting.key] = val;
            });
            setSettings(settingsMap);
          } catch (err) {
            console.error('Failed to parse settings JSON:', err, 'raw:', text)
          }
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };
    fetchSettings();
  }, []);

  // (moved below filtered lists to avoid referencing before initialization)

  // Filtered sauces
  const filteredSauces = useMemo(() => {
    let filtered = [...sauces]

    if (selectedTagFilter !== "all") {
      filtered = filtered.filter((sauce) => {
        if (!sauce.tags || sauce.tags.length === 0) return false
        return sauce.tags.some(tag => tag.id === parseInt(selectedTagFilter))
      })
    }

    if (debouncedSearchTerm) {
      filtered = filtered.filter((sauce) =>
        sauce.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        sauce.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    }

    // Sort by ordre (ascending), then by name alphabetically
    filtered.sort((a, b) => {
      const ordreA = a.ordre ? parseInt(a.ordre, 10) : 999
      const ordreB = b.ordre ? parseInt(b.ordre, 10) : 999
      
      if (ordreA !== ordreB) {
        return ordreA - ordreB
      }
      
      return a.name.localeCompare(b.name)
    })

    return filtered.filter(sauce => sauce.available)
  }, [sauces, selectedTagFilter, debouncedSearchTerm])

  // Filtered plats
  const filteredPlats = useMemo(() => {
    let filtered = [...plats]

    if (selectedTagFilter !== "all") {
      filtered = filtered.filter((plat) => {
        if (!plat.tags || plat.tags.length === 0) return false
        return plat.tags.some(tag => tag.id === parseInt(selectedTagFilter))
      })
    }

  if (!settings.enableSpecialites) {
      filtered = filtered.map((plat) => ({
        ...plat,
        available: plat.speciality ? false : plat.available
      }))
    }

    if (debouncedSearchTerm) {
      filtered = filtered.filter((plat) =>
        plat.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        plat.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    }

    // Sort by ordre (ascending), then by name alphabetically
    filtered.sort((a, b) => {
      const ordreA = a.ordre ? parseInt(a.ordre, 10) : 999
      const ordreB = b.ordre ? parseInt(b.ordre, 10) : 999
      
      if (ordreA !== ordreB) {
        return ordreA - ordreB
      }
      
      return a.name.localeCompare(b.name)
    })

    return filtered.filter(plat => plat.available)
  }, [plats, selectedTagFilter, settings, debouncedSearchTerm])

  // Progressive reveal: increase visible counts when scrolling near the end
  useEffect(() => {
    const isSmall = typeof window !== 'undefined' ? window.innerWidth < 900 : false
    const incrementPlats = isSmall ? 8 : 16
    const incrementSauces = isSmall ? 8 : 16

    const createObserver = (ref, cb) => {
      if (!ref.current) return null
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) cb()
          })
        },
        { rootMargin: '200px' }
      )
      io.observe(ref.current)
      return io
    }

    const ioPlats = createObserver(sentinelPlatsRef, () => setVisibleCountPlats((c) => Math.min(c + incrementPlats, filteredPlats.length)))
    const ioSauces = createObserver(sentinelSaucesRef, () => setVisibleCountSauces((c) => Math.min(c + incrementSauces, filteredSauces.length)))
    return () => {
      ioPlats?.disconnect()
      ioSauces?.disconnect()
    }
  }, [filteredPlats.length, filteredSauces.length])

  const handleTagFilterSelect = useCallback((tagId) => {
    setSelectedTagFilter(tagId)
    setVisibleCountPlats(12)
    setVisibleCountSauces(12)
  }, [])

  if (loading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 4 }}>
          <Container maxWidth="xl">
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Skeleton variant="text" width={300} height={60} sx={{ mx: 'auto', mb: 2 }} />
              <Skeleton variant="text" width={200} height={40} sx={{ mx: 'auto' }} />
            </Box>
            <Grid container spacing={3}>
              {[...Array(6)].map((_, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 4 }}>
        <Container maxWidth="xl">
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h1"
              sx={{
                background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2
              }}
            >
              Rudy et Fanny
            </Typography>
            <Typography variant="h3" color="text.secondary" sx={{ mb: 4 }}>
              Notre Carte
            </Typography>
          </Box>

          {/* Search and Filters */}
          <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Rechercher un plat ou une sauce..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip
                    label="Tous"
                    onClick={() => handleTagFilterSelect("all")}
                    variant={selectedTagFilter === "all" ? "filled" : "outlined"}
                    sx={{
                      borderRadius: 2,
                      '&.MuiChip-filled': {
                        background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
                      }
                    }}
                  />
                  {searchableTags.map((tag) => (
                    <Chip
                      key={tag.id}
                      label={`${tag.emoji} ${tag.nom}`}
                      onClick={() => handleTagFilterSelect(tag.id.toString())}
                      variant={selectedTagFilter === tag.id.toString() ? "filled" : "outlined"}
                      sx={{
                        borderRadius: 2,
                        '&.MuiChip-filled': {
                          background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
                        }
                      }}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Plats Section */}
          {filteredPlats.length > 0 && (
            <Box sx={{ mb: 6 }}>
              <Typography variant="h2" sx={{ mb: 4, textAlign: 'center' }}>
                Nos Plats
              </Typography>
              <Grid container spacing={4}>
                {filteredPlats.slice(0, visibleCountPlats).map((plat) => (
                  <Grid item xs={6} sm={4} md={3} lg={2.4} key={plat.id}>
                    <PlatCard plat={plat} isMobile={isMobile} />
                  </Grid>
                ))}
              </Grid>
              {visibleCountPlats < filteredPlats.length && (
                <Box ref={sentinelPlatsRef} sx={{ height: 1 }} />
              )}
            </Box>
          )}

          {/* Sauces Section */}
          {filteredSauces.length > 0 && (
            <Box sx={{ mb: 6 }}>
              <Typography variant="h2" sx={{ mb: 4, textAlign: 'center' }}>
                Nos Sauces
              </Typography>
              <Grid container spacing={4}>
                {filteredSauces.slice(0, visibleCountSauces).map((sauce) => (
                  <Grid item xs={6} sm={4} md={3} lg={2.4} key={sauce.id}>
                    <SauceCard sauce={sauce} isMobile={isMobile} />
                  </Grid>
                ))}
              </Grid>
              {visibleCountSauces < filteredSauces.length && (
                <Box ref={sentinelSaucesRef} sx={{ height: 1 }} />
              )}
            </Box>
          )}

          {/* No results */}
          {filteredPlats.length === 0 && filteredSauces.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <LocalDiningIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary">
                Aucun plat ou sauce trouvé
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Essayez de modifier vos critères de recherche
              </Typography>
            </Box>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  )
}

export default MenuView
