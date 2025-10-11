const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials not found. Using in-memory storage.');
  console.warn('   Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables to use database.');
}

// Create Supabase client
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Fallback in-memory storage when database is not available
let fallbackNotes = [
  {
    id: '1',
    title: 'Welcome to your Note App!',
    content: 'This is your first note. You can edit, delete, or create new notes. Note: This is stored temporarily in memory.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Database Setup',
    content: 'To persist your notes permanently, set up Supabase database following the deployment guide.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Database operations
class Database {
  constructor() {
    this.supabase = supabase;
    this.isConnected = !!supabase;
  }

  // Check if database is connected
  async checkConnection() {
    if (!this.isConnected) {
      return { connected: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await this.supabase
        .from('notes')
        .select('count')
        .limit(1);

      if (error) {
        console.error('Database connection error:', error);
        return { connected: false, error: error.message };
      }

      return { connected: true, error: null };
    } catch (err) {
      console.error('Database connection error:', err);
      return { connected: false, error: err.message };
    }
  }

  // Get all notes for a specific user
  async getAllNotes(userId) {
    if (!this.isConnected) {
      // Return fallback notes when database is not connected
      return fallbackNotes.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }

    try {
      const { data, error } = await this.supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch notes: ${error.message}`);
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching notes:', err);
      // Fallback to in-memory storage on database error
      console.log('Falling back to in-memory storage');
      return fallbackNotes.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }
  }

  // Get a specific note by ID and user ID
  async getNoteById(id, userId) {
    if (!this.isConnected) {
      // Search in fallback notes
      const note = fallbackNotes.find(n => n.id === id);
      if (!note) {
        throw new Error('Note not found');
      }
      return note;
    }

    try {
      const { data, error } = await this.supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Note not found');
        }
        throw new Error(`Failed to fetch note: ${error.message}`);
      }

      return data;
    } catch (err) {
      console.error('Error fetching note:', err);
      // Fallback to in-memory storage
      const note = fallbackNotes.find(n => n.id === id);
      if (!note) {
        throw new Error('Note not found');
      }
      return note;
    }
  }

  // Create a new note
  async createNote(title, content, userId) {
    if (!this.isConnected) {
      // Create note in fallback storage
      const { v4: uuidv4 } = require('uuid');
      const newNote = {
        id: uuidv4(),
        title: title.trim(),
        content: content.trim(),
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      fallbackNotes.push(newNote);
      return newNote;
    }

    try {
      const noteData = {
        title: title.trim(),
        content: content.trim(),
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('notes')
        .insert([noteData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create note: ${error.message}`);
      }

      return data;
    } catch (err) {
      console.error('Error creating note:', err);
      // Fallback to in-memory storage
      const { v4: uuidv4 } = require('uuid');
      const newNote = {
        id: uuidv4(),
        title: title.trim(),
        content: content.trim(),
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      fallbackNotes.push(newNote);
      return newNote;
    }
  }

  // Update an existing note
  async updateNote(id, title, content, userId) {
    if (!this.isConnected) {
      // Update note in fallback storage
      const noteIndex = fallbackNotes.findIndex(n => n.id === id);
      if (noteIndex === -1) {
        throw new Error('Note not found');
      }
      
      fallbackNotes[noteIndex] = {
        ...fallbackNotes[noteIndex],
        title: title.trim(),
        content: content.trim(),
        updated_at: new Date().toISOString()
      };
      
      return fallbackNotes[noteIndex];
    }

    try {
      const updateData = {
        title: title.trim(),
        content: content.trim(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('notes')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Note not found');
        }
        throw new Error(`Failed to update note: ${error.message}`);
      }

      return data;
    } catch (err) {
      console.error('Error updating note:', err);
      // Fallback to in-memory storage
      const noteIndex = fallbackNotes.findIndex(n => n.id === id);
      if (noteIndex === -1) {
        throw new Error('Note not found');
      }
      
      fallbackNotes[noteIndex] = {
        ...fallbackNotes[noteIndex],
        title: title.trim(),
        content: content.trim(),
        updated_at: new Date().toISOString()
      };
      
      return fallbackNotes[noteIndex];
    }
  }

  // Delete a note
  async deleteNote(id, userId) {
    if (!this.isConnected) {
      // Delete note from fallback storage
      const noteIndex = fallbackNotes.findIndex(n => n.id === id);
      if (noteIndex === -1) {
        throw new Error('Note not found');
      }
      
      const deletedNote = fallbackNotes.splice(noteIndex, 1)[0];
      return deletedNote;
    }

    try {
      const { data, error } = await this.supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Note not found');
        }
        throw new Error(`Failed to delete note: ${error.message}`);
      }

      return data;
    } catch (err) {
      console.error('Error deleting note:', err);
      // Fallback to in-memory storage
      const noteIndex = fallbackNotes.findIndex(n => n.id === id);
      if (noteIndex === -1) {
        throw new Error('Note not found');
      }
      
      const deletedNote = fallbackNotes.splice(noteIndex, 1)[0];
      return deletedNote;
    }
  }

  // Get total count of notes for a specific user
  async getNotesCount(userId) {
    if (!this.isConnected) {
      // Return fallback notes count
      return fallbackNotes.length;
    }

    try {
      const { count, error } = await this.supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to get notes count: ${error.message}`);
      }

      return count || 0;
    } catch (err) {
      console.error('Error getting notes count:', err);
      // Fallback to in-memory storage count
      return fallbackNotes.length;
    }
  }
}

module.exports = new Database();
