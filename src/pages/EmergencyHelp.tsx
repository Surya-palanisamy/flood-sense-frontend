"use client"

import { useState } from "react"
import {
  Search,
  Filter,
  MapPin,
  CheckCircle,
  XCircle,
  Users,
  AlertTriangle,
  Activity,
  RefreshCw,
  Send,
} from "lucide-react"
import { useAppContext } from "../context/AppContext"
import LoadingSpinner from "../components/LoadingSpinner"
import MapViews from "./map"

export default function EmergencyHelp() {
  const {
    volunteers,
    teams,
    emergencyCases,
    helpRequests,
    isLoading,
    refreshData,
    updateHelpRequest,
    assignTeam,
    sendEmergencyBroadcast,
  } = useAppContext()

  const [searchQuery, setSearchQuery] = useState("")
  const [broadcastMessage, setBroadcastMessage] = useState("")
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [selectedEmergencyId, setSelectedEmergencyId] = useState<string | null>(null)
  const [showAssignTeamModal, setShowAssignTeamModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const stats = [
    {
      title: "Total Volunteers",
      value: volunteers.length,
      icon: <Users className="text-blue-500" size={24} />,
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Teams",
      value: teams.filter((team) => team.status === "Active").length,
      icon: <Users className="text-green-500" size={24} />,
      bgColor: "bg-green-50",
    },
    {
      title: "Pending Requests",
      value: helpRequests.filter((req) => req.status === "Pending").length,
      icon: <AlertTriangle className="text-amber-500" size={24} />,
      bgColor: "bg-amber-50",
    },
    {
      title: "Active Emergency Cases",
      value: emergencyCases.length,
      icon: <Activity className="text-red-500" size={24} />,
      bgColor: "bg-red-50",
    },
  ]

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshData()
    setTimeout(() => setRefreshing(false), 1000) // Ensure spinner shows for at least 1 second
  }

  const handleUpdateHelpRequest = async (id: string, status: "Completed" | "Rejected") => {
    await updateHelpRequest(id, status)
  }

  const handleAssignTeam = async () => {
    if (selectedEmergencyId && selectedTeamId) {
      await assignTeam(selectedEmergencyId, selectedTeamId)
      setShowAssignTeamModal(false)
      setSelectedEmergencyId(null)
      setSelectedTeamId(null)
    }
  }

  const handleSendBroadcast = async () => {
    if (broadcastMessage.trim()) {
      await sendEmergencyBroadcast(broadcastMessage)
      setBroadcastMessage("")
      setShowBroadcastModal(false)
    }
  }

  const openAssignTeamModal = (emergencyId: string) => {
    setSelectedEmergencyId(emergencyId)
    setShowAssignTeamModal(true)
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">RescueOps</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={handleRefresh}
            className={`p-2 rounded-full hover:bg-gray-100 ${refreshing ? "animate-spin" : ""}`}
            disabled={refreshing}
          >
            <RefreshCw size={20} />
          </button>
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            <Send size={20} />
            <span className="hidden sm:inline">Emergency Broadcast</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} rounded-lg p-4 flex items-center`}>
            <div className="mr-4 p-3 rounded-full bg-white">{stat.icon}</div>
            <div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.title}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Map Section */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h2 className="text-xl font-semibold">Active Volunteers Map</h2>
          <div className="flex items-center gap-2 mt-2 md:mt-0 w-full md:w-auto">
            <div className="relative flex-grow md:w-64">
              <input
                type="text"
                placeholder="Search location..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg">
              <Filter size={20} />
              <span>Filters</span>
            </button>
          </div>
        </div>
        <div className="bg-gray-100 h-80 rounded-lg relative">
          <div className="h-80 rounded-lg overflow-hidden">
            <MapViews />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Emergency Cases */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Active Emergency Cases</h2>
          </div>
          <div className="space-y-4">
            {emergencyCases.map((emergency, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <div
                  className={`px-3 py-1 text-sm font-medium ${
                    emergency.priority === "High"
                      ? "bg-red-100 text-red-600"
                      : emergency.priority === "Medium"
                        ? "bg-orange-100 text-orange-600"
                        : "bg-green-100 text-green-600"
                  }`}
                >
                  {emergency.priority} Priority
                </div>
                <div className="p-4">
                  <div className="font-medium">{emergency.location}</div>
                  <div className="text-gray-600">{emergency.type}</div>
                  <div className="text-sm text-gray-500 mt-1">{emergency.description}</div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-sm text-gray-500">{emergency.volunteersAssigned} volunteers assigned</div>
                    <button
                      onClick={() => openAssignTeamModal(emergency.id)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Assign Team
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Help Requests */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Help Requests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-gray-500 text-sm">
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Location</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {helpRequests.map((request, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-3">{request.id}</td>
                    <td className="px-4 py-3">{request.location}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          request.status === "Pending"
                            ? "bg-yellow-100 text-yellow-600"
                            : request.status === "In Progress"
                              ? "bg-blue-100 text-blue-600"
                              : request.status === "Completed"
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-600"
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateHelpRequest(request.id, "Completed")}
                          className="text-green-500 hover:text-green-700"
                          disabled={request.status === "Completed" || request.status === "Rejected"}
                        >
                          <CheckCircle size={20} />
                        </button>
                        <button
                          onClick={() => handleUpdateHelpRequest(request.id, "Rejected")}
                          className="text-red-500 hover:text-red-700"
                          disabled={request.status === "Completed" || request.status === "Rejected"}
                        >
                          <XCircle size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Active Teams */}
      <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-xl font-semibold mb-4">Active Teams</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-gray-500 text-sm border-b">
                <th className="px-4 py-2">Team ID</th>
                <th className="px-4 py-2">Team Name</th>
                <th className="px-4 py-2">Location</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Members</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => (
                <tr key={index} className="border-b">
                  <td className="px-4 py-3">{team.id}</td>
                  <td className="px-4 py-3 font-medium">{team.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <MapPin size={16} className="text-gray-400" />
                      {team.location}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        team.status === "Active"
                          ? "bg-green-100 text-green-600"
                          : team.status === "On Call"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {team.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex -space-x-2">
                      {team.members.slice(0, 5).map((member, i) => (
                        <img
                          key={i}
                          src="/placeholder.svg?height=32&width=32"
                          alt={`Team Member ${i + 1}`}
                          className="w-8 h-8 rounded-full border-2 border-white"
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button className="px-3 py-1 border border-blue-500 text-blue-500 rounded hover:bg-blue-50">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Team Modal */}
      {showAssignTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Assign Team</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Team</label>
              <select
                className="w-full p-2 border rounded-lg"
                value={selectedTeamId || ""}
                onChange={(e) => setSelectedTeamId(e.target.value)}
              >
                <option value="">Select a team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAssignTeamModal(false)} className="px-4 py-2 border rounded-lg">
                Cancel
              </button>
              <button
                onClick={handleAssignTeam}
                disabled={!selectedTeamId}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Send Emergency Broadcast</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Broadcast Message</label>
              <textarea
                className="w-full p-2 border rounded-lg h-32"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Enter emergency broadcast message..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowBroadcastModal(false)} className="px-4 py-2 border rounded-lg">
                Cancel
              </button>
              <button
                onClick={handleSendBroadcast}
                disabled={!broadcastMessage.trim()}
                className="px-4 py-2 bg-red-500 text-white rounded-lg disabled:opacity-50"
              >
                Send Broadcast
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

