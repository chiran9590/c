-- Debug Club Creation Issues
-- ========================================

-- 1. Check if golf_clubs table exists
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'golf_clubs';

-- 2. Check RLS status for golf_clubs
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'golf_clubs';

-- 3. Check RLS policies for golf_clubs
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'golf_clubs';

-- 4. Check if current user is admin
SELECT id, full_name, role 
FROM profiles 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'chiran9590@gmail.com'
);

-- 5. Try manual club insertion (bypass RLS temporarily)
-- This will help identify if RLS is the issue

-- First, let's see what happens with a simple insert
INSERT INTO golf_clubs (name, description, location, created_by) 
VALUES ('Test Club', 'Test Description for debugging', 'Test Location', 
  (SELECT id FROM profiles WHERE email = 'chiran9590@gmail.com'));

-- 6. Check if club was created
SELECT * FROM golf_clubs WHERE name = 'Test Club';

-- 7. Clean up test data
DELETE FROM golf_clubs WHERE name = 'Test Club';

-- 8. Check RLS policy details
SELECT 
  pg_get_userbyid(oid) as current_user_id,
  current_setting('request.jwt.claims') as jwt_claims,
  current_setting('request.role') as current_role;
