"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Button,
  Snackbar,
  Alert,
  Avatar,
  Checkbox,
  TextField,
  FormControlLabel,
  Typography,
  Paper,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  ListItemText,
} from "@mui/material"
import { DataGrid, GridToolbar } from "@mui/x-data-grid"
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Image as ImageIcon,
  BrokenImage as BrokenImageIcon,
  Restaurant as RestaurantIcon,
} from "@mui/icons-material"
import config from "../config"

export default function AdminSauce() {
  const [sauces, setSauces] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSauce, setEditingSauce] = useState(null)
  const [alert, setAlert] = useState({ show: false, message: "", severity: "success" })
  const [tags, setTags] = useState([])
  const [newSauce, setNewSauce] = useState({
    name: "",
    price: "",
    description: "",
    image: null,
    available: true,
    ordre: "",
    tags: [],
  })

  const [imagePreview, setImagePreview] = useState(null)

  // Image validation function
  const isValidImage = (file) => {
    if (!file) return true // No file is valid
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    return validTypes.includes(file.type)
  }

  const [editMode, setEditMode] = useState({})
  const [editData, setEditData] = useState({})

  const columns = [
    {
      field: "id",
      headerName: "ID",
      width: 70,
      type: "number",
      filterable: true,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: "image",
      headerName: "Aperçu Image",
      width: 200,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) =>
        editMode[params.row.id] ? (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: '100%', height: '100%' }}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Avatar
                variant="rounded"
                src={editData[params.row.id]?.image}
                alt={params.row.name}
                sx={{
                  width: 40,
                  height: 40,
                  border: "2px solid rgba(255, 152, 0, 0.3)",
                  mb: 1
                }}
              >
                {!editData[params.row.id]?.image && <RestaurantIcon sx={{ color: "rgba(255, 152, 0, 0.5)" }} />}
              </Avatar>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Button variant="outlined" component="label" size="small" sx={{ mb: 1 }}>
                  {editImageFiles[params.row.id] ? "Changer Image" : "Télécharger Image"}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleEditImageChange(params.row.id, e.target.files[0])
                      }
                    }}
                  />
                </Button>
                {editData[params.row.id]?.image && (
                  <Button
                    variant="text"
                    color="error"
                    size="small"
                    onClick={() => handleEditImageChange(params.row.id, null)}
                  >
                    Supprimer
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, width: '100%', height: '100%' }}>
            <Avatar
              variant="rounded"
              src={params.value && `${config.API_URL}${params.value}`}
              alt={params.row.name}
              sx={{
                width: 40,
                height: 40,
                border: "2px solid rgba(255, 152, 0, 0.3)",
              }}
            >
              {!params.value && <RestaurantIcon sx={{ color: "rgba(255, 152, 0, 0.5)" }} />}
            </Avatar>
            {params.value ? (
              <ImageIcon color="success" sx={{ fontSize: 16 }} />
            ) : (
              <BrokenImageIcon color="error" sx={{ fontSize: 16 }} />
            )}
          </Box>
        ),
    },
    {
      field: "name",
      headerName: "Nom de la sauce",
      description: "Nom de la sauce",
      flex: 1,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) =>
        editMode[params.row.id] ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            <TextField
              fullWidth
              size="small"
              value={editData[params.row.id]?.name || ""}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  [params.row.id]: { ...editData[params.row.id], name: e.target.value },
                })
              }
              sx={{ textAlign: 'center' }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              width: '100%',
              height: '100%',
              "& .status-indicator": {
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: params.row.available ? "#4caf50" : "#f44336",
              },
            }}
          >
            <div className="status-indicator" />
            <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'center' }}>
              {params.value}
            </Typography>
          </Box>
        ),
    },
    {
      field: "price",
      headerName: "Prix (€)",
      flex: 1,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) =>
        editMode[params.row.id] ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            <TextField
              type="number"
              size="small"
              fullWidth
              value={editData[params.row.id]?.price || ""}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  [params.row.id]: { ...editData[params.row.id], price: Number.parseFloat(e.target.value) },
                })
              }
              inputProps={{ style: { textAlign: 'center' } }}
            />
          </Box>
        ) : (
          <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main", width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'center' }}>
            {params.value ? `€${Number(params.value).toFixed(2)}` : ""}
          </Typography>
        ),
    },
    {
      field: "description",
      headerName: "Description",
      flex: 2,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) =>
        editMode[params.row.id] ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            <TextField
              fullWidth
              size="small"
              value={editData[params.row.id]?.description || ""}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  [params.row.id]: { ...editData[params.row.id], description: e.target.value },
                })
              }
              inputProps={{ style: { textAlign: 'center' } }}
            />
          </Box>
        ) : (
          <Typography variant="body2" sx={{ color: "text.secondary", width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'center' }}>
            {params.value}
          </Typography>
        ),
    },
    {
      field: "available",
      headerName: "Disponible",
      width: 120,
      type: "boolean",
      editable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Checkbox
            checked={Boolean(params.value)}
            onChange={() => handleToggleAvailable(params.row.id, !params.value)}
            color={params.value ? "success" : "error"}
            sx={{ '& .MuiSvgIcon-root': { fontSize: 24 } }}
          />
        </Box>
      ),
    },
    {
      field: "ordre",
      headerName: "Ordre",
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) =>
        editMode[params.row.id] ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            <TextField
              size="small"
              fullWidth
              value={editData[params.row.id]?.ordre || ""}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  [params.row.id]: { ...editData[params.row.id], ordre: e.target.value },
                })
              }
              inputProps={{ style: { textAlign: 'center' } }}
            />
          </Box>
        ) : (
          <Typography variant="body2" sx={{ color: "text.secondary", width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'center' }}>
            {params.value || "-"}
          </Typography>
        ),
    },
    {
      field: "tags",
      headerName: "Tags",
      width: 200,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) =>
        editMode[params.row.id] ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Tags</InputLabel>
              <Select
                multiple
                value={editData[params.row.id]?.tags?.map((tag) => tag.id) || []}
                onChange={(e) => {
                  const selectedTagIds = e.target.value
                  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id))
                  setEditData({
                    ...editData,
                    [params.row.id]: { ...editData[params.row.id], tags: selectedTags },
                  })
                }}
                input={<OutlinedInput label="Tags" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((tagId) => {
                      const tag = tags.find((t) => t.id === tagId)
                      return (
                        <Chip
                          key={tagId}
                          label={tag ? `${tag.emoji} ${tag.nom}` : tagId}
                          size="small"
                          sx={{
                            backgroundColor: "rgba(255, 152, 0, 0.2)",
                            color: "#ff9800",
                          }}
                        />
                      )
                    })}
                  </Box>
                )}
              >
                {tags.map((tag) => (
                  <MenuItem key={tag.id} value={tag.id}>
                    <Checkbox
                      checked={
                        (editData[params.row.id]?.tags?.map((tag) => tag.id) || []).indexOf(tag.id) > -1
                      }
                    />
                    <ListItemText primary={`${tag.emoji} ${tag.nom}`} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
            {(params.value || []).map((tag) => (
              <Chip
                key={tag.id}
                label={`${tag.emoji} ${tag.nom}`}
                size="small"
                sx={{
                  backgroundColor: "rgba(255, 152, 0, 0.2)",
                  color: "#ff9800",
                  fontWeight: 600,
                }}
              />
            ))}
          </Box>
        ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1, justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
          {editMode[params.row.id] ? (
            <>
              <Button
                size="small"
                color="primary"
                onClick={() => handleEditSave(params.row.id)}
                sx={{ minWidth: "auto", p: 1 }}
              >
                <SaveIcon />
              </Button>
              <Button
                size="small"
                color="error"
                onClick={() => handleEditCancel(params.row.id)}
                sx={{ minWidth: "auto", p: 1 }}
              >
                <CancelIcon />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="small"
                color="primary"
                onClick={() => handleEditClick(params.row)}
                sx={{ minWidth: "auto", p: 1 }}
              >
                <EditIcon />
              </Button>
              <Button
                size="small"
                color="error"
                onClick={() => handleDelete(params.row.id)}
                sx={{ minWidth: "auto", p: 1 }}
              >
                <DeleteIcon />
              </Button>
            </>
          )}
        </Box>
      ),
    },
  ]

  // Fetch sauces
  const fetchSauces = async () => {
    try {
      const response = await fetch(`${config.API_URL}/sauces`)
      if (response.ok) {
        const data = await response.json()
        // Convert id to number to ensure proper sorting
        const processedData = data.map((sauce) => ({
          ...sauce,
          id: Number(sauce.id),
        }))
        setSauces(processedData)
      }
    } catch (error) {
      showAlert("Échec du chargement des sauces", "error")
    }
  }

  // Fetch tags
  const fetchTags = async () => {
    try {
      const response = await fetch(`${config.API_URL}/tags`)
      if (response.ok) {
        const data = await response.json()
        setTags(data)
      }
    } catch (error) {
      showAlert("Échec du chargement des tags", "error")
    }
  }

  useEffect(() => {
    fetchSauces()
    fetchTags()
  }, [])

  // Show alert helper
  const showAlert = (message, severity = "success") => {
    setAlert({ show: true, message, severity })
  }

  // Handle image upload for new sauce
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check if file is a valid image
      if (isValidImage(file)) {
        setNewSauce({ ...newSauce, image: file })

        // Create a preview URL
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreview(reader.result)
        }
        reader.readAsDataURL(file)
      } else {
        showAlert("Veuillez télécharger un fichier image valide (JPEG, PNG, GIF, WEBP)", "error")
        e.target.value = null // Reset the input
      }
    }
  }

  // Handle removing image
  const handleRemoveImage = () => {
    setNewSauce({ ...newSauce, image: null })
    setImagePreview(null)
  }

  // Handle delete
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${config.API_URL}/sauces/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchSauces()
        showAlert("Sauce supprimée avec succès")
      } else {
        showAlert("Échec de la suppression de la sauce", "error")
      }
    } catch (error) {
      showAlert("Échec de la suppression de la sauce", "error")
    }
  }

  // Handle new sauce submit
  const handleNewSauceSubmit = async () => {
    try {
      // Create a FormData object for file upload
      const formData = new FormData()
      formData.append("name", newSauce.name)
      formData.append("price", newSauce.price)
      formData.append("description", newSauce.description)
      formData.append("available", newSauce.available)
      formData.append("ordre", newSauce.ordre || "")
      
      // Add tags to formData
      if (newSauce.tags && newSauce.tags.length > 0) {
        formData.append("tags", JSON.stringify(newSauce.tags))
      }

      // Only append the image if it exists
      if (newSauce.image) {
        formData.append("image", newSauce.image)
      }

      const response = await fetch(`${config.API_URL}/sauces`, {
        method: "POST",
        body: formData,
        // Don't set Content-Type header, it will be set automatically with the boundary parameter
      })

      if (response.ok) {
        setNewSauce({
          name: "",
          price: "",
          description: "",
          image: null,
          available: true,
          ordre: "",
          tags: [],
        })
        setImagePreview(null)
        fetchSauces()
        showAlert("Sauce ajoutée avec succès")
      } else {
        const errorData = await response.json()
        showAlert(errorData.error || "Échec de l'ajout de la sauce", "error")
      }
    } catch (error) {
      console.error("Add sauce error:", error)
      showAlert("Échec de l'ajout de la sauce", "error")
    }
  }

  // Quick edit for switches
  const handleQuickEdit = async (id, updates) => {
    try {
      const sauce = sauces.find((s) => s.id === id)

      // For quick edits (toggle switches), create FormData to maintain consistency
      const formData = new FormData()
      
      // Add all existing sauce data
      Object.keys(sauce).forEach((key) => {
        if (key !== "image" && key !== "tags" && key !== "id") {
          formData.append(key, sauce[key])
        }
      })
      
      // Add the updates
      Object.keys(updates).forEach((key) => {
        formData.append(key, updates[key])
      })
      
      // Handle existing tags
      if (sauce.tags && sauce.tags.length > 0) {
        const tagIds = sauce.tags.map(tag => tag.id)
        formData.append("tags", JSON.stringify(tagIds))
      }
      
      // Tell backend to keep existing image
      formData.append("keepExistingImage", "true")

      const response = await fetch(`${config.API_URL}/sauces/${id}`, {
        method: "PUT",
        body: formData,
      })

      if (response.ok) {
        fetchSauces()
        showAlert("Sauce mise à jour avec succès")
      } else {
        const error = await response.json()
        showAlert(error.error || "Échec de la mise à jour de la sauce", "error")
      }
    } catch (error) {
      console.error("Quick edit error:", error)
      showAlert("Échec de la mise à jour de la sauce", "error")
    }
  }

  // Handle toggling sauce availability status
  const handleToggleAvailable = async (id, available) => {
    try {
      // Create FormData object for the update
      const formData = new FormData();
      
      // Set the new availability value (convert to string to ensure proper transmission)
      formData.append("available", String(available));
      
      // Keep the existing image
      formData.append("keepExistingImage", "true");
      
      // Get the existing sauce data
      const sauce = sauces.find(s => s.id === id);
      if (!sauce) {
        showAlert("Sauce introuvable", "error");
        return;
      }
      
      // Add all required fields to avoid validation errors
      formData.append("name", sauce.name);
      formData.append("price", sauce.price);
      formData.append("description", sauce.description);
      if (sauce.ordre) formData.append("ordre", sauce.ordre);
      
      // Add tags if they exist
      if (sauce.tags && sauce.tags.length > 0) {
        const tagIds = sauce.tags.map(tag => tag.id);
        formData.append("tags", JSON.stringify(tagIds));
      }

      // Update the sauce
      const response = await fetch(`${config.API_URL}/sauces/${id}`, {
        method: "PUT",
        body: formData,
      });

      if (response.ok) {
        // Update the UI immediately to avoid flicker
        setSauces(
          sauces.map(s => 
            s.id === id ? { ...s, available: available } : s
          )
        );
        
        // Show success feedback
        showAlert(available ? "Sauce rendue disponible" : "Sauce rendue indisponible", "success");
        
        // Then fetch the updated data from server
        fetchSauces();
      } else {
        const error = await response.json();
        showAlert(error.error || "Échec de la mise à jour du statut", "error");
      }
    } catch (error) {
      console.error("Toggle available error:", error);
      showAlert("Erreur lors de la mise à jour du statut", "error");
    }
  };

  // State to store uploaded image files for edit mode
  const [editImageFiles, setEditImageFiles] = useState({})

  // Handle edit mode
  const handleEditClick = (sauce) => {
    setEditMode({ ...editMode, [sauce.id]: true })
    setEditData({ ...editData, [sauce.id]: { ...sauce } })
    setEditImageFiles({ ...editImageFiles, [sauce.id]: null })
  }

  // Handle edit cancel
  const handleEditCancel = (id) => {
    setEditMode({ ...editMode, [id]: false })
    delete editData[id]
    delete editImageFiles[id]
    setEditImageFiles({ ...editImageFiles })
  }

  // Handle edit save
  const handleEditSave = async (id) => {
    try {
      // Create FormData for file upload
      const formData = new FormData()

      // Add all sauce data
      Object.keys(editData[id]).forEach((key) => {
        if (key !== "image" && key !== "tags") {
          formData.append(key, editData[id][key])
        }
      })

      // Handle tags separately - send as JSON array of tag IDs only
      if (editData[id].tags) {
        const tagIds = editData[id].tags.map((tag) => tag.id)
        formData.append("tags", JSON.stringify(tagIds))
      } else {
        formData.append("tags", JSON.stringify([]))
      }

      // Add the new image file if it exists
      if (editImageFiles[id]) {
        formData.append("image", editImageFiles[id])
      } else {
        // Tell the backend to keep existing image
        formData.append("keepExistingImage", String(editData[id].image !== null))
      }

      const response = await fetch(`${config.API_URL}/sauces/${id}`, {
        method: "PUT",
        body: formData,
      })

      if (response.ok) {
        setEditMode({ ...editMode, [id]: false })
        delete editData[id]
        delete editImageFiles[id]
        fetchSauces()
        showAlert("Sauce mise à jour avec succès")
      } else {
        const error = await response.json()
        showAlert(error.error || "Échec de la mise à jour de la sauce", "error")
      }
    } catch (error) {
      console.error("Edit save error:", error)
      showAlert("Échec de la mise à jour de la sauce", "error")
    }
  }

  // Handle image file selection for edit
  const handleEditImageChange = (id, file) => {
    if (file) {
      setEditImageFiles({
        ...editImageFiles,
        [id]: file,
      })

      // Create a preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditData({
          ...editData,
          [id]: { ...editData[id], image: reader.result },
        })
      }
      reader.readAsDataURL(file)
    } else {
      // User removed the image
      setEditImageFiles({
        ...editImageFiles,
        [id]: null,
      })
      setEditData({
        ...editData,
        [id]: { ...editData[id], image: null },
      })
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Fade in timeout={800}>
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
          Gestion des sauces
        </Typography>
       </Fade>

        {/* Add new sauce form */}
        <Fade in timeout={1000}>
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              p: 3,
              borderRadius: 3,
              background: "rgba(26, 26, 26, 0.8)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, color: "primary.main", fontWeight: 700 }}>
              Ajouter une nouvelle sauce
            </Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "nowrap" }}>
              <TextField
                size="small"
                label="Nom"
                value={newSauce.name}
                onChange={(e) => setNewSauce({ ...newSauce, name: e.target.value })}
                sx={{ width: '15%' }}
              />
              <TextField
                size="small"
                type="number"
                label="Prix (€)"
                value={newSauce.price}
                onChange={(e) => setNewSauce({ ...newSauce, price: e.target.value })}
                inputProps={{ step: "0.01" }}
                sx={{ width: '8%' }}
              />
              <TextField
                size="small"
                label="Description"
                value={newSauce.description}
                onChange={(e) => setNewSauce({ ...newSauce, description: e.target.value })}
                sx={{ width: '25%' }}
              />
              
              <Button 
                variant="outlined" 
                component="label" 
                startIcon={<ImageIcon />} 
                size="small"
                sx={{ height: '40px' }}
              >
                {imagePreview ? "Changer Image" : "Télécharger Image"}
                <input type="file" hidden accept="image/*" onChange={handleImageChange} />
              </Button>
              
              {imagePreview && (
                <Avatar
                  src={imagePreview}
                  variant="rounded"
                  sx={{
                    width: 36,
                    height: 36,
                    border: "2px solid rgba(255, 152, 0, 0.3)",
                  }}
                />
              )}
              
              <FormControl size="small" sx={{ width: '15%' }}>
                <InputLabel>Tags</InputLabel>
                <Select
                  multiple
                  value={newSauce.tags}
                  onChange={(e) => setNewSauce({ ...newSauce, tags: e.target.value })}
                  input={<OutlinedInput label="Tags" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((tagId) => {
                        const tag = tags.find((t) => t.id === tagId)
                        return (
                          <Chip
                            key={tagId}
                            label={tag ? `${tag.emoji} ${tag.nom}` : tagId}
                            size="small"
                            sx={{
                              backgroundColor: "rgba(255, 152, 0, 0.2)",
                              color: "#ff9800",
                            }}
                          />
                        )
                      })}
                    </Box>
                  )}
                >
                  {tags.map((tag) => (
                    <MenuItem key={tag.id} value={tag.id}>
                      <Checkbox checked={newSauce.tags.indexOf(tag.id) > -1} />
                      <ListItemText primary={`${tag.emoji} ${tag.nom}`} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newSauce.available}
                    onChange={(e) => setNewSauce({ ...newSauce, available: e.target.checked })}
                    color="primary"
                  />
                }
                label="Disponible"
                sx={{ mx: 0.5 }}
              />
              
              <TextField
                label="Ordre"
                value={newSauce.ordre}
                onChange={(e) => setNewSauce({ ...newSauce, ordre: e.target.value })}
                variant="outlined"
                size="small"
                sx={{ width: '8%' }}
                placeholder="Ordre"
              />
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNewSauceSubmit}
                disabled={!newSauce.name || !newSauce.price || !newSauce.description}
                sx={{
                  background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
                  "&:hover": {
                    background: "linear-gradient(45deg, #f57c00 30%, #ff9800 90%)",
                  },
                  height: '40px',
                  ml: 'auto'
                }}
              >
                Ajouter
              </Button>
            </Box>
          </Paper>
        </Fade>

        <Fade in timeout={1200}>
          <Paper
            elevation={0}
            sx={{
              height: "calc(100vh - 350px)",
              width: "100%",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <DataGrid
              rows={sauces}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50, 100]}
              checkboxSelection
              disableSelectionOnClick
              getRowClassName={(params) =>
                !params.row.available ? "unavailable-row" : ""
              }
              components={{ Toolbar: GridToolbar }}
              componentsProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 500 },
                  csvOptions: {
                    fileName: `sauces-export-${new Date().toISOString().split("T")[0]}`,
                    utf8WithBom: true,
                  },
                },
              }}
              density="comfortable"
              sx={{
                height: "100%",
                "& .unavailable-row": {
                  backgroundColor: "rgba(255, 0, 0, 0.1)",
                },
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "rgba(255, 152, 0, 0.08)",
                },
                "& .MuiDataGrid-toolbarContainer": {
                  backgroundColor: "rgba(255, 152, 0, 0.05)",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                },
              }}
              initialState={{
                sorting: {
                  sortModel: [{ field: "name", sort: "asc" }],
                },
                columns: {
                  columnVisibilityModel: {},
                },
              }}
              localeText={{
                toolbarDensity: "Taille des lignes",
                toolbarDensityLabel: "Taille des lignes",
                toolbarDensityCompact: "Compact",
                toolbarDensityStandard: "Standard",
                toolbarDensityComfortable: "Confortable",
                toolbarExport: "Exporter",
                toolbarExportLabel: "Exporter",
                toolbarExportCSV: "Télécharger en CSV",
                toolbarExportPrint: "Imprimer",
                toolbarColumns: "Colonnes",
                toolbarColumnsLabel: "Sélectionner les colonnes",
                toolbarFilters: "Filtres",
                toolbarFiltersLabel: "Afficher les filtres",
                toolbarQuickFilterPlaceholder: "Rechercher...",
              }}
            />
          </Paper>
        </Fade>

        {/* Alert Snackbar */}
        <Snackbar open={alert.show} autoHideDuration={6000} onClose={() => setAlert({ ...alert, show: false })}>
          <Alert
            severity={alert.severity}
            onClose={() => setAlert({ ...alert, show: false })}
            sx={{
              backgroundColor: alert.severity === "success" ? "rgba(76, 175, 80, 0.1)" : "rgba(244, 67, 54, 0.1)",
              border: `1px solid ${alert.severity === "success" ? "#4caf50" : "#f44336"}`,
            }}
          >
            {alert.message}
          </Alert>
        </Snackbar>
    </Box>
  )
}
