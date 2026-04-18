-- ========================================
-- TEST USER CREATION FUNCTIONALITY
-- ========================================

-- 1. Check if admin user has proper permissions
SELECT 'Current admin user:', id, full_name, role, email 
FROM profiles 
WHERE role = 'admin';

-- 2. Check RLS policies for profiles table
SELECT 'Profiles RLS policies:', schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. Test if admin can create profiles
CREATE POLICY IF NOT EXISTS "Admins can manage profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 4. Ensure admin user is properly set
UPDATE profiles 
SET role = 'admin' 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'chiran9590@gmail.com'
);

-- 5. Check current users
SELECT 'Current users:', id, full_name, email, role, created_at 
FROM profiles 
ORDER BY created_at DESC;

-- 6. Test profile creation (this should work from frontend)
SELECT 'Testing profile creation permissions:', 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    ) THEN 'Admin user can create profiles'
    ELSE 'Admin user cannot create profiles'
  END as permission_status;
