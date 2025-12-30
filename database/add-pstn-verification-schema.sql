-- PSTN & Verification Schema Extension (COS-34)
-- Adds phone number and verification fields to support PSTN functionality
-- E.164 format: international phone numbers (e.g., +1234567890)

-- =============================================================================
-- USERS TABLE EXTENSIONS
-- =============================================================================

-- Add phone_number column to users table (E.164 format)
-- E.164 format supports up to 15 digits + country code prefix (e.g., +1 for US)
-- VARCHAR(20) provides sufficient space for formatting characters
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Add phone verification status to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Create index for phone_number lookups (useful for authentication/verification)
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number) WHERE phone_number IS NOT NULL;

-- Add column comments for documentation
COMMENT ON COLUMN users.phone_number IS 'E.164 format phone number (e.g., +1234567890) for PSTN functionality';
COMMENT ON COLUMN users.is_verified IS 'Phone number verification status - true if phone number has been verified';

-- =============================================================================
-- ADVISOR PROFILE TABLE EXTENSIONS
-- =============================================================================

-- Add phone_number column to advisor_profile table (E.164 format)
ALTER TABLE advisor_profile ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Add status column to advisor_profile table for approval workflow
-- Status values: PENDING (default), APPROVED, REJECTED
ALTER TABLE advisor_profile ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING';

-- Add CHECK constraint for status values (only if constraint doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'advisor_profile_status_check'
  ) THEN
    ALTER TABLE advisor_profile ADD CONSTRAINT advisor_profile_status_check 
      CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));
  END IF;
END $$;

-- Create index for status lookups (useful for filtering advisors by approval status)
CREATE INDEX IF NOT EXISTS idx_advisor_profile_status ON advisor_profile(status);

-- Create index for phone_number lookups in advisor_profile
CREATE INDEX IF NOT EXISTS idx_advisor_profile_phone_number ON advisor_profile(phone_number) WHERE phone_number IS NOT NULL;

-- Add column comments for documentation
COMMENT ON COLUMN advisor_profile.phone_number IS 'E.164 format phone number for advisor PSTN functionality';
COMMENT ON COLUMN advisor_profile.status IS 'Advisor approval status: PENDING (awaiting review), APPROVED (active advisor), REJECTED (denied)';

