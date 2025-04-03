import L from "leaflet"
import "leaflet-routing-machine"

// Initialize Leaflet map
export function initializeMap(elementId: string, center: [number, number] = [11.1271, 78.6569], zoom = 7) {
  // Make sure the element exists
  const mapElement = document.getElementById(elementId)
  if (!mapElement) {
    console.error(`Map element with id ${elementId} not found`)
    return null
  }

  // Create the map
  const map = L.map(elementId, {
    zoomControl: false, // We'll add zoom control in a better position
    attributionControl: true,
    minZoom: 6,
    maxZoom: 18,
  }).setView(center, zoom)

  // Add zoom control to the top-right
  L.control
    .zoom({
      position: "topright",
    })
    .addTo(map)

  // Add OpenStreetMap tile layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map)

  return map
}

// Add a marker to the map
export function addMarker(map: L.Map, position: [number, number], options: L.MarkerOptions = {}) {
  const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })

  return L.marker(position, { icon: defaultIcon, ...options }).addTo(map)
}

// Add a circle to the map (for flood zones)
export function addFloodZone(
  map: L.Map,
  position: [number, number],
  radius: number,
  options: L.CircleOptions = { color: "blue", fillColor: "#30c", fillOpacity: 0.2 },
) {
  return L.circle(position, { radius, ...options }).addTo(map)
}

// Add a polyline to the map (for routes)
export function addRoute(
  map: L.Map,
  points: [number, number][],
  options: L.PolylineOptions = { color: "green", weight: 5 },
) {
  return L.polyline(points, options).addTo(map)
}

// Create a popup
export function createPopup(map: L.Map, position: [number, number], content: string) {
  return L.popup().setLatLng(position).setContent(content).openOn(map)
}

// Calculate and display route between two points using Leaflet Routing Machine
export function calculateRoute(map: L.Map, start: [number, number], end: [number, number], color = "blue") {
  // Remove existing routing control if any
  map.eachLayer((layer) => {
    if (layer instanceof L.Routing.Control) {
      map.removeControl(layer)
    }
  })

  // Create new routing control
  const routingControl = L.Routing.control({
    waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
    routeWhileDragging: false,
    showAlternatives: true,
    altLineOptions: {
      styles: [
        { color: "black", opacity: 0.15, weight: 9 },
        { color: "white", opacity: 0.8, weight: 6 },
        { color: "gray", opacity: 0.5, weight: 4 },
      ],
    },
    lineOptions: {
      styles: [
        { color: "black", opacity: 0.15, weight: 9 },
        { color: "white", opacity: 0.8, weight: 6 },
        { color, opacity: 0.8, weight: 4 },
      ],
    },
    createMarker: () => null, // Don't create markers for waypoints
  }).addTo(map)

  return routingControl
}

// Get route between two points (simplified for demo)
export function getRoute(start: [number, number], end: [number, number]): [number, number][] {
  // In a real app, this would call a routing API
  // For demo, we'll just create a simple route with a few points
  const midPoint: [number, number] = [
    (start[0] + end[0]) / 2 + (Math.random() * 0.01 - 0.005),
    (start[1] + end[1]) / 2 + (Math.random() * 0.01 - 0.005),
  ]

  return [start, midPoint, end]
}

// Get flood risk level for a location (simplified for demo)
export function getFloodRiskLevel(position: [number, number]): "Low" | "Medium" | "High" {
  // In a real app, this would call an API or use stored data
  // For demo, we'll use a simple random function
  const random = Math.random()
  if (random < 0.3) return "Low"
  if (random < 0.7) return "Medium"
  return "High"
}

