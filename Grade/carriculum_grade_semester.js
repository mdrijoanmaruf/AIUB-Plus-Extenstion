(function () {
  'use strict';

  if (!window.location.href.includes('/Student/GradeReport/BySemester')) return;
  if (window.__aiubSemGradeEnhanced) return;
  window.__aiubSemGradeEnhanced = true;

  const GRADE_BG = {
    'A+': '#059669', 'A':  '#10b981',
    'B+': '#2563eb', 'B':  '#3b82f6',
    'C+': '#d97706', 'C':  '#f59e0b',
    'D+': '#dc2626', 'D':  '#ef4444',
    'F':  '#991b1b', 'W':  '#6b7280', 'UW': '#6b7280',
    '-':  '#7c3aed',
  };

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function gpaColor(v) {
    const n = parseFloat(v);
    if (isNaN(n) || n === 0) return '#64748b';
    if (n >= 3.5) return '#059669';
    if (n >= 3.0) return '#2563eb';
    if (n >= 2.5) return '#d97706';
    return '#dc2626';
  }

  function injectCSS() {
    if (document.getElementById('aiub-sgr-css')) return;
    const s = document.createElement('style');
    s.id = 'aiub-sgr-css';
    s.textContent = `
      .sgr-root-panel > .panel-heading { display: none !important; }
      .sgr-root-panel { box-shadow: none !important; border: none !important;
        background: transparent !important; margin-bottom: 0 !important; }
      .sgr-root-panel > .panel-body { padding: 0 !important; background: transparent !important; }

      .grade-report {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, sans-serif;
        font-size: 13px; color: #1e293b;
        background: transparent; border: none;
        border-radius: 0; padding: 16px 4px;
        box-shadow: none;
      }

      .sgr-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; padding-bottom:14px; border-bottom:2px solid #f1f5f9; }
      .sgr-title { font-size:16px; font-weight:700; color:#0f172a; letter-spacing:-.3px; margin:0; padding:0; }
      .sgr-title span { color:#2563eb; }
      .sgr-print { font-size:11px; font-weight:600; color:#475569; text-decoration:none; border:1px solid #cbd5e1; border-radius:6px; padding:5px 13px; background:#f8fafc; transition:background .15s,color .15s,border-color .15s; }
      .sgr-print:hover { background:#e0e7ff; color:#1d4ed8; border-color:#a5b4fc; text-decoration:none; }

      .sgr-info { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:20px; }
      .sgr-info-cell { padding:10px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; cursor:default; transition:box-shadow .15s,border-color .15s; }
      .sgr-info-cell:hover { box-shadow:0 2px 8px rgba(37,99,235,.08); border-color:#bfdbfe; }
      .sgr-info-lbl { font-size:10px; text-transform:uppercase; letter-spacing:.8px; color:#94a3b8; margin-bottom:4px; font-weight:600; }
      .sgr-info-val { font-size:13px; color:#0f172a; font-weight:500; }
      .sgr-info-val.cgpa { font-size:26px; font-weight:800; color:#059669; line-height:1.1; }

      .sgr-sem-card { border:1px solid #e2e8f0; border-radius:10px; overflow:hidden; margin-bottom:12px; }
      .sgr-sem-card--active { border-color:#6ee7b7; }

      .sgr-sem-head {
        display:flex; align-items:center; justify-content:space-between; gap:10px;
        padding:10px 14px; background:#f8fafc; border-bottom:1px solid #e2e8f0;
        cursor:pointer; user-select:none; transition:background .15s;
      }
      .sgr-sem-head:hover { background:#f1f5f9; }
      .sgr-sem-card--active .sgr-sem-head { background:#ecfdf5; border-bottom-color:#6ee7b7; }
      .sgr-sem-card.collapsed .sgr-sem-head { border-bottom:none; }

      .sgr-sem-label { font-size:12px; font-weight:700; color:#334155; display:flex; align-items:center; gap:7px; flex:1; min-width:0; }
      .sgr-sem-dot { width:8px; height:8px; border-radius:50%; background:#94a3b8; flex-shrink:0; }
      .sgr-sem-card--active .sgr-sem-dot { background:#059669; }

      .sgr-sem-meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; flex-shrink:0; }
      .sgr-sem-cnt { font-size:11px; color:#94a3b8; white-space:nowrap; }
      .sgr-sem-badge-active { font-size:10px; font-weight:700; background:#d1fae5; color:#065f46; border-radius:20px; padding:2px 9px; white-space:nowrap; }
      .sgr-sem-gpa { font-size:11px; color:#475569; white-space:nowrap; }
      .sgr-sem-gpa strong { color:#1d4ed8; }
      .sgr-sem-toggle { font-size:11px; color:#94a3b8; display:inline-block; transition:transform .2s; width:14px; text-align:center; flex-shrink:0; }
      .sgr-sem-card.collapsed .sgr-sem-toggle { transform:rotate(-90deg); }

      .sgr-sem-body { display:block; }
      .sgr-sem-card.collapsed .sgr-sem-body { display:none; }

      .sgr-tbl-wrap { overflow-x:auto; }
      .sgr-tbl { width:100%; border-collapse:collapse; font-size:13px; min-width:540px; }
      .sgr-tbl th {
        background:#f8fafc; padding:8px 10px; font-size:10px; font-weight:700;
        text-transform:uppercase; letter-spacing:.6px; color:#64748b;
        border-bottom:1px solid #e2e8f0; text-align:left; white-space:nowrap;
      }
      .sgr-tbl th.tc { text-align:center; }
      .sgr-tbl td { padding:8px 10px; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
      .sgr-tbl td.tc { text-align:center; }
      .sgr-tbl tbody tr:last-child td { border-bottom:none; }
      .sgr-tbl tbody tr:nth-child(even) td { background:#fafbfd; }
      .sgr-tbl tbody tr:hover td { background:#eff6ff !important; }

      tr.sgr-row-ong  > td { background:#f5f3ff !important; }
      tr.sgr-row-wdn  > td { background:#fff5f5 !important; }
      tr.sgr-row-fail > td { background:#fff7ed !important; }

      .sgr-code { font-family:'Consolas','Cascadia Code','Courier New',monospace; font-size:12px; font-weight:600; color:#1e3a8a; white-space:nowrap; }
      tr.sgr-row-ong  .sgr-code { color:#6d28d9; }
      tr.sgr-row-wdn  .sgr-code { color:#6b7280; }
      tr.sgr-row-fail .sgr-code { color:#9a3412; }
      tr.sgr-row-wdn  .sgr-name { color:#94a3b8; text-decoration:line-through; }
      .sgr-num { font-family:'Consolas','Cascadia Code',monospace; font-size:12px; color:#475569; }

      .sgr-gp { display:inline-block; padding:2px 10px; border-radius:20px; font-size:11px; font-weight:700; color:#059669; white-space:nowrap; letter-spacing:.3px; }
      .sgr-gp-nd { font-size:12px; color:#cbd5e1; }

      .sgr-mini { display:inline-block; padding:1px 6px; border-radius:4px; font-size:10px; font-weight:700; color:#059669; white-space:nowrap; }
      .sgr-mini-nd { color:#cbd5e1; font-size:11px; }

      .sgr-sts { display:inline-block; padding:2px 8px; border-radius:5px; font-size:10px; font-weight:700; white-space:nowrap; }
      .sgr-sts-ok   { background:#dcfce7; color:#166534; }
      .sgr-sts-ong  { background:#ede9fe; color:#5b21b6; }
      .sgr-sts-wdn  { background:#fee2e2; color:#991b1b; }
      .sgr-sts-fail { background:#ffedd5; color:#9a3412; }

      .sgr-sum-bar { display:grid; grid-template-columns:repeat(4,1fr); gap:1px; background:#e2e8f0; border-top:1px solid #e2e8f0; }
      .sgr-sum-item { background:#f8fafc; padding:9px 12px; text-align:center; }
      .sgr-sum-lbl { font-size:9px; text-transform:uppercase; letter-spacing:.7px; color:#94a3b8; font-weight:600; margin-bottom:4px; }
      .sgr-sum-val { font-size:16px; font-weight:800; color:#1e293b; display:block; line-height:1.2; }

      .sgr-legend { display:flex; flex-wrap:wrap; gap:14px; margin-top:18px; padding-top:12px; border-top:1px solid #f1f5f9; font-size:11px; color:#64748b; }
      .sgr-legend span { display:flex; align-items:center; gap:6px; }
      .sgr-legend-dot { display:inline-block; width:9px; height:9px; border-radius:50%; flex-shrink:0; }

      @media (max-width:768px) {
        .sgr-info { grid-template-columns:repeat(2,1fr); }
        .grade-report { padding:14px; }
        .sgr-tbl th, .sgr-tbl td { padding:6px 7px; font-size:11px; }
        .sgr-sum-bar { grid-template-columns:repeat(2,1fr); }
      }
    `;
    document.head.appendChild(s);
  }

  function parseInfo(tbl) {
    const items = [];
    tbl.querySelectorAll('tr').forEach(tr => {
      const tds = [...tr.querySelectorAll('td')];
      if (tds[0] && tds[2]) items.push({ k: tds[0].textContent.trim(), v: tds[2].textContent.trim() });
      if (tds[3] && tds[5]) items.push({ k: tds[3].textContent.trim(), v: tds[5].textContent.trim() });
    });
    return items;
  }

  function parseSemesters(tbl) {
    const sems = [];
    let cur = null;

    [...tbl.querySelectorAll('tbody tr')].forEach(tr => {
      const tds = [...tr.querySelectorAll('td')];
      if (!tds.length) return;

      if (tds[0].textContent.trim() === 'Class ID') return;

      if (tds.length === 1 && tds[0].getAttribute('colspan') === '12') {
        if (cur) sems.push(cur);
        const raw = (tds[0].querySelector('label') || tds[0]).textContent.trim();
        cur = { label: raw.replace(/^\*+\s*/, ''), courses: [], summary: null };
        return;
      }

      if (tds[0].getAttribute('colspan') === '6' && cur) {
        cur.summary = {
          tgp:  tds[1]?.textContent.trim() || '',
          ecr:  tds[2]?.textContent.trim() || '',
          gpa:  tds[3]?.textContent.trim() || '',
          cgpa: tds[4]?.textContent.trim() || '',
        };
        return;
      }

      if (cur && tds.length >= 11) {
        const fg  = tds[5].textContent.trim();
        const sts = tds[10].textContent.trim();
        const mtg = tds[3].textContent.trim();
        const ftg = tds[4].textContent.trim();
        const prn = (tds[11]?.textContent.trim() || '').toUpperCase();
        const isWType = fg === 'W' || mtg === 'UW' || ftg === 'UW';
        let state;
        if (sts === 'DRP')          state = 'wdn';
        else if (fg === '-')         state = 'ong';
        else if (isWType && prn === 'Y') state = 'done';
        else if (isWType)            state = 'wdn';
        else if (fg === 'F')         state = 'fail';
        else                         state = 'done';

        cur.courses.push({
          classId: tds[0].textContent.trim(),
          name:    tds[1].textContent.trim(),
          credits: tds[2].textContent.trim(),
          mtg,
          ftg,
          fg,
          tgp:     tds[6].textContent.trim(),
          sts,
          prn,
          state,
        });
      }
    });

    if (cur) sems.push(cur);
    return sems;
  }

  function gradePill(fg) {
    if (!fg || fg === '') return '<span class="sgr-gp-nd">—</span>';
    if (fg === '-') return '<span class="sgr-gp" style="color:#7c3aed">Ongoing</span>';
    const bg = GRADE_BG[fg] || '#6b7280';
    return `<span class="sgr-gp" style="color:${bg}">${esc(fg)}</span>`;
  }

  function miniGrade(g) {
    if (!g || g === '-' || g === '') return '<span class="sgr-mini-nd">—</span>';
    const bg = GRADE_BG[g] || '#6b7280';
    return `<span class="sgr-mini" style="color:${bg}">${esc(g)}</span>`;
  }

  function statusBadge(state) {
    const map = {
      ong:  '<span class="sgr-sts sgr-sts-ong">Ongoing</span>',
      wdn:  '<span class="sgr-sts sgr-sts-wdn">Dropped</span>',
      fail: '<span class="sgr-sts sgr-sts-fail">Failed</span>',
      done: '<span class="sgr-sts sgr-sts-ok">Passed</span>',
    };
    return map[state] || map.done;
  }

  function infoHTML(items, printHref) {
    const cells = items.map(({ k, v }) =>
      `<div class="sgr-info-cell">
        <div class="sgr-info-lbl">${esc(k)}</div>
        <div class="sgr-info-val${k === 'Cgpa' ? ' cgpa' : ''}">${esc(v) || '—'}</div>
      </div>`
    ).join('');
    const safeHref = printHref && /^[/?#]/.test(printHref) ? printHref : '#';
    return `
      <div class="sgr-top">
        <h2 class="sgr-title">Semester <span>Grade Report</span></h2>
        ${printHref ? `<a class="sgr-print" href="${esc(safeHref)}">&#128438; Print</a>` : ''}
      </div>
      <div class="sgr-info">${cells}</div>`;
  }

  function semesterHTML(sem) {
    const isActive = sem.courses.some(c => c.state === 'ong');

    const rowsHTML = sem.courses.map(c =>
      `<tr class="sgr-row-${c.state}">
        <td class="sgr-code">${esc(c.classId)}</td>
        <td class="sgr-name">${esc(c.name)}</td>
        <td class="tc">${esc(c.credits.replace(/[()]/g, ''))}</td>
        <td class="tc">${miniGrade(c.mtg)}</td>
        <td class="tc">${miniGrade(c.ftg)}</td>
        <td class="tc">${gradePill(c.fg)}</td>
        <td class="tc sgr-num">${c.tgp || '—'}</td>
        <td class="tc">${statusBadge(c.state)}</td>
      </tr>`
    ).join('');

    const sumBar = sem.summary ? `
      <div class="sgr-sum-bar">
        <div class="sgr-sum-item">
          <div class="sgr-sum-lbl">Grade Points</div>
          <span class="sgr-sum-val">${sem.summary.tgp || '—'}</span>
        </div>
        <div class="sgr-sum-item">
          <div class="sgr-sum-lbl">Credits Earned</div>
          <span class="sgr-sum-val">${sem.summary.ecr || '—'}</span>
        </div>
        <div class="sgr-sum-item">
          <div class="sgr-sum-lbl">Semester GPA</div>
          <span class="sgr-sum-val" style="color:${gpaColor(sem.summary.gpa)}">${sem.summary.gpa || '—'}</span>
        </div>
        <div class="sgr-sum-item">
          <div class="sgr-sum-lbl">Cumulative GPA</div>
          <span class="sgr-sum-val" style="color:${gpaColor(sem.summary.cgpa)}">${sem.summary.cgpa || '—'}</span>
        </div>
      </div>` : '';

    return `
      <div class="sgr-sem-card${isActive ? ' sgr-sem-card--active' : ''}">
        <div class="sgr-sem-head">
          <div class="sgr-sem-label">
            <span class="sgr-sem-dot"></span>${esc(sem.label)}
          </div>
          <div class="sgr-sem-meta">
            <span class="sgr-sem-cnt">${sem.courses.length} course${sem.courses.length !== 1 ? 's' : ''}</span>
            ${isActive ? '<span class="sgr-sem-badge-active">&#9679; Current</span>' : ''}
            ${sem.summary && sem.summary.gpa && sem.summary.gpa !== '0.00'
              ? `<span class="sgr-sem-gpa">GPA&thinsp;<strong>${sem.summary.gpa}</strong></span>` : ''}
            <span class="sgr-sem-toggle">&#9660;</span>
          </div>
        </div>
        <div class="sgr-sem-body">
          <div class="sgr-tbl-wrap">
            <table class="sgr-tbl">
              <thead><tr>
                <th style="width:8%">Class ID</th>
                <th>Course</th>
                <th class="tc" style="width:5%">Cr.</th>
                <th class="tc" style="width:6%">Mid</th>
                <th class="tc" style="width:7%">Final</th>
                <th class="tc" style="width:8%">Grade</th>
                <th class="tc" style="width:6%">TGP</th>
                <th class="tc" style="width:8%">Status</th>
              </tr></thead>
              <tbody>${rowsHTML}</tbody>
            </table>
          </div>
          ${sumBar}
        </div>
      </div>`;
  }

  function enhance() {
    const gr = document.querySelector('.grade-report');
    if (!gr) return;

    const rootPanel = gr.closest('.panel');
    if (rootPanel) rootPanel.classList.add('sgr-root-panel');

    const printLink = document.querySelector('a[href*="PrintGradeReport"]');
    const printHref = printLink ? printLink.getAttribute('href') : null;

    const tables = [...gr.querySelectorAll('table')];
    if (tables.length < 2) return;

    const infoItems = parseInfo(tables[0]);
    const semesters = parseSemesters(tables[1]);

    let html = infoHTML(infoItems, printHref);
    semesters.forEach(sem => { html += semesterHTML(sem); });
    html += `
      <div class="sgr-legend">
        <span><span class="sgr-legend-dot" style="background:#10b981"></span>Passed</span>
        <span><span class="sgr-legend-dot" style="background:#7c3aed"></span>Ongoing</span>
        <span><span class="sgr-legend-dot" style="background:#6b7280"></span>Dropped</span>
        <span><span class="sgr-legend-dot" style="background:#991b1b"></span>Failed</span>
      </div>`;

    gr.innerHTML = html;

    gr.addEventListener('click', e => {
      const head = e.target.closest('.sgr-sem-head');
      if (head) head.closest('.sgr-sem-card').classList.toggle('collapsed');
    });
  }

  function init() {
    if (!document.querySelector('.grade-report')) {
      setTimeout(init, 400);
      return;
    }
    injectCSS();
    enhance();
  }

  chrome.storage.sync.get({ extensionEnabled: true }, function (r) {
    if (!r.extensionEnabled) return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  });
})();
