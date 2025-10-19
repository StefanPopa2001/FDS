import React, { createContext, useContext, useState } from 'react'

const AdminNavContext = createContext()

export const AdminNavProvider = ({ children }) => {
  const [activeView, setActiveView] = useState('dashboard')

  return (
    <AdminNavContext.Provider value={{ activeView, setActiveView }}>
      {children}
    </AdminNavContext.Provider>
  )
}

export const useAdminNav = () => {
  const context = useContext(AdminNavContext)
  if (!context) {
    throw new Error('useAdminNav must be used within an AdminNavProvider')
  }
  return context
}