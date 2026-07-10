/**
 * SplashScreen
 * Shows immediately on page load, before App.start() runs.
 * Hides once the app is ready to show the first screen.
 *
 * The splash HTML is injected synchronously at the top of script.js
 * (before the dynamic App import) so it appears even before module
 * resolution completes. This module cannot be statically imported by
 * script.js because static imports resolve before any code runs —
 * defeating the purpose of an early splash.
 *
 * The hideSplash helper below is duplicated inline in script.js for
 * the same reason. This file serves as documentation and is included
 * in the SW cache for completeness.
 */

export function hideSplash() {
  const el = document.getElementById('ar-splash');
  if (!el) return;
  el.style.transition = 'opacity 0.4s ease';
  el.style.opacity = '0';
  setTimeout(() => el.remove(), 400);
}
