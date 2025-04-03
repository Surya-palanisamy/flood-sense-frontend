"use client"

import { useState, useEffect, useRef, type FormEvent } from "react"
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Users,
  Printer,
  Download,
  Send,
  Info,
  Navigation,
  RefreshCw,
  X,
  MapPin,
  MapIcon,
  Layers,
  Search,
} from "lucide-react"
import { useAppContext } from "../context/AppContext"
import LoadingSpinner from "../components/LoadingSpinner"
import * as MapService from "../services/mapService"
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-routing-machine"
import L from "leaflet"

// Fix for default marker icons in react-leaflet
import icon from "leaflet/dist/images/marker-icon.png"
import iconShadow from "leaflet/dist/images/marker-shadow.png"

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

// Define types for our data
interface Route {
  id: string
  name: string
  status: "Open" | "Warning" | "Closed"
  statusColor: string
  updated: string
  startPoint: [number, number]
  endPoint: [number, number]
  district: string
}

interface Update {
  id: string
  time: string
  title: string
  description: string
  severity: "High" | "Medium" | "Low"
}

interface Communication {
  id: string
  title: string
  time: string
  recipients: string
  status: "Delivered" | "Pending" | "Failed"
}

// Component to update map view when center changes
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  map.setView(center, zoom)
  return null
}

