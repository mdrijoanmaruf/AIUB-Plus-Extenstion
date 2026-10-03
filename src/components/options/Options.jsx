import React, { useEffect, useState } from 'react';
import { 
  FiShield, FiLayout, FiMaximize, 
  FiAward, FiFilter, FiFileText, FiDownload, 
  FiBook, FiBookOpen, FiCalendar, FiList, 
  FiBriefcase, FiPieChart, FiSettings, FiArrowLeft, FiGithub, FiHeart
} from 'react-icons/fi';

const FEATURES = [
  {
    category: "General & Login",
    theme: {
      headerIcon: FiShield,
      ring: "ring-blue-100/50",
      bgHeader: "bg-gradient-to-tr from-blue-600 to-blue-400",
      border: "border-blue-500",
      iconBg: "bg-blue-100/50",
      iconText: "text-blue-600",
      bgCard: "bg-blue-50",
      ringStrong: "ring-blue-200",
      headBg: "bg-blue-100/70",
      divide: "divide-blue-100",
    },
    items: [
      { id: "captchaSolver", name: "Captcha Auto-Solver", description: "Automatically solves the login CAPTCHA", icon: FiMaximize },
      { id: "generalUI", name: "Enhanced UI & Navigation", description: "Modern sidebar, navbar, and homepage improvements", icon: FiLayout }
    ]
  },
  {
    category: "Registration & Courses",
    theme: {
      headerIcon: FiAward,
      ring: "ring-purple-100/50",
      bgHeader: "bg-gradient-to-tr from-purple-600 to-purple-400",
      border: "border-purple-500",
      iconBg: "bg-purple-100/50",
      iconText: "text-purple-600",
      bgCard: "bg-purple-50",
      ringStrong: "ring-purple-200",
      headBg: "bg-purple-100/70",
      divide: "divide-purple-100",
    },
    items: [
      { id: "offeredFilters", name: "Offered Courses Filter", description: "Advanced filtering and clash detection", icon: FiFilter },
      { id: "registration", name: "Registration Enhancements", description: "Improved Academic and Home Registration UI", icon: FiFileText },
      { id: "dropApplication", name: "Drop Application", description: "Redesigned drop application flow", icon: FiDownload }
    ]
  },
  {
    category: "Academic Records",
    theme: {
      headerIcon: FiBook,
      ring: "ring-emerald-100/50",
      bgHeader: "bg-gradient-to-tr from-emerald-600 to-emerald-400",
      border: "border-emerald-500",
      iconBg: "bg-emerald-100/50",
      iconText: "text-emerald-600",
      bgCard: "bg-emerald-50",
      ringStrong: "ring-emerald-200",
      headBg: "bg-emerald-100/70",
      divide: "divide-emerald-100",
    },
    items: [
      { id: "courseAndResults", name: "Course & Results", description: "Upgraded view for current courses and grades", icon: FiBookOpen },
      { id: "gradeReport", name: "Grade Reports", description: "Visual improvements for By Semester and By Curriculum grades", icon: FiFileText },
      { id: "examRoutine", name: "Exam Routine Builder", description: "Better schedule view with PNG download", icon: FiCalendar },
      { id: "curriculum", name: "Curriculum View", description: "Prerequisite tracking and visual upgrades", icon: FiList }
    ]
  },
  {
    category: "Financial & Profile",
    theme: {
      headerIcon: FiBriefcase,
      ring: "ring-orange-100/50",
      bgHeader: "bg-gradient-to-tr from-orange-500 to-orange-400",
      border: "border-orange-500",
      iconBg: "bg-orange-100/50",
      iconText: "text-orange-500",
      bgCard: "bg-orange-50",
      ringStrong: "ring-orange-200",
      headBg: "bg-orange-100/70",
      divide: "divide-orange-100",
    },
    items: [
      { id: "financials", name: "Financial Dashboard", description: "Clearer balance summary and accounts view", icon: FiPieChart },
      { id: "paymentHistory", name: "Payment History", description: "Redesigned online payment history", icon: FiFileText },
      { id: "profile", name: "Profile & Settings", description: "Upgrades for Profile and Change Password pages", icon: FiSettings }
    ]
  }
];

const ALL_IDS = FEATURES.flatMap((c) => c.items.map((i) => i.id));

