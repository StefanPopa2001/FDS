import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tab,
  Tabs,
  IconButton,
  Switch,
  Checkbox,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  OutlinedInput,
  Fade,
  Snackbar,
  Alert,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import PhotoIcon from "@mui/icons-material/Photo";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import StarIcon from "@mui/icons-material/Star";
import TextFormatIcon from "@mui/icons-material/TextFormat";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import config from "../config";
import { fetchWithAuth } from '../utils/apiService';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const AdminInspection = () => {
  const { token } = useAuth();
  const [plats, setPlats] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedPlatId, setSelectedPlatId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState("");
  const [tabIndex, setTabIndex] = useState(0);
  const [editingPlat, setEditingPlat] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [platToDelete, setPlatToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", severity: "success", image: null });
  const [inlineEditData, setInlineEditData] = useState({});
  const [ingredientImageUploads, setIngredientImageUploads] = useState({});
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [addIngredientDialogOpen, setAddIngredientDialogOpen] = useState(false);
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState("");
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState(null);
  const [versionFormData, setVersionFormData] = useState({ size: '', extraPrice: 0, tagIds: [] });
  const [associationFormData, setAssociationFormData] = useState({ proposition: [] });
  const [tagClipboard, setTagClipboard] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsRange, setStatsRange] = useState({ from: null, to: null });
  const [statsCompareTagId, setStatsCompareTagId] = useState('');
  const sortedTags = useMemo(() => {
    const list = Array.isArray(tags) ? [...tags] : [];
    list.sort((a, b) => (a?.nom || "").localeCompare(b?.nom || "", 'fr', { sensitivity: 'base' }));
    return list;
  }, [tags]);
  const fileInputRef = useRef(null);

  const showAlert = (message, severity = "success", image = null) => {
    setAlert({ show: true, message, severity, image });
  };

  // Fetch plats and tags
  useEffect(() => {
    fetchPlats();
    fetchTags();
  }, []);

  const fetchPlats = async () => {
    try {
      const url = `${config.API_URL}/plats`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Sort by name alphabetically
      const sorted = data.sort((a, b) => (a.nom || a.name).localeCompare(b.nom || b.name));
      setPlats(sorted);
    } catch (error) {
      console.error("Error fetching plats:", error);
      showAlert("Erreur lors du chargement des plats", "error");
    }
  };

  const fetchTags = async () => {
    try {
      const url = `${config.API_URL}/tags`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTags(data);
    } catch (error) {
      console.error("Error fetching tags:", error);
      showAlert("Erreur lors du chargement des tags", "error");
    }
  };

  const fetchPlatAssociations = async (platId) => {
    try {
      const url = `${config.API_URL}/admin/associations/${platId}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        if (response.status === 404) {
          // No associations found, that's okay
          setAssociationFormData({ proposition: [] });
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAssociationFormData({
        // Only get proposition associations - relatifA is now handled by standard plat.tags
        proposition: data.proposition?.map(p => p.id) || []
      });
    } catch (error) {
      console.error("Error fetching associations:", error);
      showAlert("Erreur lors du chargement des associations", "error");
    }
  };

  // Filter plats based on search term and tag filter
  const filteredPlats = useMemo(() => {
    let filtered = plats;

    if (searchTerm.trim()) {
      filtered = filtered.filter(p =>
        (p.nom || p.name).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedTagFilter) {
      if (selectedTagFilter === "NO_TAG") {
        // Check if plat has no "is" tags associated
        filtered = filtered.filter(p =>
          !p.tags || p.tags.length === 0 || !p.tags.some(tag => tag.type === "is")
        );
      } else {
        // Check if plat has the selected tag
        filtered = filtered.filter(p =>
          p.tags && p.tags.some(tag => tag.id === selectedTagFilter)
        );
      }
    }

    return filtered;
  }, [plats, searchTerm, selectedTagFilter]);

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle plat selection
  const handleSelectPlat = (platId) => {
    const plat = plats.find(p => p.id === platId);
    if (plat) {
      setInlineEditData({
        nom: plat.nom || plat.name || "",
        description: plat.description || "",
        price: plat.price || plat.basePrice || 0,
        available: plat.available !== false,
        availableForDelivery: plat.availableForDelivery !== false,
        speciality: plat.speciality === true,
        includesSauce: plat.IncludesSauce !== false,
        saucePrice: plat.saucePrice || 0,
        ordre: plat.ordre || "",
        platCache: plat.platCache === true
      });
      // Also fetch associations for this plat
      fetchPlatAssociations(platId);
      // Set default stats range: oldest to today
      const today = new Date();
      setStatsRange({ from: null, to: today }); // from will be set after first fetch
      // Also fetch stats for this plat
      reloadStats(platId);
    }
    setSelectedPlatId(platId);
  };

  const reloadStats = async (pidParam) => {
    const pid = pidParam || selectedPlatId;
    if (!pid) return;
    try {
      const params = new URLSearchParams();
      if (statsRange.from) params.set('from', statsRange.from.toISOString().slice(0, 10));
      if (statsRange.to) params.set('to', statsRange.to.toISOString().slice(0, 10));
      if (statsCompareTagId) params.set('compareTagId', statsCompareTagId);
      const url = `${config.API_URL}/admin/stats/plat/${pid}?${params.toString()}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setStats(data);
      // Set from to oldest if not set
      if (!statsRange.from && data.oldestOrderDate) {
        setStatsRange(prev => ({ ...prev, from: new Date(data.oldestOrderDate) }));
      }
    } catch (e) {
      console.error('Failed to load stats', e);
      showAlert('Erreur lors du chargement des statistiques', 'error');
    }
  };  // Auto-reload when filters change and a plat is selected
  useEffect(() => {
    if (selectedPlatId) {
      // Debounce small updates
      const t = setTimeout(() => {
        const pid = selectedPlatId;
        if (pid) {
          const params = new URLSearchParams();
          if (statsRange.from) params.set('from', statsRange.from.toISOString().slice(0, 10));
          if (statsRange.to) params.set('to', statsRange.to.toISOString().slice(0, 10));
          if (statsCompareTagId) params.set('compareTagId', statsCompareTagId);
          const url = `${config.API_URL}/admin/stats/plat/${pid}?${params.toString()}`;
          fetch(url, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
            .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
            .then(data => {
              setStats(data);
              if (!statsRange.from && data.oldestOrderDate) {
                setStatsRange(prev => ({ ...prev, from: new Date(data.oldestOrderDate) }));
              }
            })
            .catch(e => console.error('Failed to load stats', e));
        }
      }, 200);
      return () => clearTimeout(t);
    }
  }, [selectedPlatId, statsRange.from, statsRange.to, statsCompareTagId]);

  // Handle edit plat
  const handleEditClick = (plat) => {
    setEditingPlat({ ...plat });
    setOpenEditDialog(true);
  };

  // Handle inline edit save
  const handleInlineEditSave = async () => {
    if (!currentPlat) return;

    try {
      setLoading(true);
      const response = await fetchWithAuth(`${config.API_URL}/plats/${currentPlat.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: inlineEditData.nom,
          nom: inlineEditData.nom,
          description: inlineEditData.description,
          price: parseFloat(inlineEditData.price),
          saucePrice: parseFloat(inlineEditData.saucePrice || 0),
          ordre: inlineEditData.ordre,
          // Preserve boolean flags explicitly; avoid sending versions to prevent side-effects
          available: currentPlat.available !== false,
          availableForDelivery: currentPlat.availableForDelivery !== false,
          speciality: currentPlat.speciality === true,
          IncludesSauce: currentPlat.IncludesSauce === true || currentPlat.includesSauce === true
        }),
      });

      if (response.ok) {
        fetchPlats();
        showAlert("Plat modifié avec succès");
      } else {
        showAlert("Erreur lors de la sauvegarde", "error");
      }
    } catch (error) {
      console.error("Error saving plat:", error);
      showAlert("Erreur lors de la sauvegarde", "error");
    } finally {
      setLoading(false);
    }
  };

  // Update single plat fields immediately (used by checkboxes)
  const updatePlatField = async (patch) => {
    if (!currentPlat) return;
    try {
      setLoading(true);

      // Send complete plat data to prevent any field resets
      const body = {
        name: currentPlat.nom || currentPlat.name,
        price: currentPlat.price || currentPlat.basePrice,
        description: currentPlat.description || '',
        ordre: currentPlat.ordre,
        available: currentPlat.available !== false,
        availableForDelivery: currentPlat.availableForDelivery !== false,
        speciality: currentPlat.speciality === true,
        IncludesSauce: currentPlat.IncludesSauce === true || currentPlat.includesSauce === true,
        saucePrice: currentPlat.saucePrice || 0,
        tags: (currentPlat.tags || []).map(tag => tag.id)
      };

      // Apply the patch
      if (patch.hasOwnProperty('available')) body.available = patch.available;
      if (patch.hasOwnProperty('availableForDelivery')) body.availableForDelivery = patch.availableForDelivery;
      if (patch.hasOwnProperty('speciality')) body.speciality = patch.speciality;
      if (patch.hasOwnProperty('includesSauce')) body.IncludesSauce = patch.includesSauce;
      if (patch.hasOwnProperty('ordre')) body.ordre = patch.ordre;
      if (patch.hasOwnProperty('saucePrice')) body.saucePrice = parseFloat(patch.saucePrice || 0);
      if (patch.hasOwnProperty('platCache')) body.platCache = patch.platCache;

      const response = await fetchWithAuth(`${config.API_URL}/plats/${currentPlat.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        // refresh and update local state
        fetchPlats();
        setInlineEditData({ ...inlineEditData, ...patch });
        showAlert('Mise à jour effectuée');
      } else {
        showAlert("Erreur lors de la mise à jour", 'error');
      }
    } catch (error) {
      console.error('Error updating plat field:', error);
      showAlert("Erreur lors de la mise à jour", 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !currentPlat) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetchWithAuth(`${config.API_URL}/plats/${currentPlat.id}/image`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Update the inline edit data and refresh plats
        setInlineEditData({ ...inlineEditData, image: data.image });
        fetchPlats();
        showAlert("Image téléchargée avec succès", "success", `${config.API_URL}${data.image}`);
      } else {
        showAlert("Erreur lors du téléchargement de l'image", "error");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      showAlert("Erreur lors du téléchargement de l'image", "error");
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle image removal
  const handleImageRemove = async () => {
    if (!currentPlat || !currentPlat.image) return;

    try {
      setLoading(true);
      const response = await fetchWithAuth(`${config.API_URL}/plats/${currentPlat.id}/image`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setInlineEditData({ ...inlineEditData, image: null });
        fetchPlats();
        showAlert("Image supprimée avec succès");
      } else {
        showAlert("Erreur lors de la suppression de l'image", "error");
      }
    } catch (error) {
      console.error("Error removing image:", error);
      showAlert("Erreur lors de la suppression de l'image", "error");
    } finally {
      setLoading(false);
    }
  };

  // Ingredient management functions
  const handleIngredientNameEdit = async (ingredientId, newName) => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${config.API_URL}/ingredients/${ingredientId}`, {
        method: 'PUT',
        body: JSON.stringify({ nom: newName }),
      });

      if (response.ok) {
        fetchPlats();
        showAlert("Nom de l'ingrédient modifié avec succès");
      } else {
        showAlert("Erreur lors de la modification du nom", "error");
      }
    } catch (error) {
      console.error("Error updating ingredient name:", error);
      showAlert("Erreur lors de la modification du nom", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleIngredientImageUpload = async (ingredientId, file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetchWithAuth(`${config.API_URL}/ingredients/${ingredientId}/image`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        fetchPlats();
        showAlert("Image de l'ingrédient ajoutée avec succès", "success", `${config.API_URL}/uploads/${data.image}`);
      } else {
        showAlert("Erreur lors de l'ajout de l'image", "error");
      }
    } catch (error) {
      console.error("Error uploading ingredient image:", error);
      showAlert("Erreur lors de l'ajout de l'image", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleIngredientImageRemove = async (ingredientId) => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${config.API_URL}/ingredients/${ingredientId}/image`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPlats();
        showAlert("Image de l'ingrédient supprimée avec succès");
      } else {
        showAlert("Erreur lors de la suppression de l'image", "error");
      }
    } catch (error) {
      console.error("Error removing ingredient image:", error);
      showAlert("Erreur lors de la suppression de l'image", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveIngredientFromPlat = async (platId, ingredientId) => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${config.API_URL}/plats/${platId}/ingredients/${ingredientId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPlats();
        showAlert("Ingrédient retiré du plat avec succès");
      } else {
        showAlert("Erreur lors du retrait de l'ingrédient", "error");
      }
    } catch (error) {
      console.error("Error removing ingredient from plat:", error);
      showAlert("Erreur lors du retrait de l'ingrédient", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleIngredientRemovable = async (platId, ingredientId, removable) => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${config.API_URL}/plats/${platId}/ingredients/${ingredientId}`, {
        method: 'PUT',
        body: JSON.stringify({ removable }),
      });

      if (response.ok) {
        fetchPlats();
        showAlert(`Ingrédient marqué comme ${removable ? 'removable' : 'non-removable'}`);
      } else {
        showAlert("Erreur lors de la mise à jour", "error");
      }
    } catch (error) {
      console.error("Error updating ingredient removable status:", error);
      showAlert("Erreur lors de la mise à jour", "error");
    } finally {
      setLoading(false);
    }
  };

  

  const fetchAvailableIngredients = async () => {
    try {
      const response = await fetch(`${config.API_URL}/ingredients`);
      if (response.ok) {
        const ingredients = await response.json();
        setAvailableIngredients(ingredients);
      }
    } catch (error) {
      console.error("Error fetching ingredients:", error);
    }
  };

  const handleAddIngredientToPlat = async (platId, ingredientId) => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${config.API_URL}/plats/${platId}/ingredients`, {
        method: 'POST',
        body: JSON.stringify({ ingredientId, removable: true }),
      });

      if (response.ok) {
        fetchPlats();
        // keep the add dialog open so admins can add multiple ingredients quickly
        showAlert("Ingrédient ajouté au plat avec succès");
      } else {
        showAlert("Erreur lors de l'ajout de l'ingrédient", "error");
      }
    } catch (error) {
      console.error("Error adding ingredient to plat:", error);
      showAlert("Erreur lors de l'ajout de l'ingrédient", "error");
    } finally {
      setLoading(false);
    }
  };

  // Version management handlers
  const handleAddVersion = () => {
    setEditingVersion(null);
    // If no versions exist yet, pre-fill with "Standard" and 0 extra price
    const hasVersions = currentPlat?.versions && currentPlat.versions.length > 0;
    setVersionFormData({
      size: hasVersions ? '' : 'Standard',
      extraPrice: 0,
      tagIds: []
    });
    setVersionDialogOpen(true);
  };

  const handleEditVersion = (version) => {
    setEditingVersion(version);
    setVersionFormData({ 
      size: version.size, 
      extraPrice: version.extraPrice || 0,
      tagIds: version.tags ? version.tags.map(tag => tag.id) : []
    });
    setVersionDialogOpen(true);
  };

  const handleSaveVersion = async () => {
    if (!currentPlat || !versionFormData.size.trim()) return;

    try {
      setLoading(true);
      const versions = [...(currentPlat.versions || [])];
      
      if (editingVersion) {
        // Update existing version
        const index = versions.findIndex(v => v.id === editingVersion.id);
        if (index !== -1) {
          versions[index] = { 
            id: editingVersion.id,
            size: versionFormData.size, 
            extraPrice: parseFloat(versionFormData.extraPrice) 
          };
        }
      } else {
        // Add new version (no ID yet, will be created on server)
        versions.push({ size: versionFormData.size, extraPrice: parseFloat(versionFormData.extraPrice) });
      }

      // Build versionTags object with all existing tags plus the current version's tags
      const versionTags = {};
      (currentPlat.versions || []).forEach(v => {
        if (v.tags && v.tags.length > 0) {
          // Use ID if available, otherwise use size
          versionTags[v.id || v.size] = v.tags.map(tag => tag.id);
        }
      });
      // Override with the current version's tags (use ID if available)
      const versionKey = editingVersion ? editingVersion.id : versionFormData.size;
      versionTags[versionKey] = versionFormData.tagIds;

      const response = await fetchWithAuth(`${config.API_URL}/plats/${currentPlat.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: currentPlat.nom || currentPlat.name,
          price: currentPlat.price || currentPlat.basePrice,
          description: currentPlat.description || '',
          ordre: currentPlat.ordre,
          // Explicitly preserve all relevant flags and tags when editing versions
          availableForDelivery: currentPlat.availableForDelivery !== false,
          available: currentPlat.available !== false,
          speciality: currentPlat.speciality === true,
          IncludesSauce: currentPlat.IncludesSauce === true || currentPlat.includesSauce === true,
          saucePrice: currentPlat.saucePrice || 0,
          tags: (currentPlat.tags || []).map(tag => tag.id),
          versions: versions,
          versionTags: versionTags
        }),
      });

      if (response.ok) {
        fetchPlats();
        setVersionDialogOpen(false);
        showAlert(`Version ${editingVersion ? 'modifiée' : 'ajoutée'} avec succès`);
      } else {
        showAlert("Erreur lors de la sauvegarde de la version", "error");
      }
    } catch (error) {
      console.error("Error saving version:", error);
      showAlert("Erreur lors de la sauvegarde de la version", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVersion = async (versionId) => {
    if (!currentPlat) return;

    try {
      setLoading(true);
      const versions = (currentPlat.versions || []).filter(v => v.id !== versionId);

      // Build versionTags for remaining versions, using IDs as keys
      const versionTags = {};
      versions.forEach(v => {
        if (v.tags && v.tags.length > 0) {
          versionTags[v.id] = v.tags.map(tag => tag.id);
        }
      });

      const response = await fetchWithAuth(`${config.API_URL}/plats/${currentPlat.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: currentPlat.nom || currentPlat.name,
          price: currentPlat.price || currentPlat.basePrice,
          description: currentPlat.description || '',
          ordre: currentPlat.ordre || '',
          availableForDelivery: currentPlat.availableForDelivery !== false,
          available: currentPlat.available !== false,
          speciality: currentPlat.speciality === true,
          IncludesSauce: currentPlat.IncludesSauce === true || currentPlat.includesSauce === true,
          saucePrice: currentPlat.saucePrice || 0,
          tags: (currentPlat.tags || []).map(tag => tag.id),
          versions: versions,
          versionTags: versionTags
        }),
      });

      if (response.ok) {
        fetchPlats();
        showAlert("Version supprimée avec succès");
      } else {
        showAlert("Erreur lors de la suppression de la version", "error");
      }
    } catch (error) {
      console.error("Error deleting version:", error);
      showAlert("Erreur lors de la suppression de la version", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVersionImageUpload = async (versionId, file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetchWithAuth(`${config.API_URL}/plat-versions/${versionId}/image`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        fetchPlats();
        showAlert("Image de la version ajoutée avec succès", "success", `${config.API_URL}${data.image}`);
      } else {
        showAlert("Erreur lors de l'ajout de l'image", "error");
      }
    } catch (error) {
      console.error("Error uploading version image:", error);
      showAlert("Erreur lors de l'ajout de l'image", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVersionImageRemove = async (versionId) => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${config.API_URL}/plat-versions/${versionId}/image`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPlats();
        showAlert("Image de la version supprimée avec succès");
      } else {
        showAlert("Erreur lors de la suppression de l'image", "error");
      }
    } catch (error) {
      console.error("Error removing version image:", error);
      showAlert("Erreur lors de la suppression de l'image", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVersionTags = async (platId, versionId, versionSize, tagIds) => {
    try {
      setLoading(true);

      // Build versionTags object with all existing tags for other versions plus the updated tags for this version
      // Use version IDs as keys to properly track versions even if their size changes
      const versionTags = {};
      (currentPlat.versions || []).forEach(v => {
        if (v.id === versionId) {
          // Use the new tag IDs for this version (keyed by ID)
          versionTags[versionId] = tagIds;
        } else if (v.tags && v.tags.length > 0) {
          // Keep existing tags for other versions (keyed by ID)
          versionTags[v.id] = v.tags.map(tag => tag.id);
        }
      });

      // Also include version data with IDs for proper matching
      const versionsWithIds = (currentPlat.versions || []).map(v => ({
        id: v.id,
        size: v.size,
        extraPrice: v.extraPrice
      }));

      const response = await fetchWithAuth(`${config.API_URL}/plats/${platId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: currentPlat.nom || currentPlat.name,
          price: currentPlat.price || currentPlat.basePrice,
          description: currentPlat.description || '',
          ordre: currentPlat.ordre || '',
          availableForDelivery: currentPlat.availableForDelivery !== false,
          available: currentPlat.available !== false,
          speciality: currentPlat.speciality === true,
          IncludesSauce: currentPlat.IncludesSauce === true || currentPlat.includesSauce === true,
          saucePrice: currentPlat.saucePrice || 0,
          // Preserve current plat tags so they don't get cleared
          tags: (currentPlat.tags || []).map(tag => tag.id),
          versions: versionsWithIds,
          versionTags: versionTags
        }),
      });

      if (response.ok) {
        fetchPlats();
        showAlert("Tag de la version mis à jour avec succès");
      } else {
        showAlert("Erreur lors de la mise à jour du tag", "error");
      }
    } catch (error) {
      console.error("Error updating version tags:", error);
      showAlert("Erreur lors de la mise à jour du tag", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete plat

  // Handle save plat
  const handleSavePlat = async () => {
    if (!editingPlat) return;

    try {
      setLoading(true);
      const response = await fetchWithAuth(`${config.API_URL}/plats/${editingPlat.id}`, {
        method: "PUT",
        body: JSON.stringify({
          nom: editingPlat.nom || editingPlat.name,
          description: editingPlat.description,
          price: editingPlat.price || editingPlat.basePrice,
          available: editingPlat.available !== false,
          tags: (editingPlat.tags || []).map(t => t.id),
        }),
      });

      if (response.ok) {
        setOpenEditDialog(false);
        fetchPlats();
        showAlert("Plat modifié avec succès");
      } else {
        showAlert("Erreur lors de la sauvegarde", "error");
      }
    } catch (error) {
      console.error("Error saving plat:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete plat
  const handleDeleteClick = (plat) => {
    setPlatToDelete(plat);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!platToDelete) return;

    try {
      setLoading(true);
      const response = await fetchWithAuth(`${config.API_URL}/plats/${platToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setOpenDeleteDialog(false);
        setPlatToDelete(null);
        fetchPlats();
        setSelectedPlatId(null);
        showAlert("Plat supprimé avec succès");
      } else {
        showAlert("Erreur lors de la suppression", "error");
      }
    } catch (error) {
      console.error("Error deleting plat:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  // Association handlers
  const handleCopyAssociations = () => {
    setTagClipboard({
      proposition: [...(associationFormData.proposition || [])]
    });
    showAlert("Tags de proposition copiés dans le presse‑papier");
  };

  const handlePasteAssociations = async () => {
    if (!selectedPlatId || !tagClipboard) return;

    try {
      setLoading(true);
      const response = await fetchWithAuth(`${config.API_URL}/admin/associations/${selectedPlatId}`, {
        method: "PUT",
        body: JSON.stringify({
          proposition: (tagClipboard.proposition || []).map(id => parseInt(id))
        })
      });

      if (response.ok) {
        setAssociationFormData({
          proposition: [...(tagClipboard.proposition || [])]
        });
        await fetchPlatAssociations(selectedPlatId);
        showAlert("Tags de proposition collés avec succès");
      } else {
        showAlert("Erreur lors du collage des tags", "error");
      }
    } catch (error) {
      console.error("Error pasting associations:", error);
      showAlert("Erreur lors du collage", "error");
    } finally {
      setLoading(false);
    }
  };
  const handleToggleProposition = async (tagId) => {
    if (!selectedPlatId || loading) return;

    const currentSelected = associationFormData.proposition || [];
    const isSelected = currentSelected.some(id => String(id) === String(tagId));
    const newSelected = isSelected
      ? currentSelected.filter(id => String(id) !== String(tagId))
      : [...currentSelected, tagId];

    try {
      setLoading(true);
      const response = await fetchWithAuth(`${config.API_URL}/admin/associations/${selectedPlatId}`, {
        method: "PUT",
        body: JSON.stringify({
          proposition: newSelected.map(id => parseInt(id))
        })
      });

      if (response.ok) {
        setAssociationFormData(prev => ({
          proposition: newSelected
        }));
        showAlert("Association mise à jour", "success");
        await fetchPlatAssociations(selectedPlatId);
      } else {
        showAlert("Erreur lors de la mise à jour des associations", "error");
      }
    } catch (error) {
      console.error("Error updating associations:", error);
      showAlert("Erreur lors de la mise à jour", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRelatifTag = async (tagId) => {
    if (!selectedPlatId || !currentPlat || loading) return;

    const currentTagIds = (currentPlat.tags || []).map(t => t.id);
    const isSelected = currentTagIds.some(id => String(id) === String(tagId));
    const newTagIds = isSelected
      ? currentTagIds.filter(id => String(id) !== String(tagId))
      : [...currentTagIds, tagId];

    try {
      setLoading(true);
      const response = await fetch(`${config.API_URL}/plats/${selectedPlatId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: currentPlat.nom || currentPlat.name,
          price: currentPlat.price || currentPlat.basePrice,
          description: currentPlat.description || "",
          ordre: currentPlat.ordre || '',
          available: currentPlat.available !== false,
          tags: newTagIds
        })
      });

      if (response.ok) {
        await fetchPlats();
        showAlert("Tag mis à jour avec succès", "success");
      } else {
        showAlert("Erreur lors de la mise à jour du tag", "error");
      }
    } catch (error) {
      console.error("Error updating relatif tag:", error);
      showAlert("Erreur lors de la mise à jour", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAssociations = async () => {
    if (!selectedPlatId) {
      showAlert("Veuillez sélectionner un plat", "error");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${config.API_URL}/admin/associations/${selectedPlatId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          proposition: (associationFormData.proposition || []).map(id => parseInt(id))
        })
      });

      if (response.ok) {
        await fetchPlatAssociations(selectedPlatId);
        showAlert("Associations sauvegardées avec succès");
      } else {
        showAlert("Erreur lors de la sauvegarde des associations", "error");
      }
    } catch (error) {
      console.error("Error saving associations:", error);
      showAlert("Erreur lors de la sauvegarde", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssociations = async () => {
    if (!selectedPlatId) return;

    if (!window.confirm("Êtes-vous sûr de vouloir supprimer toutes les associations?")) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${config.API_URL}/admin/associations/${selectedPlatId}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setAssociationFormData({ proposition: [] });
        showAlert("Associations supprimées avec succès");
      } else {
        showAlert("Erreur lors de la suppression", "error");
      }
    } catch (error) {
      console.error("Error deleting associations:", error);
      showAlert("Erreur lors de la suppression", "error");
    } finally {
      setLoading(false);
    }
  };

  const currentPlat = plats.find(p => p.id === selectedPlatId);

  return (
    <Box sx={{ p: 3 }}>
      <Fade in={true} timeout={800}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 3,
          }}
        >
          <RestaurantIcon sx={{ color: "#ff9800", fontSize: "2rem" }} />
          Inspection des Plats
        </Typography>
      </Fade>
      <Fade in={true} timeout={1200}>
        <Box sx={{ display: "flex", height: "calc(100vh - 200px)", gap: 3 }}>
          {/* LEFT SIDEBAR - PLAT LIST */}
          <Paper
            elevation={0}
            sx={{
              width: 320,
              display: "flex",
              flexDirection: "column",
              borderRadius: 3,
              border: "1px solid rgba(255, 152, 0, 0.1)",
              background: "linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Header */}
            <Box sx={{
              p: 2,
              background: "linear-gradient(145deg, rgba(255, 152, 0, 0.1), rgba(255, 152, 0, 0.05))",
              borderRadius: "12px 12px 0 0",
              borderBottom: "1px solid rgba(255, 152, 0, 0.1)"
            }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{
                  fontWeight: "bold",
                  color: "#ffb74d",
                  display: "flex",
                  alignItems: "center",
                  gap: 1
                }}>
                  📋 Plats
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "normal" }}>
                    ({filteredPlats.length})
                  </Typography>
                </Typography>
              </Box>

              {/* Tag Filter */}
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Filtrer par tag</InputLabel>
                <Select
                  value={selectedTagFilter}
                  onChange={(e) => setSelectedTagFilter(e.target.value)}
                  label="Filtrer par tag"
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 152, 0, 0.2)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 152, 0, 0.4)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#ff9800',
                    },
                    '& .MuiSelect-select': {
                      color: 'white',
                    },
                    '& .MuiSelect-icon': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  }}
                >
                  <MenuItem value="">
                    <Typography sx={{ color: 'white' }}>Tous les plats</Typography>
                  </MenuItem>
                  <MenuItem value="NO_TAG">
                    <Typography sx={{ color: '#f44336' }}>❌ Aucun tag "Is" associé</Typography>
                  </MenuItem>
                  {tags.map(tag => (
                    <MenuItem key={tag.id} value={tag.id}>
                      <Typography sx={{ color: 'white' }}>
                        {tag.emoji ? `${tag.emoji} ` : ""}{tag.nom}
                      </Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Search Bar */}
            <Box sx={{ p: 2, borderBottom: "1px solid rgba(255, 152, 0, 0.1)" }}>
              <TextField
                placeholder="Rechercher..."
                size="small"
                fullWidth
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    '& fieldset': {
                      borderColor: 'rgba(255, 152, 0, 0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 152, 0, 0.4)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#ff9800',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: 'white',
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                }}
              />
            </Box>

            {/* Plat List */}
            <List sx={{
              flex: 1,
              overflowY: "auto",
              '& .MuiListItemButton-root': {
                borderBottom: "1px solid rgba(255, 152, 0, 0.1)",
                '&.Mui-selected': {
                  backgroundColor: "rgba(255, 152, 0, 0.1)",
                  borderLeft: "3px solid #ff9800",
                  '&:hover': {
                    backgroundColor: "rgba(255, 152, 0, 0.15)",
                  },
                },
                '&:hover': {
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                },
              },
            }}>
              {filteredPlats.length === 0 ? (
                <Box sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Aucun plat trouvé
                  </Typography>
                </Box>
              ) : (
                filteredPlats.map(plat => (
                  <ListItemButton
                    key={plat.id}
                    selected={selectedPlatId === plat.id}
                    onClick={() => handleSelectPlat(plat.id)}
                  >
                    <ListItemAvatar sx={{ minWidth: 50 }}>
                      {plat.image && (
                        <Avatar
                          src={`${config.API_URL}/uploads/${plat.image}`}
                          variant="rounded"
                          sx={{
                            width: 32,
                            height: 32,
                          }}
                        />
                      )}
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" sx={{
                            fontWeight: "500",
                            color: selectedPlatId === plat.id ? "#ffb74d" : "white",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "120px"
                          }}>
                            {plat.nom || plat.name}
                          </Typography>
                          {(plat.tags?.length || 0) === 0 && (
                            <Tooltip title="No tags assigned">
                              <Box sx={{ color: "#ff9800", fontSize: "0.8rem" }}>
                                ⚠️
                              </Box>
                            </Tooltip>
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {(plat.price || plat.basePrice)?.toFixed(2)}€ • {plat.available !== false ? "✓" : "✗"}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                ))
              )}
            </List>
          </Paper>

          {/* RIGHT PANEL - PLAT DETAILS */}
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              borderRadius: 3,
              border: "1px solid rgba(255, 152, 0, 0.1)",
              background: "linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))",
              backdropFilter: "blur(20px)",
              overflow: "hidden",
            }}
          >
            {!currentPlat ? (
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  color: "text.secondary",
                }}
              >
                <Typography variant="h5" sx={{ mb: 2, color: "#ffb74d" }}>
                  Sélectionnez un plat
                </Typography>
                <Typography variant="body2">pour afficher les détails</Typography>
              </Box>
            ) : (
              <>
                {/* Plat Header */}
                <Box
                  sx={{
                    p: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    borderBottom: "1px solid rgba(255, 152, 0, 0.1)",
                    background: "linear-gradient(145deg, rgba(255, 152, 0, 0.05), rgba(255, 152, 0, 0.02))",
                  }}
                >
              {/* Thumbnail Image */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                  flexShrink: 0,
                }}
              >
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: 1,
                    overflow: "hidden",
                    backgroundColor: "#f5f5f5",
                  }}
                >
                  {currentPlat.image ? (
                    <CardMedia
                      component="img"
                      image={
                        currentPlat.image.startsWith("http")
                          ? currentPlat.image
                          : `${config.API_URL}${currentPlat.image}`
                      }
                      alt={currentPlat.nom || currentPlat.name}
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#e0e0e0",
                        fontSize: "2rem",
                      }}
                    >
                      🍽️
                    </Box>
                  )}
                </Box>

                {/* Image Controls */}
                <Box sx={{ display: "flex", gap: 1 }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <Tooltip title="Télécharger une nouvelle image">
                    <IconButton
                      size="small"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': {
                          color: '#ff9800',
                          backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        },
                      }}
                    >
                      <PhotoIcon />
                    </IconButton>
                  </Tooltip>
                  {currentPlat?.image && (
                    <Tooltip title="Supprimer l'image">
                      <IconButton
                        size="small"
                        onClick={handleImageRemove}
                        disabled={loading}
                        sx={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&:hover': {
                            color: '#f44336',
                            backgroundColor: 'rgba(244, 67, 54, 0.1)',
                          },
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>

              {/* Info */}
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    label="Nom"
                    size="small"
                    value={inlineEditData.nom || ""}
                    onChange={(e) => setInlineEditData({ ...inlineEditData, nom: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        '& fieldset': { borderColor: 'rgba(255, 152, 0, 0.2)' },
                        '&:hover fieldset': { borderColor: 'rgba(255, 152, 0, 0.4)' },
                        '&.Mui-focused fieldset': { borderColor: '#ff9800' },
                      },
                      '& .MuiInputBase-input': { color: 'white' },
                      '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    }}
                  />
                  <TextField
                    label="Description"
                    size="small"
                    multiline
                    rows={2}
                    value={inlineEditData.description || ""}
                    onChange={(e) => setInlineEditData({ ...inlineEditData, description: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        '& fieldset': { borderColor: 'rgba(255, 152, 0, 0.2)' },
                        '&:hover fieldset': { borderColor: 'rgba(255, 152, 0, 0.4)' },
                        '&.Mui-focused fieldset': { borderColor: '#ff9800' },
                      },
                      '& .MuiInputBase-input': { color: 'white' },
                      '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    }}
                  />
                  <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <TextField
                      label="Prix (€)"
                      type="number"
                      size="small"
                      inputProps={{ step: "0.01", min: "0" }}
                      value={inlineEditData.price || 0}
                      onChange={(e) => setInlineEditData({ ...inlineEditData, price: parseFloat(e.target.value) || 0 })}
                      sx={{
                        width: 120,
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          '& fieldset': { borderColor: 'rgba(255, 152, 0, 0.2)' },
                          '&:hover fieldset': { borderColor: 'rgba(255, 152, 0, 0.4)' },
                          '&.Mui-focused fieldset': { borderColor: '#ff9800' },
                        },
                        '& .MuiInputBase-input': { color: 'white' },
                        '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                      }}
                    />
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleInlineEditSave}
                      sx={{ backgroundColor: '#ff9800', ml: 1, '&:hover': { backgroundColor: '#f57c00' } }}
                    >
                      Sauvegarder
                    </Button>
                  </Box>

                  {/* Additional Options Row */}
                  <Box sx={{ display: "flex", gap: 3, alignItems: "center", flexWrap: "wrap" }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={inlineEditData.available !== false}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setInlineEditData({ ...inlineEditData, available: val });
                            updatePlatField({ available: val });
                          }}
                          sx={{
                            color: 'rgba(255, 152, 0, 0.5)',
                            '&.Mui-checked': {
                              color: '#ff9800',
                            },
                          }}
                        />
                      }
                      label={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Typography variant="body2" sx={{ color: 'white', fontSize: '0.875rem' }}>
                            Disponible
                          </Typography>
                        </Box>
                      }
                    />

                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={inlineEditData.availableForDelivery !== false}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setInlineEditData({ ...inlineEditData, availableForDelivery: val });
                            updatePlatField({ availableForDelivery: val });
                          }}
                          sx={{
                            color: 'rgba(255, 152, 0, 0.5)',
                            '&.Mui-checked': {
                              color: '#ff9800',
                            },
                          }}
                        />
                      }
                      label={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <LocalShippingIcon sx={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.7)' }} />
                          <Typography variant="body2" sx={{ color: 'white', fontSize: '0.875rem' }}>
                            Livraison
                          </Typography>
                        </Box>
                      }
                    />

                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={inlineEditData.speciality === true}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setInlineEditData({ ...inlineEditData, speciality: val });
                            updatePlatField({ speciality: val });
                          }}
                          sx={{
                            color: 'rgba(255, 152, 0, 0.5)',
                            '&.Mui-checked': {
                              color: '#ff9800',
                            },
                          }}
                        />
                      }
                      label={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <StarIcon sx={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.7)' }} />
                          <Typography variant="body2" sx={{ color: 'white', fontSize: '0.875rem' }}>
                            Spécialité
                          </Typography>
                        </Box>
                      }
                    />

                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={inlineEditData.includesSauce !== false}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setInlineEditData({ ...inlineEditData, includesSauce: val });
                            updatePlatField({ includesSauce: val });
                          }}
                          sx={{
                            color: 'rgba(255, 152, 0, 0.5)',
                            '&.Mui-checked': {
                              color: '#ff9800',
                            },
                          }}
                        />
                      }
                      label={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <RestaurantIcon sx={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.7)' }} />
                          <Typography variant="body2" sx={{ color: 'white', fontSize: '0.875rem' }}>
                            Choix de sauce
                          </Typography>
                        </Box>
                      }
                    />

                    {inlineEditData.includesSauce && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          label="Prix sauce (€)"
                          type="number"
                          size="small"
                          inputProps={{ step: "0.01", min: "0" }}
                          value={inlineEditData.saucePrice || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setInlineEditData({ ...inlineEditData, saucePrice: val });
                          }}
                          sx={{
                            width: 120,
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              '& fieldset': { borderColor: 'rgba(255, 152, 0, 0.2)' },
                              '&:hover fieldset': { borderColor: 'rgba(255, 152, 0, 0.4)' },
                              '&.Mui-focused fieldset': { borderColor: '#ff9800' },
                            },
                            '& .MuiInputBase-input': { color: 'white' },
                            '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                          }}
                        />
                      </Box>
                    )}

                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={inlineEditData.platCache === true}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setInlineEditData({ ...inlineEditData, platCache: val });
                            updatePlatField({ platCache: val });
                          }}
                          sx={{
                            color: 'rgba(255, 152, 0, 0.5)',
                            '&.Mui-checked': {
                              color: '#f44336',
                            },
                          }}
                        />
                      }
                      label={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Typography variant="body2" sx={{ color: 'white', fontSize: '0.875rem' }}>
                            🔒 Caché (recommandations)
                          </Typography>
                        </Box>
                      }
                    />

                    <TextField
                      label="Ordre"
                      size="small"
                      value={inlineEditData.ordre || ""}
                      onChange={(e) => setInlineEditData({ ...inlineEditData, ordre: e.target.value })}
                      sx={{
                        width: 100,
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          '& fieldset': { borderColor: 'rgba(255, 152, 0, 0.2)' },
                          '&:hover fieldset': { borderColor: 'rgba(255, 152, 0, 0.4)' },
                          '&.Mui-focused fieldset': { borderColor: '#ff9800' },
                        },
                        '& .MuiInputBase-input': { color: 'white' },
                        '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                      }}
                    />

                    <Tooltip title="Formater le texte (Première lettre en majuscule)">
                      <IconButton
                        size="small"
                        onClick={() => {
                          const formattedName = inlineEditData.nom.charAt(0).toUpperCase() + inlineEditData.nom.slice(1).toLowerCase();
                          const formattedDescription = inlineEditData.description.charAt(0).toUpperCase() + inlineEditData.description.slice(1).toLowerCase();
                          setInlineEditData({
                            ...inlineEditData,
                            nom: formattedName,
                            description: formattedDescription
                          });
                        }}
                        sx={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&:hover': {
                            color: '#ff9800',
                            backgroundColor: 'rgba(255, 152, 0, 0.1)',
                          },
                        }}
                      >
                        <TextFormatIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Tabs */}
            <Tabs
              value={tabIndex}
              onChange={(e, newValue) => setTabIndex(newValue)}
              sx={{
                borderBottom: "1px solid rgba(255, 152, 0, 0.1)",
                backgroundColor: "rgba(255, 152, 0, 0.05)",
                '& .MuiTab-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-selected': {
                    color: '#ffb74d',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#ff9800',
                },
              }}
            >
              <Tab label="Composition" id="tab-0" />
              <Tab label="Versions" id="tab-1" />
              <Tab label="Tags & Associations" id="tab-2" />
              <Tab label="Statistiques" id="tab-3" />
            </Tabs>

            {/* Tab Content */}
            <Box sx={{ flex: 1, overflow: "auto" }}>
              {/* TAB 0: Composition */}
              <TabPanel value={tabIndex} index={0}>
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                      Composition ({currentPlat.ingredients?.length || 0} ingrédients)
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      variant="contained"
                      onClick={() => {
                        fetchAvailableIngredients();
                        setIngredientSearchTerm("");
                        setAddIngredientDialogOpen(true);
                      }}
                      sx={{
                        backgroundColor: "#ff9800",
                        '&:hover': {
                          backgroundColor: "#f57c00",
                        },
                      }}
                    >
                      Ajouter un ingrédient
                    </Button>
                  </Box>

                  {currentPlat.ingredients && currentPlat.ingredients.length > 0 ? (
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 2 }}>
                      {currentPlat.ingredients.map(ing => (
                        <Card
                          key={ing.ingredient?.id || ing.id}
                          sx={{
                            background: "linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))",
                            border: "1px solid rgba(255, 152, 0, 0.1)",
                            borderRadius: 2,
                            overflow: "hidden",
                          }}
                        >
                          {/* Ingredient Image */}
                          <Box sx={{ position: "relative", height: 60, backgroundColor: "#f5f5f5" }}>
                            {ing.ingredient?.image ? (
                              <CardMedia
                                component="img"
                                image={`${config.API_URL}/uploads/${ing.ingredient.image}`}
                                alt={ing.ingredient.name}
                                sx={{ width: "100%", height: "100%", objectFit: "fill" }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backgroundColor: "rgba(255, 152, 0, 0.1)",
                                  border: "2px dashed rgba(255, 152, 0, 0.3)",
                                }}
                              >
                                <RestaurantIcon
                                  sx={{
                                    fontSize: 32,
                                    color: "rgba(255, 152, 0, 0.5)",
                                    opacity: 0.7,
                                  }}
                                />
                              </Box>
                            )}

                            {/* Image Controls */}
                            <Box sx={{ position: "absolute", top: 4, right: 4, display: "flex", flexDirection: "column", gap: 0.5 }}>
                              <input
                                type="file"
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file && ing.ingredient?.id) {
                                    handleIngredientImageUpload(ing.ingredient.id, file);
                                  }
                                  e.target.value = null; // Reset input
                                }}
                                id={`ingredient-image-upload-${ing.ingredient?.id || ing.id}`}
                              />
                              <Tooltip title="Changer l'image">
                                <IconButton
                                  size="small"
                                  onClick={() => document.getElementById(`ingredient-image-upload-${ing.ingredient?.id || ing.id}`).click()}
                                  sx={{
                                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                                    color: "white",
                                    '&:hover': {
                                      backgroundColor: "rgba(0, 0, 0, 0.7)",
                                    },
                                  }}
                                >
                                  <PhotoIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {ing.ingredient?.image && (
                                <Tooltip title="Supprimer l'image">
                                  <IconButton
                                    size="small"
                                    onClick={() => ing.ingredient?.id && handleIngredientImageRemove(ing.ingredient.id)}
                                    sx={{
                                      backgroundColor: "rgba(244, 67, 54, 0.8)",
                                      color: "white",
                                      '&:hover': {
                                        backgroundColor: "rgba(244, 67, 54, 1)",
                                      },
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Retirer de ce plat">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    if (currentPlat?.id && ing.ingredient?.id) {
                                      handleRemoveIngredientFromPlat(currentPlat.id, ing.ingredient.id);
                                    }
                                  }}
                                  sx={{
                                    backgroundColor: "rgba(139, 69, 19, 0.8)",
                                    color: "white",
                                    '&:hover': {
                                      backgroundColor: "rgba(139, 69, 19, 1)",
                                    },
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>

                          {/* Ingredient Content */}
                          <CardContent sx={{ p: 2 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                mb: 1,
                                fontWeight: 'bold',
                                color: 'white',
                                textAlign: 'center',
                                fontSize: '0.9rem'
                              }}
                            >
                              {ing.ingredient?.name || ing.name || ""}
                            </Typography>

                            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    size="small"
                                    checked={ing.removable !== false}
                                    onChange={(e) => {
                                      if (currentPlat?.id && ing.ingredient?.id) {
                                        handleToggleIngredientRemovable(currentPlat.id, ing.ingredient.id, e.target.checked);
                                      }
                                    }}
                                    sx={{
                                      '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: '#ff9800',
                                      },
                                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: '#ff9800',
                                      },
                                    }}
                                  />
                                }
                                label="Retirable"
                                sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.7)' } }}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                        Aucun ingrédient
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Cliquez sur "Ajouter un ingrédient" pour commencer
                      </Typography>
                    </Box>
                  )}
                </Box>
              </TabPanel>

              {/* TAB 1: Versions */}
              <TabPanel value={tabIndex} index={1}>
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                      Tailles disponibles ({currentPlat.versions?.length || 0})
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      variant="contained"
                      color="primary"
                      onClick={handleAddVersion}
                    >
                      Ajouter
                    </Button>
                  </Box>

                  {currentPlat.versions && currentPlat.versions.length > 0 ? (
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 2 }}>
                      {[...currentPlat.versions]
                        .sort((a, b) => (a.extraPrice || 0) - (b.extraPrice || 0))
                        .map(version => (
                        <Card
                          key={version.id}
                          sx={{
                            background: "linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))",
                            border: "1px solid rgba(255, 152, 0, 0.1)",
                            borderRadius: 2,
                            overflow: "hidden",
                          }}
                        >
                          {/* Version Image */}
                          <Box sx={{ position: "relative", height: 120, backgroundColor: "#f5f5f5" }}>
                            {version.image ? (
                              <CardMedia
                                component="img"
                                image={`${config.API_URL}${version.image}`}
                                alt={`Version ${version.size}`}
                                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backgroundColor: "rgba(255, 152, 0, 0.1)",
                                  border: "2px dashed rgba(255, 152, 0, 0.3)",
                                }}
                              >
                                <Typography variant="caption" color="text.secondary">
                                  📏 {version.size}
                                </Typography>
                              </Box>
                            )}

                            {/* Image Controls */}
                            <Box sx={{ position: "absolute", top: 4, right: 4, display: "flex", gap: 0.5 }}>
                              <input
                                type="file"
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file && version.id) {
                                    handleVersionImageUpload(version.id, file);
                                  }
                                  e.target.value = null; // Reset input
                                }}
                                id={`version-image-upload-${version.id}`}
                              />
                              <Tooltip title="Changer l'image">
                                <IconButton
                                  size="small"
                                  onClick={() => document.getElementById(`version-image-upload-${version.id}`).click()}
                                  sx={{
                                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                                    color: "white",
                                    '&:hover': {
                                      backgroundColor: "rgba(0, 0, 0, 0.7)",
                                    },
                                  }}
                                >
                                  <PhotoIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {version.image && (
                                <Tooltip title="Supprimer l'image">
                                  <IconButton
                                    size="small"
                                    onClick={() => version.id && handleVersionImageRemove(version.id)}
                                    sx={{
                                      backgroundColor: "rgba(244, 67, 54, 0.8)",
                                      color: "white",
                                      '&:hover': {
                                        backgroundColor: "rgba(244, 67, 54, 1)",
                                      },
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </Box>

                          {/* Version Content */}
                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                              <Typography 
                                variant="h6" 
                                sx={{ 
                                  fontWeight: "bold", 
                                  color: "white",
                                  fontSize: "1rem",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  flex: 1,
                                  mr: 1
                                }}
                              >
                                {version.size}
                              </Typography>
                              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", minWidth: 0 }}>
                                <Typography variant="body2" sx={{ color: "#ffb74d", fontWeight: "bold", fontSize: "0.75rem" }}>
                                  +{version.extraPrice?.toFixed(2) || "0.00"}€
                                </Typography>
                                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>
                                  {((currentPlat.price || currentPlat.basePrice || 0) + (version.extraPrice || 0)).toFixed(2)}€
                                </Typography>
                              </Box>
                            </Box>

                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
                                Tag:
                              </Typography>
                              <Select
                                size="small"
                                displayEmpty
                                value={version.tags && version.tags.length > 0 ? version.tags[0].id : ""}
                                onChange={(e) => {
                                  if (currentPlat?.id && version.id) {
                                    const newTagId = e.target.value ? [parseInt(e.target.value)] : [];
                                    handleUpdateVersionTags(currentPlat.id, version.id, version.size, newTagId);
                                  }
                                }}
                                sx={{
                                  minWidth: 150,
                                  maxWidth: "100%",
                                  fontSize: '0.75rem',
                                  '& .MuiSelect-select': {
                                    padding: '4px 8px',
                                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                                    color: 'rgba(255, 152, 0, 0.8)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  },
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 152, 0, 0.3)',
                                  },
                                }}
                                MenuProps={{
                                  PaperProps: {
                                    sx: {
                                      backgroundColor: 'rgba(26, 26, 26, 0.95)',
                                      backdropFilter: 'blur(20px)',
                                      border: '1px solid rgba(255, 152, 0, 0.1)',
                                    },
                                  },
                                }}
                              >
                                <MenuItem value="">
                                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Aucun tag
                                  </Typography>
                                </MenuItem>
                                {tags.map(tag => (
                                  <MenuItem key={tag.id} value={tag.id}>
                                    <Typography variant="body2" sx={{ color: 'white' }}>
                                      {tag.emoji ? `${tag.emoji} ` : ""}{tag.nom}
                                    </Typography>
                                  </MenuItem>
                                ))}
                              </Select>
                            </Box>

                            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                              <Tooltip title="Modifier">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleEditVersion(version)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Supprimer">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteVersion(version.id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                        Aucune version disponible
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Cliquez sur "Ajouter" pour créer des tailles
                      </Typography>
                    </Box>
                  )}
                </Box>
              </TabPanel>

              {/* TAB 2: Tags & Associations */}
              <TabPanel value={tabIndex} index={2}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ flex: 1 }} />
                    <Tooltip title="Copier les tags de proposition de ce plat">
                      <span>
                        <Button
                          startIcon={<ContentCopyIcon />}
                          variant="outlined"
                          size="small"
                          onClick={handleCopyAssociations}
                          disabled={!selectedPlatId}
                        >
                          Copier
                        </Button>
                      </span>
                    </Tooltip>
                    <Tooltip title={tagClipboard ? "Coller sur ce plat" : "Rien à coller"}>
                      <span>
                        <Button
                          startIcon={<ContentPasteIcon />}
                          variant="contained"
                          size="small"
                          onClick={handlePasteAssociations}
                          disabled={!selectedPlatId || !tagClipboard || loading}
                        >
                          Coller
                        </Button>
                      </span>
                    </Tooltip>
                    {(associationFormData.proposition && associationFormData.proposition.length > 0) && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={handleDeleteAssociations}
                        disabled={loading || !selectedPlatId}
                      >
                        Supprimer
                      </Button>
                    )}
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    {/* Left column: Relatif à (standard tags - editable) */}
                    <Box sx={{ p: 2, border: '1px solid rgba(255, 152, 0, 0.15)', borderRadius: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>🏷️ Relatif</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Tags standards du plat (cliquez pour ajouter/retirer)
                      </Typography>
                      <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                        gap: 0.75
                      }}>
                        {sortedTags.map(tag => {
                          const selected = (currentPlat?.tags || []).some(t => String(t.id) === String(tag.id));
                          return (
                            <Box
                              key={tag.id}
                              onClick={() => handleToggleRelatifTag(tag.id)}
                              sx={{
                                p: 0.5,
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: selected ? 'primary.main' : 'rgba(255, 152, 0, 0.25)',
                                backgroundColor: selected ? 'rgba(255, 152, 0, 0.15)' : 'transparent',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.6 : 1,
                                transition: 'all 0.15s ease',
                                pointerEvents: loading ? 'none' : 'auto',
                                '&:hover': loading ? {} : { borderColor: 'primary.main', backgroundColor: 'rgba(255, 152, 0, 0.08)' }
                              }}
                            >
                              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, lineHeight: 1.2 }}>
                                <span style={{ fontSize: 14 }}>{tag.emoji || '🏷️'}</span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tag.nom}</span>
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>

                    {/* Right column: Proposition (multi selection) */}
                    <Box sx={{ p: 2, border: '1px solid rgba(255, 152, 0, 0.15)', borderRadius: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>💡 Proposition</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Les plats de quel tags peuvent être proposés en plus en extra à ce plat?
                      </Typography>
                      <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                        gap: 0.75
                      }}>
                        {sortedTags.map(tag => {
                          const selected = (associationFormData.proposition || []).some(id => String(id) === String(tag.id));
                          return (
                            <Box
                              key={tag.id}
                              onClick={() => handleToggleProposition(tag.id)}
                              sx={{
                                p: 0.5,
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: selected ? 'secondary.main' : 'rgba(255, 152, 0, 0.25)',
                                backgroundColor: selected ? 'rgba(156, 39, 176, 0.12)' : 'transparent',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.6 : 1,
                                transition: 'all 0.15s ease',
                                pointerEvents: loading ? 'none' : 'auto',
                                '&:hover': loading ? {} : { borderColor: 'secondary.main', backgroundColor: 'rgba(156, 39, 176, 0.08)' }
                              }}
                            >
                              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, lineHeight: 1.2 }}>
                                <span style={{ fontSize: 14 }}>{tag.emoji || '💡'}</span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tag.nom}</span>
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  </Box>

                </Box>
              </TabPanel>

              {/* TAB 3: Statistiques */}
              <TabPanel value={tabIndex} index={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                      <Typography variant="subtitle1" sx={{ mr: 1 }}>Période</Typography>
                      <DatePicker
                        label="De"
                        value={statsRange.from}
                        onChange={(newValue) => {
                          setStatsRange(r => ({ ...r, from: newValue }));
                        }}
                        slotProps={{ textField: { size: 'small' } }}
                      />
                      <DatePicker
                        label="À"
                        value={statsRange.to}
                        onChange={(newValue) => {
                          setStatsRange(r => ({ ...r, to: newValue }));
                        }}
                        slotProps={{ textField: { size: 'small' } }}
                      />
                      <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel id="compare-tag-label">Comparer dans le tag</InputLabel>
                        <Select
                          labelId="compare-tag-label"
                          label="Comparer dans le tag"
                          value={statsCompareTagId}
                          onChange={(e) => setStatsCompareTagId(e.target.value)}
                        >
                          <MenuItem value="">Aucun</MenuItem>
                          {tags.map(t => (
                            <MenuItem key={t.id} value={String(t.id)}>
                              {t.emoji ? `${t.emoji} ` : ''}{t.nom}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Button variant="outlined" size="small" onClick={reloadStats} disabled={!selectedPlatId || loading}>Actualiser</Button>
                    </Box>

                  {/* Summary cards */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2 }}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Total commandes</Typography>
                      <Typography variant="h5">{stats?.totalOrders ?? '—'}</Typography>
                    </Paper>
                  </Box>

                  {/* Charts placeholders (simple lists if no chart lib) */}
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Commandes dans le temps</Typography>
                    {(stats?.ordersOverTime?.length ? (
                      <List dense>
                        {stats.ordersOverTime.map(p => (
                          <ListItem key={p.date} disablePadding>
                            <ListItemText primary={`${p.date}: ${p.quantity}`} />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Aucune donnée</Typography>
                    ))}
                  </Paper>

                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Versions les plus populaires</Typography>
                    {(stats?.mostPopularVersions?.length ? (
                      <List dense>
                        {stats.mostPopularVersions.map(v => (
                          <ListItem key={v.versionSize} disablePadding>
                            <ListItemText primary={`${v.versionSize}: ${v.quantity}`} />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Aucune donnée</Typography>
                    ))}
                  </Paper>

                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Souvent acheté avec</Typography>
                    {(stats?.frequentlyBoughtWith?.length ? (
                      <List dense>
                        {stats.frequentlyBoughtWith.map(x => (
                          <ListItem key={x.platId} disablePadding>
                            <ListItemText primary={`${x.name}: ${x.quantity}`} />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Aucune donnée</Typography>
                    ))}
                  </Paper>

                  {stats?.compareWithinTag && (
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Comparaison dans le tag</Typography>
                      {(stats.compareWithinTag.items?.length ? (
                        <List dense>
                          {stats.compareWithinTag.items.map(i => (
                            <ListItem key={i.platId} disablePadding>
                              <ListItemText primary={`${i.name}: ${i.quantity}`} />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary">Aucune donnée</Typography>
                      ))}
                    </Paper>
                  )}
                </Box>
                </LocalizationProvider>
              </TabPanel>
            </Box>
          </>
        )}
          </Paper>

      {/* Edit Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: "linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 152, 0, 0.1)",
          },
        }}
      >
        <DialogTitle sx={{ color: "#ffb74d", borderBottom: "1px solid rgba(255, 152, 0, 0.1)" }}>
          Modifier le plat
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Nom"
            fullWidth
            value={editingPlat?.nom || editingPlat?.name || ""}
            onChange={(e) =>
              setEditingPlat({
                ...editingPlat,
                nom: e.target.value,
                name: e.target.value,
              })
            }
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                '& fieldset': {
                  borderColor: 'rgba(255, 152, 0, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 152, 0, 0.4)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#ff9800',
                },
              },
              '& .MuiInputBase-input': {
                color: 'white',
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
            }}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={editingPlat?.description || ""}
            onChange={(e) =>
              setEditingPlat({ ...editingPlat, description: e.target.value })
            }
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                '& fieldset': {
                  borderColor: 'rgba(255, 152, 0, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 152, 0, 0.4)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#ff9800',
                },
              },
              '& .MuiInputBase-input': {
                color: 'white',
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
            }}
          />
          <TextField
            label="Prix"
            type="number"
            fullWidth
            inputProps={{ step: "0.01", min: "0" }}
            value={editingPlat?.price || editingPlat?.basePrice || ""}
            onChange={(e) =>
              setEditingPlat({
                ...editingPlat,
                price: parseFloat(e.target.value),
              })
            }
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                '& fieldset': {
                  borderColor: 'rgba(255, 152, 0, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 152, 0, 0.4)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#ff9800',
                },
              },
              '& .MuiInputBase-input': {
                color: 'white',
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
            }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={editingPlat?.available !== false}
                onChange={(e) =>
                  setEditingPlat({
                    ...editingPlat,
                    available: e.target.checked,
                  })
                }
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#ff9800',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    },
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#ff9800',
                  },
                }}
              />
            }
            label="Disponible"
            sx={{ color: 'white' }}
          />
        </DialogContent>
        <DialogActions sx={{
          p: 2,
          borderTop: "1px solid rgba(255, 152, 0, 0.1)",
          gap: 1
        }}>
          <Button
            onClick={() => setOpenEditDialog(false)}
            sx={{ color: 'text.secondary' }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSavePlat}
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: "#ff9800",
              '&:hover': {
                backgroundColor: "#f57c00",
              },
            }}
          >
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{
          sx: {
            background: "linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 152, 0, 0.1)",
          },
        }}
      >
        <DialogTitle sx={{ color: "#ffb74d", borderBottom: "1px solid rgba(255, 152, 0, 0.1)" }}>
          ⚠️ Confirmer la suppression
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ color: 'white', mb: 2 }}>
            Êtes-vous sûr de vouloir supprimer le plat <strong style={{ color: '#ffb74d' }}>{platToDelete?.nom || platToDelete?.name}</strong> ?
          </Typography>
          <Typography variant="caption" sx={{ color: "#f44336" }}>
            Cette action ne peut pas être annulée.
          </Typography>
        </DialogContent>
        <DialogActions sx={{
          p: 2,
          borderTop: "1px solid rgba(255, 152, 0, 0.1)",
          gap: 1
        }}>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            sx={{ color: 'text.secondary' }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={loading}
            sx={{
              backgroundColor: "#f44336",
              '&:hover': {
                backgroundColor: "#d32f2f",
              },
            }}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Ingredient Dialog */}
      <Dialog
        open={addIngredientDialogOpen}
        onClose={() => setAddIngredientDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: "linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 152, 0, 0.1)",
          },
        }}
      >
        <DialogTitle sx={{ color: "#ffb74d", borderBottom: "1px solid rgba(255, 152, 0, 0.1)" }}>
          ➕ Ajouter un ingrédient
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ color: 'white', mb: 2 }}>
            Sélectionnez un ingrédient à ajouter au plat <strong style={{ color: '#ffb74d' }}>{currentPlat?.nom || currentPlat?.name}</strong>
          </Typography>
          <TextField
            placeholder="Rechercher un ingrédient..."
            size="small"
            fullWidth
            variant="outlined"
            value={ingredientSearchTerm}
            onChange={(e) => setIngredientSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
            }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                '& fieldset': {
                  borderColor: 'rgba(255, 152, 0, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 152, 0, 0.4)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#ff9800',
                },
              },
              '& .MuiInputBase-input': {
                color: 'white',
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
            }}
          />
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {availableIngredients.length > 0 ? (
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 2 }}>
                {availableIngredients
                  .filter(ing => 
                    ingredientSearchTerm === '' || 
                    (ing.nom || ing.name || '').toLowerCase().includes(ingredientSearchTerm.toLowerCase())
                  )
                  .sort((a, b) => ((a.nom || a.name || '').localeCompare(b.nom || b.name || '')))
                  .map(ingredient => (
                    <Card
                      key={ingredient.id}
                      sx={{
                        background: "linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))",
                        border: "1px solid rgba(255, 152, 0, 0.1)",
                        borderRadius: 2,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        '&:hover': {
                          borderColor: '#ff9800',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(255, 152, 0, 0.2)',
                        },
                      }}
                      onClick={() => {
                        if (currentPlat?.id) {
                          handleAddIngredientToPlat(currentPlat.id, ingredient.id);
                        }
                      }}
                    >
                      <Box sx={{ position: "relative", height: 80, backgroundColor: "#f5f5f5" }}>
                        {ingredient.image ? (
                          <CardMedia
                            component="img"
                            image={`${config.API_URL}/uploads/${ingredient.image}`}
                            alt={ingredient.nom || ingredient.name}
                            sx={{ width: "100%", height: "100%", objectFit: "fill" }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "rgba(255, 152, 0, 0.1)",
                              border: "2px dashed rgba(255, 152, 0, 0.3)",
                            }}
                          >
                            <RestaurantIcon
                              sx={{
                                fontSize: 32,
                                color: "rgba(255, 152, 0, 0.5)",
                                opacity: 0.7,
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                      <CardContent
                        sx={{
                          p: 1,
                          textAlign: 'center',
                          backgroundColor: 'rgba(0, 0, 0, 0.75)',
                          borderRadius: '0 0 6px 6px',
                          position: 'relative',
                          zIndex: 2,
                          minHeight: 34,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#ff9800',
                            fontWeight: '700',
                            fontSize: '0.9rem',
                            textShadow: '0 1px 0 rgba(0,0,0,0.6)',
                            lineHeight: 1.1,
                          }}
                        >
                          {ingredient.nom || ingredient.name}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
              </Box>
            ) : (
              <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                Chargement des ingrédients...
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{
          p: 2,
          borderTop: "1px solid rgba(255, 152, 0, 0.1)",
          gap: 1
        }}>
          <Button
            onClick={() => setAddIngredientDialogOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Version Dialog */}
      <Dialog
        open={versionDialogOpen}
        onClose={() => setVersionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: "linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 152, 0, 0.1)",
          },
        }}
      >
        <DialogTitle sx={{ color: "#ffb74d", borderBottom: "1px solid rgba(255, 152, 0, 0.1)" }}>
          {editingVersion ? "Modifier la version" : "Ajouter une version"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Taille"
            fullWidth
            value={versionFormData.size}
            onChange={(e) => setVersionFormData({ ...versionFormData, size: e.target.value })}
            placeholder="ex: Large, Medium, Small"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                '& fieldset': {
                  borderColor: 'rgba(255, 152, 0, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 152, 0, 0.4)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#ff9800',
                },
              },
              '& .MuiInputBase-input': {
                color: 'white',
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
            }}
          />
          <TextField
            label="Prix supplémentaire (€)"
            type="number"
            fullWidth
            inputProps={{ step: "0.01", min: "0" }}
            value={versionFormData.extraPrice}
            onChange={(e) => setVersionFormData({ ...versionFormData, extraPrice: parseFloat(e.target.value) || 0 })}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                '& fieldset': {
                  borderColor: 'rgba(255, 152, 0, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 152, 0, 0.4)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#ff9800',
                },
              },
              '& .MuiInputBase-input': {
                color: 'white',
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
            }}
          />
          <FormControl fullWidth>
            <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Tags associés</InputLabel>
            <Select
              multiple
              value={versionFormData.tagIds}
              onChange={(e) => setVersionFormData({ ...versionFormData, tagIds: e.target.value })}
              input={<OutlinedInput label="Tags associés" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((tagId) => {
                    const tag = tags.find(t => t.id === tagId);
                    return tag ? (
                      <Chip 
                        key={tagId} 
                        label={`${tag.emoji ? tag.emoji + ' ' : ''}${tag.nom}`} 
                        size="small"
                        sx={{ backgroundColor: 'rgba(255, 152, 0, 0.2)', color: 'white' }}
                      />
                    ) : null;
                  })}
                </Box>
              )}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 152, 0, 0.2)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 152, 0, 0.4)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#ff9800',
                },
                '& .MuiSelect-select': {
                  color: 'white',
                },
                '& .MuiSelect-icon': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: 'rgba(26, 26, 26, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 152, 0, 0.1)',
                  },
                },
              }}
            >
              {tags.map((tag) => (
                <MenuItem key={tag.id} value={tag.id}>
                  <Checkbox 
                    checked={versionFormData.tagIds.indexOf(tag.id) > -1}
                    sx={{
                      color: 'rgba(255, 152, 0, 0.5)',
                      '&.Mui-checked': {
                        color: '#ff9800',
                      },
                    }}
                  />
                  <ListItemText 
                    primary={`${tag.emoji ? tag.emoji + ' ' : ''}${tag.nom}`}
                    sx={{ 
                      '& .MuiListItemText-primary': { 
                        color: 'white' 
                      } 
                    }}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{
          p: 2,
          borderTop: "1px solid rgba(255, 152, 0, 0.1)",
          gap: 1
        }}>
          <Button
            onClick={() => setVersionDialogOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSaveVersion}
            variant="contained"
            disabled={loading || !versionFormData.size.trim()}
            sx={{
              backgroundColor: "#ff9800",
              '&:hover': {
                backgroundColor: "#f57c00",
              },
            }}
          >
            {editingVersion ? "Modifier" : "Ajouter"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* (confirmation dialog removed - deletion is immediate) */}

      {/* Alert Snackbar */}
      <Snackbar
        open={alert.show}
        autoHideDuration={4000}
        onClose={() => setAlert({ show: false, message: "", severity: "success", image: null })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setAlert({ show: false, message: "", severity: "success", image: null })}
          severity={alert.severity}
          sx={{ width: '100%' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {alert.image && (
              <Box
                component="img"
                src={alert.image}
                alt="Preview"
                sx={{
                  width: 40,
                  height: 40,
                  objectFit: 'cover',
                  borderRadius: 1,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              />
            )}
            {alert.message}
          </Box>
        </Alert>
      </Snackbar>
        </Box>
      </Fade>
    </Box>
  );
};

export default AdminInspection;
