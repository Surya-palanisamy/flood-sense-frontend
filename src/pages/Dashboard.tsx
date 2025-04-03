"use client"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

import { useState, useEffect, type FormEvent } from "react"
import { Droplets, RefreshCw, AlertTriangle, ArrowUp, ArrowDown, MapPin } from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { fetchWeatherData, getWeatherIconUrl, type WeatherData, getCurrentLocation } from "../services/weatherService"
import LoadingSpinner from "../components/LoadingSpinner"

export default function Dashboard() {
  const { isLoading, refreshData, sendEmergencyBroadcast, user } = useAppContext()
  const [selectedLocation, setSelectedLocation] = useState("All Locations")
  const [selectedSeverity, setSelectedSeverity] = useState("All Severity Levels")
  const [refreshing, setRefreshing] = useState(false)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [broadcastMessage, setBroadcastMessage] = useState("")
  const [sendingBroadcast, setSendingBroadcast] = useState(false)

  const riskData = {
    low: { count: 3, color: "bg-green-500" },
    moderate: { count: 5, color: "bg-yellow-500" },
    high: { count: 2, color: "bg-red-500" },
  }

  const stats = {
    activeAlerts: { count: 12, change: "+2" },
    evacuated: { count: 1234, change: "+89" },
    rescueTeams: { count: 8, change: "-1" },
    openShelters: { count: 15, change: "+3" },
  }

  const floodLevels = {
    current: 2.3,
    predicted: 3.8,
    timeToPeak: "6 hours",
  }
  const waterLevelData = Array.from({ length: 8 }, (_, i) => ({
    time: `${String(i * 4).padStart(2, "0")}:00`,
    level: Math.random() * 3 + 1,
  }))

  // Fetch weather data on component mount
  useEffect(() => {
    loadWeatherData()
  }, [])

  const loadWeatherData = async () => {
    setWeatherLoading(true)
    try {
      // Get current location
      const coords = await getCurrentLocation()
      const data = await fetchWeatherData(undefined, coords)
      setWeather(data)
    } catch (error) {
      console.error("Failed to fetch weather data:", error)
      // Fallback to default location
      const data = await fetchWeatherData()
      setWeather(data)
    } finally {
      setWeatherLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshData()
    await loadWeatherData()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleSendBroadcast = async (e: FormEvent) => {
    e.preventDefault()
    if (broadcastMessage.trim()) {
      setSendingBroadcast(true)
      try {
        await sendEmergencyBroadcast(broadcastMessage)
        setBroadcastMessage("")
        setShowBroadcastModal(false)
      } catch (error) {
        console.error("Error sending broadcast:", error)
      } finally {
        setSendingBroadcast(false)
      }
    }
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen type="dots" />
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-0">Welcome, {user?.name || "User"}!</h1>
        <div className="flex flex-wrap gap-2 md:gap-4 w-full md:w-auto">
          <button
            onClick={handleRefresh}
            className={`flex items-center justify-center gap-2 px-3 md:px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg ${
              refreshing ? "animate-spin" : ""
            }`}
            disabled={refreshing}
          >
            <RefreshCw size={18} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 w-full sm:w-auto"
          >
            <AlertTriangle size={18} />
            <span>Emergency Broadcast</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <select
          className="px-4 py-2 border rounded-lg w-full md:w-auto"
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
        >
          <option>All Locations</option>
          <option>Downtown</option>
          <option>Riverside</option>
          <option>North District</option>
          <option>South Bay</option>
        </select>
        <select
          className="px-4 py-2 border rounded-lg w-full md:w-auto"
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
        >
          <option>All Severity Levels</option>
          <option>High</option>
          <option>Moderate</option>
          <option>Low</option>
        </select>
      </div>

      {/* Risk Zones */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6">
        {Object.entries(riskData).map(([level, data]) => (
          <div key={level} className="bg-white p-4 md:p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium capitalize">{level} Risk</h3>
                <div className="text-2xl md:text-3xl font-bold mt-2">{data.count}</div>
                <div className="text-gray-500 mt-1">Zones</div>
              </div>
              <div className={`w-12 h-12 md:w-16 md:h-16 ${data.color} rounded-full opacity-20`}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weather Card */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium mb-4">Current Weather</h3>
          {weatherLoading ? (
            <LoadingSpinner size="sm" type="pulse" />
          ) : weather ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-8">
              <div className="flex items-center">
                <div>
                  <div className="text-3xl md:text-4xl font-bold">{weather.temp}°C</div>
                  <div className="text-gray-500 mt-1">{weather.condition}</div>
                </div>
                <img
                  src={getWeatherIconUrl(weather.icon) || "/placeholder.svg"}
                  alt={weather.condition}
                  className="w-16 h-16"
                />
              </div>
              <div className="space-y-2 w-full">
                <div className="flex items-center gap-2">
                  <Droplets size={20} className="text-blue-500" />
                  <span>Humidity: {weather.humidity}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets size={20} className="text-blue-500" />
                  <span>Rainfall: {weather.rainfall}mm</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={20} className="text-blue-500" />
                  <span>Location: {weather.location}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Weather data unavailable</div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(stats).map(([key, data]) => (
            <div key={key} className="bg-white p-4 rounded-xl shadow-sm">
              <h4 className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, " $1")}</h4>
              <div className="text-xl md:text-2xl font-bold mt-2">{data.count}</div>
              <div
                className={`text-sm flex items-center ${
                  data.change.startsWith("+") ? "text-green-500" : "text-red-500"
                }`}
              >
                {data.change.startsWith("+") ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                <span>{data.change.substring(1)} from yesterday</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Flood Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium mb-4">Water Level Readings</h3>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={waterLevelData}>
              <XAxis dataKey="time" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Line type="monotone" dataKey="level" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium mb-4">Flood Level Predictions</h3>
          <div className="space-y-4">
            <div>
              <div className="text-gray-500 mb-1">Current Level</div>
              <div className="h-3 md:h-4 bg-green-500 rounded-full" style={{ width: "60%" }}></div>
              <div className="mt-1 font-medium">{floodLevels.current}m</div>
            </div>
            <div>
              <div className="text-gray-500 mb-1">Predicted Peak</div>
              <div className="h-3 md:h-4 bg-red-500 rounded-full" style={{ width: "90%" }}></div>
              <div className="mt-1 font-medium">{floodLevels.predicted}m</div>
            </div>
            <div className="pt-4 border-t">
              <div className="text-gray-500">Time to Peak</div>
              <div className="text-xl font-bold mt-1">{floodLevels.timeToPeak}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Send Emergency Broadcast</h3>
            <form onSubmit={handleSendBroadcast}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Broadcast Message</label>
                <textarea
                  className="w-full p-2 border rounded-lg h-32"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Enter emergency broadcast message..."
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!broadcastMessage.trim() || sendingBroadcast}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {sendingBroadcast ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Broadcast</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

