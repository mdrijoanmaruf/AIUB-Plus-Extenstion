import { createRoot } from 'react-dom/client';
import { FiBell } from 'react-icons/fi';
import { scrapeNotices } from '../../utils/notices';

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
      notiA.addEventListener('mouseenter', () => { notiA.style.background = 'transparent !important'; });
      notiA.addEventListener('mouseleave', () => { notiA.style.background = 'transparent !important'; });
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
        background: rgba(255,255,255,0.85) !important;
        backdrop-filter: blur(16px) !important;
        -webkit-backdrop-filter: blur(16px) !important;
        border: 1px solid rgba(255,255,255,0.4) !important;
        border-radius: 12px !important;
        box-shadow: 0 8px 32px rgba(0,0,0,0.14) !important;
        padding: 0 !important;
        z-index: 9999 !important;
        min-width: 320px !important;
        top: 85px !important;
      `;
      const h3 = notiPanel.querySelector('h3');
      if (h3) {
        h3.style.cssText = `
          margin: 0 !important; padding: 12px 16px !important;
          font-size: 14px !important; font-weight: 700 !important; color: #1e3a5f !important;
          background: transparent !important;
          border-bottom: 1px solid rgba(0,0,0,0.05) !important;
          font-family: system-ui,-apple-system,sans-serif !important;
          display: flex !important; justify-content: space-between !important; align-items: center !important;
        `;
        const closeLink = h3.querySelector('a');
        if (closeLink) closeLink.style.cssText = 'font-size:11px !important;font-weight:600 !important;color:#1a73c8 !important;text-decoration:none !important;float:none !important;';
      }
      const scroll = notiPanel.querySelector('.col-md-12[style*="overflow"]');
      if (scroll) {
        scroll.style.cssText = 'max-height:400px !important;overflow-y:auto !important;padding:8px !important;';
      }
      const seeAll = notiPanel.querySelector('.seeAll');
      if (seeAll) {
        seeAll.style.cssText = 'padding:12px !important;margin:8px 8px 8px 8px !important;text-align:center !important;background:rgba(26,115,200,0.06) !important;border-radius:8px !important;transition:background 0.2s !important;border-top:none !important;';
        seeAll.addEventListener('mouseenter', () => { seeAll.style.background = 'rgba(26,115,200,0.12) !important'; });
        seeAll.addEventListener('mouseleave', () => { seeAll.style.background = 'rgba(26,115,200,0.06) !important'; });
        const seeAllLink = seeAll.querySelector('a');
        if (seeAllLink) seeAllLink.style.cssText = 'font-size:13px !important;font-weight:700 !important;color:#1a73c8 !important;text-decoration:none !important;display:block !important;';
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

    // ── Custom Notices Dropdown ────────────────────────────────────────────────
    setTimeout(async () => {
      try {
        const notiBtn = topbar.querySelector('#noti_Button');
        if (!notiBtn) return;
        const parentLi = notiBtn.parentElement;
        const ul = parentLi.parentElement;
        if (!ul) return;

        // Create the new list item for our notices button
        const customNotiLi = document.createElement('li');
        customNotiLi.style.cssText = `
          display: flex !important;
          align-items: center !important;
          height: 85px !important;
          position: relative !important;
          float: none !important;
          margin-right: 14px !important;
        `;
        
        customNotiLi.innerHTML = `
          <a id="aiub_custom_notices_btn" style="display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 7px !important; padding: 6px 14px !important; height: 36px !important; border-radius: 9999px !important; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important; border: 1px solid #bfdbfe !important; color: #1e40af !important; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; text-decoration: none !important; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important; cursor: pointer !important; box-shadow: 0 1px 3px rgba(37,99,235,0.08) !important; position: relative !important;">
            <span id="aiub_custom_notices_icon_wrapper" style="display: flex; align-items: center; justify-content: center; color: #2563eb;"></span>
            <span style="font-size: 12px; font-weight: 650; color: #1e40af; letter-spacing: -0.1px; white-space: nowrap;">AIUB Notices</span>
            <div id="aiub_custom_notices_counter" style="display: none !important; min-width: 18px !important; height: 18px !important; background: #ef4444 !important; color: #ffffff !important; font-size: 10px !important; font-weight: 800 !important; border-radius: 9999px !important; align-items: center !important; justify-content: center !important; padding: 0 4px !important; margin-left: 2px !important; box-shadow: 0 1px 4px rgba(239,68,68,0.3) !important;"></div>
          </a>
          <div id="aiub_custom_notices_dropdown" style="display: none; position: absolute; top: 77px; right: -50px; width: 380px; background: rgba(255,255,255,0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.4); border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.14); padding: 0; z-index: 9999; max-height: 400px; overflow-y: auto;">
             <div style="padding: 12px 16px; font-weight: 700; color: #1e3a5f; border-bottom: 1px solid rgba(0,0,0,0.05); font-family: system-ui, sans-serif; display: flex; justify-content: space-between; align-items: center;">
               Latest Notices from aiub.edu
               <a href="#" id="aiub_custom_notices_close" style="font-size:11px; font-weight:600; color:#1a73c8; text-decoration:none;">Close</a>
             </div>
             <div id="aiub_custom_notices_list" style="padding: 8px;">
               <div style="padding: 20px; text-align: center; color: #64748b; font-size: 13px;">Loading notices...</div>
             </div>
          </div>
        `;
        
        // Insert right before the native notification button
        ul.insertBefore(customNotiLi, parentLi);
        
        // Render FiBell
        const iconWrapper = customNotiLi.querySelector('#aiub_custom_notices_icon_wrapper');
        const iconRoot = createRoot(iconWrapper);
        iconRoot.render(<FiBell size={15} />);

        const btn = customNotiLi.querySelector('#aiub_custom_notices_btn');
        const dropdown = customNotiLi.querySelector('#aiub_custom_notices_dropdown');
        const list = customNotiLi.querySelector('#aiub_custom_notices_list');
        const counter = customNotiLi.querySelector('#aiub_custom_notices_counter');
        const closeBtn = customNotiLi.querySelector('#aiub_custom_notices_close');

        if (closeBtn) {
          closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropdown.style.display = 'none';
          });
        }

        btn.addEventListener('mouseenter', () => {
          btn.style.background = 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%) !important';
          btn.style.borderColor = '#93c5fd !important';
          btn.style.boxShadow = '0 3px 8px rgba(37,99,235,0.18) !important';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.background = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important';
          btn.style.borderColor = '#bfdbfe !important';
          btn.style.boxShadow = '0 1px 3px rgba(37,99,235,0.08) !important';
        });

        // Toggle dropdown visibility
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Close native notification dropdown if open
          if (parentLi && parentLi.classList.contains('open')) {
            parentLi.classList.remove('open');
          }

          const isHidden = dropdown.style.display === 'none';
          dropdown.style.display = isHidden ? 'block' : 'none';
          if (isHidden) {
            counter.style.display = 'none !important'; // dismiss badge on open
          }
        });

        // Close our custom dropdown when native notification is clicked
        notiBtn.addEventListener('click', () => {
          dropdown.style.display = 'none';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
          if (!customNotiLi.contains(e.target)) {
            dropdown.style.display = 'none';
          }
        });

        // Fetch notices
        const notices = await scrapeNotices();
        if (notices && notices.length > 0) {
          const topNotices = notices.slice(0, 15);
          
          counter.textContent = topNotices.length.toString();
          counter.style.display = 'flex !important';

          list.innerHTML = '';
          topNotices.forEach((notice, idx) => {
            const item = document.createElement('a');
            item.href = notice.url;
            item.target = '_blank';
            item.style.cssText = `
              display: block;
              padding: 10px 12px;
              margin-bottom: 6px;
              text-decoration: none;
              background: ${idx % 2 === 0 ? 'rgba(240,247,255,0.7)' : 'rgba(248,250,252,0.7)'};
              border-radius: 8px;
              transition: background 0.2s;
            `;
            item.addEventListener('mouseenter', () => item.style.background = 'rgba(219,234,254,0.9)');
            item.addEventListener('mouseleave', () => item.style.background = idx % 2 === 0 ? 'rgba(240,247,255,0.7)' : 'rgba(248,250,252,0.7)');
            
            item.innerHTML = `
              <div style="font-size: 13px; font-weight: 600; color: #1e3a5f; margin-bottom: 4px; line-height: 1.3;">${notice.title}</div>
              <div style="font-size: 11px; color: #64748b;">${notice.date}</div>
            `;
            list.appendChild(item);
          });
          
          // See More link
          const seeMore = document.createElement('a');
          seeMore.href = 'https://aiub.edu/category/notices';
          seeMore.target = '_blank';
          seeMore.style.cssText = `
            display: block;
            padding: 12px;
            margin-top: 8px;
            text-align: center;
            font-size: 13px;
            font-weight: 700;
            color: #1a73c8;
            text-decoration: none;
            background: rgba(26,115,200,0.06);
            border-radius: 8px;
            transition: background 0.2s;
          `;
          seeMore.addEventListener('mouseenter', () => seeMore.style.background = 'rgba(26,115,200,0.12)');
          seeMore.addEventListener('mouseleave', () => seeMore.style.background = 'rgba(26,115,200,0.06)');
          seeMore.innerHTML = 'See All Notices &rarr;';
          list.appendChild(seeMore);
        } else {
          list.innerHTML = '<div style="padding: 20px; text-align: center; color: #64748b; font-size: 13px;">No notices found.</div>';
        }
      } catch (err) {
        console.error('Failed to load notices', err);
      }
    }, 500); // slight delay to let native scripts finish loading

    // ── Inject Scrollbar and Hover Styles ──────────────────────────────────────
    if (!document.getElementById('aiub_custom_scrollbar_styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'aiub_custom_scrollbar_styles';
      styleEl.textContent = `
        /* Remove hover backgrounds for notification icons */
        .navbar-nav > li > a#noti_Button:hover,
        .navbar-nav > li > a#noti_Button:focus,
        .navbar-nav > li.open > a#noti_Button,
        .navbar-nav > li > a#aiub_custom_notices_btn:hover,
        .navbar-nav > li > a#aiub_custom_notices_btn:focus,
        .navbar-nav > li.open > a#aiub_custom_notices_btn {
          background-color: transparent !important;
          background: transparent !important;
        }

        /* Native Notification AngularJS Overrides */
        #notifications div[ng-repeat] .row {
          margin: 0 0 6px 0 !important;
          padding: 10px 12px !important;
          border-radius: 8px !important;
          color: #1e3a5f !important;
          transition: background 0.2s !important;
          border: none !important;
        }
        #notifications div[ng-repeat]:nth-child(even) .row {
          background: rgba(240,247,255,0.7) !important;
        }
        #notifications div[ng-repeat]:nth-child(odd) .row {
          background: rgba(248,250,252,0.7) !important;
        }
        #notifications div[ng-repeat] .row:hover {
          background: rgba(219,234,254,0.9) !important;
        }

        /* Thin light blue scrollbar for custom notices and native notifications */
        #aiub_custom_notices_dropdown::-webkit-scrollbar,
        #notifications .scrollable-menu::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        #aiub_custom_notices_dropdown::-webkit-scrollbar-track,
        #notifications .scrollable-menu::-webkit-scrollbar-track {
          background: rgba(240, 247, 255, 0.5); 
          border-radius: 8px;
        }
        #aiub_custom_notices_dropdown::-webkit-scrollbar-thumb,
        #notifications .scrollable-menu::-webkit-scrollbar-thumb {
          background: rgba(147, 197, 253, 0.9); 
          border-radius: 8px;
        }
        #aiub_custom_notices_dropdown::-webkit-scrollbar-thumb:hover,
        #notifications .scrollable-menu::-webkit-scrollbar-thumb:hover {
          background: rgba(96, 165, 250, 1);
        }
      `;
      document.head.appendChild(styleEl);
    }
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