// Firebase App (the core Firebase SDK) is always required
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCMxp0jQCZkTeie4z04irrkrf3NapPFrUw",
  authDomain: "snacks-56049.firebaseapp.com",
  projectId: "snacks-56049",
  storageBucket: "snacks-56049.firebasestorage.app",
  messagingSenderId: "224074029257",
  appId: "1:224074029257:web:b3cba7039db2edc851d518",
  measurementId: "G-1JSYVEEQ94"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// List of admin emails (store in Firestore in production)
const ADMIN_EMAILS = ['admin@quickbite.com'];
let isSuperAdmin = false;

export { auth, db, provider, ADMIN_EMAILS, isSuperAdmin, 
         GoogleAuthProvider, signInWithPopup, 
         collection, doc, setDoc, getDoc, updateDoc, deleteDoc, 
         getDocs, query, where, orderBy, limit };