// Tamil Nadu districts data
export const tamilNaduDistricts = [
  { name: "Chennai", coordinates: [13.0827, 80.2707] },
  { name: "Coimbatore", coordinates: [11.0168, 76.9558] },
  { name: "Madurai", coordinates: [9.9252, 78.1198] },
  { name: "Tiruchirappalli", coordinates: [10.7905, 78.7047] },
  { name: "Salem", coordinates: [11.6643, 78.146] },
  { name: "Tirunelveli", coordinates: [8.7139, 77.7567] },
  { name: "Tiruppur", coordinates: [11.1085, 77.3411] },
  { name: "Erode", coordinates: [11.341, 77.7172] },
  { name: "Vellore", coordinates: [12.9165, 79.1325] },
  { name: "Thoothukkudi", coordinates: [8.7642, 78.1348] },
  { name: "Dindigul", coordinates: [10.3624, 77.9695] },
  { name: "Thanjavur", coordinates: [10.787, 79.1378] },
  { name: "Ranipet", coordinates: [12.9277, 79.3193] },
  { name: "Sivaganga", coordinates: [9.8433, 78.4809] },
  { name: "Kanyakumari", coordinates: [8.0883, 77.5385] },
  { name: "Namakkal", coordinates: [11.2189, 78.1674] },
  { name: "Karur", coordinates: [10.9601, 78.0766] },
  { name: "Tiruvarur", coordinates: [10.7661, 79.6344] },
  { name: "Nagapattinam", coordinates: [10.7672, 79.8449] },
  { name: "Krishnagiri", coordinates: [12.5266, 78.2141] },
  { name: "Cuddalore", coordinates: [11.748, 79.7714] },
  { name: "Dharmapuri", coordinates: [12.121, 78.1582] },
  { name: "Kanchipuram", coordinates: [12.8185, 79.6947] },
  { name: "Tiruvannamalai", coordinates: [12.2253, 79.0747] },
  { name: "Pudukkottai", coordinates: [10.3833, 78.8001] },
  { name: "Nilgiris", coordinates: [11.4916, 76.7337] },
  { name: "Ramanathapuram", coordinates: [9.3639, 78.8395] },
  { name: "Virudhunagar", coordinates: [9.568, 77.9624] },
  { name: "Ariyalur", coordinates: [11.14, 79.0786] },
  { name: "Perambalur", coordinates: [11.2342, 78.8807] },
  { name: "Kallakurichi", coordinates: [11.7383, 78.9571] },
  { name: "Tenkasi", coordinates: [8.9598, 77.3161] },
  { name: "Chengalpattu", coordinates: [12.6819, 79.9888] },
  { name: "Mayiladuthurai", coordinates: [11.1014, 79.6583] },
  { name: "Tirupattur", coordinates: [12.495, 78.5686] },
  { name: "Villupuram", coordinates: [11.9401, 79.4861] },
  { name: "Theni", coordinates: [10.0104, 77.4768] },
  { name: "Thoothukkudi", coordinates: [8.7642, 78.1348] },
]

// Tamil Nadu localities/areas data
export const tamilNaduLocalities = {
  Chennai: ["Adyar", "Anna Nagar", "T. Nagar", "Mylapore", "Velachery", "Porur", "Tambaram", "Guindy"],
  Coimbatore: ["Peelamedu", "R.S. Puram", "Singanallur", "Saibaba Colony", "Ganapathy"],
  Madurai: ["Goripalayam", "Mattuthavani", "Tirupparankundram", "Anaiyur", "Vilangudi"],
  Tiruchirappalli: ["Srirangam", "Thillai Nagar", "Woraiyur", "K.K. Nagar", "Ariyamangalam"],
  Salem: ["Hasthampatti", "Fairlands", "Alagapuram", "Kondalampatti", "Suramangalam"],
  "All Districts": ["All Localities"],
}

// Get all localities as a flat array
export const getAllLocalities = () => {
  const allLocalities: string[] = []
  Object.values(tamilNaduLocalities).forEach((localities) => {
    localities.forEach((locality) => {
      if (!allLocalities.includes(locality) && locality !== "All Localities") {
        allLocalities.push(locality)
      }
    })
  })
  return allLocalities
}

// Tamil Nadu flood-prone areas (for demo)
export const floodProneAreas = [
  { name: "Adyar River Basin", district: "Chennai", coordinates: [13.0067, 80.2565], riskLevel: "High" },
  { name: "Cooum River Area", district: "Chennai", coordinates: [13.0756, 80.261], riskLevel: "Critical" },
  { name: "Velachery", district: "Chennai", coordinates: [12.9815, 80.2176], riskLevel: "High" },
  { name: "Mudichur", district: "Chennai", coordinates: [12.9107, 80.0689], riskLevel: "Critical" },
  { name: "Vaigai River Basin", district: "Madurai", coordinates: [9.9252, 78.1198], riskLevel: "Medium" },
  { name: "Cauvery River Delta", district: "Thanjavur", coordinates: [10.787, 79.1378], riskLevel: "High" },
  { name: "Thamirabarani River", district: "Tirunelveli", coordinates: [8.7139, 77.7567], riskLevel: "Medium" },
  { name: "Bhavani River", district: "Erode", coordinates: [11.341, 77.7172], riskLevel: "Medium" },
  { name: "Palar River Basin", district: "Vellore", coordinates: [12.9165, 79.1325], riskLevel: "Low" },
  { name: "Noyyal River", district: "Coimbatore", coordinates: [11.0168, 76.9558], riskLevel: "Medium" },
]

// Generate mock alerts based on flood-prone areas
export function generateMockAlerts() {
  return floodProneAreas
    .filter(() => Math.random() > 0.5)
    .map((area, index) => {
      const timeAgo = Math.floor(Math.random() * 60) + 5
      const alertTypes = ["Flash Flood Warning", "Water Level Rising", "Heavy Rainfall Alert", "Dam Release Warning"]
      const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)]

      return {
        id: `alert-${index}`,
        type: alertType,
        location: area.name,
        district: area.district,
        severity: area.riskLevel as "Low" | "Medium" | "High" | "Critical",
        time: `${timeAgo} mins ago`,
        coordinates: area.coordinates as [number, number],
        description: `${alertType} issued for ${area.name} in ${area.district} district. Take necessary precautions.`,
      }
    })
}

