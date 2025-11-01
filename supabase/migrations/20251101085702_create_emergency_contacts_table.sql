/*
  # Create Emergency Contacts Table

  1. New Tables
    - `emergency_contacts`
      - `id` (uuid, primary key)
      - `university_id` (uuid, foreign key to universities)
      - `category` (text) - e.g., 'Security', 'Medical', 'Administration', 'Student Services'
      - `name` (text) - Name of the contact/department
      - `phone` (text) - Phone number
      - `email` (text) - Email address
      - `location` (text) - Physical location/building
      - `available_hours` (text) - Operating hours
      - `is_emergency` (boolean) - Whether this is for emergency use (e.g., 24/7 security)
      - `display_order` (integer) - Order to display contacts
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `emergency_contacts` table
    - Add policy for authenticated users to read contacts from their university
*/

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid REFERENCES universities(id),
  category text NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  email text DEFAULT '',
  location text DEFAULT '',
  available_hours text DEFAULT '9:00 AM - 5:00 PM',
  is_emergency boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view emergency contacts from their university"
  ON emergency_contacts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.university_id = emergency_contacts.university_id
    )
  );

-- Insert sample emergency contacts for Taylor's University
INSERT INTO emergency_contacts (university_id, category, name, phone, email, location, available_hours, is_emergency, display_order)
SELECT 
  id,
  'Emergency Services',
  'Campus Security (24/7)',
  '+60 3-5629 5000',
  'security@taylors.edu.my',
  'Security Office - Main Campus',
  '24/7',
  true,
  1
FROM universities WHERE code = 'TAYLORS'
ON CONFLICT DO NOTHING;

INSERT INTO emergency_contacts (university_id, category, name, phone, email, location, available_hours, is_emergency, display_order)
SELECT 
  id,
  'Emergency Services',
  'Medical Centre',
  '+60 3-5629 5100',
  'medical@taylors.edu.my',
  'Block A, Level 1',
  '8:00 AM - 6:00 PM',
  true,
  2
FROM universities WHERE code = 'TAYLORS'
ON CONFLICT DO NOTHING;

INSERT INTO emergency_contacts (university_id, category, name, phone, email, location, available_hours, is_emergency, display_order)
SELECT 
  id,
  'Emergency Services',
  'Fire & Emergency',
  '999',
  '',
  'National Emergency Line',
  '24/7',
  true,
  3
FROM universities WHERE code = 'TAYLORS'
ON CONFLICT DO NOTHING;

INSERT INTO emergency_contacts (university_id, category, name, phone, email, location, available_hours, is_emergency, display_order)
SELECT 
  id,
  'Student Services',
  'Student Support Centre',
  '+60 3-5629 5200',
  'studentservices@taylors.edu.my',
  'Block B, Level 2',
  '9:00 AM - 5:00 PM',
  false,
  4
FROM universities WHERE code = 'TAYLORS'
ON CONFLICT DO NOTHING;

INSERT INTO emergency_contacts (university_id, category, name, phone, email, location, available_hours, is_emergency, display_order)
SELECT 
  id,
  'Student Services',
  'Counselling Services',
  '+60 3-5629 5300',
  'counselling@taylors.edu.my',
  'Block B, Level 3',
  '9:00 AM - 5:00 PM',
  false,
  5
FROM universities WHERE code = 'TAYLORS'
ON CONFLICT DO NOTHING;

INSERT INTO emergency_contacts (university_id, category, name, phone, email, location, available_hours, is_emergency, display_order)
SELECT 
  id,
  'Administration',
  'IT Help Desk',
  '+60 3-5629 5400',
  'ithelpdesk@taylors.edu.my',
  'Library Block, Level 1',
  '8:00 AM - 8:00 PM',
  false,
  6
FROM universities WHERE code = 'TAYLORS'
ON CONFLICT DO NOTHING;

INSERT INTO emergency_contacts (university_id, category, name, phone, email, location, available_hours, is_emergency, display_order)
SELECT 
  id,
  'Administration',
  'Finance Office',
  '+60 3-5629 5500',
  'finance@taylors.edu.my',
  'Block C, Level 1',
  '9:00 AM - 5:00 PM',
  false,
  7
FROM universities WHERE code = 'TAYLORS'
ON CONFLICT DO NOTHING;

INSERT INTO emergency_contacts (university_id, category, name, phone, email, location, available_hours, is_emergency, display_order)
SELECT 
  id,
  'Facilities',
  'Facilities Management',
  '+60 3-5629 5600',
  'facilities@taylors.edu.my',
  'Block A, Ground Floor',
  '8:00 AM - 6:00 PM',
  false,
  8
FROM universities WHERE code = 'TAYLORS'
ON CONFLICT DO NOTHING;