// OpenWeather API key would typically be stored in environment variables
const API_KEY = "75d756bab73f1670470fddb041740183"

export interface WeatherData {
  temp: number
  condition: string
  humidity: number
  rainfall: number
  icon: string
  location: string
  coordinates?: {
    lat: number
    lon: number
  }
}

export interface Coordinates {
  lat: number
  lon: number
}

// Get user's current location
export function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        })
      },
      (error) => {
        console.error("Error getting location:", error)
        // Default to Chennai if location access is denied (Tamil Nadu's capital)
        resolve({ lat: 13.0827, lon: 80.2707 })
      },
      { timeout: 10000, enableHighAccuracy: true },
    )
  })
}

// Get city name from coordinates using reverse geocoding
export async function getCityFromCoordinates(lat: number, lon: number): Promise<string> {
  try {
    // Use OpenWeather Geocoding API
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`,
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data && data.length > 0) {
      return data[0]?.name || "Unknown Location"
    }

    // Fallback to checking if coordinates are in Tamil Nadu
    const tamilNaduBounds = {
      north: 13.496,
      south: 8.077,
      east: 80.347,
      west: 76.231,
    }

    if (
      lat >= tamilNaduBounds.south &&
      lat <= tamilNaduBounds.north &&
      lon >= tamilNaduBounds.west &&
      lon <= tamilNaduBounds.east
    ) {
      // Determine closest major city in Tamil Nadu
      const cities = [
        { name: "Chennai", lat: 13.0827, lon: 80.2707 },
        { name: "Coimbatore", lat: 11.0168, lon: 76.9558 },
        { name: "Madurai", lat: 9.9252, lon: 78.1198 },
        { name: "Tiruchirappalli", lat: 10.7905, lon: 78.7047 },
        { name: "Salem", lat: 11.6643, lon: 78.146 },
      ]

      let closestCity = cities[0]
      let minDistance = calculateDistance(lat, lon, closestCity.lat, closestCity.lon)

      for (let i = 1; i < cities.length; i++) {
        const distance = calculateDistance(lat, lon, cities[i].lat, cities[i].lon)
        if (distance < minDistance) {
          minDistance = distance
          closestCity = cities[i]
        }
      }

      return closestCity.name
    }

    return "Unknown Location"
  } catch (error) {
    console.error("Error getting city name:", error)
    return "Unknown Location"
  }
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distance in km
  return distance
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}

export async function fetchWeatherData(city?: string, coordinates?: Coordinates): Promise<WeatherData> {
  try {
    let coords: Coordinates
    let locationName: string

    // If coordinates aren't provided, try to get current location
    if (!coordinates) {
      try {
        coords = await getCurrentLocation()
      } catch (error) {
        console.error("Failed to get current location:", error)
        // Default coordinates (Chennai, Tamil Nadu)
        coords = { lat: 13.0827, lon: 80.2707 }
      }
    } else {
      coords = coordinates
    }

    // Get city name if not provided
    if (!city) {
      locationName = await getCityFromCoordinates(coords.lat, coords.lon)
    } else {
      locationName = city
    }

    // Make actual API call to OpenWeather
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${API_KEY}`,
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Extract relevant data from API response
    const temp = Math.round(data.main.temp)
    const condition = data.weather[0].main
    const humidity = data.main.humidity
    const rainfall = data.rain ? data.rain["1h"] || data.rain["3h"] || 0 : 0
    const icon = data.weather[0].icon

    return {
      temp,
      condition,
      humidity,
      rainfall,
      icon,
      location: locationName,
      coordinates: coords,
    }
  } catch (error) {
    console.error("Error fetching weather data:", error)
    // Return fallback data
    return {
      temp: 30,
      condition: "Partly Cloudy",
      humidity: 78,
      rainfall: 25,
      icon: "02d",
      location: city || "Chennai",
    }
  }
}

// Function to get weather icon URL
export function getWeatherIconUrl(icon: string): string {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`
}

