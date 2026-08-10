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
      headerIcon: FiShield,
      ring: "ring-blue-100/50",
      bgHeader: "bg-gradient-to-tr from-blue-600 to-blue-400",
      border: "border-blue-500",
      iconBg: "bg-blue-100/50",
      iconText: "text-blue-600",
      bgCard: "bg-gradient-to-br from-blue-50/30 to-white",
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
      bgCard: "bg-gradient-to-br from-purple-50/30 to-white",
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
      bgCard: "bg-gradient-to-br from-emerald-50/30 to-white",
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
      bgCard: "bg-gradient-to-br from-orange-50/30 to-white",
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
    const current = settings[id] ?? true;
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
    return <div className="flex h-screen items-center justify-center bg-[#f8fafc] text-slate-500">Loading settings...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 font-sans text-slate-800">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-3xl bg-white p-5 pl-7 pr-7 shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-50 p-1 border border-slate-100">
              <img src="/logo/icon128.png" alt="AIUB+ Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">AIUB+ Features Dashboard</h1>
              <p className="text-[13px] text-slate-500 mt-0.5">Customize which portal enhancements and UI upgrades are active.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 md:ml-auto md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            <a 
              href="https://portal.aiub.edu" 
              className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
            >
              <FiArrowLeft className="h-4 w-4" />
              Back to Portal
            </a>
            
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-600">Master Switch</span>
              <button
                onClick={handleMasterToggle}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${masterEnabled ? 'bg-blue-500' : 'bg-slate-200'}`}
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
            <div key={category.category} className={`rounded-[2rem] p-6 shadow-sm ring-1 transition-shadow hover:shadow-md ${category.theme.bgCard} ${category.theme.ring}`}>
              <div className="flex items-center gap-4 mb-6">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${category.theme.bgHeader} shadow-sm`}>
                  <category.theme.headerIcon className="h-6 w-6 text-white" />
                </div>
                <div className={`border-b-2 pb-1 pr-6 ${category.theme.border} border-opacity-30`}>
                  <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">{category.category}</h2>
                </div>
              </div>
              
              <div className="space-y-3">
                {category.items.map((item) => {
                  const isEnabled = settings[item.id] ?? true;
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-white p-3 shadow-sm transition-colors hover:bg-white">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] ${category.theme.iconBg}`}>
                          <item.icon className={`h-[18px] w-[18px] ${category.theme.iconText}`} />
                        </div>
                        <div>
                          <h3 className="text-[14px] font-semibold text-slate-700">{item.name}</h3>
                          <p className="text-[12px] text-slate-500 leading-tight mt-0.5">{item.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggle(item.id)}
                        className={`relative inline-flex h-[22px] w-[40px] flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isEnabled ? 'bg-blue-500' : 'bg-slate-200'}`}
                        role="switch"
                        aria-checked={isEnabled}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isEnabled ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 rounded-[2rem] bg-gradient-to-r from-blue-50/50 to-white p-6 px-8 shadow-sm border border-blue-100/50">
          <div>
            <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">Experiencing issues or bugs?</h3>
            <p className="text-[13px] text-slate-500 mt-1">We're always looking to improve AIUB+. Let us know how we can help.</p>
          </div>
          <a 
            href="https://www.rijoan.com/contact" 
            target="_blank" 
            rel="noreferrer"
            className="flex-shrink-0 rounded-full bg-blue-600 px-6 py-2.5 text-[13px] font-semibold tracking-wide text-white transition hover:bg-blue-700 shadow-sm hover:shadow-md"
          >
            Contact Developer
          </a>
        </div>

        <footer className="pt-6 pb-8 text-center text-[13px] text-slate-400 font-medium">
          Settings are synced securely across your devices.
        </footer>
      </div>
    </div>
  );
}
