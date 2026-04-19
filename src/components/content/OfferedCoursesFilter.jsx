import { useState, useEffect, useMemo } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

const ROUTINE_COLORS = [
  { border: '#1565c0' }, { border: '#7b1fa2' }, { border: '#2e7d32' },
  { border: '#ef6c00' }, { border: '#c62828' }, { border: '#00838f' },
  { border: '#283593' }, { border: '#00695c' },
];

// ── Pure helpers ──────────────────────────────────────────────────────────────

function timeToMinutes(str) {
  const m = (str || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10), p = m[3].toUpperCase();
  if (p === 'PM' && h !== 12) h += 12;
  if (p === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

function slotsOverlap(a, b) {
  if (a.day !== b.day) return false;
  const [s1, e1, s2, e2] = [timeToMinutes(a.startTime), timeToMinutes(a.endTime), timeToMinutes(b.startTime), timeToMinutes(b.endTime)];
  if (!s1 || !e1 || !s2 || !e2) return false;
  return s1 < e2 && s2 < e1;
}

function timeSignature(course) {
  return (course.timeSlots || []).map(ts => `${ts.day}|${ts.startTime}|${ts.endTime}|${ts.classType}`).sort().join(';;');
}

function checkClash(course, selected) {
  for (const sel of selected) {
    for (const ns of course.timeSlots) {
      for (const ss of sel.timeSlots) {
        if (slotsOverlap(ns, ss)) return { hasClash: true, clashWith: sel.fullTitle, details: `${ns.day} ${ns.startTime}–${ns.endTime} overlaps ${ss.day} ${ss.startTime}–${ss.endTime}` };
      }
    }
  }
  return { hasClash: false };
}

function linkedSections(course, allCourses) {
  const sig = timeSignature(course);
  return allCourses
    .filter(c => c.title === course.title && c.classId !== course.classId && timeSignature(c) === sig)
    .map(({ section, classId, fullTitle, capacity, count, status, timeSlots }) => ({ section, classId, fullTitle, capacity, count, status, timeSlots }));
}

const colorCache = {};
let colorIdx = 0;
function courseColor(title) {
  if (!colorCache[title]) colorCache[title] = ROUTINE_COLORS[colorIdx++ % ROUTINE_COLORS.length];
  return colorCache[title];
}

function loadSaved(allCourses) {
  try {
    const parsed = JSON.parse(localStorage.getItem('aiub_selectedSections') || '[]');
    return Array.isArray(parsed) ? parsed.filter(s => allCourses.some(c => c.classId === s.classId)) : [];
  } catch { return []; }
}

// ── Sub-components ────────────────────────────────────────────────────────────

const GRAD = {
  blue:    'linear-gradient(135deg,#1e3a8a,#2563eb)',
  sky:     'linear-gradient(to right,#e0f2fe,#dbeafe)',
  bodyBg:  'linear-gradient(135deg,#f8fbff 0%,#eff6ff 100%)',
  pageFt:  'linear-gradient(to right,#f0f9ff,#eff6ff)',
};

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  const [bg, color] =
    s.includes('freshman')  ? ['linear-gradient(135deg,#dbeafe,#bfdbfe)', '#1e40af'] :
    s.includes('sophomore') ? ['linear-gradient(135deg,#d1fae5,#a7f3d0)', '#065f46'] :
    s.includes('junior')    ? ['linear-gradient(135deg,#ede9fe,#ddd6fe)', '#5b21b6'] :
    s.includes('senior')    ? ['linear-gradient(135deg,#fef3c7,#fde68a)', '#92400e'] :
                              ['linear-gradient(135deg,#f1f5f9,#e2e8f0)', '#374151'];
  return (
    <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide"
      style={{ background: bg, color }}>
      {status}
    </span>
  );
}

function SeatsBadge({ available }) {
  if (available <= 0)
    return <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: 'linear-gradient(135deg,#fee2e2,#fecdd3)', color: '#dc2626' }}>FULL</span>;
  return <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', color: '#059669' }}>{available} seats</span>;
}

