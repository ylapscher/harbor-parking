import { createClient } from './server'
import { RegisterFormData, LoginFormData } from '@/lib/validations/auth'

export async function signUp(data: RegisterFormData) {
  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
        apartment_number: data.apartmentNumber,
        phone_number: data.phoneNumber,
      },
    },
  })

  if (authError) {
    return { user: null, error: authError }
  }

  // Create profile record (this will be handled by a database trigger in production)
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: data.email,
        full_name: data.fullName,
        apartment_number: data.apartmentNumber,
        phone_number: data.phoneNumber,
        is_approved: false,
        is_admin: false,
      })

    if (profileError) {
      return { user: null, error: profileError }
    }
  }

  return { user: authData.user, error: null }
}

export async function signIn(data: LoginFormData) {
  const supabase = await createClient()

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) {
    return { user: null, error }
  }

  return { user: authData.user, error: null }
}

export async function signOut() {
  const supabase = await createClient()
  return await supabase.auth.signOut()
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