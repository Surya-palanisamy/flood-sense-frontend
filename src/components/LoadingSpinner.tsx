interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  fullScreen?: boolean
  color?: string
  type?: "pulse" | "spin" | "dots"
}

export default function LoadingSpinner({
  size = "md",
  fullScreen = false,
  color = "blue",
  type = "spin",
}: LoadingSpinnerProps) {
  const sizeClass = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }[size]

  const colorClass = `border-${color}-500`

  const renderSpinner = () => {
    switch (type) {
      case "pulse":
        return <div className={`${sizeClass} bg-${color}-500 rounded-full animate-pulse`}></div>
      case "dots":
        return (
          <div className="flex space-x-2">
            <div
              className={`w-2 h-2 bg-${color}-500 rounded-full animate-bounce`}
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className={`w-2 h-2 bg-${color}-500 rounded-full animate-bounce`}
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className={`w-2 h-2 bg-${color}-500 rounded-full animate-bounce`}
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        )
      case "spin":
      default:
        return (
          <div className={`${sizeClass} border-4 ${colorClass} border-t-transparent rounded-full animate-spin`}></div>
        )
    }
  }

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
          {renderSpinner()}
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      </div>
    )
  }

  return <div className="flex justify-center items-center p-4">{renderSpinner()}</div>
}

