// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const database = require('./database');
const { verifyFirebaseToken, isFirebaseConfigured } = require('./firebase');

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

// Database connection status
let dbStatus = {
  connected: false,
  error: null
};

// Check database connection on startup
database.checkConnection().then(status => {
  dbStatus = status;
  if (status.connected) {
    console.log('✅ Database connected successfully');
  } else {
    console.log('⚠️  Database connection failed:', status.error);
    console.log('   App will work with limited functionality');
  }
}).catch(err => {
  console.error('❌ Database connection error:', err);
  dbStatus = { connected: false, error: err.message };
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    let totalNotes = 0;
    if (dbStatus.connected) {
      totalNotes = await database.getNotesCount();
    }

    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbStatus,
      firebase: { configured: isFirebaseConfigured() },
      totalNotes: totalNotes
    });
  } catch (error) {
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbStatus,
      firebase: { configured: isFirebaseConfigured() },
      totalNotes: 0,
      warning: 'Could not get notes count'
    });
  }
});

// Authentication status endpoint
app.get('/api/auth/status', (req, res) => {
  const envStatus = {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing',
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? '✅ Set' : '❌ Missing'
  };
  
  // Only provide Firebase config if all required environment variables are set
  const hasAllRequiredEnvVars = process.env.FIREBASE_PROJECT_ID && 
                               process.env.FIREBASE_AUTH_DOMAIN && 
                               process.env.FIREBASE_API_KEY;
  
  let firebaseConfig = {};
  if (hasAllRequiredEnvVars) {
    firebaseConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      apiKey: process.env.FIREBASE_API_KEY
    };
    console.log('✅ Firebase config provided from environment variables');
  } else {
    console.log('❌ Firebase environment variables not complete - config not provided');
  }
  
  console.log('🔍 /api/auth/status - Firebase Config Check:', {
    projectId: process.env.FIREBASE_PROJECT_ID ? '✅ Set (' + process.env.FIREBASE_PROJECT_ID + ')' : '❌ Missing',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN ? '✅ Set (' + process.env.FIREBASE_AUTH_DOMAIN + ')' : '❌ Missing', 
    apiKey: process.env.FIREBASE_API_KEY ? '✅ Set (' + process.env.FIREBASE_API_KEY.substring(0, 10) + '...)' : '❌ Missing',
    firebaseConfigured: isFirebaseConfigured(),
    configProvided: hasAllRequiredEnvVars
  });
  
  res.json({
    success: true,
    firebaseConfigured: isFirebaseConfigured(),
    authenticationRequired: true,
    firebaseConfig: firebaseConfig,
    environmentStatus: envStatus
  });
});

        // GET /api/notes - Get all notes (PROTECTED)
        app.get('/api/notes', verifyFirebaseToken, async (req, res) => {
          try {
            console.log('🔍 GET /api/notes called - AUTH REQUIRED');
            console.log('🔍 Authenticated user:', req.user.email);
            
            const notes = await database.getAllNotes(req.user.uid);
            console.log('🔍 Found notes for user:', notes.length);
            
            res.json({
              success: true,
              data: notes,
              total: notes.length,
              storage: dbStatus.connected ? 'database' : 'memory'
            });
          } catch (error) {
            console.error('❌ Error fetching notes:', error);
            res.status(500).json({
              success: false,
              error: 'Failed to fetch notes',
              message: error.message
            });
          }
        });

// GET /api/notes/:id - Get a specific note (Protected)
app.get('/api/notes/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const note = await database.getNoteById(req.params.id, req.user.uid);
    res.json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    if (error.message === 'Note not found') {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch note',
      message: error.message
    });
  }
});

        // POST /api/notes - Create a new note (PROTECTED)
        app.post('/api/notes', verifyFirebaseToken, async (req, res) => {
          try {
            console.log('🔍 POST /api/notes called - AUTH REQUIRED');
            console.log('🔍 Authenticated user:', req.user.email);
            console.log('🔍 Request body:', req.body);
            
            const { title, content } = req.body;

            if (!title || !content) {
              return res.status(400).json({
                success: false,
                error: 'Title and content are required'
              });
            }

            console.log('🔍 Creating note for user:', req.user.uid);
            const newNote = await database.createNote(title, content, req.user.uid);
            console.log('🔍 Note created successfully:', newNote.id);

            res.status(201).json({
              success: true,
              data: newNote,
              message: 'Note created successfully',
              storage: dbStatus.connected ? 'database' : 'memory'
            });
          } catch (error) {
            console.error('❌ Error creating note:', error);
            res.status(500).json({
              success: false,
              error: 'Failed to create note',
              message: error.message
            });
          }
        });

// PUT /api/notes/:id - Update a note (Protected)
app.put('/api/notes/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }

    const updatedNote = await database.updateNote(req.params.id, title, content, req.user.uid);

    res.json({
      success: true,
      data: updatedNote,
      message: 'Note updated successfully',
      storage: dbStatus.connected ? 'database' : 'memory'
    });
  } catch (error) {
    console.error('Error updating note:', error);
    if (error.message === 'Note not found') {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update note',
      message: error.message
    });
  }
});

// DELETE /api/notes/:id - Delete a note (Protected)
app.delete('/api/notes/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const deletedNote = await database.deleteNote(req.params.id, req.user.uid);
    
    res.json({
      success: true,
      data: deletedNote,
      message: 'Note deleted successfully',
      storage: dbStatus.connected ? 'database' : 'memory'
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    if (error.message === 'Note not found') {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to delete note',
      message: error.message
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
try {
  console.log('🔧 Attempting to start server...');
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Note App running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📋 API endpoints: http://localhost:${PORT}/api/notes`);
    console.log(`🌐 Also accessible via: http://127.0.0.1:${PORT}`);
    console.log(`✅ SERVER STARTED SUCCESSFULLY - REDEPLOY TRIGGER`);
    console.log(`🔍 AUTH DOMAIN: ${process.env.FIREBASE_AUTH_DOMAIN}`);
  });
  
  server.on('error', (err) => {
    console.error('❌ Server startup error:', err);
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
    }
    process.exit(1);
  });
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}
