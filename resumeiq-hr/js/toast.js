/* ============================================================
   toast.js — Global Toast Notification System
   window.showToast(msg, type) — type: success | error | info
   ============================================================ */
(function () {
  const COLORS = { success:'#10b981', error:'#ef4444', info:'#7c3aed' };
  const ICONS  = { success:'fa-circle-check', error:'fa-circle-xmark', info:'fa-circle-info' };

  const kf = document.createElement('style');
  kf.textContent = `
    @keyframes tsIn  { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:translateX(0)} }
    @keyframes tsOut { to  {opacity:0;transform:translateX(28px)} }
  `;
  document.head.appendChild(kf);

  window.showToast = function (msg, type = 'info') {
    let box = document.getElementById('toastBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toastBox';
      box.style.cssText = 'position:fixed;top:76px;right:18px;z-index:9999;display:flex;flex-direction:column;gap:9px;';
      document.body.appendChild(box);
    }
    const c = COLORS[type] || COLORS.info;
    const ic = ICONS[type]  || ICONS.info;
    const el = document.createElement('div');
    el.style.cssText = `
      background:rgba(4,8,24,0.97);border:1px solid ${c};border-left:3px solid ${c};
      border-radius:9px;padding:12px 18px;color:#f0f6ff;
      font-family:'Open Sans',sans-serif;font-size:14px;font-weight:600;
      display:flex;align-items:center;gap:10px;
      box-shadow:0 8px 28px rgba(0,0,0,0.6);backdrop-filter:blur(14px);
      min-width:272px;max-width:340px;cursor:pointer;
      animation:tsIn 0.3s ease both;
    `;
    el.innerHTML = `<i class="fa-solid ${ic}" style="color:${c};font-size:16px;flex-shrink:0;"></i><span>${msg}</span>`;
    el.addEventListener('click', () => dismiss(el));
    box.appendChild(el);
    setTimeout(() => dismiss(el), 3800);
  };

  function dismiss(el) {
    el.style.animation = 'tsOut 0.28s ease forwards';
    setTimeout(() => el.remove(), 300);
  }
})();
