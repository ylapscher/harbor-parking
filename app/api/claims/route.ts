import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const CreateClaimSchema = z.object({
  availability_id: z.string().uuid('Invalid availability ID'),
  notes: z.string().optional(),
})

const UpdateClaimSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'expired', 'cancelled', 'released']).optional(),
  notes: z.string().optional(),
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
    
    const claimerId = searchParams.get('claimer_id')
    const availabilityId = searchParams.get('availability_id')
    const status = searchParams.get('status')

    let query = supabase
      .from('claims')
      .select('*')
      .order('created_at', { ascending: false })

    if (claimerId) {
      query = query.eq('claimer_id', claimerId)
    }

    if (availabilityId) {
      query = query.eq('availability_id', availabilityId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: claims, error } = await query

if (error) {
      console.error('Error fetching claims:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch claims' },
        { status: error.code === '42501' ? 403 : 500 }
      )
    }

    return NextResponse.json({ claims })
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
    const validationResult = CreateClaimSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    const { availability_id, notes } = validationResult.data
    const supabase = getSupabaseAdmin()

    // Check if availability exists and is still active
    const { data: availability } = await supabase
      .from('availabilities')
      .select(`
        *,
        parking_spots (
          owner_id,
          spot_number
        )
      `)
      .eq('id', availability_id)
      .eq('is_active', true)
      .single()

    if (!availability) {
      return NextResponse.json(
        { error: 'Availability not found or no longer active' },
        { status: 404 }
      )
    }

    // Check if availability is still in the future
    if (new Date(availability.end_time) <= new Date()) {
      return NextResponse.json(
        { error: 'This availability has already expired' },
        { status: 400 }
      )
    }

    // Check if user is trying to claim their own spot
    if (availability.parking_spots.owner_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot claim your own parking spot' },
        { status: 400 }
      )
    }

    // Check if user already has a confirmed claim for this availability
    const { data: existingClaim } = await supabase
      .from('claims')
      .select('*')
      .eq('availability_id', availability_id)
      .eq('claimer_id', user.id)
      .eq('status', 'confirmed')
      .single()

    if (existingClaim) {
      return NextResponse.json(
        { error: 'You already have a claim for this availability' },
        { status: 409 }
      )
    }

    // Check if there's already a confirmed claim for this availability
    const { data: confirmedClaim } = await supabase
      .from('claims')
      .select('*')
      .eq('availability_id', availability_id)
      .eq('status', 'confirmed')
      .single()

    if (confirmedClaim) {
      return NextResponse.json(
        { error: 'This availability has already been claimed' },
        { status: 409 }
      )
    }

        // Create the claim and deactivate the availability in a transaction
    const { data: newClaim, error } = await supabase
      .from('claims')
      .insert({
        availability_id,
        claimer_id: user.id,
        status: 'confirmed',
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating claim:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create claim' },
        { status: error.code === '42501' ? 403 : error.code === '23505' ? 409 : 500 }
      )
    }

    // Deactivate the availability since it's now claimed
    const { error: availabilityError } = await supabase
      .from('availabilities')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', availability_id)

    if (availabilityError) {
      console.error('Error deactivating availability:', availabilityError)
      // Don't fail the request, but log the error
    }

    return NextResponse.json({ claim: newClaim }, { status: 201 })
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
        { error: 'Claim ID is required' },
        { status: 400 }
      )
    }

    const validationResult = UpdateClaimSchema.safeParse(updateData)

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

    // Check if claim exists and get related data
    const { data: claim } = await supabase
      .from('claims')
      .select(`
        *,
        availabilities (
          *,
          parking_spots (
            owner_id
          )
        )
      `)
      .eq('id', id)
      .single()

    if (!claim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      )
    }

    // Check permissions: claimer can update their own claim, or spot owner can update claims for their spots
    const isOwner = claim.availabilities.parking_spots.owner_id === user.id
    const isClaimer = claim.claimer_id === user.id

    if (!isOwner && !isClaimer) {
      return NextResponse.json(
        { error: 'You do not have permission to update this claim' },
        { status: 403 }
      )
    }

    // Claims are automatically confirmed when created, so no special owner permissions needed

    // If confirming, make sure no other claim is already confirmed for this availability
    if (validationResult.data.status === 'confirmed') {
      const { data: existingConfirmed } = await supabase
        .from('claims')
        .select('*')
        .eq('availability_id', claim.availability_id)
        .eq('status', 'confirmed')
        .neq('id', id)
        .single()

      if (existingConfirmed) {
        return NextResponse.json(
          { error: 'Another claim has already been confirmed for this availability' },
          { status: 409 }
        )
      }
    }

        const { data: updatedClaim, error } = await supabase
      .from('claims')
      .update({
        ...validationResult.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating claim:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update claim' },
        { status: error.code === '42501' ? 403 : error.code === '23505' ? 409 : 500 }
      )
    }

    // If claim is being cancelled or expired, check if we should reactivate the availability
    if (validationResult.data.status === 'cancelled' || validationResult.data.status === 'expired') {
      // Check if there are any other confirmed claims for this availability
      const { data: otherConfirmedClaims } = await supabase
        .from('claims')
        .select('*')
        .eq('availability_id', claim.availability_id)
        .eq('status', 'confirmed')
        .neq('id', id)

      // If no other confirmed claims exist, reactivate the availability
      if (!otherConfirmedClaims || otherConfirmedClaims.length === 0) {
        const { error: reactivateError } = await supabase
          .from('availabilities')
          .update({ 
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', claim.availability_id)

        if (reactivateError) {
          console.error('Error reactivating availability:', reactivateError)
          // Don't fail the request, but log the error
        }
      }
    }

    return NextResponse.json({ claim: updatedClaim })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, action } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Claim ID is required' },
        { status: 400 }
      )
    }

    if (action !== 'release') {
      return NextResponse.json(
        { error: 'Invalid action. Use "release" to release a claimed spot.' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Check if claim exists and get related data
    const { data: claim } = await supabase
      .from('claims')
      .select(`
        *,
        availabilities (
          id,
          end_time,
          parking_spots (
            owner_id
          )
        )
      `)
      .eq('id', id)
      .single()

    if (!claim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      )
    }

    // Only the claimer can release their own claim
    if (claim.claimer_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only release your own claims' },
        { status: 403 }
      )
    }

    // Check if the claim is confirmed
    if (claim.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Only confirmed claims can be released' },
        { status: 400 }
      )
    }

    // Check if the availability window is still active
    const now = new Date()
    const endTime = new Date(claim.availabilities.end_time)
    
    if (endTime <= now) {
      return NextResponse.json(
        { error: 'Cannot release claim - availability window has expired' },
        { status: 400 }
      )
    }

    // Update the claim status to 'released'
    const { error: updateError } = await supabase
      .from('claims')
      .update({ 
        status: 'released',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating claim status:', updateError)
      return NextResponse.json(
        { error: updateError.message || 'Failed to release claim' },
        { status: updateError.code === '42501' ? 403 : 500 }
      )
    }

    // Check if there are any other confirmed claims for this availability
    const { data: otherConfirmedClaims } = await supabase
      .from('claims')
      .select('*')
      .eq('availability_id', claim.availability_id)
      .eq('status', 'confirmed')

    // If no other confirmed claims exist, reactivate the availability
    if (!otherConfirmedClaims || otherConfirmedClaims.length === 0) {
      const { error: reactivateError } = await supabase
        .from('availabilities')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', claim.availability_id)

      if (reactivateError) {
        console.error('Error reactivating availability:', reactivateError)
        // Don't fail the request, but log the error
      }
    }

    return NextResponse.json({ 
      message: 'Spot released successfully',
      claim: { id, status: 'released' }
    })
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
        { error: 'Claim ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Check if claim exists and get related data
    const { data: claim } = await supabase
      .from('claims')
      .select(`
        *,
        availabilities (
          parking_spots (
            owner_id
          )
        )
      `)
      .eq('id', id)
      .single()

    if (!claim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      )
    }

    // Check permissions: claimer can delete their own claim, or spot owner can delete claims for their spots
    const isOwner = claim.availabilities.parking_spots.owner_id === user.id
    const isClaimer = claim.claimer_id === user.id

    if (!isOwner && !isClaimer) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this claim' },
        { status: 403 }
      )
    }

        // Store the availability_id before deleting the claim
    const availabilityId = claim.availability_id

    const { error } = await supabase
      .from('claims')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting claim:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to delete claim' },
        { status: error.code === '42501' ? 403 : 500 }
      )
    }

    // Check if there are any other confirmed claims for this availability
    const { data: otherConfirmedClaims } = await supabase
      .from('claims')
      .select('*')
      .eq('availability_id', availabilityId)
      .eq('status', 'confirmed')

    // If no other confirmed claims exist, reactivate the availability
    if (!otherConfirmedClaims || otherConfirmedClaims.length === 0) {
      const { error: reactivateError } = await supabase
        .from('availabilities')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', availabilityId)

      if (reactivateError) {
        console.error('Error reactivating availability:', reactivateError)
        // Don't fail the request, but log the error
      }
    }

    return NextResponse.json({ message: 'Claim deleted successfully' })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}