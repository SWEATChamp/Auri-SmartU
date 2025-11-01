/*
  # Remove Public Access Policies

  1. Changes
    - Remove all public read access policies that bypass university filtering
    - Keep only the university-specific authenticated policies

  2. Security
    - Users must be authenticated to see data
    - Data is filtered by university (or all data for Demo users)
*/

-- Remove public access policies
DROP POLICY IF EXISTS "Public read access for classrooms" ON classrooms;
DROP POLICY IF EXISTS "Public read access for lifts" ON lifts;
DROP POLICY IF EXISTS "Public read access for parking" ON parking_lots;
DROP POLICY IF EXISTS "Public read access for library seats" ON library_seats;
DROP POLICY IF EXISTS "Public read access for food stalls" ON food_stalls;
DROP POLICY IF EXISTS "Public read access for courses" ON courses;
DROP POLICY IF EXISTS "Public read access for POI traffic" ON poi_traffic;
DROP POLICY IF EXISTS "Public read access for POIs" ON pois;
