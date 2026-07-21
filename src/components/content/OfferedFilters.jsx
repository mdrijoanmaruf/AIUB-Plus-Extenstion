import '../../content.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import OfferedCoursesFilter from '../content/OfferedCoursesFilter';

// ── Guard ──────────────────────────────────────────────────────────────────────
if (window.__aiubFilterInjected || localStorage.getItem('__aiubPortalEnabled') === '0') {
  // already running or disabled — do nothing
} else {
  window.__aiubFilterInjected = true;
  init();
}

// ── FooTable helpers ───────────────────────────────────────────────────────────

function waitForTable() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      const table = document.querySelector('table.footable');
      if (table && table.querySelector('tbody tr td')) { resolve(); }
      else if (attempts >= 60) { reject(new Error('FooTable not found after 30s')); }
      else { attempts++; setTimeout(check, 500); }
    };
    check();
  });
}

function parseRowElements(rows) {
  const courses = [];
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length < 3) return;
    const classId = cells[0].textContent.trim();
    if (!classId || !/^\d+$/.test(classId)) return;

    const fullTitle = cells[1]?.textContent.trim() || '';
    const status    = cells[2]?.textContent.trim() || '';
    const capacity  = parseInt(cells[3]?.textContent.trim(), 10) || 0;
    const count     = parseInt(cells[4]?.textContent.trim(), 10) || 0;

    const timeSlots = [];
    if (cells[5]) {
      cells[5].querySelectorAll('table tbody tr').forEach(tr => {
        const tc = tr.querySelectorAll('td');
        if (tc.length >= 3) timeSlots.push({
          classType: tc[0]?.textContent.trim() || '',
          day:       tc[1]?.textContent.trim() || '',
          startTime: tc[2]?.textContent.trim() || '',
          endTime:   tc[3]?.textContent.trim() || '',
          room:      tc[4]?.textContent.trim() || '',
        });
      });
    }

    const sectionMatch = fullTitle.match(/\[([^\]]+)\]$/);
    const section = sectionMatch ? sectionMatch[1] : '';
    const title   = fullTitle.replace(/\s*\[[^\]]+\]$/, '').trim();

    courses.push({ classId, title, section, fullTitle, status, capacity, count, timeSlots });
  });
  return courses;
}

function whenDrawDone(result) {
  return new Promise(resolve => {
    if (!result) { setTimeout(resolve, 600); return; }
    if (typeof result.then === 'function') { result.then(resolve, resolve); return; }
    if (typeof result.done === 'function') { result.done(resolve).fail(resolve); return; }
    setTimeout(resolve, 600);
  });
}

async function getAllCourses() {
  const table = document.querySelector('table.footable');
  let courses = [];

  if (typeof FooTable !== 'undefined' && FooTable.get) {
    try {
      const ft = FooTable.get(table);
      if (ft?.rows?.all?.length > 0) {
        const hidden = [];
        ft.rows.all.forEach(row => {
          const el = row.$el?.[0];
          if (el && el.style.display === 'none') { hidden.push(el); el.style.display = ''; }
        });
        courses = parseRowElements(table.querySelectorAll('tbody > tr'));
        hidden.forEach(el => { el.style.display = 'none'; });
        if (courses.length > 10) return courses;
      }
    } catch (e) { console.warn('[AIUB Filter] rows.all failed:', e); }

    try {
      const ft = FooTable.get(table);
      const paging = ft?.use?.(FooTable.Paging);
      if (paging?.size != null) {
        const origSize = paging.size, origCurrent = paging.current || 1;
        paging.size = 99999;
        await whenDrawDone(ft.draw());
        courses = parseRowElements(table.querySelectorAll('tbody > tr'));
        paging.size = origSize; paging.current = origCurrent; ft.draw();
        if (courses.length > origSize) return courses;
      }
    } catch (e) { console.warn('[AIUB Filter] expand failed:', e); }
  }

  courses = parseRowElements(table.querySelectorAll('tbody > tr'));
  console.log('[AIUB Filter] DOM fallback:', courses.length);
  return courses;
}

// ── Mount ──────────────────────────────────────────────────────────────────────

async function init() {
  try {
    await waitForTable();

    // Show a loading indicator while parsing
    const mainContent = document.getElementById('main-content') || document.body;
    const mountPoint  = document.createElement('div');
    mountPoint.id     = 'aiub-filter-root';
    mountPoint.style.cssText = 'margin-bottom:18px;';

    const originalPanel =
      mainContent.querySelector('.panel.panel-default') ||
      mainContent.querySelector('.panel.panel-primary') ||
      mainContent.querySelector('.panel') ||
      mainContent.querySelector('table.footable');

    if (originalPanel && originalPanel.parentNode === mainContent) {
      mainContent.insertBefore(mountPoint, originalPanel);
    } else {
      mainContent.insertBefore(mountPoint, mainContent.firstChild);
    }

    // Temporary loading banner
    mountPoint.innerHTML = `
      <div style="border-radius:12px;overflow:hidden;box-shadow:0 2px 18px rgba(0,0,0,0.12);">
        <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#fff;padding:12px 20px;font-weight:700;">
          ⏳ Loading course data…
        </div>
        <div style="padding:14px 20px;color:#64748b;font-size:13px;background:linear-gradient(135deg,#f8fbff,#eff6ff);">
          Fetching all available courses. This may take a few seconds.
        </div>
      </div>`;

    const allCourses = await getAllCourses();
    console.log('[AIUB Filter] Parsed', allCourses.length, 'courses');

    if (allCourses.length === 0) {
      mountPoint.innerHTML = '<div style="padding:14px 20px;color:#ef4444;">No courses found.</div>';
      return;
    }

    const statuses = [...new Set(allCourses.map(c => c.status))].filter(Boolean).sort();

    // Clear loading banner and mount React component
    mountPoint.innerHTML = '';
    const root = createRoot(mountPoint);
    root.render(
      <React.StrictMode>
        <OfferedCoursesFilter
          allCourses={allCourses}
          statuses={statuses}
          originalPanel={originalPanel}
        />
      </React.StrictMode>
    );

    console.log('[AIUB Filter] React component mounted');
  } catch (err) {
    console.error('[AIUB Filter] Init failed:', err);
  }
}
