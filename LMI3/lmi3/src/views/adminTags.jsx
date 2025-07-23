"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Button,
  Snackbar,
  Alert,
  ThemeProvider,
  createTheme,
  TextField,
  Typography,
  Paper,
  Fade,
  CssBaseline,
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
  },
})

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
    },
    {
      field: "emoji",
      headerName: "Emoji",
      width: 100,
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

  // Fetch tags
  const fetchTags = async () => {
    try {
      const response = await fetch("http://localhost:3001/tags")
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
        const response = await fetch(`http://localhost:3001/tags/${id}`, { method: "DELETE" })
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
      const response = await fetch("http://localhost:3001/tags", {
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
      const response = await fetch(`http://localhost:3001/tags/${id}`, {
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
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)", p: 3 }}>
        <Fade in timeout={800}>
          <Typography variant="h6" component="h1" sx={{ fontWeight: 600, color: "text.primary", mb: 3 }}>
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
              sx={{
                height: "100%",
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "rgba(255, 152, 0, 0.08)",
                },
              }}
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
    </ThemeProvider>
  )
}
