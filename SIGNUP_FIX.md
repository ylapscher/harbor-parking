# Signup Error Fix

## Issue Description
Users are unable to create new accounts and receive a "Database error saving new user" message during the signup process.

## Root Cause
The Row Level Security (RLS) policies for the `profiles` table are missing an INSERT policy. The current policies only allow SELECT and UPDATE operations, but there's no policy that allows users to INSERT their own profile record during signup.

## Current RLS Policies (Incomplete)
```sql
-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );
```

## Solution
Add the missing INSERT policy to allow users to create their own profile record:

### Option 1: Run SQL Migration
Execute the following SQL in your Supabase SQL Editor:

```sql
-- Add the missing INSERT policy for profiles table
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### Option 2: Use the Migration Files
Run both migration files in your Supabase SQL Editor:
1. `fix-profiles-insert-policy.sql` - Adds the missing INSERT policy
2. `fix-profile-trigger.sql` - Fixes the profile creation trigger

## Complete Fixed RLS Policies
```sql
-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );
```

## Additional Fixes Applied
1. **Updated setup guide**: Added the missing INSERT policy to `guides/setup.mdx`
2. **Improved validation**: Enhanced phone number validation in `lib/validations/auth.ts` to handle null values properly
3. **Fixed profile creation trigger**: Updated the `handle_new_user()` function to include all required fields and proper error handling

## Testing
After applying the fix:
1. Try creating a new account with the signup form
2. Verify that the profile is created successfully
3. Check that the user can log in and access the dashboard

## Prevention
Always ensure that RLS policies cover all necessary operations (SELECT, INSERT, UPDATE, DELETE) for each table based on your application's requirements.
