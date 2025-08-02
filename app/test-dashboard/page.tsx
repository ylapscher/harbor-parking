'use client'

export default function TestDashboard() {
  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-4">Test Dashboard</h1>
        <p className="text-gray-300">
          If you can see this page, the basic routing is working.
        </p>
        <a 
          href="/dashboard" 
          className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Go to Full Dashboard
        </a>
      </div>
    </div>
  )
}