(function () {
  'use strict';
  if (window.__aiubRegHomeEnhanced) return;
  window.__aiubRegHomeEnhanced = true;

  /* -- Link external CSS --------------------------------------------- */
  function loadExternalCSS() {
    if (document.getElementById('reghome-style')) return;
    const link = document.createElement('link');
    link.id = 'reghome-style';
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('Home/Registration.css');
    document.head.appendChild(link);
  }

  /* -- Main enhance --------------------------------------------- */
  function enhance() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    loadExternalCSS();

    mainContent.querySelectorAll('.panel-heading .panel-title').forEach(title => {
      const txt = title.textContent.trim();
      if (txt === 'Registration') {
        const panel = title.closest('.panel');
        if (panel) {
          panel.classList.add('reghome-reg-panel');
          /* Inject section heading above the panel */
          panel.insertAdjacentHTML('beforebegin',
            '<div class="reghome-section-head">Course <span>Registration</span></div>'
          );
        }
      }
    });
  }

  /* -- Boot ----------------------------------------------------- */
  function tryEnhance() {
    if (document.getElementById('main-content')) {
      enhance();
    } else {
      setTimeout(tryEnhance, 200);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryEnhance);
  } else {
    tryEnhance();
  }
})();
