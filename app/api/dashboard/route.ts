import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

async function getAuthenticatedUser(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'No authorization token provided' }
  }

  const token = authHeader.substring(7)
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return { user: null, error: 'Invalid or expired token' }
    }
    
    return { user, error: null }
  } catch {
    return { user: null, error: 'Failed to authenticate user' }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Fetch user's parking spots with availability status
    const { data: mySpots, error: spotsError } = await supabase
      .from('parking_spots')
      .select(`
        *,
        availabilities!inner (
          id,
          start_time,
          end_time,
          notes,
          is_active,
          created_at,
          updated_at
        )
      `)
      .eq('owner_id', user.id)
      .order('spot_number', { ascending: true })

    // Fetch available spots from other users (with spot and owner info)
    const { data: availableSpots, error: availableError } = await supabase
      .from('availabilities')
      .select(`
        *,
        parking_spots!inner (
          id,
          spot_number,
          location,
          notes,
          owner_id,
          profiles!inner (
            id,
            full_name,
            apartment_number
          )
        )
      `)
      .eq('is_active', true)
      .gt('end_time', new Date().toISOString())
      .neq('parking_spots.owner_id', user.id)
      .order('start_time', { ascending: true })

    // Fetch user's claims with related data
    const { data: myClaims, error: claimsError } = await supabase
      .from('claims')
      .select(`
        *,
        availabilities!inner (
          id,
          start_time,
          end_time,
          notes,
          parking_spots!inner (
            id,
            spot_number,
            location,
            notes,
            profiles!inner (
              id,
              full_name,
              apartment_number
            )
          )
        )
      `)
      .eq('claimer_id', user.id)
      .order('created_at', { ascending: false })

    // Fetch claims on user's spots (for spot owners to manage)
    const { data: claimsOnMySpots, error: claimsOnSpotsError } = await supabase
      .from('claims')
      .select(`
        *,
        profiles!claims_claimer_id_fkey (
          id,
          full_name,
          apartment_number
        ),
        availabilities!inner (
          id,
          start_time,
          end_time,
          notes,
          parking_spots!inner (
            id,
            spot_number,
            location,
            notes
          )
        )
      `)
      .eq('availabilities.parking_spots.owner_id', user.id)
      .order('created_at', { ascending: false })

    // Calculate statistics
    const stats = {
      mySpots: mySpots?.length || 0,
      availableSpots: availableSpots?.length || 0,
      activeClaims: myClaims?.filter(c => c.status === 'pending' || c.status === 'confirmed').length || 0,
      totalClaims: myClaims?.length || 0,
      pendingClaimsOnMySpots: claimsOnMySpots?.filter(c => c.status === 'pending').length || 0,
      confirmedClaimsOnMySpots: claimsOnMySpots?.filter(c => c.status === 'confirmed').length || 0,
    }

// Handle errors but don't fail completely
    const errors = []
    if (spotsError) {
      console.error('Error fetching parking spots:', spotsError)
      errors.push({ source: 'parking_spots', error: spotsError.message })
    }
    if (availableError) {
      console.error('Error fetching available spots:', availableError)
      errors.push({ source: 'available_spots', error: availableError.message })
    }
    if (claimsError) {
      console.error('Error fetching claims:', claimsError)
      errors.push({ source: 'my_claims', error: claimsError.message })
    }
    if (claimsOnSpotsError) {
      console.error('Error fetching claims on spots:', claimsOnSpotsError)
      errors.push({ source: 'claims_on_spots', error: claimsOnSpotsError.message })
    }

    return NextResponse.json({
      stats,
      mySpots: mySpots || [],
      availableSpots: availableSpots || [],
      myClaims: myClaims || [],
      claimsOnMySpots: claimsOnMySpots || [],
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}