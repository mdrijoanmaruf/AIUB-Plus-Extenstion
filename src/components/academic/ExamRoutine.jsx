import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../../content.css';

const GRAD = {
  blue: 'linear-gradient(135deg,#1e3a8a,#2563eb)',
  bodyBg: 'linear-gradient(135deg,#f8fbff 0%,#eff6ff 100%)',
};

function parseTimePart(str) {
  const m = str.trim().match(/(\d{1,2}):(\d{1,2})\s*(AM|PM)?/i);
  if (!m) return null;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  const period = (m[3] || '').toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return { h, m: min };
}

function getExamTimestamp(dateStr, timeStr) {
  if (!dateStr || !timeStr || dateStr.toLowerCase() === 'tba' || timeStr.toLowerCase() === 'tba') return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  
  const m = timeStr.trim().match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
  if (!m) return null;
  
  const t = parseTimePart(m[1]);
  if (!t) return null;
  
  d.setHours(t.h, t.m, 0, 0);
  return d.getTime();
}

function fmtDuration(ms) {
  const t = Math.floor(ms / 1000);
  const d = Math.floor(t / 86400), h = Math.floor((t % 86400) / 3600);
  const m = Math.floor((t % 3600) / 60), s = t % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function ExamTimer({ startTs }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!startTs) return null;

  if (now >= startTs) {
    return (
      <div style={{
        marginTop: '12px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '20px',
        background: '#f1f5f9',
        border: '1px solid #e2e8f0',
        alignSelf: 'flex-start'
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#94a3b8', display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.04em' }}>Exam started/ended</span>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: '12px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '20px',
      background: '#eff6ff',
      border: '1px solid #bfdbfe',
      alignSelf: 'flex-start'
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', display: 'inline-block', flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: '#1d4ed8', letterSpacing: '0.04em' }}>
        Starts in {fmtDuration(startTs - now)}
      </span>
    </div>
  );
}

function ExamCard({ exam }) {
  const isTba = exam.date.toLowerCase() === 'tba' || exam.room.toLowerCase() === 'tba';
  const startTs = getExamTimestamp(exam.date, exam.time);
  
  return (
    <div className="relative rounded-2xl border shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 p-5 bg-white flex flex-col"
         style={{ borderColor: '#e0e7ff', borderLeftColor: isTba ? '#f59e0b' : '#3b82f6', borderLeftWidth: '5px' }}>
         <div className="flex flex-col gap-3 flex-1">
             <h4 className="text-[15px] font-bold text-slate-900 leading-snug m-0">{exam.section}</h4>
             
             <div className="grid grid-cols-2 gap-3 mt-2">
                 <div className="flex items-start gap-2">
                     <span className="text-[16px] leading-tight">📅</span>
                     <div className="flex flex-col">
                         <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Date</span>
                         <span className={`text-[13px] font-semibold ${exam.date.toLowerCase() === 'tba' ? 'text-amber-600' : 'text-slate-800'}`}>{exam.date}</span>
                     </div>
                 </div>
                 
                 <div className="flex items-start gap-2">
                     <span className="text-[16px] leading-tight">⏰</span>
                     <div className="flex flex-col">
                         <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Time</span>
                         <span className={`text-[13px] font-semibold ${exam.time.toLowerCase() === 'tba' ? 'text-amber-600' : 'text-slate-800'}`}>{exam.time}</span>
                     </div>
                 </div>
                 
                 <div className="flex items-start gap-2">
                     <span className="text-[16px] leading-tight">🚪</span>
                     <div className="flex flex-col">
                         <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Room</span>
                         <span className={`text-[13px] font-semibold ${exam.room.toLowerCase() === 'tba' ? 'text-amber-600' : 'text-slate-800'}`}>{exam.room}</span>
                     </div>
                 </div>
                 
                 <div className="flex items-start gap-2">
                     <span className="text-[16px] leading-tight">🪑</span>
                     <div className="flex flex-col">
                         <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Seat</span>
                         <span className={`text-[13px] font-semibold ${exam.seat.toLowerCase() === 'tba' ? 'text-amber-600' : 'text-slate-800'}`}>
                             {exam.column !== 'TBA' && exam.column ? `${exam.column}, Seat ${exam.seat}` : exam.seat}
                         </span>
                     </div>
                 </div>
             </div>
         </div>
         <ExamTimer startTs={startTs} />
    </div>
  );
}

function ExamRoutineView({ title, disclaimer, exams }) {
  return (
    <div style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,sans-serif", maxWidth: '900px' }}>
      <div className="rounded-2xl overflow-hidden shadow-lg mb-6" style={{ border: 'none' }}>
        <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-4" style={{ background: GRAD.blue }}>
          <div className="flex items-center gap-3">
             <span className="text-[20px]">📝</span>
             <span className="text-[16px] font-bold text-white">{title}</span>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.25)' }}>
                {exams.length} Exams
             </span>
          </div>
        </div>
        
        <div className="px-5 py-6" style={{ background: GRAD.bodyBg }}>
            {exams.length === 0 ? (
                <div className="text-center py-8 text-slate-500 font-semibold">No exams scheduled.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {exams.map((exam, i) => <ExamCard key={i} exam={exam} />)}
                </div>
            )}
        </div>
      </div>
      
      {disclaimer && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm flex gap-3 items-start">
            <span className="text-[20px] leading-none">⚠️</span>
            <div className="text-[12px] text-rose-800 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: disclaimer }} />
        </div>
      )}
    </div>
  );
}

(function mount() {
  if (window.__aiubExamRoutineMounted) return;
  if (!window.location.href.includes('/Student/ExamRoutineSchedule')) return;

  chrome.storage.sync.get({ extensionEnabled: true }, (r) => {
    if (!r.extensionEnabled) return;

    function init() {
      const target = document.getElementById('main-content');
      if (!target) { setTimeout(init, 300); return; }
      
      const originalContainer = document.querySelector('.margin5');
      if (!originalContainer) { setTimeout(init, 300); return; }

      if (window.__aiubExamRoutineMounted) return;
      window.__aiubExamRoutineMounted = true;

      // Parse data
      const titleEl = document.querySelector('.margin5 h3');
      const title = titleEl ? titleEl.textContent.trim() : 'Exam Routine Viewer';

      const disclaimerEl = document.querySelector('.margin5 .alert-danger b');
      let disclaimer = disclaimerEl ? disclaimerEl.innerHTML.trim() : '';
      // Remove leading *** 
      disclaimer = disclaimer.replace(/^\*\*\*\s*/, '');

      const rows = Array.from(document.querySelectorAll('#routineBody tr'));
      const exams = rows.map(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length < 6) return null;
          return {
              section: cells[0].textContent.trim(),
              date: cells[1].textContent.trim(),
              time: cells[2].textContent.trim(),
              room: cells[3].textContent.trim(),
              column: cells[4].textContent.trim(),
              seat: cells[5].textContent.trim(),
          };
      }).filter(Boolean);

      // Hide original table
      originalContainer.style.display = 'none';

      // Create mount point
      const container = document.createElement('div');
      target.appendChild(container);
      
      createRoot(container).render(
        <ExamRoutineView title={title} disclaimer={disclaimer} exams={exams} />
      );
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  });
})();
