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

  // Get all notes
  async getAllNotes() {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      const { data, error } = await this.supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch notes: ${error.message}`);
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching notes:', err);
      throw err;
    }
  }

  // Get a specific note by ID
  async getNoteById(id) {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      const { data, error } = await this.supabase
        .from('notes')
        .select('*')
        .eq('id', id)
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
      throw err;
    }
  }

  // Create a new note
  async createNote(title, content) {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      const noteData = {
        title: title.trim(),
        content: content.trim(),
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
      throw err;
    }
  }

  // Update an existing note
  async updateNote(id, title, content) {
    if (!this.isConnected) {
      throw new Error('Database not connected');
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
      throw err;
    }
  }

  // Delete a note
  async deleteNote(id) {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      const { data, error } = await this.supabase
        .from('notes')
        .delete()
        .eq('id', id)
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
      throw err;
    }
  }

  // Get total count of notes
  async getNotesCount() {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      const { count, error } = await this.supabase
        .from('notes')
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw new Error(`Failed to get notes count: ${error.message}`);
      }

      return count || 0;
    } catch (err) {
      console.error('Error getting notes count:', err);
      throw err;
    }
  }
}

module.exports = new Database();
