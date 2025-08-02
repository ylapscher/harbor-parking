import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const CreateAvailabilitySchema = z.object({
  spot_id: z.string().uuid('Invalid spot ID'),
  start_time: z.string().datetime('Invalid start time format'),
  end_time: z.string().datetime('Invalid end time format'),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
})

const UpdateAvailabilitySchema = z.object({
  start_time: z.string().datetime('Invalid start time format').optional(),
  end_time: z.string().datetime('Invalid end time format').optional(),
  notes: z.string().optional(),
  is_active: z.boolean().optional(),
})

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

function validateTimeRange(startTime: string, endTime: string) {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const now = new Date()

  if (start >= end) {
    return 'End time must be after start time'
  }

  if (start < now) {
    return 'Start time cannot be in the past'
  }

  return null
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
    
    const spotId = searchParams.get('spot_id')
    const isActive = searchParams.get('is_active')
    const available = searchParams.get('available') // only active and future availabilities

    let query = supabase
      .from('availabilities')
      .select('*')
      .order('start_time', { ascending: true })

    if (spotId) {
      query = query.eq('spot_id', spotId)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    if (available === 'true') {
      query = query
        .eq('is_active', true)
        .gt('end_time', new Date().toISOString())
    }

    const { data: availabilities, error } = await query

if (error) {
      console.error('Error fetching availabilities:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch availabilities' },
        { status: error.code === '42501' ? 403 : 500 }
      )
    }

    return NextResponse.json({ availabilities })
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
    const validationResult = CreateAvailabilitySchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    const { spot_id, start_time, end_time, notes, is_active } = validationResult.data

    // Validate time range
    const timeError = validateTimeRange(start_time, end_time)
    if (timeError) {
      return NextResponse.json(
        { error: timeError },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Check if user owns the parking spot
    const { data: spot } = await supabase
      .from('parking_spots')
      .select('*')
      .eq('id', spot_id)
      .eq('owner_id', user.id)
      .single()

    if (!spot) {
      return NextResponse.json(
        { error: 'Parking spot not found or you do not have permission to create availability for it' },
        { status: 404 }
      )
    }

    // Check for overlapping availabilities
    const { data: overlapping } = await supabase
      .from('availabilities')
      .select('*')
      .eq('spot_id', spot_id)
      .eq('is_active', true)
      .or(`and(start_time.lte.${end_time},end_time.gte.${start_time})`)

    if (overlapping && overlapping.length > 0) {
      return NextResponse.json(
        { error: 'This time range overlaps with an existing availability' },
        { status: 409 }
      )
    }

    const { data: newAvailability, error } = await supabase
      .from('availabilities')
      .insert({
        spot_id,
        start_time,
        end_time,
        notes: notes || null,
        is_active,
      })
      .select()
      .single()

if (error) {
      console.error('Error creating availability:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create availability' },
        { status: error.code === '42501' ? 403 : error.code === '23505' ? 409 : 500 }
      )
    }

    return NextResponse.json({ availability: newAvailability }, { status: 201 })
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
        { error: 'Availability ID is required' },
        { status: 400 }
      )
    }

    const validationResult = UpdateAvailabilitySchema.safeParse(updateData)

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

    // Check if availability exists and user owns the spot
    const { data: availability } = await supabase
      .from('availabilities')
      .select(`
        *,
        parking_spots (
          owner_id
        )
      `)
      .eq('id', id)
      .single()

    if (!availability || availability.parking_spots.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Availability not found or you do not have permission to update it' },
        { status: 404 }
      )
    }

    // Validate time range if both times are being updated
    if (validationResult.data.start_time && validationResult.data.end_time) {
      const timeError = validateTimeRange(
        validationResult.data.start_time,
        validationResult.data.end_time
      )
      if (timeError) {
        return NextResponse.json(
          { error: timeError },
          { status: 400 }
        )
      }
    }

    const { data: updatedAvailability, error } = await supabase
      .from('availabilities')
      .update({
        ...validationResult.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

if (error) {
      console.error('Error updating availability:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update availability' },
        { status: error.code === '42501' ? 403 : 500 }
      )
    }

    return NextResponse.json({ availability: updatedAvailability })
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
        { error: 'Availability ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Check if availability exists and user owns the spot
    const { data: availability } = await supabase
      .from('availabilities')
      .select(`
        *,
        parking_spots (
          owner_id
        )
      `)
      .eq('id', id)
      .single()

    if (!availability || availability.parking_spots.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Availability not found or you do not have permission to delete it' },
        { status: 404 }
      )
    }

    // Delete associated claims first
    await supabase
      .from('claims')
      .delete()
      .eq('availability_id', id)

    // Delete the availability
    const { error } = await supabase
      .from('availabilities')
      .delete()
      .eq('id', id)

if (error) {
      console.error('Error deleting availability:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to delete availability' },
        { status: error.code === '42501' ? 403 : 500 }
      )
    }

    return NextResponse.json({ message: 'Availability deleted successfully' })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}