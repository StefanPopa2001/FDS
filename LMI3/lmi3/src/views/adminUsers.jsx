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
} from "@mui/material"
import { DataGrid, GridToolbar } from "@mui/x-data-grid"
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
} from "@mui/icons-material"
import CryptoJS from "crypto-js"
import config from '../config';

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

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [alert, setAlert] = useState({ show: false, message: "", severity: "success" })
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    type: 0
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
      field: "name",
      headerName: "Nom",
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
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {params.value}
          </Typography>
        ),
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1.5,
      renderCell: (params) =>
        editMode[params.row.id] ? (
          <TextField
            fullWidth
            size="small"
            type="email"
            value={editData[params.row.id]?.email || ""}
            onChange={(e) =>
              setEditData({
                ...editData,
                [params.row.id]: { ...editData[params.row.id], email: e.target.value },
              })
            }
          />
        ) : (
          <Typography variant="body2">{params.value}</Typography>
        ),
    },
    {
      field: "phone",
      headerName: "Téléphone",
      width: 130,
      renderCell: (params) =>
        editMode[params.row.id] ? (
          <TextField
            fullWidth
            size="small"
            value={editData[params.row.id]?.phone || ""}
            onChange={(e) =>
              setEditData({
                ...editData,
                [params.row.id]: { ...editData[params.row.id], phone: e.target.value },
              })
            }
          />
        ) : (
          <Typography variant="body2">{params.value}</Typography>
        ),
    },
    {
      field: "createdAt",
      headerName: "Date de création",
      width: 180,
      renderCell: (params) => (
        <Typography variant="body2">
          {new Date(params.value).toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Typography>
      ),
    },
    {
      field: "type",
      headerName: "Type",
      width: 120,
      renderCell: (params) =>
        editMode[params.row.id] ? (
          <TextField
            select
            fullWidth
            size="small"
            value={editData[params.row.id]?.type || 0}
            onChange={(e) =>
              setEditData({
                ...editData,
                [params.row.id]: { ...editData[params.row.id], type: Number(e.target.value) },
              })
            }
          >
            <option value={0}>Utilisateur</option>
            <option value={1}>Admin</option>
          </TextField>
        ) : (
          <Typography variant="body2" color={params.value === 1 ? "primary" : "text.secondary"}>
            {params.value === 1 ? "Admin" : "Utilisateur"}
          </Typography>
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

  // Helper to get token from localStorage
  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken") // Changed from "token" to "authToken"
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${config.API_URL}/users`, {
        headers: {
          ...getAuthHeaders(),
        },
      })
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      showAlert("Erreur lors du chargement des utilisateurs", "error")
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Show alert helper
  const showAlert = (message, severity = "success") => {
    setAlert({ show: true, message, severity })
  }

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        const response = await fetch(`${config.API_URL}/users/${id}`, {
          method: "DELETE",
          headers: {
            ...getAuthHeaders(),
          },
        })
        if (response.ok) {
          showAlert("Utilisateur supprimé avec succès")
          fetchUsers()
        } else {
          showAlert("Échec de la suppression de l'utilisateur", "error")
        }
      } catch (error) {
        showAlert("Erreur lors de la suppression de l'utilisateur", "error")
      }
    }
  }

  // Generate random salt
  const generateSalt = () => {
    const array = new Uint32Array(4)
    window.crypto.getRandomValues(array)
    return Array.from(array, x => x.toString(16)).join('')
  }

  // Handle new user submit
  const handleNewUserSubmit = async () => {
    try {
      const salt = generateSalt()
      const response = await fetch(`${config.API_URL}/users/createUser`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          ...newUser,
          salt,
          password: CryptoJS.SHA256(newUser.password + salt).toString()
        }),
      })
      
      if (response.ok) {
        showAlert("Utilisateur ajouté avec succès")
        setNewUser({ name: "", email: "", phone: "", password: "", type: 0 })
        fetchUsers()
      } else {
        const data = await response.json()
        showAlert(data.error || "Échec de l'ajout de l'utilisateur", "error")
      }
    } catch (error) {
      showAlert("Erreur lors de l'ajout de l'utilisateur", "error")
    }
  }

  // Handle edit mode
  const handleEditClick = (user) => {
    setEditMode({ ...editMode, [user.id]: true })
    setEditData({ ...editData, [user.id]: { ...user } })
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
      const response = await fetch(`${config.API_URL}/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(editData[id]),
      })
      if (response.ok) {
        showAlert("Utilisateur mis à jour avec succès")
        setEditMode({ ...editMode, [id]: false })
        fetchUsers()
      } else {
        const data = await response.json()
        showAlert(data.error || "Échec de la mise à jour de l'utilisateur", "error")
      }
    } catch (error) {
      showAlert("Erreur lors de la mise à jour de l'utilisateur", "error")
    }
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)", p: 3 }}>
        <Fade in timeout={800}>
          <Typography variant="h6" component="h1" sx={{ fontWeight: 600, color: "text.primary", mb: 3 }}>
            Gestion des utilisateurs
          </Typography>
        </Fade>

        {/* Add new user form */}
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
              Ajouter un nouvel utilisateur
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
              <TextField
                size="small"
                label="Nom"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                sx={{ width: 200 }}
              />
              <TextField
                size="small"
                label="Email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                sx={{ width: 250 }}
              />
              <TextField
                size="small"
                label="Téléphone"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                sx={{ width: 150 }}
              />
              <TextField
                size="small"
                label="Mot de passe"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                sx={{ width: 200 }}
              />
              <TextField
                select
                size="small"
                label="Type"
                value={newUser.type}
                onChange={(e) => setNewUser({ ...newUser, type: Number(e.target.value) })}
                sx={{ width: 150 }}
              >
                <option value={0}>Utilisateur</option>
                <option value={1}>Admin</option>
              </TextField>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNewUserSubmit}
                disabled={!newUser.name || !newUser.email || !newUser.password}
              >
                Ajouter Utilisateur
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
              rows={users}
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
                    fileName: `users-export-${new Date().toISOString().split("T")[0]}`,
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
    </ThemeProvider>
  )
}
