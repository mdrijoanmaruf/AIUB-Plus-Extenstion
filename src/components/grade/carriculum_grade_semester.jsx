import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../content.css';

const GRADE_COLORS = {
  'A+': '#059669', A: '#10b981', 'B+': '#2563eb', B: '#3b82f6',
  'C+': '#d97706', C: '#f59e0b', 'D+': '#dc2626', D: '#ef4444',
  F: '#991b1b', W: '#6b7280', UW: '#6b7280', '-': '#7c3aed',
};

function gpaColor(v) {
  const n = parseFloat(v);
  if (isNaN(n) || n === 0) return '#64748b';
  if (n >= 3.5) return '#059669';
  if (n >= 3.0) return '#2563eb';
  if (n >= 2.5) return '#d97706';
  return '#dc2626';
}

function normText(v) { return String(v || '').replace(/\s+/g, ' ').trim().toUpperCase(); }
function normCode(v) { return normText(v).replace(/\s+/g, ''); }
function extractNumber(text) {
  const m = String(text || '').match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
}
function parseCreditValue(raw) {
  const m = String(raw || '').match(/\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
}
function normalizeInfoKey(v) { return String(v || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
function getInfoValue(items, keys) {
  const wanted = new Set(keys.map(normalizeInfoKey));
  for (const item of items) {
    if (wanted.has(normalizeInfoKey(item.k))) return String(item.v || '').trim();
  }
  return '';
}

function parseInfo(tbl) {
  const items = [];
  tbl.querySelectorAll('tr').forEach((tr) => {
    const tds = [...tr.querySelectorAll('td')];
    if (tds[0] && tds[2]) items.push({ k: tds[0].textContent.trim(), v: tds[2].textContent.trim() });
    if (tds[3] && tds[5]) items.push({ k: tds[3].textContent.trim(), v: tds[5].textContent.trim() });
  });
  return items;
}

function parseSemesters(tbl) {
  const sems = [];
  let cur = null;
  [...tbl.querySelectorAll('tbody tr')].forEach((tr) => {
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
        tgp: tds[1]?.textContent.trim() || '',
        ecr: tds[2]?.textContent.trim() || '',
        gpa: tds[3]?.textContent.trim() || '',
        cgpa: tds[4]?.textContent.trim() || '',
      };
      return;
    }

    if (cur && tds.length >= 11) {
      const fg = tds[5].textContent.trim();
      const sts = tds[10].textContent.trim();
      const mtg = tds[3].textContent.trim();
      const ftg = tds[4].textContent.trim();
      const prn = (tds[11]?.textContent.trim() || '').toUpperCase();
      const isWType = fg === 'W' || mtg === 'UW' || ftg === 'UW';
      let state;
      if (sts === 'DRP') state = 'wdn';
      else if (fg === '-') state = 'ong';
      else if (isWType && prn === 'Y') state = 'done';
      else if (isWType) state = 'wdn';
      else if (fg === 'F') state = 'fail';
      else state = 'done';

      cur.courses.push({
        classId: tds[0].textContent.trim(),
        name: tds[1].textContent.trim(),
        credits: tds[2].textContent.trim(),
        creditValue: parseCreditValue(tds[2].textContent.trim()),
        mtg, ftg, fg,
        tgp: tds[6].textContent.trim(),
        sts, prn, state,
      });
    }
  });
  if (cur) sems.push(cur);
  return sems;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function GradePill({ grade }) {
  if (!grade) return <span className="text-slate-300 text-[12px]">—</span>;
  if (grade === '-') return <span className="text-[12px] font-semibold" style={{ color: '#7c3aed' }}>Ongoing</span>;
  const color = GRADE_COLORS[grade] || '#6b7280';
  return <span className="text-[13px] font-bold" style={{ color }}>{grade}</span>;
}

function MiniGrade({ grade }) {
  if (!grade || grade === '-' || grade === '') return <span className="text-slate-300 text-[11px]">—</span>;
  const color = GRADE_COLORS[grade] || '#6b7280';
  return <span className="text-[11px] font-semibold" style={{ color }}>{grade}</span>;
}

function StatusBadge({ state }) {
  const map = {
    ong:  { text: 'Ongoing', color: '#7c3aed' },
    wdn:  { text: 'Dropped', color: '#6b7280' },
    fail: { text: 'Failed',  color: '#dc2626' },
    done: { text: 'Passed',  color: '#059669' },
  };
  const { text, color } = map[state] || map.done;
  return (
    <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>
      {text}
    </span>
  );
}

function SummaryBar({ summary }) {
  if (!summary) return null;
  const items = [
    { label: 'Grade Points', value: summary.tgp },
    { label: 'Credits Earned', value: summary.ecr },
    { label: 'Semester GPA', value: summary.gpa, colored: true },
    { label: 'Cumulative GPA', value: summary.cgpa, colored: true },
  ];
  return (
    <div className="border-t border-sky-100" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }}>
      <div className="flex divide-x divide-sky-100">
        {items.map(({ label, value, colored }) => (
          <div key={label} className="flex flex-col items-center flex-1 min-w-[80px] px-3 py-3">
            <div className="text-[10px] uppercase tracking-wide text-sky-500 font-bold mb-0.5">{label}</div>
            <span className="text-[15px] font-bold" style={colored ? { color: gpaColor(value) } : { color: '#0f172a' }}>
              {value || '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SemesterCard({ sem }) {
  const [open, setOpen] = useState(true);
  const isActive = sem.courses.some((c) => c.state === 'ong');

  return (
    <div
      className="rounded-xl overflow-hidden mb-3 border shadow-sm hover:shadow-md transition-all"
      style={{ borderColor: isActive ? '#7dd3fc' : '#bfdbfe' }}
    >
      <div
        className="flex justify-between items-center px-4 py-3 cursor-pointer select-none"
        style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-amber-300' : 'bg-white/40'}`} />
          <span className="text-[14px] font-bold text-white">{sem.label}</span>
          {isActive && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-amber-300 text-sky-900">Current</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-white/80">{sem.courses.length} course{sem.courses.length !== 1 ? 's' : ''}</span>
          {sem.summary?.gpa && sem.summary.gpa !== '0.00' && (
            <span className="text-[12px] font-semibold text-white/90">GPA {sem.summary.gpa}</span>
          )}
          <span className={`text-[10px] text-white/70 transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </div>

      {open && (
        <>
          <div className="overflow-x-auto" style={{ background: 'linear-gradient(135deg, #f8fbff 0%, #eff6ff 100%)' }}>
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr style={{ background: 'linear-gradient(to right, #e0f2fe, #dbeafe)', borderBottom: '1px solid #bfdbfe' }}>
                  <th className="text-left px-3 py-2 font-bold text-[10px] uppercase tracking-wide text-sky-600 w-[9%]">Class ID</th>
                  <th className="text-left px-3 py-2 font-bold text-[10px] uppercase tracking-wide text-sky-600">Course</th>
                  <th className="text-center px-2 py-2 font-bold text-[10px] uppercase tracking-wide text-sky-600 w-[5%]">Cr.</th>
                  <th className="text-center px-2 py-2 font-bold text-[10px] uppercase tracking-wide text-sky-600 w-[6%]">Mid</th>
                  <th className="text-center px-2 py-2 font-bold text-[10px] uppercase tracking-wide text-sky-600 w-[7%]">Final</th>
                  <th className="text-center px-2 py-2 font-bold text-[10px] uppercase tracking-wide text-sky-600 w-[8%]">Grade</th>
                  <th className="text-center px-2 py-2 font-bold text-[10px] uppercase tracking-wide text-sky-600 w-[6%]">TGP</th>
                  <th className="text-center px-2 py-2 font-bold text-[10px] uppercase tracking-wide text-sky-600 w-[9%]">Status</th>
                </tr>
              </thead>
              <tbody>
                {sem.courses.map((c, i) => {
                  const rowBg =
                    c.state === 'ong'  ? 'linear-gradient(135deg, #faf5ff, #ede9fe)' :
                    c.state === 'fail' ? 'linear-gradient(135deg, #fff8f8, #ffe4e6)' :
                    c.state === 'wdn'  ? 'linear-gradient(135deg, #f8fafc, #f1f5f9)' :
                    'linear-gradient(135deg, #f8fbff, #eff6ff)';
                  return (
                    <tr key={i} style={{ background: rowBg }} className="border-b border-sky-50 hover:brightness-95 transition-all">
                      <td className="px-3 py-2.5 font-mono text-[11px] text-slate-500">{c.classId}</td>
                      <td className="px-3 py-2.5 text-slate-800 font-medium">{c.name}</td>
                      <td className="px-2 py-2.5 text-center text-slate-600">{c.credits.replace(/[()]/g, '')}</td>
                      <td className="px-2 py-2.5 text-center"><MiniGrade grade={c.mtg} /></td>
                      <td className="px-2 py-2.5 text-center"><MiniGrade grade={c.ftg} /></td>
                      <td className="px-2 py-2.5 text-center"><GradePill grade={c.fg} /></td>
                      <td className="px-2 py-2.5 text-center text-slate-600">{c.tgp || '—'}</td>
                      <td className="px-2 py-2.5 text-center"><StatusBadge state={c.state} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <SummaryBar summary={sem.summary} />
        </>
      )}
    </div>
  );
}

function InfoGrid({ items }) {
  const isCgpa = (k) => /^cgpa$/i.test(k.replace(/\s/g, ''));
  const getCardStyle = (k) => {
    if (isCgpa(k)) return { border: '#0ea5e9', bg: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', label: '#0284c7' };
    if (/^student\s*id$/i.test(k.replace(/\s/g, ''))) return { border: '#34d399', bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', label: '#059669' };
    return { border: '#93c5fd', bg: 'linear-gradient(135deg, #f8fbff 0%, #eff6ff 100%)', label: '#2563eb' };
  };
  return (
    <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
      {items.map(({ k, v }) => {
        const s = getCardStyle(k);
        return (
          <div key={k} className="px-4 py-4 rounded-xl border hover:shadow-md transition-all cursor-default shadow-sm" style={{ background: s.bg, borderColor: s.border, borderWidth: '1.5px' }}>
            <div className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: s.label }}>{k}</div>
            {isCgpa(k) ? (
              <div className="text-[28px] font-extrabold leading-tight" style={{ color: '#059669' }}>{v || '—'}</div>
            ) : (
              <div className="text-[13px] font-semibold text-slate-700">{v || '—'}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SemesterGradeReport({ infoItems, semesters, printHref }) {
  return (
    <div className="text-[13px] text-slate-800 px-1 py-4" style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,sans-serif" }}>
      {/* Header — matches Registration style */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 pb-4" style={{ borderBottom: '1px solid #e2e8f0' }}>
        <h2 className="text-[18px] font-bold text-slate-900 tracking-tight m-0">
          Semester <span style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Grade Report</span>
        </h2>
        {printHref && (
          <a
            href={printHref}
            className="text-[11px] font-semibold text-white rounded-lg px-3 py-2 no-underline transition-all shadow-sm hover:shadow-md whitespace-nowrap border"
            style={{ background: 'linear-gradient(to right, #0284c7, #0369a1)', borderColor: '#0369a1' }}
          >
            🖨 Print
          </a>
        )}
      </div>

      <InfoGrid items={infoItems} />

      {semesters.map((sem, i) => <SemesterCard key={i} sem={sem} />)}

      <div className="flex items-center gap-5 mt-4 pt-3 border-t border-slate-100">
        {[
          { color: '#10b981', label: 'Passed' },
          { color: '#7c3aed', label: 'Ongoing' },
          { color: '#6b7280', label: 'Dropped' },
          { color: '#991b1b', label: 'Failed' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
            <span className="text-[11px] text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Self-mount ───────────────────────────────────────────────────────────────

(function mount() {
  if (window.__aiubSemGradeEnhanced) return;
  if (!window.location.href.includes('/Student/GradeReport/BySemester')) return;

  chrome.storage.sync.get({ extensionEnabled: true }, (r) => {
    if (!r.extensionEnabled) return;

    function init() {
      const gr = document.querySelector('.grade-report');
      if (!gr) { setTimeout(init, 400); return; }
      if (window.__aiubSemGradeEnhanced) return;
      window.__aiubSemGradeEnhanced = true;

      const rootPanel = gr.closest('.panel');
      if (rootPanel) {
        rootPanel.style.cssText = 'box-shadow:none!important;border:none!important;background:transparent!important;margin-bottom:0!important';
        const heading = rootPanel.querySelector(':scope > .panel-heading');
        if (heading) heading.style.display = 'none';
        const body = rootPanel.querySelector(':scope > .panel-body');
        if (body) body.style.cssText = 'padding:0!important;background:transparent!important';
      }

      const tables = [...gr.querySelectorAll('table')];
      if (tables.length < 2) return;

      const printLink = document.querySelector('a[href*="PrintGradeReport"]');
      const printHref = printLink?.getAttribute('href') || null;

      const infoItems = parseInfo(tables[0]);
      const semesters = parseSemesters(tables[1]);

      gr.innerHTML = '';
      createRoot(gr).render(
        <SemesterGradeReport
          infoItems={infoItems}
          semesters={semesters}
          printHref={printHref}
        />
      );
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  });
})();
