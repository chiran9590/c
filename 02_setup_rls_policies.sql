-- ========================================
-- STEP 2: Row Level Security (RLS) Policies
-- ========================================

-- Enable Row Level Security on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Users can insert their own profile (for trigger/function use)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 4: Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- Policy 5: Allow public access to create profiles (for signup flow)
CREATE POLICY "Enable public profile creation" ON profiles
  FOR INSERT WITH CHECK (true);

-- Add comments for RLS policies
COMMENT ON POLICY "Users can view own profile" ON profiles IS 'Users can only see their own profile data';
COMMENT ON POLICY "Users can update own profile" ON profiles IS 'Users can only update their own profile';
COMMENT ON POLICY "Users can insert own profile" ON profiles IS 'Users can only insert their own profile';
COMMENT ON POLICY "Users can delete own profile" ON profiles IS 'Users can only delete their own profile';
COMMENT ON POLICY "Enable public profile creation" ON profiles IS 'Allow public profile creation during signup';
