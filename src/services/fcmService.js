/**
 * FCMService — Firebase Cloud Messaging
 * Handles push notification token registration and foreground messages.
 *
 * Non-critical: all paths wrapped in try/catch; failure never crashes the app.
 * Permission is requested only after login, never on first open.
 *
 * Background push to locked screens requires a Cloud Functions backend
 * to call FCM's send API — not available in vanilla JS. See SESSION_REPORT_S16.md.
 */

import { messaging, getToken, onMessage, VAPID_KEY } from '../config/firebase.js';
import FirebaseService from './firebaseService.js';

class FCMService {

  async requestPermissionAndRegister(guestId) {
    try {
      const existingToken = localStorage.getItem(`ar_fcm_token_${guestId}`);

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      const swReg = await navigator.serviceWorker.getRegistration('/sw.js');
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swReg,
      });

      if (!token) {
        console.warn('No FCM token received');
        return false;
      }

      if (token !== existingToken) {
        await FirebaseService.saveFCMToken(guestId, token);
        localStorage.setItem(`ar_fcm_token_${guestId}`, token);
      }

      onMessage(messaging, (payload) => {
        this._handleForegroundMessage(payload);
      });

      console.log('FCM registered for guest:', guestId);
      return true;
    } catch (e) {
      console.warn('FCM registration failed:', e.message);
      return false;
    }
  }

  _handleForegroundMessage(payload) {
    const { title, body } = payload.notification || {};
    const message = body || title || 'AR Airways notification';

    // Reuse the existing announcement banner from app.js
    document.querySelector('.announcement-banner')?.remove();
    const banner = document.createElement('div');
    banner.className = 'announcement-banner announcement-banner--urgent';
    banner.innerHTML = `
      <div class="announcement-banner__icon">✈</div>
      <div class="announcement-banner__text">${_esc(message)}</div>
      <button class="announcement-banner__close" aria-label="Close">×</button>
    `;
    banner.querySelector('.announcement-banner__close').addEventListener('click', () => banner.remove());
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 8000);
  }
}

function _esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default new FCMService();
