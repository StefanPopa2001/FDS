"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Button,
  Snackbar,
  Alert,
  TextField,
  Typography,
  Paper,
  Fade,
  Switch,
  FormControlLabel,
} from "@mui/material"
import { DataGrid, GridToolbar } from "@mui/x-data-grid"
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Tag as TagIcon,
} from "@mui/icons-material"
import config from '../config';

export default function AdminTags() {
  const [tags, setTags] = useState([])
  const [alert, setAlert] = useState({ show: false, message: "", severity: "success" })
  const [newTag, setNewTag] = useState({
    nom: "",
    description: "",
    emoji: "",
    recherchable: false,
  })
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
      cellClassName: 'centered-cell',
    },
    {
      field: "emoji",
      headerName: "Emoji",
      width: 100,
      align: 'center',
      headerAlign: 'center',
      cellClassName: 'centered-cell',
      renderCell: (params) =>
        editMode[params.row.id] ? (
          <TextField
            size="small"
            value={editData[params.row.id]?.emoji || ""}
            onChange={(e) =>
              setEditData({
                ...editData,
                [params.row.id]: { ...editData[params.row.id], emoji: e.target.value },
              })
            }
            sx={{ width: "100%" }}
          />
        ) : (
          <Typography variant="body1" sx={{ fontSize: "1.5rem" }}>
            {params.value}
          </Typography>
        ),
    },
    {
      field: "nom",
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
            value={editData[params.row.id]?.nom || ""}
            onChange={(e) =>
              setEditData({
                ...editData,
                [params.row.id]: { ...editData[params.row.id], nom: e.target.value },
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
            {params.value}
          </Typography>
        ),
    },
    {
      field: "recherchable",
      headerName: "Recherchable",
      width: 120,
      align: 'center',
      headerAlign: 'center',
      cellClassName: 'centered-cell',
      renderCell: (params) =>
        editMode[params.row.id] ? (
          <FormControlLabel
            control={
              <Switch
                checked={editData[params.row.id]?.recherchable || false}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    [params.row.id]: { ...editData[params.row.id], recherchable: e.target.checked },
                  })
                }
                color="primary"
              />
            }
            label=""
          />
        ) : (
          <Switch
            checked={params.value}
            disabled
            color="primary"
          />
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

  // Fetch tags
  const fetchTags = async () => {
    try {
      const response = await fetch(`${config.API_URL}/tags`)
      const data = await response.json()
      setTags(data)
    } catch (error) {
      showAlert("Erreur lors du chargement des tags", "error")
    }
  }

  useEffect(() => {
    fetchTags()
  }, [])

  // Show alert helper
  const showAlert = (message, severity = "success") => {
    setAlert({ show: true, message, severity })
  }

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce tag ?")) {
      try {
        const response = await fetch(`${config.API_URL}/tags/${id}`, { method: "DELETE" })
        if (response.ok) {
          showAlert("Tag supprimé avec succès")
          fetchTags()
        } else {
          showAlert("Échec de la suppression du tag", "error")
        }
      } catch (error) {
        showAlert("Erreur lors de la suppression du tag", "error")
      }
    }
  }

  // Handle new tag submit
  const handleNewTagSubmit = async () => {
    try {
      const response = await fetch(`${config.API_URL}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTag),
      })
      if (response.ok) {
        showAlert("Tag ajouté avec succès")
        setNewTag({ nom: "", description: "", emoji: "", recherchable: false })
        fetchTags()
      } else {
        const data = await response.json()
        showAlert(data.error || "Échec de l'ajout du tag", "error")
      }
    } catch (error) {
      showAlert("Erreur lors de l'ajout du tag", "error")
    }
  }

  // Handle edit mode
  const handleEditClick = (tag) => {
    setEditMode({ ...editMode, [tag.id]: true })
    setEditData({ ...editData, [tag.id]: { ...tag } })
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
      const response = await fetch(`${config.API_URL}/tags/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData[id]),
      })
      if (response.ok) {
        showAlert("Tag mis à jour avec succès")
        setEditMode({ ...editMode, [id]: false })
        fetchTags()
      } else {
        const data = await response.json()
        showAlert(data.error || "Échec de la mise à jour du tag", "error")
      }
    } catch (error) {
      showAlert("Erreur lors de la mise à jour du tag", "error")
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
          <TagIcon sx={{ color: "#ff9800", fontSize: "2rem" }} />
          Gestion des tags
        </Typography>
      </Fade>

      {/* Add new tag form */}
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
              Ajouter un nouveau tag
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
              <TextField
                size="small"
                label="Emoji"
                value={newTag.emoji}
                onChange={(e) => setNewTag({ ...newTag, emoji: e.target.value })}
                sx={{ width: 100 }}
              />
              <TextField
                size="small"
                label="Nom"
                value={newTag.nom}
                onChange={(e) => setNewTag({ ...newTag, nom: e.target.value })}
                sx={{ width: 200 }}
              />
              <TextField
                size="small"
                label="Description"
                value={newTag.description}
                onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                sx={{ flexGrow: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={newTag.recherchable}
                    onChange={(e) => setNewTag({ ...newTag, recherchable: e.target.checked })}
                    color="primary"
                  />
                }
                label="Recherchable"
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNewTagSubmit}
                disabled={!newTag.nom || !newTag.description || !newTag.emoji}
              >
                Ajouter Tag
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
              rows={tags}
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
                    fileName: `tags-export-${new Date().toISOString().split("T")[0]}`,
                    utf8WithBom: true,
                  },
                },
              }}
              density="comfortable"
              initialState={{
                sorting: {
                  sortModel: [{ field: "nom", sort: "asc" }],
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
