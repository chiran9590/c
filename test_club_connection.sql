-- ========================================
-- TEST CLUB CONNECTION DEBUG
-- ========================================

-- 1. Check if clubs table exists and has data
SELECT 'Clubs table exists and has data:', COUNT(*) as club_count 
FROM clubs;

-- 2. Check all clubs data
SELECT 'All clubs:', id, club_name, created_at 
FROM clubs 
ORDER BY created_at DESC;

-- 3. Check current user auth context
SELECT 'Current auth user:', auth.uid() as current_user_id;

-- 4. Check if current user is admin
SELECT 'Current user profile:', id, full_name, role 
FROM profiles 
WHERE id = auth.uid();

-- 5. Test RLS policy for clubs (simulate admin access)
SELECT 'Testing club access with RLS:', *
FROM clubs 
LIMIT 5;

-- 6. Check if RLS policies exist for clubs
SELECT 'RLS policies for clubs:', schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'clubs';

-- 7. Temporarily disable RLS for testing (UNCOMMENT TO TEST)
-- ALTER TABLE clubs DISABLE ROW LEVEL SECURITY;

-- 8. Re-enable RLS after testing (UNCOMMENT AFTER TEST)
-- ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
