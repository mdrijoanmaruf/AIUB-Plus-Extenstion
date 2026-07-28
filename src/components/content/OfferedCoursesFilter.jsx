import { useState, useEffect, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import { FiCalendar, FiX, FiChevronDown, FiList, FiTrash2, FiZap, FiDownload, FiFileText, FiRefreshCw, FiClock, FiRepeat, FiCheck } from 'react-icons/fi';

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

const ROUTINE_COLORS = [
  { border: '#1d4ed8', bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)' },
  { border: '#7e22ce', bg: 'linear-gradient(135deg, #faf5ff, #f3e8ff)' },
  { border: '#15803d', bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' },
  { border: '#c2410c', bg: 'linear-gradient(135deg, #fff7ed, #ffedd5)' },
  { border: '#b91c1c', bg: 'linear-gradient(135deg, #fef2f2, #fee2e2)' },
  { border: '#0f766e', bg: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)' },
  { border: '#4338ca', bg: 'linear-gradient(135deg, #eef2ff, #e0e7ff)' },
  { border: '#be185d', bg: 'linear-gradient(135deg, #fdf2f8, #fce7f3)' },
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

const colorCache = {};
let colorIdx = 0;
function courseColor(title) {
  if (!colorCache[title]) colorCache[title] = ROUTINE_COLORS[colorIdx++ % ROUTINE_COLORS.length];
  return colorCache[title];
}

function hexToRgba(hex, opacity) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function loadSaved(allCourses) {
  try {
    const parsed = JSON.parse(localStorage.getItem('aiub_selectedSections') || '[]');
    return Array.isArray(parsed) ? parsed.filter(s => allCourses.some(c => c.classId === s.classId)) : [];
  } catch { return []; }
}

function getLooseSig(c) {
  return (c.timeSlots || []).map(ts => `${ts.day}|${ts.startTime}`).sort().join(';;');
}

function getLinkedSections(course, allCourses) {
  if (!allCourses || !allCourses.length) return [];
  const mySig = getLooseSig(course);
  return allCourses
    .filter(c => 
      c.title === course.title && 
      c.classId !== course.classId && 
      c.status.toLowerCase().includes('open') && 
      getLooseSig(c) === mySig
    )
    .map(({ section, classId, capacity, count, timeSlots }) => ({ section, classId, capacity, count, timeSlots }));
}

// ── Sub-components ────────────────────────────────────────────────────────────

const GRAD = {
  blue:    'linear-gradient(135deg,#1e3a8a,#2563eb)',
  sky:     'linear-gradient(135deg,#eef2f9,#f8fafc)',
  bodyBg:  '#ffffff',
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
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <span className="font-bold text-slate-700">{ts.day.slice(0, 3)}</span>
          <span className="text-slate-600 font-medium">{ts.startTime}–{ts.endTime}</span>
          {ts.room && (
            <span className="font-mono text-[10px] text-slate-600 px-1 rounded" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
              {ts.room}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

function ActionBtn({ course, selected, clashMap, onSelect, onRemove }) {
  const isSelected    = selected.some(s => s.classId === course.classId);
  const sameCourse    = selected.some(s => s.title === course.title && s.classId !== course.classId);
  const clash         = clashMap[course.classId];
  const base          = 'text-[11px] font-bold px-3 py-1.5 rounded-lg text-white transition-all';

  if (isSelected)
    return <button onClick={() => onRemove(course.classId)} className={`${base} hover:shadow-md hover:-translate-y-px flex items-center justify-center gap-1.5`} style={{ background: 'linear-gradient(135deg,#dc2626,#ef4444)', border: 'none', boxShadow: '0 2px 6px rgba(220,38,38,0.2)' }}><FiTrash2 /> Remove</button>;
  if (clash?.hasClash)
    return <button disabled title={`${clash.clashWith} — ${clash.details}`} className={`${base} flex items-center justify-center gap-1.5`} style={{ background: 'linear-gradient(135deg,#dc2626,#ef4444)', cursor: 'not-allowed', opacity: 0.85, border: 'none' }}><FiX /> Clash</button>;
  if (sameCourse)
    return <button disabled className={`${base} flex items-center justify-center gap-1.5`} style={{ background: 'linear-gradient(135deg,#4b5563,#6b7280)', cursor: 'default', border: 'none' }}><FiCheck /> Course Added</button>;

  const high = course.count >= 35;
  return (
    <button onClick={() => onSelect(course.classId)} className={`${base} hover:shadow-md hover:-translate-y-px`}
      style={{ background: high ? 'linear-gradient(135deg,#b45309,#d97706)' : GRAD.blue, boxShadow: '0 2px 6px rgba(37,99,235,0.2)', border: 'none' }}>
      + Select
    </button>
  );
}

function SelectedCard({ sec, allCourses, selected, onRemove }) {
  const col = courseColor(sec.title);
  const avail = sec.capacity - sec.count;
  
  const _linked = useMemo(() => getLinkedSections(sec, allCourses), [sec, allCourses]);

  return (
    <div className="relative rounded-2xl border transition-all duration-200 hover:-translate-y-1"
      style={{ background: '#fff', borderColor: '#e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.03)', padding: '20px', minWidth: '280px', flex: '1 1 280px', maxWidth: '400px' }}>

      {/* Header with course title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '16px', paddingRight: '28px' }}>
        <div style={{ width: '4px', height: '20px', borderRadius: '4px', background: col.border, flexShrink: 0, marginTop: '2px' }} />
        <div className="text-[14px] font-bold text-slate-800 leading-snug flex-1">{sec.fullTitle}</div>
      </div>

      {/* Time slots */}
      <div className="flex flex-col gap-2 mb-5">
        {sec.timeSlots.map((ts, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]"
            style={{ padding: '8px 12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
            <span className="font-bold text-slate-700">{ts.day.slice(0, 3)}</span>
            <span className="text-slate-600 font-medium">{ts.startTime}–{ts.endTime}</span>
            {ts.room && (
              <span style={{ marginLeft: 'auto', fontFamily: 'ui-monospace', fontSize: '10px', fontWeight: 600, color: '#475569', background: '#fff', padding: '2px 6px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                {ts.room}
              </span>
            )}
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{ts.classType}</span>
          </div>
        ))}
      </div>

      {/* Status and seats badges */}
      <div className="flex items-center gap-2 flex-wrap mb-4 pb-4" style={{ borderBottom: '1px dashed #e2e8f0' }}>
        <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide"
          style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>{sec.status}</span>
        <span className="text-[10px] font-bold px-3 py-1 rounded-full"
          style={{ background: avail <= 0 ? '#fef2f2' : '#f0fdf4', color: avail <= 0 ? '#dc2626' : '#16a34a', border: `1px solid ${avail <= 0 ? '#fecdd3' : '#bbf7d0'}` }}>
          {avail <= 0 ? 'FULL' : `${avail} seats`}
        </span>
      </div>

      {/* Linked sections section */}
      {_linked?.length > 0 && (
        <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#f8fafc', border: `1px solid #e2e8f0` }}>
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider px-3 py-2.5 flex items-center gap-1.5"
            style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
            <FiRepeat /> All {_linked.length + 1} sections
          </div>
          <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
            <div className="flex items-center gap-2 px-3 py-2.5 text-[11px] border-b border-slate-200"
              style={{ background: '#fff' }}>
              <span className="font-bold text-emerald-600 w-10 flex-shrink-0 text-center">{sec.section || sec.classId}</span>
              <span className="flex-1 text-slate-600 text-[10px] font-medium">{sec.timeSlots.map(ts => `${ts.day.slice(0, 3)} ${ts.startTime}–${ts.endTime}`).join(' · ')}</span>
              <span className="font-bold text-emerald-600 text-[10px] flex-shrink-0 text-right" style={{ minWidth: '50px' }}>{avail} seats</span>
            </div>
            {_linked.map((ls, i) => {
              const a = ls.capacity - ls.count;
              return (
                <div key={i} className="flex items-center gap-2 px-3 py-2.5 text-[11px] border-b border-slate-100 last:border-0"
                  style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                  <span className="font-bold text-slate-700 w-10 flex-shrink-0 text-center text-[10px]">{ls.section || ls.classId}</span>
                  <span className="flex-1 text-slate-600 text-[10px] font-medium">{ls.timeSlots.length ? ls.timeSlots.map(ts => `${ts.day.slice(0, 3)} ${ts.startTime}–${ts.endTime}`).join(' · ') : '—'}</span>
                  <span className={`font-bold text-[10px] flex-shrink-0 text-right ${a <= 0 ? 'text-red-500' : 'text-emerald-600'}`} style={{ minWidth: '50px' }}>
                    {a <= 0 ? 'FULL' : `${a} seats`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Remove button */}
      <button onClick={() => onRemove(sec.classId)}
        className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-150 hover:shadow-md"
        style={{ background: '#fef2f2', border: '1px solid #fecdd3', color: '#dc2626' }}
        onMouseEnter={e => Object.assign(e.currentTarget.style, { background: '#ef4444', color: '#fff', borderColor: '#ef4444' })}
        onMouseLeave={e => Object.assign(e.currentTarget.style, { background: '#fef2f2', color: '#dc2626', borderColor: '#fecdd3' })}
        title="Remove course"
      ><FiX size={18} /></button>
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

// ── Routine Modal ─────────────────────────────────────────────────────────────

function RoutineModal({ selected, allCourses, onClose }) {
  const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const routineRef = useRef(null);

  const downloadAsImage = async () => {
    if (!routineRef.current) return;
    try {
      const canvas = await html2canvas(routineRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `routine-${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    } catch (error) {
      console.error('Error downloading routine:', error);
    }
  };

  const activeDays = DAY_ORDER.filter(day =>
    selected.some(c => c.timeSlots.some(ts => ts.day === day))
  );

  let minTime = Infinity, maxTime = -Infinity;
  selected.forEach(c => {
    c.timeSlots.forEach(ts => {
      const s = timeToMinutes(ts.startTime);
      const e = timeToMinutes(ts.endTime);
      if (s !== null) minTime = Math.min(minTime, s);
      if (e !== null) maxTime = Math.max(maxTime, e);
    });
  });
  if (!isFinite(minTime)) minTime = 8 * 60;
  if (!isFinite(maxTime)) maxTime = 18 * 60;
  minTime = Math.floor(minTime / 60) * 60;
  maxTime = Math.ceil(maxTime / 60) * 60;

  const timeSlots = [];
  for (let t = minTime; t < maxTime; t += 60) timeSlots.push(t);

  function fmtTime(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const ap = h >= 12 ? 'PM' : 'AM';
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
  }

  // Build render plan
  const plan = {};
  activeDays.forEach(day => {
    plan[day] = {};
    const skipSet = new Set();
    timeSlots.forEach(t => {
      if (skipSet.has(t)) { plan[day][t] = 'skip'; return; }
      let found = null;
      for (const c of selected) {
        for (const ts of c.timeSlots) {
          if (ts.day !== day) continue;
          const start = timeToMinutes(ts.startTime);
          const end   = timeToMinutes(ts.endTime);
          if (start === null || end === null) continue;
          if (start >= t && start < t + 60) { found = { course: c, slot: ts, start, end }; break; }
        }
        if (found) break;
      }
      if (found) {
        const span = Math.ceil((found.end - t) / 60);
        plan[day][t] = { course: found.course, slot: found.slot, span };
        for (let i = 1; i < span; i++) skipSet.add(t + i * 60);
      } else {
        plan[day][t] = null;
      }
    });
  });

  const ROW_H = 64;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: '100%', maxWidth: '1100px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,sans-serif", border: '1px solid #e2e8f0' }} ref={routineRef}>

        {/* Header */}
        <div style={{ background: '#fff', padding: '20px 28px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#0f172a', fontWeight: 800, fontSize: '20px', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiCalendar style={{ color: '#3b82f6' }} /> Weekly Schedule
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '999px', background: '#f1f5f9', color: '#475569' }}>
              {selected.length} course{selected.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => downloadAsImage()}
              className="hover:shadow-lg transition-all duration-200 flex items-center gap-1.5 hover:-translate-y-0.5"
              style={{ background: '#2563eb', border: 'none', color: '#fff', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: 700 }}>
              <FiDownload /> Download Image
            </button>
            <button onClick={onClose}
              className="hover:bg-slate-100 transition-all duration-200 flex items-center gap-1.5"
              style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#475569', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: 700 }}>
              <FiX /> Close
            </button>
          </div>
        </div>

        {/* Table */}
        <style>{`
          .routine-table-wrapper::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .routine-table-wrapper::-webkit-scrollbar-track {
            background: #f8fafc;
            border-radius: 4px;
          }
          .routine-table-wrapper::-webkit-scrollbar-thumb {
            background: #bfdbfe;
            border-radius: 4px;
          }
          .routine-table-wrapper::-webkit-scrollbar-thumb:hover {
            background: #93c5fd;
          }
        `}</style>
        <div className="routine-table-wrapper" style={{ overflowY: 'auto', overflowX: 'auto', flex: 1, background: '#f8fafc' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: `${100 + activeDays.length * 150}px` }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
              <tr style={{ background: '#ffffff' }}>
                <th style={{ width: '80px', padding: '16px 8px', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
                  Time
                </th>
                {activeDays.map(day => (
                  <th key={day} style={{ padding: '16px 8px', fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((t, ti) => (
                <tr key={t} style={{ borderBottom: '1px dashed #e2e8f0' }}>
                  {/* Time label */}
                  <td style={{ padding: '8px', background: '#ffffff', borderRight: '1px solid #f1f5f9', whiteSpace: 'nowrap', verticalAlign: 'middle', textAlign: 'center', height: `${ROW_H}px` }}>
                    <div style={{ fontWeight: 700, fontSize: '12px', color: '#64748b' }}>{fmtTime(t)}</div>
                  </td>

                  {/* Day cells */}
                  {activeDays.map(day => {
                    const cell = plan[day][t];
                    if (cell === 'skip') return null;
                    if (!cell) return (
                      <td key={day} style={{ height: `${ROW_H}px`, borderRight: '1px dashed #f1f5f9' }} />
                    );
                    const col = courseColor(cell.course.title);
                    const innerH = cell.span * ROW_H - 12; // accommodate padding/margin
                    const linkedSecs = getLinkedSections(cell.course, allCourses);
                    
                    return (
                      <td key={day} rowSpan={cell.span}
                        style={{ padding: '6px', borderRight: '1px dashed #f1f5f9', verticalAlign: 'top' }}>
                        <div style={{ 
                          background: col.bg, 
                          border: '1px solid', 
                          borderColor: hexToRgba(col.border, 0.15),
                          borderTop: `4px solid ${col.border}`, 
                          borderRadius: '8px', 
                          padding: '10px 8px', 
                          minHeight: `${innerH}px`, 
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'center',
                          alignItems: 'center', 
                          textAlign: 'center', 
                          transition: 'all 0.2s', 
                          overflow: 'hidden', 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                          height: '100%'
                        }}>
                          <div style={{ fontSize: '11px', fontWeight: 800, color: '#1e293b', lineHeight: 1.3, marginBottom: '4px' }}>
                            {cell.course.title}
                          </div>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap', justifyItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                             <span style={{ fontSize: '10px', fontWeight: 800, color: '#ffffff', background: col.border, borderRadius: '4px', padding: '2px 6px', letterSpacing: '0.02em', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                               {cell.course.section || cell.course.classId}
                             </span>
                             <span style={{ fontSize: '9px', fontWeight: 800, color: col.border, background: '#ffffff', borderRadius: '4px', padding: '2px 6px', textTransform: 'uppercase', letterSpacing: '0.04em', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                               {cell.slot.classType}
                             </span>
                          </div>
                          <div style={{ fontSize: '10px', color: '#475569', fontWeight: 700, marginBottom: '4px' }}>
                            {cell.slot.startTime}–{cell.slot.endTime}
                          </div>
                          {cell.slot.room && (
                            <div style={{ fontSize: '10px', fontFamily: 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace', fontWeight: 700, color: col.border, background: '#ffffff', border: '1px solid', borderColor: hexToRgba(col.border, 0.2), borderRadius: '4px', padding: '2px 8px' }}>
                              {cell.slot.room}
                            </div>
                          )}
                          {linkedSecs.length > 0 && (
                            <div style={{ width: '100%', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed', borderColor: hexToRgba(col.border, 0.3) }}>
                              <div style={{ fontSize: '9px', fontWeight: 800, color: col.border, opacity: 0.8, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alt Sections</div>
                              <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {linkedSecs.slice(0, 3).map((ls, i) => (
                                  <span key={i} style={{ fontSize: '9px', fontWeight: 700, color: '#ffffff', background: col.border, borderRadius: '4px', padding: '1px 5px' }}>{ls.section || ls.classId}</span>
                                ))}
                                {linkedSecs.length > 3 && <span style={{ fontSize: '9px', fontWeight: 800, color: col.border, opacity: 0.8 }}>+{linkedSecs.length - 3}</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div style={{ padding: '16px 28px', background: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', flexWrap: 'wrap', gap: '20px', flexShrink: 0, alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Legend</span>
          {selected.map(sec => {
            const col = courseColor(sec.title);
            return (
              <div key={sec.classId} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: col.border, flexShrink: 0, boxShadow: `0 2px 4px ${hexToRgba(col.border, 0.3)}` }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>{sec.title}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OfferedCoursesFilter({ allCourses = [], statuses = [], originalPanel, isLoading = false }) {
  const [search,         setSearch]         = useState('');
  const [activeStatuses, setActiveStatuses] = useState([]);
  const [activeDays,     setActiveDays]     = useState([]);
  const [fromH, setFromH] = useState('8');
  const [fromM, setFromM] = useState('0');
  const [toH,   setToH]   = useState('18');
  const [toM,   setToM]   = useState('0');
  const [page,    setPage]    = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [selected, setSelected] = useState(() => loadSaved(allCourses));
  const [showRoutine, setShowRoutine] = useState(false);
  const [isSelectedExpanded, setIsSelectedExpanded] = useState(true);

  // Initialize statuses when data loads
  useEffect(() => {
    if (statuses.length > 0 && activeStatuses.length === 0) {
      setActiveStatuses(statuses.filter(s => s.toLowerCase().includes('open')));
    }
  }, [statuses]);

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
    setSelected(p => [...p, c]);
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
      : { background: '#f8fafc', color: '#475569', borderColor: '#e2e8f0' };
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
      <div className="mb-6 p-6 transition-all" style={{ background: '#eff6ff', borderRadius: '16px', border: 'none' }}>
        
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '1px solid #dbeafe' }}>
           <div className="flex items-center gap-3">
               <span style={{ fontSize: '18px', fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}><FiZap /> Advanced Filters</span>
               <span style={{ background: '#fff', color: '#1e40af', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '6px' }}>
                 {isLoading ? <><FiClock className="animate-spin" /> Loading courses...</> : `${allCourses.length} courses loaded`}
               </span>
           </div>
           <button onClick={handleReset} className="hover:opacity-80 transition-opacity flex items-center gap-1.5" style={{ background: '#fff', color: '#2563eb', fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
             <FiRefreshCw /> Reset Filters
           </button>
        </div>

        {/* Grid Layout for Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
           
           {/* 1. Search */}
           <div className="flex flex-col gap-2.5">
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Search Course</label>
              <input type="text" value={search} placeholder="Course name or Class ID…"
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full text-[13px] px-4 py-2.5 transition-all"
                style={{ border: '1.5px solid #bfdbfe', borderRadius: '10px', background: '#fff', outline: 'none', color: '#1e293b', fontWeight: 500 }}
                onFocus={e => Object.assign(e.target.style, { borderColor: '#2563eb', boxShadow: '0 0 0 3px rgba(37,99,235,0.1)' })}
                onBlur={e  => Object.assign(e.target.style, { borderColor: '#bfdbfe', boxShadow: 'none' })}
              />
           </div>

           {/* 2. Status */}
           <div className="flex flex-col gap-2.5">
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Availability Status</label>
              <div className="flex flex-wrap gap-2">
                {statuses.map(s => (
                  <button key={s} onClick={() => toggleStatus(s)}
                    className="text-[11px] font-bold px-3.5 py-1.5 rounded-full transition-all hover:-translate-y-px"
                    style={{ border: '1.5px solid', ...statusBtnStyle(s) }}>
                    {s}
                  </button>
                ))}
              </div>
           </div>

           {/* 3. Days */}
           <div className="flex flex-col gap-2.5">
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Class Days</label>
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map(d => (
                  <button key={d} onClick={() => toggleDay(d)}
                    className="text-[11px] font-bold px-3.5 py-1.5 rounded-full transition-all hover:-translate-y-px"
                    style={activeDays.includes(d)
                      ? { background: GRAD.blue, color: '#fff', border: '1.5px solid transparent', boxShadow: '0 4px 10px rgba(37,99,235,0.25)' }
                      : { background: '#fff', color: '#475569', border: '1.5px solid #bfdbfe' }}>
                    {d}
                  </button>
                ))}
              </div>
           </div>

           {/* 4. Time Range */}
           <div className="flex flex-col gap-2.5">
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time Range</label>
              <div className="flex items-center gap-2 flex-wrap" style={{ background: '#fff', padding: '4px', borderRadius: '12px', border: '1px solid #bfdbfe', width: 'fit-content' }}>
                <div className="flex gap-1">
                  <select value={fromH} onChange={e => { setFromH(e.target.value); setPage(1); }}
                    style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', color: '#1e293b', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
                    <option value="">Hr</option>
                    {[8,9,10,11,12,13,14,15,16,17,18].map(v => <option key={v} value={v}>{v < 12 ? `${v} AM` : v === 12 ? '12 PM' : `${v-12} PM`}</option>)}
                  </select>
                  <select value={fromM} onChange={e => { setFromM(e.target.value); setPage(1); }}
                    style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', color: '#1e293b', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
                    {[0,10,20,30,40,50].map(v => <option key={v} value={v}>{`:${String(v).padStart(2,'0')}`}</option>)}
                  </select>
                </div>
                <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 800, margin: '0 2px' }}>→</span>
                <div className="flex gap-1">
                  <select value={toH} onChange={e => { setToH(e.target.value); setPage(1); }}
                    style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', color: '#1e293b', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
                    <option value="">Hr</option>
                    {[8,9,10,11,12,13,14,15,16,17,18].map(v => <option key={v} value={v}>{v < 12 ? `${v} AM` : v === 12 ? '12 PM' : `${v-12} PM`}</option>)}
                  </select>
                  <select value={toM} onChange={e => { setToM(e.target.value); setPage(1); }}
                    style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', color: '#1e293b', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
                    {[0,10,20,30,40,50].map(v => <option key={v} value={v}>{`:${String(v).padStart(2,'0')}`}</option>)}
                  </select>
                </div>
              </div>
           </div>
        </div>

      </div>

      {/* ══ Selected Courses Panel ════════════════════════════════════════════ */}
      {selected.length > 0 && (
        <div className="mb-6 p-6 transition-all" style={{ background: '#eff6ff', borderRadius: '16px', border: 'none' }}>
          <div className="flex items-center justify-between" style={{ borderBottom: isSelectedExpanded ? '1px solid #dbeafe' : 'none', paddingBottom: isSelectedExpanded ? '16px' : '0', marginBottom: isSelectedExpanded ? '20px' : '0' }}>
             <div className="flex items-center gap-4">
                 <span style={{ fontSize: '18px', fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <FiList /> Selected Courses
                 </span>
                 <span style={{ background: '#fff', color: '#1e40af', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', border: '1px solid #bfdbfe' }}>
                   {selected.length} course{selected.length !== 1 ? 's' : ''}
                 </span>
             </div>
             <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', opacity: isSelectedExpanded ? 1 : 0, pointerEvents: isSelectedExpanded ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
                  <button onClick={() => setShowRoutine(true)} className="hover:opacity-80 transition-opacity flex items-center gap-1.5" style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', color: '#fff', fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}><FiCalendar /> Show Routine</button>
                  <button onClick={() => { setSelected([]); localStorage.removeItem('aiub_selectedSections'); }} className="hover:opacity-80 transition-opacity flex items-center gap-1.5" style={{ background: '#fff', color: '#dc2626', fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: '8px', border: '1px solid #fecdd3' }}><FiTrash2 /> Clear All</button>
                </div>
                
                <button onClick={() => setIsSelectedExpanded(!isSelectedExpanded)} className="flex items-center justify-center rounded-full hover:bg-blue-100 transition-colors" style={{ width: '32px', height: '32px', color: '#1e3a8a', border: '1.5px solid #1e3a8a', background: 'transparent' }}>
                  <FiChevronDown style={{ transform: isSelectedExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: '18px' }} />
                </button>
             </div>
          </div>
          {isSelectedExpanded && (
            <div className="flex flex-wrap gap-4">
              {selected.map(sec => <SelectedCard key={sec.classId} sec={sec} allCourses={allCourses} selected={selected} onRemove={handleRemove} />)}
            </div>
          )}
        </div>
      )}

      {showRoutine && <RoutineModal selected={selected} allCourses={allCourses} onClose={() => setShowRoutine(false)} />}

      {/* ══ Results Table ═════════════════════════════════════════════════════ */}
      {filtered.length > 0 && (
        <div className="rounded-2xl overflow-hidden shadow-lg mb-4" style={{ border: '1px solid #e2e8f0', background: '#fff' }}>
          {/* Results header */}
          <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3.5"
            style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <span className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5"><FiFileText /> {filtered.length} course(s) found</span>
            <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-600">
              Show
              <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
                style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', color: '#1e293b', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              per page
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr>
                  {TH_COLS.map(({ label, w, center }) => (
                    <th key={label} style={{ width: w, padding: '12px 14px', textAlign: center ? 'center' : 'left', fontSize: '11px', fontWeight: 700, color: '#334669', background: '#eef2f9', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#64748b', background: '#fff' }}>
                      <div className="flex flex-col items-center gap-2">
                        <FiClock className="animate-spin text-[24px]" />
                        <span className="font-bold">Fetching course data...</span>
                        <span className="text-[11px] opacity-70">This may take a few seconds as we parse the schedule.</span>
                      </div>
                    </td>
                  </tr>
                ) : pageData.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#64748b', background: '#fff' }}>
                      No courses match your filters.
                    </td>
                  </tr>
                ) : pageData.map((c, i) => {
                  const rowBg = '#ffffff';
                  const hoverBg = '#f8fafc';
                  return (
                    <tr key={c.classId} style={{ background: rowBg, borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = hoverBg}
                      onMouseLeave={e => e.currentTarget.style.background = rowBg}>
                      <td style={{ padding: '12px 14px', fontFamily: 'ui-monospace,monospace', fontSize: '12px', fontWeight: 700, color: '#2563eb', borderRight: '1px solid #e2e8f0' }}>{c.classId}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1e293b', borderRight: '1px solid #e2e8f0' }}>{c.fullTitle}</td>
                      <td style={{ padding: '12px 14px', borderRight: '1px solid #e2e8f0' }}><StatusBadge status={c.status} /></td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', color: '#475569', fontWeight: 500, borderRight: '1px solid #e2e8f0' }}>{c.capacity}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: c.count >= 35 ? 700 : 500, color: c.count >= 35 ? '#b45309' : '#475569', background: c.count >= 35 ? 'linear-gradient(135deg,#fffbeb,#fef3c7)' : 'inherit', borderRight: '1px solid #e2e8f0' }}>{c.count}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}><SeatsBadge available={c.capacity - c.count} /></td>
                      <td style={{ padding: '12px 14px', borderRight: '1px solid #e2e8f0' }}><SlotPills timeSlots={c.timeSlots} /></td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                        <ActionBtn course={c} selected={selected} clashMap={clashMap} onSelect={handleSelect} onRemove={handleRemove} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3.5"
              style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-1.5">
                {pageBtn('«', 1,           page === 1)}
                {pageBtn('‹', page - 1,    page === 1)}
                {pageNums.map(p => activePageBtn(p))}
                {pageBtn('›', page + 1,    page === totalPages)}
                {pageBtn('»', totalPages,  page === totalPages)}
              </div>
              <span className="text-[12px] font-bold" style={{ color: '#475569' }}>
                Page {page} of {totalPages}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
