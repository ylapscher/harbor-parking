'use client'

import { useState } from 'react'
import { signInAction } from '@/lib/actions/auth'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  // const [email, setEmail] = useState('')
  // const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (formData: FormData) => {
    // e.preventDefault()
    
    // const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true'
    // const log = DEBUG ? console.log : () => {}
    // const logGroup = DEBUG ? console.group : () => {}
    // const logGroupEnd = DEBUG ? console.groupEnd : () => {}
    // const logTime = DEBUG ? console.time : () => {}
    // const logTimeEnd = DEBUG ? console.timeEnd : () => {}
    
    // logGroup('🔐 Login attempt started')
    // log('Login details:', {
    //   email: email.trim(),
    //   hasPassword: !!password,
    //   timestamp: new Date().toISOString()
    // })
    
    // if (!email || !password) {
    //   log('❌ Missing credentials')
    //   setError('Please fill in both email and password')
    //   logGroupEnd()
    //   return
    // }
    
    setLoading(true)
    // setError('')

    try {
      const result = await signInAction(formData)

      if (!result.success) {
        setError(result.message)
        return
      }

      router.push('/dashboard')
      // log('✅ Supabase client created')
      
      // logTime('⏱️ loginRequest')
      // log('🚀 Starting login request...')
      
      // Add timeout to prevent infinite loading
      // const loginStartTime = performance.now()
      // const loginPromise = supabase.auth.signInWithPassword({
      //   email: email.trim(),
      //   password,
      // })

      // const timeoutPromise = new Promise((_, reject) =>
      //   setTimeout(() => reject(new Error('Login request timed out. Please check your internet connection and try again.')), 15000)
      // )

      // const result = await Promise.race([loginPromise, timeoutPromise])
      // const loginEndTime = performance.now()
      
      // logTimeEnd('⏱️ loginRequest')
      // log('📊 Login request timing:', {
      //   duration: `${(loginEndTime - loginStartTime).toFixed(2)}ms`,
      //   timestamp: new Date().toISOString()
      // })
      
      // const { data, error } = result as { data: { user: unknown } | null; error: { message?: string } | null }

      // if (error) {
      //   console.error('Login error:', error)
      //   setError(error.message || 'Login failed. Please check your credentials.')
      //   return
      // }

      // if (data?.user) {
      //   console.log('Login successful, redirecting to dashboard')
      //   // Store login success in localStorage as backup
      //   localStorage.setItem('harbor-login-success', Date.now().toString())
      //   localStorage.setItem('harbor-user-email', (data.user as { email?: string })?.email || '')
        
      //   setLoading(false)
      //   setTimeout(() => {
      //     window.location.href = '/dashboard'
      //   }, 100)
      // } else {
      //   setError('Login failed - no user returned')
      // }
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
      
      <form action={handleLogin} className="space-y-4">
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
            name='email'
            // value={email}
            // onChange={(e) => setEmail(e.target.value)}
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
            name='password'
            // value={password}
            // onChange={(e) => setPassword(e.target.value)}
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