"use client"

import { useState, type FormEvent } from "react"
import { Bell, AlertTriangle, Info, Trash2, Edit, Send, Users, Bot, MessageSquare, RefreshCw } from "lucide-react"
import { useAppContext } from "../context/AppContext"
import LoadingSpinner from "../components/LoadingSpinner"

export default function Alerts() {
  const { isLoading, refreshData, sendEmergencyBroadcast, addAlert } = useAppContext()
  const [messageTitle, setMessageTitle] = useState("")
  const [messageContent, setMessageContent] = useState("")
  const [notificationType, setNotificationType] = useState("SMS")
  const [refreshing, setRefreshing] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showNewAlertModal, setShowNewAlertModal] = useState(false)
  const [newAlertTitle, setNewAlertTitle] = useState("")
  const [newAlertMessage, setNewAlertMessage] = useState("")
  const [newAlertType, setNewAlertType] = useState("warning")
  const [sendingAlert, setSendingAlert] = useState(false)

  const alertStats = [
    { title: "Total Active Alerts", value: "12", icon: <Bell className="text-blue-500" size={20} /> },
    { title: "High Risk Alerts", value: "3", icon: <AlertTriangle className="text-red-500" size={20} /> },
    { title: "Pending Acknowledgments", value: "245", icon: <MessageSquare className="text-orange-500" size={20} /> },
    { title: "Average Response Time", value: "4.2m", icon: <Info className="text-green-500" size={20} /> },
  ]

  const activeAlerts = [
    {
      id: "A001",
      status: "red",
      title: "Severe Weather Warning",
      riskLevel: "High",
      timeIssued: "10:45 AM",
      responseRate: "78%",
    },
    {
      id: "A002",
      status: "orange",
      title: "Road Closure Alert",
      riskLevel: "Moderate",
      timeIssued: "09:30 AM",
      responseRate: "92%",
    },
    {
      id: "A003",
      status: "blue",
      title: "Public Transport Delay",
      riskLevel: "Low",
      timeIssued: "08:15 AM",
      responseRate: "65%",
    },
  ]

  const aiSuggestions = [
    {
      id: "S001",
      severity: "Moderate",
      confidence: "89%",
      message: "Heavy rainfall expected in the next 24 hours. Consider issuing a flood warning for low-lying areas.",
    },
    {
      id: "S002",
      severity: "Low",
      confidence: "95%",
      message: "Traffic congestion detected on Main Street due to road work. Suggest alternate routes.",
    },
  ]

  const responseData = [
    {
      id: "R001",
      title: "Severe Weather Warning",
      time: "10:45 AM",
      delivered: "12,458",
      responded: "9,468",
    },
    {
      id: "R002",
      title: "Road Closure Alert",
      time: "09:30 AM",
      delivered: "12,458",
      responded: "11,442",
    },
  ]

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshData()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleSendAlert = async (e: FormEvent) => {
    e.preventDefault()
    if (messageTitle && messageContent) {
      setSendingAlert(true)
      try {
        await sendEmergencyBroadcast(`${messageTitle}: ${messageContent}`)
        setMessageTitle("")
        setMessageContent("")
      } catch (error) {
        console.error("Error sending alert:", error)
      } finally {
        setSendingAlert(false)
      }
    }
  }

  const handleDeleteAlert = (id: string) => {
    setSelectedAlert(id)
    setShowDeleteModal(true)
  }

  const confirmDeleteAlert = () => {
    // In a real app, this would call an API to delete the alert
    console.log(`Deleting alert ${selectedAlert}`)
    setShowDeleteModal(false)
    setSelectedAlert(null)
  }

  const handleUseAiSuggestion = (suggestion: any) => {
    setMessageTitle(`AI Suggested: ${suggestion.severity} Alert`)
    setMessageContent(suggestion.message)
  }

  const handleCreateNewAlert = async (e: FormEvent) => {
    e.preventDefault()
    if (newAlertTitle && newAlertMessage) {
      setSendingAlert(true)
      try {
        await addAlert({
          title: newAlertTitle,
          message: newAlertMessage,
          type: newAlertType as any,
        })
        setNewAlertTitle("")
        setNewAlertMessage("")
        setShowNewAlertModal(false)
      } catch (error) {
        console.error("Error creating alert:", error)
      } finally {
        setSendingAlert(false)
      }
    }
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen type="dots" />
  }

  return (
    <div className="p-4 md:p-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {alertStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Active Alerts Table */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="flex justify-between items-center p-4 md:p-6 border-b">
              <h2 className="text-lg md:text-xl font-semibold">Active Alerts</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  className={`p-2 rounded-full hover:bg-gray-100 ${refreshing ? "animate-spin" : ""}`}
                  disabled={refreshing}
                >
                  <RefreshCw size={20} />
                </button>
                <button
                  onClick={() => setShowNewAlertModal(true)}
                  className="flex items-center gap-2 bg-blue-500 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  <Bell size={18} />
                  <span className="hidden sm:inline">Issue New Alert</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Alert Title
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Risk Level
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Time Issued
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Response Rate
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activeAlerts.map((alert) => (
                    <tr key={alert.id}>
                      <td className="px-4 md:px-6 py-4">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            alert.status === "red"
                              ? "bg-red-500"
                              : alert.status === "orange"
                                ? "bg-orange-500"
                                : "bg-blue-500"
                          }`}
                        ></div>
                      </td>
                      <td className="px-4 md:px-6 py-4 font-medium">{alert.title}</td>
                      <td className="px-4 md:px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            alert.riskLevel === "High"
                              ? "bg-red-100 text-red-600"
                              : alert.riskLevel === "Moderate"
                                ? "bg-orange-100 text-orange-600"
                                : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {alert.riskLevel}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-gray-500">{alert.timeIssued}</td>
                      <td className="px-4 md:px-6 py-4 font-medium">{alert.responseRate}</td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex gap-2">
                          <button className="text-gray-400 hover:text-gray-600">
                            <Edit size={16} />
                          </button>
                          <button
                            className="text-gray-400 hover:text-gray-600"
                            onClick={() => handleDeleteAlert(alert.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Send Emergency Notification */}
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-6">Send Emergency Notification</h2>
            <form onSubmit={handleSendAlert} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notification Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {["SMS", "App Notification", "Website Banner"].map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setNotificationType(type)}
                      className={`p-3 rounded-lg text-center ${
                        notificationType === type
                          ? "bg-blue-50 text-blue-600 border-2 border-blue-200"
                          : "bg-gray-50 text-gray-600 border-2 border-transparent"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message Title</label>
                <input
                  type="text"
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  placeholder="Enter alert title"
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message Content</label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Enter alert message"
                  rows={4}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Users size={20} className="text-gray-500" />
                  <span>All Residents (12,458)</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!messageTitle || !messageContent || sendingAlert}
                className="w-full bg-red-500 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-red-500"
              >
                {sendingAlert ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    <span>Send Emergency Alert</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Response Monitoring */}
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-6">Response Monitoring</h2>
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <svg className="w-24 h-24 md:w-32 md:h-32">
                  <circle
                    className="text-gray-200"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r="56"
                    cx="64"
                    cy="64"
                  />
                  <circle
                    className="text-green-500"
                    strokeWidth="10"
                    strokeDasharray={76 * 3.14}
                    strokeDashoffset={((100 - 76) / 100) * 3.14 * 56}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="56"
                    cx="64"
                    cy="64"
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="text-xl md:text-2xl font-bold">76%</div>
                  <div className="text-xs md:text-sm text-gray-500">Response Rate</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {responseData.map((data) => (
                <div key={data.id} className="border-t pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{data.title}</h4>
                      <p className="text-sm text-gray-500">{data.time}</p>
                    </div>
                    <div className="bg-green-50 p-1 rounded">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span>Delivered: {data.delivered}</span>
                    <span className="mx-2">•</span>
                    <span>Responded: {data.responded}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI-Suggested Alerts */}
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6">
              <Bot size={24} className="text-blue-500" />
              <h2 className="text-lg md:text-xl font-semibold">AI-Suggested Alerts</h2>
            </div>
            <div className="space-y-4">
              {aiSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="bg-blue-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        suggestion.severity === "Moderate"
                          ? "bg-orange-100 text-orange-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {suggestion.severity}
                    </span>
                    <span className="text-sm text-gray-500">Confidence: {suggestion.confidence}</span>
                  </div>
                  <p className="text-gray-700 mb-3">{suggestion.message}</p>
                  <button
                    className="text-blue-600 text-sm font-medium"
                    onClick={() => handleUseAiSuggestion(suggestion)}
                  >
                    Use This
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Alert Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-6">Are you sure you want to delete this alert? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border rounded-lg">
                Cancel
              </button>
              <button onClick={confirmDeleteAlert} className="px-4 py-2 bg-red-500 text-white rounded-lg">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Alert Modal */}
      {showNewAlertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Create New Alert</h3>
            <form onSubmit={handleCreateNewAlert}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alert Title</label>
                  <input
                    type="text"
                    value={newAlertTitle}
                    onChange={(e) => setNewAlertTitle(e.target.value)}
                    placeholder="Enter alert title"
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alert Message</label>
                  <textarea
                    value={newAlertMessage}
                    onChange={(e) => setNewAlertMessage(e.target.value)}
                    placeholder="Enter alert message"
                    rows={4}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alert Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewAlertType("info")}
                      className={`p-2 rounded-lg flex items-center justify-center gap-1 ${
                        newAlertType === "info" ? "bg-blue-100 text-blue-600 border border-blue-300" : "bg-gray-50"
                      }`}
                    >
                      <Info size={16} />
                      <span>Info</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewAlertType("warning")}
                      className={`p-2 rounded-lg flex items-center justify-center gap-1 ${
                        newAlertType === "warning"
                          ? "bg-yellow-100 text-yellow-600 border border-yellow-300"
                          : "bg-gray-50"
                      }`}
                    >
                      <AlertTriangle size={16} />
                      <span>Warning</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewAlertType("error")}
                      className={`p-2 rounded-lg flex items-center justify-center gap-1 ${
                        newAlertType === "error" ? "bg-red-100 text-red-600 border border-red-300" : "bg-gray-50"
                      }`}
                    >
                      <AlertTriangle size={16} />
                      <span>Error</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewAlertModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newAlertTitle || !newAlertMessage || sendingAlert}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {sendingAlert ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Alert</span>
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

