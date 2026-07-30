import React, { useEffect, useState } from 'react';
import { 
  FiShield, FiLayout, FiMaximize, 
  FiAward, FiFilter, FiFileText, FiDownload, 
  FiBook, FiBookOpen, FiCalendar, FiList, 
  FiBriefcase, FiPieChart, FiSettings, FiArrowLeft 
} from 'react-icons/fi';

const FEATURES = [
  {
    category: "General & Login",
    theme: {
      color: "blue",
      headerIcon: FiShield,
      ring: "ring-blue-100",
      bgHeader: "bg-blue-600",
      border: "border-blue-600",
      iconBg: "bg-blue-50",
      iconText: "text-blue-600",
      bgCard: "bg-gradient-to-br from-white to-blue-50/80",
    },
    items: [
      { id: "captchaSolver", name: "Captcha Auto-Solver", description: "Automatically solves the login CAPTCHA", icon: FiMaximize },
      { id: "generalUI", name: "Enhanced UI & Navigation", description: "Modern sidebar, navbar, and homepage improvements", icon: FiLayout }
    ]
  },
  {
    category: "Registration & Courses",
    theme: {
      color: "purple",
      headerIcon: FiAward,
      ring: "ring-purple-100",
      bgHeader: "bg-purple-500",
      border: "border-purple-500",
      iconBg: "bg-purple-50",
      iconText: "text-purple-600",
      bgCard: "bg-gradient-to-br from-white to-purple-50/80",
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
      color: "emerald",
      headerIcon: FiBook,
      ring: "ring-emerald-100",
      bgHeader: "bg-emerald-500",
      border: "border-emerald-500",
      iconBg: "bg-emerald-50",
      iconText: "text-emerald-600",
      bgCard: "bg-gradient-to-br from-white to-emerald-50/80",
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
      color: "orange",
      headerIcon: FiBriefcase,
      ring: "ring-orange-100",
      bgHeader: "bg-orange-500",
      border: "border-orange-500",
      iconBg: "bg-orange-50",
      iconText: "text-orange-500",
      bgCard: "bg-gradient-to-br from-white to-orange-50/80",
    },
    items: [
      { id: "financials", name: "Financial Dashboard", description: "Clearer balance summary and accounts view", icon: FiPieChart },
      { id: "paymentHistory", name: "Payment History", description: "Redesigned online payment history", icon: FiFileText },
      { id: "profile", name: "Profile & Settings", description: "Upgrades for Profile and Change Password pages", icon: FiSettings }
    ]
  }
];

export default function Options() {
  const [settings, setSettings] = useState({});
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.get(['featureToggles', 'extensionEnabled'], (result) => {
        setSettings(result.featureToggles || {});
        setMasterEnabled(result.extensionEnabled ?? true);
        setLoaded(true);
      });
    } else {
      // Fallback for dev mode
      const saved = localStorage.getItem('aiub_plus_features');
      if (saved) setSettings(JSON.parse(saved));
      setLoaded(true);
    }
  }, []);

  const handleToggle = (id) => {
    const current = settings[id] ?? true; // Default is true
    const newSettings = { ...settings, [id]: !current };
    
    setSettings(newSettings);
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ featureToggles: newSettings });
    } else {
      localStorage.setItem('aiub_plus_features', JSON.stringify(newSettings));
    }
  };

  const handleMasterToggle = () => {
    const newVal = !masterEnabled;
    setMasterEnabled(newVal);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ extensionEnabled: newVal });
    }
  };

  if (!loaded) {
    return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">Loading settings...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 font-sans text-slate-800 selection:bg-blue-200">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-[2rem] bg-white p-4 pl-6 pr-6 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-100">
              <img src="/logo/icon128.png" alt="AIUB+ Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">AIUB+ Features Dashboard</h1>
              <p className="text-[13px] text-slate-500">Customize which portal enhancements and UI upgrades are active.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 md:ml-auto border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
            <a 
              href="https://portal.aiub.edu" 
              className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 hover:border-blue-200"
            >
              <FiArrowLeft className="h-4 w-4" />
              Back to Portal
            </a>
            
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">Extension</span>
              <button
                onClick={handleMasterToggle}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${masterEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                role="switch"
                aria-checked={masterEnabled}
              >
                <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${masterEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {FEATURES.map((category) => (
            <div key={category.category} className={`rounded-3xl p-6 shadow-sm ring-1 transition-shadow hover:shadow-md ${category.theme.bgCard} ${category.theme.ring}`}>
              <div className="flex items-center gap-4 mb-6">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${category.theme.bgHeader} shadow-sm`}>
                  <category.theme.headerIcon className="h-6 w-6 text-white" />
                </div>
                <div className={`border-b-[3px] pb-1 pr-6 ${category.theme.border}`}>
                  <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">{category.category}</h2>
                </div>
              </div>
              <div className="space-y-3">
                {category.items.map((item) => {
                  const isEnabled = settings[item.id] ?? true;
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-4 rounded-[1.25rem] bg-white p-3 shadow-sm ring-1 ring-slate-100 transition-colors hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${category.theme.iconBg}`}>
                          <item.icon className={`h-5 w-5 ${category.theme.iconText}`} />
                        </div>
                        <div>
                          <h3 className="text-[14px] font-semibold text-slate-800">{item.name}</h3>
                          <p className="text-[12px] text-slate-500 leading-tight mt-0.5">{item.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggle(item.id)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                        role="switch"
                        aria-checked={isEnabled}
                      >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-8 text-center text-xs text-slate-400">
          <p>Settings are synced securely across your devices via Chrome Sync.</p>
        </footer>
      </div>
    </div>
  );
}
