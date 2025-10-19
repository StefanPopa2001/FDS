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
  Stepper,
  Step,
  StepLabel,
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
    // Always preselect the first version or a version matching the active tag
    const versions = getVersionsWithDefault(plat)
    let initialVersion = null
    if (selectedTagFilter !== "all" && Array.isArray(versions)) {
      const tagId = Number(selectedTagFilter)
      initialVersion = versions.find(v => Array.isArray(v.tags) && v.tags.some(t => t.id === tagId)) || null
    }
    // If no tag-matched version, select the first version (always, even if only one)
    if (!initialVersion && versions.length > 0) {
      initialVersion = versions[0]
    }
    setSelectedVersion(initialVersion)
    setSelectedSauceForPlat(null)
    setSelectedExtras([]) // Reset selected extras
    setSelectedSuggestedPlats({}) // Reset suggested plats
    setSelectedIngredients([]) // Reset removed ingredients
    setQuantity(1)
    setPlatVersionModalOpen(true)
  }, [selectedTagFilter])

  const [selectedSauceForPlat, setSelectedSauceForPlat] = useState(null)
  const [selectedExtras, setSelectedExtras] = useState([]) // Array of selected extra IDs
  const [selectedSuggestedPlats, setSelectedSuggestedPlats] = useState({}) // Map of association tagId -> platId for proposed plats
  const [propositionTags, setPropositionTags] = useState([]) // Tags configured as propositions for the selected plat
  // Version image carousel state
  const [currentImageIdx, setCurrentImageIdx] = useState(0)
  // Stepper state for plat customization
  const [activeStep, setActiveStep] = useState(0)

  const handleSauceSelect = (sauceId) => {
    const sauce = sauces.find(s => s.id === sauceId);
    setSelectedSauceForPlat(sauce || null);
  }

  // Helper function to get versions with a default "Standard" if none exist
  const getVersionsWithDefault = (plat) => {
    if (plat.versions && plat.versions.length > 0) {
      return plat.versions;
    }
    // Return a default "Standard" version if no versions exist
    return [{
      id: 'standard',
      size: 'Standard',
      extraPrice: 0,
    }];
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
    setActiveStep(0);
  }, [selectedPlat]);

  // When selecting a version, if it has an image, sync carousel to it
  useEffect(() => {
    if (!selectedPlat || !selectedVersion) return;
    const withImages = (selectedPlat.versions || []).filter(v => v && v.image);
    const idx = withImages.findIndex(v => v.id === selectedVersion.id);
    if (idx >= 0) setCurrentImageIdx(idx);
  }, [selectedVersion, selectedPlat]);

  // Fetch proposition tags for the selected plat
  useEffect(() => {
    const fetchPropositionTags = async () => {
      if (!selectedPlat) {
        setPropositionTags([])
        return
      }
      try {
        const resp = await fetch(`${config.API_URL}/plats/${selectedPlat.id}/proposition-tags`)
        if (resp.ok) {
          const tags = await resp.json()
          setPropositionTags(Array.isArray(tags) ? tags : [])
        } else {
          setPropositionTags([])
        }
      } catch (e) {
        console.error('Failed to fetch proposition tags:', e)
        setPropositionTags([])
      }
    }
    fetchPropositionTags()
  }, [selectedPlat])

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

  // Build dynamic steps for the stepper: version -> ingredients -> sauce? -> proposed plats (by configured tags) -> extras per tag -> recap
  const stepDescriptors = useMemo(() => {
    if (!selectedPlat) return []
    const steps = []
    // Step 1: Version/Size selection (always shown, even if single version)
    steps.push({ key: 'version', label: 'Taille' })
    // Step 2: Ingredients (composition) - skip if empty
    if (selectedPlat.ingredients && selectedPlat.ingredients.length > 0) {
      steps.push({ key: 'ingredients', label: 'Composition' })
    }
    // Step 3: Sauce step if enabled on plat and plat supports sauce
    if (selectedPlat.IncludesSauce !== false && selectedPlat.saucePrice !== undefined && sauces.length > 0) {
      steps.push({ key: 'sauce', label: 'Sauce' })
    }
    // Step 4: Proposed plats - one step per proposition tag configured for this plat
    (propositionTags || []).forEach(tag => {
      steps.push({ key: `proposition-${tag.id}`, label: `Ajouter à votre ${tag.emoji || ''} ${tag.nom}`.trim() })
    })
    // Step 5: Extras: one step per tag that has extras on the main plat
    const extraTags = (selectedPlat.tags || []).filter(t => Array.isArray(t.extras) && t.extras.length > 0)
    extraTags.forEach(tag => {
      steps.push({ key: `extra-${tag.id}`, label: `${tag.emoji || ''} ${tag.nom}`.trim() })
    })
    // Final recap step
    steps.push({ key: 'recap', label: 'Récap' })
    return steps
  }, [selectedPlat, sauces, propositionTags])

  const handleNextStep = () => {
    setActiveStep((prev) => Math.min(prev + 1, Math.max(0, stepDescriptors.length - 1)))
  }
  const handlePrevStep = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0))
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
        <Container maxWidth="xl" sx={{ py: 4, mx: 'auto' }}>
          {/* Header Skeleton */}
          <Box sx={{ mb: 6, textAlign: "center" }}>
            <Skeleton 
              variant="text" 
              width="70%" 
              height={60} 
              sx={{ mx: "auto", mb: 2 }} 
            />
            <Skeleton 
              variant="text" 
              width="50%" 
              height={30} 
              sx={{ mx: "auto" }} 
            />
          </Box>

          {/* Search and Filter Skeleton */}
          <Box sx={{ mb: 4 }}>
            <Skeleton 
              variant="rectangular" 
              height={56} 
              sx={{ mb: 2, borderRadius: 2 }} 
            />
            <Skeleton 
              variant="rectangular" 
              height={56} 
              sx={{ borderRadius: 2 }} 
            />
          </Box>

          {/* Cards Grid Skeleton */}
          <Box
            sx={{
              display: "grid",
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
            }}
          >
            {[...Array(12)].map((_, index) => (
              <Card
                key={index}
                sx={{
                  width: { xs: '100%', md: 220 },
                  maxWidth: { xs: 200, sm: 220 },
                  height: { xs: 230, md: 280 },
                  borderRadius: 0,
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  background: "rgba(26, 26, 26, 0.9)",
                  overflow: "hidden",
                }}
              >
                {/* Image Skeleton */}
                <Skeleton 
                  variant="rectangular" 
                  height={{ xs: 120, md: 140 }}
                  sx={{ width: '100%' }}
                />
                
                {/* Content Skeleton */}
                <CardContent sx={{ pb: 1, pt: 1.5 }}>
                  {/* Title */}
                  <Skeleton 
                    variant="text" 
                    width="85%" 
                    height={20}
                    sx={{ mb: 0.5 }}
                  />
                  <Skeleton 
                    variant="text" 
                    width="60%" 
                    height={16}
                    sx={{ mb: 1.5 }}
                  />
                  
                  {/* Price */}
                  <Skeleton 
                    variant="text" 
                    width="40%" 
                    height={22}
                  />
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
                display: 'flex',
                flexDirection: 'column',
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
                    pb: 1.5,
                    py: 1,
                    minHeight: { xs: '48px', md: '56px' },
                  }}
                >
                  <Typography variant="h6" component="span" sx={{ fontWeight: 700, color: "#ff9800", fontSize: { xs: '1rem', md: '1.25rem' } }}>
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

                <DialogContent sx={{ pt: 2, px: { xs: 1.5, md: 3 }, pb: 2, display: 'flex', flexDirection: 'column', gap: 1, minHeight: 0, flex: 1 }}>
                  {/* FIRST STEP: Show image, description, and price ABOVE the version selection */}
                  {stepDescriptors.length > 0 && stepDescriptors[activeStep]?.key !== 'version' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, pb: 1, borderBottom: '1px solid rgba(255, 152, 0, 0.2)' }}>
                      <Box sx={{ width: 50, height: 50, borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
                        <CardMedia
                          component="img"
                          image={versionImages[currentImageIdx]?.src}
                          alt={selectedPlat.name}
                          sx={{ width: "100%", height: "100%", objectFit: "cover", display: 'block' }}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {selectedPlat.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#ff9800', fontWeight: 600, fontSize: '0.8rem' }}>
                          {calculateTotalPrice().toFixed(2)}€
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* VERSION SELECTION STEP (shown as first step if multiple versions) */}
                  {stepDescriptors.length > 0 && stepDescriptors[activeStep]?.key === 'version' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {/* Full size image */}
                      {versionImages.length > 0 && (
                        <Box
                          sx={{
                            position: "relative",
                            borderRadius: 2,
                            overflow: "hidden",
                            aspectRatio: { xs: '4 / 3', md: '16 / 9' },
                            maxHeight: { xs: 200, md: '45vh' },
                            backgroundColor: 'rgba(255, 255, 255, 0.04)',
                            flexShrink: 0
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
                      )}
                      {/* Price info */}
                      <Box sx={{ p: 1, backgroundColor: 'rgba(255, 152, 0, 0.1)', borderRadius: 1, border: '1px solid rgba(255, 152, 0, 0.2)' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff9800', mb: 0.5 }}>
                          {calculateTotalPrice().toFixed(2)}€
                        </Typography>
                        {selectedPlat.description && (
                          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.85rem', lineHeight: 1.4 }}>
                            {selectedPlat.description}
                          </Typography>
                        )}
                      </Box>

                      {/* Size/Version selector grid - SORTED BY PRICE */}
                      {(() => {
                        const versions = getVersionsWithDefault(selectedPlat);
                        return versions && versions.length > 0 && (
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75, fontSize: '0.9rem' }}>
                              Version
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 0.75 }}>
                              {sortVersionsByPrice(versions, selectedPlat.price).map(version => (
                                <Box
                                  key={version.id}
                                  onClick={() => handleVersionSelect(version)}
                                  sx={{
                                    p: 1,
                                    border: `2px solid ${selectedVersion?.id === version.id ? '#ff9800' : 'rgba(255, 255, 255, 0.2)'}`,
                                    borderRadius: 1,
                                    cursor: 'pointer',
                                    backgroundColor: selectedVersion?.id === version.id ? 'rgba(255, 152, 0, 0.2)' : 'transparent',
                                    textAlign: 'center',
                                    transition: 'all 0.2s ease',
                                    '&:hover': { borderColor: '#ff9800', backgroundColor: 'rgba(255, 152, 0, 0.1)' }
                                  }}
                                >
                                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.85rem', display: 'block' }}>
                                    {version.size}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                    +{version.extraPrice.toFixed(2)}€
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        );
                      })()}

                    </Box>
                  )}

                  {/* STEPPER FOR OTHER STEPS */}
                  {stepDescriptors.length > 0 && stepDescriptors[activeStep]?.key !== 'version' && (
                    <>
                      {/* Compact step counter */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, pb: 1, borderBottom: '1px solid rgba(255, 152, 0, 0.2)' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#ff9800' }}>
                          {stepDescriptors[activeStep]?.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {activeStep + 1} / {stepDescriptors.length}
                        </Typography>
                      </Box>

                      {/* Step content area - no extra padding, fills space */}
                      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', px: 1 }}>
                        {(() => {
                          const step = stepDescriptors[activeStep]?.key
                          if (!step) return null
                          if (step === 'ingredients') {
                            return (
                              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.25, fontSize: '0.9rem' }}>
                                  Cliquez pour retirer un ingrédient
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 0.75 }}>
                                  {selectedPlat.ingredients?.map((platIngredient) => {
                                    const ingredient = platIngredient.ingredient
                                    const isRemoved = selectedIngredients.includes(ingredient.id)
                                    const isRemovable = platIngredient.removable
                                    return (
                                      <Box
                                        key={ingredient.id}
                                        onClick={() => isRemovable && handleIngredientToggle(ingredient.id)}
                                        sx={{
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'center',
                                          p: 0.75,
                                          border: `1px solid ${isRemoved ? 'rgba(244, 67, 54, 0.5)' : 'rgba(255, 152, 0, 0.3)'}`,
                                          borderRadius: 1,
                                          backgroundColor: isRemoved ? 'rgba(244, 67, 54, 0.15)' : 'rgba(255, 152, 0, 0.05)',
                                          opacity: isRemoved ? 0.6 : 1,
                                          cursor: isRemovable ? 'pointer' : 'default',
                                          transition: 'all 0.2s ease',
                                          '&:hover': isRemovable ? { borderColor: '#ff9800', backgroundColor: 'rgba(255, 152, 0, 0.1)' } : {}
                                        }}
                                      >
                                        {/* Image */}
                                        {ingredient.image ? (
                                          <Box sx={{ width: '100%', aspectRatio: '1', borderRadius: 0.75, overflow: 'hidden', mb: 0.5, flexShrink: 0 }}>
                                            <img src={`${config.API_URL}${ingredient.image}`} alt={ingredient.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                          </Box>
                                        ) : (
                                          <Box sx={{ width: '100%', aspectRatio: '1', borderRadius: 0.75, backgroundColor: 'rgba(255, 152, 0, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5, flexShrink: 0 }}>
                                            <RestaurantIcon sx={{ color: 'rgba(255, 152, 0, 0.5)', fontSize: 24 }} />
                                          </Box>
                                        )}
                                        
                                        {/* Name and allergen */}
                                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem', textAlign: 'center', textDecoration: isRemoved ? 'line-through' : 'none', mb: isRemovable ? 0.25 : 0 }}>
                                          {ingredient.name}
                                        </Typography>
                                        {ingredient.allergen && (
                                          <Typography variant="caption" sx={{ color: 'orange', fontWeight: 700, fontSize: '0.65rem' }}>
                                            ⚠ Allergène
                                          </Typography>
                                        )}
                                        
                                        {/* Checkbox indicator */}
                                        {isRemovable && (
                                          <Box sx={{ mt: 0.5 }}>
                                            {isRemoved ? (
                                              <Box sx={{ width: 18, height: 18, border: '2px solid #f44336', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Box sx={{ width: 8, height: 8, backgroundColor: '#f44336', borderRadius: '50%' }} />
                                              </Box>
                                            ) : (
                                              <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 18 }} />
                                            )}
                                          </Box>
                                        )}
                                      </Box>
                                    )
                                  })}
                                </Box>
                              </Box>
                            )
                          }
                          if (step === 'sauce') {
                            return (
                              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 0.75 }}>
                                <Box onClick={() => setSelectedSauceForPlat(null)} sx={{ display: 'flex', flexDirection: 'column', p: 0.75, border: `1px solid ${!selectedSauceForPlat ? '#ff9800' : 'rgba(255, 255, 255, 0.1)'}`, borderRadius: 1, cursor: 'pointer', backgroundColor: !selectedSauceForPlat ? 'rgba(255, 152, 0, 0.1)' : 'transparent', minHeight: '70px', justifyContent: 'center' }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, textAlign: 'center', fontSize: '0.8rem' }}>Aucune</Typography>
                                </Box>
                                {sauces.filter(s => s.available && s.price > 0).map((sauce) => {
                                  const isSelected = selectedSauceForPlat && selectedSauceForPlat.id === sauce.id
                                  const imgSrc = sauce.image ? `${config.API_URL}${sauce.image}` : null
                                  return (
                                    <Box key={sauce.id} onClick={() => setSelectedSauceForPlat(sauce)} sx={{ display: 'flex', flexDirection: 'column', p: 0.75, border: `1px solid ${isSelected ? '#ff9800' : 'rgba(255, 255, 255, 0.1)'}`, borderRadius: 1, cursor: 'pointer', backgroundColor: isSelected ? 'rgba(255, 152, 0, 0.1)' : 'transparent', minHeight: '100px' }}>
                                      <Box sx={{ width: '100%', height: '50px', mb: 0.5, borderRadius: 0.5, overflow: 'hidden', flexShrink: 0 }}>
                                        {imgSrc ? (
                                          <LazyImage src={imgSrc} alt={sauce.name} reduceMotion={isMobile} sizes={isMobile ? '(max-width: 600px) 50vw' : '(min-width: 600px) 220px'} onError={() => setImageErrors(prev => ({ ...prev, [`sauce-${sauce.id}`]: true }))} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                          <PlaceholderImage sx={{ height: '100%', borderRadius: 0.5 }} />
                                        )}
                                      </Box>
                                      <Typography variant="caption" sx={{ fontWeight: 600, textAlign: 'center', fontSize: '0.75rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sauce.name}</Typography>
                                      <Typography variant="caption" sx={{ fontWeight: 600, textAlign: 'center', fontSize: '0.7rem', color: '#ff9800' }}>+{sauce.price.toFixed(2)}€</Typography>
                                    </Box>
                                  )
                                })}
                              </Box>
                            )
                          }
                          if (step.startsWith('extra-')) {
                            const tagId = Number(step.split('-')[1])
                            const tag = (selectedPlat.tags || []).find(t => t.id === tagId)
                            if (!tag) return null
                            if (tag.choixUnique) {
                              return (
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 1 }}>
                                  {tag.extras.map(extra => {
                                    const isSelected = selectedExtras.includes(extra.id)
                                    const imgSrc = extra.image ? `${config.API_URL}${extra.image}` : null
                                    return (
                                      <Box key={extra.id} onClick={() => {
                                        const tagExtraIds = tag.extras.map(e => e.id)
                                        const other = selectedExtras.filter(eid => !tagExtraIds.includes(eid))
                                        setSelectedExtras([...other, extra.id])
                                      }} sx={{ p: 1, border: `1px solid ${isSelected ? '#ff9800' : 'rgba(255,255,255,0.1)'}`, borderRadius: 1, cursor: 'pointer', backgroundColor: isSelected ? 'rgba(255,152,0,0.1)' : 'transparent' }}>
                                        {imgSrc && (
                                          <Box sx={{ width: '100%', height: 80, mb: 0.75, borderRadius: 0.75, overflow: 'hidden', flexShrink: 0 }}>
                                            <img src={imgSrc} alt={extra.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                          </Box>
                                        )}
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{extra.nom}</Typography>
                                        {extra.description && (<Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>{extra.description}</Typography>)}
                                        <Typography variant="body1" color="primary" sx={{ fontWeight: 600, mt: 0.5 }}>+{extra.price.toFixed(2)}€</Typography>
                                      </Box>
                                    )
                                  })}
                                </Box>
                              )
                            } else if (tag.doublonsAutorises) {
                              return (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  {tag.extras.map(extra => {
                                    const count = selectedExtras.filter(id => id === extra.id).length
                                    const imgSrc = extra.image ? `${config.API_URL}${extra.image}` : null
                                    return (
                                      <Box key={extra.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 1, backgroundColor: count > 0 ? 'rgba(255,152,0,0.1)' : 'transparent', gap: 1 }}>
                                        {imgSrc && (
                                          <Box sx={{ width: 50, height: 50, borderRadius: 0.5, overflow: 'hidden', flexShrink: 0 }}>
                                            <img src={imgSrc} alt={extra.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                          </Box>
                                        )}
                                        <Box sx={{ flex: 1, pr: 1 }}>
                                          <Typography variant="body1" sx={{ fontWeight: 600 }}>{extra.nom} {count > 0 && `(${count})`}</Typography>
                                          {extra.description && (<Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>{extra.description}</Typography>)}
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <Typography variant="body1" color="primary" sx={{ fontWeight: 600 }}>+{extra.price.toFixed(2)}€</Typography>
                                          <IconButton size="small" onClick={() => {
                                            const idx = selectedExtras.lastIndexOf(extra.id)
                                            if (idx >= 0) {
                                              const copy = [...selectedExtras]
                                              copy.splice(idx, 1)
                                              setSelectedExtras(copy)
                                            }
                                          }} disabled={count === 0} sx={{ color: '#ff9800' }}>
                                            <RemoveIcon />
                                          </IconButton>
                                          <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>{count}</Typography>
                                          <IconButton size="small" onClick={() => setSelectedExtras([...selectedExtras, extra.id])} sx={{ color: '#ff9800' }}>
                                            <AddIcon />
                                          </IconButton>
                                        </Box>
                                      </Box>
                                    )
                                  })}
                                </Box>
                              )
                            }
                            // Multiple selection without duplicates
                            return (
                              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 1 }}>
                                {tag.extras.map(extra => {
                                  const isSelected = selectedExtras.includes(extra.id)
                                  const imgSrc = extra.image ? `${config.API_URL}${extra.image}` : null
                                  return (
                                    <Box key={extra.id} onClick={() => {
                                      const tagExtraIds = tag.extras.map(e => e.id)
                                      if (isSelected) {
                                        setSelectedExtras(selectedExtras.filter(id => id !== extra.id))
                                      } else {
                                        setSelectedExtras([...selectedExtras, extra.id])
                                      }
                                    }} sx={{ p: 1, border: `1px solid ${isSelected ? '#ff9800' : 'rgba(255,255,255,0.1)'}`, borderRadius: 1, cursor: 'pointer', backgroundColor: isSelected ? 'rgba(255,152,0,0.1)' : 'transparent' }}>
                                      {imgSrc && (
                                        <Box sx={{ width: '100%', height: 80, mb: 0.75, borderRadius: 0.75, overflow: 'hidden', flexShrink: 0 }}>
                                          <img src={imgSrc} alt={extra.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </Box>
                                      )}
                                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{extra.nom}</Typography>
                                      {extra.description && (<Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>{extra.description}</Typography>)}
                                      <Typography variant="body1" color="primary" sx={{ fontWeight: 600, mt: 0.5 }}>+{extra.price.toFixed(2)}€</Typography>
                                    </Box>
                                  )
                                })}
                              </Box>
                            )
                          }
                          if (step.startsWith('proposition-')) {
                            const tagId = Number(step.split('-')[1])
                            // Compute proposed plats for this tag by filtering all plats with this tag
                            const proposedPlats = plats
                              .filter(p => p.available && p.id !== selectedPlat.id && Array.isArray(p.tags) && p.tags.some(t => t.id === tagId))
                            if (proposedPlats.length === 0) {
                              return (
                                <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
                                  Pas de propositions disponibles
                                </Typography>
                              )
                            }
                            return (
                              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 1 }}>
                                <Box onClick={() => setSelectedSuggestedPlats({ ...selectedSuggestedPlats, [tagId]: null })} sx={{ p: 1, border: `1px solid ${!selectedSuggestedPlats[tagId] ? '#ff9800' : 'rgba(255,255,255,0.1)'}`, borderRadius: 1, cursor: 'pointer', backgroundColor: !selectedSuggestedPlats[tagId] ? 'rgba(255,152,0,0.1)' : 'transparent', minHeight: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, textAlign: 'center', fontSize: '0.8rem' }}>Non, merci</Typography>
                                </Box>
                                {proposedPlats.map(plat => {
                                  const isSelected = selectedSuggestedPlats[tagId] === plat.id
                                  const imgSrc = plat.image ? `${config.API_URL}${plat.image}` : null
                                  const price = (plat.basePrice ?? plat.price ?? 0)
                                  return (
                                    <Box key={plat.id} onClick={() => setSelectedSuggestedPlats({ ...selectedSuggestedPlats, [tagId]: plat.id })} sx={{ p: 1, border: `1px solid ${isSelected ? '#ff9800' : 'rgba(255,255,255,0.1)'}`, borderRadius: 1, cursor: 'pointer', backgroundColor: isSelected ? 'rgba(255,152,0,0.1)' : 'transparent' }}>
                                      {imgSrc && (
                                        <Box sx={{ width: '100%', height: 80, mb: 0.75, borderRadius: 0.75, overflow: 'hidden', flexShrink: 0 }}>
                                          <img src={imgSrc} alt={plat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </Box>
                                      )}
                                      <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{plat.name}</Typography>
                                      {plat.description && (<Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', mt: 0.25 }}>{plat.description}</Typography>)}
                                      <Typography variant="body1" color="primary" sx={{ fontWeight: 600, mt: 0.5, fontSize: '0.9rem' }}>
                                        {price > 0 ? `${price.toFixed(2)}€` : 'Prix à confirmer'}
                                      </Typography>
                                    </Box>
                                  )
                                })}
                              </Box>
                            )
                          }
                          if (step === 'recap') {
                            const allExtras = selectedPlat.tags?.flatMap(tag => tag.extras || []) || []
                            const extrasDetailed = selectedExtras.map(id => allExtras.find(e => e.id === id)).filter(Boolean)
                            // Aggregate duplicates for display
                            const extrasMap = extrasDetailed.reduce((acc, e) => {
                              const key = e.id
                              if (!acc[key]) acc[key] = { ...e, count: 0 }
                              acc[key].count += 1
                              return acc
                            }, {})
                            const extrasList = Object.values(extrasMap)
                            return (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                                {/* Version */}
                                {selectedVersion && (
                                  <Box sx={{ p: 0.75, backgroundColor: 'rgba(255, 152, 0, 0.08)', borderRadius: 1, border: '1px solid rgba(255, 152, 0, 0.2)' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#ff9800', display: 'block' }}>
                                      Taille: {selectedVersion.size} (+{selectedVersion.extraPrice.toFixed(2)}€)
                                    </Typography>
                                  </Box>
                                )}

                                {/* Sauce */}
                                {selectedSauceForPlat && (
                                  <Box sx={{ p: 0.75, backgroundColor: 'rgba(255, 152, 0, 0.08)', borderRadius: 1, border: '1px solid rgba(255, 152, 0, 0.2)' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem', display: 'block' }}>
                                      🍝 Sauce: {selectedSauceForPlat.name}
                                    </Typography>
                                  </Box>
                                )}

                                {/* Suggested Plats */}
                                {Object.entries(selectedSuggestedPlats).filter(([_, platId]) => platId).length > 0 && (
                                  <Box sx={{ p: 0.75, backgroundColor: 'rgba(76, 175, 80, 0.08)', borderRadius: 1, border: '1px solid rgba(76, 175, 80, 0.2)' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#4caf50', display: 'block', mb: 0.25 }}>
                                      ✓ Propositions:
                                    </Typography>
                                    {Object.entries(selectedSuggestedPlats).filter(([_, platId]) => platId).map(([tagId, platId]) => {
                                      const plat = plats.find(p => p.id === platId)
                                      return (
                                        <Typography key={platId} variant="caption" sx={{ display: 'block', fontSize: '0.7rem', pl: 0.5 }}>
                                          • {plat?.name} (+{plat?.basePrice?.toFixed(2) || '?'}€)
                                        </Typography>
                                      )
                                    })}
                                  </Box>
                                )}

                                {/* Extras */}
                                {extrasList.length > 0 && (
                                  <Box sx={{ p: 0.75, backgroundColor: 'rgba(255, 152, 0, 0.08)', borderRadius: 1, border: '1px solid rgba(255, 152, 0, 0.2)' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem', display: 'block', mb: 0.25 }}>
                                      Extras:
                                    </Typography>
                                    {extrasList.map(e => (
                                      <Typography key={e.id} variant="caption" sx={{ display: 'block', fontSize: '0.7rem', pl: 0.5 }}>
                                        • {e.nom} {e.count > 1 ? `(x${e.count})` : ''} (+{(e.price * e.count).toFixed(2)}€)
                                      </Typography>
                                    ))}
                                  </Box>
                                )}

                                {/* Removed Ingredients */}
                                {selectedIngredients.length > 0 && (
                                  <Box sx={{ p: 0.75, backgroundColor: 'rgba(244, 67, 54, 0.1)', borderRadius: 1, border: '1px solid rgba(244, 67, 54, 0.3)' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#f44336', display: 'block', mb: 0.25 }}>
                                      ✗ Retirés:
                                    </Typography>
                                    {selectedPlat.ingredients?.filter(pi => selectedIngredients.includes(pi.ingredient.id)).map(pi => (
                                      <Typography key={pi.ingredient.id} variant="caption" sx={{ display: 'block', fontSize: '0.7rem', pl: 0.5 }}>
                                        • {pi.ingredient.name}
                                      </Typography>
                                    ))}
                                  </Box>
                                )}

                                {/* Quantity and Total */}
                                <Box sx={{ p: 0.75, backgroundColor: 'rgba(255, 152, 0, 0.15)', borderRadius: 1, border: '1px solid rgba(255, 152, 0, 0.3)' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Quantité:</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <IconButton size="small" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} sx={{ color: '#ff9800', p: 0.25 }}>
                                        <RemoveIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                      <Typography sx={{ minWidth: 16, textAlign: 'center', fontWeight: 600, fontSize: '0.85rem' }}>{quantity}</Typography>
                                      <IconButton size="small" onClick={() => setQuantity(quantity + 1)} sx={{ color: '#ff9800', p: 0.25 }}>
                                        <AddIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </Box>
                                  </Box>
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#ff9800', textAlign: 'center', fontSize: '1.1rem' }}>
                                    {calculateTotalPrice().toFixed(2)}€
                                  </Typography>
                                </Box>

                                {/* Message field */}
                                <TextField fullWidth multiline rows={2} variant="outlined" label="Message (optionnel)" placeholder="Allergies, etc..." value={itemMessage} onChange={(e) => setItemMessage(e.target.value)} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1, fontSize: '0.85rem' } }} />
                              </Box>
                            )
                          }
                          return null
                        })()}
                      </Box>

                      {/* Navigation buttons inside DialogActions below */}
                    </>
                  )}
                </DialogContent>
                <DialogActions sx={{ p: 1.5, gap: 1, position: isMobile ? 'sticky' : 'static', bottom: 0, background: isMobile ? 'linear-gradient(145deg, rgba(26, 26, 26, 0.98), rgba(20, 20, 20, 0.98))' : 'transparent', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  {/* Left: Retour button (always present, disabled on first step) */}
                  <Button onClick={handlePrevStep} variant="outlined" disabled={activeStep === 0} sx={{ fontSize: '0.85rem', py: 0.75 }}>
                    ← Retour
                  </Button>
                  {/* Right: Suivant or Ajouter button */}
                  {activeStep < Math.max(0, stepDescriptors.length - 1) ? (
                    <Button onClick={handleNextStep} variant="contained" sx={{ fontSize: '0.85rem', py: 0.75 }} disabled={!selectedVersion}>
                      Suivant →
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        if (isOrderingDisabled()) return;
                        if (!selectedVersion) {
                          return; // require version selection
                        }
                        const allExtras = selectedPlat.tags?.flatMap(tag => tag.extras || []) || [];
                        const selectedExtrasDetails = selectedExtras.map(extraId => allExtras.find(e => e.id === extraId)).filter(Boolean);
                        const removedIngredientsDetails = selectedIngredients.map(ingredientId => selectedPlat.ingredients?.find(pi => pi.ingredient.id === ingredientId)?.ingredient).filter(Boolean);
                        // Build suggested plats array (only those actually selected)
                        const suggestedPlats = Object.entries(selectedSuggestedPlats)
                          .filter(([tagId, platId]) => platId)
                          .map(([tagId, platId]) => {
                            const suggestedPlat = plats.find(p => p.id === platId)
                            return {
                              plat: suggestedPlat,
                              tagId: Number(tagId)
                            }
                          });
                        addToBasket({
                          type: 'plat',
                          plat: selectedPlat,
                          version: selectedVersion,
                          sauce: selectedSauceForPlat,
                          extras: selectedExtrasDetails,
                          removedIngredients: removedIngredientsDetails,
                          quantity: quantity,
                          message: itemMessage.trim() || null,
                          suggestedPlats: suggestedPlats.length > 0 ? suggestedPlats : null,
                        });
                        setPlatVersionModalOpen(false);
                        setItemMessage("");
                      }}
                      variant="contained"
                      disabled={!selectedVersion || isOrderingDisabled()}
                      sx={{ fontSize: '0.85rem', py: 0.75, background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)', '&:hover': { background: 'linear-gradient(45deg, #f57c00 30%, #ff9800 90%)' }, fontWeight: 600 }}
                    >
                      Ajouter
                    </Button>
                  )}
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
