# Claims Status Constraint Fix

## Problem
When trying to release a claimed spot, the application was throwing a database constraint violation error:

```
new row for relation "claims" violates check constraint "claims_status_check"
```

## Root Cause
The database schema had a check constraint that only allowed these status values:
- `pending`
- `confirmed` 
- `expired`
- `cancelled`

However, the application code and API were trying to use a new status `released` for the early release feature, which wasn't included in the database constraint.

## Solution

### 1. Database Migration
Run the SQL migration to update the database constraint:

```sql
-- Fix claims status check constraint to include 'released' status
-- This migration updates the existing constraint to allow the 'released' status

-- First, drop the existing constraint
ALTER TABLE public.claims DROP CONSTRAINT IF EXISTS claims_status_check;

-- Add the new constraint that includes 'released'
ALTER TABLE public.claims ADD CONSTRAINT claims_status_check 
  CHECK (status IN ('pending', 'confirmed', 'expired', 'cancelled', 'released'));

-- Update the default value to ensure consistency
ALTER TABLE public.claims ALTER COLUMN status SET DEFAULT 'pending';
```

**File:** `fix-claims-status-constraint.sql`

### 2. TypeScript Type Updates
Updated the following files to include the `released` status:

- `types/index.ts` - Updated `ClaimStatus` type
- `types/api.ts` - Updated `ClaimStatus` type and validation function
- `guides/setup.mdx` - Updated database schema documentation
- `API.md` - Updated API documentation

### 3. Files Modified
- ✅ `fix-claims-status-constraint.sql` - Database migration
- ✅ `types/index.ts` - TypeScript types
- ✅ `types/api.ts` - API types and validation
- ✅ `guides/setup.mdx` - Documentation
- ✅ `API.md` - API documentation

## How to Apply the Fix

### Option 1: Manual Database Update
1. Connect to your Supabase database
2. Run the SQL commands from `fix-claims-status-constraint.sql`
3. Deploy the updated TypeScript files

### Option 2: Supabase CLI (if available)
1. Add the migration to your Supabase migrations folder
2. Run `supabase db push` to apply the migration
3. Deploy the updated TypeScript files

## Testing
After applying the fix, test the release functionality:
1. Create a claim for a parking spot
2. Confirm the claim
3. Try to release the claim early
4. Verify the status changes to `released` without errors

## Impact
- ✅ Fixes the 500 error when releasing claims
- ✅ Enables the early release feature to work properly
- ✅ Maintains backward compatibility with existing claims
- ✅ Updates all documentation to reflect the new status

## Status Values
The complete list of valid claim statuses is now:
- `pending` - Initial claim state
- `confirmed` - Claim approved and active
- `released` - Claim released early by user
- `expired` - Claim expired due to time
- `cancelled` - Claim cancelled by user or owner
