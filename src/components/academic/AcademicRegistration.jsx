import { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { FiPrinter, FiCalendar, FiDownload, FiX } from 'react-icons/fi';
import '../../content.css';

// --- Routine Helpers ---
const DAY_ABBR_MAP = {
  'sun': 'Sunday', 'mon': 'Monday', 'tue': 'Tuesday', 'wed': 'Wednesday',
  'thu': 'Thursday', 'fri': 'Friday', 'sat': 'Saturday'
};
const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

const rColorCache = {};
let rColorIdx = 0;
function rCourseColor(title) {
  if (!rColorCache[title]) rColorCache[title] = ROUTINE_COLORS[rColorIdx++ % ROUTINE_COLORS.length];
  return rColorCache[title];
}

function hexToRgba(hex, opacity) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function timeToMinutes(str) {
  const m = (str || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10), p = m[3].toUpperCase();
  if (p === 'PM' && h !== 12) h += 12;
  if (p === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

function parseTimeSlot(schedule) {
  let t = (schedule.time || '').trim();
  if (!t) return [];

  // Match all day abbreviations at the beginning (e.g. "Sun", "Sun, Tue", "Sunday")
  const days = [];
  const dayRegex = /^([A-Za-z]{3,9})(?:,\s*|\s+)/;
  
  while (true) {
    const match = t.match(dayRegex);
    if (!match) break;
    const dayStr = match[1].toLowerCase().slice(0, 3);
    if (DAY_ABBR_MAP[dayStr]) {
      days.push(DAY_ABBR_MAP[dayStr]);
    }
    // Remove the matched part from the string
    t = t.replace(dayRegex, '');
  }

  if (days.length === 0) return []; // No valid day found

  // Split by " - " to get start and end parts
  const parts = t.split(/\s*-\s*/);
  if (parts.length < 2) return [];

  // Remove the day word from the beginning of each part if present
  let startStr = parts[0].replace(/^[A-Za-z]{3,9}\s+/, '').trim();
  let endStr = parts[1].replace(/^[A-Za-z]{3,9}\s+/, '').trim();

  // Normalize missing minutes (e.g. "8 AM" -> "8:00 AM")
  startStr = startStr.replace(/^(\d{1,2})\s+([AP]M)$/i, '$1:00 $2');
  endStr = endStr.replace(/^(\d{1,2})\s+([AP]M)$/i, '$1:00 $2');

  // Normalize missing minutes with no AM/PM (e.g. "8" -> "8:00")
  startStr = startStr.replace(/^(\d{1,2})$/, '$1:00');
  endStr = endStr.replace(/^(\d{1,2})$/, '$1:00');

  // Normalize single-digit minutes (e.g. "3:0 PM" -> "3:00 PM", "11:0" -> "11:00")
  startStr = startStr.replace(/:(\d)(\s|$)/, ':0$1$2');
  endStr = endStr.replace(/:(\d)(\s|$)/, ':0$1$2');

  // If start time has no AM/PM, try to infer from end time first
  if (!/[AP]M$/i.test(startStr) && /([AP]M)$/i.test(endStr)) {
    const endPeriod = endStr.match(/([AP]M)$/i)[1];
    // Try same period as end; if that makes start > end, use opposite
    const testStart = startStr + ' ' + endPeriod;
    const sMin = timeToMinutes(testStart);
    const eMin = timeToMinutes(endStr);
    if (sMin !== null && eMin !== null && sMin < eMin) {
      startStr = testStart;
    } else {
      startStr = startStr + ' ' + (endPeriod.toUpperCase() === 'AM' ? 'PM' : 'AM');
    }
  }

  // Now, if either STILL lacks AM/PM, infer based on university hours
  const inferAMPM = (timeStr) => {
    if (/[AP]M$/i.test(timeStr)) return timeStr;
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return timeStr;
    let h = parseInt(match[1], 10);
    let period = 'AM';
    // AIUB daytime classes: 8-11 -> AM, 12-7 -> PM
    if (h === 12 || (h >= 1 && h <= 7)) {
      period = 'PM';
    } else if (h >= 8 && h <= 11) {
      period = 'AM';
    }
    return `${timeStr} ${period}`;
  };

  startStr = inferAMPM(startStr);
  endStr = inferAMPM(endStr);

  // Validate both times
  if (!/\d{1,2}:\d{2}\s*[AP]M$/i.test(startStr)) return [];
  if (!/\d{1,2}:\d{2}\s*[AP]M$/i.test(endStr)) return [];

  return days.map(day => ({
    day,
    startTime: startStr,
    endTime: endStr,
    classType: schedule.type || '',
    room: schedule.room || ''
  }));
}

function buildRoutineCourses(courses) {
  return courses
    .filter(c => !c.droppedText)
    .map(c => {
      const timeSlots = c.schedules.flatMap(s => parseTimeSlot(s)).filter(Boolean);
      return {
        title: c.code ? `${c.code} - ${c.name}` : c.name,
        shortTitle: c.name || c.code,
        section: c.section,
        timeSlots,
      };
    })
    .filter(c => c.timeSlots.length > 0);
}

function RegistrationRoutineModal({ courses, onClose }) {
  const routineRef = useRef(null);

  const downloadAsImage = async () => {
    if (!routineRef.current) return;
    try {
      const node = routineRef.current;
      const tableWrapper = node.querySelector('.reg-routine-wrapper');
      const origMaxH = node.style.maxHeight;
      const origOvf = node.style.overflow;
      const origTableOvfY = tableWrapper ? tableWrapper.style.overflowY : '';
      const origTableOvfX = tableWrapper ? tableWrapper.style.overflowX : '';
      node.style.maxHeight = 'none';
      node.style.overflow = 'visible';
      if (tableWrapper) { tableWrapper.style.overflowY = 'visible'; tableWrapper.style.overflowX = 'visible'; }
      const canvas = await html2canvas(node, { backgroundColor: '#ffffff', scale: 2, logging: false, windowHeight: node.scrollHeight });
      node.style.maxHeight = origMaxH;
      node.style.overflow = origOvf;
      if (tableWrapper) { tableWrapper.style.overflowY = origTableOvfY; tableWrapper.style.overflowX = origTableOvfX; }
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `registration-routine-${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    } catch (error) {
      console.error('Error downloading routine:', error);
    }
  };

  const activeDays = DAY_ORDER.filter(day =>
    courses.some(c => c.timeSlots.some(ts => ts.day === day))
  );

  let minTime = Infinity, maxTime = -Infinity;
  courses.forEach(c => {
    c.timeSlots.forEach(ts => {
      const s = timeToMinutes(ts.startTime);
      const e = timeToMinutes(ts.endTime);
      if (s !== null) minTime = Math.min(minTime, s);
      if (e !== null) maxTime = Math.max(maxTime, e);
    });
  });
  if (!isFinite(minTime)) minTime = 8 * 60;
  if (!isFinite(maxTime)) maxTime = 18 * 60;
  minTime = Math.floor(minTime / 15) * 15;
  maxTime = Math.ceil(maxTime / 15) * 15;

  const SLOT_INTERVAL = 15;
  const tSlots = [];
  for (let t = minTime; t <= maxTime; t += SLOT_INTERVAL) tSlots.push(t);

  function fmtTime(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const ap = h >= 12 ? 'PM' : 'AM';
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
  }

  const plan = {};
  activeDays.forEach(day => {
    plan[day] = {};
    const skipSet = new Set();
    tSlots.forEach(t => {
      if (skipSet.has(t)) { plan[day][t] = 'skip'; return; }
      let found = null;
      for (const c of courses) {
        for (const ts of c.timeSlots) {
          if (ts.day !== day) continue;
          const start = timeToMinutes(ts.startTime);
          const end = timeToMinutes(ts.endTime);
          if (start === null || end === null) continue;
          if (start >= t && start < t + SLOT_INTERVAL) { found = { course: c, slot: ts, start, end }; break; }
        }
        if (found) break;
      }
      if (found) {
        const span = Math.ceil((found.end - t) / SLOT_INTERVAL);
        plan[day][t] = { course: found.course, slot: found.slot, span };
        for (let i = 1; i < span; i++) skipSet.add(t + i * SLOT_INTERVAL);
      } else {
        plan[day][t] = null;
      }
    });
  });

  const MIN_ROW_H = 18;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: '100%', maxWidth: '1100px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,sans-serif", border: '1px solid #e2e8f0' }} ref={routineRef}>

        {/* Header */}
        <div data-html2canvas-ignore="true" style={{ background: '#fff', padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#0f172a', fontWeight: 800, fontSize: '20px', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiCalendar style={{ color: '#3b82f6' }} /> Registration Routine
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '999px', background: '#f1f5f9', color: '#475569' }}>
              {courses.length} course{courses.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={downloadAsImage}
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

        <style>{`
          .reg-routine-wrapper::-webkit-scrollbar { width: 6px; height: 6px; }
          .reg-routine-wrapper::-webkit-scrollbar-track { background: #f8fafc; border-radius: 4px; }
          .reg-routine-wrapper::-webkit-scrollbar-thumb { background: #bfdbfe; border-radius: 4px; }
          .reg-routine-wrapper::-webkit-scrollbar-thumb:hover { background: #93c5fd; }
        `}</style>

        <div className="reg-routine-wrapper" style={{ overflowY: 'auto', overflowX: 'auto', flex: 1, background: '#f8fafc' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: `${100 + activeDays.length * 150}px` }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
              <tr style={{ background: '#ffffff' }}>
                <th style={{ width: '80px', padding: '16px 8px', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>Time</th>
                {activeDays.map(day => (
                  <th key={day} style={{ padding: '16px 8px', fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tSlots.map(t => (
                <tr key={t} style={{ borderBottom: '1px dashed #e2e8f0' }}>
                  <td style={{ padding: '2px 6px', background: '#ffffff', borderRight: '1px solid #f1f5f9', whiteSpace: 'nowrap', verticalAlign: 'middle', textAlign: 'center', minHeight: `${MIN_ROW_H}px`, height: `${MIN_ROW_H}px` }}>
                    {t % 30 === 0 ? <div style={{ fontWeight: 700, fontSize: '11px', color: '#64748b' }}>{fmtTime(t)}</div> : null}
                  </td>
                  {activeDays.map(day => {
                    const cell = plan[day][t];
                    if (cell === 'skip') return null;
                    if (!cell) return <td key={day} style={{ minHeight: `${MIN_ROW_H}px`, height: `${MIN_ROW_H}px`, borderRight: '1px dashed #f1f5f9' }} />;
                    const col = rCourseColor(cell.course.shortTitle);
                    return (
                      <td key={day} rowSpan={cell.span} style={{ padding: 0, borderRight: '1px dashed #f1f5f9', verticalAlign: 'top', position: 'relative' }}>
                        <div style={{
                          position: 'absolute', inset: '4px',
                          background: col.bg, border: '1px solid', borderColor: hexToRgba(col.border, 0.15),
                          borderTop: `3px solid ${col.border}`, borderRadius: '6px', padding: '6px 4px',
                          display: 'flex', flexDirection: 'column', justifyContent: 'center',
                          alignItems: 'center', textAlign: 'center', transition: 'all 0.2s',
                          overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', boxSizing: 'border-box'
                        }}>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b', lineHeight: 1.2, marginBottom: '3px' }}>
                            {cell.course.shortTitle}
                          </div>
                          <div style={{ display: 'flex', gap: '3px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '3px' }}>
                            <span style={{ fontSize: '9px', fontWeight: 800, color: '#ffffff', background: col.border, borderRadius: '4px', padding: '1px 5px', letterSpacing: '0.02em', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                              {cell.course.section}
                            </span>
                            <span style={{ fontSize: '9px', fontWeight: 800, color: col.border, background: '#ffffff', borderRadius: '4px', padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '0.04em', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                              {cell.slot.classType}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#475569', fontWeight: 700, marginBottom: '2px' }}>
                            {cell.slot.startTime}–{cell.slot.endTime}
                          </div>
                          {cell.slot.room && (
                            <div style={{ fontSize: '10px', fontFamily: 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace', fontWeight: 700, color: col.border, background: '#ffffff', border: '1px solid', borderColor: hexToRgba(col.border, 0.2), borderRadius: '4px', padding: '2px 8px' }}>
                              {cell.slot.room}
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
          {courses.map((c, i) => {
            const col = rCourseColor(c.shortTitle);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: col.border, flexShrink: 0, boxShadow: `0 2px 4px ${hexToRgba(col.border, 0.3)}` }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>{c.shortTitle}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


function parseScheduleLine(text) {
  const typeMatch = text.match(/^\(([^)]+)\)/);
  const type = typeMatch ? typeMatch[1] : '';
  const afterType = text.replace(/^\([^)]+\)\s*/, '');
  const roomIdx = afterType.lastIndexOf('Room:');
  const timePart = (roomIdx > 0 ? afterType.slice(0, roomIdx) : afterType)
    .replace(/^Time:\s*/, '').trim();
  const room = roomIdx > 0 ? afterType.slice(roomIdx + 5).trim() : '';
  return { type, time: timePart, room };
}

function parseCreditSummary(tbl) {
  const items = [];
  tbl.querySelectorAll('div[class*="col-"]').forEach((col) => {
    const labels = [...col.children].filter((el) => el.tagName === 'LABEL');
    if (labels.length >= 2) {
      const key = labels[0].textContent.replace(':', '').trim();
      const val = labels[1].textContent.trim();
      if (key) items.push({ key, val });
    }
  });
  return items;
}

function parseCourses(table) {
  const courses = [];
  table.querySelectorAll('tbody tr').forEach((tr) => {
    const tds = [...tr.querySelectorAll('td')];
    if (!tds.length) return;
    const a = tds[0].querySelector('a');
    if (!a) return;

    const fullText = a.textContent.trim();
    const sectionMatch = fullText.match(/\[([A-Z0-9]+)\]$/);
    const section = sectionMatch ? sectionMatch[1] : '';
    const withoutSec = fullText.replace(/\s*\[[A-Z0-9]+\]$/, '').trim();
    const dashIdx = withoutSec.indexOf('-');
    const code = dashIdx >= 0 ? withoutSec.slice(0, dashIdx).trim() : '';
    const name = dashIdx >= 0 ? withoutSec.slice(dashIdx + 1).trim() : withoutSec;

    const schedules = [...tds[0].querySelectorAll('div')].reduce((acc, d) => {
      const span = d.querySelector('span');
      if (!span || span.style.color === 'red') return acc;
      const txt = span.textContent.trim();
      if (txt) acc.push(parseScheduleLine(txt));
      return acc;
    }, []);

    const dropSpan = tds[0].querySelector('span[style*="color: red"]');
    const droppedText = dropSpan ? dropSpan.textContent.trim() : '';
    const credStr = tds[1] ? tds[1].textContent.trim() : '';
    const href = a.getAttribute('href') || '#';

    courses.push({ code, name, section, schedules, droppedText, credStr, href });
  });
  return courses;
}

function parseFees(div) {
  const items = [];
  div.querySelectorAll('li').forEach((li) => {
    const badge = li.querySelector('.badge');
    if (!badge) return;
    const amt = badge.textContent.trim();
    const clone = li.cloneNode(true);
    clone.querySelector('.badge')?.remove();
    const label = clone.textContent.trim();

    const si = li.querySelector('strong.text-info, label.text-info, .text-info');
    const sw = li.querySelector('label.text-warning, .text-warning');
    const ss = li.querySelector('label.text-success, .text-success');
    const st = li.querySelector('strong');

    let type = 'normal';
    if (si) {
      type = si.textContent.toLowerCase().includes('net') ? 'net-total' : 'total';
    } else if (sw) {
      type = label.toLowerCase().includes('prev') ? 'prev' : 'deduction';
    } else if (ss) {
      type = 'balance';
    } else if (st) {
      type = 'paid';
    }

    items.push({ label, amt, type });
  });
  return items;
}


function schedTypeClass(type) {
  const t = (type || '').toLowerCase();
  if (t === 'theory') return 'bg-blue-100/60 text-blue-700 text-[10px] font-semibold';
  if (t === 'lab') return 'bg-cyan-100/60 text-cyan-700 text-[10px] font-semibold';
  return 'bg-slate-100/60 text-slate-600 text-[10px] font-semibold';
}

function CourseCard({ course }) {
  const isDropped = !!course.droppedText;
  const dropMatch = course.droppedText.match(/\(([^)]+)\)/);
  const dropDetail = dropMatch ? dropMatch[1] : '';
  const safeHref = course.href && /^[/?#]/.test(course.href) ? course.href : '#';
  
  const cardBg = isDropped
    ? 'linear-gradient(135deg, #fff8f8 0%, #fff1f2 50%, #ffe4e6 100%)'
    : 'linear-gradient(135deg, #f8fbff 0%, #eff6ff 50%, #dbeafe 100%)';
  const cardBorder = isDropped ? '#fecdd3' : '#bfdbfe';
  const codeColor = isDropped ? '#991b1b' : '#0284c7';
  const sectionBg = isDropped ? '#fee2e2' : '#dbeafe';
  const sectionBorder = isDropped ? '#fca5a5' : '#0284c7';

  return (
    <div 
      className="border rounded-lg overflow-hidden transition-all hover:shadow-md shadow-sm"
      style={{
        background: cardBg,
        borderColor: cardBorder,
        borderWidth: '1px'
      }}
    >
      <div className="flex items-start gap-2.5 px-3.5 pt-2.5 pb-2">
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[11px] font-bold tracking-wide mb-0.5 uppercase" style={{ color: codeColor }}>
            <a href={safeHref} style={{ color: 'inherit', textDecoration: 'none' }}>{course.code}</a>
          </div>
          <div className={`text-[13px] font-semibold leading-snug ${isDropped ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
            {course.name}
          </div>
        </div>
        {course.section && (
          <div 
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[14px] font-extrabold border shadow-sm"
            style={{
              backgroundColor: sectionBg,
              borderColor: sectionBorder,
              borderWidth: '1.5px',
              color: isDropped ? '#991b1b' : '#0369a1'
            }}
          >
            {course.section}
          </div>
        )}
      </div>

      {course.schedules.length > 0 && (
        <div className="px-3.5 pb-2 flex flex-col gap-1.5">
          {course.schedules.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px] flex-wrap">
              <span className={`text-[10px] py-0.5 px-2 rounded-md flex-shrink-0 ${schedTypeClass(s.type)}`}>
                {s.type || 'Time'}
              </span>
              <span className="text-slate-600">{s.time}</span>
              {s.room && <span className="ml-auto font-mono text-[10px] font-bold text-slate-500 whitespace-nowrap bg-white/60 px-1.5 py-0.5 rounded">{s.room}</span>}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between px-3.5 pt-2 pb-2.5 gap-2" style={{ borderTop: '1px solid rgba(203, 213, 225, 0.4)' }}>
        <span className="font-mono text-[10px] font-semibold text-slate-500">{course.credStr}</span>
        {isDropped && (
          <span className="inline-flex items-center gap-1 bg-rose-500 text-white rounded px-2 py-0.5 text-[10px] font-semibold">
            ⚠ Dropped {dropDetail}
          </span>
        )}
      </div>
    </div>
  );
}

function FeeRow({ item }) {
  const num = parseFloat(item.amt.replace(/,/g, ''));
  const isZero = !isNaN(num) && num === 0 && item.type === 'normal';
  const needsDivider = ['total', 'net-total', 'balance'].includes(item.type);

  const lblClass = {
    normal: isZero ? 'text-slate-300' : 'text-slate-600',
    total: 'font-semibold text-slate-900',
    'net-total': 'font-semibold text-slate-900',
    deduction: 'font-semibold text-slate-700',
    prev: 'font-semibold text-slate-700',
    paid: 'font-semibold text-slate-600',
    balance: 'font-semibold text-slate-900',
  }[item.type] || 'text-slate-600';

  const amtClass = {
    normal: isZero ? 'text-slate-300' : 'text-slate-700',
    total: 'font-bold text-blue-600 text-[13px]',
    'net-total': 'font-bold text-cyan-600 text-[13px]',
    deduction: 'font-semibold text-slate-700',
    prev: 'font-semibold text-slate-700',
    paid: 'font-semibold text-slate-600',
    balance: `font-bold text-[13px] ${num > 0 ? 'text-rose-600' : 'text-cyan-600'}`,
  }[item.type] || 'text-slate-700';

  return (
    <>
      {needsDivider && <div className="h-px bg-slate-200 my-1" />}
      <div className="flex items-center justify-between px-3.5 py-2 gap-2 hover:bg-slate-50/50 transition-colors">
        <span className={`text-[12px] ${lblClass}`}>{item.label}</span>
        <span className={`font-mono text-[12px] whitespace-nowrap ${amtClass}`}>{item.amt}</span>
      </div>
    </>
  );
}

function RegistrationView({ semOptions, printHref, creditItems, courses, fees, onSemChange }) {
  const [showRoutine, setShowRoutine] = useState(false);
  const routineCourses = buildRoutineCourses(courses);

  return (
    <div className="text-[13px] text-slate-800" style={{ boxSizing: 'border-box' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 pb-4" style={{ borderBottom: '1px solid #e2e8f0' }}>
        <h2 className="text-[18px] font-bold text-slate-900 tracking-tight m-0">
          Course <span style={{ background: 'linear-gradient(135deg, #0284c7, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Registration</span>
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {semOptions.length > 0 && (
            <select
              className="text-[12px] font-semibold text-slate-700 border border-slate-300 rounded-lg px-3 py-2 bg-white cursor-pointer outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
              onChange={(e) => onSemChange(e.target.value)}
              defaultValue={semOptions.find((o) => o.selected)?.val || ''}
            >
              {semOptions.map((o) => (
                <option key={o.val} value={o.val}>{o.text}</option>
              ))}
            </select>
          )}
          {routineCourses.length > 0 && (
            <button
              onClick={() => setShowRoutine(true)}
              style={{ background: 'linear-gradient(135deg, #0284c7, #06b6d4)', color: '#ffffff', border: 'none' }}
              className="text-[12px] font-semibold rounded-lg px-4 py-2 transition-all shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer"
            >
              <FiCalendar size={14} strokeWidth="2.5" />
              Weekly Routine
            </button>
          )}
          {printHref && (
            <a 
              href={printHref} 
              style={{ background: '#2563eb', color: '#ffffff', borderColor: '#1d4ed8' }}
              className="text-[12px] font-semibold rounded-lg px-4 py-2 transition-all no-underline shadow-sm hover:shadow border flex items-center gap-1.5"
            >
              <FiPrinter size={14} strokeWidth="2.5" />
              Print
            </a>
          )}
        </div>
      </div>

      {/* Credit chips */}
      {creditItems.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {creditItems.map(({ key, val }) => {
            const active = parseFloat(val) > 0;
            return (
              <span 
                key={key} 
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-semibold border transition-all ${
                  active ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}
              >
                <span className="font-bold text-[12px]">{val}</span>{key}
              </span>
            );
          })}
        </div>
      )}

      {/* Body: courses + fee panel */}
      <div className="grid gap-4" style={{ gridTemplateColumns: fees.length ? '1fr 270px' : '1fr' }}>
        <div className="flex flex-col gap-2.5">
          {courses.length > 0
            ? courses.map((c, i) => <CourseCard key={i} course={c} />)
            : <p className="text-slate-400 text-[13px] italic">No registered courses.</p>
          }
        </div>

        {fees.length > 0 && (
          <div 
            className="border rounded-lg overflow-hidden shadow-md" 
            style={{ 
              position: 'sticky', 
              top: 16, 
              alignSelf: 'start',
              backgroundColor: '#f8fafc',
              borderColor: '#cbd5e1',
              borderWidth: '1px'
            }}
          >
            <div 
              className="px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider bg-gradient-to-r from-blue-600 to-blue-700 text-gray-600"
              style={{ borderBottom: '1px solid #cbd5e1' }}
            >
              💰 Fees
            </div>
            <div className="py-1">
              {fees.map((item, i) => <FeeRow key={i} item={item} />)}
            </div>
          </div>
        )}
      </div>

      {/* Routine Modal */}
      {showRoutine && routineCourses.length > 0 && (
        <RegistrationRoutineModal
          courses={routineCourses}
          onClose={() => setShowRoutine(false)}
        />
      )}
    </div>
  );
}


(function mount() {
  if (window.__aiubRegMounted) return;

  chrome.storage.sync.get({ extensionEnabled: true, featureToggles: {} }, (r) => {
    if (!r.extensionEnabled || r.featureToggles?.['registration'] === false) return;

    function init() {
      const panel =
        document.querySelector('#main-content .margin5 .panel.panel-default') ||
        document.querySelector('#main-content .panel.panel-default');
      if (!panel) { setTimeout(init, 300); return; }

      const hasCourses = document.querySelector('.table-details');
      const hasFees = document.querySelector('#divAssesment');
      if (!hasCourses && !hasFees) { setTimeout(init, 400); return; }

      if (window.__aiubRegMounted) return;
      window.__aiubRegMounted = true;

      const origSelect = panel.querySelector('#SemesterDropDown');
      const semOptions = origSelect
        ? [...origSelect.querySelectorAll('option')].map((o) => ({
            val: o.value, text: o.textContent.trim(), selected: o.selected,
          }))
        : [];

      const printBtn = document.querySelector('a[href*="Registration/Print"]') || 
                       Array.from(document.querySelectorAll('a')).find(a => a.textContent.trim().toLowerCase() === 'print');
      
      const printHref = printBtn ? printBtn.getAttribute('href') : null;

      const creditTbl = panel.querySelector('.panel-body table');
      const creditItems = creditTbl ? parseCreditSummary(creditTbl) : [];

      const courseTbl = panel.querySelector('.table-details');
      const courses = courseTbl ? parseCourses(courseTbl) : [];

      const divAssesment = panel.querySelector('#divAssesment');
      const fees = divAssesment ? parseFees(divAssesment) : [];

      panel.style.cssText = 'border:none!important;box-shadow:none!important;background:transparent!important';
      const heading = panel.querySelector('.panel-heading');
      if (heading) heading.style.display = 'none';

      const panelBody = panel.querySelector('.panel-body');
      if (!panelBody) return;
      panelBody.style.cssText = 'padding:8px 0 0!important;background:transparent!important';
      panelBody.innerHTML = '';

      const root = document.createElement('div');
      panelBody.appendChild(root);
      createRoot(root).render(
        <RegistrationView
          semOptions={semOptions}
          printHref={printHref}
          creditItems={creditItems}
          courses={courses}
          fees={fees}
          onSemChange={(val) => { if (val) window.location.href = val; }}
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
