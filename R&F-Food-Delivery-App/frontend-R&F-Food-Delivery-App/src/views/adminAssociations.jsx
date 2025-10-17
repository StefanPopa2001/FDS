import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  OutlinedInput,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

const AdminAssociations = () => {
  const [associations, setAssociations] = useState([]);
  const [plats, setPlats] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    platId: "",
    isTag: "",
    hasOnTags: [],
  });

  // Fetch all data
  useEffect(() => {
    fetchAssociations();
    fetchPlats();
    fetchTags();
  }, []);

  const fetchAssociations = async () => {
    try {
      const response = await fetch("/admin/associations");
      const data = await response.json();
      setAssociations(data);
    } catch (error) {
      console.error("Error fetching associations:", error);
    }
  };

  const fetchPlats = async () => {
    try {
      const response = await fetch("/plats");
      const data = await response.json();
      setPlats(data);
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

  const handleOpenDialog = (association = null) => {
    if (association) {
      setEditingId(association.id);
      setFormData({
        platId: association.platId,
        isTag: association.isTagId,
        hasOnTags: association.hasOnTagIds || [],
      });
    } else {
      setEditingId(null);
      setFormData({
        platId: "",
        isTag: "",
        hasOnTags: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
    setFormData({
      platId: "",
      isTag: "",
      hasOnTags: [],
    });
  };

  const handleSave = async () => {
    if (!formData.platId || !formData.isTag) {
      alert("Veuillez remplir Plat et le tag 'Is'");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        // Update
        await fetch(`/admin/associations/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        // Create
        await fetch("/admin/associations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      handleCloseDialog();
      fetchAssociations();
    } catch (error) {
      console.error("Error saving association:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette association?")) {
      try {
        setLoading(true);
        await fetch(`/admin/associations/${id}`, {
          method: "DELETE",
        });
        fetchAssociations();
      } catch (error) {
        console.error("Error deleting association:", error);
        alert("Erreur lors de la suppression");
      } finally {
        setLoading(false);
      }
    }
  };

  const getTagName = (tagId) => {
    const tag = tags.find((t) => t.id === tagId);
    return tag ? tag.nom : "Unknown";
  };

  const getPlatName = (platId) => {
    const plat = plats.find((p) => p.id === platId);
    return plat ? plat.nom : "Unknown";
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Gestion des Associations Plat-Tag</h1>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nouvelle Association
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: "bold" }}>Plat</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Tag 'Is' (Type)</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Tags 'HasOn' (Peut avoir sur soi)</TableCell>
              <TableCell sx={{ fontWeight: "bold" }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {associations.map((association) => (
              <TableRow key={association.id} hover>
                <TableCell>{getPlatName(association.platId)}</TableCell>
                <TableCell>
                  <Chip
                    label={getTagName(association.isTagId)}
                    variant="outlined"
                    color="primary"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {association.hasOnTagIds?.map((tagId) => (
                      <Chip
                        key={tagId}
                        label={getTagName(tagId)}
                        size="small"
                        variant="filled"
                        color="secondary"
                      />
                    ))}
                    {(!association.hasOnTagIds || association.hasOnTagIds.length === 0) && (
                      <span style={{ color: "#999", fontStyle: "italic" }}>Aucun tag</span>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenDialog(association)}
                    sx={{ mr: 1 }}
                  >
                    Modifier
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(association.id)}
                  >
                    Supprimer
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog for Create/Edit */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Modifier l'association" : "Nouvelle association"}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Plat</InputLabel>
            <Select
              value={formData.platId}
              onChange={(e) => setFormData({ ...formData, platId: e.target.value })}
              label="Plat"
              disabled={editingId !== null}
            >
              {plats.map((plat) => (
                <MenuItem key={plat.id} value={plat.id}>
                  {plat.nom}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Tag 'Is' (Type du plat)</InputLabel>
            <Select
              value={formData.isTag}
              onChange={(e) => setFormData({ ...formData, isTag: e.target.value })}
              label="Tag 'Is' (Type du plat)"
            >
              {tags.map((tag) => (
                <MenuItem key={tag.id} value={tag.id}>
                  {tag.nom}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Tags 'HasOn' (Peut avoir sur soi)</InputLabel>
            <Select
              multiple
              value={formData.hasOnTags}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hasOnTags: typeof e.target.value === "string"
                    ? e.target.value.split(",")
                    : e.target.value,
                })
              }
              input={<OutlinedInput label="Tags 'HasOn' (Peut avoir sur soi)" />}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((tagId) => (
                    <Chip
                      key={tagId}
                      label={getTagName(tagId)}
                      size="small"
                      color="secondary"
                      variant="filled"
                    />
                  ))}
                </Box>
              )}
            >
              {tags.map((tag) => (
                <MenuItem key={tag.id} value={tag.id}>
                  {tag.nom}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={loading}
          >
            {editingId ? "Mettre à jour" : "Créer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminAssociations;
