-- ========================================
-- CHECK AND FIX SCHEMA
-- ========================================

-- 1. Check current profiles table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Check if clubs table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'clubs';

-- 3. Add missing columns to profiles table safely
DO $$
BEGIN
  -- Add club_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'club_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN club_id UUID REFERENCES clubs(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added club_id column to profiles table';
  END IF;
  
  -- Add email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
    RAISE NOTICE 'Added email column to profiles table';
  END IF;
END $$;

-- 4. Update profiles with email from auth.users
UPDATE profiles 
SET email = auth_users.email
FROM auth.users 
WHERE profiles.id = auth_users.id;

-- 5. Create clubs table if it doesn't exist
CREATE TABLE IF NOT EXISTS clubs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create user_clubs table for assignments
CREATE TABLE IF NOT EXISTS user_clubs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(user_id, club_id)
);

-- 7. Enable RLS
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_clubs ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for clubs
CREATE POLICY IF NOT EXISTS "Admins can view all clubs" ON clubs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can insert clubs" ON clubs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can update clubs" ON clubs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can delete clubs" ON clubs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 9. Create RLS policies for user_clubs
CREATE POLICY IF NOT EXISTS "Admins can view all assignments" ON user_clubs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can manage assignments" ON user_clubs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Users can view own club assignments" ON user_clubs
  FOR SELECT USING (user_id = auth.uid());

-- 10. Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_club_id ON profiles(club_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_clubs_user_id ON user_clubs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_clubs_club_id ON user_clubs(club_id);

-- 11. Sample data
INSERT INTO clubs (club_name) VALUES
('Royal Club Bangalore'),
('Augusta National Golf Club'),
('Pine Valley Golf Club');
