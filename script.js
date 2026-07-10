// ─── Utilities ───────────────────────────────────────────────────────────────

function hideSplash() {
  const el = document.getElementById('ar-splash');
  if (!el) return;
  el.style.transition = 'opacity 0.4s ease';
  el.style.opacity = '0';
  setTimeout(() => el.remove(), 400);
}

function showErrorScreen(error) {
  const splash = document.getElementById('ar-splash');
  if (splash) splash.remove();

  // Don't clobber a successfully-rendered app
  if (document.querySelectorAll('[id^="screen-"]').length > 0) return;

  document.body.innerHTML = `
    <div style="
      position:fixed;inset:0;
      background:#0c0f14;
      display:flex;flex-direction:column;
      align-items:center;justify-content:center;
      font-family:Inter,sans-serif;
      color:#d4af6a;
      gap:16px;
      padding:32px;
      text-align:center;
    ">
      <div style="font-size:48px">✈</div>
      <div style="font-size:24px;font-family:'Cormorant Garamond',serif;">
        Technical Delay
      </div>
      <div style="font-size:14px;color:#6b7280;max-width:280px;line-height:1.6;">
        AR Airways is experiencing a brief delay. Please try refreshing.
      </div>
      <button onclick="location.reload()" style="
        margin-top:16px;
        background:#d4af6a;
        color:#0c0f14;
        border:none;
        padding:12px 32px;
        border-radius:100px;
        font-family:Inter,sans-serif;
        font-weight:600;
        font-size:14px;
        cursor:pointer;
      ">
        Refresh Flight ↻
      </button>
    </div>
  `;
}

// ─── Global error boundary ───────────────────────────────────────────────────

window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  showErrorScreen(e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  if (e.reason?.critical) showErrorScreen(e.reason);
});

// ─── Splash screen ───────────────────────────────────────────────────────────
// Injected synchronously before the dynamic App import so it appears
// while module resolution is in progress.

const splash = document.createElement('div');
splash.id = 'ar-splash';
splash.innerHTML = `
  <div class="splash-inner">
    <div class="splash-plane">✈</div>
    <div class="splash-title">AR Airways</div>
    <div class="splash-subtitle">Riya &amp; Abhishek · 22–24 Jan 2027</div>
    <div class="splash-bar"><div class="splash-bar-fill"></div></div>
  </div>
`;
document.body.appendChild(splash);

// ─── Boot ────────────────────────────────────────────────────────────────────

console.log('1 - script.js loaded');

try {
  console.log('2 - calling App.start()');
  const { default: App } = await import('./src/app.js');
  App.start();
  console.log('3 - App.start() returned');
  // Small delay so first screen renders visibly before splash fades
  setTimeout(hideSplash, 300);
} catch (e) {
  console.error('App failed to start:', e);
  hideSplash();
  showErrorScreen(e);
}