export default function Options() {
  const [settings, setSettings] = useState({});
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.get(['featureToggles', 'extensionEnabled'], (result) => {
        const allOff = result.extensionEnabled === false;
        const toggles = allOff
          ? Object.fromEntries(ALL_IDS.map((id) => [id, false]))
          : (result.featureToggles || {});
        setSettings(toggles);
        setMasterEnabled(ALL_IDS.some((id) => toggles[id] ?? true));
        setLoaded(true);
      });
    } else {
      // Fallback for dev mode
      const saved = localStorage.getItem('aiub_plus_features');
      if (saved) {
        const toggles = JSON.parse(saved);
        setSettings(toggles);
        setMasterEnabled(ALL_IDS.some((id) => toggles[id] ?? true));
      }
      setLoaded(true);
    }
  }, []);

  // Persist toggles; master is ON whenever at least one feature is ON
  const persist = (newSettings) => {
    const anyOn = ALL_IDS.some((id) => newSettings[id] ?? true);
    setSettings(newSettings);
    setMasterEnabled(anyOn);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ featureToggles: newSettings, extensionEnabled: anyOn });
    } else {
      localStorage.setItem('aiub_plus_features', JSON.stringify(newSettings));
    }
  };

  const handleToggle = (id) => {
    const current = settings[id] ?? true;
    persist({ ...settings, [id]: !current });
  };

  const handleMasterToggle = () => {
    const newVal = !masterEnabled;
    persist(Object.fromEntries(ALL_IDS.map((id) => [id, newVal])));
  };

  if (!loaded) {
    return <div className="flex h-screen items-center justify-center bg-slate-100 text-slate-500">Loading settings...</div>;
  }

  const Toggle = ({ checked, onChange, size = 'md' }) => {
    const sm = size === 'sm';
    return (
      <button
        onClick={onChange}
        role="switch"
        aria-checked={checked}
        className={`relative inline-flex flex-shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 ease-in-out hover:brightness-95 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 ${sm ? 'h-5 w-9' : 'h-6 w-11'} ${checked ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-slate-300'}`}
      >
        <span className={`inline-block transform rounded-full bg-white shadow transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${sm ? 'h-4 w-4' : 'h-5 w-5'} ${checked ? (sm ? 'translate-x-[18px]' : 'translate-x-[22px]') : 'translate-x-0.5'}`} />
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200/60 font-sans text-slate-800">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <img src="/logo/icon128.png" alt="AIUB+ Logo" className="h-9 w-9 rounded-lg object-contain" />
            <div className="leading-tight">
              <h1 className="text-[15px] font-bold tracking-tight text-slate-900">
                AIUB<span className="text-emerald-500">+</span> Settings
              </h1>
              <p className="hidden text-[11.5px] text-slate-500 sm:block">Choose which portal enhancements are active</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="https://github.com/mdrijoanmaruf/AIUB-Plus-Extenstion"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <FiGithub className="h-[18px] w-[18px]" />
            </a>
            <a
              href="https://portal.aiub.edu"
              className="flex items-center gap-2 rounded-full px-3 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-emerald-600"
            >
              <FiArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Portal</span>
            </a>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-2.5">
              <span className={`text-[12.5px] font-semibold ${masterEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                {masterEnabled ? 'Turn off all' : 'Turn on all'}
              </span>
              <Toggle checked={masterEnabled} onChange={handleMasterToggle} />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">

        {/* Open Source Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-slate-900 p-7 md:p-9 shadow-xl ring-1 ring-slate-800">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-emerald-300 ring-1 ring-emerald-400/30">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                100% Open Source
              </span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-white md:text-3xl">
                Open code. Runs locally.
                <span className="block text-emerald-400">Zero external servers.</span>
              </h2>
              <p className="mt-3 text-[13.5px] leading-relaxed text-slate-300">
                AIUB+ runs entirely inside your browser. Your data never leaves your device, and every line of code is public for you to read, audit, and improve.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['No tracking', 'No backend', 'Local only', 'Free forever'].map((t) => (
                  <span key={t} className="rounded-md bg-white/5 px-2.5 py-1 text-[11.5px] font-medium text-slate-300 ring-1 ring-white/10">{t}</span>
                ))}
              </div>
            </div>

            <div className="flex flex-shrink-0 flex-col gap-3 sm:flex-row md:flex-col">
              <a
                href="https://github.com/mdrijoanmaruf/AIUB-Plus-Extenstion"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-[13.5px] font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-50"
              >
                <FiGithub className="h-4 w-4" />
                View on GitHub
              </a>
              <a
                href="https://github.com/mdrijoanmaruf/AIUB-Plus-Extenstion/issues"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-[13.5px] font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-400"
              >
                <FiHeart className="h-4 w-4" />
                Report an Issue
              </a>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <div className="grid gap-5 md:grid-cols-2">
          {FEATURES.map((category) => (
            <section key={category.category} className={`overflow-hidden rounded-2xl shadow-sm ring-1 transition-shadow hover:shadow-md ${category.theme.bgCard} ${category.theme.ringStrong}`}>
              <div className={`flex items-center gap-3 px-5 py-4 ${category.theme.headBg}`}>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${category.theme.bgHeader} shadow-sm`}>
                  <category.theme.headerIcon className="h-[18px] w-[18px] text-white" />
                </div>
                <h2 className="text-[15px] font-bold tracking-tight text-slate-800">{category.category}</h2>
              </div>

              <div className={`divide-y ${category.theme.divide}`}>
                {category.items.map((item) => {
                  const isEnabled = settings[item.id] ?? true;
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors duration-200 hover:bg-white/60">
                      <div className="flex items-center gap-3.5">
                        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${category.theme.iconBg}`}>
                          <item.icon className={`h-4 w-4 ${category.theme.iconText}`} />
                        </div>
                        <div>
                          <h3 className="text-[13.5px] font-semibold text-slate-800">{item.name}</h3>
                          <p className="mt-0.5 text-[12px] leading-snug text-slate-500">{item.description}</p>
                        </div>
                      </div>
                      <Toggle size="sm" checked={isEnabled} onChange={() => handleToggle(item.id)} />
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Support */}
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-200 md:flex-row">
          <div>
            <h3 className="text-[14px] font-bold text-slate-800">Experiencing issues or bugs?</h3>
            <p className="mt-0.5 text-[12.5px] text-slate-500">We're always looking to improve AIUB+. Let us know how we can help.</p>
          </div>
          <a
            href="https://www.rijoan.com/contact"
            target="_blank"
            rel="noreferrer"
            className="flex-shrink-0 rounded-full bg-slate-900 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-700"
          >
            Contact Developer
          </a>
        </div>

        <footer className="pb-6 text-center text-[12.5px] font-medium text-slate-400">
          Settings are synced securely across your devices.
        </footer>
      </div>
    </div>
  );
}
