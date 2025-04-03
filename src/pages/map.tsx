"use client"

import { useState } from "react"

import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet"
import L, { Icon, type LatLngExpression } from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default marker icons in react-leaflet
const defaultIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

L.Marker.prototype.options.icon = defaultIcon

export default function MapViews() {
  const [searchQuery, setSearchQuery] = useState("")

  // Center coordinates updated to Chennai
  const center: LatLngExpression = [13.0827, 80.2707]

  const alerts = [
    {
      type: "Flash Flood Warning",
      location: "Marina Beach",
      severity: "Critical",
      time: "10 mins ago",
      coordinates: [13.05, 80.2824],
      radius: 1000, // meters
    },
    {
      type: "Water Level Rising",
      location: "Adyar River",
      severity: "High",
      time: "25 mins ago",
      coordinates: [13.0213, 80.2497],
      radius: 800,
    },
    {
      type: "Road Closure",
      location: "Anna Nagar",
      severity: "Medium",
      time: "1 hour ago",
      coordinates: [13.086, 80.21],
      radius: 500,
    },
  ]

  const shelters = [
    {
      name: "Community Center",
      capacity: "145/200",
      available: 55,
      occupied: "73% Occupied",
    },
    {
      name: "High School Gym",
      capacity: "82/150",
      available: 68,
      occupied: "55% Occupied",
    },
  ]

  const routes = [
    {
      name: "Route A: Marina → Mount Road",
      duration: "25 mins",
      status: "Clear",
    },
    {
      name: "Route B: Adyar → Guindy",
      duration: "35 mins",
      status: "Heavy Traffic",
    },
  ]

  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}

      {/* Main Map Area */}
      <div className="flex-1 relative">
        <div style={{ height: "100%", width: "100%", position: "absolute" }}>
          <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
            <TileLayer attribution="" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Render alert markers and circles */}
            {alerts.map((alert, index) => (
              <div key={index}>
                <Marker position={alert.coordinates as LatLngExpression} icon={defaultIcon}>
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-medium">{alert.type}</h3>
                      <p className="text-sm text-gray-600">{alert.location}</p>
                      <p className="text-sm text-gray-500">{alert.time}</p>
                    </div>
                  </Popup>
                </Marker>
                <Circle
                  center={alert.coordinates as LatLngExpression}
                  radius={alert.radius}
                  pathOptions={{
                    color: alert.severity === "Critical" ? "red" : alert.severity === "High" ? "orange" : "yellow",
                    fillColor:
                      alert.severity === "Critical"
                        ? "#ff000033"
                        : alert.severity === "High"
                          ? "#ffa50033"
                          : "#ffff0033",
                    fillOpacity: 0.3,
                  }}
                />
              </div>
            ))}
          </MapContainer>
        </div>

        {/* Overlay Panel */}
      </div>
    </div>
  )
}

