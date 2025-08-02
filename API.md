# Harbor Parking API Documentation

This document describes the REST API endpoints for the Harbor Parking application.

## Authentication

All API endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <your-supabase-jwt-token>
```

## Base URL

```
https://your-domain.com/api
```

## Endpoints

### Dashboard Data

#### GET /dashboard
Fetch comprehensive dashboard data for the authenticated user.

**Response:**
```json
{
  "stats": {
    "mySpots": 2,
    "availableSpots": 5,
    "activeClaims": 1,
    "totalClaims": 3,
    "pendingClaimsOnMySpots": 2,
    "confirmedClaimsOnMySpots": 1
  },
  "mySpots": [...],
  "availableSpots": [...],
  "myClaims": [...],
  "claimsOnMySpots": [...]
}
```

### Parking Spots

#### GET /parking-spots
Fetch parking spots.

**Query Parameters:**
- `owner_id` (optional): Filter by owner ID

**Response:**
```json
{
  "spots": [
    {
      "id": "uuid",
      "owner_id": "uuid",
      "spot_number": "A-15",
      "location": "Level 2 Parking Garage",
      "notes": "Near elevator",
      "created_at": "2023-...",
      "updated_at": "2023-..."
    }
  ]
}
```

#### POST /parking-spots
Create a new parking spot.

**Request Body:**
```json
{
  "spot_number": "A-15",
  "location": "Level 2 Parking Garage",
  "notes": "Near elevator"
}
```

**Response:**
```json
{
  "spot": {
    "id": "uuid",
    "owner_id": "uuid",
    "spot_number": "A-15",
    "location": "Level 2 Parking Garage",
    "notes": "Near elevator",
    "created_at": "2023-...",
    "updated_at": "2023-..."
  }
}
```

#### PUT /parking-spots
Update a parking spot.

**Request Body:**
```json
{
  "id": "uuid",
  "spot_number": "A-16",
  "location": "Level 2 Parking Garage",
  "notes": "Updated notes"
}
```

#### DELETE /parking-spots?id=uuid
Delete a parking spot and all associated availabilities.

### Availabilities

#### GET /availabilities
Fetch availabilities.

**Query Parameters:**
- `spot_id` (optional): Filter by parking spot ID
- `is_active` (optional): Filter by active status (true/false)
- `available` (optional): If true, only return active future availabilities

**Response:**
```json
{
  "availabilities": [
    {
      "id": "uuid",
      "spot_id": "uuid",
      "start_time": "2023-12-25T10:00:00Z",
      "end_time": "2023-12-25T18:00:00Z",
      "notes": "Holiday availability",
      "is_active": true,
      "created_at": "2023-...",
      "updated_at": "2023-..."
    }
  ]
}
```

#### POST /availabilities
Create a new availability.

**Request Body:**
```json
{
  "spot_id": "uuid",
  "start_time": "2023-12-25T10:00:00Z",
  "end_time": "2023-12-25T18:00:00Z",
  "notes": "Holiday availability",
  "is_active": true
}
```

**Validation Rules:**
- End time must be after start time
- Start time cannot be in the past
- Cannot overlap with existing active availabilities for the same spot

#### PUT /availabilities
Update an availability.

**Request Body:**
```json
{
  "id": "uuid",
  "start_time": "2023-12-25T11:00:00Z",
  "end_time": "2023-12-25T19:00:00Z",
  "is_active": false
}
```

#### DELETE /availabilities?id=uuid
Delete an availability and all associated claims.

### Claims

#### GET /claims
Fetch claims.

**Query Parameters:**
- `claimer_id` (optional): Filter by claimer ID
- `availability_id` (optional): Filter by availability ID
- `status` (optional): Filter by status (pending, confirmed, expired, cancelled)

**Response:**
```json
{
  "claims": [
    {
      "id": "uuid",
      "availability_id": "uuid",
      "claimer_id": "uuid",
      "status": "pending",
      "notes": "Need spot for meeting",
      "created_at": "2023-...",
      "updated_at": "2023-..."
    }
  ]
}
```

#### POST /claims
Create a new claim.

**Request Body:**
```json
{
  "availability_id": "uuid",
  "notes": "Need spot for meeting"
}
```

**Validation Rules:**
- Cannot claim your own parking spot
- Cannot claim expired availabilities
- Cannot have multiple active claims for the same availability
- Cannot claim if another claim is already confirmed

#### PUT /claims
Update a claim.

**Request Body:**
```json
{
  "id": "uuid",
  "status": "confirmed",
  "notes": "Updated notes"
}
```

**Permissions:**
- Claimers can update their own claims
- Spot owners can update claims for their spots
- Only spot owners can confirm claims

#### DELETE /claims?id=uuid
Delete a claim.

**Permissions:**
- Claimers can delete their own claims
- Spot owners can delete claims for their spots

### Profile

#### GET /profile
Fetch user profile and basic user information.

**Response:**
```json
{
  "profile": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "apartment_number": "12A",
    "phone_number": "+1234567890",
    "is_approved": true,
    "is_admin": false,
    "created_at": "2023-...",
    "updated_at": "2023-..."
  },
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "email_confirmed_at": "2023-...",
    "created_at": "2023-...",
    "updated_at": "2023-..."
  }
}
```

#### PUT /profile
Update user profile.

**Request Body:**
```json
{
  "full_name": "John Smith",
  "phone_number": "+1234567890"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": {} // Optional validation details
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data, overlapping times, etc.)
- `500` - Internal Server Error

## Data Types

### Parking Spot
```typescript
interface ParkingSpot {
  id: string
  owner_id: string
  spot_number: string
  location: string
  notes?: string
  created_at: string
  updated_at: string
}
```

### Availability
```typescript
interface Availability {
  id: string
  spot_id: string
  start_time: string // ISO 8601 datetime
  end_time: string   // ISO 8601 datetime
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}
```

### Claim
```typescript
interface Claim {
  id: string
  availability_id: string
  claimer_id: string
  status: 'pending' | 'confirmed' | 'expired' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
}
```

### Profile
```typescript
interface Profile {
  id: string
  email: string
  full_name: string
  apartment_number: string
  phone_number?: string
  is_approved: boolean
  is_admin: boolean
  created_at: string
  updated_at: string
}
```

## Usage Examples

### Fetch available spots
```javascript
const response = await fetch('/api/availabilities?available=true', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
const { availabilities } = await response.json()
```

### Create a parking spot
```javascript
const response = await fetch('/api/parking-spots', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    spot_number: 'A-15',
    location: 'Level 2 Parking Garage',
    notes: 'Near elevator'
  })
})
const { spot } = await response.json()
```

### Claim a spot
```javascript
const response = await fetch('/api/claims', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    availability_id: 'availability-uuid',
    notes: 'Need spot for meeting'
  })
})
const { claim } = await response.json()
```