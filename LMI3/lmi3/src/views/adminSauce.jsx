"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Button,
  Snackbar,
  Alert,
  ThemeProvider,
  createTheme,
  Avatar,
  Checkbox,
  TextField,
  FormControlLabel,
  Typography,
  Paper,
  Fade,
  CssBaseline,
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

// Create dark theme with black/orange design
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
    success: {
      main: "#4caf50",
    },
    error: {
      main: "#f44336",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h6: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          background: "linear-gradient(145deg, rgba(26, 26, 26, 0.9), rgba(20, 20, 20, 0.9))",
          backdropFilter: "blur(10px)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: "none",
          fontWeight: 600,
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
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            "&:hover fieldset": {
              borderColor: "#ff9800",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#ff9800",
            },
          },
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          "& .MuiDataGrid-cell": {
            borderColor: "rgba(255, 255, 255, 0.08)",
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "rgba(255, 152, 0, 0.1)",
            borderColor: "rgba(255, 255, 255, 0.08)",
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 700,
            color: "#ff9800",
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: "rgba(255, 152, 0, 0.7)",
          "&.Mui-checked": {
            color: "#ff9800",
          },
        },
      },
    },
  },
})

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
    availableForDelivery: true,
    speciality: false,
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
    },
    {
      field: "image",
      headerName: "Aperçu Image",
      width: 200,
      renderCell: (params) =>
        editMode[params.row.id] ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar
              variant="rounded"
              src={editData[params.row.id]?.image}
              alt={params.row.name}
              sx={{
                width: 40,
                height: 40,
                border: "2px solid rgba(255, 152, 0, 0.3)",
              }}
            >
              {!editData[params.row.id]?.image && <RestaurantIcon sx={{ color: "rgba(255, 152, 0, 0.5)" }} />}
            </Avatar>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
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
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar
              variant="rounded"
              src={params.value && `http://localhost:3001${params.value}`}
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
      renderCell: (params) =>
        editMode[params.row.id] ? (
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
          />
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              "& .status-indicator": {
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: params.row.available ? "#4caf50" : "#f44336",
              },
            }}
          >
            <div className="status-indicator" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {params.value}
            </Typography>
          </Box>
        ),
    },
    {
      field: "price",
      headerName: "Prix (€)",
      flex: 1,
      renderCell: (params) =>
        editMode[params.row.id] ? (
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
          />
        ) : (
          <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
            {params.value ? `€${Number(params.value).toFixed(2)}` : ""}
          </Typography>
        ),
    },
    {
      field: "description",
      headerName: "Description",
      flex: 2,
      renderCell: (params) =>
        editMode[params.row.id] ? (
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
          />
        ) : (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {params.value}
          </Typography>
        ),
    },
    {
      field: "available",
      headerName: "Disponible",
      width: 120,
      type: "boolean",
      editable: true,
      renderCell: (params) => (
        <FormControlLabel
          control={
            <Checkbox
              checked={editMode[params.row.id] ? editData[params.row.id]?.available : params.value}
              onChange={(e) => {
                if (editMode[params.row.id]) {
                  setEditData({
                    ...editData,
                    [params.row.id]: { ...editData[params.row.id], available: e.target.checked },
                  })
                } else {
                  handleQuickEdit(params.row.id, { available: e.target.checked })
                }
              }}
              color="primary"
            />
          }
          label="Disponible"
        />
      ),
    },
    {
      field: "availableForDelivery",
      headerName: "Livraison",
      width: 120,
      type: "boolean",
      renderCell: (params) => (
        <FormControlLabel
          control={
            <Checkbox
              checked={editMode[params.row.id] ? editData[params.row.id]?.availableForDelivery : params.value}
              onChange={(e) => {
                if (editMode[params.row.id]) {
                  setEditData({
                    ...editData,
                    [params.row.id]: { ...editData[params.row.id], availableForDelivery: e.target.checked },
                  })
                } else {
                  handleQuickEdit(params.row.id, { availableForDelivery: e.target.checked })
                }
              }}
              color="primary"
            />
          }
          label="Livraison"
        />
      ),
    },
    {
      field: "speciality",
      headerName: "Spécialité",
      width: 120,
      type: "boolean",
      renderCell: (params) => (
        <FormControlLabel
          control={
            <Checkbox
              checked={editMode[params.row.id] ? editData[params.row.id]?.speciality : params.value}
              onChange={(e) => {
                if (editMode[params.row.id]) {
                  setEditData({
                    ...editData,
                    [params.row.id]: { ...editData[params.row.id], speciality: e.target.checked },
                  })
                } else {
                  handleQuickEdit(params.row.id, { speciality: e.target.checked })
                }
              }}
              color="primary"
            />
          }
          label="Spécialité"
        />
      ),
    },
    {
      field: "tags",
      headerName: "Tags",
      width: 200,
      renderCell: (params) =>
        editMode[params.row.id] ? (
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
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
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
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
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
      const response = await fetch("http://localhost:3001/sauces")
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
      const response = await fetch("http://localhost:3001/tags")
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
      const response = await fetch(`http://localhost:3001/sauces/${id}`, {
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
      formData.append("availableForDelivery", newSauce.availableForDelivery)
      formData.append("speciality", newSauce.speciality)
      
      // Add tags to formData
      if (newSauce.tags && newSauce.tags.length > 0) {
        formData.append("tags", JSON.stringify(newSauce.tags))
      }

      // Only append the image if it exists
      if (newSauce.image) {
        formData.append("image", newSauce.image)
      }

      const response = await fetch("http://localhost:3001/sauces", {
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
          availableForDelivery: true,
          speciality: false,
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

      const response = await fetch(`http://localhost:3001/sauces/${id}`, {
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

      const response = await fetch(`http://localhost:3001/sauces/${id}`, {
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
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
          p: 3,
        }}
      >
        <Fade in timeout={800}>
          <Typography
            variant="h6"
            component="h1"
            sx={{
              fontWeight: 600,
              color: "text.primary",
              mb: 3,
            }}
          >
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
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
              <TextField
                size="small"
                label="Nom"
                value={newSauce.name}
                onChange={(e) => setNewSauce({ ...newSauce, name: e.target.value })}
              />
              <TextField
                size="small"
                type="number"
                label="Prix (€)"
                value={newSauce.price}
                onChange={(e) => setNewSauce({ ...newSauce, price: e.target.value })}
                inputProps={{ step: "0.01" }}
              />
              <TextField
                size="small"
                label="Description"
                value={newSauce.description}
                onChange={(e) => setNewSauce({ ...newSauce, description: e.target.value })}
                sx={{ flexGrow: 1 }}
              />
              <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Button variant="outlined" component="label" startIcon={<ImageIcon />} size="small">
                    Télécharger Image
                    <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                  </Button>
                  {imagePreview && (
                    <Button variant="text" color="error" size="small" onClick={handleRemoveImage}>
                      Supprimer
                    </Button>
                  )}
                </Box>
                {imagePreview && (
                  <Box sx={{ mt: 1, display: "flex", alignItems: "center" }}>
                    <Avatar
                      src={imagePreview}
                      variant="rounded"
                      sx={{
                        width: 40,
                        height: 40,
                        mr: 1,
                        border: "2px solid rgba(255, 152, 0, 0.3)",
                      }}
                    />
                  </Box>
                )}
              </Box>
              <FormControl sx={{ minWidth: 200 }} size="small">
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
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newSauce.available}
                      onChange={(e) => setNewSauce({ ...newSauce, available: e.target.checked })}
                      color="primary"
                    />
                  }
                  label="Disponible"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newSauce.availableForDelivery}
                      onChange={(e) => setNewSauce({ ...newSauce, availableForDelivery: e.target.checked })}
                      color="primary"
                    />
                  }
                  label="Livraison"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newSauce.speciality}
                      onChange={(e) => setNewSauce({ ...newSauce, speciality: e.target.checked })}
                      color="primary"
                    />
                  }
                  label="Spécialité"
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
                  }}
                >
                  Ajouter Sauce
                </Button>
              </Box>
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
                !params.row.available ? "unavailable-row" : params.row.speciality ? "speciality-row" : ""
              }
              sx={{
                height: "100%",
                "& .unavailable-row": {
                  backgroundColor: "rgba(255, 0, 0, 0.1)",
                },
                "& .speciality-row": {
                  backgroundColor: "rgba(255, 152, 0, 0.1)",
                },
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "rgba(255, 152, 0, 0.08)",
                },
                "& .MuiDataGrid-toolbarContainer": {
                  backgroundColor: "rgba(255, 152, 0, 0.05)",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                },
              }}
              components={{
                Toolbar: GridToolbar,
              }}
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
    </ThemeProvider>
  )
}
