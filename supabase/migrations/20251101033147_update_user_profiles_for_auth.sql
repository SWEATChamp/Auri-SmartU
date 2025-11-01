/*
  # Update User Profiles Schema for Authentication

  1. Changes to Tables
    - Update `user_profiles` table
      - Rename `full_name` to `name`
      - Replace `program` with `university`
      - Add `email` (text, required)
      - Add `phone_number` (text, required)
      - Remove `year_of_study` and `preferences`

  2. Notes
    - User profiles will be created after signup
    - All fields are required for account creation
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE user_profiles RENAME COLUMN full_name TO name;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'program'
  ) THEN
    ALTER TABLE user_profiles RENAME COLUMN program TO university;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN email text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN phone_number text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'year_of_study'
  ) THEN
    ALTER TABLE user_profiles DROP COLUMN year_of_study;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'preferences'
  ) THEN
    ALTER TABLE user_profiles DROP COLUMN preferences;
  END IF;
END $$;

ALTER TABLE user_profiles ALTER COLUMN name SET NOT NULL;
ALTER TABLE user_profiles ALTER COLUMN university SET NOT NULL;
ALTER TABLE user_profiles ALTER COLUMN email SET NOT NULL;
ALTER TABLE user_profiles ALTER COLUMN phone_number SET NOT NULL;