"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Container,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useMediaQuery,
  useTheme,
  Paper,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Skeleton,
  Fade,
  Zoom,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from "@mui/material"
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Star as StarIcon,
  Restaurant as RestaurantIcon,
  LocalShipping as TruckIcon,
  Block as BlockIcon,
  Fastfood as FastfoodIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  LocalDining as LocalDiningIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ArrowBackIosNew as ArrowBackIosNewIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
} from "@mui/icons-material"
import { useBasket } from '../contexts/BasketContext'
import LazyImage from '../components/LazyImage'
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
    h2: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h5: {
      fontWeight: 500,
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
          borderRadius: 16,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          background: "linear-gradient(145deg, rgba(26, 26, 26, 0.9), rgba(20, 20, 20, 0.9))",
          backdropFilter: "blur(10px)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-8px) scale(1.02)",
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
      minHeight: "100%",
      maxHeight: "100%",
      flexShrink: 0,
      ...sx,
    }}
    {...props}
  >
    <RestaurantIcon
      sx={{
        fontSize: { xs: 32, md: 48 },
        color: "rgba(255, 152, 0, 0.5)",
        opacity: 0.7,
      }}
    />
  </Box>
)

const Menu = () => {
  const [sauces, setSauces] = useState([])
  const [plats, setPlats] = useState([])
  const [selectedSauce, setSelectedSauce] = useState(null)
  const [selectedPlat, setSelectedPlat] = useState(null)
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [quantity, setQuantity] = useState(1)
  const [itemMessage, setItemMessage] = useState("")
  // Throttle search input for better mobile performance
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("available")
  const [modalOpen, setModalOpen] = useState(false)
  const [platVersionModalOpen, setPlatVersionModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [imageErrors, setImageErrors] = useState({})
  
  // New state for tag filtering
  const [searchableTags, setSearchableTags] = useState([])
  const [selectedTagFilter, setSelectedTagFilter] = useState("all")

  // Settings state
  const [settings, setSettings] = useState({})

  // Basket context
  const { addToBasket } = useBasket()

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const isTablet = useMediaQuery(theme.breakpoints.between("md", "lg"))

  // Debounce search term to improve performance on mobile
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, isMobile ? 300 : 150) // Longer debounce on mobile

    return () => clearTimeout(timer)
  }, [searchTerm, isMobile])

  // Memoize card styles for better performance
  const cardStyles = useMemo(() => ({
    width: { xs: 160, md: 220 },
    height: { xs: 200, md: 280 },
    display: "flex",
    flexDirection: "column",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
  // Reduce paints on mobile
  contain: isMobile ? "layout paint size style" : undefined,
  willChange: isMobile ? undefined : "transform",
  boxShadow: isMobile ? "none" : undefined,
  transition: isMobile ? "none" : "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": isMobile ? {} : {
      transform: "translateY(-8px) scale(1.02)",
      boxShadow: "0 20px 40px rgba(255, 152, 0, 0.15), 0 0 0 1px rgba(255, 152, 0, 0.1)",
      border: "1px solid rgba(255, 152, 0, 0.2)",
    },
  }), [isMobile])

  // Normalized, less-restrictive search
  const normalizeText = useCallback((str) => {
    if (!str) return "";
    // NFD split accents, remove diacritics, lowercase
    let s = String(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    // Map ligatures
    s = s.replace(/œ/g, 'oe').replace(/æ/g, 'ae');
    // Apostrophes/dashes/underscores → space
    s = s.replace(/[’'`´^~¨]/g, ' ') // apostrophes and similar
         .replace(/[-–—_]/g, ' ');   // hyphen-like chars
    // Collapse other punctuation to space, collapse spaces
    s = s.replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
    return s;
  }, []);

  const searchMatch = useCallback((candidate, query) => {
    const c = normalizeText(candidate);
    const q = normalizeText(query);
    if (!q) return true; // empty query -> no filter
    if (c.includes(q)) return true;
    const tokens = q.split(' ').filter(Boolean);
    const significant = tokens.filter(t => t.length >= 2);
    // If user typed only tiny tokens (like a single letter), fall back to includes on full q
    if (significant.length === 0) {
      return c.includes(q);
    }
    // AND semantics: all tokens must be present to avoid returning everything on whitespace
    return significant.every(t => c.includes(t));
  }, [normalizeText]);

  // Helper function to check if ordering is allowed
  const isOrderingDisabled = () => {
    return settings.enableOnlinePickup === "false" && settings.enableOnlineDelivery === "false";
  };

  // Fetch sauces with tag filtering
  useEffect(() => {
    const fetchSauces = async () => {
      try {
        // Fetch all sauces without tag filtering (we'll filter client-side)
        let url = `${config.API_URL}/sauces`
        const response = await fetch(url)
        if (response.ok) {
          let data = await response.json()
          // Set deliveryAvailable to true for all sauces since field is removed
          data = data.map(sauce => ({
            ...sauce,
            deliveryAvailable: true,
          }))
          setSauces(data)
        }
      } catch (error) {
        console.error("Failed to fetch sauces:", error)
        // Mock data for demo purposes
        const mockData = [
          { id: 1, name: "Ketchup", price: 0.5, available: true, deliveryAvailable: true, image: null, tags: [] },
          { id: 2, name: "Mayonnaise", price: 0.5, available: true, deliveryAvailable: true, image: null, tags: [] },
          { id: 3, name: "Barbecue", price: 0.8, available: true, deliveryAvailable: true, image: null, tags: [] },
        ]
        setSauces(mockData)
      }
    }
    fetchSauces()
  }, []) // Remove selectedTagFilters dependency

  // Fetch plats with tag filtering
  useEffect(() => {
    const fetchPlats = async () => {
      try {
        // Fetch all plats without tag filtering (we'll filter client-side)
        let url = `${config.API_URL}/plats`
        
        const response = await fetch(url)
        if (response.ok) {
          let data = await response.json()
          // Ensure deliveryAvailable is set for each plat
          data = data.map(plat => ({
            ...plat,
            deliveryAvailable: typeof plat.availableForDelivery === "boolean"
              ? plat.availableForDelivery
              : false,
          }))
          setPlats(data)
        }
      } catch (error) {
        console.error("Failed to fetch plats:", error)
        // Mock data for demo purposes
        const mockData = [
          { 
            id: 1, 
            name: "Frites", 
            price: 4.5, 
            available: true, 
            deliveryAvailable: true, 
            speciality: false, 
            image: null,
            saucePrice: 1.5, // Can add sauce for €1.5
            tags: [
              {
                id: 1,
                nom: "Accompagnements",
                description: "Extras pour accompagner",
                emoji: "🍟",
                extras: [
                  { id: 1, nom: "Cheddar", description: "Fromage cheddar fondu", price: 1.0, available: true },
                  { id: 2, nom: "Bacon", description: "Bacon croustillant", price: 1.5, available: true },
                  { id: 3, nom: "Oignons frits", description: "Oignons croustillants", price: 0.8, available: true }
                ]
              }
            ],
            versions: [
              { id: 1, size: "M", extraPrice: 0 },
              { id: 2, size: "L", extraPrice: 1.5 },
              { id: 3, size: "XL", extraPrice: 2.5 }
            ]
          },
          { 
            id: 2, 
            name: "Burger Classic", 
            price: 8.0, 
            available: true, 
            deliveryAvailable: true, 
            speciality: true, 
            image: null,
            saucePrice: 0, // Sauce included for free
            tags: [
              {
                id: 2,
                nom: "Garnitures Burger",
                description: "Extras pour burgers",
                emoji: "🍔",
                extras: [
                  { id: 4, nom: "Double Steak", description: "Steak supplémentaire", price: 3.0, available: true },
                  { id: 5, nom: "Cheese", description: "Fromage supplémentaire", price: 1.0, available: true },
                  { id: 6, nom: "Cornichons", description: "Cornichons tranchés", price: 0.5, available: true }
                ]
              }
            ],
            versions: [
              { id: 4, size: "Standard", extraPrice: 0 },
              { id: 5, size: "Double", extraPrice: 3.0 }
            ]
          }
        ]
        setPlats(mockData)
      }
    }
    fetchPlats()
  }, []) // Remove selectedTagFilters dependency

  // Fetch searchable tags
  useEffect(() => {
    const fetchSearchableTags = async () => {
      try {
        const response = await fetch(`${config.API_URL}/tags/searchable`)
        if (response.ok) {
          const data = await response.json()
          setSearchableTags(data)
        } else {
          console.error("Failed to fetch searchable tags:", response.status)
          // Set empty array if endpoint fails
          setSearchableTags([])
        }
      } catch (error) {
        console.error("Failed to fetch searchable tags:", error)
        // Set empty array if fetch fails
        setSearchableTags([])
      } finally {
        // Always set "all" as selected by default
        setSelectedTagFilter("all")
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
          const data = await response.json();
          const settingsMap = {};
          data.forEach(setting => {
            settingsMap[setting.key] = setting.value;
          });
          setSettings(settingsMap);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };
    fetchSettings();
  }, []);

  // Set loading to false when all data is loaded
  useEffect(() => {
    // Check if searchableTags has been set (even if empty array)
    if (sauces.length >= 0 && plats.length >= 0 && searchableTags !== null) {
      setLoading(false)
    }
  }, [sauces, plats, searchableTags])

  // Optimized filtering with useMemo
  const filteredSauces = useMemo(() => {
    let filteredSauceData = [...sauces]

    // Tag filtering: Show items if they match the selected tag, or show all if "all" is selected
    if (selectedTagFilter !== "all") {
      filteredSauceData = filteredSauceData.filter((sauce) => {
        // If sauce has no tags, hide it when a specific tag filter is active
        if (!sauce.tags || sauce.tags.length === 0) {
          return false
        }
        // Show sauce if it has the selected tag
        return sauce.tags.some(tag => tag.id === parseInt(selectedTagFilter))
      })
    }

    if (filterType === "available") {
      filteredSauceData = filteredSauceData.filter((sauce) => sauce.available)
    } else if (filterType === "delivery") {
      filteredSauceData = filteredSauceData.filter((sauce) => sauce.available && sauce.deliveryAvailable)
    }

    if (debouncedSearchTerm) {
      filteredSauceData = filteredSauceData.filter((sauce) => {
        const haystack = [
          sauce.name,
          ...(Array.isArray(sauce.tags) ? sauce.tags.map(t => t.nom || t.name || '') : []),
        ].join(' ');
        return searchMatch(haystack, debouncedSearchTerm);
      })
    }

    // Sort by ordre (ascending), then by name alphabetically
    filteredSauceData.sort((a, b) => {
      const ordreA = a.ordre ? parseInt(a.ordre, 10) : 999
      const ordreB = b.ordre ? parseInt(b.ordre, 10) : 999
      
      if (ordreA !== ordreB) {
        return ordreA - ordreB
      }
      
      return a.name.localeCompare(b.name)
    })

    return filteredSauceData
  }, [sauces, selectedTagFilter, filterType, debouncedSearchTerm])

  const filteredPlats = useMemo(() => {
    let filteredPlatData = [...plats]

    // Tag filtering: Show items if they match the selected tag, or show all if "all" is selected
    if (selectedTagFilter !== "all") {
      filteredPlatData = filteredPlatData.filter((plat) => {
        const tagId = Number(selectedTagFilter)
        // Match if the plat itself has the tag OR any of its versions has the tag
        const platHas = Array.isArray(plat.tags) && plat.tags.some(tag => tag.id === tagId)
        const versionHas = Array.isArray(plat.versions) && plat.versions.some(v => Array.isArray(v.tags) && v.tags.some(t => t.id === tagId))
        return platHas || versionHas
      })
    }

    // Apply speciality filter based on settings
    if (settings.enableSpecialites === "false") {
      // If specialities are disabled, mark them as unavailable but keep them visible
      filteredPlatData = filteredPlatData.map((plat) => ({
        ...plat,
        available: plat.speciality ? false : plat.available
      }))
    }

    if (filterType === "available") {
      filteredPlatData = filteredPlatData.filter((plat) => plat.available)
    } else if (filterType === "delivery") {
      filteredPlatData = filteredPlatData.filter((plat) => plat.available && plat.deliveryAvailable)
    } else if (filterType === "speciality") {
      filteredPlatData = filteredPlatData.filter((plat) => plat.speciality)
    }

    if (debouncedSearchTerm) {
      filteredPlatData = filteredPlatData.filter((plat) => {
        const tagTexts = Array.isArray(plat.tags) ? plat.tags.map(t => t.nom || t.name || '') : [];
        const versionTexts = Array.isArray(plat.versions) ? plat.versions.map(v => v.size || '') : [];
        const haystack = [plat.name, ...tagTexts, ...versionTexts].join(' ');
        return searchMatch(haystack, debouncedSearchTerm);
      })
    }

    // Sort by ordre (ascending), then by name alphabetically
    filteredPlatData.sort((a, b) => {
      const ordreA = a.ordre ? parseInt(a.ordre, 10) : 999
      const ordreB = b.ordre ? parseInt(b.ordre, 10) : 999
      
      if (ordreA !== ordreB) {
        return ordreA - ordreB
      }
      
      return a.name.localeCompare(b.name)
    })

    return filteredPlatData
  }, [plats, selectedTagFilter, settings, filterType, debouncedSearchTerm])

  const handleSauceClick = (sauce) => {
    setSelectedSauce(sauce)
    setModalOpen(true)
  }

  const handlePlatClick = (plat) => {
    setSelectedPlat(plat)
    // Preselect version by active tag if available; otherwise if single version, select it
    let initialVersion = null
    if (selectedTagFilter !== "all" && Array.isArray(plat.versions)) {
      const tagId = Number(selectedTagFilter)
      initialVersion = plat.versions.find(v => Array.isArray(v.tags) && v.tags.some(t => t.id === tagId)) || null
    }
    if (!initialVersion && plat.versions && plat.versions.length === 1) {
      initialVersion = plat.versions[0]
    }
    setSelectedVersion(initialVersion)
    setSelectedSauceForPlat(null)
    setSelectedExtras([]) // Reset selected extras
    setSelectedIngredients([]) // Reset removed ingredients
    setQuantity(1)
    setPlatVersionModalOpen(true)
  }

  const [selectedSauceForPlat, setSelectedSauceForPlat] = useState(null)
  const [selectedExtras, setSelectedExtras] = useState([]) // Array of selected extra IDs
  // Version image carousel state
  const [currentImageIdx, setCurrentImageIdx] = useState(0)

  const handleSauceSelect = (sauceId) => {
    const sauce = sauces.find(s => s.id === sauceId);
    setSelectedSauceForPlat(sauce || null);
  }

  // Build version image list for the selected plat
  const versionImages = useMemo(() => {
    if (!selectedPlat) return [];
    const withImages = (selectedPlat.versions || [])
      .filter(v => v && v.image)
      .map(v => ({
        id: v.id,
        label: v.size,
        src: v.image.startsWith("http") ? v.image : `${config.API_URL}${v.image}`,
      }));
    if (withImages.length === 0 && selectedPlat.image) {
      // Fallback to base plat image if no version images exist
      return [{ id: null, label: "Plat", src: selectedPlat.image.startsWith("http") ? selectedPlat.image : `${config.API_URL}${selectedPlat.image}` }];
    }
    return withImages;
  }, [selectedPlat]);

  // Reset carousel when opening a new plat
  useEffect(() => {
    setCurrentImageIdx(0);
  }, [selectedPlat]);

  // When selecting a version, if it has an image, sync carousel to it
  useEffect(() => {
    if (!selectedPlat || !selectedVersion) return;
    const withImages = (selectedPlat.versions || []).filter(v => v && v.image);
    const idx = withImages.findIndex(v => v.id === selectedVersion.id);
    if (idx >= 0) setCurrentImageIdx(idx);
  }, [selectedVersion, selectedPlat]);

  const showPrevImage = () => {
    if (versionImages.length <= 1) return;
    const nextIdx = (currentImageIdx - 1 + versionImages.length) % versionImages.length;
    setCurrentImageIdx(nextIdx);
    // If the image corresponds to a version, select it for consistent pricing
    const target = versionImages[nextIdx];
    const v = (selectedPlat?.versions || []).find(ver => ver.id === target.id);
    if (v) handleVersionSelect(v);
  };

  const showNextImage = () => {
    if (versionImages.length <= 1) return;
    const nextIdx = (currentImageIdx + 1) % versionImages.length;
    setCurrentImageIdx(nextIdx);
    const target = versionImages[nextIdx];
    const v = (selectedPlat?.versions || []).find(ver => ver.id === target.id);
    if (v) handleVersionSelect(v);
  };

  const handleVersionSelect = (version) => {
    setSelectedVersion(version)
  }

  // Render helpers to avoid duplicating card markup and allow conditional animation wrappers
  const renderSauceCard = useCallback((sauce) => (
    <Card
      sx={{ ...cardStyles, opacity: sauce.available ? 1 : 0.6, backdropFilter: isMobile ? "none" : undefined, boxShadow: isMobile ? "none" : undefined }}
      onClick={() => handleSauceClick(sauce)}
    >
      {/* Image Section */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: { xs: 120, md: 160 },
          flexShrink: 0,
        }}
      >
        {/* Centered chip for unavailable */}
        {!sauce.available && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 3,
              bgcolor: "rgba(244, 67, 54, 0.85)",
              px: { xs: 1.5, md: 3 },
              py: { xs: 0.5, md: 1 },
              borderRadius: 2,
              boxShadow: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: "#fff",
                fontWeight: 700,
                fontSize: { xs: "0.95rem", md: "1.15rem" },
                textAlign: "center",
                letterSpacing: 0.5,
              }}
            >
              Victime de son succès
            </Typography>
          </Box>
        )}

        {/* Top right: Truck for delivery */}
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 2,
            bgcolor: !sauce.available
              ? "rgba(244, 67, 54, 0.85)"
              : sauce.deliveryAvailable
                ? "rgba(76, 175, 80, 0.85)"
                : "rgba(244, 67, 54, 0.85)",
            borderRadius: "50%",
            p: 0.5,
            boxShadow: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {!sauce.available ? (
            <Box sx={{ position: "relative", display: "inline-flex" }}>
              <TruckIcon sx={{ color: "#fff", fontSize: { xs: 18, md: 22 }, opacity: 0.7 }} />
              <BlockIcon sx={{
                color: "#fff",
                fontSize: { xs: 18, md: 22 },
                position: "absolute",
                top: 0,
                left: 0,
                opacity: 0.8,
              }} />
            </Box>
          ) : sauce.deliveryAvailable ? (
            <TruckIcon sx={{ color: "#fff", fontSize: { xs: 18, md: 22 } }} />
          ) : (
            <Box sx={{ position: "relative", display: "inline-flex" }}>
              <TruckIcon sx={{ color: "#fff", fontSize: { xs: 18, md: 22 }, opacity: 0.7 }} />
              <BlockIcon sx={{
                color: "#fff",
                fontSize: { xs: 18, md: 22 },
                position: "absolute",
                top: 0,
                left: 0,
                opacity: 0.8,
              }} />
            </Box>
          )}
        </Box>

    {sauce.image && !imageErrors[sauce.id] ? (
          <LazyImage
            src={sauce.image.startsWith("http") ? sauce.image : `${config.API_URL}${sauce.image}`}
            alt={sauce.name}
      reduceMotion={isMobile || isTablet}
      sizes={isMobile ? '(max-width: 600px) 50vw' : '(min-width: 600px) 220px'}
            onError={() => handleImageError(sauce.id)}
            placeholder={
              <PlaceholderImage
                alt={sauce.name}
                sx={{
                  width: "100%",
                  height: "100%",
                }}
              />
            }
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "fill",
            }}
          />
        ) : (
          <PlaceholderImage
            alt={sauce.name}
            sx={{
              width: "100%",
              height: "100%",
            }}
          />
        )}
      </Box>

      {/* Content Section */}
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          p: { xs: 1.5, md: 2 },
          height: { xs: 80, md: 120 },
          overflow: "hidden",
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h6"
            component="h2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "0.9rem", md: "1.1rem" },
              mb: 1,
              lineHeight: 1.3,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {sauce.name}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: "auto",
          }}
        >
          <Typography
            variant="h6"
            color="primary"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1rem", md: "1.2rem" },
            }}
          >
            €{sauce.price.toFixed(2)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  ), [handleSauceClick, imageErrors, isMobile])

  const renderPlatCard = useCallback((plat, index) => (
    <Card
      sx={{
        ...cardStyles,
        backdropFilter: isMobile ? "none" : undefined,
        boxShadow: isMobile ? "none" : undefined,
      }}
      onClick={() => handlePlatClick(plat)}
    >
      {/* Image Section */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: { xs: 120, md: 160 },
          flexShrink: 0,
        }}
      >
        {/* Top left: Star for speciality */}
        {plat.speciality && (
          <Box
            sx={{
              position: "absolute",
              top: 8,
              left: 8,
              zIndex: 2,
              bgcolor: "rgba(255, 152, 0, 0.85)",
              borderRadius: "50%",
              p: 0.5,
              boxShadow: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <StarIcon sx={{ color: "#fff700", fontSize: { xs: 18, md: 22 } }} />
          </Box>
        )}

        {/* Centered chip for unavailable */}
        {!plat.available && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 3,
              bgcolor: "rgba(244, 67, 54, 0.85)",
              px: { xs: 1.5, md: 3 },
              py: { xs: 0.5, md: 1 },
              borderRadius: 2,
              boxShadow: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: "#fff",
                fontWeight: 700,
                fontSize: { xs: "0.95rem", md: "1.15rem" },
                textAlign: "center",
                letterSpacing: 0.5,
              }}
            >
              Victime de son succès
            </Typography>
          </Box>
        )}

        {/* Top right: Truck for delivery */}
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 2,
            bgcolor: !plat.available
              ? "rgba(244, 67, 54, 0.85)"
              : plat.deliveryAvailable
                ? "rgba(76, 175, 80, 0.85)"
                : "rgba(244, 67, 54, 0.85)",
            borderRadius: "50%",
            p: 0.5,
            boxShadow: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {!plat.available ? (
            <Box sx={{ position: "relative", display: "inline-flex" }}>
              <TruckIcon sx={{ color: "#fff", fontSize: { xs: 18, md: 22 }, opacity: 0.7 }} />
              <BlockIcon sx={{
                color: "#fff",
                fontSize: { xs: 18, md: 22 },
                position: "absolute",
                top: 0,
                left: 0,
                opacity: 0.8,
              }} />
            </Box>
          ) : plat.deliveryAvailable ? (
            <TruckIcon sx={{ color: "#fff", fontSize: { xs: 18, md: 22 } }} />
          ) : (
            <Box sx={{ position: "relative", display: "inline-flex" }}>
              <TruckIcon sx={{ color: "#fff", fontSize: { xs: 18, md: 22 }, opacity: 0.7 }} />
              <BlockIcon sx={{
                color: "#fff",
                fontSize: { xs: 18, md: 22 },
                position: "absolute",
                top: 0,
                left: 0,
                opacity: 0.8,
              }} />
            </Box>
          )}
        </Box>

        {(() => {
          let chosen = plat.image || null
          if (selectedTagFilter !== "all" && Array.isArray(plat.versions)) {
            const tagId = Number(selectedTagFilter)
            const tagged = plat.versions.find(v => v.image && Array.isArray(v.tags) && v.tags.some(t => t.id === tagId))
            if (tagged && tagged.image) chosen = tagged.image
          }
          if (!chosen && Array.isArray(plat.versions)) {
            const firstWithImage = plat.versions.find(v => v.image)
            if (firstWithImage) chosen = firstWithImage.image
          }
          const src = chosen ? (chosen.startsWith("http") ? chosen : `${config.API_URL}${chosen}`) : null
      return src && !imageErrors[plat.id] ? (
            <LazyImage
              src={src}
              alt={plat.name}
        reduceMotion={isMobile || isTablet}
        sizes={isMobile ? '(max-width: 600px) 50vw' : '(min-width: 600px) 220px'}
              onError={() => handleImageError(plat.id)}
              placeholder={
                <PlaceholderImage
                  alt={plat.name}
                  sx={{
                    width: "100%",
                    height: "100%",
                  }}
                />
              }
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "fill",
              }}
            />
          ) : (
            <PlaceholderImage
              alt={plat.name}
              sx={{
                width: "100%",
                height: "100%",
              }}
            />
          )
        })()}
      </Box>

      {/* Content Section */}
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          p: { xs: 1.5, md: 2 },
          height: { xs: 80, md: 120 },
          overflow: "hidden",
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h6"
            component="h2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "0.9rem", md: "1.1rem" },
              mb: 1,
              lineHeight: 1.3,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {plat.name}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: "auto",
          }}
        >
          <Typography
            variant="h6"
            color="primary"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1rem", md: "1.2rem" },
            }}
          >
            {plat.versions && plat.versions.length > 1 
              ? `À partir de €${plat.price.toFixed(2)}`
              : `€${plat.price.toFixed(2)}`
            }
          </Typography>
        </Box>
      </CardContent>
    </Card>
  ), [cardStyles, handlePlatClick, imageErrors, isMobile, selectedTagFilter])

  // Handle ingredient selection/deselection
  const handleIngredientToggle = (ingredientId) => {
    setSelectedIngredients(prev => {
      if (prev.includes(ingredientId)) {
        // Remove from removed ingredients (add back to plat)
        return prev.filter(id => id !== ingredientId)
      } else {
        // Add to removed ingredients (remove from plat)
        return [...prev, ingredientId]
      }
    })
  }

  // Handle tag filter selection
  const handleTagFilterSelect = (tagId) => {
    setSelectedTagFilter(tagId)
  }

  const calculateTotalPrice = () => {
    if (!selectedPlat || !selectedVersion) return 0;
    let total = (selectedPlat.price + selectedVersion.extraPrice) * quantity
    
    // Add sauce price if a sauce is selected and the sauce price is greater than 0
    if (selectedSauceForPlat && selectedPlat.saucePrice > 0) {
      total += selectedPlat.saucePrice * quantity;
    }
    
    // Add extras prices
    if (selectedExtras.length > 0 && selectedPlat.tags) {
      const allExtras = selectedPlat.tags.flatMap(tag => tag.extras || []);
      selectedExtras.forEach(extraId => {
        const extra = allExtras.find(e => e.id === extraId);
        if (extra) {
          total += extra.price * quantity;
        }
      });
    }
    
    return total
  }

  const sortVersionsByPrice = (versions, basePrice) => {
    return [...versions].sort((a, b) => 
      (basePrice + a.extraPrice) - (basePrice + b.extraPrice)
    )
  }

  const handleImageError = (sauceId) => {
    setImageErrors((prev) => ({ ...prev, [sauceId]: true }))
  }

  const getGridColumns = () => {
    if (isMobile) return { xs: 6 } // 2 cards per row on mobile
    return { xs: 12, sm: 6, md: 4, lg: 3, xl: 2.4 } // More cards on desktop
  }

  const getCardHeight = () => {
    return isMobile ? 200 : 320 // Smaller on mobile, larger on desktop
  }

  const getImageHeight = () => {
    return isMobile ? 120 : 200 // Proportional image heights
  }

  if (loading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ mb: 6, textAlign: "center" }}>
            <Skeleton variant="text" width="60%" height={80} sx={{ mx: "auto", mb: 2 }} />
            <Skeleton variant="text" width="40%" height={40} sx={{ mx: "auto" }} />
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: "repeat(4, 1fr)",
                lg: "repeat(5, 1fr)",
                xl: "repeat(6, 1fr)",
              },
              gap: { xs: 1, md: 3 },
              justifyItems: "center",
            }}
          >
            {[...Array(8)].map((_, index) => (
              <Card
                key={index}
                sx={{
                  width: { xs: 160, md: 220 },
                  height: { xs: 200, md: 280 },
                }}
              >
                <Skeleton variant="rectangular" height={{ xs: 120, md: 160 }} />
                <CardContent>
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="60%" />
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </ThemeProvider>
    )
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
      <Box
        sx={{
          minHeight: "100vh",
          position: "relative",
        }}
      >
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Header */}
          {isMobile || isTablet ? (
            <Box sx={{ mb: 6, textAlign: "center" }}>
              <Typography
                variant="h2"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 800,
                  background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
                  backgroundClip: "text",
                  textFillColor: "transparent",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  mb: 2,
                  fontSize: { xs: "2.5rem", md: "3.5rem" },
                }}
              >
                Rudy et Fanny
              </Typography>
              <Typography
                variant="h5"
                color="text.secondary"
                sx={{
                  mb: 4,
                  fontSize: { xs: "1.2rem", md: "1.5rem" },
                  fontStyle: "italic",
                  background: "linear-gradient(45deg, #ffb74d 30%, #ffffff 70%)",
                  backgroundClip: "text",
                  textFillColor: "transparent",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {settings.menuMessage || "Découvrez notre sélection de spécialités"}
              </Typography>
              
              {/* Warning messages for disabled services - REMOVED */}
              {/* {(settings.enableOnlinePickup === "false" || settings.enableOnlineDelivery === "false") && (
                <Alert 
                  severity="warning" 
                  sx={{ 
                    mb: 3, 
                    maxWidth: 600, 
                    mx: "auto",
                    background: "rgba(255, 152, 0, 0.1)",
                    border: "1px solid rgba(255, 152, 0, 0.3)",
                    color: "#ffb74d"
                  }}
                >
                  {settings.enableOnlinePickup === "false" && settings.enableOnlineDelivery === "false" 
                    ? "🚫 Les commandes en ligne sont temporairement désactivées."
                    : settings.enableOnlinePickup === "false" 
                      ? "🚫 Les commandes à emporter en ligne sont temporairement désactivées."
                      : "🚫 Les commandes en livraison en ligne sont temporairement désactivées."
                  }
                </Alert>
              )} */}
            </Box>
          ) : (
            <Fade in timeout={800}>
              <Box sx={{ mb: 6, textAlign: "center" }}>
                <Typography
                  variant="h2"
                  component="h1"
                  gutterBottom
                  sx={{
                    fontWeight: 800,
                    background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
                    backgroundClip: "text",
                    textFillColor: "transparent",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    mb: 2,
                    fontSize: { xs: "2.5rem", md: "3.5rem" },
                  }}
                >
                  Rudy et Fanny
                </Typography>
                <Typography
                  variant="h5"
                  color="text.secondary"
                  sx={{
                    mb: 4,
                    fontSize: { xs: "1.2rem", md: "1.5rem" },
                    fontStyle: "italic",
                    background: "linear-gradient(45deg, #ffb74d 30%, #ffffff 70%)",
                    backgroundClip: "text",
                    textFillColor: "transparent",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {settings.menuMessage || "Découvrez notre sélection de spécialités"}
                </Typography>
                {(settings.enableOnlinePickup === "false" || settings.enableOnlineDelivery === "false") && (
                  <Alert 
                    severity="warning" 
                    sx={{ 
                      mb: 3, 
                      maxWidth: 600, 
                      mx: "auto",
                      background: "rgba(255, 152, 0, 0.1)",
                      border: "1px solid rgba(255, 152, 0, 0.3)",
                      color: "#ffb74d"
                    }}
                  >
                    {settings.enableOnlinePickup === "false" && settings.enableOnlineDelivery === "false" 
                      ? "🚫 Les commandes en ligne sont temporairement désactivées."
                      : settings.enableOnlinePickup === "false" 
                        ? "🚫 Les commandes à emporter en ligne sont temporairement désactivées."
                        : "🚫 Les commandes en livraison en ligne sont temporairement désactivées."
                    }
                  </Alert>
                )}
              </Box>
            </Fade>
          )}

          {/* Filters */}
          {(isMobile || isTablet) ? (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 4,
                borderRadius: 3,
        background: "rgba(26, 26, 26, 0.9)",
                backdropFilter: "none",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                {/* Search and Filter Row */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    gap: 2,
                    alignItems: "stretch",
                  }}
                >
                  <TextField
                    fullWidth
                    placeholder="Rechercher une spécialité..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: "primary.main" }} />,
                    }}
                    sx={{
                      flex: 3,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "&:hover fieldset": {
                          borderColor: "primary.main",
                        },
                      },
                    }}
                  />
                  <FormControl sx={{ flex: 1, minWidth: 200 }}>
                    <InputLabel>Filtrer par</InputLabel>
                    <Select
                      value={filterType}
                      label="Filtrer par"
                      onChange={(e) => setFilterType(e.target.value)}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="all">Tout afficher</MenuItem>
                      <MenuItem value="available">Disponible</MenuItem>
                      <MenuItem value="delivery">Disponible en livraison</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                {/* Tag Filters */}
                {searchableTags && searchableTags.length > 0 && (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2, color: "primary.main", textAlign: "center" }}>
                      Filtrer par catégories
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
                      {/* "Tout" button */}
                      <Chip
                        label="Tout"
                        onClick={() => handleTagFilterSelect("all")}
                        color={selectedTagFilter === "all" ? "primary" : "default"}
                        variant={selectedTagFilter === "all" ? "filled" : "outlined"}
                        sx={{
                          fontWeight: 600,
                          borderRadius: 2,
                          transition: "all 0.3s ease",
                          minWidth: 120,
                          height: 40,
                          "&:hover": {
                            transform: "scale(1.05)",
                          },
                        }}
                      />
                      {/* Tag buttons */}
                      {searchableTags.map((tag) => (
                        <Chip
                          key={tag.id}
                          label={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <Typography
                                component="span"
                                sx={{
                                  fontSize: "1.1em",
                                  textShadow: "0 2px 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.6), 0 0 20px rgba(0,0,0,0.4)",
                                  filter: "drop-shadow(0 0 4px rgba(255,255,255,0.4)) drop-shadow(0 2px 8px rgba(0,0,0,0.8))",
                                }}
                              >
                                {tag.emoji}
                              </Typography>
                              <Typography component="span">
                                {tag.nom}
                              </Typography>
                            </Box>
                          }
                          onClick={() => handleTagFilterSelect(tag.id)}
                          color={selectedTagFilter === tag.id ? "primary" : "default"}
                          variant={selectedTagFilter === tag.id ? "filled" : "outlined"}
                          sx={{
                            fontWeight: 600,
                            borderRadius: 2,
                            transition: "all 0.3s ease",
                            minWidth: 120,
                            height: 40,
                            "&:hover": {
                              transform: "scale(1.05)",
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
          ) : (
            <Fade in timeout={1000}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 4,
                  borderRadius: 3,
                  background: "rgba(26, 26, 26, 0.8)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                {/* content duplicated from above */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      gap: 2,
                      alignItems: "stretch",
                    }}
                  >
                    <TextField
                      fullWidth
                      placeholder="Rechercher une spécialité..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: "primary.main" }} />,
                      }}
                      sx={{
                        flex: 3,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          "&:hover fieldset": {
                            borderColor: "primary.main",
                          },
                        },
                      }}
                    />
                    <FormControl sx={{ flex: 1, minWidth: 200 }}>
                      <InputLabel>Filtrer par</InputLabel>
                      <Select
                        value={filterType}
                        label="Filtrer par"
                        onChange={(e) => setFilterType(e.target.value)}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="all">Tout afficher</MenuItem>
                        <MenuItem value="available">Disponible</MenuItem>
                        <MenuItem value="delivery">Disponible en livraison</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  {searchableTags && searchableTags.length > 0 && (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2, color: "primary.main", textAlign: "center" }}>
                        Filtrer par catégories
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
                        <Chip
                          label="Tout"
                          onClick={() => handleTagFilterSelect("all")}
                          color={selectedTagFilter === "all" ? "primary" : "default"}
                          variant={selectedTagFilter === "all" ? "filled" : "outlined"}
                          sx={{
                            fontWeight: 600,
                            borderRadius: 2,
                            transition: "all 0.3s ease",
                            minWidth: 120,
                            height: 40,
                            "&:hover": {
                              transform: "scale(1.05)",
                            },
                          }}
                        />
                        {searchableTags.map((tag) => (
                          <Chip
                            key={tag.id}
                            label={
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <Typography
                                  component="span"
                                  sx={{
                                    fontSize: "1.1em",
                                    textShadow: "0 2px 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.6), 0 0 20px rgba(0,0,0,0.4)",
                                    filter: "drop-shadow(0 0 4px rgba(255,255,255,0.4)) drop-shadow(0 2px 8px rgba(0,0,0,0.8))",
                                  }}
                                >
                                  {tag.emoji}
                                </Typography>
                                <Typography component="span">
                                  {tag.nom}
                                </Typography>
                              </Box>
                            }
                            onClick={() => handleTagFilterSelect(tag.id)}
                            color={selectedTagFilter === tag.id ? "primary" : "default"}
                            variant={selectedTagFilter === tag.id ? "filled" : "outlined"}
                            sx={{
                              fontWeight: 600,
                              borderRadius: 2,
                              transition: "all 0.3s ease",
                              minWidth: 120,
                              height: 40,
                              "&:hover": {
                                transform: "scale(1.05)",
                              },
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Fade>
          )}

          {/* Combined Grid for Sauces and Plats */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)", // 2 columns on mobile
                sm: "repeat(3, 1fr)", // 3 columns on small screens
                md: "repeat(4, 1fr)", // 4 columns on medium screens
                lg: "repeat(5, 1fr)", // 5 columns on large screens
                xl: "repeat(6, 1fr)", // 6 columns on extra large screens
              },
              gap: { xs: 1, md: 3 },
              justifyItems: "center",
              mb: 4,
            }}
          >
            {/* Render Sauces */}
            {filteredSauces.map((sauce, index) => (
              (isMobile || isTablet)
                ? (
                  <React.Fragment key={`sauce-${sauce.id}`}>
                    {renderSauceCard(sauce)}
                  </React.Fragment>
                )
                : (
                  <Zoom in timeout={300 + index * 50} key={`sauce-${sauce.id}`}>
                    {renderSauceCard(sauce)}
                  </Zoom>
                )
            ))}

            {/* Render Plats */}
            {filteredPlats.map((plat, index) => (
              (isMobile || isTablet)
                ? <React.Fragment key={`plat-${plat.id}`}>{renderPlatCard(plat, index)}</React.Fragment>
                : (
                  <Zoom in timeout={300 + (filteredSauces.length + index) * 50} key={`plat-${plat.id}`}>
                    {renderPlatCard(plat, index)}
                  </Zoom>
                )
            ))}
          </Box>

          {/* Removed load-more controls per request */}

          {/* Empty State */}
          {filteredSauces.length === 0 && filteredPlats.length === 0 && (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <RestaurantIcon sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                Aucune spécialité trouvée
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Essayez de modifier vos critères de recherche
              </Typography>
            </Box>
          )}

          {/* Sauce Detail Modal */}
          <Dialog
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            maxWidth="md"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
              elevation: 24,
              sx: {
                borderRadius: isMobile ? 0 : 3,
                background: "linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              },
            }}
          >
            {selectedSauce && (
              <>
                <DialogTitle
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    pb: 2,
                  }}
                >
                  <Typography variant="h4" component="span" sx={{ fontWeight: 700 }}>
                    {selectedSauce.name}
                  </Typography>
                  <IconButton
                    onClick={() => setModalOpen(false)}
                    color="inherit"
                    sx={{
                      bgcolor: "rgba(255, 255, 255, 0.1)",
                      "&:hover": { bgcolor: "rgba(255, 255, 255, 0.2)" },
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                  <Box sx={{ mb: 3, borderRadius: 2, overflow: "hidden" }}>
                    {selectedSauce.image && !imageErrors[selectedSauce.id] ? (
                      <img
                        src={
                          selectedSauce.image.startsWith("http")
                            ? selectedSauce.image
                            : `${config.API_URL}${selectedSauce.image}`
                        }
                        alt={selectedSauce.name}
                        onError={() => handleImageError(selectedSauce.id)}
                        style={{
                          width: "100%",
                          height: "300px",
                          objectFit: "cover", // Changed back to cover for modal
                          borderRadius: "12px",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                        }}
                      />
                    ) : (
                      <PlaceholderImage
                        alt={selectedSauce.name}
                        sx={{
                          width: "100%",
                          height: "300px",
                          borderRadius: "12px",
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="h3" color="primary" gutterBottom sx={{ fontWeight: 800 }}>
                    €{selectedSauce.price.toFixed(2)}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 3 }}>
                    {!selectedSauce.available && (
                      <Chip label="Temporairement Indisponible" color="error" sx={{ fontWeight: 600 }} />
                    )}
                  </Box>

                  {/* Message field */}
                  <Box sx={{ mt: 3 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      variant="outlined"
                      label="Message spécial (optionnel)"
                      placeholder="Demandes particulières, allergies, etc..."
                      value={itemMessage}
                      onChange={(e) => setItemMessage(e.target.value)}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Box>
                </DialogContent>
                <DialogActions
                  sx={{
                    borderTop: "1px solid rgba(255,255,255,0.1)",
                    p: 3,
                    gap: 2,
                  }}
                >
                  <Button
                    onClick={() => setModalOpen(false)}
                    color="inherit"
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  >
                    Fermer
                  </Button>
                  <Button
                    color="primary"
                    variant="contained"
                    disabled={!selectedSauce.available || isOrderingDisabled()}
                    onClick={() => {
                      if (isOrderingDisabled()) return;
                      // Add sauce to basket
                      addToBasket({
                        type: 'sauce',
                        sauce: selectedSauce,
                        quantity: 1,
                        message: itemMessage.trim() || null,
                      });
                      setModalOpen(false);
                      setItemMessage(""); // Reset message
                    }}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 600,
                      px: 4,
                    }}
                  >
                    Commander
                  </Button>
                </DialogActions>
              </>
            )}
          </Dialog>

          {/* Plat Version Selection Modal */}
          <Dialog
            open={platVersionModalOpen}
            onClose={() => setPlatVersionModalOpen(false)}
            maxWidth="sm"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
              elevation: 24,
              sx: {
                borderRadius: isMobile ? 0 : 3,
                background: "linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 152, 0, 0.2)",
              },
            }}
          >
            {selectedPlat && (
              <>
                <DialogTitle
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    pb: 2,
                  }}
                >
                  <Typography variant="h5" component="span" sx={{ fontWeight: 700, color: "#ff9800" }}>
                    {selectedPlat.name}
                  </Typography>
                  <IconButton
                    onClick={() => setPlatVersionModalOpen(false)}
                    color="inherit"
                    sx={{
                      "&:hover": { backgroundColor: "rgba(255, 152, 0, 0.1)" },
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </DialogTitle>

                <DialogContent sx={{ pt: 3 }}>
                  {/* Plat/Version Images with simple navigation */}
                  {versionImages.length > 0 && (
                    <>
                      <Box
                        sx={{
                          position: "relative",
                          mb: 2,
                          borderRadius: 2,
                          overflow: "hidden",
                          // Responsive aspect ratio so images aren't squished
                          aspectRatio: { xs: '4 / 3', md: '16 / 9' },
                          maxHeight: { xs: 260, md: '50vh' },
                          backgroundColor: 'rgba(255, 255, 255, 0.04)'
                        }}
                      >
                        <CardMedia
                          component="img"
                          image={versionImages[currentImageIdx].src}
                          alt={`${selectedPlat.name} - ${versionImages[currentImageIdx].label}`}
                          sx={{ width: "100%", height: "100%", objectFit: "cover", display: 'block' }}
                        />
                        {versionImages.length > 1 && (
                          <>
                            <IconButton
                              aria-label="previous image"
                              onClick={showPrevImage}
                              sx={{
                                position: "absolute",
                                top: "50%",
                                left: 8,
                                transform: "translateY(-50%)",
                                backgroundColor: "rgba(0,0,0,0.4)",
                                color: "#fff",
                                "&:hover": { backgroundColor: "rgba(0,0,0,0.6)" },
                              }}
                            >
                              <ArrowBackIosNewIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              aria-label="next image"
                              onClick={showNextImage}
                              sx={{
                                position: "absolute",
                                top: "50%",
                                right: 8,
                                transform: "translateY(-50%)",
                                backgroundColor: "rgba(0,0,0,0.4)",
                                color: "#fff",
                                "&:hover": { backgroundColor: "rgba(0,0,0,0.6)" },
                              }}
                            >
                              <ArrowForwardIosIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Box>
                      <Typography variant="body2" align="center" sx={{ mb: 2, color: "text.secondary" }}>
                        Version: {versionImages[currentImageIdx]?.label}
                      </Typography>
                    </>
                  )}

                  {/* Plat Description */}
                  <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
                    {selectedPlat.description}
                  </Typography>

                  {/* Sauce Selection */}
                  {selectedPlat.IncludesSauce !== false && selectedPlat.saucePrice !== undefined && (
                    <Box sx={{ mb: 3 }}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel id="sauce-select-label" sx={{ color: "#ff9800" }}>
                          {selectedPlat.saucePrice > 0 ? `Sauce (+€${selectedPlat.saucePrice.toFixed(2)})` : "Sauce (Incluse)"}
                        </InputLabel>
                        <Select
                          labelId="sauce-select-label"
                          value={selectedSauceForPlat ? selectedSauceForPlat.id : ""}
                          onChange={(e) => {
                            const sauce = sauces.find(s => s.id === e.target.value);
                            setSelectedSauceForPlat(sauce || null);
                          }}
                          label={selectedPlat.saucePrice > 0 ? `Sauce (+€${selectedPlat.saucePrice.toFixed(2)})` : "Sauce (Incluse)"}
                          sx={{
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "rgba(255, 152, 0, 0.5)",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#ff9800",
                            },
                          }}
                        >
                          <MenuItem value="">
                            <em>Aucune sauce</em>
                          </MenuItem>
                          {sauces.filter(s => s.available).map((sauce) => (
                            <MenuItem key={sauce.id} value={sauce.id}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography>{sauce.name}</Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  )}

                  {/* Extras Selection */}
                  {selectedPlat.tags && selectedPlat.tags.some(tag => tag.extras && tag.extras.length > 0) && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2, color: "#ff9800" }}>
                        Extras disponibles
                      </Typography>
                      {selectedPlat.tags.map(tag => 
                        tag.extras && tag.extras.length > 0 && (
                          <Box key={tag.id} sx={{ mb: 2 }}>
                            <FormControl fullWidth variant="outlined" sx={{ mb: 1 }}>
                              <InputLabel id={`extras-select-label-${tag.id}`} sx={{ color: "#ff9800" }}>
                                {tag.emoji} {tag.nom}
                              </InputLabel>
                              <Select
                                labelId={`extras-select-label-${tag.id}`}
                                multiple
                                value={selectedExtras.filter(extraId => 
                                  tag.extras.some(extra => extra.id === extraId)
                                )}
                                onChange={(e) => {
                                  const tagExtraIds = tag.extras.map(extra => extra.id);
                                  const otherSelectedExtras = selectedExtras.filter(extraId => 
                                    !tagExtraIds.includes(extraId)
                                  );
                                  setSelectedExtras([...otherSelectedExtras, ...e.target.value]);
                                }}
                                label={`${tag.emoji} ${tag.nom}`}
                                renderValue={(selected) => (
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((extraId) => {
                                      const extra = tag.extras.find(e => e.id === extraId);
                                      return extra ? (
                                        <Chip 
                                          key={extraId} 
                                          label={`${extra.nom} (+€${extra.price.toFixed(2)})`}
                                          size="small"
                                          sx={{ 
                                            backgroundColor: "rgba(255, 152, 0, 0.2)",
                                            color: "#ff9800"
                                          }}
                                        />
                                      ) : null;
                                    })}
                                  </Box>
                                )}
                                sx={{
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "rgba(255, 152, 0, 0.5)",
                                  },
                                  "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "#ff9800",
                                  },
                                }}
                              >
                                {tag.extras.map(extra => (
                                  <MenuItem key={extra.id} value={extra.id}>
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                          {extra.nom}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          {extra.description}
                                        </Typography>
                                      </Box>
                                      <Typography variant="body1" color="primary" sx={{ ml: 2, fontWeight: 600 }}>
                                        +€{extra.price.toFixed(2)}
                                      </Typography>
                                    </Box>
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>
                        )
                      )}
                    </Box>
                  )}

                  {/* Ingredients Selection */}
                  {selectedPlat.ingredients && selectedPlat.ingredients.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="h6" sx={{ color: "#ff9800", display: "flex", alignItems: "center", gap: 1 }}>
                            <LocalDiningIcon />
                            Composition du plat
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
                            Personnalisez votre plat en sélectionnant ou désélectionnant les ingrédients
                          </Typography>
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            {selectedPlat.ingredients.map((platIngredient) => {
                              const ingredient = platIngredient.ingredient;
                              const isRemoved = selectedIngredients.includes(ingredient.id);
                              const isRemovable = platIngredient.removable;
                              
                              return (
                                <Box
                                  key={ingredient.id}
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    p: 2,
                                    border: "1px solid rgba(255, 152, 0, 0.2)",
                                    borderRadius: 2,
                                    backgroundColor: isRemoved 
                                      ? "rgba(244, 67, 54, 0.1)" 
                                      : "rgba(255, 152, 0, 0.05)",
                                    opacity: isRemoved ? 0.6 : 1,
                                    transition: "all 0.3s ease",
                                  }}
                                >
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                      {ingredient.allergen && (
                                        <WarningIcon sx={{ color: "orange", fontSize: 20 }} />
                                      )}
                                    </Box>
                                    
                                    <Box sx={{ flex: 1 }}>
                                      <Typography 
                                        variant="body1" 
                                        sx={{ 
                                          fontWeight: 600,
                                          textDecoration: isRemoved ? "line-through" : "none",
                                          color: isRemoved ? "text.secondary" : "text.primary"
                                        }}
                                      >
                                        {ingredient.name}
                                      </Typography>
                                      {ingredient.description && (
                                        <Typography 
                                          variant="body2" 
                                          sx={{ 
                                            color: "text.secondary",
                                            textDecoration: isRemoved ? "line-through" : "none"
                                          }}
                                        >
                                          {ingredient.description}
                                        </Typography>
                                      )}
                                      {ingredient.allergen && (
                                        <Typography variant="caption" sx={{ color: "orange", fontWeight: 600 }}>
                                          Allergène
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>

                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    {isRemovable ? (
                                      <FormControlLabel
                                        control={
                                          <Checkbox
                                            checked={!isRemoved}
                                            onChange={() => handleIngredientToggle(ingredient.id)}
                                            sx={{
                                              color: "rgba(255, 152, 0, 0.7)",
                                              "&.Mui-checked": {
                                                color: "#ff9800",
                                              },
                                            }}
                                          />
                                        }
                                        label=""
                                        sx={{ margin: 0 }}
                                      />
                                    ) : (
                                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <CheckCircleIcon sx={{ color: "#4caf50", fontSize: 24 }} />
                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                          Inclus
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                </Box>
                              );
                            })}
                          </Box>
                          
                          {selectedIngredients.length > 0 && (
                            <Box sx={{ 
                              mt: 2, 
                              p: 2, 
                              backgroundColor: "rgba(244, 67, 54, 0.1)",
                              borderRadius: 2,
                              border: "1px solid rgba(244, 67, 54, 0.3)"
                            }}>
                              <Typography variant="body2" sx={{ color: "#f44336", fontWeight: 600 }}>
                                Ingrédients retirés: {selectedIngredients.length}
                              </Typography>
                            </Box>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    </Box>
                  )}

                  {/* Version Selection - Only show if multiple versions exist */}
                  {selectedPlat.versions && selectedPlat.versions.length > 1 && (
                    <Box sx={{ mb: 3 }}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel id="version-select-label" sx={{ color: "#ff9800" }}>Taille</InputLabel>
                        <Select
                          labelId="version-select-label"
                          value={selectedVersion ? selectedVersion.id : ""}
                          onChange={(e) => {
                            const version = selectedPlat.versions.find(v => v.id === e.target.value);
                            handleVersionSelect(version || null);
                          }}
                          label="Taille"
                          sx={{
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "rgba(255, 152, 0, 0.5)",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#ff9800",
                            },
                          }}
                        >
                          {selectedPlat.versions && sortVersionsByPrice(selectedPlat.versions, selectedPlat.price).map((version) => (
                            <MenuItem key={version.id} value={version.id}>
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                                <Typography>{version.size}</Typography>
                                <Typography color="primary" sx={{ ml: 2 }}>
                                  €{(selectedPlat.price + version.extraPrice).toFixed(2)}
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  )}

                  {/* Quantity Selection */}
                  {selectedVersion && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2, color: "#ff9800" }}>
                        Quantité
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <IconButton 
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                          sx={{ 
                            backgroundColor: "rgba(255, 152, 0, 0.1)",
                            "&:hover": { backgroundColor: "rgba(255, 152, 0, 0.2)" }
                          }}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <Typography variant="h6" sx={{ minWidth: 40, textAlign: "center" }}>
                          {quantity}
                        </Typography>
                        <IconButton 
                          onClick={() => setQuantity(quantity + 1)}
                          sx={{ 
                            backgroundColor: "rgba(255, 152, 0, 0.1)",
                            "&:hover": { backgroundColor: "rgba(255, 152, 0, 0.2)" }
                          }}
                        >
                          <AddIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  )}

                  {/* Total Price */}
                  {selectedVersion && (
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: "rgba(255, 152, 0, 0.1)", 
                      borderRadius: 2,
                      border: "1px solid rgba(255, 152, 0, 0.3)"
                    }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: "#ff9800", textAlign: "center" }}>
                        Total: €{calculateTotalPrice().toFixed(2)}
                      </Typography>
                      {selectedSauceForPlat && (
                        <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", mt: 1 }}>
                          {selectedPlat.saucePrice > 0 
                            ? `+Sauce ${selectedSauceForPlat.name} (€${selectedPlat.saucePrice.toFixed(2)})` 
                            : `Sauce ${selectedSauceForPlat.name}`}
                        </Typography>
                      )}
                      {selectedExtras.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          {selectedExtras.map(extraId => {
                            const allExtras = selectedPlat.tags?.flatMap(tag => tag.extras || []) || [];
                            const extra = allExtras.find(e => e.id === extraId);
                            return extra ? (
                              <Typography key={extraId} variant="body2" sx={{ color: "text.secondary", textAlign: "center" }}>
                                +{extra.nom} (€{(extra.price * quantity).toFixed(2)})
                              </Typography>
                            ) : null;
                          })}
                        </Box>
                      )}
                      {selectedIngredients.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" sx={{ color: "#f44336", textAlign: "center" }}>
                            {selectedIngredients.length} ingrédient{selectedIngredients.length > 1 ? 's' : ''} retiré{selectedIngredients.length > 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Message field */}
                  <Box sx={{ mt: 3 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      variant="outlined"
                      label="Message spécial (optionnel)"
                      placeholder="Demandes particulières, allergies, etc..."
                      value={itemMessage}
                      onChange={(e) => setItemMessage(e.target.value)}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3 }}>
                  <Button
                    onClick={() => setPlatVersionModalOpen(false)}
                    variant="outlined"
                    sx={{ mr: 2 }}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={() => {
                      if (isOrderingDisabled()) return;
                      // Handle order logic here
                      const allExtras = selectedPlat.tags?.flatMap(tag => tag.extras || []) || [];
                      const selectedExtrasDetails = selectedExtras.map(extraId => 
                        allExtras.find(e => e.id === extraId)
                      ).filter(Boolean);
                      
                      const removedIngredientsDetails = selectedIngredients.map(ingredientId => 
                        selectedPlat.ingredients?.find(pi => pi.ingredient.id === ingredientId)?.ingredient
                      ).filter(Boolean);
                      
                      // Add plat to basket
                      addToBasket({
                        type: 'plat',
                        plat: selectedPlat,
                        version: selectedVersion,
                        sauce: selectedSauceForPlat,
                        extras: selectedExtrasDetails,
                        removedIngredients: removedIngredientsDetails,
                        quantity: quantity,
                        message: itemMessage.trim() || null,
                      });
                      
                      setPlatVersionModalOpen(false);
                      setItemMessage(""); // Reset message
                    }}
                    variant="contained"
                    disabled={!selectedVersion || isOrderingDisabled()}
                    sx={{
                      background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
                      "&:hover": {
                        background: "linear-gradient(45deg, #f57c00 30%, #ff9800 90%)",
                      },
                      fontWeight: 600,
                      px: 4,
                    }}
                  >
                    Ajouter au panier
                  </Button>
                </DialogActions>
              </>
            )}
          </Dialog>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default React.memo(Menu)
