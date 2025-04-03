"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Info,
  Navigation2,
  RefreshCw,
  X,
  Maximize2,
  Minimize2,
  MapPin,
  AlertTriangle,
  MapIcon,
  Layers,
} from "lucide-react"
import { useAppContext } from "../context/AppContext"
import LoadingSpinner from "../components/LoadingSpinner"
import * as MapService from "../services/mapService"
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
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

interface Alert {
  id: string
  type: string
  location: string
  district: string
  severity: "Critical" | "High" | "Medium" | "Low"
  time: string
  coordinates: [number, number]
  description: string
}

// Component to update map view when center changes
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  map.setView(center, zoom)
  return null
}

export default function MapView() {
  const { isLoading, refreshData, mapAlerts, addAlert, userLocation } = useAppContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts")
  const [selectedLocality, setSelectedLocality] = useState("All Localities")
  const [selectedSeverity, setSelectedSeverity] = useState<string[]>(["High", "Critical"])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [showAlertDetails, setShowAlertDetails] = useState<string | null>(null)
  const [fullScreenMap, setFullScreenMap] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([11.1271, 78.6569]) // Tamil Nadu center
  const [mapZoom, setMapZoom] = useState(7)
  const [mapType, setMapType] = useState<"street" | "satellite">("street")
  const [showLayers, setShowLayers] = useState(false)
  const [showFloodZones, setShowFloodZones] = useState(true)
  const [showShelters, setShowShelters] = useState(true)
  const [showRoads, setShowRoads] = useState(true)

  // Set alerts from context
  useEffect(() => {
    if (mapAlerts.length > 0) {
      setAlerts(mapAlerts)
    }
  }, [mapAlerts])

  // Set user location as map center if available
  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng])
      setMapZoom(12)
    }
  }, [userLocation])

  // Filter alerts based on search, district, and severity
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      searchQuery === "" ||
      alert.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.type.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDistrict = selectedDistrict === "All Districts" || alert.district === selectedDistrict

    const matchesSeverity = selectedSeverity.includes(alert.severity)

    return matchesSearch && matchesDistrict && matchesSeverity
  })

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshData()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleSeverityFilter = (severity: string) => {
    if (selectedSeverity.includes(severity)) {
      setSelectedSeverity(selectedSeverity.filter((s) => s !== severity))
    } else {
      setSelectedSeverity([...selectedSeverity, severity])
    }
  }

  const handleViewAlertDetails = (alertId: string) => {
    setShowAlertDetails(alertId)

    // Find the alert
    const alert = alerts.find((a) => a.id === alertId)
    if (alert) {
      // Center map on alert
      setMapCenter(alert.coordinates)
      setMapZoom(15)
    }
  }

  const handleNavigateToAlert = (alertId: string) => {
    // Find the alert
    const alert = alerts.find((a) => a.id === alertId)
    if (alert) {
      // Center map on alert
      setMapCenter(alert.coordinates)
      setMapZoom(16)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "red"
      case "High":
        return "orange"
      case "Medium":
        return "yellow"
      case "Low":
        return "blue"
      default:
        return "blue"
    }
  }

  const getSeverityRadius = (severity: string) => {
    switch (severity) {
      case "Critical":
        return 2000
      case "High":
        return 1500
      case "Medium":
        return 1000
      case "Low":
        return 500
      default:
        return 500
    }
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className={`flex ${fullScreenMap ? "h-screen fixed inset-0 z-50 bg-white" : "h-screen"}`}>
      {/* Left Sidebar - Hidden when fullscreen */}
      {!fullScreenMap && (
        <div className="w-80 bg-white border-r p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Flood Map</h2>
            <button
              onClick={handleRefresh}
              className={`p-2 rounded-full hover:bg-gray-100 ${refreshing ? "animate-spin" : ""}`}
              disabled={refreshing}
            >
              <RefreshCw size={20} />
            </button>
          </div>

          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search areas..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>

          <div className="mb-6">
            <h3 className="font-medium mb-2">Filters</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">District</label>
                <select
                  className="w-full mt-1 border rounded-lg p-2"
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
              <div>
                <label className="text-sm text-gray-600">Locality</label>
                <select
                  className="w-full mt-1 border rounded-lg p-2"
                  value={selectedLocality}
                  onChange={(e) => setSelectedLocality(e.target.value)}
                >
                  <option>All Localities</option>
                  {selectedDistrict !== "All Districts" &&
                    MapService.tamilNaduLocalities[
                      selectedDistrict as keyof typeof MapService.tamilNaduLocalities
                    ]?.map((locality) => <option key={locality}>{locality}</option>)}
                  {selectedDistrict === "All Districts" &&
                    MapService.getAllLocalities().map((locality) => <option key={locality}>{locality}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Severity Level</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {["Low", "Medium", "High", "Critical"].map((level) => (
                    <button
                      key={level}
                      onClick={() => handleSeverityFilter(level)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedSeverity.includes(level)
                          ? level === "Critical"
                            ? "bg-red-500 text-white"
                            : level === "High"
                              ? "bg-orange-500 text-white"
                              : level === "Medium"
                                ? "bg-yellow-500 text-white"
                                : "bg-blue-500 text-white"
                          : "bg-gray-100"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium mb-3">Active Alerts</h3>
            <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <div key={alert.id} className="bg-white border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{alert.type}</h4>
                        <p className="text-sm text-gray-600">{alert.location}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          alert.severity === "Critical"
                            ? "bg-red-100 text-red-600"
                            : alert.severity === "High"
                              ? "bg-orange-100 text-orange-600"
                              : alert.severity === "Medium"
                                ? "bg-yellow-100 text-yellow-600"
                                : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                      <span>{alert.time}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewAlertDetails(alert.id)}
                          title="View Details"
                          className="hover:text-blue-600"
                        >
                          <Info size={16} />
                        </button>
                        <button
                          onClick={() => handleNavigateToAlert(alert.id)}
                          title="Navigate"
                          className="hover:text-blue-600"
                        >
                          <Navigation2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">No alerts match your filters</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Map Area */}
      <div className={`flex-1 relative ${fullScreenMap ? "w-full" : ""}`}>
        <div className="absolute inset-0 z-0">
          <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: "100%", width: "100%" }} zoomControl={false}>
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

            {/* Alert markers and circles */}
            {filteredAlerts.map((alert) => (
              <div key={alert.id}>
                <Marker position={alert.coordinates}>
                  <Popup>
                    <div className="p-2 max-w-xs">
                      <h3 className="font-medium text-lg">{alert.type}</h3>
                      <p className="text-sm text-gray-600 mb-1">
                        {alert.location}, {alert.district}
                      </p>
                      <p className="text-sm mb-2">{alert.description}</p>
                      <p className="text-xs text-gray-500">Updated: {alert.time}</p>
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => handleViewAlertDetails(alert.id)}
                          className="text-blue-500 text-sm hover:underline"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>

                {showFloodZones && (
                  <Circle
                    center={alert.coordinates}
                    radius={getSeverityRadius(alert.severity)}
                    pathOptions={{
                      color: getSeverityColor(alert.severity),
                      fillColor: getSeverityColor(alert.severity),
                      fillOpacity: 0.2,
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
          </MapContainer>
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button
            onClick={() => setFullScreenMap(!fullScreenMap)}
            className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-100"
            title={fullScreenMap ? "Exit Full Screen" : "Full Screen"}
          >
            {fullScreenMap ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>

          <button
            onClick={() => setMapType(mapType === "street" ? "satellite" : "street")}
            className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-100"
            title={`Switch to ${mapType === "street" ? "Satellite" : "Street"} View`}
          >
            <MapIcon size={20} />
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

        {/* Alert indicator for mobile */}
        {filteredAlerts.length > 0 && fullScreenMap && (
          <div className="absolute bottom-4 left-4 z-10 bg-white p-2 rounded-full shadow-md flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" />
            <span className="font-medium">{filteredAlerts.length} Active Alerts</span>
          </div>
        )}

        {/* Mobile sidebar toggle when in fullscreen */}
        {fullScreenMap && (
          <button
            onClick={() => setFullScreenMap(false)}
            className="absolute bottom-4 right-4 z-10 bg-blue-500 text-white p-3 rounded-full shadow-md"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Alert Details Modal */}
      {showAlertDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Alert Details</h3>
              <button onClick={() => setShowAlertDetails(null)} className="p-1 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            {alerts.find((a) => a.id === showAlertDetails) && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Alert Type</h4>
                  <p className="font-medium">{alerts.find((a) => a.id === showAlertDetails)?.type}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Location</h4>
                  <p>
                    {alerts.find((a) => a.id === showAlertDetails)?.location},{" "}
                    {alerts.find((a) => a.id === showAlertDetails)?.district}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Severity</h4>
                  <p
                    className={`${
                      alerts.find((a) => a.id === showAlertDetails)?.severity === "Critical"
                        ? "text-red-600"
                        : alerts.find((a) => a.id === showAlertDetails)?.severity === "High"
                          ? "text-orange-600"
                          : "text-yellow-600"
                    }`}
                  >
                    {alerts.find((a) => a.id === showAlertDetails)?.severity}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Description</h4>
                  <p>{alerts.find((a) => a.id === showAlertDetails)?.description}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Updated</h4>
                  <p>{alerts.find((a) => a.id === showAlertDetails)?.time}</p>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      // Send notification about this alert
                      const alert = alerts.find((a) => a.id === showAlertDetails)
                      if (alert) {
                        addAlert({
                          title: "Alert Shared",
                          message: `You've shared information about ${alert.type} in ${alert.location}`,
                          type: "info",
                        })
                      }
                      setShowAlertDetails(null)
                    }}
                    className="px-4 py-2 border rounded-lg"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => {
                      handleNavigateToAlert(showAlertDetails)
                      setShowAlertDetails(null)
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2"
                  >
                    <Navigation2 size={16} />
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

