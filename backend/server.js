const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// In-memory storage for notes (in production, use a database)
let notes = [
  {
    id: '1',
    title: 'Welcome to your Note App!',
    content: 'This is your first note. You can edit, delete, or create new notes.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Features Available',
    content: '✅ Create new notes\n✅ View all notes\n✅ Edit existing notes\n✅ Delete notes\n✅ Responsive design',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    totalNotes: notes.length
  });
});

// GET /api/notes - Get all notes
app.get('/api/notes', (req, res) => {
  try {
    res.json({
      success: true,
      data: notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
      total: notes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notes'
    });
  }
});

// GET /api/notes/:id - Get a specific note
app.get('/api/notes/:id', (req, res) => {
  try {
    const note = notes.find(n => n.id === req.params.id);
    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }
    res.json({
      success: true,
      data: note
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch note'
    });
  }
});

// POST /api/notes - Create a new note
app.post('/api/notes', (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }

    const newNote = {
      id: uuidv4(),
      title: title.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    notes.push(newNote);
    
    res.status(201).json({
      success: true,
      data: newNote,
      message: 'Note created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create note'
    });
  }
});

// PUT /api/notes/:id - Update a note
app.put('/api/notes/:id', (req, res) => {
  try {
    const { title, content } = req.body;
    const noteIndex = notes.findIndex(n => n.id === req.params.id);
    
    if (noteIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }

    notes[noteIndex] = {
      ...notes[noteIndex],
      title: title.trim(),
      content: content.trim(),
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: notes[noteIndex],
      message: 'Note updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update note'
    });
  }
});

// DELETE /api/notes/:id - Delete a note
app.delete('/api/notes/:id', (req, res) => {
  try {
    const noteIndex = notes.findIndex(n => n.id === req.params.id);
    
    if (noteIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    const deletedNote = notes.splice(noteIndex, 1)[0];
    
    res.json({
      success: true,
      data: deletedNote,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete note'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: 'The requested endpoint does not exist'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: 'Something went wrong!'
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`📝 Note App running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 API endpoints: http://localhost:${PORT}/api/notes`);
  console.log(`🌐 Also accessible via: http://127.0.0.1:${PORT}`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try a different port.`);
  }
});

module.exports = app;
