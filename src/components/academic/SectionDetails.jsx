import React, { useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { FiCalendar, FiFolder, FiBell, FiMail, FiMapPin, FiClock, FiFileText } from 'react-icons/fi';
import '../../content.css';function parseSectionData() {
  const root = document.querySelector('#main-content');
  if (!root) return null;
  const titleEl = root.querySelector('h5 label');
  const courseTitle = titleEl ? titleEl.textContent.trim() : 'Course Details';

  const imgEl = root.querySelector('.col-md-3 img.img-rounded');
  const imgUrl = imgEl ? (imgEl.getAttribute('src') || imgEl.getAttribute('data-src')) : '';
  
  const facultyLabels = root.querySelectorAll('.col-md-9 label');
  const facultyName = facultyLabels[0] ? facultyLabels[0].textContent.trim() : '';
  const facultyEmail = facultyLabels[1] ? facultyLabels[1].textContent.trim() : '';
  const facultyRoom = facultyLabels[2] ? facultyLabels[2].textContent.trim() : '';

  const classTimes = [];
  const timesTable = root.querySelectorAll('.row > .col-md-6')[1]?.querySelector('table');
  if (timesTable) {
    timesTable.querySelectorAll('tr').forEach((tr, idx) => {
      if (idx === 0) return;
      const tds = tr.querySelectorAll('td');
      if (tds.length >= 3) {
        classTimes.push({
          time: tds[0].textContent.trim(),
          type: tds[1].textContent.trim(),
          room: tds[2].textContent.trim()
        });
      }
    });
  }

  const notes = [];
  const notesTab = root.querySelector('#notesTab');
  if (notesTab) {
    notesTab.querySelectorAll('table tr').forEach((tr, idx) => {
      if (idx === 0) return;
      const tds = tr.querySelectorAll('td');
      if (tds.length >= 4) {
        const a = tds[1].querySelector('a');
        if (a) {
          notes.push({
            name: a.textContent.trim(),
            href: a.getAttribute('href'),
            date: tds[2].textContent.trim(),
            size: tds[3].textContent.trim()
          });
        }
      }
    });
  }

  const notices = [];
  const noticesTab = root.querySelector('#noticesTab');
  if (noticesTab) {
    noticesTab.querySelectorAll('tr.notice').forEach((tr) => {
      const subject = tr.getAttribute('data-subject') || tr.querySelector('td')?.textContent.trim() || 'Notice';
      const details = tr.getAttribute('data-description') || '';
      const date = tr.querySelectorAll('td')[1]?.textContent.trim() || '';
      notices.push({ subject, details, date });
    });
  }

  const scheduleEvents = [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const skeletonTr = root.querySelector('.fc-content-skeleton > table > tbody > tr');
  if (skeletonTr) {
    const tds = skeletonTr.querySelectorAll('td');
    for (let i = 1; i < tds.length; i++) {
      const dayName = days[i - 1];
      if (!dayName) continue;
      
      const events = tds[i].querySelectorAll('a.fc-time-grid-event');
      events.forEach(ev => {
        const titleEl = ev.querySelector('.fc-title');
        const timeEl = ev.querySelector('.fc-time');
        const title = titleEl ? titleEl.textContent.trim() : '';
        const timeStr = timeEl ? (timeEl.getAttribute('data-full') || timeEl.textContent.trim()) : '';
        
        const bgColor = ev.style.backgroundColor || '';
        let type = 'class';
        let colorClass = 'bg-blue-100 border-blue-200 text-blue-700';
        
        if (bgColor === 'blue' || title.toLowerCase().includes('consulting')) {
          type = 'consulting';
          colorClass = 'bg-emerald-100 border-emerald-200 text-emerald-700';
        } else if (bgColor === 'purple' || title.toLowerCase().includes('administritive') || title.toLowerCase().includes('administrative')) {
          type = 'admin';
          colorClass = 'bg-purple-100 border-purple-200 text-purple-700';
        }

        let startHour = 8;
        let endHour = 9;
        
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (timeMatch) {
          let h1 = parseInt(timeMatch[1]);
          const m1 = parseInt(timeMatch[2]);
          const p1 = (timeMatch[3] || '').toUpperCase();
          
          let h2 = parseInt(timeMatch[4]);
          const m2 = parseInt(timeMatch[5]);
          const p2 = (timeMatch[6] || '').toUpperCase();
          
          if (p1 === 'PM' && h1 !== 12) h1 += 12;
          if (p1 === 'AM' && h1 === 12) h1 = 0;
          if (p2 === 'PM' && h2 !== 12) h2 += 12;
          if (p2 === 'AM' && h2 === 12) h2 = 0;
          
          if (!p1 && p2 === 'PM' && h1 < 8) h1 += 12; 
          
          startHour = h1 + (m1 / 60);
          endHour = h2 + (m2 / 60);
        }

        scheduleEvents.push({
          day: dayName,
          title,
          timeStr,
          type,
          colorClass,
          startHour,
          endHour
        });
      });
    }
  }

  return {
    courseTitle,
    facultyName,
    facultyEmail,
    facultyRoom,
    imgUrl,
    classTimes,
    notes,
    notices,
    scheduleEvents
  };
}

function UpcomingConsulting({ events }) {
  const [timeText, setTimeText] = useState('');

  React.useEffect(() => {
    const daysArr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const consultingEvents = events.filter(e => e.type === 'consulting');
    
    if (consultingEvents.length === 0) {
      setTimeText('No consulting hours');
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const currentDayIdx = now.getDay();
      const currentHour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

      let nextEvent = null;
      let daysToAdd = 0;

      for (let offset = 0; offset < 7; offset++) {
        const checkDayIdx = (currentDayIdx + offset) % 7;
        const checkDayName = daysArr[checkDayIdx];
        
        const dayEvents = consultingEvents
          .filter(e => e.day === checkDayName)
          .sort((a, b) => a.startHour - b.startHour);

        for (const ev of dayEvents) {
          if (offset === 0) {
            if (currentHour < ev.startHour) {
              nextEvent = ev;
              break;
            } else if (currentHour >= ev.startHour && currentHour < ev.endHour) {
              setTimeText('Happening right now!');
              return;
            }
          } else {
            nextEvent = ev;
            break;
          }
        }
        if (nextEvent) {
          daysToAdd = offset;
          break;
        }
      }

      if (nextEvent) {
        let hoursUntil;
        if (daysToAdd === 0) {
          hoursUntil = nextEvent.startHour - currentHour;
        } else {
          hoursUntil = (24 - currentHour) + (daysToAdd - 1) * 24 + nextEvent.startHour;
        }

        const totalSecs = Math.floor(hoursUntil * 3600);
        const d = Math.floor(totalSecs / 86400);
        const h = Math.floor((totalSecs % 86400) / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;

        const parts = [];
        if (d > 0) parts.push(`${d}d`);
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}m`);
        parts.push(`${s}s`);

        setTimeText(`in ${parts.join(' ')}`);
      } else {
        setTimeText('No upcoming consulting');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [events]);

  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50/50 text-emerald-800 px-3.5 py-2 rounded-xl border border-emerald-200/60 shadow-sm shadow-emerald-100/50">
      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-emerald-100">
        <FiClock className="text-[16px] text-emerald-600" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600/80 mb-0.5">Next Consulting</span>
        <span className="text-[13px] font-bold font-mono tracking-tight">{timeText || 'Calculating...'}</span>
      </div>
    </div>
  );
}

function OriginalTimetable() {
  const containerRef = React.useRef(null);
  
  React.useEffect(() => {
    // Find the original calendar or its container
    let originalCal = document.getElementById('calendar');
    if (!originalCal) {
      const fcContainer = document.querySelector('.fc-view-container');
      if (fcContainer) originalCal = fcContainer.parentElement;
    }
    
    if (originalCal && containerRef.current) {
      // Move it into our React container
      containerRef.current.appendChild(originalCal);
      originalCal.style.display = 'block';
      originalCal.style.visibility = 'visible';
      originalCal.style.opacity = '1';
    }
    
    return () => {
      // Put it back in the hidden original content container when unmounting
      const hiddenContainer = document.getElementById('aiub-original-content');
      if (originalCal && hiddenContainer) {
         hiddenContainer.appendChild(originalCal);
      }
    };
  }, []);

  return (
    <div className="mt-4 bg-white rounded-xl border shadow-sm p-4 overflow-x-auto">
      <div ref={containerRef} className="min-w-[700px]"></div>
    </div>
  );
}

function SectionDetailsView({ data }) {
  const [activeTab, setActiveTab] = useState('tsf');

  return (
    <div className="max-w-[1200px] mx-auto text-slate-800 space-y-6" style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,sans-serif" }}>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
        
        <div className="p-6 flex-1 flex items-center gap-5 border-b md:border-b-0 md:border-r border-slate-100 bg-gradient-to-br from-slate-50 to-white">
          {data.imgUrl && (
            <img src={data.imgUrl} alt="Faculty" className="w-[80px] h-[80px] rounded-full object-cover shadow border-2 border-white" />
          )}
          <div className="flex flex-col">
            <h2 className="text-[18px] font-bold text-slate-900 mb-1.5">{data.facultyName || 'Unknown Faculty'}</h2>
            <div className="flex items-center gap-3 text-[13px] text-slate-500 font-medium">
              {data.facultyEmail && <span className="flex items-center gap-1.5"><FiMail className="text-slate-400 text-[14px]" /> {data.facultyEmail}</span>}
              {data.facultyRoom && <span className="flex items-center gap-1.5"><FiMapPin className="text-slate-400 text-[14px]" /> {data.facultyRoom.replace('Faculty', '').trim()}</span>}
            </div>
            <div className="mt-2.5 text-[12px] font-bold text-blue-600 bg-blue-50/80 border border-blue-100 px-3 py-1 rounded-full self-start">
              {data.courseTitle}
            </div>
          </div>
        </div>

        <div className="p-6 md:w-[350px] flex flex-col justify-center bg-white">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Your Classes</h3>
          <div className="flex flex-col gap-2.5">
            {data.classTimes.map((ct, i) => (
              <div key={i} className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wide ${ct.type.toLowerCase().includes('lab') ? 'bg-cyan-100 text-cyan-700' : 'bg-blue-100 text-blue-700'}`}>
                    {ct.type}
                  </span>
                  <span className="font-semibold text-slate-700">{ct.time}</span>
                </div>
                <span className="font-mono font-bold text-slate-400 text-[11px]">{ct.room}</span>
              </div>
            ))}
            {data.classTimes.length === 0 && <span className="text-sm text-slate-400">No class times found.</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-6 mb-2">
        {[
          { id: 'tsf', label: 'Teacher Schedule', count: null, icon: FiCalendar },
          { id: 'notes', label: 'Files & Notes', count: data.notes.length, icon: FiFolder },
          { id: 'notices', label: 'Notices', count: data.notices.length, icon: FiBell }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button 
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-[12px] transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100 shadow-[0_2px_12px_-4px_rgba(59,130,246,0.2)]' 
                  : 'bg-gradient-to-r from-blue-50/50 to-blue-50/20 hover:from-blue-50/80 hover:to-blue-100/40 shadow-sm opacity-80 hover:opacity-100'
              }`}
              style={{ border: 'none', outline: 'none' }}
            >
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                  isActive ? 'bg-white text-blue-600' : 'bg-white/90 text-blue-500'
                }`}
                style={{ border: 'none' }}
              >
                <Icon className="text-[16px]" />
              </div>
              <span className={`text-[14px] font-bold ${isActive ? 'text-slate-800' : 'text-slate-600'}`}>
                {t.label} {t.count !== null && <span className={isActive ? 'text-blue-600' : 'text-slate-400 font-semibold'}>({t.count})</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
          {activeTab === 'tsf' && (
            <div className="overflow-x-auto pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-4 text-[12px] font-bold">
                  <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-400"></div> Regular Class</span>
                  <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-400"></div> Consulting</span>
                  <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-purple-400"></div> Admin</span>
                </div>
                <UpcomingConsulting events={data.scheduleEvents} />
              </div>
              <OriginalTimetable />
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">File Name</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[180px]">Upload Date</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[120px]">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {data.notes.map((n, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <a href={n.href} className="text-[13px] font-bold text-blue-600 hover:underline flex items-center gap-2" target="_blank" rel="noreferrer">
                          <FiFileText className="text-[15px] text-blue-500" /> {n.name}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-slate-500 font-medium">{n.date}</td>
                      <td className="px-4 py-3 text-[12px] text-slate-400 font-mono">{n.size}</td>
                    </tr>
                  ))}
                  {data.notes.length === 0 && (
                    <tr><td colSpan="3" className="px-4 py-8 text-center text-slate-400 text-[13px] italic">No notes uploaded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'notices' && (
            <div className="flex flex-col gap-3">
              {data.notices.map((n, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-[14px] font-bold text-slate-800">{n.subject}</h4>
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{n.date}</span>
                  </div>
                  <div className="text-[13px] text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: n.details || 'No details provided.' }} />
                </div>
              ))}
              {data.notices.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-[13px] italic border rounded-xl border-dashed">No notices posted.</div>
              )}
            </div>
          )}
        </div>
    </div>
  );
}

(function mount() {
  if (window.__aiubSectionDetailsMounted) return;

  chrome.storage.sync.get({ extensionEnabled: true }, (r) => {
    if (!r.extensionEnabled) return;

    function init() {
      const rootEl = document.querySelector('#main-content');
      if (!rootEl) { setTimeout(init, 300); return; }

      const tabs = document.querySelector('.tabbable');
      const calSkeleton = document.querySelector('.fc-content-skeleton');
      if (!tabs || !calSkeleton) { setTimeout(init, 300); return; }

      if (window.__aiubSectionDetailsMounted) return;
      window.__aiubSectionDetailsMounted = true;

      const initialData = parseSectionData();

      const originalContentContainer = document.createElement('div');
      originalContentContainer.id = 'aiub-original-content';
      originalContentContainer.style.position = 'absolute';
      originalContentContainer.style.opacity = '0';
      originalContentContainer.style.pointerEvents = 'none';
      originalContentContainer.style.zIndex = '-9999';
      originalContentContainer.style.width = '100%';
      
      while (rootEl.firstChild) {
        originalContentContainer.appendChild(rootEl.firstChild);
      }
      
      rootEl.style.cssText = 'padding-top: 15px; position: relative;';
      rootEl.appendChild(originalContentContainer);

      const reactRoot = document.createElement('div');
      rootEl.appendChild(reactRoot);

      function AppWrapper() {
        const [data, setData] = useState(initialData);

        React.useEffect(() => {
          const interval = setInterval(() => {
            const currentData = parseSectionData();
            if (currentData && currentData.scheduleEvents.length > 0) {
              setData(currentData);
              clearInterval(interval);
            }
          }, 500);

          setTimeout(() => clearInterval(interval), 10000);

          return () => clearInterval(interval);
        }, []);

        return <SectionDetailsView data={data} />;
      }

      createRoot(reactRoot).render(<AppWrapper />);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  });
})();