function SlotPills({ timeSlots }) {
  if (!timeSlots?.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {timeSlots.map((ts, i) => (
        <span key={i} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md"
          style={{ background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)', border: '1px solid #bae6fd' }}>
          <span className="font-bold text-sky-700">{ts.day.slice(0, 3)}</span>
          <span className="text-slate-600">{ts.startTime}–{ts.endTime}</span>
          {ts.room && (
            <span className="font-mono text-[10px] text-sky-600 px-1 rounded" style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid #bae6fd' }}>
              {ts.room}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

function ActionBtn({ course, selected, clashMap, onSelect }) {
  const isSelected    = selected.some(s => s.classId === course.classId);
  const sameCourse    = selected.some(s => s.title === course.title && s.classId !== course.classId);
  const clash         = clashMap[course.classId];
  const base          = 'text-[11px] font-bold px-3 py-1.5 rounded-lg text-white transition-all';

  if (isSelected)
    return <button disabled className={base} style={{ background: 'linear-gradient(135deg,#059669,#10b981)', cursor: 'default' }}>✓ Selected</button>;
  if (clash?.hasClash)
    return <button disabled title={`${clash.clashWith} — ${clash.details}`} className={base} style={{ background: 'linear-gradient(135deg,#dc2626,#ef4444)', cursor: 'not-allowed', opacity: 0.85 }}>✕ Clash</button>;
  if (sameCourse)
    return <button disabled className={base} style={{ background: 'linear-gradient(135deg,#4b5563,#6b7280)', cursor: 'default' }}>Course Added</button>;

  const high = course.count >= 35;
  return (
    <button onClick={() => onSelect(course.classId)} className={`${base} hover:shadow-md hover:-translate-y-px`}
      style={{ background: high ? 'linear-gradient(135deg,#b45309,#d97706)' : GRAD.blue, boxShadow: '0 2px 6px rgba(37,99,235,0.2)' }}>
      + Select
    </button>
  );
}

function SelectedCard({ sec, onRemove }) {
  const col = courseColor(sec.title);
  const avail = sec.capacity - sec.count;
  return (
    <div className="relative rounded-xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
      style={{ background: GRAD.bodyBg, borderColor: '#bfdbfe', borderLeftColor: col.border, borderLeftWidth: '4px', padding: '12px 40px 12px 16px', minWidth: '220px', flex: '1 1 220px', maxWidth: '360px' }}>

      <div className="text-[13px] font-bold text-slate-800 mb-1.5 leading-snug">{sec.fullTitle}</div>

      <div className="flex flex-col gap-1 mb-2">
        {sec.timeSlots.map((ts, i) => (
          <span key={i} className="text-[11px] text-sky-700 inline-block px-2 py-0.5 rounded-md"
            style={{ background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)', border: '1px solid #bae6fd' }}>
            {ts.classType}: {ts.day} {ts.startTime}–{ts.endTime}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
          style={{ background: 'linear-gradient(135deg,#dbeafe,#bfdbfe)', color: '#1e40af' }}>{sec.status}</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', color: '#059669' }}>{avail} seats</span>
      </div>

      {sec._linked?.length > 0 && (
        <div className="mt-2.5 rounded-lg overflow-hidden" style={{ border: '1px solid #bfdbfe' }}>
          <div className="text-[10px] font-bold text-sky-700 uppercase tracking-wider px-2.5 py-1.5"
            style={{ background: 'linear-gradient(to right,#e0f2fe,#dbeafe)' }}>
            All sections — {sec._linked.length + 1} total
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] border-b border-sky-50"
            style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' }}>
            <span className="font-bold text-emerald-600 w-8 flex-shrink-0">{sec.section || sec.classId} ✓</span>
            <span className="flex-1 text-slate-500 text-[10px]">{sec.timeSlots.map(ts => `${ts.day} ${ts.startTime}–${ts.endTime}`).join(' · ')}</span>
            <span className="font-bold text-emerald-600 text-[10px] flex-shrink-0">{avail} seats</span>
          </div>
          {sec._linked.map((ls, i) => {
            const a = ls.capacity - ls.count;
            return (
              <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] border-b border-sky-50 last:border-0">
                <span className="font-bold text-slate-600 w-8 flex-shrink-0">{ls.section || ls.classId}</span>
                <span className="flex-1 text-slate-500 text-[10px]">{ls.timeSlots.length ? ls.timeSlots.map(ts => `${ts.day} ${ts.startTime}–${ts.endTime}`).join(' · ') : 'No schedule'}</span>
                <span className={`font-bold text-[10px] flex-shrink-0 ${a <= 0 ? 'text-red-600' : 'text-emerald-600'}`}>{a <= 0 ? 'Full' : `${a} seats`}</span>
              </div>
            );
          })}
        </div>
      )}

      <button onClick={() => onRemove(sec.classId)}
        className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center rounded-full text-[11px] transition-all hover:shadow-md"
        style={{ background: '#fff1f2', border: '1px solid #fca5a5', color: '#dc2626' }}
        onMouseEnter={e => Object.assign(e.currentTarget.style, { background: 'linear-gradient(135deg,#dc2626,#ef4444)', color: '#fff', borderColor: 'transparent' })}
        onMouseLeave={e => Object.assign(e.currentTarget.style, { background: '#fff1f2', color: '#dc2626', borderColor: '#fca5a5' })}
      >✕</button>
    </div>
  );
}

function PanelHeader({ title, badge, action }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3.5" style={{ background: GRAD.blue }}>
      <div className="flex items-center gap-2">
        <span className="text-[14px] font-bold text-white">{title}</span>
        {badge && (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.25)' }}>
            {badge}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}

function GhostBtn({ onClick, children }) {
  return (
    <button onClick={onClick} className="text-[12px] font-bold px-3.5 py-1.5 rounded-lg transition-all"
      style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)' }}>
      {children}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OfferedCoursesFilter({ allCourses, statuses, originalPanel }) {
  const [search,         setSearch]         = useState('');
  const [activeStatuses, setActiveStatuses] = useState(() => statuses.filter(s => s.toLowerCase().includes('open')));
  const [activeDays,     setActiveDays]     = useState([]);
  const [fromH, setFromH] = useState('8');
  const [fromM, setFromM] = useState('0');
  const [toH,   setToH]   = useState('18');
  const [toM,   setToM]   = useState('0');
  const [page,    setPage]    = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [selected, setSelected] = useState(() => loadSaved(allCourses));

  // Restore linked sections on mount
  useEffect(() => {
    setSelected(prev => prev.map(s => ({ ...s, _linked: linkedSections(s, allCourses) })));
  }, [allCourses]);

  // Persist selection
  useEffect(() => {
    try { localStorage.setItem('aiub_selectedSections', JSON.stringify(selected)); } catch {}
  }, [selected]);

  // Clash map
  const clashMap = useMemo(() => {
    const map = {};
    allCourses.forEach(c => {
      if (selected.some(s => s.classId === c.classId)) return;
      const r = checkClash(c, selected);
      if (r.hasClash) map[c.classId] = r;
    });
    return map;
  }, [allCourses, selected]);

  // Filtered results
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fh = parseFloat(fromH), fm = parseFloat(fromM) || 0;
    const th = parseFloat(toH),   tm = parseFloat(toM)   || 0;
    const tFrom = isNaN(fh) ? NaN : fh + fm / 60;
    const tTo   = isNaN(th) ? NaN : th + tm / 60;
    const hasFilter = q || activeStatuses.length || activeDays.length || !isNaN(tFrom) || !isNaN(tTo);
    if (!hasFilter) return [];

    return allCourses.filter(c => {
      if (q && !c.title.toLowerCase().includes(q) && !c.fullTitle.toLowerCase().includes(q) && !c.classId.includes(q)) return false;
      if (activeStatuses.length && !activeStatuses.includes(c.status)) return false;
      if (activeDays.length && c.timeSlots.length && !activeDays.some(d => c.timeSlots.some(ts => ts.day === d))) return false;
      if ((!isNaN(tFrom) || !isNaN(tTo)) && c.timeSlots.length) {
        const ok = c.timeSlots.some(ts => {
          const mins = timeToMinutes(ts.startTime);
          if (mins === null) return true;
          const h = mins / 60;
          if (!isNaN(tFrom) && h < tFrom) return false;
          if (!isNaN(tTo)   && h > tTo)   return false;
          return true;
        });
        if (!ok) return false;
      }
      return true;
    });
  }, [allCourses, search, activeStatuses, activeDays, fromH, fromM, toH, toM]);

  // Hide/show original portal table
  useEffect(() => {
    if (!originalPanel) return;
    originalPanel.style.display = filtered.length ? 'none' : '';
  }, [filtered.length, originalPanel]);

  // ── Actions ────────────────────────────────────────────────────────────────

  function toggleStatus(s) { setActiveStatuses(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]); setPage(1); }
  function toggleDay(d)    { setActiveDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]); setPage(1); }

  function handleSelect(classId) {
    const c = allCourses.find(x => x.classId === classId);
    if (!c || selected.some(s => s.classId === classId) || selected.some(s => s.title === c.title)) return;
    if (checkClash(c, selected).hasClash) return;
    setSelected(p => [...p, { ...c, _linked: linkedSections(c, allCourses) }]);
  }

  function handleRemove(classId) {
    setSelected(p => {
      const c = p.find(s => s.classId === classId);
      return c ? p.filter(s => s.title !== c.title) : p;
    });
  }

  function handleReset() {
    setSearch(''); setActiveStatuses(statuses.filter(s => s.toLowerCase().includes('open')));
    setActiveDays([]); setFromH('8'); setFromM('0'); setToH('18'); setToM('0'); setPage(1);
  }

  // ── Status button style ────────────────────────────────────────────────────

  function statusBtnStyle(s) {
    const k = s.toLowerCase();
    const [border, color, activeBg] =
      k.includes('open')                          ? ['#10b981', '#059669', 'linear-gradient(135deg,#059669,#10b981)'] :
      k.includes('fresh')                         ? ['#3b82f6', '#2563eb', GRAD.blue] :
      k.includes('close') || k.includes('cancel') ? ['#ef4444', '#dc2626', 'linear-gradient(135deg,#dc2626,#ef4444)'] :
      k.includes('reserv')                        ? ['#8b5cf6', '#7c3aed', 'linear-gradient(135deg,#7c3aed,#8b5cf6)'] :
                                                    ['#9ca3af', '#6b7280', 'linear-gradient(135deg,#4b5563,#6b7280)'];
    return activeStatuses.includes(s)
      ? { background: activeBg, color: '#fff', borderColor: 'transparent', boxShadow: `0 2px 8px ${border}55` }
      : { background: '#fff', color, borderColor: border };
  }

  // ── Pagination ─────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData   = filtered.slice((page - 1) * perPage, page * perPage);

  const pageBtn = (label, target, disabled) => (
    <button key={label} onClick={() => !disabled && setPage(target)} disabled={disabled}
      className="text-[12px] font-bold px-2.5 py-1 rounded-lg transition-all"
      style={{ background: '#fff', color: disabled ? '#94a3b8' : '#2563eb', border: `1.5px solid ${disabled ? '#e2e8f0' : '#bfdbfe'}`, cursor: disabled ? 'not-allowed' : 'pointer' }}>
      {label}
    </button>
  );

  const activePageBtn = (p) => (
    <button key={p} onClick={() => setPage(p)}
      className="text-[12px] font-bold px-2.5 py-1 rounded-lg"
      style={p === page ? { background: GRAD.blue, color: '#fff', border: '1.5px solid transparent' } : { background: '#fff', color: '#2563eb', border: '1.5px solid #bfdbfe' }}>
      {p}
    </button>
  );

  const pageNums = Array.from({ length: Math.min(5, totalPages) }, (_, i) => Math.max(1, Math.min(page - 2, totalPages - 4)) + i);

  // ── Table header columns ───────────────────────────────────────────────────
  const TH_COLS = [
    { label: 'Class ID',  w: '70px',  center: false },
    { label: 'Title',     w: 'auto',  center: false },
    { label: 'Status',    w: '100px', center: false },
    { label: 'Capacity',  w: '70px',  center: true  },
    { label: 'Count',     w: '55px',  center: true  },
    { label: 'Available', w: '85px',  center: true  },
    { label: 'Schedule',  w: 'auto',  center: false },
    { label: 'Action',    w: '95px',  center: true  },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,sans-serif" }}>

      {/* ══ Filter Panel ══════════════════════════════════════════════════════ */}
      <div className="rounded-2xl overflow-hidden shadow-lg mb-4" style={{ border: 'none' }}>
        <PanelHeader
          title="⚡ Advanced Course Filter"
          badge={`${allCourses.length} courses loaded`}
          action={<GhostBtn onClick={handleReset}>↺ Reset</GhostBtn>}
        />

        {filtered.length > 0 && (
          <div className="flex items-center gap-2 px-5 py-2" style={{ background: 'linear-gradient(to right,#dbeafe,#eff6ff)', borderBottom: '1px solid #bfdbfe' }}>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' }}>
              {filtered.length} results
            </span>
            <span className="text-[11px] text-sky-600 font-medium">matching your filters</span>
          </div>
        )}

        <div className="px-5 py-4" style={{ background: GRAD.bodyBg }}>

          {/* Row 1: Search + Status */}
          <div className="flex flex-wrap gap-5 mb-4">
            {/* Search */}
            <div className="flex flex-col gap-2" style={{ flex: 1, minWidth: '200px' }}>
              <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: '#0284c7' }}>Search Course</span>
              <input type="text" value={search} placeholder="Course name or Class ID…"
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full text-[13px] px-3.5 py-2 transition-all"
                style={{ border: '1.5px solid #bfdbfe', borderRadius: '10px', background: '#fff', outline: 'none', boxShadow: '0 1px 3px rgba(37,99,235,0.06)' }}
                onFocus={e => Object.assign(e.target.style, { borderColor: '#2563eb', boxShadow: '0 0 0 3px rgba(37,99,235,0.12)' })}
                onBlur={e  => Object.assign(e.target.style, { borderColor: '#bfdbfe', boxShadow: '0 1px 3px rgba(37,99,235,0.06)' })}
              />
            </div>

            {/* Status toggles */}
            <div className="flex flex-col gap-2" style={{ flex: 2, minWidth: '280px' }}>
              <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: '#0284c7' }}>Status</span>
              <div className="flex flex-wrap gap-1.5">
                {statuses.map(s => (
                  <button key={s} onClick={() => toggleStatus(s)}
                    className="text-[11px] font-bold px-3.5 py-1.5 rounded-full transition-all"
                    style={{ border: '1.5px solid', lineHeight: 1.4, ...statusBtnStyle(s) }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #bfdbfe', margin: '0 0 16px' }} />

          {/* Row 2: Days + Time */}
          <div className="flex flex-wrap gap-5">
            {/* Days */}
            <div className="flex flex-col gap-2" style={{ flex: 1.5, minWidth: '260px' }}>
              <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: '#0284c7' }}>Day of Week</span>
              <div className="flex flex-wrap gap-1.5">
                {ALL_DAYS.map(d => (
                  <button key={d} onClick={() => toggleDay(d)}
                    className="text-[11px] font-bold px-3.5 py-1.5 rounded-full transition-all"
                    style={activeDays.includes(d)
                      ? { background: GRAD.blue, color: '#fff', border: '1.5px solid transparent', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }
                      : { background: '#fff', color: '#2563eb', border: '1.5px solid #bfdbfe' }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Time range */}
            <div className="flex flex-col gap-2" style={{ flex: 2, minWidth: '280px' }}>
              <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: '#0284c7' }}>Class Start Time</span>
              <div className="flex items-end gap-3 flex-wrap">
                {[
                  { label: 'From', h: fromH, setH: setFromH, m: fromM, setM: setFromM },
                  { label: 'To',   h: toH,   setH: setToH,   m: toM,   setM: setToM   },
                ].map(({ label, h, setH, m, setM }, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: '#0284c7' }}>{label}</span>
                    <div className="flex gap-1 items-center">
                      <select value={h} onChange={e => { setH(e.target.value); setPage(1); }}
                        style={{ minWidth: '70px', padding: '6px 8px', fontSize: '12px', border: '1.5px solid #bfdbfe', borderRadius: '8px', background: '#fff', color: '#1e40af', fontWeight: 600, outline: 'none' }}>
                        <option value="">Hr</option>
                        {[8,9,10,11,12,13,14,15,16,17,18].map(v => <option key={v} value={v}>{v < 12 ? `${v} AM` : v === 12 ? '12 PM' : `${v-12} PM`}</option>)}
                      </select>
                      <select value={m} onChange={e => { setM(e.target.value); setPage(1); }}
                        style={{ minWidth: '62px', padding: '6px 8px', fontSize: '12px', border: '1.5px solid #bfdbfe', borderRadius: '8px', background: '#fff', color: '#1e40af', fontWeight: 600, outline: 'none' }}>
                        {[0,10,20,30,40,50].map(v => <option key={v} value={v}>{`:${String(v).padStart(2,'0')}`}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
                <span style={{ fontSize: '18px', color: '#93c5fd', marginBottom: '6px', lineHeight: 1 }}>→</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Selected Courses Panel ════════════════════════════════════════════ */}
      {selected.length > 0 && (
        <div className="rounded-2xl overflow-hidden shadow-lg mb-4">
          <PanelHeader
            title="📋 Selected Courses"
            badge={`${selected.length} course${selected.length !== 1 ? 's' : ''}`}
            action={
              <GhostBtn onClick={() => { setSelected([]); localStorage.removeItem('aiub_selectedSections'); }}>
                ✕ Clear All
              </GhostBtn>
            }
          />
          <div className="p-4" style={{ background: GRAD.bodyBg }}>
            <div className="flex flex-wrap gap-3">
              {selected.map(sec => <SelectedCard key={sec.classId} sec={sec} onRemove={handleRemove} />)}
            </div>
          </div>
        </div>
      )}

      {/* ══ Results Table ═════════════════════════════════════════════════════ */}
      {filtered.length > 0 && (
        <div className="rounded-2xl overflow-hidden shadow-lg mb-4">
          {/* Results header */}
          <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3"
            style={{ background: GRAD.sky, borderBottom: '1px solid #bfdbfe' }}>
            <span className="text-[13px] font-bold text-sky-700">📄 {filtered.length} course(s) found</span>
            <div className="flex items-center gap-2 text-[12px] font-semibold text-sky-700">
              Show
              <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
                style={{ padding: '3px 8px', fontSize: '12px', border: '1.5px solid #bfdbfe', borderRadius: '6px', background: '#fff', color: '#1e40af', fontWeight: 600 }}>
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              per page
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: GRAD.sky, borderBottom: '2px solid #bfdbfe' }}>
                  {TH_COLS.map(({ label, w, center }) => (
                    <th key={label} style={{ width: w, padding: '10px', textAlign: center ? 'center' : 'left', fontSize: '10px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#64748b', background: GRAD.bodyBg }}>
                      No courses match your filters.
                    </td>
                  </tr>
                ) : pageData.map((c, i) => {
                  const rowBg = i % 2 === 0 ? 'linear-gradient(135deg,#f8fbff,#f0f9ff)' : '#fff';
                  const hoverBg = 'linear-gradient(135deg,#eff6ff,#dbeafe)';
                  return (
                    <tr key={c.classId} style={{ background: rowBg, borderBottom: '1px solid #e0f2fe' }}
                      onMouseEnter={e => e.currentTarget.style.background = hoverBg}
                      onMouseLeave={e => e.currentTarget.style.background = rowBg}>
                      <td style={{ padding: '9px 10px', fontFamily: 'ui-monospace,monospace', fontSize: '11px', fontWeight: 700, color: '#0284c7' }}>{c.classId}</td>
                      <td style={{ padding: '9px 10px', fontWeight: 600, color: '#1e293b' }}>{c.fullTitle}</td>
                      <td style={{ padding: '9px 10px' }}><StatusBadge status={c.status} /></td>
                      <td style={{ padding: '9px 10px', textAlign: 'center', color: '#475569' }}>{c.capacity}</td>
                      <td style={{ padding: '9px 10px', textAlign: 'center', fontWeight: c.count >= 35 ? 700 : 400, color: c.count >= 35 ? '#b45309' : '#475569', background: c.count >= 35 ? 'linear-gradient(135deg,#fffbeb,#fef3c7)' : 'inherit' }}>{c.count}</td>
                      <td style={{ padding: '9px 10px', textAlign: 'center' }}><SeatsBadge available={c.capacity - c.count} /></td>
                      <td style={{ padding: '9px 10px' }}><SlotPills timeSlots={c.timeSlots} /></td>
                      <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                        <ActionBtn course={c} selected={selected} clashMap={clashMap} onSelect={handleSelect} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-2.5"
              style={{ background: GRAD.pageFt, borderTop: '1px solid #bfdbfe' }}>
              <div className="flex items-center gap-1">
                {pageBtn('«', 1,           page === 1)}
                {pageBtn('‹', page - 1,    page === 1)}
                {pageNums.map(p => activePageBtn(p))}
                {pageBtn('›', page + 1,    page === totalPages)}
                {pageBtn('»', totalPages,  page === totalPages)}
              </div>
              <span className="text-[12px] font-semibold" style={{ color: '#0369a1' }}>
                Page {page} of {totalPages}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
