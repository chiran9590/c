-- ========================================
-- COMPLETE ADMIN MANAGEMENT SCHEMA
-- ========================================

-- 1. DROP existing tables (for fresh start)
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP TABLE IF EXISTS user_clubs CASCADE;

-- 2. Create profiles table (user management)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  email TEXT, -- We'll store email here for easier access
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create clubs table (club management)
CREATE TABLE clubs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create user_clubs table (many-to-many relationship)
CREATE TABLE user_clubs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Ensure unique user-club combinations
  UNIQUE(user_id, club_id)
);

-- 5. Create indexes for performance
CREATE INDEX idx_profiles_club_id ON profiles(club_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_user_clubs_user_id ON user_clubs(user_id);
CREATE INDEX idx_user_clubs_club_id ON user_clubs(club_id);

-- 6. Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_clubs ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for profiles (user management)
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 8. RLS Policies for clubs (club management)
CREATE POLICY "Admins can view all clubs" ON clubs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert clubs" ON clubs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update clubs" ON clubs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete clubs" ON clubs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 9. RLS Policies for user_clubs (assignments)
CREATE POLICY "Admins can view all assignments" ON user_clubs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage assignments" ON user_clubs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view own club assignments" ON user_clubs
  FOR SELECT USING (user_id = auth.uid());

-- 10. Insert admin user
INSERT INTO profiles (id, full_name, email, phone_number, role) VALUES
(
  (SELECT id FROM auth.users WHERE email = 'chiran9590@gmail.com'),
  'chiran',
  'chiran9590@gmail.com',
  '8088052481',
  'admin'
);

-- 11. Sample clubs data
INSERT INTO clubs (club_name) VALUES
('Royal Club Bangalore'),
('Augusta National Golf Club'),
('Pine Valley Golf Club');

-- 12. Sample user-club assignments
INSERT INTO user_clubs (user_id, club_id, assigned_by) VALUES
(
  (SELECT id FROM profiles WHERE email = 'chiran9590@gmail.com'),
  (SELECT id FROM clubs WHERE club_name = 'Royal Club Bangalore'),
  (SELECT id FROM profiles WHERE email = 'chiran9590@gmail.com')
);
