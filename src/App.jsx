import { useEffect, useMemo, useState } from 'react';
import { 
  FiSettings, FiStar, FiLock, 
  FiFilter, FiBell, FiUser, FiBarChart2, 
  FiCheckCircle, FiGlobe, FiGithub, FiLinkedin,
  FiCalendar, FiUnlock, FiRefreshCw, FiDollarSign, FiClock, FiKey, FiLayout
} from 'react-icons/fi';
import { FaPuzzlePiece } from 'react-icons/fa';

const features = [
  { text: 'Auto Captcha Calculation during login', icon: FiLock },
  { text: 'Advanced Offered Course Filter & Clash Detection', icon: FiFilter },
  { text: 'Routine Generation & Weekly Schedule Visualizer', icon: FiCalendar },
  { text: 'Show Locked / Unlocked Courses (CSE only)', icon: FiUnlock },
  { text: 'Live AIUB Notices inside your portal', icon: FiBell },
  { text: 'Registration & Fee Insights Cleaner Cards', icon: FiUser },
  { text: 'Redesigned Grades & Course Results Dashboard', icon: FiBarChart2 },
  { text: 'Financials Parsing & Online Payment History', icon: FiDollarSign },
  { text: 'Drop Application Refund Status Panel', icon: FiRefreshCw },
  { text: 'Premium Redesigned Change Password Form', icon: FiKey },
  { text: 'Exam Routine Countdown Timers', icon: FiClock },
  { text: 'Shared UI (Sidebar, Navbar, Profile Widget)', icon: FiLayout },
];

function getChromeApi() {
  if (typeof globalThis === 'undefined') return null;
  return globalThis.chrome ?? null;
}

function storageGetEnabled(api) {
  return new Promise((resolve) => {
    try {
      api.storage.sync.get({ extensionEnabled: true }, (result) => {
        resolve(Boolean(result?.extensionEnabled ?? true));
      });
    } catch {
      resolve(true);
    }
  });
}

function queryCurrentTab(api) {
  return new Promise((resolve) => {
    try {
      api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs?.[0] ?? null);
      });
    } catch {
      resolve(null);
    }
  });
}

function setEnabled(api, enabled) {
  return new Promise((resolve) => {
    try {
      api.storage.sync.set({ extensionEnabled: enabled }, () => resolve());
    } catch {
      resolve();
    }
  });
}

function reloadTab(api, tabId) {
  if (!tabId) return;
  try {
    api.tabs.reload(tabId);
  } catch {
    // no-op
  }
}

function App() {
  const chromeApi = useMemo(getChromeApi, []);
  const [enabled, setEnabledState] = useState(true);
  const [currentTab, setCurrentTab] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function initPopup() {
      if (!chromeApi) {
        setReady(true);
        return;
      }

      const [enabledState, tab] = await Promise.all([
        storageGetEnabled(chromeApi),
        queryCurrentTab(chromeApi),
      ]);

      setEnabledState(enabledState);
      setCurrentTab(tab);
      setReady(true);
    }

    initPopup();
  }, [chromeApi]);

  const handleToggle = async () => {
    if (!chromeApi) return;
    const next = !enabled;
    setEnabledState(next);
    await setEnabled(chromeApi, next);
    reloadTab(chromeApi, currentTab?.id);
  };

  const handleOpenSettings = () => {
    if (chromeApi && chromeApi.runtime.openOptionsPage) {
      chromeApi.runtime.openOptionsPage();
    } else {
      window.open('/options.html', '_blank');
    }
  };

  return (
    <div className="w-[360px] h-[550px] flex flex-col bg-slate-50 font-sans text-slate-800 shadow-xl overflow-hidden rounded-md border border-slate-200">
      
      {/* Top Fixed Section */}
      <div className="flex-shrink-0 bg-white z-10 shadow-sm relative">
        <header className="flex items-center justify-between bg-gradient-to-r from-[#003B95] to-[#1E67DF] p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm p-1">
              <img src="/logo/icon128.png" alt="AIUB Portal+" className="h-full w-full object-contain rounded-full" />
            </div>
            <div>
              <h1 className="text-[17px] font-bold leading-tight tracking-wide">AIUB Portal+</h1>
              <p className="text-[12px] text-white/90">Portal Enhancement Suite</p>
            </div>
          </div>
          <button 
            onClick={handleOpenSettings}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 transition-colors shadow-sm"
            title="Settings Dashboard"
          >
            <FiSettings className="h-5 w-5" />
          </button>
        </header>

        {/* Extension Toggle Card */}
        <div className="p-3 bg-white border-b border-slate-100">
          <section className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <FaPuzzlePiece className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-slate-800 leading-tight">Extension</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`h-2 w-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <p className={`text-[12px] font-semibold ${enabled ? 'text-green-600' : 'text-red-500'}`}>
                    {enabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggle}
              disabled={!chromeApi}
              aria-label="Enable or disable extension"
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? 'bg-blue-600' : 'bg-slate-300'} ${chromeApi ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </section>
        </div>
      </div>

      {/* Scrollable Middle Section */}
      <main className="flex-1 overflow-y-auto px-4 py-3">
        <section>
          <div className="flex items-center gap-2 mb-3 pl-1">
            <FiStar className="h-4 w-4 text-blue-600 fill-blue-600" />
            <h2 className="text-[12px] font-bold uppercase tracking-wider text-blue-700">Features</h2>
          </div>
          
          <ul className="space-y-0 border border-slate-100 bg-white rounded-xl shadow-sm p-1">
            {features.map((item, index) => (
              <li key={index} className="flex items-center justify-between py-2.5 px-2 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors rounded-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                    <item.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[12px] font-medium text-slate-700 leading-tight pr-2">
                    {item.text}
                  </span>
                </div>
                <FiCheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              </li>
            ))}
          </ul>
        </section>
      </main>

      {/* Fixed Bottom Section */}
      <footer className="flex-shrink-0 bg-white border-t border-slate-200 p-3 z-10">
        <section className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 p-2.5 shadow-sm">
          <div>
            <p className="text-[11px] text-slate-500 leading-tight">Developed by</p>
            <a href="https://rijoan.com" target="_blank" rel="noreferrer" className="block text-[13px] font-bold text-blue-700 leading-tight mt-0.5 hover:underline decoration-blue-700 decoration-2 underline-offset-2">Md Rijoan Maruf</a>
          </div>
          
          <div className="flex items-center gap-2">
            <a href="https://rijoan.com" target="_blank" rel="noreferrer" className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors shadow-sm">
              <FiGlobe className="h-4 w-4" />
            </a>
            <a href="https://github.com/mdrijoanmaruf" target="_blank" rel="noreferrer" className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm">
              <FiGithub className="h-4 w-4" />
            </a>
            <a href="https://www.linkedin.com/in/mdrijoanmaruf/" target="_blank" rel="noreferrer" className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-blue-700 hover:bg-blue-50 transition-colors shadow-sm">
              <FiLinkedin className="h-4 w-4" />
            </a>
          </div>
        </section>
      </footer>

    </div>
  );
}

export default App;

