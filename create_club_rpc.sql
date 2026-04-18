-- ========================================
-- CREATE CLUB RPC FUNCTION (BACKUP)
-- ========================================

-- Create a function that bypasses RLS for club access
CREATE OR REPLACE FUNCTION get_all_clubs()
RETURNS TABLE (
  id UUID,
  club_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, club_name, created_at
  FROM clubs
  ORDER BY created_at DESC;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_clubs() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_clubs() TO anon;

-- Create function for user assignments
CREATE OR REPLACE FUNCTION get_all_assignments()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  club_id UUID,
  assigned_at TIMESTAMP WITH TIME ZONE,
  assigned_by UUID,
  user_full_name TEXT,
  user_email TEXT,
  club_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    uc.id,
    uc.user_id,
    uc.club_id,
    uc.assigned_at,
    uc.assigned_by,
    p.full_name as user_full_name,
    p.email as user_email,
    c.club_name
  FROM user_clubs uc
  JOIN profiles p ON uc.user_id = p.id
  JOIN clubs c ON uc.club_id = c.id
  ORDER BY uc.assigned_at DESC;
$$;

-- Grant execute permission for assignments
GRANT EXECUTE ON FUNCTION get_all_assignments() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_assignments() TO anon;

-- Test the functions
SELECT 'Testing club RPC:', * FROM get_all_clubs() LIMIT 5;
SELECT 'Testing assignments RPC:', * FROM get_all_assignments() LIMIT 5;
