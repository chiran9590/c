-- ========================================
-- STEP 6: Complete Setup Summary & Role Management
-- ========================================

-- This file contains all the SQL queries needed for the complete authentication system
-- Run this after Steps 1-4 and 5 are completed

-- Function to update user role (for admin management)
CREATE OR REPLACE FUNCTION public.update_user_role(
  user_id UUID,
  new_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate role
  IF new_role NOT IN ('client', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;
  
  -- Update user role
  UPDATE public.profiles 
  SET role = new_role 
  WHERE id = user_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to update role for user %: %', user_id, SQLERRM;
    RETURN FALSE;
END;
$$;

-- Function to get all users with their roles (for admin dashboard)
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone_number TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.phone_number,
    p.role,
    p.created_at,
    u.email
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  ORDER BY p.created_at DESC;
END;
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.update_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_role TO service_role;
GRANT EXECUTE ON FUNCTION public.get_all_users TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users TO service_role;
GRANT EXECUTE ON FUNCTION public.is_user_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_admin TO service_role;

-- Add comments
COMMENT ON FUNCTION public.update_user_role IS 'Update user role (admin management)';
COMMENT ON FUNCTION public.get_all_users IS 'Get all users with roles for admin dashboard';
COMMENT ON FUNCTION public.is_user_admin IS 'Check if user has admin role';

-- Create admin user (optional - run this to create first admin)
-- Replace 'admin@example.com' with actual admin email
-- This should be run after the first admin registration

-- Manual admin creation query (run manually if needed):
-- UPDATE profiles SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');
