"use client"

import { useState } from "react"
import { Building2, Search, Phone, MessageSquare, RefreshCw } from "lucide-react"
import { useAppContext } from "../context/AppContext"
import LoadingSpinner from "../components/LoadingSpinner"

export default function Shelters() {
  const { shelters, coordinators, resources, refreshData, isLoading } = useAppContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshData()
    setTimeout(() => setRefreshing(false), 1000)
  }

  // Filter shelters based on search query
  const filteredShelters = shelters.filter(
    (shelter) =>
      shelter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shelter.location.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Calculate shelter stats
  const totalCapacity = shelters.reduce((total, shelter) => {
    const [current, max] = shelter.capacity.split("/").map(Number)
    return total + (max || 0)
  }, 0)

  const currentOccupancy = shelters.reduce((total, shelter) => {
    const [current] = shelter.capacity.split("/").map(Number)
    return total + (current || 0)
  }, 0)

  const availableSpaces = totalCapacity - currentOccupancy

  const shelterStats = [
    {
      title: "Total Active Shelters",
      value: shelters.length.toString(),
      icon: <Building2 className="text-blue-500" size={24} />,
    },
    {
      title: "Total Capacity",
      value: totalCapacity.toLocaleString(),
      icon: <Building2 className="text-blue-500" size={24} />,
    },
    {
      title: "Current Occupancy",
      value: currentOccupancy.toLocaleString(),
      icon: <Building2 className="text-blue-500" size={24} />,
    },
    {
      title: "Available Spaces",
      value: availableSpaces.toLocaleString(),
      icon: <Building2 className="text-blue-500" size={24} />,
    },
  ]

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Relief Connect</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={handleRefresh}
            className={`p-2 rounded-full hover:bg-gray-100 ${refreshing ? "animate-spin" : ""}`}
            disabled={refreshing}
          >
            <RefreshCw size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-gray-200 rounded-full p-2">
              <img src="/placeholder.svg?height=40&width=40" alt="John Doe" className="w-8 h-8 rounded-full" />
            </div>
            <span className="font-medium">John Doe</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {shelterStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{stat.title}</p>
                <h3 className="text-3xl font-bold mt-2">{stat.value}</h3>
              </div>
              <div className="bg-gray-50 p-3 rounded-full">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Shelters */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h2 className="text-xl font-semibold">Active Shelters</h2>
          <div className="relative w-full md:w-64 mt-2 md:mt-0">
            <input
              type="text"
              placeholder="Search shelters..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shelter Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resources
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredShelters.map((shelter, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{shelter.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{shelter.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{shelter.capacity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        shelter.status === "Available"
                          ? "bg-green-100 text-green-600"
                          : shelter.status === "Near Full"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-red-100 text-red-600"
                      }`}
                    >
                      {shelter.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        shelter.resources === "Adequate"
                          ? "bg-blue-100 text-blue-600"
                          : shelter.resources === "Low"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-red-100 text-red-600"
                      }`}
                    >
                      {shelter.resources}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{shelter.contact}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-blue-500 hover:text-blue-700">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resource Management */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Resource Management</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {resources.map((resource, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center gap-3 mb-4">
                {resource.icon}
                <div>
                  <h3 className="font-medium">{resource.name}</h3>
                  <span className="text-gray-500">{resource.percentage}%</span>
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full mb-4">
                <div
                  className={`h-full rounded-full ${
                    resource.percentage > 70
                      ? "bg-green-500"
                      : resource.percentage > 40
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${resource.percentage}%` }}
                ></div>
              </div>
              <button className="w-full border border-blue-500 text-blue-500 py-2 rounded-lg hover:bg-blue-50">
                Assign More
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Shelter Coordinators */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Shelter Coordinators</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {coordinators.map((coordinator, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={coordinator.avatar || "/placeholder.svg"}
                  alt={coordinator.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h3 className="font-medium">{coordinator.name}</h3>
                  <p className="text-gray-500 text-sm">{coordinator.role}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">{coordinator.shelter}</p>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
                  <Phone size={16} />
                  Call
                </button>
                <button className="flex items-center justify-center gap-2 border border-blue-500 text-blue-500 py-2 rounded-lg hover:bg-blue-50">
                  <MessageSquare size={16} />
                  Message
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

