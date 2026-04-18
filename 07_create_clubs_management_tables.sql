-- ========================================
-- STEP 7: Create Clubs Management Tables
-- ========================================

-- Create golf_clubs table
CREATE TABLE IF NOT EXISTS golf_clubs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add constraints
  CONSTRAINT clubs_name_length CHECK (length(name) >= 2),
  CONSTRAINT clubs_description_length CHECK (length(description) >= 10)
);

-- Create club_members table for user-club relationships
CREATE TABLE IF NOT EXISTS club_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID REFERENCES golf_clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'manager', 'owner')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Ensure unique user-club combinations
  UNIQUE(club_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_golf_clubs_created_by ON golf_clubs(created_by);
CREATE INDEX IF NOT EXISTS idx_golf_clubs_created_at ON golf_clubs(created_at);
CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user_id ON club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_club_members_role ON club_members(role);

-- Add comments for documentation
COMMENT ON TABLE golf_clubs IS 'Golf clubs information and management';
COMMENT ON COLUMN golf_clubs.name IS 'Club name (required, min 2 characters)';
COMMENT ON COLUMN golf_clubs.description IS 'Club description (required, min 10 characters)';
COMMENT ON COLUMN golf_clubs.location IS 'Club location/address';
COMMENT ON COLUMN golf_clubs.created_by IS 'User who created the club';

COMMENT ON TABLE club_members IS 'Many-to-many relationship between users and clubs';
COMMENT ON COLUMN club_members.club_id IS 'Reference to golf club';
COMMENT ON COLUMN club_members.user_id IS 'Reference to user';
COMMENT ON COLUMN club_members.role IS 'User role in club: member, manager, or owner';
COMMENT ON COLUMN club_members.joined_at IS 'When user joined the club';
COMMENT ON COLUMN club_members.created_by IS 'User who added this member to the club';

-- Enable RLS (Row Level Security)
ALTER TABLE golf_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for golf_clubs
CREATE POLICY "Admins can view all clubs" ON golf_clubs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert clubs" ON golf_clubs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update clubs" ON golf_clubs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete clubs" ON golf_clubs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create RLS policies for club_members
CREATE POLICY "Admins can view all club memberships" ON club_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage club memberships" ON club_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own club memberships" ON club_members
  FOR SELECT USING (user_id = auth.uid());

-- Create updated_at trigger for golf_clubs
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_golf_clubs_updated_at 
    BEFORE UPDATE ON golf_clubs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data (optional - remove in production)
INSERT INTO golf_clubs (name, description, location, created_by) VALUES
('Augusta National Golf Club', 'One of the most prestigious golf clubs in the world, home of the Masters Tournament.', 'Augusta, Georgia, USA', 
 (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('Pine Valley Golf Club', 'Consistently ranked as one of the top golf courses in the United States.', 'Pine Valley, New Jersey, USA',
 (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('St Andrews Links', 'The Home of Golf, featuring the famous Old Course.', 'St Andrews, Scotland', 
 (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1));
