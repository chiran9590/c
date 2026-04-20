-- ========================================
-- COMPLETE LOGIN FIX
-- ========================================

-- Step 1: Drop all existing policies and triggers to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable public profile creation" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable profile creation and access" ON profiles;

-- Step 2: Check if user exists and create profile manually if needed
-- This will create a profile for the existing user
INSERT INTO profiles (id, name, email, role)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'name', 'Chiran'),
    u.email,
    COALESCE(u.raw_user_meta_data->>'role', 'admin')
FROM auth.users u
WHERE u.email = 'chiran9590@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Recreate trigger with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert profile with better error handling
    INSERT INTO public.profiles (id, name, email, phone, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'name', 'New User'),
        new.email,
        new.raw_user_meta_data->>'phone',
        COALESCE(new.raw_user_meta_data->>'role', 'client')
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN new;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the trigger
        RAISE NOTICE 'Failed to create profile for user %: %', new.email, SQLERRM;
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Recreate trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Create better RLS policies for profiles
-- Policy 1: Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy 2: Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Allow profile creation (for signup and manual fixes)
CREATE POLICY "Allow profile creation" ON profiles
    FOR INSERT WITH CHECK (true);

-- Policy 4: Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

-- Policy 5: Allow admins to manage all profiles
CREATE POLICY "Admins can manage all profiles" ON profiles
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

-- Step 6: Verify the user profile was created
SELECT 
    'Profile Check' as check_type,
    p.id,
    p.name,
    p.email,
    p.role,
    p.created_at,
    CASE 
        WHEN p.id IS NOT NULL THEN 'Profile exists'
        ELSE 'Profile missing'
    END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'chiran9590@gmail.com';

-- Step 7: Test RLS policy by simulating user access
-- This helps verify if RLS is working correctly
SELECT 
    'RLS Test' as test_type,
    auth.uid() as current_user_id,
    current_user as current_user_email,
    (SELECT COUNT(*) FROM profiles WHERE email = 'chiran9590@gmail.com') as accessible_profiles;

-- Step 8: Create a simple test function to verify authentication
CREATE OR REPLACE FUNCTION public.test_user_access()
RETURNS TABLE (
    user_id uuid,
    email text,
    profile_exists boolean,
    can_access_profile boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        auth.uid() as user_id,
        current_user::text as email,
        EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid()) as profile_exists,
        (SELECT COUNT(*) > 0 FROM profiles WHERE id = auth.uid()) as can_access_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
SELECT * FROM public.test_user_access();

-- Step 9: Final verification query
SELECT 
    'Final Status' as status,
    (SELECT COUNT(*) FROM auth.users WHERE email = 'chiran9590@gmail.com') as auth_user_exists,
    (SELECT COUNT(*) FROM profiles WHERE email = 'chiran9590@gmail.com') as profile_exists,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as rls_policies_count,
    (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') as trigger_exists;
