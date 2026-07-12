importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBNSRwju-YBwkLG70D93bXJeqNT_Ew5rUo",
  authDomain: "ar-airways-2027.firebaseapp.com",
  databaseURL: "https://ar-airways-2027-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ar-airways-2027",
  storageBucket: "ar-airways-2027.firebasestorage.app",
  messagingSenderId: "602808657534",
  appId: "1:602808657534:web:43519c91ee3e113b519a2f"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'AR Airways ✈', {
    body: body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [200, 100, 200]
  });
});
