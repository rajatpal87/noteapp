const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let firebaseAdmin = null;

try {
        // Debug environment variables
        console.log('🔍 Firebase environment variables check:', {
            FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? '✅ Set (' + process.env.FIREBASE_PROJECT_ID + ')' : '❌ Missing',
            FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN ? '✅ Set (' + process.env.FIREBASE_AUTH_DOMAIN + ')' : '❌ Missing',
            FIREBASE_API_KEY: process.env.FIREBASE_API_KEY ? '✅ Set (' + process.env.FIREBASE_API_KEY.substring(0, 10) + '...)' : '❌ Missing',
            FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set (' + process.env.FIREBASE_CLIENT_EMAIL.substring(0, 20) + '...)' : '❌ Missing',
            FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? '✅ Set (' + process.env.FIREBASE_PRIVATE_KEY.substring(0, 20) + '...)' : '❌ Missing'
        });
        
        // Check if Firebase credentials are available from Render environment variables
        if (process.env.FIREBASE_PROJECT_ID &&
            process.env.FIREBASE_AUTH_DOMAIN &&
            process.env.FIREBASE_API_KEY &&
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
            console.log('⚠️  Firebase credentials not found in environment variables. Authentication will be disabled.');
            console.log('   Required: FIREBASE_PROJECT_ID, FIREBASE_AUTH_DOMAIN, FIREBASE_API_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  }
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization failed:', error.message);
  console.error('❌ Full error details:', error);
  console.error('❌ Private key format check:', {
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    keyLength: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 0,
    startsWithBegin: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.includes('-----BEGIN') : false,
    endsWithEnd: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.includes('-----END') : false
  });
}

        // Middleware to verify Firebase ID token
        const verifyFirebaseToken = async (req, res, next) => {
          try {
            // Skip authentication for health check and login routes
            if (req.path === '/api/health' || req.path === '/api/auth/status') {
              return next();
            }

            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
              console.log('❌ No authorization header found');
              return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'No valid authorization token provided'
              });
            }

            const idToken = authHeader.split('Bearer ')[1];
            console.log('🔍 Verifying Firebase token:', idToken.substring(0, 20) + '...');

            if (!firebaseAdmin) {
              console.log('❌ Firebase Admin not initialized');
              return res.status(503).json({
                success: false,
                error: 'Authentication service unavailable',
                message: 'Firebase is not configured'
              });
            }

            try {
              const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
              console.log('✅ Token verified for user:', decodedToken.email);
              req.user = {
                uid: decodedToken.uid,
                email: decodedToken.email,
                name: decodedToken.name,
                picture: decodedToken.picture
              };
              next();
            } catch (tokenError) {
              console.error('❌ Token verification failed:', tokenError.message);
              return res.status(401).json({
                success: false,
                error: 'Invalid token',
                message: 'The provided token is invalid or expired'
              });
            }
          } catch (error) {
            console.error('❌ Authentication middleware error:', error);
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
