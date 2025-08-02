'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { registerSchema, loginSchema } from '@/lib/validations/auth'

export async function signInAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validate input
  const result = loginSchema.safeParse({ email, password })
  if (!result.success) {
    return { error: 'Invalid email or password format' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function signUpAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const apartmentNumber = formData.get('apartmentNumber') as string
  const phoneNumber = formData.get('phoneNumber') as string

  // Validate input
  const result = registerSchema.safeParse({
    email,
    password,
    fullName,
    apartmentNumber,
    phoneNumber,
  })

  if (!result.success) {
    return { error: result.error.issues[0]?.message || 'Invalid input' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: {
        full_name: result.data.fullName,
        apartment_number: result.data.apartmentNumber,
        phone_number: result.data.phoneNumber,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Account created! Please check your email to verify your account.' }
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function getCurrentUser() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return { user: null, profile: null, error }
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { user, profile, error: profileError }
}