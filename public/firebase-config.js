// Firebase configuration for frontend
// You'll need to replace these with your actual Firebase config values

const firebaseConfig = {
  apiKey: "your-firebase-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google Auth Provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Authentication functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Get the ID token
    const idToken = await user.getIdToken();
    
    // Store the token in localStorage
    localStorage.setItem('firebaseToken', idToken);
    localStorage.setItem('user', JSON.stringify({
      uid: user.uid,
      email: user.email,
      name: user.displayName,
      picture: user.photoURL
    }));
    
    return { success: true, user, token: idToken };
  } catch (error) {
    console.error('Google sign-in error:', error);
    return { success: false, error: error.message };
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem('firebaseToken');
    localStorage.removeItem('user');
    return { success: true };
  } catch (error) {
    console.error('Sign-out error:', error);
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const getFirebaseToken = () => {
  return localStorage.getItem('firebaseToken');
};

export const isAuthenticated = () => {
  return !!getFirebaseToken();
};

// Listen for auth state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('User signed in:', user.email);
  } else {
    console.log('User signed out');
  }
});

export { auth, googleProvider };
