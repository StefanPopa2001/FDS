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
  Storefront as StorefrontIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  LocalDining as LocalDiningIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ArrowBackIosNew as ArrowBackIosNewIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  ErrorOutline as ErrorOutlineIcon,
} from "@mui/icons-material"
import { useBasket } from '../contexts/BasketContext'
import LazyImage from '../components/LazyImage'
import config from '../config'
import useMobileBackToClose from '../hooks/useMobileBackToClose'

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
          borderRadius: 0,
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
  // filterType removed per UX change; we're showing 3 status icons instead
  const [modalOpen, setModalOpen] = useState(false)
  const [platVersionModalOpen, setPlatVersionModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasServerError, setHasServerError] = useState(false)
  const [imageErrors, setImageErrors] = useState({})
  const [dropdownOpen, setDropdownOpen] = useState(false)
  
  // New state for tag filtering
  const [searchableTags, setSearchableTags] = useState([])
  const [selectedTagFilter, setSelectedTagFilter] = useState("all")

  // Settings state
  const [settings, setSettings] = useState({})
  // Local fallback for restaurant config (fetched from backend) to handle cases where settings map lacks keys
  const [restaurantCfgLocal, setRestaurantCfgLocal] = useState(null)

  // Basket context
  const { addToBasket } = useBasket()

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const isTablet = useMediaQuery(theme.breakpoints.between("md", "lg"))

  // Close modals on mobile back gesture
  useMobileBackToClose(modalOpen, () => setModalOpen(false))
  useMobileBackToClose(platVersionModalOpen, () => setPlatVersionModalOpen(false))

  // Debounce search term to improve performance on mobile
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, isMobile ? 300 : 150) // Longer debounce on mobile

    return () => clearTimeout(timer)
  }, [searchTerm, isMobile])

  // When a dropdown opens, push a history state so the mobile back gesture can close it
  useEffect(() => {
    if (!dropdownOpen) return;
    const stateId = `dropdown-${Date.now()}`;
    // Push a temporary history state so that the back gesture triggers popstate
    try { window.history.pushState({ menuDropdown: stateId }, '') } catch (e) {}

    const onPop = () => {
      if (dropdownOpen) {
        setDropdownOpen(false)
      }
    }

    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      // Try to remove the pushed state to keep history clean
      try { window.history.back() } catch (e) {}
    }
  }, [dropdownOpen])

  // Fetch restaurant config once as a fallback when settings doesn't include restaurant mode/manual flags
  useEffect(() => {
    let cancelled = false;
    const fetchCfg = async () => {
      try {
        const res = await fetch(`${config.API_URL}/restaurant-config`);
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.openDays && typeof data.openDays === 'string') {
          try { data.openDays = JSON.parse(data.openDays); } catch(e) { /* ignore */ }
        }
        if (!cancelled) setRestaurantCfgLocal(data);
      } catch (err) {
        console.warn('Failed to fetch restaurant-config fallback', err);
      }
    }
    fetchCfg();
    const onUpdate = (e) => {
      if (e?.detail?.restaurantCfg) setRestaurantCfgLocal(e.detail.restaurantCfg)
    }
    window.addEventListener('restaurant-config-updated', onUpdate)
    return () => { cancelled = true; window.removeEventListener('restaurant-config-updated', onUpdate) }
  }, [])

  // Memoize card styles for better performance
  const cardStyles = useMemo(() => ({
    // Make cards fill the grid cell on mobile and cap width to keep centered
    width: { xs: '100%', md: 220 },
    maxWidth: { xs: 200, sm: 220 },
    height: { xs: 230, md: 280 },
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
  return !settings.enableOnlinePickup && !settings.enableOnlineDelivery;
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
        setHasServerError(true)
        setLoading(false)
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
        setHasServerError(true)
        setLoading(false)
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
            let val = setting.value;
            if (val === 'true') val = true;
            else if (val === 'false') val = false;
            else if (!isNaN(val) && val !== '') val = Number(val);
            settingsMap[setting.key] = val;
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

  // Show all sauces including unavailable ones; unavailable sauces will render with an overlay

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
  }, [sauces, selectedTagFilter, debouncedSearchTerm])

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
  if (!settings.enableSpecialites) {
      // If specialities are disabled, mark them as unavailable but keep them visible
      filteredPlatData = filteredPlatData.map((plat) => ({
        ...plat,
        available: plat.speciality ? false : plat.available
      }))
    }

  // Filter out unavailable plats (including disabled specialities)
  filteredPlatData = filteredPlatData.filter((plat) => plat.available)

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
  }, [plats, selectedTagFilter, settings, debouncedSearchTerm])

  const availableItemsCount = useMemo(() => {
    const availableSauces = filteredSauces.filter(sauce => sauce.available).length
    return filteredPlats.length + availableSauces
  }, [filteredPlats, filteredSauces])

  const handleSauceClick = useCallback((sauce) => {
    if (!sauce || !sauce.available) return
    setSelectedSauce(sauce)
    setModalOpen(true)
  }, [])

  const handlePlatClick = useCallback((plat) => {
    if (!plat || !plat.available) return
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
  }, [selectedTagFilter])

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
          p: { xs: 1.5, md: 2 },
          height: { xs: 110, md: 120 },
          overflow: "hidden",
          position: "relative",
        }}
      >
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

        <Box
          sx={{
            position: "absolute",
            bottom: { xs: 12, md: 16 },
            left: { xs: 12, md: 16 },
            right: { xs: 12, md: 16 },
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h6"
            color="primary"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "0.9rem", md: "1.2rem" },
            }}
          >
            {sauce.price.toFixed(2)}€
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
        ...(plat.speciality ? {
          border: '1.5px solid rgba(255, 215, 0, 0.45)',
          boxShadow: '0 4px 10px rgba(255, 215, 0, 0.06)',
          ...(isMobile ? {} : {
            animation: 'pulseGold 3000ms infinite ease-in-out',
            '@keyframes pulseGold': {
              '0%': { boxShadow: '0 4px 10px rgba(255, 215, 0, 0.04)' },
              '50%': { boxShadow: '0 6px 14px rgba(255, 215, 0, 0.08)' },
              '100%': { boxShadow: '0 4px 10px rgba(255, 215, 0, 0.04)' },
            }
          })
        } : {})
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
          p: { xs: 1.5, md: 2 },
          height: { xs: 110, md: 120 },
          overflow: "hidden",
          position: "relative",
        }}
      >
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

        <Box
          sx={{
            position: "absolute",
            bottom: { xs: 12, md: 16 },
            left: { xs: 12, md: 16 },
            right: { xs: 12, md: 16 },
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h6"
            color="primary"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "0.9rem", md: "1.2rem" },
            }}
          >
            {plat.versions.length > 1 
              ? `Dès ${(plat.price + plat.versions[0].extraPrice).toFixed(2)}€`
              : `${plat.price.toFixed(2)}€`
            }
          </Typography>
        </Box>
      </CardContent>
    </Card>
  ), [cardStyles, handlePlatClick, imageErrors, isMobile, selectedTagFilter])

  // Memoize the rendered card lists to avoid re-rendering when modal/quantity changes
  const renderedPlatCards = useMemo(() => (
    filteredPlats.map((plat, index) => (
      <React.Fragment key={`plat-${plat.id}`}>{renderPlatCard(plat, index)}</React.Fragment>
    ))
  ), [filteredPlats, renderPlatCard])

  const renderedSauceCards = useMemo(() => (
    filteredSauces.map((sauce) => (
      <React.Fragment key={`sauce-${sauce.id}`}>{renderSauceCard(sauce)}</React.Fragment>
    ))
  ), [filteredSauces, renderSauceCard])

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
    return isMobile ? 220 : 320 // Slightly taller to accommodate centered layout
  }

  const getImageHeight = () => {
    return isMobile ? 120 : 200 // Proportional image heights
  }

  if (loading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
  <Container maxWidth="xl" sx={{ py: 4, mx: 'auto' }}>
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
          {hasServerError ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
                Service Indisponible
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Le serveur est actuellement hors service. Veuillez réessayer plus tard.
              </Typography>
            </Box>
          ) : (
            <>
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
              
              {/* Status indicators */}
              <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {settings.enableOnlinePickup ? (
                    <FastfoodIcon sx={{ color: 'primary.main', fontSize: 16 }} />
                  ) : (
                    <CancelIcon sx={{ color: 'error.main', fontSize: 16 }} />
                  )}
                  <Typography sx={{ fontSize: '0.8rem', color: settings.enableOnlinePickup ? 'text.primary' : 'error.main' }}>
                    À emporter
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {settings.enableSpecialites ? (
                    <StarIcon sx={{ color: 'warning.main', fontSize: 16 }} />
                  ) : (
                    <CancelIcon sx={{ color: 'error.main', fontSize: 16 }} />
                  )}
                  <Typography sx={{ fontSize: '0.8rem', color: settings.enableSpecialites ? 'text.primary' : 'error.main' }}>
                    Spécialités
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {settings.enableOnlineDelivery ? (
                    <TruckIcon sx={{ color: 'secondary.main', fontSize: 16 }} />
                  ) : (
                    <CancelIcon sx={{ color: 'error.main', fontSize: 16 }} />
                  )}
                  <Typography sx={{ fontSize: '0.8rem', color: settings.enableOnlineDelivery ? 'text.primary' : 'error.main' }}>
                    Livraisons
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <StorefrontIcon sx={{ color: 'success.main', fontSize: 16 }} />
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.primary' }}>
                    Restaurant ouvert
                  </Typography>
                </Box>
              </Box>
            
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
                
                {/* Status indicators */}
                <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {settings.enableOnlinePickup ? (
                      <FastfoodIcon sx={{ color: 'primary.main', fontSize: 16 }} />
                    ) : (
                      <CancelIcon sx={{ color: 'error.main', fontSize: 16 }} />
                    )}
                    <Typography sx={{ fontSize: '0.8rem', color: settings.enableOnlinePickup ? 'text.primary' : 'error.main' }}>
                      À emporter
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {settings.enableSpecialites ? (
                      <StarIcon sx={{ color: 'warning.main', fontSize: 16 }} />
                    ) : (
                      <CancelIcon sx={{ color: 'error.main', fontSize: 16 }} />
                    )}
                    <Typography sx={{ fontSize: '0.8rem', color: settings.enableSpecialites ? 'text.primary' : 'error.main' }}>
                      Spécialités
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {settings.enableOnlineDelivery ? (
                      <TruckIcon sx={{ color: 'secondary.main', fontSize: 16 }} />
                    ) : (
                      <CancelIcon sx={{ color: 'error.main', fontSize: 16 }} />
                    )}
                    <Typography sx={{ fontSize: '0.8rem', color: settings.enableOnlineDelivery ? 'text.primary' : 'error.main' }}>
                      Livraisons
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <StorefrontIcon sx={{ color: 'success.main', fontSize: 16 }} />
                    <Typography sx={{ fontSize: '0.8rem', color: 'text.primary' }}>
                      Restaurant ouvert
                    </Typography>
                  </Box>
                </Box>
                
                {/* Warning alert removed per UX request */}
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
                borderRadius: 0,
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
                {/* Search (full width) */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    placeholder={`Rechercher parmi nos ${availableItemsCount} spécialités`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: "primary.main" }} />,
                    }}
                    sx={{
                      width: '100%',
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "&:hover fieldset": {
                          borderColor: "primary.main",
                        },
                      },
                    }}
                  />
                </Box>
                
                {/* Category dropdown */}
                {searchableTags && searchableTags.length > 0 && (
                  <Box>
                    <FormControl fullWidth sx={{ mt: 1 }}>
                      <InputLabel>Catégorie</InputLabel>
                      <Select
                        value={selectedTagFilter}
                        label="Catégorie"
                        onChange={(e) => handleTagFilterSelect(e.target.value)}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="all">Tout</MenuItem>
                        {searchableTags.map(tag => (
                          <MenuItem key={tag.id} value={tag.id}>{tag.emoji} {tag.nom}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
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
                  borderRadius: 0,
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
                      flexDirection: "column",
                      gap: 2,
                      alignItems: "center",
                    }}
                  >
                    <TextField
                      fullWidth
                      placeholder={`Rechercher parmi nos ${availableItemsCount} spécialités`}
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
                  </Box>
                  {searchableTags && searchableTags.length > 0 && (
                    <Box>
                      <FormControl fullWidth sx={{ mt: 1 }}>
                        <InputLabel>Catégorie</InputLabel>
                        <Select
                          value={selectedTagFilter}
                          label="Catégorie"
                          onChange={(e) => handleTagFilterSelect(e.target.value)}
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="all">Tout</MenuItem>
                          {searchableTags.map(tag => (
                            <MenuItem key={tag.id} value={tag.id}>{tag.emoji} {tag.nom}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
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
              // Use auto-fit with minmax to keep cards centered and responsive
              gridTemplateColumns: {
                xs: "repeat(auto-fit, minmax(150px, 1fr))",
                sm: "repeat(auto-fit, minmax(180px, 1fr))",
                md: "repeat(4, 1fr)",
                lg: "repeat(5, 1fr)",
                xl: "repeat(6, 1fr)",
              },
              gap: { xs: 1.5, md: 3 },
              justifyItems: "center",
              alignItems: 'start',
              mx: 'auto',
              mb: 4,
            }}
          >
            {/* Render Plats */}
            {filteredPlats.map((plat, index) => (
              <React.Fragment key={`plat-${plat.id}`}>{renderPlatCard(plat, index)}</React.Fragment>
            ))}

            {/* Render Sauces */}
            {filteredSauces.map((sauce, index) => (
              <React.Fragment key={`sauce-${sauce.id}`}>{renderSauceCard(sauce)}</React.Fragment>
            ))}
          </Box>

          {/* Removed load-more controls per request */}

          {/* Empty State */}
          {filteredSauces.length === 0 && filteredPlats.length === 0 && (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <RestaurantIcon sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                Aucune spécialité trouvée...
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
            disableRestoreFocus
            disableAutoFocus
            disableEnforceFocus
            TransitionProps={{ timeout: isMobile ? 120 : 220 }}
            PaperProps={{
              elevation: 24,
              sx: {
                borderRadius: isMobile ? 0 : 3,
                background: "linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))",
                backdropFilter: isMobile ? 'none' : "blur(20px)",
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
                    {selectedSauce.price.toFixed(2)} €
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
            disableRestoreFocus
            disableAutoFocus
            disableEnforceFocus
            TransitionProps={{ timeout: isMobile ? 120 : 220 }}
            PaperProps={{
              elevation: 24,
              sx: {
                borderRadius: isMobile ? 0 : 3,
                background: "linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))",
                backdropFilter: isMobile ? 'none' : "blur(20px)",
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

                  {/* Personnalisation Section */}
                  <Typography variant="h6" sx={{ mb: 2, color: "#ff9800" }}>
                    Personnalisation
                  </Typography>

                  {/* Ingredients Selection */}
                  {selectedPlat.ingredients && selectedPlat.ingredients.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Accordion defaultExpanded sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }} TransitionProps={{ unmountOnExit: true }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="subtitle1" sx={{ color: "#ff9800", fontWeight: 600 }}>
                            🥗 Composition du plat
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" sx={{ mb: 1, color: "text.secondary", fontSize: '0.8rem' }}>
                            Personnalisez les ingrédients de votre plat:
                          </Typography>
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
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
                                    p: 1,
                                    border: "1px solid rgba(255, 152, 0, 0.2)",
                                    borderRadius: 1,
                                    backgroundColor: isRemoved 
                                      ? "rgba(244, 67, 54, 0.1)" 
                                      : "rgba(255, 152, 0, 0.05)",
                                    opacity: isRemoved ? 0.6 : 1,
                                    transition: "all 0.3s ease",
                                  }}
                                >
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                      {ingredient.allergen && (
                                        <WarningIcon sx={{ color: "orange", fontSize: 16 }} />
                                      )}
                                    </Box>
                                    
                                    <Box sx={{ flex: 1 }}>
                                      <Typography 
                                        variant="body2" 
                                        sx={{ 
                                          fontWeight: 500,
                                          fontSize: '0.85rem',
                                          textDecoration: isRemoved ? "line-through" : "none",
                                          color: isRemoved ? "text.secondary" : "text.primary"
                                        }}
                                      >
                                        {ingredient.name}
                                      </Typography>
                                      {ingredient.description && (
                                        <Typography 
                                          variant="caption" 
                                          sx={{ 
                                            color: "text.secondary",
                                            fontSize: '0.75rem',
                                            textDecoration: isRemoved ? "line-through" : "none"
                                          }}
                                        >
                                          {ingredient.description}
                                        </Typography>
                                      )}
                                      {ingredient.allergen && (
                                        <Typography variant="caption" sx={{ color: "orange", fontWeight: 600, fontSize: '0.7rem' }}>
                                          Allergène
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>

                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    {isRemovable ? (
                                      <FormControlLabel
                                        control={
                                          <Checkbox
                                            checked={!isRemoved}
                                            onChange={() => handleIngredientToggle(ingredient.id)}
                                            sx={{
                                              '& .MuiSvgIcon-root': { fontSize: 18 },
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
                                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                        <CheckCircleIcon sx={{ color: "#4caf50", fontSize: 18 }} />
                                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: '0.7rem' }}>
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
                              mt: 1, 
                              p: 1, 
                              backgroundColor: "rgba(244, 67, 54, 0.1)",
                              borderRadius: 1,
                              border: "1px solid rgba(244, 67, 54, 0.3)"
                            }}>
                              <Typography variant="caption" sx={{ color: "#f44336", fontWeight: 600, fontSize: '0.75rem' }}>
                                Ingrédients retirés: {selectedIngredients.length}
                              </Typography>
                            </Box>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    </Box>
                  )}

                  {/* Sauce Selection */}
                  {selectedPlat.IncludesSauce !== false && selectedPlat.saucePrice !== undefined && (
                    <Box sx={{ mb: 3 }}>
                      <Accordion sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }} TransitionProps={{ unmountOnExit: true }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="subtitle1" sx={{ color: "#ff9800", fontWeight: 600 }}>
                            🍅 Sauces {selectedPlat.saucePrice > 0 ? `(+${selectedPlat.saucePrice.toFixed(2)}€)` : '(Incluse)'}
                            {selectedSauceForPlat && (
                              <Chip 
                                label="1"
                                size="small"
                                sx={{ ml: 1, backgroundColor: "rgba(255, 152, 0, 0.2)", color: "#ff9800" }}
                              />
                            )}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ maxHeight: { xs: '40vh', md: '50vh' }, overflow: 'auto' }}>
                          <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, 
                            gap: 1,
                            mb: 1
                          }}>
                            <Box
                              onClick={() => setSelectedSauceForPlat(null)}
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                p: 1,
                                border: `1px solid ${!selectedSauceForPlat ? '#ff9800' : 'rgba(255, 255, 255, 0.1)'}`,
                                borderRadius: 1,
                                cursor: 'pointer',
                                backgroundColor: !selectedSauceForPlat ? 'rgba(255, 152, 0, 0.1)' : 'transparent',
                                '&:hover': {
                                  backgroundColor: 'rgba(255, 152, 0, 0.05)',
                                },
                                minHeight: '80px'
                              }}
                            >
                              <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5, textAlign: 'center' }}>
                                Aucune sauce
                              </Typography>
                            </Box>
                            {sauces.filter(s => s.available).map((sauce) => {
                              const isSelected = selectedSauceForPlat && selectedSauceForPlat.id === sauce.id;
                              const imgSrc = sauce.image ? `${config.API_URL}${sauce.image}` : null;
                              return (
                                <Box
                                  key={sauce.id}
                                  onClick={() => setSelectedSauceForPlat(sauce)}
                                  sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    p: 1,
                                    border: `1px solid ${isSelected ? '#ff9800' : 'rgba(255, 255, 255, 0.1)'}`,
                                    borderRadius: 1,
                                    cursor: 'pointer',
                                    backgroundColor: isSelected ? 'rgba(255, 152, 0, 0.1)' : 'transparent',
                                    '&:hover': {
                                      backgroundColor: 'rgba(255, 152, 0, 0.05)',
                                    },
                                    minHeight: '120px'
                                  }}
                                >
                                  <Box sx={{ width: '100%', height: '60px', mb: 1, borderRadius: 1, overflow: 'hidden' }}>
                                    {imgSrc ? (
                                      <LazyImage
                                        src={imgSrc}
                                        alt={sauce.name}
                                        reduceMotion={isMobile}
                                        sizes={isMobile ? '(max-width: 600px) 50vw' : '(min-width: 600px) 220px'}
                                        onError={() => setImageErrors(prev => ({ ...prev, [`sauce-${sauce.id}`]: true }))}
                                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      />
                                    ) : (
                                      <PlaceholderImage sx={{ height: '100%', borderRadius: 1 }} />
                                    )}
                                  </Box>
                                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5, textAlign: 'center' }}>
                                    {sauce.name}
                                  </Typography>
                                  <Typography variant="body2" color="primary" sx={{ fontWeight: 600, textAlign: 'center' }}>
                                    {selectedPlat.saucePrice > 0 ? `+${selectedPlat.saucePrice.toFixed(2)}€` : 'Incluse'}
                                  </Typography>
                                </Box>
                              );
                            })}
                          </Box>
                        </AccordionDetails>
                      </Accordion>
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
                          <Accordion key={tag.id} sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', mb: 1 }} TransitionProps={{ unmountOnExit: true }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="subtitle1" sx={{ color: "#ff9800", fontWeight: 600 }}>
                                {tag.emoji} {tag.nom}
                                {selectedExtras.filter(extraId => tag.extras.some(extra => extra.id === extraId)).length > 0 && (
                                  <Chip 
                                    label={selectedExtras.filter(extraId => tag.extras.some(extra => extra.id === extraId)).length}
                                    size="small"
                                    sx={{ ml: 1, backgroundColor: "rgba(255, 152, 0, 0.2)", color: "#ff9800" }}
                                  />
                                )}
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ maxHeight: { xs: '40vh', md: '50vh' }, overflow: 'auto' }}>
                            {tag.choixUnique ? (
                              // Single choice: radio button style
                              <FormControl component="fieldset">
                                <Box sx={{ 
                                  display: 'grid', 
                                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, 
                                  gap: 1,
                                  maxHeight: { xs: '35vh', md: '45vh' },
                                  overflow: 'auto'
                                }}>
                                  {tag.extras.map(extra => {
                                    const isSelected = selectedExtras.includes(extra.id);
                                    return (
                                      <Box
                                        key={extra.id}
                                        onClick={() => {
                                          const tagExtraIds = tag.extras.map(e => e.id);
                                          const otherSelectedExtras = selectedExtras.filter(extraId => 
                                            !tagExtraIds.includes(extraId)
                                          );
                                          setSelectedExtras([...otherSelectedExtras, extra.id]);
                                        }}
                                        sx={{
                                          display: 'flex',
                                          flexDirection: 'column',
                                          p: 1,
                                          border: `1px solid ${isSelected ? '#ff9800' : 'rgba(255, 255, 255, 0.1)'}`,
                                          borderRadius: 1,
                                          cursor: 'pointer',
                                          backgroundColor: isSelected ? 'rgba(255, 152, 0, 0.1)' : 'transparent',
                                          '&:hover': {
                                            backgroundColor: 'rgba(255, 152, 0, 0.05)',
                                          },
                                          minHeight: '80px'
                                        }}
                                      >
                                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                                          {extra.nom}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, flex: 1 }}>
                                          {extra.description}
                                        </Typography>
                                        <Typography variant="body1" color="primary" sx={{ fontWeight: 600, alignSelf: 'flex-end' }}>
                                          +{extra.price.toFixed(2)}€
                                        </Typography>
                                      </Box>
                                    );
                                  })}
                                </Box>
                              </FormControl>
                            ) : tag.doublonsAutorises ? (
                              // Allow duplicates: quantity controls
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: { xs: '35vh', md: '45vh' }, overflow: 'auto' }}>
                                {tag.extras.map(extra => {
                                  const count = selectedExtras.filter(id => id === extra.id).length;
                                  return (
                                    <Box
                                      key={extra.id}
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        p: 1,
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: 1,
                                        backgroundColor: count > 0 ? 'rgba(255, 152, 0, 0.1)' : 'transparent',
                                      }}
                                    >
                                      <Box sx={{ flex: 1 }}>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                          {extra.nom} {count > 0 && `(${count})`}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          {extra.description}
                                        </Typography>
                                      </Box>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body1" color="primary" sx={{ fontWeight: 600 }}>
                                          +{extra.price.toFixed(2)}€
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          <IconButton
                                            size="small"
                                            onClick={() => {
                                              const tagExtraIds = tag.extras.map(e => e.id);
                                              const otherSelectedExtras = selectedExtras.filter(extraId => 
                                                !tagExtraIds.includes(extraId) || extraId !== extra.id
                                              );
                                              const currentCount = selectedExtras.filter(id => id === extra.id).length;
                                              if (currentCount > 0) {
                                                // Remove one instance
                                                const indexToRemove = selectedExtras.lastIndexOf(extra.id);
                                                const newSelected = [...selectedExtras];
                                                newSelected.splice(indexToRemove, 1);
                                                setSelectedExtras(newSelected);
                                              }
                                            }}
                                            disabled={count === 0}
                                            sx={{ color: '#ff9800' }}
                                          >
                                            <RemoveIcon />
                                          </IconButton>
                                          <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>
                                            {count}
                                          </Typography>
                                          <IconButton
                                            size="small"
                                            onClick={() => {
                                              setSelectedExtras([...selectedExtras, extra.id]);
                                            }}
                                            sx={{ color: '#ff9800' }}
                                          >
                                            <AddIcon />
                                          </IconButton>
                                        </Box>
                                      </Box>
                                    </Box>
                                  );
                                })}
                              </Box>
                            ) : (
                              // Multiple choice without duplicates
                              <FormControl fullWidth variant="outlined">
                                <InputLabel id={`extras-select-label-${tag.id}`} sx={{ color: "#ff9800" }}>
                                  Sélectionner des extras
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
                                  label="Sélectionner des extras"
                                  onOpen={() => setDropdownOpen(true)}
                                  onClose={() => setDropdownOpen(false)}
                                  MenuProps={{ PaperProps: { sx: { maxHeight: { xs: '35vh', md: '50vh' }, width: 420, overflow: 'auto' } } }}
                                  renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                      {selected.map((extraId) => {
                                        const extra = tag.extras.find(e => e.id === extraId);
                                        return extra ? (
                                            <Chip 
                                            key={extraId} 
                                            label={`${extra.nom} (+${extra.price.toFixed(2)}€)`}
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
                                          +{extra.price.toFixed(2)}€
                                        </Typography>
                                      </Box>
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                            </AccordionDetails>
                          </Accordion>
                        )
                      )}
                    </Box>
                  )}

                  {/* Sauce Selection */}

                  {/* Version Selection - Only show if multiple versions exist */}
                  {selectedPlat.versions && selectedPlat.versions.length > 1 && (
                    <Box sx={{ mb: 3 }}>
                      {/* Validation message when no version is selected */}
                      {!selectedVersion && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: "#f44336", 
                            fontWeight: 600, 
                            mb: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}
                        >
                          <ErrorOutlineIcon sx={{ fontSize: 16 }} />
                          Veuillez choisir une version (obligatoire)
                        </Typography>
                      )}
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
                          onOpen={() => setDropdownOpen(true)}
                          onClose={() => setDropdownOpen(false)}
                          MenuProps={{ PaperProps: { sx: { maxHeight: { xs: '30vh', md: '50vh' }, width: 360, overflow: 'auto' } } }}
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
                                  {(selectedPlat.price + version.extraPrice).toFixed(2)}€
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  )}

                  {/* Quantity Controls and Total Price */}
                  {selectedVersion && (
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: "rgba(255, 152, 0, 0.1)", 
                      borderRadius: 2,
                      border: "1px solid rgba(255, 152, 0, 0.3)"
                    }}>
                      {/* Quantity Controls */}
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: 2,
                        mb: 2
                      }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>Quantité:</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            disabled={quantity <= 1}
                            sx={{ 
                              color: '#ff9800',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                              },
                              '&.Mui-disabled': {
                                color: 'text.disabled'
                              }
                            }}
                          >
                            <RemoveIcon />
                          </IconButton>
                          <Typography 
                            sx={{ 
                              minWidth: 40, 
                              textAlign: 'center', 
                              fontWeight: 600,
                              fontSize: '1.1rem'
                            }}
                          >
                            {quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => setQuantity(quantity + 1)}
                            sx={{ 
                              color: '#ff9800',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                              }
                            }}
                          >
                            <AddIcon />
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Total Price */}
                      <Typography variant="h5" sx={{ fontWeight: 700, color: "#ff9800", textAlign: "center" }}>
                        Total: {calculateTotalPrice().toFixed(2)}€
                      </Typography>
                      {selectedSauceForPlat && (
                        <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", mt: 1 }}>
                          {selectedPlat.saucePrice > 0 
                            ? `+Sauce ${selectedSauceForPlat.name} (${selectedPlat.saucePrice.toFixed(2)}€)` 
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
                                +{extra.nom} ({(extra.price * quantity).toFixed(2)}€)
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

                <DialogActions sx={{ p: 3, gap: 2 }}>
                  <Button
                    onClick={() => setPlatVersionModalOpen(false)}
                    variant="outlined"
                    sx={{ flex: 1 }}
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
                      flex: 1,
                      background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
                      "&:hover": {
                        background: "linear-gradient(45deg, #f57c00 30%, #ff9800 90%)",
                      },
                      fontWeight: 600,
                      px: 4,
                    }}
                  >
                    Ajouter
                  </Button>
                </DialogActions>
              </>
            )}
          </Dialog>
        </>
        )}
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default React.memo(Menu)
