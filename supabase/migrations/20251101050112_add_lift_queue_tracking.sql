/*
  # Add Queue Tracking to Lifts

  1. Changes
    - Add `queue_count` column to `lifts` table to track people waiting
    - Add `capacity` column to track maximum people in lift
    - Add `current_occupancy` column to track current people in lift

  2. Notes
    - All columns have safe defaults
    - No data loss with IF NOT EXISTS checks
*/

-- Add queue tracking columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lifts' AND column_name = 'queue_count'
  ) THEN
    ALTER TABLE lifts ADD COLUMN queue_count integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lifts' AND column_name = 'capacity'
  ) THEN
    ALTER TABLE lifts ADD COLUMN capacity integer DEFAULT 10;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lifts' AND column_name = 'current_occupancy'
  ) THEN
    ALTER TABLE lifts ADD COLUMN current_occupancy integer DEFAULT 0;
  END IF;
END $$;
