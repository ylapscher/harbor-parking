// Generated TypeScript types from OpenAPI 3.0 specification
// Harbor Parking API v1.0.0

export type ClaimStatus = 'pending' | 'confirmed' | 'expired' | 'cancelled'

export interface Profile {
  /** Unique profile identifier */
  id: string
  /** User's email address */
  email: string
  /** User's full name */
  full_name?: string | null
  /** User's apartment number */
  apartment_number: string
  /** User's phone number */
  phone_number?: string | null
  /** Whether the user is approved by admin */
  is_approved: boolean
  /** Whether the user has admin privileges */
  is_admin: boolean
  /** Profile creation timestamp */
  created_at: string
  /** Profile last update timestamp */
  updated_at: string
}

export interface User {
  /** Unique user identifier */
  id: string
  /** User's email address */
  email: string
  /** Email confirmation timestamp */
  email_confirmed_at?: string | null
  /** User creation timestamp */
  created_at: string
  /** User last update timestamp */
  updated_at: string
}

export interface ParkingSpot {
  /** Unique parking spot identifier */
  id: string
  /** Parking spot number or identifier */
  spot_number: string
  /** ID of the user who owns this spot */
  owner_id: string
  /** Building section or nearest elevator */
  building_section?: string | null
  /** Whether the spot is verified by admin */
  is_verified: boolean
  /** Spot creation timestamp */
  created_at: string
  /** Spot last update timestamp */
  updated_at: string
}

export interface Availability {
  /** Unique availability identifier */
  id: string
  /** ID of the parking spot */
  spot_id: string
  /** Availability start time */
  start_time: string
  /** Availability end time */
  end_time: string
  /** Optional notes about the availability */
  notes?: string | null
  /** Whether the availability is active */
  is_active: boolean
  /** Availability creation timestamp */
  created_at: string
  /** Availability last update timestamp */
  updated_at: string
}

export interface Claim {
  /** Unique claim identifier */
  id: string
  /** ID of the availability being claimed */
  availability_id: string
  /** ID of the user making the claim */
  claimer_id: string
  /** Status of the claim */
  status: ClaimStatus
  /** Optional notes about the claim */
  notes?: string | null
  /** Claim creation timestamp */
  created_at: string
  /** Claim last update timestamp */
  updated_at: string
}

export interface DashboardStats {
  /** Number of parking spots owned by user */
  mySpots: number
  /** Number of spots currently available */
  availableSpots: number
  /** Number of active claims by user */
  activeClaims: number
  /** Total number of claims by user */
  totalClaims: number
  /** Number of confirmed claims on user's spots */
  confirmedClaimsOnMySpots: number
}

export interface DashboardResponse {
  stats: DashboardStats
  mySpots: ParkingSpot[]
  availableSpots: Availability[]
  myClaims: Claim[]
  claimsOnMySpots: Claim[]
  /** Non-fatal errors that occurred during data fetching */
  errors?: Array<{
    source: string
    error: string
  }>
}

export interface ApiError {
  /** Error message */
  error: string
  /** Additional error details (for validation errors) */
  details?: Record<string, any>
}

// Request schemas
export interface UpdateProfileRequest {
  /** User's full name */
  full_name?: string
  /** User's phone number */
  phone_number?: string
}

export interface CreateParkingSpotRequest {
  /** Parking spot number or identifier */
  spot_number: string
  /** Location description of the parking spot */
  location: string
  /** Optional notes about the parking spot */
  notes?: string
}

export interface UpdateParkingSpotRequest {
  /** ID of the parking spot to update */
  id: string
  /** Parking spot number or identifier */
  spot_number?: string
  /** Location description of the parking spot */
  location?: string
  /** Optional notes about the parking spot */
  notes?: string
}

export interface CreateAvailabilityRequest {
  /** ID of the parking spot */
  spot_id: string
  /** Availability start time (must be in the future) */
  start_time: string
  /** Availability end time (must be after start time) */
  end_time: string
  /** Optional notes about the availability */
  notes?: string
  /** Whether the availability is active */
  is_active?: boolean
}

export interface UpdateAvailabilityRequest {
  /** ID of the availability to update */
  id: string
  /** Availability start time */
  start_time?: string
  /** Availability end time */
  end_time?: string
  /** Optional notes about the availability */
  notes?: string
  /** Whether the availability is active */
  is_active?: boolean
}

export interface CreateClaimRequest {
  /** ID of the availability to claim */
  availability_id: string
  /** Optional notes about the claim */
  notes?: string
}

export interface UpdateClaimRequest {
  /** ID of the claim to update */
  id: string
  /** Status of the claim */
  status?: ClaimStatus
  /** Optional notes about the claim */
  notes?: string
}

