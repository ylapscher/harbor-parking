import { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type ParkingSpot = Database['public']['Tables']['parking_spots']['Row']
export type ParkingSpotInsert = Database['public']['Tables']['parking_spots']['Insert']
export type ParkingSpotUpdate = Database['public']['Tables']['parking_spots']['Update']

export type Availability = Database['public']['Tables']['availabilities']['Row']
export type AvailabilityInsert = Database['public']['Tables']['availabilities']['Insert']
export type AvailabilityUpdate = Database['public']['Tables']['availabilities']['Update']

export type Claim = Database['public']['Tables']['claims']['Row']
export type ClaimInsert = Database['public']['Tables']['claims']['Insert']
export type ClaimUpdate = Database['public']['Tables']['claims']['Update']

export type ClaimStatus = 'pending' | 'confirmed' | 'expired' | 'cancelled' | 'released'

// Extended types with relations
export interface ParkingSpotWithOwner extends ParkingSpot {
  profiles: Pick<Profile, 'full_name' | 'apartment_number' | 'email'>
}

export interface AvailabilityWithSpot extends Availability {
  parking_spots: ParkingSpotWithOwner
}

export interface ClaimWithDetails extends Claim {
  availabilities: AvailabilityWithSpot
  profiles: Pick<Profile, 'full_name' | 'apartment_number' | 'email'>
}

// Auth types
export interface AuthUser {
  id: string
  email: string
  profile?: Profile
}

// Form types
export interface RegisterFormData {
  email: string
  password: string
  fullName: string
  apartmentNumber: string
  phoneNumber?: string
}

export interface LoginFormData {
  email: string
  password: string
}

export interface ParkingSpotFormData {
  spotNumber: string
  buildingSection?: string
}

export interface AvailabilityFormData {
  spotId: string
  startTime: string
  endTime: string
  notes?: string
}