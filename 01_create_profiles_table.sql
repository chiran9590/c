-- ========================================
-- STEP 1: Create Profiles Table
-- ========================================

-- Drop table if exists (for fresh setup)
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add constraint to ensure phone number format if provided
  CONSTRAINT phone_number_format CHECK (
    phone_number IS NULL OR 
    phone_number ~ '^\+?[0-9\s\-\(\)]+$' OR
    phone_number = ''
  )
);

-- Add comments for documentation
COMMENT ON TABLE profiles IS 'User profiles linked to Supabase auth users';
COMMENT ON COLUMN profiles.id IS 'References auth.users.id - Primary key';
COMMENT ON COLUMN profiles.full_name IS 'User full name (required)';
COMMENT ON COLUMN profiles.phone_number IS 'Phone number in international format';
COMMENT ON COLUMN profiles.created_at IS 'Profile creation timestamp';
