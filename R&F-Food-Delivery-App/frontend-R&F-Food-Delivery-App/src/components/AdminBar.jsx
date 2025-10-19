"use client"

import React from 'react'
import { Box, Tabs, Tab, useTheme, useMediaQuery } from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Receipt as OrdersIcon,
  Fastfood as PlatsIcon,
  Restaurant as SaucesIcon,
  LocalOffer as TagsIcon,
  People as UsersIcon,
  Add as ExtrasIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAdminNav } from '../contexts/AdminNavContext'

const menuItems = [
  { id: 'dashboard', label: 'Tableau', icon: <DashboardIcon /> },
  { id: 'orders', label: 'Commandes', icon: <OrdersIcon /> },
  { id: 'inspection', label: 'Inspection', icon: <PlatsIcon /> },
  { id: 'plats', label: 'Plats', icon: <PlatsIcon /> },
  { id: 'sauces', label: 'Sauces', icon: <SaucesIcon /> },
  { id: 'extras', label: 'Extras', icon: <ExtrasIcon /> },
  { id: 'ingredients', label: 'Ingrédients', icon: <PlatsIcon /> },
  { id: 'tags', label: 'Tags', icon: <TagsIcon /> },
  { id: 'users', label: 'Utilisateurs', icon: <UsersIcon /> },
  { id: 'settings', label: 'Paramètres', icon: <SettingsIcon /> },
]

const AdminBar = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { activeView, setActiveView } = useAdminNav()
  const navigate = useNavigate()
  const location = useLocation()

  const handleTabChange = (event, newValue) => {
    setActiveView(newValue)
    if (location.pathname !== '/admin') {
      navigate('/admin')
    }
  }

  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'sticky',
        top: { xs: 56, md: 60 }, // adjust based on navbar height
        zIndex: 120,
      }}
    >
      <Tabs
        value={activeView}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ minHeight: { xs: 36, md: 40 } }}
        TabIndicatorProps={{ style: { height: 2, borderRadius: 2 } }}
      >
        {menuItems.map((item) => (
          <Tab
            key={item.id}
            value={item.id}
            icon={React.cloneElement(item.icon, { sx: { fontSize: { xs: 16, md: 18 } } })}
            label={item.label}
            iconPosition="start"
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              gap: { xs: 0.25, md: 0.5 },
              px: { xs: 0.5, md: 1 },
              minHeight: { xs: 36, md: 40 },
              fontSize: { xs: '0.75rem', md: '0.875rem' },
            }}
          />
        ))}
      </Tabs>
    </Box>
  )
}

export default AdminBar
