(function () {
  if (window.__aiubNavbarEnhanced) return;

  chrome.storage.sync.get({ extensionEnabled: true }, (r) => {
    if (!r.extensionEnabled) return;

    function tryEnhance() {
      const topbar = document.querySelector('.topbar-container');
      if (!topbar) { setTimeout(tryEnhance, 200); return; }
      if (window.__aiubNavbarEnhanced) return;
      window.__aiubNavbarEnhanced = true;
      enhance(topbar);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tryEnhance);
    } else {
      tryEnhance();
    }
  });

  function enhance(topbar) {
    // ── Outer navbar ──────────────────────────────────────────────────────────
    const navbar = topbar.closest('nav') || topbar.closest('.navbar') || topbar.parentElement;
    if (navbar) {
      navbar.style.cssText = `
        background: linear-gradient(180deg, #f8fafc 0%, #e0e7ff 100%) !important;
        border: none !important;
        border-bottom: 2px solid #1a73c8 !important;
        box-shadow: 0 2px 8px rgba(26,115,200,0.10) !important;
        min-height: 85px !important;
        height: 85px !important;
        padding: 0 !important;
        margin-bottom: 20px !important;
        overflow: visible !important;
        display: flex !important;
        align-items: center !important;
      `;
    }

    // ── Topbar — preserve original Bootstrap layout, only style ──────────────
    topbar.style.cssText = `
      background: transparent !important;
      min-height: 85px !important;
      height: 85px !important;
      padding: 0 !important;
      width: 100% !important;
      box-sizing: border-box !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      overflow: visible !important;
    `;

    // ── Navbar header (brand + mobile toggle) ─────────────────────────────────
    const navHeader = topbar.querySelector('.navbar-header');
    if (navHeader) {
      navHeader.style.cssText = `
        display: flex !important;
        align-items: center !important;
        float: left !important;
        margin-right: 0 !important;
        overflow: visible !important;
        height: 85px !important;
        min-height: 85px !important;
      `;
    }

    // ── Brand — keep original logo fully visible ──────────────────────────────
    const brand = topbar.querySelector('.navbar-brand');
    if (brand) {
      const existing = brand.querySelector('.aiub-logo-text');
      if (existing) existing.remove();

      brand.style.cssText = `
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 5px 12px !important;
        float: left !important;
        height: 85px !important;
        min-height: 85px !important;
        line-height: 1 !important;
        text-decoration: none !important;
        overflow: visible !important;
        box-sizing: border-box !important;
      `;

      // Make sure any img or inner elements inside brand are fully visible
      brand.querySelectorAll('img').forEach(img => {
        img.style.cssText = `
          max-height: 60px !important;
          height: auto !important;
          width: auto !important;
          display: block !important;
          object-fit: contain !important;
        `;
      });
    }

    // ── Navbar header must not clip the logo ──────────────────────────────────
    const navHeaderEl = topbar.querySelector('.navbar-header');
    if (navHeaderEl) {
      navHeaderEl.style.overflow = 'visible !important';
    }

    // ── Mobile toggle ─────────────────────────────────────────────────────────
    const toggle = topbar.querySelector('.navbar-toggle');
    if (toggle) {
      toggle.style.display = 'none !important';
    }

    // ── Collapse container ────────────────────────────────────────────────────
    const collapse = topbar.querySelector('.navbar-collapse');
    if (collapse) {
      collapse.style.cssText = `
        padding: 0 8px 0 0 !important;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        display: flex !important;
        align-items: center !important;
        justify-content: flex-end !important;
        margin-left: auto !important;
        height: 85px !important;
        min-height: 85px !important;
      `;
    }

    // ── Quick nav links (left side, desktop) ──────────────────────────────────
    const quickNav = topbar.querySelector('ul.nav.navbar-nav.hidden-md');
    if (quickNav) {
      quickNav.style.cssText = `
        float: left !important;
        margin: 0 !important;
        padding: 0 !important;
        list-style: none !important;
        height: 85px !important;
      `;
      quickNav.querySelectorAll('li').forEach(li => {
        li.style.cssText = 'float: left !important; display: flex !important; align-items: center !important; position: relative !important; height: 85px !important;';
        const a = li.querySelector('a');
        if (a) styleNavLink(a);
      });
    }

    // ── Style each right-side nav ul ──────────────────────────────────────────
    const allLists = topbar.querySelectorAll('.navbar-collapse .navbar-nav');
    let logoutLi = null;

    allLists.forEach(ul => {
      ul.querySelectorAll('li').forEach(li => {
        const a = li.querySelector('a[href*="Logout"]');
        if (a) logoutLi = li;
      });
    });

    allLists.forEach(ul => {
      ul.style.cssText = `
        margin: 0 !important;
        padding: 0 !important;
        list-style: none !important;
        display: flex !important;
        align-items: center !important;
        height: 85px !important;
        float: none !important;
      `;
      ul.querySelectorAll('li').forEach(li => {
        if (li === logoutLi) return;
        li.style.cssText = `
          display: flex !important;
          align-items: center !important;
          height: 85px !important;
          position: relative !important;
          float: none !important;
        `;
      });
    });

    if (logoutLi) {
      logoutLi.style.cssText = `
        display: flex !important;
        align-items: center !important;
        height: 85px !important;
        position: relative !important;
        float: none !important;
        margin-left: auto !important;
      `;
    }

    // ── Welcome / user block ──────────────────────────────────────────────────
    const welcomeP = topbar.querySelector('.navbar-text');
    if (welcomeP) {
      welcomeP.style.cssText = `
        display: flex !important;
        align-items: center !important;
        float: none !important;
        margin: 0 !important;
        padding: 0 10px !important;
        height: 85px !important;
        color: #374151 !important;
        font-size: 14px !important;
        font-family: system-ui,-apple-system,sans-serif !important;
        font-weight: 500 !important;
        white-space: nowrap !important;
        line-height: 1 !important;
      `;

      // Remove previously injected welcome label
      const existingLabel = welcomeP.querySelector('.aiub-welcome-label');
      if (existingLabel) existingLabel.remove();

      // Restore "Welcome" text node
      Array.from(welcomeP.childNodes).forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() === '') {
          node.textContent = 'Welcome ';
        }
      });

      const nameLink = welcomeP.querySelector('.navbar-link');
      if (nameLink) {
        nameLink.style.cssText = `
          color: #1a73c8 !important;
          font-weight: 700 !important;
          font-size: 14px !important;
          text-decoration: none !important;
          font-family: system-ui,-apple-system,sans-serif !important;
          text-transform: uppercase !important;
          margin-left: 6px !important;
        `;
        const small = nameLink.querySelector('small');
        if (small) {
          small.style.cssText = `
            font-size: 14px !important;
            font-weight: 700 !important;
            color: #1a73c8 !important;
            text-transform: uppercase !important;
          `;
        }
        nameLink.addEventListener('mouseenter', () => { nameLink.style.color = '#0d47a1 !important'; });
        nameLink.addEventListener('mouseleave', () => { nameLink.style.color = '#1a73c8 !important'; });
      }
    }

    // ── Logout button ─────────────────────────────────────────────────────────
    if (logoutLi) {
      const logoutA = logoutLi.querySelector('a');
      if (logoutA) styleActionBtn(logoutA, '#e53e3e');
    }

    // ── Notification button ────────────────────────────────────────────────────
    const notiA = topbar.querySelector('#noti_Button');
    if (notiA) {
      notiA.style.cssText = `
        display: flex !important;
        align-items: center !important;
        cursor: pointer !important;
        padding: 0 !important;
        height: 85px !important;
      `;
      const inner = notiA.querySelector('div');
      if (inner) styleActionBtn(inner, '#1a73c8', null, true);
    }

    // ── Settings dropdown toggle ───────────────────────────────────────────────
    const settingsA = topbar.querySelector('li.dropdown > a.dropdown-toggle');
    if (settingsA) styleActionBtn(settingsA, '#1a73c8');

    // ── Notification counter badge ─────────────────────────────────────────────
    const notiCounter = topbar.querySelector('#noti_Counter');
    if (notiCounter) {
      notiCounter.style.cssText = `
        position: absolute !important;
        top: 8px !important;
        right: 2px !important;
        min-width: 16px !important;
        height: 16px !important;
        background: #ef4444 !important;
        color: #fff !important;
        font-size: 9px !important;
        font-weight: 800 !important;
        border-radius: 999px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 0 3px !important;
        z-index: 10 !important;
        border: 2px solid #fff !important;
      `;
    }

    // ── Notifications dropdown ─────────────────────────────────────────────────
    const notiPanel = topbar.querySelector('#notifications');
    if (notiPanel) {
      notiPanel.style.cssText = `
        background: #fff !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 12px !important;
        box-shadow: 0 8px 32px rgba(0,0,0,0.14) !important;
        padding: 0 !important;
        overflow: hidden !important;
        min-width: 320px !important;
        top: 85px !important;
      `;
      const h3 = notiPanel.querySelector('h3');
      if (h3) {
        h3.style.cssText = `
          margin: 0 !important; padding: 12px 16px 10px !important;
          font-size: 14px !important; font-weight: 700 !important; color: #0f172a !important;
          background: linear-gradient(135deg,#f0f7ff,#e8f0fe) !important;
          border-bottom: 1px solid #e2e8f0 !important;
          font-family: system-ui,-apple-system,sans-serif !important;
          display: flex !important; justify-content: space-between !important; align-items: center !important;
        `;
        const closeLink = h3.querySelector('a');
        if (closeLink) closeLink.style.cssText = 'font-size:11px !important;font-weight:600 !important;color:#1a73c8 !important;text-decoration:none !important;float:none !important;';
      }
      const scroll = notiPanel.querySelector('.col-md-12[style*="overflow"]');
      if (scroll) {
        scroll.style.cssText = 'height:270px !important;overflow-y:auto !important;padding:8px 10px !important;';
        scroll.querySelectorAll('[ng-repeat] .row[style]').forEach((row, i) => {
          row.style.cssText = `margin:3px 0 !important;padding:8px 10px !important;background:${i%2===0?'#f0f7ff':'#f8fafc'} !important;border-radius:8px !important;color:#1e3a5f !important;`;
          row.addEventListener('mouseenter', () => { row.style.background = '#dbeafe !important'; });
          row.addEventListener('mouseleave', () => { row.style.background = `${i%2===0?'#f0f7ff':'#f8fafc'} !important`; });
        });
      }
      const seeAll = notiPanel.querySelector('.seeAll');
      if (seeAll) {
        seeAll.style.cssText = 'padding:10px 16px !important;text-align:center !important;background:linear-gradient(135deg,#f0f7ff,#e8f0fe) !important;border-top:1px solid #e2e8f0 !important;';
        const seeAllLink = seeAll.querySelector('a');
        if (seeAllLink) seeAllLink.style.cssText = 'font-size:12px !important;font-weight:700 !important;color:#1a73c8 !important;text-decoration:none !important;';
      }
    }

    // ── Settings dropdown menu ─────────────────────────────────────────────────
    const settingsMenu = topbar.querySelector('.dropdown-menu');
    if (settingsMenu) {
      settingsMenu.style.cssText = `
        background: #fff !important; border: 1px solid #e2e8f0 !important;
        border-radius: 10px !important; box-shadow: 0 6px 24px rgba(0,0,0,0.12) !important;
        padding: 6px !important; min-width: 180px !important; top: 77px !important;
      `;
      settingsMenu.querySelectorAll('li > a').forEach(a => {
        a.style.cssText = 'display:flex !important;align-items:center !important;padding:9px 13px !important;font-size:13px !important;font-weight:500 !important;color:#374151 !important;border-radius:8px !important;text-decoration:none !important;font-family:system-ui,-apple-system,sans-serif !important;';
        a.addEventListener('mouseenter', () => { a.style.background = '#f0f7ff !important'; a.style.color = '#1a73c8 !important'; });
        a.addEventListener('mouseleave', () => { a.style.background = 'transparent !important'; a.style.color = '#374151 !important'; });
      });
    }

    // ── Active page highlight ──────────────────────────────────────────────────
    const currentPath = window.location.pathname;
    topbar.querySelectorAll('a[href]').forEach(a => {
      try {
        const href = a.getAttribute('href');
        if (!href || href === '#') return;
        const linkPath = new URL(href, window.location.origin).pathname;
        if (currentPath.startsWith(linkPath) && linkPath !== '/Student') {
          a.style.background = 'rgba(26,115,200,0.10) !important';
          a.style.color = '#1a73c8 !important';
          a.style.borderRadius = '6px !important';
          a.querySelectorAll('.fa,.glyphicon').forEach(ic => ic.style.color = '#1a73c8 !important');
        }
      } catch (_) {}
    });
  }

  function styleNavLink(a) {
    a.style.cssText = `
      color: #374151 !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      font-family: system-ui,-apple-system,sans-serif !important;
      padding: 0 14px !important;
      height: 85px !important;
      display: flex !important;
      align-items: center !important;
      gap: 5px !important;
      transition: color 0.18s !important;
      text-decoration: none !important;
      white-space: nowrap !important;
    `;
    a.querySelectorAll('.fa,.glyphicon').forEach(ic => {
      ic.style.cssText = 'font-size: 13px !important; color: #1a73c8 !important; transition: color 0.18s !important;';
    });
    a.addEventListener('mouseenter', () => {
      a.style.color = '#1a73c8 !important';
      a.querySelectorAll('.fa,.glyphicon').forEach(ic => ic.style.color = '#0d47a1 !important');
    });
    a.addEventListener('mouseleave', () => {
      a.style.color = '#374151 !important';
      a.querySelectorAll('.fa,.glyphicon').forEach(ic => ic.style.color = '#1a73c8 !important');
    });
  }

  function styleActionBtn(el, color, label, isDiv = false) {
    el.style.cssText = `
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 0 10px !important;
      height: 85px !important;
      color: ${color} !important;
      text-decoration: none !important;
      border-radius: 0 !important;
      border: none !important;
      transition: background 0.18s !important;
      background: transparent !important;
      cursor: pointer !important;
      white-space: nowrap !important;
      vertical-align: middle !important;
    `;

    // Make icons prominent
    el.querySelectorAll('.fa,.glyphicon').forEach(ic => {
      ic.style.cssText = `font-size: 18px !important; color: ${color} !important; display: inline-block !important;`;
    });

    // Hide ALL text spans/nodes — icon only
    el.querySelectorAll('span:not(.fa):not(.glyphicon), .hidden-lg, .hidden-md, .hidden-sm, .hidden-xs, b, small').forEach(span => {
      span.style.display = 'none !important';
    });

    // Hide caret from settings dropdown
    el.querySelectorAll('.caret').forEach(c => { c.style.display = 'none !important'; });

    const hoverBg = color === '#e53e3e'
      ? 'rgba(229,62,62,0.08)'
      : 'rgba(26,115,200,0.08)';
    if (!isDiv) {
      el.addEventListener('mouseenter', () => { el.style.background = hoverBg + ' !important'; });
      el.addEventListener('mouseleave', () => { el.style.background = 'transparent !important'; });
    }
  }
})();