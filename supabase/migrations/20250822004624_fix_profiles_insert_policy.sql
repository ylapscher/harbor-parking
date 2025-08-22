-- Fix for missing INSERT policy on profiles table
-- This policy allows users to insert their own profile record during signup

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Add the missing INSERT policy for profiles table
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;
