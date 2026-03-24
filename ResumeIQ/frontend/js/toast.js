/* toast.js — Global toast notification system */
(function () {
  const COLORS = { success: "#10b981", error: "#ef4444", info: "#0d9488" };
  const ICONS = {
    success: "fa-circle-check",
    error: "fa-circle-xmark",
    info: "fa-circle-info",
  };
  const style = document.createElement("style");
  style.textContent =
    "@keyframes tsIn{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:translateX(0)}}@keyframes tsOut{to{opacity:0;transform:translateX(28px)}}";
  document.head.appendChild(style);
  window.showToast = function (msg, type = "info") {
    let c = document.getElementById("toastContainer");
    if (!c) {
      c = document.createElement("div");
      c.id = "toastContainer";
      c.style.cssText =
        "position:fixed;top:76px;right:18px;z-index:9999;display:flex;flex-direction:column;gap:9px;";
      document.body.appendChild(c);
    }
    const color = COLORS[type] || COLORS.info;
    const icon = ICONS[type] || ICONS.info;
    const el = document.createElement("div");
    el.style.cssText = `background:var(--surface,rgba(9,30,38,0.97));border:1px solid ${color};border-left:3px solid ${color};border-radius:9px;padding:12px 18px;color:var(--clr-head,#e2f8f6);font-family:var(--ff-body,'Plus Jakarta Sans',sans-serif);font-size:14px;font-weight:600;display:flex;align-items:center;gap:10px;box-shadow:0 8px 28px rgba(0,0,0,0.5);backdrop-filter:blur(14px);min-width:270px;max-width:340px;cursor:pointer;animation:tsIn 0.3s ease both;`;
    el.innerHTML = `<i class="fa-solid ${icon}" style="color:${color};font-size:16px;flex-shrink:0;"></i><span>${msg}</span>`;
    el.addEventListener("click", () => dismiss(el));
    c.appendChild(el);
    setTimeout(() => dismiss(el), 3800);
  };
  function dismiss(el) {
    el.style.animation = "tsOut 0.28s ease forwards";
    setTimeout(() => el.remove(), 300);
  }
})();
