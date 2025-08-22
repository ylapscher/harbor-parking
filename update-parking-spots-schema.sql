-- Update parking_spots table to support verification system
-- This migration ensures the table has the correct fields for the approval system

-- Add is_verified column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'parking_spots' AND column_name = 'is_verified') THEN
        ALTER TABLE public.parking_spots ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Update existing spots to be verified (for existing data)
UPDATE public.parking_spots 
SET is_verified = true, is_active = true 
WHERE is_verified IS NULL OR is_active IS NULL;

-- Ensure is_verified has a default value
ALTER TABLE public.parking_spots ALTER COLUMN is_verified SET DEFAULT FALSE;

-- Add constraint to ensure is_active is only true when is_verified is true
ALTER TABLE public.parking_spots ADD CONSTRAINT check_verified_active 
CHECK (NOT (is_active = true AND is_verified = false));

-- Update RLS policies to handle verification status
DROP POLICY IF EXISTS "Users can view parking spots" ON public.parking_spots;
CREATE POLICY "Users can view parking spots" ON public.parking_spots
  FOR SELECT USING (
    is_verified = true OR 
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Add policy for admins to update verification status
CREATE POLICY "Admins can update verification status" ON public.parking_spots
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'parking_spots' 
ORDER BY ordinal_position;
