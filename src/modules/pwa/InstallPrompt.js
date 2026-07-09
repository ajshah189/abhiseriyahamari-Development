/**
 * PWA Install Prompt
 *
 * Captures the browser's beforeinstallprompt event and shows a custom,
 * on-brand install banner instead of the default browser one.
 *
 * Shows once per session (or until dismissed). Dismissed state stored in
 * localStorage. Never shows if already running in standalone mode.
 * Delays 30 seconds so guests can explore before being prompted.
 */

let deferredPrompt = null;
let bannerEl = null;
let showTimer = null;

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches;
}

function isDismissed() {
  return !!localStorage.getItem("ar_install_dismissed");
}

function showBanner() {
  if (bannerEl || !deferredPrompt) return;

  bannerEl = document.createElement("div");
  bannerEl.className = "pwa-install-banner";
  bannerEl.innerHTML = `
    <div class="pwa-install-banner__body">
      <span class="pwa-install-banner__icon">✈</span>
      <div class="pwa-install-banner__text">
        <strong>Add AR Airways to your home screen</strong>
        <span>Open instantly during the wedding</span>
      </div>
    </div>
    <div class="pwa-install-banner__actions">
      <button class="pwa-install-banner__install" data-install>Install</button>
      <button class="pwa-install-banner__dismiss" data-dismiss>Not now</button>
    </div>
  `;

  document.body.appendChild(bannerEl);

  bannerEl.querySelector("[data-install]").addEventListener("click", onInstall);
  bannerEl.querySelector("[data-dismiss]").addEventListener("click", onDismiss);
}

function hideBanner() {
  if (!bannerEl) return;
  bannerEl.classList.add("pwa-install-banner--hiding");
  setTimeout(() => {
    bannerEl?.remove();
    bannerEl = null;
  }, 300);
}

async function onInstall() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  hideBanner();
  if (outcome === "accepted") showToast();
}

function onDismiss() {
  localStorage.setItem("ar_install_dismissed", "1");
  hideBanner();
}

function showToast() {
  const toast = document.createElement("div");
  toast.className = "pwa-toast";
  toast.textContent = "AR Airways added to your home screen ✈";
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("pwa-toast--visible"));
  setTimeout(() => {
    toast.classList.remove("pwa-toast--visible");
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

export function initInstallPrompt() {
  if (isStandalone() || isDismissed()) return;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showTimer = setTimeout(showBanner, 30_000);
  });

  window.addEventListener("appinstalled", () => {
    clearTimeout(showTimer);
    hideBanner();
  });
}
