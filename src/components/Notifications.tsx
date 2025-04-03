"use client"
import { useState, useEffect, useRef } from "react"
import { Bell, X, Check, AlertTriangle, Info, CheckCircle, ChevronsUp, MapPin } from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { useNavigate } from "react-router-dom"

export default function Notifications() {
  const { alerts, markAlertAsRead, clearAllAlerts } = useAppContext()
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const navigate = useNavigate()

  const unreadCount = alerts.filter((alert) => !alert.read).length

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Close mobile menu when notifications are opened
  useEffect(() => {
    if (isOpen && window.__setIsMobileMenuOpen) {
      window.__setIsMobileMenuOpen(false)
    }
  }, [isOpen])

  // Add notification sound effect
  useEffect(() => {
    // Play sound when new notification arrives
    if (unreadCount > 0) {
      try {
        const audio = new Audio("/notification-sound.mp3")
        audio.volume = 0.5
        audio.play().catch((e) => console.log("Audio play failed:", e))
      } catch (error) {
        console.log("Audio error:", error)
      }
    }
  }, [unreadCount])

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="text-red-500" size={20} />
      case "warning":
        return <AlertTriangle className="text-amber-500" size={20} />
      case "success":
        return <CheckCircle className="text-green-500" size={20} />
      default:
        return <Info className="text-blue-500" size={20} />
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.round(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
  }

  const handleNavigateToAlert = (alert: any) => {
    if (alert.coordinates) {
      // Navigate to map view with these coordinates
      navigate("/map")

      // Close the notifications panel
      setIsOpen(false)

      // Mark the alert as read
      markAlertAsRead(alert.id)

      // We'll use localStorage to pass the coordinates to the map component
      localStorage.setItem(
        "mapNavigationTarget",
        JSON.stringify({
          coordinates: alert.coordinates,
          zoom: 15,
          title: alert.title,
          message: alert.message,
        }),
      )
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        id="notifications-button"
        className="relative p-2 rounded-full hover:bg-gray-100"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          id="notifications-dropdown"
          className={`absolute mt-2 bg-white rounded-lg shadow-lg z-50 overflow-hidden right-0 lg:right-0 max-h-[600px] lg:left-14`}
          style={{
            maxHeight: isExpanded ? "80vh" : "600px",
            width: "320px",
            transition: "max-height 0.3s ease",
          }}
        >
          <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
            <h3 className="font-medium">Notifications</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-500 hover:text-gray-700"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                <ChevronsUp
                  className={`transform ${isExpanded ? "rotate-180" : ""} transition-transform duration-300`}
                  size={16}
                />
              </button>
              <button
                onClick={() => clearAllAlerts()}
                className="text-sm text-gray-500 hover:text-gray-700"
                disabled={alerts.length === 0}
              >
                Clear All
              </button>
              <button onClick={() => setIsOpen(false)}>
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: "calc(100% - 56px)" }}>
            {alerts.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className={`p-4 border-b hover:bg-gray-50 ${!alert.read ? "bg-blue-50" : ""}`}>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">{getAlertIcon(alert.type)}</div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{alert.title}</h4>
                        {!alert.read && (
                          <button
                            onClick={() => markAlertAsRead(alert.id)}
                            className="text-blue-500 hover:text-blue-700"
                            aria-label="Mark as read"
                          >
                            <Check size={16} />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-gray-400">{formatTime(alert.timestamp)}</p>
                        {alert.coordinates && (
                          <button
                            onClick={() => handleNavigateToAlert(alert)}
                            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
                          >
                            <MapPin size={12} />
                            <span>View on map</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

