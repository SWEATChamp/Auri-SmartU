/*
  # Create Courses Table and Link Structure

  1. New Structure
    - courses: Degree programs (Bachelor of Computer Science, etc.)
    - course_module: Individual subjects (CS101, MATH101, etc.)
    - course_structure: Links degree programs to their required modules

  2. Changes
    - Create courses table for degree programs
    - Update course_structure to link courses to course_modules
    - Add proper foreign keys and constraints

  3. Security
    - Enable RLS on courses table
    - Users can only view courses from their university
*/

-- Create courses table for degree programs
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  duration_years integer DEFAULT 3,
  total_credits integer DEFAULT 120,
  university_id uuid REFERENCES universities(id),
  created_at timestamptz DEFAULT now()
);

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_code_university ON courses(code, university_id);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses
CREATE POLICY "Users can view courses from their university"
  ON courses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (
        user_profiles.university_id = (SELECT universities.id FROM universities WHERE universities.code = 'DEMO')
        OR user_profiles.university_id = courses.university_id
      )
    )
  );

CREATE POLICY "Users can insert courses"
  ON courses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can update courses"
  ON courses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete courses"
  ON courses
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    )
  );

-- Update course_structure table to link courses to course_modules
ALTER TABLE course_structure ADD COLUMN IF NOT EXISTS degree_program_id uuid REFERENCES courses(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_course_structure_degree ON course_structure(degree_program_id);

-- Update RLS policies for course_structure to consider degree programs
DROP POLICY IF EXISTS "Users can view course structure from their university" ON course_structure;

CREATE POLICY "Users can view course structure from their university"
  ON course_structure
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (
        user_profiles.university_id = (SELECT universities.id FROM universities WHERE universities.code = 'DEMO')
        OR EXISTS (
          SELECT 1 FROM courses c
          WHERE c.id = course_structure.degree_program_id
          AND c.university_id = user_profiles.university_id
        )
      )
    )
  );

-- Insert sample degree programs
DO $$
DECLARE
  taylor_id uuid;
  sunway_id uuid;
  monash_id uuid;
  
  taylor_cs_id uuid;
  sunway_se_id uuid;
  monash_ds_id uuid;
BEGIN
  -- Get university IDs
  SELECT id INTO taylor_id FROM universities WHERE code = 'TAYLOR';
  SELECT id INTO sunway_id FROM universities WHERE code = 'SUNWAY';
  SELECT id INTO monash_id FROM universities WHERE code = 'MONASH';
  
  -- Insert Taylor's Bachelor of Computer Science
  INSERT INTO courses (code, name, description, duration_years, total_credits, university_id)
  VALUES (
    'BCS',
    'Bachelor of Computer Science',
    'A comprehensive computer science program covering programming, algorithms, databases, AI, and software engineering.',
    4,
    120,
    taylor_id
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO taylor_cs_id;
  
  -- If not inserted (conflict), get existing ID
  IF taylor_cs_id IS NULL THEN
    SELECT id INTO taylor_cs_id FROM courses WHERE code = 'BCS' AND university_id = taylor_id;
  END IF;
  
  -- Insert Sunway's Bachelor of Software Engineering
  INSERT INTO courses (code, name, description, duration_years, total_credits, university_id)
  VALUES (
    'BSE',
    'Bachelor of Software Engineering',
    'Focused on software development, web technologies, and engineering principles.',
    3,
    90,
    sunway_id
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO sunway_se_id;
  
  IF sunway_se_id IS NULL THEN
    SELECT id INTO sunway_se_id FROM courses WHERE code = 'BSE' AND university_id = sunway_id;
  END IF;
  
  -- Insert Monash's Bachelor of Data Science
  INSERT INTO courses (code, name, description, duration_years, total_credits, university_id)
  VALUES (
    'BDS',
    'Bachelor of Data Science',
    'Combines mathematics, statistics, and computer science for data analysis and machine learning.',
    3,
    96,
    monash_id
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO monash_ds_id;
  
  IF monash_ds_id IS NULL THEN
    SELECT id INTO monash_ds_id FROM courses WHERE code = 'BDS' AND university_id = monash_id;
  END IF;
  
  -- Update existing course_structure records to link to degree programs
  UPDATE course_structure cs
  SET degree_program_id = taylor_cs_id
  FROM course_module cm
  WHERE cs.course_id = cm.id
    AND cm.university_id = taylor_id
    AND cs.degree_program_id IS NULL;
    
  UPDATE course_structure cs
  SET degree_program_id = sunway_se_id
  FROM course_module cm
  WHERE cs.course_id = cm.id
    AND cm.university_id = sunway_id
    AND cs.degree_program_id IS NULL;
    
  UPDATE course_structure cs
  SET degree_program_id = monash_ds_id
  FROM course_module cm
  WHERE cs.course_id = cm.id
    AND cm.university_id = monash_id
    AND cs.degree_program_id IS NULL;
END $$;

-- Update user_course_maps to reference the new courses table
DO $$
BEGIN
  -- Check if the foreign key exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_course_maps_course_id_fkey'
    AND table_name = 'user_course_maps'
  ) THEN
    -- Drop the old foreign key
    ALTER TABLE user_course_maps DROP CONSTRAINT user_course_maps_course_id_fkey;
  END IF;
  
  -- Add new foreign key to courses table
  ALTER TABLE user_course_maps 
  ADD CONSTRAINT user_course_maps_course_id_fkey 
  FOREIGN KEY (course_id) REFERENCES courses(id);
END $$;

-- Also update course_plans table
DO $$
BEGIN
  -- Check if the foreign key exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'course_plans_course_id_fkey'
    AND table_name = 'course_plans'
  ) THEN
    -- Drop the old foreign key
    ALTER TABLE course_plans DROP CONSTRAINT course_plans_course_id_fkey;
  END IF;
  
  -- course_plans.course_id should still reference course_module (individual modules in a plan)
  -- Keep it as is - it makes sense for planning individual modules
  ALTER TABLE course_plans 
  ADD CONSTRAINT course_plans_course_id_fkey 
  FOREIGN KEY (course_id) REFERENCES course_module(id);
END $$;
