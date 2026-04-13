(function () {
  'use strict';
  if (window.__aiubIntroEnhanced) return;
  window.__aiubIntroEnhanced = true;

  /* -- Helpers -------------------------------------------------- */
  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function titleCase(str) {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
  function getStudentName() {
    const el = document.querySelector('.navbar-text .navbar-link small') ||
               document.querySelector('.navbar-text .navbar-link');
    if (!el) return '';
    const raw = el.textContent.trim();
    const parts = raw.split(',').map(s => s.trim());
    if (parts.length >= 2) return titleCase(parts[1]) + ' ' + titleCase(parts[0]);
    return titleCase(raw);
  }
  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  /* -- CSS ------------------------------------------------------ */
  const CSS = `<style id="intro-style">

/* ── Root panel reset ─────────────────────────────────────────── */
.intro-root-panel { border: none !important; box-shadow: none !important; }
.intro-root-panel > .panel-heading { display: none !important; }
.intro-root-panel > .panel-body { background: transparent !important; border: none !important; padding: 16px 4px !important; }

/* ── Page header ──────────────────────────────────────────────── */
.intro-page-header { margin-bottom: 18px; padding-bottom: 14px; border-bottom: 2px solid #f1f5f9; }
.intro-page-title { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 3px; }
.intro-page-title span { color: #2563eb; }
.intro-page-sub { font-size: 13px; color: #6b7280; margin: 0; }

/* ── Alerts ───────────────────────────────────────────────────── */
#main-content .alert { border: none !important; border-radius: 10px !important; font-size: 13px !important; padding: 12px 16px !important; box-shadow: 0 1px 4px rgba(0,0,0,.05) !important; margin-bottom: 14px !important; }
#main-content .alert-success { background: #f0fdf4 !important; color: #166534 !important; border-left: 4px solid #22c55e !important; }
#main-content .alert-success a { color: #166534 !important; }
#main-content .alert-success .table-bordered { border-radius: 8px !important; overflow: hidden; border-color: #bbf7d0 !important; }
#main-content .alert-success .table-bordered td { border-color: #bbf7d0 !important; padding: 7px 12px !important; }
#main-content .alert-success .btn-primary { background: linear-gradient(135deg,#1d4ed8,#3b82f6) !important; border: none !important; border-radius: 8px !important; font-weight: 600 !important; }
#main-content .alert-warning { background: #fffbeb !important; color: #92400e !important; border-left: 4px solid #f59e0b !important; }

/* ── Action buttons panel ─────────────────────────────────────── */
.intro-actions { border: none !important; box-shadow: none !important; background: transparent !important; margin-bottom: 14px !important; }
.intro-actions > .panel-body { padding: 0 !important; }
.intro-actions .text-center { display: flex; gap: 8px; flex-wrap: wrap; }
.intro-actions .btn { border-radius: 8px !important; font-size: 13px !important; font-weight: 600 !important; padding: 9px 18px !important; border: none !important; box-shadow: 0 1px 4px rgba(0,0,0,.1) !important; transition: transform .12s, box-shadow .12s !important; }
.intro-actions .btn:hover { transform: translateY(-1px); box-shadow: 0 3px 8px rgba(0,0,0,.15) !important; }
.intro-actions .btn-danger { background: linear-gradient(135deg,#dc2626,#ef4444) !important; color: #fff !important; }
.intro-actions .btn-info   { background: linear-gradient(135deg,#0284c7,#38bdf8) !important; color: #fff !important; }

</style>`;

  /* -- Main enhance --------------------------------------------- */
  function enhance() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    document.head.insertAdjacentHTML('beforeend', CSS);

    /* Page header */
    const contentWrap = mainContent.querySelector('.row > .col-sm-12') ||
                        mainContent.querySelector('.row > .col-xs-12') ||
                        mainContent.querySelector('.row > [class*="col-"]');
    if (contentWrap) {
      const name = getStudentName();
      const firstName = name.split(' ')[0] || 'Student';
      const dateStr = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      contentWrap.insertAdjacentHTML('afterbegin',
        '<div class="intro-page-header">' +
          '<h2 class="intro-page-title">' + getGreeting() + ', <span>' + escHtml(firstName) + '</span>!</h2>' +
          '<p class="intro-page-sub">' + escHtml(dateStr) + '</p>' +
        '</div>'
      );
    }

    /* Action buttons panel */
    const regBtn = mainContent.querySelector('.text-center .btn-danger');
    if (regBtn) {
      const panel = regBtn.closest('.panel');
      if (panel) panel.classList.add('intro-actions');
    }
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
