/*
  # Add RLS Policies for Traffic Tables

  1. Changes
    - Enable RLS on `pois` and `poi_traffic` tables
    - Add public read access policies for both tables since traffic data should be viewable by everyone

  2. Security
    - Public read access (SELECT) for all users
    - Only authenticated users can modify data (future use)
*/

ALTER TABLE pois ENABLE ROW LEVEL SECURITY;
ALTER TABLE poi_traffic ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view POIs"
  ON pois
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can view traffic data"
  ON poi_traffic
  FOR SELECT
  TO public
  USING (true);
