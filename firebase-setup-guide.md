# 🔥 Firebase Setup Guide

## Quick Setup Steps

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Name: `note-app-auth`
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Google Authentication
1. Go to "Authentication" → "Get started"
2. Click "Sign-in method" tab
3. Click "Google"
4. Toggle "Enable"
5. Enter your project support email
6. Click "Save"

### 3. Get Web App Configuration
1. Go to "Project settings" (gear icon)
2. Scroll to "Your apps" section
3. Click "Add app" → Web app icon (`</>`)
4. App nickname: `note-app-web`
5. Click "Register app"
6. **Copy the firebaseConfig object**

### 4. Get Service Account Credentials
1. In Project Settings, go to "Service accounts" tab
2. Click "Generate new private key"
3. Download the JSON file
4. **Save these values:**
   - `project_id`
   - `client_email`
   - `private_key`

### 5. Update Your Code

#### Frontend Configuration (`public/index.html`)
Replace lines 13-20 with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyC...", // Your actual API key
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-actual-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```

#### Render Environment Variables
Set these in your Render dashboard:

| Variable | Value | Example |
|----------|-------|---------|
| `FIREBASE_PROJECT_ID` | Your project ID | `note-app-auth-12345` |
| `FIREBASE_CLIENT_EMAIL` | Service account email | `firebase-adminsdk-abc123@note-app-auth-12345.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Full private key with quotes | `"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----"` |

### 6. Test Authentication
1. Save your changes
2. Restart your local server
3. Try signing in with Google
4. You should see the authentication flow work

## Troubleshooting

### Common Issues:
1. **Invalid API Key**: Make sure you copied the correct API key from Firebase
2. **Domain not authorized**: Add your domain to Firebase authorized domains
3. **Service account error**: Ensure the private key includes the full key with BEGIN/END markers

### For Render Deployment:
- Make sure all environment variables are set correctly
- The private key should include the full key with line breaks as `\n`
- Test locally first before deploying to Render
