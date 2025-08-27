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
} from "@mui/material"
import { DataGrid, GridToolbar } from "@mui/x-data-grid"
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
} from "@mui/icons-material"
import CryptoJS from "crypto-js"
import config from '../config';

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [alert, setAlert] = useState({ show: false, message: "", severity: "success" })
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
      field: "name",
      headerName: "Nom",
      flex: 1,
      align: 'center',
      headerAlign: 'center',
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
                    <Typography variant="body2" sx={{ fontWeight: 600, width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            {params.value}
          </Typography>
        ),
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1.5,
      align: 'center',
      headerAlign: 'center',
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
          <Typography variant="body2" sx={{ width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'center' }}>{params.value}</Typography>
        ),
    },
    {
      field: "phone",
      headerName: "Téléphone",
      width: 130,
      align: 'center',
      headerAlign: 'center',
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
          <Typography variant="body2" sx={{ width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'center' }}>{params.value}</Typography>
        ),
    },
    {
      field: "createdAt",
      headerName: "Date de création",
      width: 180,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'center' }}>
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
      align: 'center',
      headerAlign: 'center',
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
          <Typography variant="body2" color={params.value === 1 ? "primary" : "text.secondary"} sx={{ width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'center' }}>
            {params.value === 1 ? "Admin" : "Utilisateur"}
          </Typography>
        ),
    },
    {
      field: "enabled",
      headerName: "Statut",
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Switch
            checked={params.value === true}
            onChange={() => handleToggleEnabled(params.row.id, !params.value)}
            color={params.value ? "success" : "error"}
          />
          <Typography 
            variant="body2" 
            sx={{ 
              ml: 1,
              color: params.value ? 'success.main' : 'error.main',
              fontWeight: 'bold'
            }}
          >
            {params.value ? 'Actif' : 'Suspendu'}
          </Typography>
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
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
  
  // Handle toggling user enabled status
  const handleToggleEnabled = async (id, enabled) => {
    const confirmMessage = enabled 
      ? "Êtes-vous sûr de vouloir activer cet utilisateur ?"
      : "Êtes-vous sûr de vouloir suspendre cet utilisateur ?";
      
    if (window.confirm(confirmMessage)) {
      try {
        const response = await fetch(`${config.API_URL}/users/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ enabled }),
        })
        if (response.ok) {
          const statusMessage = enabled
            ? "Utilisateur activé avec succès"
            : "Utilisateur suspendu avec succès";
          showAlert(statusMessage)
          fetchUsers()
        } else {
          const data = await response.json()
          showAlert(data.error || "Échec de la mise à jour du statut", "error")
        }
      } catch (error) {
        showAlert("Erreur lors de la mise à jour du statut", "error")
      }
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
          <PersonIcon sx={{ color: "#ff9800", fontSize: "2rem" }} />
          Gestion des utilisateurs
        </Typography>
       </Fade>

      <Fade in timeout={1200}>
        <Paper
          elevation={0}
          sx={{
            height: "calc(100vh - 200px)",
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
  )
}
