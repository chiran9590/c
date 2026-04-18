-- ========================================
-- STEP 4: Performance Indexes
-- ========================================

-- Index for faster profile lookups by user ID (already primary key, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- Index for full name searches (if you plan to search users by name)
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);

-- Index for phone number searches (if you plan to search by phone)
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON profiles(phone_number) WHERE phone_number IS NOT NULL AND phone_number != '';

-- Index for created_at (for sorting by registration date)
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- Composite index for common queries (full name + created_at)
CREATE INDEX IF NOT EXISTS idx_profiles_name_created ON profiles(full_name, created_at DESC);

-- Add comments for indexes
COMMENT ON INDEX idx_profiles_id IS 'Primary index for user profile lookups';
COMMENT ON INDEX idx_profiles_full_name IS 'Index for full name searches';
COMMENT ON INDEX idx_profiles_phone_number IS 'Index for phone number searches';
COMMENT ON INDEX idx_profiles_created_at IS 'Index for sorting by registration date';
COMMENT ON INDEX idx_profiles_name_created IS 'Composite index for name + date queries';
