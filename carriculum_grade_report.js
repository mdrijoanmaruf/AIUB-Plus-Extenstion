(function () {
  'use strict';

  if (!window.location.href.includes('/Student/GradeReport/ByCurriculum')) return;
  if (window.__aiubGradeEnhanced) return;
  window.__aiubGradeEnhanced = true;

  /* ── Grade colour map (one tone per band) ─────────────────── */
  const GRADE_BG = {
    'A+': '#1a7a4a', 'A':  '#238f56',
    'B+': '#1a5fa0', 'B':  '#2272bc',
    'C+': '#b06000', 'C':  '#c47000',
    'D+': '#a82828', 'D':  '#b83030',
    'F':  '#5a0000', 'W':  '#757575',
    '-':  '#6a1b9a',
  };

  /* ── Inject CSS ─────────────────────────────────────────────── */
  function injectCSS() {
    if (document.getElementById('aiub-cgr-css')) return;
    const s = document.createElement('style');
    s.id = 'aiub-cgr-css';
    s.textContent = `
      /* Suppress portal panel chrome */
      .panel-heading .row { display:none !important; }
      .panel { box-shadow:none !important; border-color:#e2e2e2 !important; border-radius:3px !important; }
      .panel-body { padding:18px !important; }

      .grade-report { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; font-size:13px; color:#2d2d2d; }

      /* ── Page title row ── */
      .cgr-top { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:14px; }
      .cgr-title { font-size:15px; font-weight:600; color:#1a2744; }
      .cgr-print { font-size:12px; color:#555; text-decoration:none; border:1px solid #d0d0d0; border-radius:3px; padding:3px 10px; }
      .cgr-print:hover { background:#f5f5f5; color:#222; text-decoration:none; }

      /* ── Info grid ── */
      .cgr-info { display:grid; grid-template-columns:repeat(3,1fr); border:1px solid #e0e0e0; border-radius:3px; overflow:hidden; margin-bottom:22px; }
      .cgr-info-cell { padding:9px 14px; background:#fff; border-right:1px solid #e8e8e8; border-bottom:1px solid #e8e8e8; }
      .cgr-info-cell:nth-child(3n) { border-right:none; }
      .cgr-info-cell:nth-last-child(-n+3) { border-bottom:none; }
      .cgr-info-lbl { font-size:10px; text-transform:uppercase; letter-spacing:.6px; color:#999; margin-bottom:2px; }
      .cgr-info-val { font-size:13px; color:#1a1a1a; }
      .cgr-info-val.cgpa { font-size:20px; font-weight:600; color:#1a7a4a; }

      /* ── Section headings ── */
      .cgr-sh { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.7px;
        color:#1a2744; border-left:3px solid #1565c0; padding:3px 0 3px 9px;
        margin:22px 0 8px; }
      .cgr-sh.el { border-color:#2e7d32; color:#1b4d1e; }

      /* ── Semester label ── */
      .cgr-sl { font-size:11px; font-weight:600; color:#555; text-transform:uppercase;
        letter-spacing:.4px; background:#f2f4f7; border-radius:2px;
        padding:3px 8px; display:inline-block; margin:12px 0 4px; }

      /* ── Table ── */
      .cgr-tbl { width:100%; border-collapse:collapse; margin-bottom:2px; font-size:13px; }
      .cgr-tbl th { background:#f7f8fa; padding:7px 10px; font-size:10px; font-weight:600;
        text-transform:uppercase; letter-spacing:.5px; color:#777;
        border-bottom:1px solid #e0e0e0; border-right:1px solid #e8e8e8; text-align:left; }
      .cgr-tbl th.tc { text-align:center; }
      .cgr-tbl th:last-child { border-right:none; }
      .cgr-tbl td { padding:7px 10px; border-bottom:1px solid #f0f0f0; border-right:1px solid #f2f2f2; vertical-align:middle; }
      .cgr-tbl td:last-child { border-right:none; }
      .cgr-tbl td.tc { text-align:center; }
      .cgr-tbl tbody tr:last-child td { border-bottom:none; }
      .cgr-tbl tbody tr:hover td { background:#f5f8ff !important; }

      /* ── Row states ── */
      tr.cgr-done td { background:#fff; }
      tr.cgr-ong  td { background:#f6f9ff; }
      tr.cgr-wdn  td { background:#fff7f7; }
      tr.cgr-nd   td { background:#fafafa; }
      tr.cgr-nd td.cgr-cn { color:#aaa; }

      /* ── Code cell ── */
      .cgr-code { font-family:'Consolas','Courier New',monospace; font-size:12px; color:#0d1b3e; white-space:nowrap; }
      tr.cgr-nd  .cgr-code { color:#bbb; }
      tr.cgr-ong .cgr-code { color:#1565c0; }
      tr.cgr-wdn .cgr-code { color:#b83030; }

      /* ── Semester text ── */
      .cgr-sem-ln { font-size:11px; color:#666; line-height:1.7; }

      /* ── Grade pill ── */
      .cgr-gp { display:inline-block; padding:2px 9px; border-radius:3px;
        font-size:11px; font-weight:600; color:#fff; white-space:nowrap; }
      .cgr-gp-nd { font-size:12px; color:#ccc; }

      /* ── Not Attempted section ── */
      .cgr-na { margin-top:24px; padding-top:18px; border-top:1px solid #ebebeb; }
      .cgr-na-sub { font-size:11px; color:#888; margin:4px 0 10px; }
      .cgr-na-groups { display:flex; flex-direction:column; gap:10px; }
      .cgr-na-group-lbl { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:.5px; color:#888; margin-bottom:5px; }
      .cgr-na-chips { display:flex; flex-wrap:wrap; gap:5px; }
      .cgr-na-chip { font-family:'Consolas','Courier New',monospace; font-size:11px;
        background:#f2f4f7; border:1px solid #e0e3ea; border-radius:3px;
        padding:3px 8px; color:#4a4a6a; cursor:default; }
      .cgr-na-chip:hover { background:#e8ecf5; }

      @media(max-width:768px) {
        .cgr-info { grid-template-columns:repeat(2,1fr); }
        .cgr-tbl th,.cgr-tbl td { padding:6px 7px; font-size:12px; }
      }
    `;
    document.head.appendChild(s);
  }

  /* ── Helpers ────────────────────────────────────────────────── */
  function parseGrades(text) {
    const out = [];
    const re = /\(([^)]+)\)\s*\[([^\]]*)\]/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      out.push({ sem: m[1].trim(), grade: m[2].trim() || '-' });
    }
    return out;
  }

  function getState(grades) {
    if (!grades.length) return 'nd';
    const last = grades[grades.length - 1].grade;
    if (last === '-') return 'ong';
    if (last === 'W') return 'wdn';
    return 'done';
  }

  function gradePill(grades) {
    if (!grades.length) return `<span class="cgr-gp-nd">—</span>`;
    const last = grades[grades.length - 1];
    const bg  = GRADE_BG[last.grade] || '#90a4ae';
    const lbl = last.grade === '-' ? 'Ongoing' : last.grade;
    return `<span class="cgr-gp" style="background:${bg}">${lbl}</span>`;
  }

  function semLines(grades) {
    if (!grades.length) return `<span class="cgr-gp-nd">—</span>`;
    return grades.map(g => `<div class="cgr-sem-ln">${g.sem}</div>`).join('');
  }

  /* ── Parse student info table ───────────────────────────────── */
  function parseInfo(tbl) {
    const items = [];
    tbl.querySelectorAll('tr').forEach(tr => {
      const tds = [...tr.querySelectorAll('td')];
      if (tds[0] && tds[2]) items.push({ k: tds[0].textContent.trim(), v: tds[2].textContent.trim() });
      if (tds[3] && tds[5]) items.push({ k: tds[3].textContent.trim(), v: tds[5].textContent.trim() });
    });
    return items;
  }

  /* ── Info block ─────────────────────────────────────────────── */
  function infoHTML(items, printHref) {
    const cells = items.map(({ k, v }) =>
      `<div class="cgr-info-cell">
        <div class="cgr-info-lbl">${k}</div>
        <div class="cgr-info-val${k === 'Cgpa' ? ' cgpa' : ''}">${v || '—'}</div>
      </div>`
    ).join('');
    return `
      <div class="cgr-top">
        <span class="cgr-title">Curriculum Grade Report</span>
        ${printHref ? `<a class="cgr-print" href="${printHref}">Print</a>` : ''}
      </div>
      <div class="cgr-info">${cells}</div>`;
  }

  /* ── Semester table ─────────────────────────────────────────── */
  function semTableHTML(label, tbl, allRows) {
    const rows = [...tbl.querySelectorAll('tbody tr')].slice(1);
    const rowsHTML = rows.map(tr => {
      const tds    = [...tr.querySelectorAll('td')];
      if (tds.length < 3) return '';
      const code   = tds[0].textContent.trim();
      const name   = tds[1].textContent.trim();
      const grades = parseGrades(tds[2].textContent);
      const state  = getState(grades);
      allRows.push({ code, name, state, elective: false });
      return `<tr class="cgr-${state}">
        <td class="cgr-code">${code}</td>
        <td class="cgr-cn">${name}</td>
        <td>${semLines(grades)}</td>
        <td class="tc">${gradePill(grades)}</td>
      </tr>`;
    }).join('');

    return `
      <div class="cgr-sl">${label}</div>
      <table class="cgr-tbl">
        <thead><tr>
          <th style="width:10%">Code</th>
          <th>Course</th>
          <th style="width:28%">Semester</th>
          <th class="tc" style="width:7%">Grade</th>
        </tr></thead>
        <tbody>${rowsHTML}</tbody>
      </table>`;
  }

  /* ── Elective table ─────────────────────────────────────────── */
  function electiveTableHTML(tbl, allRows) {
    const rows = [...tbl.querySelectorAll('tbody tr')].slice(1);
    const rowsHTML = rows.map(tr => {
      const tds    = [...tr.querySelectorAll('td')];
      if (tds.length < 3) return '';
      const code   = tds[0].textContent.trim();
      const name   = tds[1].textContent.trim();
      const grades = parseGrades(tds[2].textContent);
      const state  = getState(grades);
      allRows.push({ code, name, state, elective: true });
      return `<tr class="cgr-${state}">
        <td class="cgr-code">${code}</td>
        <td class="cgr-cn">${name}</td>
        <td>${semLines(grades)}</td>
        <td class="tc">${gradePill(grades)}</td>
      </tr>`;
    }).join('');

    return `
      <table class="cgr-tbl">
        <thead><tr>
          <th style="width:10%">Code</th>
          <th>Course</th>
          <th style="width:28%">Semester</th>
          <th class="tc" style="width:7%">Grade</th>
        </tr></thead>
        <tbody>${rowsHTML}</tbody>
      </table>`;
  }

  /* ── Not Attempted section ──────────────────────────────────── */
  function notAttemptedHTML(allRows) {
    const coreNA     = allRows.filter(r => !r.elective && r.state === 'nd');
    const electiveNA = allRows.filter(r =>  r.elective && r.state === 'nd');
    if (!coreNA.length && !electiveNA.length) return '';

    const total = coreNA.length + electiveNA.length;
    const groups = [];

    if (coreNA.length) {
      const chips = coreNA.map(r =>
        `<span class="cgr-na-chip" title="${r.name}">${r.code}</span>`
      ).join('');
      groups.push(`<div>
        <div class="cgr-na-group-lbl">Core — ${coreNA.length} course(s)</div>
        <div class="cgr-na-chips">${chips}</div>
      </div>`);
    }
    if (electiveNA.length) {
      const chips = electiveNA.map(r =>
        `<span class="cgr-na-chip" title="${r.name}">${r.code}</span>`
      ).join('');
      groups.push(`<div>
        <div class="cgr-na-group-lbl">Elective — ${electiveNA.length} course(s)</div>
        <div class="cgr-na-chips">${chips}</div>
      </div>`);
    }

    return `
      <div class="cgr-na">
        <div class="cgr-sh" style="border-color:#bbb;color:#666;">Not Attempted Yet</div>
        <div class="cgr-na-sub">${total} course(s) not started — hover a code to see the full name</div>
        <div class="cgr-na-groups">${groups.join('')}</div>
      </div>`;
  }

  /* ── Enhance page ───────────────────────────────────────────── */
  function enhance() {
    const gr = document.querySelector('.grade-report');
    if (!gr) return;

    const printLink = document.querySelector('a[href*="PrintGradeReport"]');
    const printHref = printLink ? printLink.getAttribute('href') : null;

    let html     = '';
    let infoOk   = false;
    let elective = false;
    let semLabel = null;
    const allRows = [];

    for (const el of [...gr.children]) {
      const tag = el.tagName;

      if (tag === 'TABLE' && !infoOk) {
        html += infoHTML(parseInfo(el), printHref);
        infoOk = true;

      } else if (tag === 'DIV' && el.classList.contains('text-center')) {
        const txt = el.textContent.toLowerCase();
        if (txt.includes('core')) {
          html += `<div class="cgr-sh">Core Curriculum</div>`;
          elective = false;
        } else if (txt.includes('elective')) {
          html += `<div class="cgr-sh el">Elective Curriculum</div>`;
          elective = true;
        }

      } else if (tag === 'LABEL') {
        semLabel = el.textContent.trim();

      } else if (tag === 'TABLE' && infoOk) {
        if (elective) {
          html += electiveTableHTML(el, allRows);
        } else {
          html += semTableHTML(semLabel || '', el, allRows);
          semLabel = null;
        }
      }
    }

    html += notAttemptedHTML(allRows);
    gr.innerHTML = html;
  }

  /* ── Init ───────────────────────────────────────────────────── */
  function init() {
    if (!document.querySelector('.grade-report')) {
      setTimeout(init, 400);
      return;
    }
    injectCSS();
    enhance();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
