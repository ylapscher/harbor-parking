import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { getHttpStatusFromSupabaseError, formatSupabaseError } from '@/lib/utils/supabase-errors'

const CreateParkingSpotSchema = z.object({
  spot_number: z.string().min(1, 'Spot number is required'),
  location: z.string().min(1, 'Location is required'),
  notes: z.string().optional(),
})

const UpdateParkingSpotSchema = z.object({
  spot_number: z.string().min(1, 'Spot number is required').optional(),
  location: z.string().min(1, 'Location is required').optional(),
  notes: z.string().optional(),
})

async function getAuthenticatedUser(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  
  // Get the authorization header
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
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get('owner_id')

    let query = supabase
      .from('parking_spots')
      .select('*')
      .order('spot_number', { ascending: true })

    // If owner_id is provided, filter by owner
    if (ownerId) {
      query = query.eq('owner_id', ownerId)
    }

    const { data: spots, error } = await query

if (error) {
      console.error('Error fetching parking spots:', error)
      return NextResponse.json(
        { error: formatSupabaseError(error) },
        { status: getHttpStatusFromSupabaseError(error) }
      )
    }

    return NextResponse.json({ spots })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validationResult = CreateParkingSpotSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    const { spot_number, location } = validationResult.data
    const supabase = getSupabaseAdmin()

    // Check if spot number already exists for this user
    const { data: existingSpot } = await supabase
      .from('parking_spots')
      .select('id')
      .eq('owner_id', user.id)
      .eq('spot_number', spot_number)
      .single()

    if (existingSpot) {
      return NextResponse.json(
        { error: 'A parking spot with this number already exists' },
        { status: 409 }
      )
    }

    const { data: newSpot, error } = await supabase
      .from('parking_spots')
      .insert({
        owner_id: user.id,
        spot_number,
        location,
        is_active: true,
      })
      .select()
      .single()

if (error) {
      console.error('Error creating parking spot:', error)
      return NextResponse.json(
        { error: formatSupabaseError(error) },
        { status: getHttpStatusFromSupabaseError(error) }
      )
    }

    return NextResponse.json({ spot: newSpot }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Spot ID is required' },
        { status: 400 }
      )
    }

    const validationResult = UpdateParkingSpotSchema.safeParse(updateData)

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Check if spot exists and user owns it
    const { data: existingSpot } = await supabase
      .from('parking_spots')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single()

    if (!existingSpot) {
      return NextResponse.json(
        { error: 'Parking spot not found or you do not have permission to update it' },
        { status: 404 }
      )
    }

    const updatePayload: Record<string, string | undefined> = { ...validationResult.data }
    
    // No mapping needed; location is a column in DB

    const { data: updatedSpot, error } = await supabase
      .from('parking_spots')
      .update({
        ...updatePayload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('owner_id', user.id)
      .select()
      .single()

if (error) {
      console.error('Error updating parking spot:', error)
      return NextResponse.json(
        { error: formatSupabaseError(error) },
        { status: getHttpStatusFromSupabaseError(error) }
      )
    }

    return NextResponse.json({ spot: updatedSpot })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Spot ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Check if spot exists and user owns it
    const { data: existingSpot } = await supabase
      .from('parking_spots')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single()

    if (!existingSpot) {
      return NextResponse.json(
        { error: 'Parking spot not found or you do not have permission to delete it' },
        { status: 404 }
      )
    }

    // Delete associated availabilities first
    await supabase
      .from('availabilities')
      .delete()
      .eq('spot_id', id)

    // Delete the parking spot
    const { error } = await supabase
      .from('parking_spots')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id)

if (error) {
      console.error('Error deleting parking spot:', error)
      return NextResponse.json(
        { error: formatSupabaseError(error) },
        { status: getHttpStatusFromSupabaseError(error) }
      )
    }

    return NextResponse.json({ message: 'Parking spot deleted successfully' })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}