-- Re-enable Row Level Security for production
-- Run this after fixing authentication issues

-- Re-enable Row Level Security on notes table
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for Firebase authentication
-- Since we're using Firebase Auth (not Supabase Auth), we'll use permissive policies
-- and let the backend handle user filtering

-- Allow all operations (backend filters by user_id)
CREATE POLICY "Allow all operations for Firebase users" ON notes
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
