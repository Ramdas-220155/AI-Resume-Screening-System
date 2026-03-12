/* ============================================================
   toast.js — Global toast notification system
   window.showToast(message, type) available everywhere
   ============================================================ */

(function () {
  const COLORS = { success: '#10b981', error: '#ef4444', info: '#7c3aed' };
  const ICONS  = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };

  // Inject keyframes once
  const style = document.createElement('style');
  style.textContent = `
    @keyframes tsSlideIn  { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:translateX(0)} }
    @keyframes tsSlideOut { to  {opacity:0;transform:translateX(28px)} }
  `;
  document.head.appendChild(style);

  window.showToast = function (message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.style.cssText =
        'position:fixed;top:76px;right:18px;z-index:9999;' +
        'display:flex;flex-direction:column;gap:9px;';
      document.body.appendChild(container);
    }

    const color = COLORS[type] || COLORS.info;
    const icon  = ICONS[type]  || ICONS.info;

    const el = document.createElement('div');
    el.style.cssText = `
      background: rgba(6,10,28,0.97);
      border: 1px solid ${color};
      border-left: 3px solid ${color};
      border-radius: 9px;
      padding: 12px 18px;
      color: #f0f6ff;
      font-family: 'Open Sans', sans-serif;
      font-size: 14px; font-weight: 600;
      display: flex; align-items: center; gap: 10px;
      box-shadow: 0 8px 28px rgba(0,0,0,0.55);
      backdrop-filter: blur(14px);
      min-width: 270px; max-width: 340px;
      cursor: pointer;
      animation: tsSlideIn 0.3s ease both;
    `;
    el.innerHTML = `
      <i class="fa-solid ${icon}" style="color:${color};font-size:16px;flex-shrink:0;"></i>
      <span>${message}</span>
    `;
    el.addEventListener('click', () => dismiss(el));
    container.appendChild(el);
    setTimeout(() => dismiss(el), 3800);
  };

  function dismiss(el) {
    el.style.animation = 'tsSlideOut 0.28s ease forwards';
    setTimeout(() => el.remove(), 300);
  }
})();
