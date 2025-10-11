-- Supabase Database Schema for Note App
-- Run this SQL in your Supabase SQL Editor

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for this simple app)
-- In production, you would want more restrictive policies
CREATE POLICY "Enable read access for all users" ON notes
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON notes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON notes
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON notes
    FOR DELETE USING (true);

-- Insert some sample data
INSERT INTO notes (title, content) VALUES
('Welcome to your Note App!', 'This is your first note stored in Supabase database. You can edit, delete, or create new notes.'),
('Database Features', '✅ Notes stored in Supabase PostgreSQL\n✅ Real-time updates\n✅ Automatic timestamps\n✅ UUID primary keys\n✅ Row Level Security enabled');

-- Grant necessary permissions
GRANT ALL ON notes TO anon;
GRANT ALL ON notes TO authenticated;
