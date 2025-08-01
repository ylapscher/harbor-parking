import { LoginForm } from '@/components/auth/LoginForm'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Harbor Parking</h1>
          <p className="text-gray-600">Resident Parking Spot Sharing</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
