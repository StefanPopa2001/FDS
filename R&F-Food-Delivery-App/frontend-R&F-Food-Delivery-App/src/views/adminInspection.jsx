import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Grid,
  IconButton,
  Switch,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import AddIcon from "@mui/icons-material/Add";
import config from "../config";

const AdminInspection = () => {
  const [plats, setPlats] = useState([]);
  const [tags, setTags] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState(null);
  const [editingPlat, setEditingPlat] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [platToDelete, setPlatToDelete] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch plats and tags
  useEffect(() => {
    fetchPlats();
    fetchTags();
  }, []);

  const fetchPlats = async () => {
    try {
      const response = await fetch("/plats");
      const data = await response.json();
      // Sort by name alphabetically
      const sorted = data.sort((a, b) => (a.nom || a.name).localeCompare(b.nom || b.name));
      setPlats(sorted);
    } catch (error) {
      console.error("Error fetching plats:", error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch("/tags");
      const data = await response.json();
      setTags(data);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  // Filter plats based on search term and tag filter
  const filteredPlats = useMemo(() => {
    let filtered = plats;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(p =>
        (p.nom || p.name).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply tag filter
    if (selectedTagFilter) {
      if (selectedTagFilter === "NO_TAG") {
        // Show plats with no "is" tag association
        filtered = filtered.filter(p => {
          const hasIsTag = (p.tags || []).some(t => t.id === p._isTagId);
          return !hasIsTag;
        });
      } else {
        // Show plats with the selected tag as "is" tag
        filtered = filtered.filter(p => {
          return (p.tags || []).some(t => t.id === selectedTagFilter);
        });
      }
    }

    return filtered;
  }, [plats, searchTerm, selectedTagFilter]);

  // Handle navigation
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredPlats.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setCurrentIndex(0);
  };

  // Handle tag filter
  const handleTagFilter = (e) => {
    setSelectedTagFilter(e.target.value);
    setCurrentIndex(0);
  };

  // Handle edit plat
  const handleEditClick = (plat) => {
    setEditingPlat({ ...plat });
    setOpenEditDialog(true);
  };

  // Handle save plat
  const handleSavePlat = async () => {
    if (!editingPlat) return;

    try {
      setLoading(true);
      const response = await fetch(`/plats/${editingPlat.id}`, {
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
      } else {
        alert("Erreur lors de la sauvegarde");
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
      const response = await fetch(`/plats/${platToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setOpenDeleteDialog(false);
        setPlatToDelete(null);
        fetchPlats();
        setCurrentIndex(Math.max(0, currentIndex - 1));
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting plat:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  const currentPlat = filteredPlats[currentIndex];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        📋 Inspection Menu
      </Typography>

      {/* Search and Filter Bar */}
      <Paper sx={{ p: 2, mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <TextField
          label="Rechercher un plat..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearch}
          sx={{ flex: 1, minWidth: 250 }}
        />
        <FormControl sx={{ minWidth: 250 }}>
          <InputLabel>Filtrer par tag</InputLabel>
          <Select
            value={selectedTagFilter || ""}
            onChange={handleTagFilter}
            label="Filtrer par tag"
            size="small"
          >
            <MenuItem value="">Tous les plats</MenuItem>
            <MenuItem value="NO_TAG">❌ Sans tag "Is" attribué</MenuItem>
            {tags.map(tag => (
              <MenuItem key={tag.id} value={tag.id}>
                {tag.emoji ? `${tag.emoji} ` : ""}{tag.nom}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography sx={{ alignSelf: "center", fontWeight: "bold" }}>
          {filteredPlats.length} plat{filteredPlats.length !== 1 ? "s" : ""} trouvé{filteredPlats.length !== 1 ? "s" : ""}
        </Typography>
      </Paper>

      {filteredPlats.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary">
            Aucun plat trouvé
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Plat Display and Edit */}
          <Grid container spacing={3}>
            {/* Navigation and Display */}
            <Grid item xs={12} md={8}>
              <Card sx={{ height: "100%" }}>
                {/* Image Section */}
                <Box sx={{ position: "relative", overflow: "hidden" }}>
                  {currentPlat?.image ? (
                    <CardMedia
                      component="img"
                      height="400"
                      image={
                        currentPlat.image.startsWith("http")
                          ? currentPlat.image
                          : `${config.API_URL}${currentPlat.image}`
                      }
                      alt={currentPlat.nom || currentPlat.name}
                      sx={{ objectFit: "cover" }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 400,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f5f5f5",
                      }}
                    >
                      <Typography color="text.secondary">Pas d'image</Typography>
                    </Box>
                  )}

                  {/* Navigation Arrows */}
                  <IconButton
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    sx={{
                      position: "absolute",
                      left: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      backgroundColor: "rgba(255,255,255,0.8)",
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.95)" },
                    }}
                  >
                    <NavigateBeforeIcon />
                  </IconButton>
                  <IconButton
                    onClick={handleNext}
                    disabled={currentIndex === filteredPlats.length - 1}
                    sx={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      backgroundColor: "rgba(255,255,255,0.8)",
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.95)" },
                    }}
                  >
                    <NavigateNextIcon />
                  </IconButton>
                </Box>

                {/* Info Section */}
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
                      {currentPlat?.nom || currentPlat?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {currentPlat?.description}
                    </Typography>
                  </Box>

                  {/* Price and Availability */}
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      mb: 2,
                      p: 1,
                      backgroundColor: "rgba(255, 152, 0, 0.1)",
                      borderRadius: 1,
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Prix
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        {(currentPlat?.price || currentPlat?.basePrice)?.toFixed(2) || "N/A"}€
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Disponibilité
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: "bold",
                          color: currentPlat?.available !== false ? "#4caf50" : "#f44336",
                        }}
                      >
                        {currentPlat?.available !== false ? "✓ Disponible" : "✗ Indisponible"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Tags Section */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                      Tags attachés:
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {currentPlat?.tags && currentPlat.tags.length > 0 ? (
                        currentPlat.tags.map(tag => (
                          <Chip
                            key={tag.id}
                            label={`${tag.emoji ? tag.emoji + " " : ""}${tag.nom}`}
                            variant="outlined"
                            size="small"
                            color="primary"
                          />
                        ))
                      ) : (
                        <Typography variant="caption" color="error">
                          ⚠️ Aucun tag attribué
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Versions Section */}
                  {currentPlat?.versions && currentPlat.versions.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                        Tailles disponibles:
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {currentPlat.versions.map(version => (
                          <Chip
                            key={version.id}
                            label={`${version.size} (+${version.extraPrice?.toFixed(2) || "0.00"}€)`}
                            variant="filled"
                            size="small"
                            color="secondary"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Ingredients Section */}
                  {currentPlat?.ingredients && currentPlat.ingredients.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                        Composition ({currentPlat.ingredients.length} ingrédients):
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {currentPlat.ingredients.map(ing => (
                          <Chip
                            key={ing.ingredient?.id || ing.id}
                            label={ing.ingredient?.name || ing.name}
                            size="small"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Action Buttons */}
                  <Box sx={{ display: "flex", gap: 1, mt: 3 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<EditIcon />}
                      onClick={() => handleEditClick(currentPlat)}
                      fullWidth
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteClick(currentPlat)}
                    >
                      Supprimer
                    </Button>
                  </Box>

                  {/* Navigation Info */}
                  <Box sx={{ textAlign: "center", mt: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      {currentIndex + 1} / {filteredPlats.length}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Info Sidebar */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, backgroundColor: "rgba(76, 175, 80, 0.05)" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
                  📊 Résumé du plat
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: "500" }}>
                      {currentPlat?.id}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Nombre de versions
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: "500" }}>
                      {currentPlat?.versions?.length || 0}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Nombre d'ingrédients
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: "500" }}>
                      {currentPlat?.ingredients?.length || 0}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Nombre de tags
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: "500", color: (currentPlat?.tags?.length || 0) === 0 ? "#f44336" : "inherit" }}>
                      {currentPlat?.tags?.length || 0} {(currentPlat?.tags?.length || 0) === 0 && "⚠️"}
                    </Typography>
                  </Box>

                  <Box sx={{ p: 1.5, backgroundColor: "rgba(255, 152, 0, 0.1)", borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: "bold", display: "block", mb: 1 }}>
                      💡 Conseil
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Assurez-vous que chaque plat a au moins une tag "Is" attribué dans les associations pour que les suggestions fonctionnent correctement.
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier le plat</DialogTitle>
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
              />
            }
            label="Disponible"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenEditDialog(false)}>Annuler</Button>
          <Button
            onClick={handleSavePlat}
            variant="contained"
            disabled={loading}
          >
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>⚠️ Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le plat <strong>{platToDelete?.nom || platToDelete?.name}</strong> ?
          </Typography>
          <Typography variant="caption" color="error" sx={{ display: "block", mt: 2 }}>
            Cette action ne peut pas être annulée.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteDialog(false)}>Annuler</Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={loading}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminInspection;
