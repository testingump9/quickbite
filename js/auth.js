import { auth, provider, ADMIN_EMAILS, isSuperAdmin } from './firebase.js';
import { signInWithPopup } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js';
import { db } from './firebase.js';
import Notifier from './notifications.js';

const notifier = new Notifier();

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('googleSignIn').addEventListener('click', signInWithGoogle);
});

async function signInWithGoogle() {
  const loader = document.getElementById('loader');
  const authMessage = document.getElementById('authMessage');
  
  loader.style.display = 'block';
  authMessage.textContent = '';
  
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Check if user document exists
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: new Date(),
        isAdmin: ADMIN_EMAILS.includes(user.email)
      });
    }
    
    // Check admin status
    if (ADMIN_EMAILS.includes(user.email)) {
      isSuperAdmin = true;
      const adminRef = doc(db, 'admins', user.uid);
      const adminDoc = await getDoc(adminRef);
      
      if (!adminDoc.exists()) {
        await setDoc(adminRef, {
          email: user.email,
          name: user.displayName,
          isSuperAdmin: true,
          createdAt: new Date()
        });
      }
      
      window.location.href = '/admin';
    } else {
      window.location.href = '/menu';
    }
    
  } catch (error) {
    loader.style.display = 'none';
    authMessage.textContent = 'Sign in failed: ' + error.message;
    authMessage.style.color = '#ff4444';
  }
}

// Auth state listener
auth.onAuthStateChanged(async (user) => {
  if (user) {
    const isAdmin = await checkAdminStatus(user.uid);
    
    if (window.location.pathname.includes('/admin') && !isAdmin) {
      window.location.href = '/';
    } else if (!window.location.pathname.includes('/admin') && isAdmin) {
      window.location.href = '/admin';
    }
  } else if (!window.location.pathname === '/') {
    window.location.href = '/';
  }
});

async function checkAdminStatus(userId) {
  const adminDoc = await getDoc(doc(db, 'admins', userId));
  return adminDoc.exists();
}