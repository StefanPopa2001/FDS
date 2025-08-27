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
  Autocomplete,
  Chip,
} from "@mui/material"
import { DataGrid, GridToolbar } from "@mui/x-data-grid"
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  LocalOffer as TagIcon,
} from "@mui/icons-material"
import config from '../config.js';

export default function AdminExtra() {
  const [extras, setExtras] = useState([])
  const [tags, setTags] = useState([])
  const [editMode, setEditMode] = useState({})
  const [editData, setEditData] = useState({})
  const [alert, setAlert] = useState({ show: false, message: "", severity: "success" })
  const [newExtra, setNewExtra] = useState({
    nom: "",
    price: "",
    description: "",
    available: true,
    availableForDelivery: true,
    speciality: false,
    tags: []
  });

  // Fetch extras
  const fetchExtras = async () => {
    try {
      const response = await fetch(`${config.API_URL}/api/extras`)
      if (response.ok) {
        const data = await response.json()
        // Convert id to number to ensure proper sorting
        const processedData = data.map((extra) => ({
          ...extra,
          id: Number(extra.id),
        }))
        setExtras(processedData)
      }
    } catch (error) {
      showAlert("Échec du chargement des extras", "error")
    }
  }

  // Fetch all tags for the multi-select
  const fetchTags = async () => {
    try {
      const response = await fetch(`${config.API_URL}/tags`)
      if (!response.ok) throw new Error('Failed to fetch tags')
      const data = await response.json()
      setTags(data)
    } catch (error) {
      console.error('Error fetching tags:', error)
      showAlert("Échec du chargement des tags", "error")
    }
  }

  useEffect(() => {
    fetchExtras()
    fetchTags()
  }, [])

  // Show alert helper
  const showAlert = (message, severity = "success") => {
    setAlert({ show: true, message, severity })
  }

  // Handle quick edit for checkboxes
  const handleQuickEdit = async (id, updates) => {
    try {
      const extra = extras.find(e => e.id === id)
      if (!extra) return

      const response = await fetch(`${config.API_URL}/api/extras/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...extra,
          ...updates,
        }),
      })

      if (response.ok) {
        fetchExtras()
        showAlert("Extra mis à jour avec succès")
      } else {
        const error = await response.json()
        showAlert(error.error || "Échec de la mise à jour de l'extra", "error")
      }
    } catch (error) {
      console.error("Quick edit error:", error)
      showAlert("Échec de la mise à jour de l'extra", "error")
    }
  }

  // Handle edit mode
  const handleEditClick = (extra) => {
    setEditMode({ ...editMode, [extra.id]: true })
    setEditData({ ...editData, [extra.id]: { ...extra } })
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
      const response = await fetch(`${config.API_URL}/api/extras/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editData[id],
          price: parseFloat(editData[id].price),
        }),
      })

      if (response.ok) {
        fetchExtras()
        showAlert("Extra mis à jour avec succès")
        handleEditCancel(id)
      } else {
        const error = await response.json()
        showAlert(error.error || "Échec de la mise à jour de l'extra", "error")
      }
    } catch (error) {
      console.error("Edit save error:", error)
      showAlert("Échec de la mise à jour de l'extra", "error")
    }
  }

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet extra ?")) return

    try {
      const response = await fetch(`${config.API_URL}/api/extras/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchExtras()
        showAlert("Extra supprimé avec succès")
      } else {
        const error = await response.json()
        showAlert(error.error || "Échec de la suppression de l'extra", "error")
      }
    } catch (error) {
      console.error("Delete error:", error)
      showAlert("Échec de la suppression de l'extra", "error")
    }
  }

  // Handle new extra submission
  const handleNewExtraSubmit = async () => {
    try {
      const response = await fetch(`${config.API_URL}/api/extras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newExtra,
          price: parseFloat(newExtra.price),
        }),
      })

      if (response.ok) {
        fetchExtras()
        showAlert("Extra ajouté avec succès")
        setNewExtra({
          nom: "",
          price: "",
          description: "",
          available: true,
          availableForDelivery: true,
          speciality: false,
          tags: []
        })
      } else {
        const error = await response.json()
        showAlert(error.error || "Échec de l'ajout de l'extra", "error")
      }
    } catch (error) {
      console.error("Add extra error:", error)
      showAlert("Échec de l'ajout de l'extra", "error")
    }
  }

  // Define DataGrid columns
  const columns = [
    {
      field: "id",
      headerName: "ID",
      width: 70,
      type: "number",
    },
    {
      field: "nom",
      headerName: "Nom de l'extra",
      description: "Nom de l'extra",
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
                [params.row.id]: { ...editData[params.row.id], price: e.target.value },
              })
            }
            inputProps={{ step: "0.01" }}
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
            multiline
            maxRows={3}
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
      field: "tags",
      headerName: "Tags",
      flex: 2,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', py: 1 }}>
          {editMode[params.row.id] ? (
            <Autocomplete
              multiple
              options={tags}
              getOptionLabel={(option) => option.nom}
              value={editData[params.row.id]?.tags || []}
              onChange={(event, newValue) => {
                setEditData({
                  ...editData,
                  [params.row.id]: { 
                    ...editData[params.row.id],
                    tags: newValue 
                  }
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  placeholder="Sélectionner les tags"
                  sx={{ minWidth: 250 }}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    key={option.id}
                    icon={<TagIcon />}
                    label={option.nom}
                    {...getTagProps({ index })}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255, 152, 0, 0.1)',
                      borderColor: '#ff9800',
                      '& .MuiChip-icon': {
                        color: '#ff9800'
                      }
                    }}
                  />
                ))
              }
            />
          ) : (
            params.row.tags?.map((tag) => (
              <Chip
                key={tag.id}
                label={tag.nom}
                size="small"
                icon={<TagIcon />}
                sx={{
                  backgroundColor: 'rgba(255, 152, 0, 0.1)',
                  borderColor: '#ff9800',
                  '& .MuiChip-icon': {
                    color: '#ff9800'
                  }
                }}
              />
            ))
          )}
        </Box>
      ),
    },
    {
      field: "available",
      headerName: "Disponible",
      width: 120,
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
                  });
                } else {
                  handleQuickEdit(params.row.id, { available: e.target.checked });
                }
              }}
              color="primary"
            />
          }
          label=""
        />
      ),
    },
    {
      field: "availableForDelivery",
      headerName: "Livraison",
      width: 120,
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
                  });
                } else {
                  handleQuickEdit(params.row.id, { availableForDelivery: e.target.checked });
                }
              }}
              color="primary"
            />
          }
          label=""
        />
      ),
    },
    {
      field: "speciality",
      headerName: "Spécialité",
      width: 120,
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
                  });
                } else {
                  handleQuickEdit(params.row.id, { speciality: e.target.checked });
                }
              }}
              color="primary"
            />
          }
          label=""
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          {editMode[params.row.id] ? (
            <>
              <Button
                size="small"
                color="success"
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

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Fade in timeout={800}>
        <Typography
          variant="h4"
          gutterBottom
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
          <AddIcon sx={{ color: "#ff9800", fontSize: "2rem" }} />
          Gestion des Extras
        </Typography>
      </Fade>

      {/* Add New Extra Form */}
        <Fade in timeout={1000}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              background: "linear-gradient(135deg, rgba(255, 152, 0, 0.05), rgba(255, 152, 0, 0.02))",
              border: "1px solid rgba(255, 152, 0, 0.2)",
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, color: "primary.main", fontWeight: 700 }}>
              Ajouter un nouvel extra
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
              <TextField
                size="small"
                label="Nom"
                value={newExtra.nom}
                onChange={(e) => setNewExtra({ ...newExtra, nom: e.target.value })}
              />
              <TextField
                size="small"
                type="number"
                label="Prix (€)"
                value={newExtra.price}
                onChange={(e) => setNewExtra({ ...newExtra, price: e.target.value })}
                inputProps={{ step: "0.01" }}
              />
              <TextField
                size="small"
                label="Description"
                value={newExtra.description}
                onChange={(e) => setNewExtra({ ...newExtra, description: e.target.value })}
                sx={{ flexGrow: 1 }}
              />
              <Autocomplete
                multiple
                options={tags}
                getOptionLabel={(option) => option.nom}
                value={newExtra.tags}
                onChange={(event, newValue) => {
                  setNewExtra({ ...newExtra, tags: newValue });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label="Tags"
                    placeholder="Sélectionner les tags"
                    sx={{ minWidth: 200 }}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      key={option.id}
                      icon={<TagIcon />}
                      label={option.nom}
                      {...getTagProps({ index })}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        borderColor: '#ff9800',
                        '& .MuiChip-icon': {
                          color: '#ff9800'
                        }
                      }}
                    />
                  ))
                }
              />
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newExtra.available}
                      onChange={(e) => setNewExtra({ ...newExtra, available: e.target.checked })}
                      color="primary"
                    />
                  }
                  label="Disponible"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newExtra.availableForDelivery}
                      onChange={(e) => setNewExtra({ ...newExtra, availableForDelivery: e.target.checked })}
                      color="primary"
                    />
                  }
                  label="Livraison"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newExtra.speciality}
                      onChange={(e) => setNewExtra({ ...newExtra, speciality: e.target.checked })}
                      color="primary"
                    />
                  }
                  label="Spécialité"
                />
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleNewExtraSubmit}
                  disabled={!newExtra.nom || !newExtra.price || !newExtra.description}
                  sx={{
                    background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
                    "&:hover": {
                      background: "linear-gradient(45deg, #f57c00 30%, #ff9800 90%)",
                    },
                  }}
                >
                  Ajouter Extra
                </Button>
              </Box>
            </Box>
          </Paper>
        </Fade>

        {/* DataGrid */}
        <Fade in timeout={1200}>
          <Paper
            elevation={0}
            sx={{
              height: "calc(100vh - 400px)",
              width: "100%",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <DataGrid
              rows={extras}
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
                // Center cell contents vertically and horizontally
                "& .MuiDataGrid-cell": {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                },
                // Ensure header container and titles are centered and styled
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "rgba(255, 152, 0, 0.1)",
                  color: "#fff",
                  fontWeight: 700,
                },
                // Make sure each header cell content is centered horizontally and vertically
                "& .MuiDataGrid-columnHeader": {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                },
                // Ensure the inner title container is centered (fixes left-stuck header text)
                "& .MuiDataGrid-columnHeaderTitleContainer": {
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                  padding: 0,
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                  textAlign: "center",
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
                    fileName: `extras-export-${new Date().toISOString().split("T")[0]}`,
                    utf8WithBom: true,
                  },
                },
              }}
              density="comfortable"
              initialState={{
                sorting: {
                  sortModel: [{ field: "nom", sort: "asc" }],
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
