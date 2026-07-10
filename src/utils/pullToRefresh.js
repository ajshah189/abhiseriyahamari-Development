/**
 * pullToRefresh(container, onRefresh)
 *
 * Adds pull-to-refresh behavior to a scrollable container.
 * Shows a gold ✈ spinning indicator at the top.
 * Calls onRefresh() when pulled past threshold.
 * Safe to call multiple times on the same container — attaches once.
 *
 * @param {HTMLElement} container  The scrollable screen container
 * @param {Function}    onRefresh  Called when refresh is triggered
 */
export function pullToRefresh(container, onRefresh) {
  if (container._pullToRefreshBound) return;
  container._pullToRefreshBound = true;

  let startY = 0;
  let pulling = false;
  let indicator = null;
  const THRESHOLD = 80;

  container.style.position = 'relative';

  container.addEventListener('touchstart', (e) => {
    if (container.scrollTop === 0) {
      startY = e.touches[0].clientY;
      pulling = true;
    }
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (!pulling) return;
    const dy = e.touches[0].clientY - startY;
    if (dy <= 0) { pulling = false; return; }

    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'pull-indicator';
      indicator.innerHTML = '✈';
      container.prepend(indicator);
    }

    const progress = Math.min(dy / THRESHOLD, 1);
    indicator.style.opacity = String(progress);
    indicator.style.transform = `translateX(-50%) translateY(${Math.min(dy * 0.4, 32)}px) rotate(${progress * 45}deg)`;
  }, { passive: true });

  container.addEventListener('touchend', async () => {
    if (!pulling || !indicator) { pulling = false; return; }
    pulling = false;

    const translateMatch = indicator.style.transform.match(/translateY\((\d+(?:\.\d+)?)px\)/);
    const dy = translateMatch ? parseFloat(translateMatch[1]) : 0;

    if (dy >= THRESHOLD * 0.4) {
      indicator.style.animation = 'pull-spin 0.6s linear infinite';
      await onRefresh();
    }

    indicator.style.opacity = '0';
    setTimeout(() => { indicator?.remove(); indicator = null; }, 300);
  }, { passive: true });
}
