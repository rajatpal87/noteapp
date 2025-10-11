-- Updated Supabase Database Schema for Note App with Firebase Authentication
-- Run this SQL in your Supabase SQL Editor to support user-specific notes

-- Add user_id column to existing notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);

-- Create index for better performance on user queries
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);

-- Update existing notes (optional - sets all current notes to a default user)
-- You can skip this if you want to start fresh
UPDATE notes SET user_id = 'default-user' WHERE user_id IS NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON notes;
DROP POLICY IF EXISTS "Enable insert access for all users" ON notes;
DROP POLICY IF EXISTS "Enable update access for all users" ON notes;
DROP POLICY IF EXISTS "Enable delete access for all users" ON notes;

-- Create new user-based policies for Firebase authentication
-- Note: These policies use auth.uid() which works with Supabase Auth
-- For Firebase Auth, we'll use the user_id column instead

-- Policy for reading notes (users can only see their own notes)
CREATE POLICY "Users can read their own notes" ON notes
    FOR SELECT USING (user_id = auth.uid()::text OR user_id IS NULL);

-- Policy for inserting notes (users can only create notes for themselves)
CREATE POLICY "Users can insert their own notes" ON notes
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Policy for updating notes (users can only update their own notes)
CREATE POLICY "Users can update their own notes" ON notes
    FOR UPDATE USING (user_id = auth.uid()::text);

-- Policy for deleting notes (users can only delete their own notes)
CREATE POLICY "Users can delete their own notes" ON notes
    FOR DELETE USING (user_id = auth.uid()::text);

-- Alternative policies for Firebase authentication (if not using Supabase Auth)
-- Uncomment these if you're using Firebase Auth instead of Supabase Auth:

/*
-- For Firebase Auth, we'll rely on the backend to filter by user_id
-- and disable RLS or use more permissive policies

-- Option 1: Disable RLS (backend handles security)
-- ALTER TABLE notes DISABLE ROW LEVEL SECURITY;

-- Option 2: Allow all operations (backend filters by user_id)
CREATE POLICY "Allow all operations for Firebase users" ON notes
    FOR ALL USING (true) WITH CHECK (true);
*/

-- Create a function to get notes count for a specific user
CREATE OR REPLACE FUNCTION get_user_notes_count(user_uuid TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM notes 
        WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get notes for a specific user
CREATE OR REPLACE FUNCTION get_user_notes(user_uuid TEXT)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    content TEXT,
    user_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT n.id, n.title, n.content, n.user_id, n.created_at, n.updated_at
    FROM notes n
    WHERE n.user_id = user_uuid
    ORDER BY n.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON notes TO anon;
GRANT ALL ON notes TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notes_count(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_user_notes_count(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notes(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_user_notes(TEXT) TO authenticated;

-- Insert some sample data for testing (optional)
-- INSERT INTO notes (title, content, user_id) VALUES
-- ('Welcome to your Note App!', 'This is your first note stored in Supabase database with user authentication.', 'sample-user-id'),
-- ('Database Features', '✅ Notes stored in Supabase PostgreSQL\n✅ User-specific notes\n✅ Firebase authentication\n✅ Real-time updates\n✅ Automatic timestamps\n✅ UUID primary keys\n✅ Row Level Security enabled', 'sample-user-id');
