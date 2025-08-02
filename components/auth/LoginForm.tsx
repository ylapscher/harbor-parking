'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/singleton'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('Please fill in both email and password')
      return
    }
    
    setLoading(true)
    setError('')

    try {
      // Check if Supabase is properly configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setError('Authentication service is not properly configured. Please contact support.')
        return
      }

      const supabase = getSupabaseClient()
      
      // Add timeout to prevent infinite loading
      const loginPromise = supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Login request timed out. Please try again.')), 30000)
      )

      const result = await Promise.race([loginPromise, timeoutPromise])
      const { data, error } = result as { data: { user: unknown } | null; error: { message?: string } | null }

      if (error) {
        console.error('Login error:', error)
        setError(error.message || 'Login failed. Please check your credentials.')
        return
      }

      if (data?.user) {
        console.log('Login successful, redirecting to dashboard')
        // Force page navigation
        window.location.href = '/dashboard'
      } else {
        setError('Login failed - no user returned')
      }
    } catch (err: unknown) {
      console.error('Login catch error:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6 text-white">Login</h1>
      
      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
            placeholder="Enter your email"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
            placeholder="Enter your password"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      
    </div>
  )
}