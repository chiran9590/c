-- ========================================
-- STEP 3: Automatic Profile Creation Trigger
-- ========================================

-- Function to create profile automatically when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert new profile with user metadata
  INSERT INTO public.profiles (id, full_name, phone_number)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(new.raw_user_meta_data->>'phone_number', '')
  );
  
  -- Return the user for successful trigger
  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    -- Handle case where profile already exists
    RETURN new;
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;

-- Create trigger that fires when a new user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO service_role;

-- Add comments
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates profile when new user signs up';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger for automatic profile creation';
