/**
 * AR Airways — Firebase Configuration
 * Aayush Resort Wedding · 22-24 January 2027
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
  getDatabase, ref, push, set, get,
  onValue, query, orderByChild, limitToLast, remove
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, listAll } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyBNSRwju-YBwkLG70D93bXJeqNT_Ew5rUo",
  authDomain: "ar-airways-2027.firebaseapp.com",
  databaseURL: "https://ar-airways-2027-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ar-airways-2027",
  storageBucket: "ar-airways-2027.firebasestorage.app",
  messagingSenderId: "602808657534",
  appId: "1:602808657534:web:43519c91ee3e113b519a2f"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const messaging = getMessaging(app);
const storage = getStorage(app);

// VAPID key — from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → Key pair
const VAPID_KEY = 'BL_PGI0-mbOhcln5XIuUTgZ2kdONWKMtZBTuAIVDxlNj_hSU3gZRCF4bJe5z0zNm_MuQb1Rfy9L0akajJkQfenM';

export {
  db, ref, push, set, get, onValue, query, orderByChild, limitToLast, remove,
  messaging, getToken, onMessage, VAPID_KEY,
  storage, storageRef, uploadBytes, getDownloadURL, listAll,
};
