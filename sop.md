# QuickBite Implementation Guide

## 1. Firebase Setup
1. Create a new Firebase project at https://console.firebase.google.com/
2. Enable Authentication (Google Sign-In)
3. Enable Firestore Database
4. Enable Firebase Hosting
5. Add your web app and get configuration details

## 2. File Structure Setup
1. Create all folders and files as per the structure above
2. Copy the corresponding code into each file

## 3. Firebase Configuration
1. Add your Firebase config to `js/firebase.js`
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};