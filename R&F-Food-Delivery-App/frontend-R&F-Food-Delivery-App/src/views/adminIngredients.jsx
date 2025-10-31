"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Button,
  Snackbar,
  Alert,
  TextField,
  FormControlLabel,
  Typography,
  Paper,
  Fade,
  Checkbox,
  IconButton,
} from "@mui/material"
import { DataGrid, GridToolbar } from "@mui/x-data-grid"
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  RestaurantMenu as IngredientIcon,
  PhotoCamera as PhotoCameraIcon,
  Close as CloseIcon,
} from "@mui/icons-material"
import config from '../config.js';
import { fetchWithAuth } from '../utils/apiService';

export default function AdminIngredients() {
  const [ingredients, setIngredients] = useState([])
  const [editMode, setEditMode] = useState({})
  const [editData, setEditData] = useState({})
  const [alert, setAlert] = useState({ show: false, message: "", severity: "success" })
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    description: "",
    allergen: false,
  })
  const [uploadingImage, setUploadingImage] = useState({})

  // Fetch ingredients
  const fetchIngredients = async () => {
    try {
      const response = await fetchWithAuth(`${config.API_URL}/ingredients`)
      if (response.ok) {
        const data = await response.json()
        // Convert id to number to ensure proper sorting
        const processedData = data.map((ingredient) => ({
          ...ingredient,
          id: Number(ingredient.id),
        }))
        setIngredients(processedData)
      }
    } catch (error) {
      showAlert("Échec du chargement des ingrédients", "error")
    }
  }

  useEffect(() => {
    fetchIngredients()
  }, [])

  // Show alert helper
  const showAlert = (message, severity = "success") => {
    setAlert({ show: true, message, severity })
  }

  // Handle quick edit for checkboxes
  const handleQuickEdit = async (id, updates) => {
    try {
      const ingredient = ingredients.find(i => i.id === id)
      if (!ingredient) return

      const response = await fetchWithAuth(`${config.API_URL}/ingredients/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...ingredient,
          ...updates,
        }),
      })

      if (response.ok) {
        showAlert("Ingrédient mis à jour avec succès")
        fetchIngredients()
      } else {
        const data = await response.json()
        showAlert(data.error || "Échec de la mise à jour de l'ingrédient", "error")
      }
    } catch (error) {
      showAlert("Erreur lors de la mise à jour de l'ingrédient", "error")
    }
  }

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet ingrédient ?")) {
      try {
        const response = await fetchWithAuth(`${config.API_URL}/ingredients/${id}`, { method: "DELETE" })
        if (response.ok) {
          showAlert("Ingrédient supprimé avec succès")
          fetchIngredients()
        } else {
          const data = await response.json()
          showAlert(data.error || "Échec de la suppression de l'ingrédient", "error")
        }
      } catch (error) {
        showAlert("Erreur lors de la suppression de l'ingrédient", "error")
      }
    }
  }

  // Handle new ingredient submit
  const handleNewIngredientSubmit = async () => {
    try {
      const response = await fetchWithAuth(`${config.API_URL}/ingredients`, {
        method: "POST",
        body: JSON.stringify(newIngredient),
      })
      if (response.ok) {
        showAlert("Ingrédient ajouté avec succès")
        setNewIngredient({ name: "", description: "", allergen: false })
        fetchIngredients()
      } else {
        const data = await response.json()
        showAlert(data.error || "Échec de l'ajout de l'ingrédient", "error")
      }
    } catch (error) {
      showAlert("Erreur lors de l'ajout de l'ingrédient", "error")
    }
  }

  // Handle image upload for ingredient
  const handleImageUpload = async (id, file) => {
    if (!file) return

    setUploadingImage({ ...uploadingImage, [id]: true })
    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await fetchWithAuth(`${config.API_URL}/ingredients/${id}/image`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        showAlert("Image ajoutée avec succès")
        fetchIngredients()
      } else {
        const data = await response.json()
        showAlert(data.error || "Échec de l'ajout de l'image", "error")
      }
    } catch (error) {
      showAlert("Erreur lors de l'ajout de l'image", "error")
    } finally {
      setUploadingImage({ ...uploadingImage, [id]: false })
    }
  }

  // Handle delete image
  const handleDeleteImage = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette image ?")) {
      try {
        const response = await fetchWithAuth(`${config.API_URL}/ingredients/${id}/image`, {
          method: "DELETE",
        })

        if (response.ok) {
          showAlert("Image supprimée avec succès")
          fetchIngredients()
        } else {
          const data = await response.json()
          showAlert(data.error || "Échec de la suppression de l'image", "error")
        }
      } catch (error) {
        showAlert("Erreur lors de la suppression de l'image", "error")
      }
    }
  }

  // Handle edit mode
  const handleEditClick = (ingredient) => {
    setEditMode({ ...editMode, [ingredient.id]: true })
    setEditData({ ...editData, [ingredient.id]: { ...ingredient } })
  }

  // Handle edit cancel
  const handleEditCancel = (id) => {
    setEditMode({ ...editMode, [id]: false })
    delete editData[id]
    setEditData({ ...editData })
  }

  // Handle edit save
  const handleEditSave = async (id) => {
    try {
      const response = await fetchWithAuth(`${config.API_URL}/ingredients/${id}`, {
        method: "PUT",
        body: JSON.stringify(editData[id]),
      })
      if (response.ok) {
        showAlert("Ingrédient mis à jour avec succès")
        setEditMode({ ...editMode, [id]: false })
        fetchIngredients()
      } else {
        const data = await response.json()
        showAlert(data.error || "Échec de la mise à jour de l'ingrédient", "error")
      }
    } catch (error) {
      showAlert("Erreur lors de la mise à jour de l'ingrédient", "error")
    }
  }

  const columns = [
    {
      field: "id",
      headerName: "ID",
      width: 70,
      type: "number",
      filterable: true,
      align: 'center',
      headerAlign: 'center',
      cellClassName: 'centered-cell',
    },
    {
      field: "name",
      headerName: "Nom",
      flex: 1,
      align: 'center',
      headerAlign: 'center',
      cellClassName: 'centered-cell',
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
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {params.value}
          </Typography>
        ),
    },
    {
      field: "description",
      headerName: "Description",
      flex: 2,
      align: 'center',
      headerAlign: 'center',
      cellClassName: 'centered-cell',
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
            {params.value || "-"}
          </Typography>
        ),
    },
    {
      field: "allergen",
      headerName: "Allergène",
      width: 120,
      align: 'center',
      headerAlign: 'center',
      cellClassName: 'centered-cell',
      renderCell: (params) =>
        editMode[params.row.id] ? (
          <FormControlLabel
            control={
              <Checkbox
                checked={editData[params.row.id]?.allergen || false}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    [params.row.id]: { ...editData[params.row.id], allergen: e.target.checked },
                  })
                }
                color="primary"
              />
            }
            label=""
          />
        ) : (
          <FormControlLabel
            control={
              <Checkbox
                checked={params.value}
                onChange={(e) => handleQuickEdit(params.row.id, { allergen: e.target.checked })}
                color="primary"
              />
            }
            label=""
          />
        ),
    },
    {
      field: "image",
      headerName: "Image",
      width: 150,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      cellClassName: 'centered-cell',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {params.row.image && (
            <>
              <Box
                component="img"
                src={`${config.API_URL}${params.row.image}`}
                alt={params.row.name}
                sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }}
              />
              <IconButton
                size="small"
                onClick={() => handleDeleteImage(params.row.id)}
                disabled={uploadingImage[params.row.id]}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </>
          )}
          <Button
            component="label"
            size="small"
            startIcon={<PhotoCameraIcon />}
            sx={{ minWidth: 'auto' }}
            disabled={uploadingImage[params.row.id]}
          >
            {params.row.image ? "Changer" : "Ajouter"}
            <input
              hidden
              accept="image/*"
              type="file"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleImageUpload(params.row.id, e.target.files[0])
                }
              }}
            />
          </Button>
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
      cellClassName: 'centered-cell',
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

  const gridStyles = {
    '& .MuiDataGrid-cell': {
      display: 'flex',
      alignItems: 'center',
    },
    '& .MuiDataGrid-cellContent': {
      display: 'flex',
      alignItems: 'center',
      width: '100%',
    },
    '& .centered-cell': {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    '& .MuiDataGrid-columnHeaderTitleContainer': {
      justifyContent: 'center',
    },
    '& .MuiDataGrid-columnHeaderTitle': {
      textAlign: 'center',
      width: '100%',
    },
    '& .MuiDataGrid-row:hover': {
      backgroundColor: 'rgba(255, 152, 0, 0.08)',
    },
    height: '100%',
  };

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
          <IngredientIcon sx={{ color: "#ff9800", fontSize: "2rem" }} />
          Gestion des ingrédients
        </Typography>
      </Fade>

      {/* Add new ingredient form */}
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
            Ajouter un nouvel ingrédient
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <TextField
              size="small"
              label="Nom *"
              value={newIngredient.name}
              onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
              sx={{ width: 200 }}
            />
            <TextField
              size="small"
              label="Description"
              value={newIngredient.description}
              onChange={(e) => setNewIngredient({ ...newIngredient, description: e.target.value })}
              sx={{ flexGrow: 1 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={newIngredient.allergen}
                  onChange={(e) => setNewIngredient({ ...newIngredient, allergen: e.target.checked })}
                  color="primary"
                />
              }
              label="Allergène"
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewIngredientSubmit}
              disabled={!newIngredient.name}
            >
              Ajouter Ingrédient
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
            rows={ingredients}
            columns={columns}
            sx={gridStyles}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50, 100]}
            disableSelectionOnClick
            components={{ Toolbar: GridToolbar }}
            componentsProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
                csvOptions: {
                  fileName: `ingredients-export-${new Date().toISOString().split("T")[0]}`,
                  utf8WithBom: true,
                },
              },
            }}
            density="comfortable"
            initialState={{
              sorting: {
                sortModel: [{ field: "name", sort: "asc" }],
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