// Response wrapper types
export interface ProfileResponse {
  profile: Profile
  user: User
}

export interface ParkingSpotsResponse {
  spots: ParkingSpot[]
}

export interface ParkingSpotResponse {
  spot: ParkingSpot
}

export interface AvailabilitiesResponse {
  availabilities: Availability[]
}

export interface AvailabilityResponse {
  availability: Availability
}

export interface ClaimsResponse {
  claims: Claim[]
}

export interface ClaimResponse {
  claim: Claim
}

export interface SuccessResponse {
  message: string
}

// API Client types
export interface ApiClientConfig {
  baseUrl?: string
  authToken?: string
}

export interface ApiRequestOptions {
  headers?: Record<string, string>
  timeout?: number
}

// Query parameter types
export interface GetParkingSpotsParams {
  owner_id?: string
}

export interface GetAvailabilitiesParams {
  spot_id?: string
  is_active?: boolean
  available?: boolean
}

export interface GetClaimsParams {
  claimer_id?: string
  availability_id?: string
  status?: ClaimStatus
}

// Extended types with relations (for frontend use)
export interface ParkingSpotWithOwner extends ParkingSpot {
  profiles?: Pick<Profile, 'full_name' | 'apartment_number' | 'email'>
}

export interface AvailabilityWithSpot extends Availability {
  parking_spots?: ParkingSpotWithOwner
}

export interface ClaimWithDetails extends Claim {
  availabilities?: AvailabilityWithSpot
  profiles?: Pick<Profile, 'full_name' | 'apartment_number' | 'email'>
}

// Validation schemas (for runtime validation)
export const ClaimStatusValues = ['pending', 'confirmed', 'expired', 'cancelled'] as const

export const validateClaimStatus = (status: string): status is ClaimStatus => {
  return ClaimStatusValues.includes(status as ClaimStatus)
}

export const validateUuid = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validateDateTime = (dateTime: string): boolean => {
  const date = new Date(dateTime)
  return !isNaN(date.getTime()) && date.toISOString() === dateTime
}

// API endpoint paths
export const API_ENDPOINTS = {
  PROFILE: '/profile',
  DASHBOARD: '/dashboard',
  PARKING_SPOTS: '/parking-spots',
  AVAILABILITIES: '/availabilities',
  CLAIMS: '/claims',
} as const

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const

// Error types
export class ApiValidationError extends Error {
  constructor(
    message: string,
    public details: Record<string, any>
  ) {
    super(message)
    this.name = 'ApiValidationError'
  }
}

export class ApiAuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message)
    this.name = 'ApiAuthenticationError'
  }
}

export class ApiPermissionError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message)
    this.name = 'ApiPermissionError'
  }
}

export class ApiNotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message)
    this.name = 'ApiNotFoundError'
  }
}

export class ApiConflictError extends Error {
  constructor(message: string = 'Resource conflict') {
    super(message)
    this.name = 'ApiConflictError'
  }
}

export class ApiServerError extends Error {
  constructor(message: string = 'Internal server error') {
    super(message)
    this.name = 'ApiServerError'
  }
}

// Utility type for API responses
export type ApiResponse<T> = {
  success: true
  data: T
} | {
  success: false
  error: ApiError
}

// Type guards
export const isApiError = (value: any): value is ApiError => {
  return typeof value === 'object' && value !== null && typeof value.error === 'string'
}

export const isProfile = (value: any): value is Profile => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.email === 'string' &&
    typeof value.apartment_number === 'string' &&
    typeof value.is_approved === 'boolean' &&
    typeof value.is_admin === 'boolean' &&
    typeof value.created_at === 'string' &&
    typeof value.updated_at === 'string'
  )
}

export const isParkingSpot = (value: any): value is ParkingSpot => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.spot_number === 'string' &&
    typeof value.owner_id === 'string' &&
    typeof value.is_verified === 'boolean' &&
    typeof value.created_at === 'string' &&
    typeof value.updated_at === 'string'
  )
}

export const isAvailability = (value: any): value is Availability => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.spot_id === 'string' &&
    typeof value.start_time === 'string' &&
    typeof value.end_time === 'string' &&
    typeof value.is_active === 'boolean' &&
    typeof value.created_at === 'string' &&
    typeof value.updated_at === 'string'
  )
}

export const isClaim = (value: any): value is Claim => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.availability_id === 'string' &&
    typeof value.claimer_id === 'string' &&
    validateClaimStatus(value.status) &&
    typeof value.created_at === 'string' &&
    typeof value.updated_at === 'string'
  )
}