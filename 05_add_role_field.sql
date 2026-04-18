-- ========================================
-- STEP 5: Add Role Field for Admin Detection
-- ========================================

-- Add role column to profiles table
ALTER TABLE profiles 
ADD COLUMN role TEXT NOT NULL DEFAULT 'client';

-- Add constraint to ensure only valid roles
ALTER TABLE profiles 
ADD CONSTRAINT valid_role_check 
CHECK (role IN ('client', 'admin'));

-- Update existing profiles to have 'client' role (if any exist)
UPDATE profiles 
SET role = 'client' 
WHERE role IS NULL OR role = '';

-- Add index for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Add comments
COMMENT ON COLUMN profiles.role IS 'User role: client or admin';
COMMENT ON CONSTRAINT valid_role_check ON profiles IS 'Ensures only valid roles are allowed';
COMMENT ON INDEX idx_profiles_role IS 'Index for role-based queries and filtering';

-- Update RLS policies to handle role field
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Enable public profile creation" ON profiles;

-- Recreate RLS policies with role awareness
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (auth.uid() = id);

CREATE POLICY "Enable public profile creation" ON profiles
  FOR INSERT WITH CHECK (true);