export default function SafeRoutes() {
  const { refreshData, sendEmergencyBroadcast, isLoading, userLocation, addAlert } = useAppContext()
  const [selectedView, setSelectedView] = useState("Traffic")
  const [notificationMessage, setNotificationMessage] = useState("")
  const [notificationPriority, setNotificationPriority] = useState("High")
  const [notificationRecipients, setNotificationRecipients] = useState("All Recipients")
  const [refreshing, setRefreshing] = useState(false)
  const [routes, setRoutes] = useState<Route[]>([])
  const [updates, setUpdates] = useState<Update[]>([])
  const [communications, setCommunications] = useState<Communication[]>([])
  const [showRouteDetails, setShowRouteDetails] = useState<string | null>(null)
  const [sendingNotification, setSendingNotification] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([11.1271, 78.6569]) // Tamil Nadu center
  const [mapZoom, setMapZoom] = useState(7)
  const [mapType, setMapType] = useState<"street" | "satellite">("street")
  const [showLayers, setShowLayers] = useState(false)
  const [showFloodZones, setShowFloodZones] = useState(true)
  const [showShelters, setShowShelters] = useState(true)
  const [showRoads, setShowRoads] = useState(true)
  const [fullScreenMap, setFullScreenMap] = useState(false)
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts")
  const [searchQuery, setSearchQuery] = useState("")
  const [routingControl, setRoutingControl] = useState<L.Routing.Control | null>(null)
  const [customRoute, setCustomRoute] = useState<{
    start: [number, number] | null
    end: [number, number] | null
  }>({ start: null, end: null })

  const mapRef = useRef<L.Map | null>(null)

  const stats = [
    {
      title: "Active Evacuations",
      value: "3",
      icon: <AlertTriangle className="text-red-500" size={20} />,
      className: "border-red-100",
    },
    {
      title: "Blocked Roads",
      value: "12",
      icon: <AlertCircle className="text-orange-500" size={20} />,
      className: "border-orange-100",
    },
    {
      title: "Safe Routes",
      value: "8",
      icon: <CheckCircle2 className="text-green-500" size={20} />,
      className: "border-green-100",
    },
    {
      title: "Active Users",
      value: "1,247",
      icon: <Users className="text-blue-500" size={20} />,
      className: "border-blue-100",
    },
  ]

  // Load mock data on mount
  useEffect(() => {
    loadMockData()
  }, [])

  // Set user location as map center if available
  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng])
      setMapZoom(12)
    }
  }, [userLocation])

  // Check for navigation target from notifications
  useEffect(() => {
    const navigationTarget = localStorage.getItem("mapNavigationTarget")
    if (navigationTarget) {
      try {
        const target = JSON.parse(navigationTarget)
        if (target.coordinates) {
          setMapCenter(target.coordinates)
          setMapZoom(target.zoom || 15)

          // Clear the navigation target
          localStorage.removeItem("mapNavigationTarget")
        }
      } catch (error) {
        console.error("Error parsing navigation target:", error)
      }
    }
  }, [])

  const loadMockData = async () => {
    // Generate Tamil Nadu based routes
    const tamilNaduRoutes: Route[] = MapService.tamilNaduDistricts.slice(0, 8).map((district, index) => {
      const statusOptions = ["Open", "Warning", "Closed", "Open", "Open", "Warning", "Open", "Closed"]
      const statusColorOptions = [
        "text-green-500",
        "text-orange-500",
        "text-red-500",
        "text-green-500",
        "text-green-500",
        "text-orange-500",
        "text-green-500",
        "text-red-500",
      ]
      const updatedOptions = [
        "2 mins ago",
        "5 mins ago",
        "12 mins ago",
        "15 mins ago",
        "20 mins ago",
        "25 mins ago",
        "30 mins ago",
        "35 mins ago",
      ]

      // Generate a random end point near the district
      const endLat = district.coordinates[0] + (Math.random() * 0.1 - 0.05)
      const endLng = district.coordinates[1] + (Math.random() * 0.1 - 0.05)

      return {
        id: `route${index + 1}`,
        name: `${district.name} Evacuation Route`,
        status: statusOptions[index] as "Open" | "Warning" | "Closed",
        statusColor: statusColorOptions[index],
        updated: updatedOptions[index],
        startPoint: district.coordinates,
        endPoint: [endLat, endLng],
        district: district.name,
      }
    })
    setRoutes(tamilNaduRoutes)

    // Generate updates based on routes
    const generatedUpdates: Update[] = tamilNaduRoutes.slice(0, 3).map((route, index) => {
      const severityOptions = ["High", "Medium", "Low"]
      const descriptionOptions = [
        `Road closure due to flooding in ${route.district}`,
        `Heavy traffic congestion in ${route.district}`,
        `Route cleared and reopened in ${route.district}`,
      ]

      return {
        id: `update${index + 1}`,
        time: new Date(Date.now() - 1000 * 60 * (15 * (index + 1))).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        title: `${route.district} ${index === 0 ? "Bridge" : index === 1 ? "Highway Exit" : "Route"}`,
        description: descriptionOptions[index],
        severity: severityOptions[index] as "High" | "Medium" | "Low",
      }
    })
    setUpdates(generatedUpdates)

    // Generate communications
    const generatedCommunications: Communication[] = [
      {
        id: "comm1",
        title: "Emergency evacuation required for Chennai area",
        time: new Date(Date.now() - 1000 * 60 * 15).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        recipients: "1,247",
        status: "Delivered",
      },
      {
        id: "comm2",
        title: "New safe route available via Coimbatore East",
        time: new Date(Date.now() - 1000 * 60 * 30).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        recipients: "892",
        status: "Delivered",
      },
    ]
    setCommunications(generatedCommunications)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshData()
    await loadMockData()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleSendNotification = async (e: FormEvent) => {
    e.preventDefault()
    if (!notificationMessage.trim()) return

    setSendingNotification(true)
    try {
      await sendEmergencyBroadcast(
        notificationMessage,
        selectedDistrict !== "All Districts" ? selectedDistrict : undefined,
      )

      // Add to communications list
      const newCommunication: Communication = {
        id: `comm${communications.length + 1}`,
        title: notificationMessage,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        recipients: notificationRecipients === "All Recipients" ? "1,247" : "500",
        status: "Delivered",
      }

      setCommunications([newCommunication, ...communications])
      setNotificationMessage("")

      // Show success notification
      addAlert({
        title: "Notification Sent",
        message: `Your emergency notification has been sent to ${notificationRecipients}`,
        type: "success",
      })
    } catch (error) {
      console.error("Error sending notification:", error)

      // Show error notification
      addAlert({
        title: "Notification Failed",
        message: "There was an error sending your notification. Please try again.",
        type: "error",
      })
    } finally {
      setSendingNotification(false)
    }
  }

  const handleViewRouteDetails = (routeId: string) => {
    setShowRouteDetails(routeId)

    // Find the route
    const route = routes.find((r) => r.id === routeId)
    if (route) {
      // Center map on route
      const center: [number, number] = [
        (route.startPoint[0] + route.endPoint[0]) / 2,
        (route.startPoint[1] + route.endPoint[1]) / 2,
      ]
      setMapCenter(center)
      setMapZoom(12)

      // Calculate route
      if (mapRef.current) {
        // Remove existing routing control
        if (routingControl) {
          mapRef.current.removeControl(routingControl)
        }

        // Create new routing control
        const newRoutingControl = MapService.calculateRoute(
          mapRef.current,
          route.startPoint,
          route.endPoint,
          route.status === "Open" ? "green" : route.status === "Warning" ? "orange" : "red",
        )

        setRoutingControl(newRoutingControl)
      }
    }
  }

  const handlePrintMap = () => {
    window.print()
  }

  const handleDownloadMap = () => {
    // In a real app, this would generate and download a map image
    addAlert({
      title: "Map Downloaded",
      message: "The map has been downloaded to your device.",
      type: "success",
    })
  }

  // Filter routes based on search and district
  const filteredRoutes = routes.filter((route) => {
    const matchesSearch =
      searchQuery === "" ||
      route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.district.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDistrict = selectedDistrict === "All Districts" || route.district === selectedDistrict

    return matchesSearch && matchesDistrict
  })

  // Handle map click for custom routing
  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (!customRoute.start) {
      setCustomRoute({
        start: [e.latlng.lat, e.latlng.lng],
        end: null,
      })

      // Show notification
      addAlert({
        title: "Start Point Selected",
        message: "Now click on the map to select your destination point.",
        type: "info",
      })
    } else if (!customRoute.end) {
      setCustomRoute({
        ...customRoute,
        end: [e.latlng.lat, e.latlng.lng],
      })

      // Calculate route
      if (mapRef.current && customRoute.start) {
        // Remove existing routing control
        if (routingControl) {
          mapRef.current.removeControl(routingControl)
        }

        // Create new routing control
        const newRoutingControl = MapService.calculateRoute(
          mapRef.current,
          customRoute.start,
          [e.latlng.lat, e.latlng.lng],
          "blue",
        )

        setRoutingControl(newRoutingControl)

        // Show notification
        addAlert({
          title: "Route Calculated",
          message: "Your custom route has been calculated. You can click on the map again to create a new route.",
          type: "success",
        })
      }
    } else {
      // Reset and start new route
      setCustomRoute({
        start: [e.latlng.lat, e.latlng.lng],
        end: null,
      })

      // Show notification
      addAlert({
        title: "New Route Started",
        message: "Now click on the map to select your destination point.",
        type: "info",
      })
    }
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="p-4 md:p-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className={`bg-white rounded-xl p-4 md:p-6 shadow-sm border ${stat.className}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{stat.title}</p>
                <h3 className="text-2xl md:text-3xl font-bold mt-2">{stat.value}</h3>
              </div>
              <div className="bg-gray-50 p-3 rounded-full">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Routes List and Map */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map Controls */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setMapType(mapType === "street" ? "satellite" : "street")}
                  className={`px-4 py-2 rounded-lg ${
                    mapType === "street" ? "bg-blue-50 text-blue-600" : "text-gray-600"
                  }`}
                >
                  {mapType === "street" ? "Street View" : "Satellite View"}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  className={`p-2 text-gray-600 hover:bg-gray-100 rounded-lg ${refreshing ? "animate-spin" : ""}`}
                  disabled={refreshing}
                >
                  <RefreshCw size={20} />
                </button>
                <button onClick={handlePrintMap} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Printer size={20} />
                </button>
                <button onClick={handleDownloadMap} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Download size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Map Area */}
          <div className="bg-gray-100 h-[500px] rounded-lg relative overflow-hidden">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
              whenCreated={(map) => {
                mapRef.current = map
                map.on("click", handleMapClick)
              }}
            >
              <ChangeView center={mapCenter} zoom={mapZoom} />

              {/* Base map layer */}
              {mapType === "street" ? (
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              ) : (
                <TileLayer
                  attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              )}

              {/* Route markers and lines */}
              {filteredRoutes.map((route) => (
                <div key={route.id}>
                  <Marker position={route.startPoint}>
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-medium">Start: {route.name}</h3>
                        <p className="text-sm text-gray-600">Status: {route.status}</p>
                        <p className="text-sm text-gray-500">Updated: {route.updated}</p>
                        <button
                          onClick={() => handleViewRouteDetails(route.id)}
                          className="mt-2 text-blue-500 text-sm hover:underline"
                        >
                          View Route Details
                        </button>
                      </div>
                    </Popup>
                  </Marker>

                  <Marker position={route.endPoint}>
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-medium">End: {route.name}</h3>
                        <p className="text-sm text-gray-600">Status: {route.status}</p>
                      </div>
                    </Popup>
                  </Marker>

                  {showRoads && (
                    <Polyline
                      positions={[route.startPoint, route.endPoint]}
                      pathOptions={{
                        color: route.status === "Open" ? "green" : route.status === "Warning" ? "orange" : "red",
                        weight: 3,
                        opacity: route.status === "Closed" ? 0.5 : 1,
                        dashArray: route.status === "Warning" ? "10, 10" : undefined,
                      }}
                    />
                  )}
                </div>
              ))}

              {/* User location marker */}
              {userLocation && (
                <Marker
                  position={[userLocation.lat, userLocation.lng]}
                  icon={
                    new L.Icon({
                      iconUrl:
                        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
                      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      shadowSize: [41, 41],
                    })
                  }
                >
                  <Popup>
                    <div className="p-1">
                      <p className="font-medium">Your Location</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Custom route markers */}
              {customRoute.start && (
                <Marker
                  position={customRoute.start}
                  icon={
                    new L.Icon({
                      iconUrl:
                        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
                      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      shadowSize: [41, 41],
                    })
                  }
                >
                  <Popup>
                    <div className="p-1">
                      <p className="font-medium">Start Point</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {customRoute.end && (
                <Marker
                  position={customRoute.end}
                  icon={
                    new L.Icon({
                      iconUrl:
                        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
                      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      shadowSize: [41, 41],
                    })
                  }
                >
                  <Popup>
                    <div className="p-1">
                      <p className="font-medium">End Point</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>

            {/* Map Controls */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              <button
                onClick={() => setFullScreenMap(!fullScreenMap)}
                className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-100"
                title={fullScreenMap ? "Exit Full Screen" : "Full Screen"}
              >
                {fullScreenMap ? <X size={20} /> : <MapIcon size={20} />}
              </button>

              <button
                onClick={() => setShowLayers(!showLayers)}
                className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-100"
                title="Map Layers"
              >
                <Layers size={20} />
              </button>

              {userLocation && (
                <button
                  onClick={() => {
                    setMapCenter([userLocation.lat, userLocation.lng])
                    setMapZoom(15)
                  }}
                  className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-100"
                  title="Go to My Location"
                >
                  <MapPin size={20} />
                </button>
              )}
            </div>

            {/* Map Layers Panel */}
            {showLayers && (
              <div className="absolute top-4 left-4 z-10 bg-white p-3 rounded-lg shadow-md">
                <h3 className="font-medium mb-2">Map Layers</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showFloodZones}
                      onChange={() => setShowFloodZones(!showFloodZones)}
                      className="rounded"
                    />
                    <span>Flood Zones</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showShelters}
                      onChange={() => setShowShelters(!showShelters)}
                      className="rounded"
                    />
                    <span>Shelters</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showRoads}
                      onChange={() => setShowRoads(!showRoads)}
                      className="rounded"
                    />
                    <span>Safe Routes</span>
                  </label>
                </div>
              </div>
            )}

            {/* Map Instructions */}
            <div className="absolute bottom-4 left-4 z-10 bg-white p-3 rounded-lg shadow-md max-w-xs">
              <h3 className="font-medium mb-1">Create Custom Route</h3>
              <p className="text-sm text-gray-600">
                {!customRoute.start
                  ? "Click on the map to set your starting point"
                  : !customRoute.end
                    ? "Now click to set your destination"
                    : "Route created! Click again to start a new route"}
              </p>
            </div>
          </div>

          {/* Active Routes */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Active Routes</h2>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <input
                    type="text"
                    placeholder="Search routes..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                </div>
                <select
                  className="p-2 border rounded-lg"
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value)
                    // If a specific district is selected, find its coordinates and center the map
                    if (e.target.value !== "All Districts") {
                      const district = MapService.tamilNaduDistricts.find((d) => d.name === e.target.value)
                      if (district) {
                        setMapCenter(district.coordinates)
                        setMapZoom(11)
                      }
                    } else {
                      // Reset to Tamil Nadu center
                      setMapCenter([11.1271, 78.6569])
                      setMapZoom(7)
                    }
                  }}
                >
                  <option>All Districts</option>
                  {MapService.tamilNaduDistricts.map((district) => (
                    <option key={district.name}>{district.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="divide-y max-h-[300px] overflow-y-auto">
              {filteredRoutes.length > 0 ? (
                filteredRoutes.map((route) => (
                  <div key={route.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <h3 className="font-medium">{route.name}</h3>
                      <p className="text-sm text-gray-500">Updated {route.updated}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-medium ${route.statusColor}`}>{route.status}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewRouteDetails(route.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="View Details"
                        >
                          <Info size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setMapCenter(route.startPoint)
                            setMapZoom(14)
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Navigate"
                        >
                          <Navigation size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">No routes match your search criteria</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Updates and Communications */}
        <div className="space-y-6">
          {/* Push Notifications */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-xl font-semibold mb-4">Push Notifications</h2>
            <form onSubmit={handleSendNotification} className="space-y-4">
              <textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Enter notification message..."
                className="w-full p-3 border rounded-lg h-32"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  className="p-2 border rounded-lg"
                  value={notificationRecipients}
                  onChange={(e) => setNotificationRecipients(e.target.value)}
                >
                  <option>All Recipients</option>
                  <option>Affected Areas Only</option>
                  <option>Emergency Personnel</option>
                </select>
                <select
                  className="p-2 border rounded-lg"
                  value={notificationPriority}
                  onChange={(e) => setNotificationPriority(e.target.value as any)}
                >
                  <option>High Priority</option>
                  <option>Medium Priority</option>
                  <option>Low Priority</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600 disabled:opacity-50"
                disabled={!notificationMessage.trim() || sendingNotification}
              >
                {sendingNotification ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    <span>Send Notification</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Recent Updates */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-xl font-semibold mb-4">Recent Updates</h2>
            <div className="space-y-4">
              {updates.map((update) => (
                <div key={update.id} className="border-l-4 border-l-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{update.title}</h3>
                      <p className="text-sm text-gray-500">{update.description}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        update.severity === "High"
                          ? "bg-red-100 text-red-600"
                          : update.severity === "Medium"
                            ? "bg-orange-100 text-orange-600"
                            : "bg-green-100 text-green-600"
                      }`}
                    >
                      {update.severity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{update.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Communications */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-xl font-semibold mb-4">Recent Communications</h2>
            <div className="space-y-4">
              {communications.map((comm, index) => (
                <div key={comm.id} className="border-t pt-4 first:border-t-0 first:pt-0">
                  <h3 className="font-medium">{comm.title}</h3>
                  <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                    <span>{comm.time}</span>
                    <span>{comm.recipients} recipients</span>
                    <span className="text-green-500">{comm.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Route Details Modal */}
      {showRouteDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Route Details</h3>
              <button onClick={() => setShowRouteDetails(null)} className="p-1 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            {routes.find((r) => r.id === showRouteDetails) && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Route Name</h4>
                  <p className="font-medium">{routes.find((r) => r.id === showRouteDetails)?.name}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">District</h4>
                  <p>{routes.find((r) => r.id === showRouteDetails)?.district}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <p className={routes.find((r) => r.id === showRouteDetails)?.statusColor}>
                    {routes.find((r) => r.id === showRouteDetails)?.status}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Last Updated</h4>
                  <p>{routes.find((r) => r.id === showRouteDetails)?.updated}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Traffic Conditions</h4>
                  <p>
                    {routes.find((r) => r.id === showRouteDetails)?.status === "Open"
                      ? "Clear traffic, route is fully operational"
                      : routes.find((r) => r.id === showRouteDetails)?.status === "Warning"
                        ? "Heavy traffic, expect delays"
                        : "Route closed due to flooding"}
                  </p>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      // Share route information
                      const route = routes.find((r) => r.id === showRouteDetails)
                      if (route) {
                        addAlert({
                          title: "Route Shared",
                          message: `You've shared information about ${route.name}`,
                          type: "info",
                        })
                      }
                      setShowRouteDetails(null)
                    }}
                    className="px-4 py-2 border rounded-lg"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => {
                      // Navigate to route
                      const route = routes.find((r) => r.id === showRouteDetails)
                      if (route) {
                        setMapCenter(route.startPoint)
                        setMapZoom(14)

                        // Add to recent updates
                        const newUpdate: Update = {
                          id: `update${updates.length + 1}`,
                          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                          title: `Navigation to ${route.name}`,
                          description: `Navigation started to ${route.district} via ${route.name}`,
                          severity: "Low",
                        }
                        setUpdates([newUpdate, ...updates])
                      }
                      setShowRouteDetails(null)
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2"
                  >
                    <Navigation size={16} />
                    <span>Navigate</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

