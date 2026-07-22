import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../../content.css';

const GRAD = {
  blue: 'linear-gradient(135deg,#1e3a8a,#2563eb)',
  bodyBg: 'linear-gradient(135deg,#f8fbff 0%,#eff6ff 100%)',
  navbar: 'linear-gradient(to right, #111827, #1e3a8a, #2f7be7)',
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

function ExamTimer({ startTs, isTba }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (isTba) {
    return <span className="italic text-slate-400 font-medium text-[13px]">TBA</span>;
  }

  if (!startTs) return null;

  if (now >= startTs) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#dcfce7]">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span className="text-[10px] font-bold text-[#16a34a] tracking-wider uppercase">Completed</span>
      </div>
    );
  }

  const ms = startTs - now;
  const t = Math.floor(ms / 1000);
  const d = Math.floor(t / 86400), h = Math.floor((t % 86400) / 3600);
  const m = Math.floor((t % 3600) / 60);
  
  const pad = (n) => n.toString().padStart(2, '0');
  
  const Unit = ({ val, unit, colorClass }) => (
    <span className="inline-flex items-baseline mx-[2px]">
      <span className="text-[#334669] font-medium text-[13px]">{val}</span>
      <span className={`${colorClass} font-medium ml-[1px] text-[12px]`}>{unit}</span>
    </span>
  );

  return (
    <div className="tracking-wide text-center leading-relaxed flex flex-wrap justify-center items-center gap-y-0.5 gap-x-1 max-w-[120px]">
      <Unit val={pad(d)} unit="d" colorClass="text-indigo-500" />
      <Unit val={pad(h)} unit="h" colorClass="text-sky-500" />
      <Unit val={pad(m)} unit="m" colorClass="text-emerald-500" />
    </div>
  );
}

function ExamRoutineView({ disclaimer, exams }) {
  return (
    <div style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,sans-serif", maxWidth: '1200px', margin: '0 auto' }}>
      <div className="rounded-md border border-[#e2e8f0] overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#eef2f9] border-b border-[#e2e8f0]">
                <th className="px-6 py-5 text-left text-[11px] font-bold text-[#334669] uppercase tracking-wider w-[28%]" style={{ borderRight: '1px solid #e2e8f0' }}>Section</th>
                <th className="px-3 py-5 text-center text-[11px] font-bold text-[#334669] uppercase tracking-wider w-[12%]" style={{ borderRight: '1px solid #e2e8f0' }}>Exam<br/>Date</th>
                <th className="px-3 py-5 text-center text-[11px] font-bold text-[#334669] uppercase tracking-wider w-[15%]" style={{ borderRight: '1px solid #e2e8f0' }}>Exam Time</th>
                <th className="px-3 py-5 text-center text-[11px] font-bold text-[#334669] uppercase tracking-wider w-[10%]" style={{ borderRight: '1px solid #e2e8f0' }}>Room<br/>No</th>
                <th className="px-3 py-5 text-center text-[11px] font-bold text-[#334669] uppercase tracking-wider w-[10%]" style={{ borderRight: '1px solid #e2e8f0' }}>Column<br/>No</th>
                <th className="px-3 py-5 text-center text-[11px] font-bold text-[#334669] uppercase tracking-wider w-[10%]" style={{ borderRight: '1px solid #e2e8f0' }}>Seat<br/>No</th>
                <th className="px-4 py-5 text-center text-[11px] font-bold text-[#334669] uppercase tracking-wider w-[15%]">Timer</th>
              </tr>
            </thead>
            <tbody>
              {exams.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-500 font-medium text-[14px]">No exams scheduled.</td>
                </tr>
              ) : (
                exams.map((exam, i) => {
                  const isTba = exam.date.toLowerCase() === 'tba' || exam.time.toLowerCase() === 'tba';
                  const startTs = getExamTimestamp(exam.date, exam.time);
                  
                  const renderCell = (val) => {
                    const isValTba = val && val.toLowerCase() === 'tba';
                    if (isValTba) return <span className="italic text-slate-400 font-medium">TBA</span>;
                    return <span className="text-[#475569] font-medium text-[13px]">{val}</span>;
                  };

                  return (
                    <tr key={i} className="border-b border-[#f1f5f9] last:border-0 hover:bg-slate-50 transition-colors even:bg-[#f0fdf4]">
                      <td className="px-6 py-6 align-middle" style={{ borderRight: '1px solid #e2e8f0' }}>
                        <div className="font-bold text-[13px] text-[#334669] leading-relaxed pr-4 uppercase">
                          {exam.section}
                        </div>
                      </td>
                      <td className="px-3 py-6 align-middle text-center" style={{ borderRight: '1px solid #e2e8f0' }}>
                        {renderCell(exam.date)}
                      </td>
                      <td className="px-3 py-6 align-middle text-center" style={{ borderRight: '1px solid #e2e8f0' }}>
                        {renderCell(exam.time)}
                      </td>
                      <td className="px-3 py-6 align-middle text-center" style={{ borderRight: '1px solid #e2e8f0' }}>
                        {renderCell(exam.room)}
                      </td>
                      <td className="px-3 py-6 align-middle text-center" style={{ borderRight: '1px solid #e2e8f0' }}>
                        {renderCell(exam.column)}
                      </td>
                      <td className="px-3 py-6 align-middle text-center" style={{ borderRight: '1px solid #e2e8f0' }}>
                        {renderCell(exam.seat)}
                      </td>
                      <td className="px-4 py-6 align-middle text-center">
                        <div className="flex justify-center w-full">
                          <ExamTimer startTs={startTs} isTba={isTba} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {disclaimer && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm flex gap-3 items-start mt-4">
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
