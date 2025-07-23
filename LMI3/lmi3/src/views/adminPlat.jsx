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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemText,
  Typography,
  Paper,
  Fade,
  CssBaseline,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Fastfood as FastfoodIcon,
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

export default function AdminPlat() {
  const [plats, setPlats] = useState([])
  const [tags, setTags] = useState([]) // Add tags state
  const [ingredients, setIngredients] = useState([]) // Add ingredients state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isIngredientDialogOpen, setIsIngredientDialogOpen] = useState(false) // Add ingredient dialog state
  const [editingPlat, setEditingPlat] = useState(null)
  const [alert, setAlert] = useState({ show: false, message: "", severity: "success" })
  const [newIngredient, setNewIngredient] = useState({ name: "", description: "", allergen: false }) // Add new ingredient state
  const [newPlat, setNewPlat] = useState({
    name: "",
    price: "",
    description: "",
    type: "snack",
    image: null,
    available: true,
    availableForDelivery: true,
    speciality: false,
    IncludesSauce: true,
    saucePrice: "",
    versions: [{ size: "Standard", extraPrice: 0 }],
    selectedTags: [], // Add selected tags to newPlat state
    selectedIngredients: [] // Add selected ingredients to newPlat state
  })

  const [imagePreview, setImagePreview] = useState(null)
  const [editMode, setEditMode] = useState({})
  const [editData, setEditData] = useState({})
  const [editImageFiles, setEditImageFiles] = useState({})

  // Image validation function
  const isValidImage = (file) => {
    if (!file) return true // No file is valid
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    return validTypes.includes(file.type)
  }

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
      renderCell: (params) => (
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
            {!params.value && <FastfoodIcon sx={{ color: "rgba(255, 152, 0, 0.5)" }} />}
          </Avatar>
          {params.value ? (
            <ImageIcon color="success" sx={{ fontSize: 16 }} />
          ) : (
            <BrokenImageIcon color="disabled" sx={{ fontSize: 16 }} />
          )}
        </Box>
      ),
      sortable: false,
      filterable: false,
    },
    {
      field: "name",
      headerName: "Nom",
      width: 200,
      filterable: true,
    },
    {
      field: "description",
      headerName: "Description",
      width: 250,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "price",
      headerName: "Prix de base (€)",
      width: 140,
      type: "number",
      renderCell: (params) => `€${params.value.toFixed(2)}`,
    },
    {
      field: "type",
      headerName: "Type",
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color="primary" variant="outlined" />
      ),
    },
    {
      field: "versions",
      headerName: "Versions",
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {params.value && params.value.length > 0 ? (
            params.value.map((version, index) => (
              <Chip
                key={index}
                label={`${version.size}: +€${version.extraPrice.toFixed(2)}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: "0.75rem" }}
              />
            ))
          ) : (
            <Chip label="Aucune version" size="small" variant="outlined" color="default" />
          )}
        </Box>
      ),
      sortable: false,
      filterable: false,
    },
    {
      field: "ingredients",
      headerName: "Ingrédients",
      width: 250,
      renderCell: (params) => (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {params.value && params.value.length > 0 ? (
            params.value.map((platIngredient, index) => (
              <Chip
                key={index}
                label={`${platIngredient.ingredient.name}${platIngredient.essential ? ' (E)' : ''}${!platIngredient.removable ? ' (NR)' : ''}`}
                size="small"
                variant="outlined"
                color={platIngredient.essential ? 'error' : 'default'}
                sx={{ 
                  fontSize: "0.75rem",
                  backgroundColor: platIngredient.essential ? 'rgba(244, 67, 54, 0.1)' : 'transparent'
                }}
              />
            ))
          ) : (
            <Chip label="Aucun ingrédient" size="small" variant="outlined" color="default" />
          )}
        </Box>
      ),
      sortable: false,
      filterable: false,
    },
    {
      field: "IncludesSauce",
      headerName: "Sauce Incluse",
      width: 120,
      renderCell: (params) => (
        <Checkbox 
          checked={params.value} 
          onChange={(e) => handleCheckboxChange(params.row.id, "IncludesSauce", e.target.checked)}
          sx={{ padding: 0 }} 
        />
      ),
    },
    {
      field: "saucePrice",
      headerName: "Prix Sauce (€)",
      width: 130,
      type: "number",
      renderCell: (params) => `€${params.value.toFixed(2)}`,
    },
    {
      field: "available",
      headerName: "Disponible",
      width: 100,
      renderCell: (params) => (
        <Checkbox 
          checked={params.value} 
          onChange={(e) => handleCheckboxChange(params.row.id, "available", e.target.checked)}
          sx={{ padding: 0 }} 
        />
      ),
    },
    {
      field: "availableForDelivery",
      headerName: "Livraison",
      width: 100,
      renderCell: (params) => (
        <Checkbox 
          checked={params.value} 
          onChange={(e) => handleCheckboxChange(params.row.id, "availableForDelivery", e.target.checked)}
          sx={{ padding: 0 }} 
        />
      ),
    },
    {
      field: "speciality",
      headerName: "Spécialité",
      width: 100,
      renderCell: (params) => (
        <Checkbox 
          checked={params.value} 
          onChange={(e) => handleCheckboxChange(params.row.id, "speciality", e.target.checked)}
          sx={{ padding: 0 }} 
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => openDialog(params.row)}
            sx={{ 
              backgroundColor: "rgba(255, 152, 0, 0.1)",
              "&:hover": { backgroundColor: "rgba(255, 152, 0, 0.2)" }
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.id)}
            sx={{ 
              backgroundColor: "rgba(244, 67, 54, 0.1)",
              "&:hover": { backgroundColor: "rgba(244, 67, 54, 0.2)" }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
      sortable: false,
      filterable: false,
    },
  ]

  // Fetch plats
  const fetchPlats = async () => {
    try {
      const response = await fetch("http://localhost:3001/plats")
      if (response.ok) {
        const data = await response.json()
        setPlats(data)
      } else {
        showAlert("Erreur lors du chargement des plats", "error")
      }
    } catch (error) {
      console.error("Error fetching plats:", error)
      showAlert("Erreur lors du chargement des plats", "error")
    }
  }

  // Fetch tags
  const fetchTags = async () => {
    try {
      const response = await fetch("http://localhost:3001/tags")
      if (response.ok) {
        const data = await response.json()
        setTags(data)
      } else {
        showAlert("Erreur lors du chargement des tags", "error")
      }
    } catch (error) {
      console.error("Error fetching tags:", error)
      showAlert("Erreur lors du chargement des tags", "error")
    }
  }

  // Fetch ingredients
  const fetchIngredients = async () => {
    try {
      const response = await fetch("http://localhost:3001/ingredients")
      if (response.ok) {
        const data = await response.json()
        setIngredients(data)
      } else {
        showAlert("Erreur lors du chargement des ingrédients", "error")
      }
    } catch (error) {
      console.error("Error fetching ingredients:", error)
      showAlert("Erreur lors du chargement des ingrédients", "error")
    }
  }

  useEffect(() => {
    fetchPlats()
    fetchTags()
    fetchIngredients()
  }, [])

  const showAlert = (message, severity = "success") => {
    setAlert({ show: true, message, severity })
  }

  const resetForm = () => {
    setNewPlat({
      name: "",
      price: "",
      description: "",
      type: "snack",
      image: null,
      available: true,
      availableForDelivery: true,
      speciality: false,
      IncludesSauce: true,
      saucePrice: "",
      versions: [{ size: "Standard", extraPrice: 0 }],
      selectedTags: [],
      selectedIngredients: []
    })
    setImagePreview(null)
    setEditingPlat(null)
  }

  const handleTagChange = (event) => {
    const { value } = event.target;
    setNewPlat({ ...newPlat, selectedTags: typeof value === 'string' ? value.split(',') : value });
  }

  const handleIngredientChange = (event) => {
    const { value } = event.target;
    setNewPlat({ ...newPlat, selectedIngredients: typeof value === 'string' ? value.split(',') : value });
  }

  const handleImageChange = (event) => {
    const file = event.target.files[0]
    if (file && isValidImage(file)) {
      setNewPlat({ ...newPlat, image: file })
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target.result)
      reader.readAsDataURL(file)
    } else if (file) {
      showAlert("Format d'image non valide. Utilisez JPEG, PNG, GIF ou WebP.", "error")
    }
  }

  const handleEditImageChange = (id, file) => {
    if (file && !isValidImage(file)) {
      showAlert("Format d'image non valide. Utilisez JPEG, PNG, GIF ou WebP.", "error")
      return
    }

    setEditImageFiles(prev => ({ ...prev, [id]: file }))
    
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        updateEditData(id, "image", e.target.result)
      }
      reader.readAsDataURL(file)
    } else {
      updateEditData(id, "image", null)
    }
  }

  // Handle version changes for new plat
  const handleVersionChange = (index, field, value) => {
    const updatedVersions = [...newPlat.versions]
    updatedVersions[index] = { ...updatedVersions[index], [field]: value }
    setNewPlat({ ...newPlat, versions: updatedVersions })
  }

  const addVersion = () => {
    setNewPlat({
      ...newPlat,
      versions: [...newPlat.versions, { size: "", extraPrice: 0 }]
    })
  }

  const removeVersion = (index) => {
    if (newPlat.versions.length > 1) {
      const updatedVersions = newPlat.versions.filter((_, i) => i !== index)
      setNewPlat({ ...newPlat, versions: updatedVersions })
    }
  }

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:3001/plats/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchPlats()
        showAlert("Plat supprimé avec succès")
      } else {
        showAlert("Erreur lors de la suppression du plat", "error")
      }
    } catch (error) {
      console.error("Error deleting plat:", error)
      showAlert("Erreur lors de la suppression du plat", "error")
    }
  }

  const handleCheckboxChange = async (id, field, value) => {
    try {
      // Find the current plat
      const plat = plats.find(p => p.id === id)
      if (!plat) return

      // Create FormData with current plat data
      const formData = new FormData()
      formData.append("name", plat.name)
      formData.append("price", plat.price)
      formData.append("description", plat.description)
      formData.append("type", plat.type)
      formData.append("available", field === "available" ? value : plat.available)
      formData.append("availableForDelivery", field === "availableForDelivery" ? value : plat.availableForDelivery)
      formData.append("speciality", field === "speciality" ? value : plat.speciality)
      formData.append("IncludesSauce", field === "IncludesSauce" ? value : plat.IncludesSauce)
      formData.append("saucePrice", plat.saucePrice || "0")
      formData.append("versions", JSON.stringify(plat.versions || []))
      formData.append("keepExistingImage", "true")

      const response = await fetch(`http://localhost:3001/plats/${id}`, {
        method: "PUT",
        body: formData,
      })

      if (response.ok) {
        fetchPlats()
        showAlert(`${field === "available" ? "Disponibilité" : field === "availableForDelivery" ? "Livraison" : field === "speciality" ? "Spécialité" : "Sauce incluse"} mise à jour`)
      } else {
        const errorData = await response.json()
        showAlert(errorData.error || "Erreur lors de la mise à jour", "error")
      }
    } catch (error) {
      console.error("Error updating checkbox:", error)
      showAlert("Erreur lors de la mise à jour", "error")
    }
  }

  const handleSubmit = async () => {
    if (!newPlat.name || !newPlat.price || !newPlat.description) {
      showAlert("Veuillez remplir tous les champs obligatoires", "error")
      return
    }

    if (!isValidImage(newPlat.image)) {
      showAlert("Format d'image non valide", "error")
      return
    }

    try {
      const formData = new FormData()
      formData.append("name", newPlat.name)
      formData.append("price", newPlat.price)
      formData.append("description", newPlat.description)
      formData.append("type", newPlat.type)
      formData.append("available", newPlat.available)
      formData.append("availableForDelivery", newPlat.availableForDelivery)
      formData.append("speciality", newPlat.speciality)
      formData.append("IncludesSauce", newPlat.IncludesSauce)
      formData.append("saucePrice", newPlat.saucePrice || "0")
      formData.append("versions", JSON.stringify(newPlat.versions))
      formData.append("tags", JSON.stringify(newPlat.selectedTags))

      if (newPlat.image) {
        formData.append("image", newPlat.image)
      }

      const url = editingPlat ? `http://localhost:3001/plats/${editingPlat.id}` : "http://localhost:3001/plats"
      const method = editingPlat ? "PUT" : "POST"

      const response = await fetch(url, {
        method: method,
        body: formData,
      })

      if (response.ok) {
        const platData = await response.json()
        
        // Handle ingredients separately for both create and update
        if (editingPlat) {
          await updatePlatIngredients(editingPlat.id, newPlat.selectedIngredients)
        } else {
          await updatePlatIngredients(platData.id, newPlat.selectedIngredients)
        }
        
        fetchPlats()
        setIsDialogOpen(false)
        resetForm()
        showAlert(editingPlat ? "Plat modifié avec succès" : "Plat ajouté avec succès")
      } else {
        const errorData = await response.json()
        showAlert(errorData.error || "Erreur lors de l'enregistrement", "error")
      }
    } catch (error) {
      console.error("Error submitting plat:", error)
      showAlert("Erreur lors de l'enregistrement", "error")
    }
  }

  // Function to update plat ingredients
  const updatePlatIngredients = async (platId, selectedIngredients) => {
    try {
      // Get current ingredients for this plat
      const currentIngredientsResponse = await fetch(`http://localhost:3001/plats/${platId}/ingredients`)
      const currentIngredients = currentIngredientsResponse.ok ? await currentIngredientsResponse.json() : []
      
      // Remove ingredients that are no longer selected
      for (const currentIngredient of currentIngredients) {
        if (!selectedIngredients.some(si => si.ingredientId === currentIngredient.ingredientId)) {
          await fetch(`http://localhost:3001/plats/${platId}/ingredients/${currentIngredient.ingredientId}`, {
            method: 'DELETE'
          })
        }
      }
      
      // Add new ingredients
      for (const selectedIngredient of selectedIngredients) {
        const exists = currentIngredients.some(ci => ci.ingredientId === selectedIngredient.ingredientId)
        if (!exists) {
          await fetch(`http://localhost:3001/plats/${platId}/ingredients`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ingredientId: selectedIngredient.ingredientId,
              removable: selectedIngredient.removable !== false,
              essential: selectedIngredient.essential === true
            })
          })
        } else {
          // Update existing ingredient properties
          await fetch(`http://localhost:3001/plats/${platId}/ingredients/${selectedIngredient.ingredientId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              removable: selectedIngredient.removable !== false,
              essential: selectedIngredient.essential === true
            })
          })
        }
      }
    } catch (error) {
      console.error("Error updating plat ingredients:", error)
      showAlert("Erreur lors de la mise à jour des ingrédients", "error")
    }
  }

  // Ingredient management functions
  const handleCreateIngredient = async () => {
    if (!newIngredient.name) {
      showAlert("Le nom de l'ingrédient est requis", "error")
      return
    }

    try {
      const response = await fetch("http://localhost:3001/ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newIngredient)
      })

      if (response.ok) {
        await fetchIngredients() // Refresh ingredients list
        setNewIngredient({ name: "", description: "", allergen: false })
        setIsIngredientDialogOpen(false)
        showAlert("Ingrédient créé avec succès")
      } else {
        const errorData = await response.json()
        showAlert(errorData.error || "Erreur lors de la création de l'ingrédient", "error")
      }
    } catch (error) {
      console.error("Error creating ingredient:", error)
      showAlert("Erreur lors de la création de l'ingrédient", "error")
    }
  }

  const handleDeleteIngredient = async (ingredientId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet ingrédient ?")) {
      return
    }

    try {
      const response = await fetch(`http://localhost:3001/ingredients/${ingredientId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        await fetchIngredients() // Refresh ingredients list
        showAlert("Ingrédient supprimé avec succès")
      } else {
        const errorData = await response.json()
        showAlert(errorData.error || "Erreur lors de la suppression de l'ingrédient", "error")
      }
    } catch (error) {
      console.error("Error deleting ingredient:", error)
      showAlert("Erreur lors de la suppression de l'ingrédient", "error")
    }
  }

  const updateEditData = (id, field, value) => {
    setEditData(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }))
  }

  const handleEditClick = (plat) => {
    setEditMode(prev => ({ ...prev, [plat.id]: true }))
    setEditData(prev => ({
      ...prev,
      [plat.id]: {
        name: plat.name,
        description: plat.description,
        price: plat.price,
        type: plat.type,
        available: plat.available,
        availableForDelivery: plat.availableForDelivery,
        speciality: plat.speciality,
        IncludesSauce: plat.IncludesSauce,
        saucePrice: plat.saucePrice,
        image: plat.image ? `http://localhost:3001${plat.image}` : null,
        selectedTags: plat.tags ? plat.tags.map(tag => tag.id) : []
      }
    }))
  }

  const handleEditCancel = (id) => {
    setEditMode(prev => ({ ...prev, [id]: false }))
    setEditData(prev => {
      const newData = { ...prev }
      delete newData[id]
      return newData
    })
    setEditImageFiles(prev => {
      const newFiles = { ...prev }
      delete newFiles[id]
      return newFiles
    })
  }

  const handleEditSave = async (id) => {
    const data = editData[id]
    if (!data.name || !data.price || !data.description) {
      showAlert("Veuillez remplir tous les champs obligatoires", "error")
      return
    }

    try {
      const formData = new FormData()
      formData.append("name", data.name)
      formData.append("price", data.price)
      formData.append("description", data.description)
      formData.append("type", data.type)
      formData.append("available", data.available)
      formData.append("availableForDelivery", data.availableForDelivery)
      formData.append("speciality", data.speciality)
      formData.append("IncludesSauce", data.IncludesSauce)
      formData.append("saucePrice", data.saucePrice)

      // Handle image
      if (editImageFiles[id]) {
        formData.append("image", editImageFiles[id])
      } else if (data.image === null) {
        formData.append("keepExistingImage", "false")
      } else {
        formData.append("keepExistingImage", "true")
      }

      // For now, we'll keep existing versions - could be enhanced later
      const originalPlat = plats.find(p => p.id === id)
      if (originalPlat && originalPlat.versions) {
        formData.append("versions", JSON.stringify(originalPlat.versions))
      }

      const response = await fetch(`http://localhost:3001/plats/${id}`, {
        method: "PUT",
        body: formData,
      })

      if (response.ok) {
        fetchPlats()
        handleEditCancel(id)
        showAlert("Plat modifié avec succès")
      } else {
        const errorData = await response.json()
        showAlert(errorData.error || "Erreur lors de la modification", "error")
      }
    } catch (error) {
      console.error("Error updating plat:", error)
      showAlert("Erreur lors de la modification", "error")
    }
  }

  const openDialog = (plat = null) => {
    if (plat) {
      setEditingPlat(plat)
      setNewPlat({
        name: plat.name,
        price: plat.price,
        description: plat.description,
        type: plat.type,
        image: null,
        available: plat.available,
        availableForDelivery: plat.availableForDelivery,
        speciality: plat.speciality,
        IncludesSauce: plat.IncludesSauce,
        saucePrice: plat.saucePrice,
        selectedTags: plat.tags ? plat.tags.map(tag => tag.id) : [],
        selectedIngredients: plat.ingredients ? plat.ingredients.map(pi => ({
          ingredientId: pi.ingredientId,
          removable: pi.removable,
          essential: pi.essential
        })) : [],
        versions: plat.versions && plat.versions.length > 0 ? plat.versions : [{ size: "Standard", extraPrice: 0 }]
      })
      if (plat.image) {
        setImagePreview(`http://localhost:3001${plat.image}`)
      }
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
          padding: 3,
        }}
      >
        <Fade in={true} timeout={800}>
          <Paper
            elevation={24}
            sx={{
              padding: 4,
              borderRadius: 3,
              maxWidth: "100%",
              margin: "0 auto",
              background: "linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 152, 0, 0.1)",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
              <Typography
                variant="h4"
                sx={{
                  background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <FastfoodIcon sx={{ color: "#ff9800", fontSize: "2rem" }} />
                Administration des Plats
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setIsIngredientDialogOpen(true)}
                  sx={{
                    borderRadius: 3,
                    paddingX: 3,
                    paddingY: 1.5,
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    borderColor: "rgba(255, 152, 0, 0.5)",
                    "&:hover": {
                      borderColor: "#ff9800",
                      backgroundColor: "rgba(255, 152, 0, 0.1)",
                    },
                  }}
                >
                  Gérer Ingrédients
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => openDialog()}
                  sx={{
                    borderRadius: 3,
                    paddingX: 3,
                    paddingY: 1.5,
                    fontSize: "1rem",
                    fontWeight: 600,
                    boxShadow: "0 8px 32px rgba(255, 152, 0, 0.3)",
                    background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
                    "&:hover": {
                      background: "linear-gradient(45deg, #f57c00 30%, #ff9800 90%)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 12px 40px rgba(255, 152, 0, 0.4)",
                    },
                  }}
                >
                  Nouveau Plat
                </Button>
              </Box>
            </Box>

            <Box sx={{ height: 600, width: "100%" }}>
              <DataGrid
                rows={plats}
                columns={columns}
                disableRowSelectionOnClick
                slots={{ toolbar: GridToolbar }}
                slotProps={{
                  toolbar: {
                    showQuickFilter: true,
                    quickFilterProps: { debounceMs: 500 },
                  },
                }}
                sx={{
                  "& .MuiDataGrid-toolbarContainer": {
                    backgroundColor: "rgba(255, 152, 0, 0.05)",
                    borderRadius: "12px 12px 0 0",
                    padding: 2,
                  },
                  "& .MuiDataGrid-row": {
                    "&:hover": {
                      backgroundColor: "rgba(255, 152, 0, 0.05)",
                    },
                  },
                  "& .MuiDataGrid-cell": {
                    display: "flex",
                    alignItems: "center",
                  },
                }}
              />
            </Box>
          </Paper>
        </Fade>

        {/* Dialog for Add/Edit Plat */}
        <Dialog 
          open={isDialogOpen} 
          onClose={() => setIsDialogOpen(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: "linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 152, 0, 0.2)",
            }
          }}
        >
          <DialogTitle sx={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontSize: "1.5rem",
            fontWeight: 700,
          }}>
            {editingPlat ? "Modifier le Plat" : "Ajouter un Nouveau Plat"}
            <IconButton
              onClick={() => setIsDialogOpen(false)}
              sx={{ color: "rgba(255, 152, 0, 0.7)" }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ padding: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Basic Information */}
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <TextField
                  label="Nom du Plat"
                  value={newPlat.name}
                  onChange={(e) => setNewPlat({ ...newPlat, name: e.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="Type"
                  value={newPlat.type}
                  onChange={(e) => setNewPlat({ ...newPlat, type: e.target.value })}
                  fullWidth
                />
              </Box>
              
              <TextField
                label="Description"
                value={newPlat.description}
                onChange={(e) => setNewPlat({ ...newPlat, description: e.target.value })}
                required
                fullWidth
                multiline
                rows={3}
              />

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <TextField
                  label="Prix de base (€)"
                  type="number"
                  value={newPlat.price}
                  onChange={(e) => setNewPlat({ ...newPlat, price: e.target.value })}
                  required
                  inputProps={{ step: "0.01", min: "0" }}
                />
                <TextField
                  label="Prix sauce (€)"
                  type="number"
                  value={newPlat.saucePrice}
                  onChange={(e) => setNewPlat({ ...newPlat, saucePrice: e.target.value })}
                  inputProps={{ step: "0.01", min: "0" }}
                />
              </Box>

              {/* Checkboxes */}
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newPlat.available}
                      onChange={(e) => setNewPlat({ ...newPlat, available: e.target.checked })}
                    />
                  }
                  label="Disponible"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newPlat.availableForDelivery}
                      onChange={(e) => setNewPlat({ ...newPlat, availableForDelivery: e.target.checked })}
                    />
                  }
                  label="Livraison"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newPlat.speciality}
                      onChange={(e) => setNewPlat({ ...newPlat, speciality: e.target.checked })}
                    />
                  }
                  label="Spécialité"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newPlat.IncludesSauce}
                      onChange={(e) => setNewPlat({ ...newPlat, IncludesSauce: e.target.checked })}
                    />
                  }
                  label="Sauce incluse"
                />
              </Box>

              {/* Tags Selection */}
              <FormControl fullWidth>
                <InputLabel id="tags-select-label" sx={{ color: "#ff9800" }}>
                  Tags associés
                </InputLabel>
                <Select
                  labelId="tags-select-label"
                  id="tags-select"
                  multiple
                  value={newPlat.selectedTags}
                  onChange={handleTagChange}
                  label="Tags associés"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((tagId) => {
                        const tag = tags.find(t => t.id === tagId);
                        return tag ? (
                          <Chip
                            key={tagId}
                            label={`${tag.emoji} ${tag.nom}`}
                            size="small"
                            sx={{ backgroundColor: 'rgba(255, 152, 0, 0.2)' }}
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
                  {tags.map((tag) => (
                    <MenuItem key={tag.id} value={tag.id}>
                      <Checkbox 
                        checked={newPlat.selectedTags.indexOf(tag.id) > -1}
                        sx={{ color: "#ff9800" }}
                      />
                      <ListItemText 
                        primary={`${tag.emoji} ${tag.nom}`} 
                        secondary={tag.description}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Ingredients Selection */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ color: "#ff9800" }}>
                    Composition du Plat (Ingrédients)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel id="ingredients-select-label" sx={{ color: "#ff9800" }}>
                        Sélectionner les ingrédients
                      </InputLabel>
                      <Select
                        labelId="ingredients-select-label"
                        id="ingredients-select"
                        multiple
                        value={newPlat.selectedIngredients.map(si => si.ingredientId)}
                        onChange={(e) => {
                          const selectedIds = e.target.value;
                          const newSelectedIngredients = selectedIds.map(id => {
                            const existing = newPlat.selectedIngredients.find(si => si.ingredientId === id);
                            return existing || { ingredientId: id, removable: true, essential: false };
                          });
                          setNewPlat({ ...newPlat, selectedIngredients: newSelectedIngredients });
                        }}
                        label="Sélectionner les ingrédients"
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((ingredientId) => {
                              const ingredient = ingredients.find(i => i.id === ingredientId);
                              const selectedIngredient = newPlat.selectedIngredients.find(si => si.ingredientId === ingredientId);
                              return ingredient ? (
                                <Chip
                                  key={ingredientId}
                                  label={`${ingredient.name}${selectedIngredient?.essential ? ' (Essentiel)' : ''}${selectedIngredient?.removable === false ? ' (Non-retirable)' : ''}`}
                                  size="small"
                                  color={selectedIngredient?.essential ? 'error' : 'primary'}
                                  variant={selectedIngredient?.removable === false ? 'filled' : 'outlined'}
                                  sx={{ backgroundColor: selectedIngredient?.essential ? 'rgba(244, 67, 54, 0.2)' : 'rgba(255, 152, 0, 0.2)' }}
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
                        {ingredients.map((ingredient) => (
                          <MenuItem key={ingredient.id} value={ingredient.id}>
                            <Checkbox 
                              checked={newPlat.selectedIngredients.some(si => si.ingredientId === ingredient.id)}
                              sx={{ color: "#ff9800" }}
                            />
                            <ListItemText 
                              primary={ingredient.name}
                              secondary={`${ingredient.description || ''} ${ingredient.allergen ? '⚠️ Allergène' : ''}`}
                            />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Ingredient Properties */}
                    {newPlat.selectedIngredients.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, color: "#ff9800" }}>
                          Propriétés des ingrédients sélectionnés
                        </Typography>
                        {newPlat.selectedIngredients.map((selectedIngredient) => {
                          const ingredient = ingredients.find(i => i.id === selectedIngredient.ingredientId);
                          return ingredient ? (
                            <Box
                              key={selectedIngredient.ingredientId}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                padding: 1,
                                border: "1px solid rgba(255, 152, 0, 0.2)",
                                borderRadius: 2,
                                mb: 1,
                              }}
                            >
                              <Typography variant="body2" sx={{ minWidth: 120 }}>
                                {ingredient.name}
                              </Typography>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={selectedIngredient.removable !== false}
                                    onChange={(e) => {
                                      const updatedIngredients = newPlat.selectedIngredients.map(si =>
                                        si.ingredientId === selectedIngredient.ingredientId
                                          ? { ...si, removable: e.target.checked }
                                          : si
                                      );
                                      setNewPlat({ ...newPlat, selectedIngredients: updatedIngredients });
                                    }}
                                    size="small"
                                  />
                                }
                                label="Retirable"
                              />
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={selectedIngredient.essential === true}
                                    onChange={(e) => {
                                      const updatedIngredients = newPlat.selectedIngredients.map(si =>
                                        si.ingredientId === selectedIngredient.ingredientId
                                          ? { ...si, essential: e.target.checked }
                                          : si
                                      );
                                      setNewPlat({ ...newPlat, selectedIngredients: updatedIngredients });
                                    }}
                                    size="small"
                                  />
                                }
                                label="Essentiel"
                              />
                            </Box>
                          ) : null;
                        })}
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Versions Section */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ color: "#ff9800" }}>
                    Versions du Plat
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {newPlat.versions.map((version, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "2fr 1fr auto",
                          gap: 2,
                          alignItems: "center",
                          padding: 2,
                          border: "1px solid rgba(255, 152, 0, 0.2)",
                          borderRadius: 2,
                        }}
                      >
                        <TextField
                          label="Taille"
                          value={version.size}
                          onChange={(e) => handleVersionChange(index, "size", e.target.value)}
                          placeholder="Ex: M, L, XL"
                          size="small"
                        />
                        <TextField
                          label="Prix extra (€)"
                          type="number"
                          value={version.extraPrice}
                          onChange={(e) => handleVersionChange(index, "extraPrice", parseFloat(e.target.value) || 0)}
                          inputProps={{ step: "0.01", min: "0" }}
                          size="small"
                        />
                        <IconButton
                          color="error"
                          onClick={() => removeVersion(index)}
                          disabled={newPlat.versions.length <= 1}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={addVersion}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      Ajouter Version
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Image Upload */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, color: "#ff9800" }}>
                  Image du Plat
                </Typography>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <Button variant="outlined" component="label">
                    Télécharger Image
                    <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                  </Button>
                  {imagePreview && (
                    <Box>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          width: 100,
                          height: 100,
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "2px solid rgba(255, 152, 0, 0.3)",
                        }}
                      />
                      <Button
                        variant="text"
                        color="error"
                        size="small"
                        onClick={() => {
                          setNewPlat({ ...newPlat, image: null })
                          setImagePreview(null)
                        }}
                        sx={{ display: "block", mt: 1 }}
                      >
                        Supprimer
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ padding: 3 }}>
            <Button
              onClick={() => setIsDialogOpen(false)}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{
                borderRadius: 2,
                background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
                "&:hover": {
                  background: "linear-gradient(45deg, #f57c00 30%, #ff9800 90%)",
                },
              }}
            >
              {editingPlat ? "Modifier" : "Ajouter"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Alert Snackbar */}
        <Snackbar
          open={alert.show}
          autoHideDuration={6000}
          onClose={() => setAlert({ ...alert, show: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={() => setAlert({ ...alert, show: false })}
            severity={alert.severity}
            sx={{
              width: "100%",
              borderRadius: 2,
              fontWeight: 600,
            }}
          >
            {alert.message}
          </Alert>
        </Snackbar>

        {/* Ingredient Management Dialog */}
        <Dialog 
          open={isIngredientDialogOpen} 
          onClose={() => setIsIngredientDialogOpen(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: "linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95))",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 152, 0, 0.2)",
            }
          }}
        >
          <DialogTitle sx={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontSize: "1.5rem",
            fontWeight: 700,
          }}>
            Gestion des Ingrédients
            <IconButton
              onClick={() => setIsIngredientDialogOpen(false)}
              sx={{ color: "rgba(255, 152, 0, 0.7)" }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ padding: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Add New Ingredient Form */}
              <Box sx={{ 
                padding: 3, 
                border: "1px solid rgba(255, 152, 0, 0.2)", 
                borderRadius: 2,
                background: "rgba(255, 152, 0, 0.05)"
              }}>
                <Typography variant="h6" sx={{ mb: 2, color: "#ff9800" }}>
                  Ajouter un Nouvel Ingrédient
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "2fr 3fr 1fr", gap: 2, alignItems: "center" }}>
                  <TextField
                    label="Nom"
                    value={newIngredient.name}
                    onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                    required
                    size="small"
                  />
                  <TextField
                    label="Description"
                    value={newIngredient.description}
                    onChange={(e) => setNewIngredient({ ...newIngredient, description: e.target.value })}
                    size="small"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={newIngredient.allergen}
                        onChange={(e) => setNewIngredient({ ...newIngredient, allergen: e.target.checked })}
                        size="small"
                      />
                    }
                    label="Allergène"
                  />
                </Box>
                <Button
                  variant="contained"
                  onClick={handleCreateIngredient}
                  sx={{ mt: 2, alignSelf: "flex-start" }}
                >
                  Ajouter
                </Button>
              </Box>

              {/* Existing Ingredients List */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, color: "#ff9800" }}>
                  Ingrédients Existants
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, maxHeight: 300, overflowY: "auto" }}>
                  {ingredients.map((ingredient) => (
                    <Box
                      key={ingredient.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: 2,
                        border: "1px solid rgba(255, 152, 0, 0.2)",
                        borderRadius: 2,
                        backgroundColor: "rgba(255, 255, 255, 0.02)",
                      }}
                    >
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {ingredient.name}
                          {ingredient.allergen && <Chip label="Allergène" size="small" color="warning" sx={{ ml: 1 }} />}
                        </Typography>
                        {ingredient.description && (
                          <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {ingredient.description}
                          </Typography>
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteIngredient(ingredient.id)}
                        sx={{ 
                          backgroundColor: "rgba(244, 67, 54, 0.1)",
                          "&:hover": { backgroundColor: "rgba(244, 67, 54, 0.2)" }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  {ingredients.length === 0 && (
                    <Typography variant="body2" sx={{ textAlign: "center", color: "text.secondary", py: 2 }}>
                      Aucun ingrédient trouvé
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ padding: 3 }}>
            <Button
              onClick={() => setIsIngredientDialogOpen(false)}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Fermer
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  )
}
