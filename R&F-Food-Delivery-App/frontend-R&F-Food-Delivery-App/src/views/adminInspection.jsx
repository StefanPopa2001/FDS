import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Card,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tab,
  Tabs,
  IconButton,
  Switch,
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
import config from "../config";

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
  const [alert, setAlert] = useState({ show: false, message: "", severity: "success" });
  const [inlineEditData, setInlineEditData] = useState({});

  const showAlert = (message, severity = "success") => {
    setAlert({ show: true, message, severity });
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
        available: plat.available !== false
      });
    }
    setSelectedPlatId(platId);
    setTabIndex(0);
  };

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
      const response = await fetch(`${config.API_URL}/plats/${currentPlat.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: inlineEditData.nom,
          nom: inlineEditData.nom,
          description: inlineEditData.description,
          price: parseFloat(inlineEditData.price),
          available: inlineEditData.available,
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

  // Handle delete plat

  // Handle save plat
  const handleSavePlat = async () => {
    if (!editingPlat) return;

    try {
      setLoading(true);
      const response = await fetch(`${config.API_URL}/plats/${editingPlat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: editingPlat.nom || editingPlat.name,
          description: editingPlat.description,
          price: editingPlat.price || editingPlat.basePrice,
          available: editingPlat.available !== false,
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
      const response = await fetch(`${config.API_URL}/plats/${platToDelete.id}`, {
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
                      {plat.image ? (
                        <Avatar
                          src={`${config.API_URL}/uploads/${plat.image}`}
                          variant="rounded"
                          sx={{
                            width: 40,
                            height: 40,
                          }}
                        />
                      ) : (
                        <Avatar
                          variant="rounded"
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: 'rgba(255, 152, 0, 0.2)',
                            border: '1px solid rgba(255, 152, 0, 0.3)'
                          }}
                        >
                          <PhotoIcon sx={{ color: '#ff9800', fontSize: '1.5rem' }} />
                        </Avatar>
                      )}
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" sx={{
                            fontWeight: "500",
                            color: selectedPlatId === plat.id ? "#ffb74d" : "white"
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
                  width: 100,
                  height: 100,
                  borderRadius: 1,
                  overflow: "hidden",
                  backgroundColor: "#f5f5f5",
                  flexShrink: 0,
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
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={inlineEditData.available !== false}
                          onChange={(e) => setInlineEditData({ ...inlineEditData, available: e.target.checked })}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#ff9800',
                              '&:hover': { backgroundColor: 'rgba(255, 152, 0, 0.1)' },
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#ff9800',
                            },
                          }}
                        />
                      }
                      label="Disponible"
                      sx={{ color: 'white', '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: "flex", gap: 1 }}>
                <Tooltip title="Save">
                  <IconButton
                    size="small"
                    color="success"
                    onClick={handleInlineEditSave}
                    disabled={loading}
                  >
                    <CheckIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteClick(currentPlat)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
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
              <Tab label="Tags & Associations" id="tab-0" />
              <Tab label="Versions" id="tab-1" />
              <Tab label="Ingredients" id="tab-2" />
            </Tabs>

            {/* Tab Content */}
            <Box sx={{ flex: 1, overflow: "auto" }}>
              {/* TAB 0: Tags & Associations */}
              <TabPanel value={tabIndex} index={0}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {/* Current Tags */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                      Tags attachés ({currentPlat.tags?.length || 0})
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                      {currentPlat.tags && currentPlat.tags.length > 0 ? (
                        currentPlat.tags.map(tag => (
                          <Chip
                            key={tag.id}
                            label={`${tag.emoji ? tag.emoji + " " : ""}${tag.nom}`}
                            variant="filled"
                            color="primary"
                            size="small"
                          />
                        ))
                      ) : (
                        <Typography variant="caption" color="error">
                          ⚠️ Aucun tag attribué
                        </Typography>
                      )}
                    </Box>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      variant="outlined"
                    >
                      Ajouter un tag
                    </Button>
                  </Box>

                  <Divider />

                  {/* Tag Associations (if applicable) */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                      Associations & Endpoints
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                      Manage how this plat associates with tags (e.g., "is", "hasOn")
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      variant="outlined"
                    >
                      Ajouter une association
                    </Button>
                  </Box>
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
                    >
                      Ajouter
                    </Button>
                  </Box>

                  {currentPlat.versions && currentPlat.versions.length > 0 ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {currentPlat.versions.map(version => (
                        <Paper
                          key={version.id}
                          sx={{
                            p: 2,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            backgroundColor: "#f9f9f9",
                          }}
                        >
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: "500" }}>
                              {version.size}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              +{version.extraPrice?.toFixed(2) || "0.00"}€
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Tooltip title="Edit">
                              <IconButton size="small" color="primary">
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Aucune version disponible
                    </Typography>
                  )}
                </Box>
              </TabPanel>

              {/* TAB 2: Ingredients */}
              <TabPanel value={tabIndex} index={2}>
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                      Composition ({currentPlat.ingredients?.length || 0})
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      variant="contained"
                      color="primary"
                    >
                      Ajouter
                    </Button>
                  </Box>

                  {currentPlat.ingredients && currentPlat.ingredients.length > 0 ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {currentPlat.ingredients.map(ing => (
                        <Paper
                          key={ing.ingredient?.id || ing.id}
                          sx={{
                            p: 2,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            backgroundColor: "#f9f9f9",
                          }}
                        >
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: "500" }}>
                              {ing.ingredient?.name || ing.name}
                            </Typography>
                            <FormControlLabel
                              control={<Switch size="small" defaultChecked={ing.removable} />}
                              label="Removable"
                              sx={{ m: 0 }}
                            />
                          </Box>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Tooltip title="Edit">
                              <IconButton size="small" color="primary">
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Aucun ingrédient
                    </Typography>
                  )}
                </Box>
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

      {/* Alert Snackbar */}
      <Snackbar
        open={alert.show}
        autoHideDuration={4000}
        onClose={() => setAlert({ ...alert, show: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setAlert({ ...alert, show: false })}
          severity={alert.severity}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
        </Box>
      </Fade>
    </Box>
  );
};

export default AdminInspection;
