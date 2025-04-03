"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from "react-router-dom"
import { Bell, Home, Map, RouteIcon, Building2, PhoneCall, Droplets, Menu, X, LogOut } from "lucide-react"
import Dashboard from "./pages/Dashboard"
import MapView from "./pages/MapView"
import Alerts from "./pages/Alerts"
import SafeRoutes from "./pages/SafeRoutes"
import Shelters from "./pages/Shelters"
import EmergencyHelp from "./pages/EmergencyHelp"
import Login from "./pages/Login"
import { AppProvider, useAppContext } from "./context/AppContext"
import LoadingSpinner from "./components/LoadingSpinner"
import Notifications from "./components/Notifications"

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAppContext()
  const location = useLocation()

  if (isLoading) {
    return <LoadingSpinner fullScreen type="dots" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

function AppContent() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isAuthenticated, user, logout, isLoading } = useAppContext()
  const location = useLocation()

  // Expose the state setter for the Notifications component
  useEffect(() => {
    ;(window as any).__setIsMobileMenuOpen = setIsMobileMenuOpen

    return () => {
      delete (window as any).__setIsMobileMenuOpen
    }
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const mobileMenu = document.querySelector('[data-mobile-menu="true"]')
      const hamburgerButton = document.querySelector('[data-hamburger="true"]')

      if (
        isMobileMenuOpen &&
        mobileMenu &&
        !mobileMenu.contains(event.target as Node) &&
        hamburgerButton &&
        !hamburgerButton.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isMobileMenuOpen])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen type="dots" />
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white z-50 flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Droplets className="text-blue-500" size={24} />
          <span className="text-xl font-bold">FloodSense</span>
        </div>
        <div className="flex items-center gap-2">
          <Notifications />
          <button onClick={toggleMobileMenu} className="p-2" data-hamburger="true">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div
        data-mobile-menu="true"
        className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform lg:translate-x-0 transition-transform duration-300 z-40 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Droplets className="text-blue-500" size={24} />
            <span className="text-xl font-bold">FloodSense</span>
          </div>
          <div className="hidden lg:block">
            <Notifications />
          </div>
        </div>

        <nav className="p-4 space-y-2 mt-16 lg:mt-0">
          <Link
            to="/"
            className={`flex items-center gap-3 p-3 rounded-lg ${
              location.pathname === "/" ? "bg-blue-50 text-blue-700" : "hover:bg-blue-50 hover:text-blue-700"
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Home size={20} />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/map"
            className={`flex items-center gap-3 p-3 rounded-lg ${
              location.pathname === "/map" ? "bg-blue-50 text-blue-700" : "hover:bg-blue-50 hover:text-blue-700"
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Map size={20} />
            <span>Flood Map</span>
          </Link>
          <Link
            to="/alerts"
            className={`flex items-center gap-3 p-3 rounded-lg ${
              location.pathname === "/alerts" ? "bg-blue-50 text-blue-700" : "hover:bg-blue-50 hover:text-blue-700"
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Bell size={20} />
            <span>Alerts</span>
          </Link>
          <Link
            to="/safe-routes"
            className={`flex items-center gap-3 p-3 rounded-lg ${
              location.pathname === "/safe-routes" ? "bg-blue-50 text-blue-700" : "hover:bg-blue-50 hover:text-blue-700"
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <RouteIcon size={20} />
            <span>Safe Routes</span>
          </Link>
          <Link
            to="/shelters"
            className={`flex items-center gap-3 p-3 rounded-lg ${
              location.pathname === "/shelters" ? "bg-blue-50 text-blue-700" : "hover:bg-blue-50 hover:text-blue-700"
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Building2 size={20} />
            <span>Shelters</span>
          </Link>
          <Link
            to="/emergency-help"
            className={`flex items-center gap-3 p-3 rounded-lg ${
              location.pathname === "/emergency-help"
                ? "bg-blue-50 text-blue-700"
                : "hover:bg-blue-50 hover:text-blue-700"
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <PhoneCall size={20} />
            <span>Emergency Help</span>
          </Link>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gray-200 rounded-full p-2">
                <img
                  src={user?.avatar || "/placeholder.svg?height=40&width=40"}
                  alt={user?.name || "User"}
                  className="w-8 h-8 rounded-full"
                />
              </div>
              <div>
                <div className="font-medium">{user?.name || "Admin User"}</div>
                <div className="text-sm text-gray-500">{user?.email || "admin@floodwatch.com"}</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <MapView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <Alerts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/safe-routes"
            element={
              <ProtectedRoute>
                <SafeRoutes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shelters"
            element={
              <ProtectedRoute>
                <Shelters />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emergency-help"
            element={
              <ProtectedRoute>
                <EmergencyHelp />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  )
}

export default App

