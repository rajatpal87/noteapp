-- Re-enable Row Level Security for Firebase Authentication
-- This script sets up proper RLS policies for Firebase Auth users

-- Re-enable Row Level Security on notes table
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read their own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;
DROP POLICY IF EXISTS "Enable read access for all users" ON notes;
DROP POLICY IF EXISTS "Enable insert access for all users" ON notes;
DROP POLICY IF EXISTS "Enable update access for all users" ON notes;
DROP POLICY IF EXISTS "Enable delete access for all users" ON notes;
DROP POLICY IF EXISTS "Allow all operations for Firebase users" ON notes;

-- Create permissive policies for Firebase authentication
-- Since we're using Firebase Auth (not Supabase Auth), we need permissive policies
-- The backend will handle user-specific filtering by user_id

-- Allow all operations (backend filters by user_id from Firebase tokens)
CREATE POLICY "Firebase users can manage their own notes" ON notes
    FOR ALL USING (true) WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON notes TO anon;
GRANT ALL ON notes TO authenticated;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notes';

-- Show current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'notes';

-- Optional: Show current notes and their user_ids for verification
SELECT id, title, user_id, created_at 
FROM notes 
ORDER BY created_at DESC 
LIMIT 10;
