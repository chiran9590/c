-- ========================================
-- STEP 3: Fixed Profile Creation (No Trigger) - VERSION 2
-- ========================================

-- Drop existing function to avoid naming conflicts
DROP FUNCTION IF EXISTS public.create_user_profile CASCADE;

-- Function to create profile manually (called from frontend or API)
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  user_full_name TEXT,
  user_phone_number TEXT DEFAULT '',
  user_role TEXT DEFAULT 'client'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert new profile
  INSERT INTO public.profiles (id, full_name, phone_number, role)
  VALUES (user_id, user_full_name, user_phone_number, user_role);
  
  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, that's okay
    RETURN TRUE;
  WHEN OTHERS THEN
    -- Log error but don't fail
    RAISE WARNING 'Failed to create profile for user %: %', user_id, SQLERRM;
    RETURN FALSE;
END;
$$;

-- Grant permissions to execute the function
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO service_role;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO anon;

-- Add comment
COMMENT ON FUNCTION public.create_user_profile IS 'Manually creates user profile after signup with role support';
