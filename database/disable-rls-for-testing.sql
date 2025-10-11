-- Temporarily disable Row Level Security for testing
-- This allows the backend to handle user authentication without RLS interference

-- Disable Row Level Security on notes table
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies (they won't work anyway with RLS disabled)
DROP POLICY IF EXISTS "Users can read their own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;
DROP POLICY IF EXISTS "Enable read access for all users" ON notes;
DROP POLICY IF EXISTS "Enable insert access for all users" ON notes;
DROP POLICY IF EXISTS "Enable update access for all users" ON notes;
DROP POLICY IF EXISTS "Enable delete access for all users" ON notes;
DROP POLICY IF EXISTS "Allow all operations for Firebase users" ON notes;

-- Grant full access to anon and authenticated users
GRANT ALL ON notes TO anon;
GRANT ALL ON notes TO authenticated;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notes';

-- Show current policies (should be empty)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'notes';
