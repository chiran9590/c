-- ========================================
-- DEBUG LOGIN ISSUE
-- ========================================

-- Check if user exists in auth.users
-- Note: You'll need to check this manually in Supabase dashboard

-- Check profiles table
SELECT 
    p.id,
    p.name,
    p.email,
    p.phone,
    p.role,
    p.created_at,
    'profiles' as table_name
FROM profiles p 
WHERE p.email = 'chiran9590@gmail.com';

-- Check if there are any RLS policy conflicts
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Check auth.users relationship (this might fail due to permissions)
-- Run this in Supabase SQL editor with service role
SELECT 
    u.id,
    u.email,
    u.created_at,
    p.name as profile_name,
    p.email as profile_email,
    p.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'chiran9590@gmail.com';

-- Fix potential RLS issues by adding a more permissive policy for profile access
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Enable public profile creation" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Recreate policies with better access control
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable profile creation and access" ON profiles
  FOR ALL WITH CHECK (true);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Check if trigger is working
SELECT 
    trigger_name,
    event_manipulation,
    event_object_schema,
    event_object_table,
    action_timing,
    action_condition,
    action_orientation,
    action_reference_old_table,
    action_reference_new_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Test profile creation manually (if needed)
-- This should only be used if the trigger isn't working
-- INSERT INTO profiles (id, name, email, role)
-- VALUES (
--     'USER_ID_HERE', 
--     'Chiran', 
--     'chiran9590@gmail.com', 
--     'admin'
-- );

-- Check for any existing sessions or authentication issues
-- This query helps identify if there are authentication state problems
SELECT 
    'Current Auth Status' as status,
    auth.uid() as current_user_id,
    current_user as current_user_email;
