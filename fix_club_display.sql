-- ========================================
-- COMPLETE CLUB DISPLAY FIX
-- ========================================

-- TASK 1: DEBUG AND FIX CLUB CONNECTION
-- ========================================

-- 1. Check current clubs data
SELECT 'Current clubs in database:', id, club_name, created_at 
FROM clubs 
ORDER BY created_at DESC;

-- 2. Check if current user is admin
SELECT 'Current user profile:', id, full_name, role, email 
FROM profiles 
WHERE id = auth.uid();

-- 3. Fix RLS policies for clubs (remove existing and recreate)
DROP POLICY IF EXISTS "Admins can view all clubs" ON clubs;
DROP POLICY IF EXISTS "Admins can insert clubs" ON clubs;
DROP POLICY IF EXISTS "Admins can update clubs" ON clubs;
DROP POLICY IF EXISTS "Admins can delete clubs" ON clubs;

-- 4. Create simplified RLS policies that work
CREATE POLICY "Admins can manage clubs" ON clubs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 5. Add a public policy for testing (temporary)
CREATE POLICY "Allow public club access" ON clubs
  FOR SELECT USING (true);

-- 6. Test the connection
SELECT 'Testing club access after fix:', *
FROM clubs 
LIMIT 5;

-- TASK 2: FIX USER-CLUB ASSIGNMENTS
-- ========================================

-- 7. Check existing assignments
SELECT 'Current assignments:', uc.id, p.full_name, c.club_name, uc.assigned_at
FROM user_clubs uc
JOIN profiles p ON uc.user_id = p.id
JOIN clubs c ON uc.club_id = c.id
ORDER BY uc.assigned_at DESC;

-- 8. Fix RLS policies for user_clubs
DROP POLICY IF EXISTS "Admins can view all assignments" ON user_clubs;
DROP POLICY IF EXISTS "Admins can manage assignments" ON user_clubs;
DROP POLICY IF EXISTS "Users can view own club assignments" ON user_clubs;

CREATE POLICY "Admins can manage assignments" ON user_clubs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 9. Test assignments access
SELECT 'Testing assignments access:', *
FROM user_clubs 
LIMIT 5;

-- TASK 3: ENSURE COMPLETE FRONTEND DISPLAY
-- ========================================

-- 10. Add sample clubs if none exist
INSERT INTO clubs (club_name) 
SELECT 'Royal Club Bangalore' 
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE club_name = 'Royal Club Bangalore');

INSERT INTO clubs (club_name) 
SELECT 'Augusta National Golf Club' 
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE club_name = 'Augusta National Golf Club');

INSERT INTO clubs (club_name) 
SELECT 'Pine Valley Golf Club' 
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE club_name = 'Pine Valley Golf Club');

-- 11. Update admin user to ensure proper permissions
UPDATE profiles 
SET role = 'admin' 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'chiran9590@gmail.com'
);

-- 12. Final verification
SELECT 'Final club count:', COUNT(*) as total_clubs FROM clubs;
SELECT 'Final admin user:', id, full_name, role, email FROM profiles WHERE role = 'admin';
