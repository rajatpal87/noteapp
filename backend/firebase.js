const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
let firebaseAdmin = null;

try {
  // Check if Firebase credentials are available
  if (process.env.FIREBASE_PROJECT_ID && 
      process.env.FIREBASE_CLIENT_EMAIL && 
      process.env.FIREBASE_PRIVATE_KEY) {
    
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: "firebase-private-key-id",
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: "firebase-client-id",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };

    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
  } else {
    console.log('⚠️  Firebase credentials not found. Authentication will be disabled.');
  }
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization failed:', error.message);
}

// Middleware to verify Firebase ID token
const verifyFirebaseToken = async (req, res, next) => {
  try {
    // Skip authentication for health check and login routes
    if (req.path === '/api/health' || req.path === '/api/auth/status') {
      return next();
    }

    if (!firebaseAdmin) {
      return res.status(503).json({
        success: false,
        error: 'Authentication service unavailable',
        message: 'Firebase is not configured'
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No valid authorization token provided'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    try {
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture
      };
      next();
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'The provided token is invalid or expired'
      });
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
};

// Check if Firebase is configured
const isFirebaseConfigured = () => {
  return firebaseAdmin !== null;
};

module.exports = {
  firebaseAdmin,
  verifyFirebaseToken,
  isFirebaseConfigured
};
