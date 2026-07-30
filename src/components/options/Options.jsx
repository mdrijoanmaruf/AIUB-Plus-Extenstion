import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';

const FEATURES = [
  {
    category: "General & Login",
    items: [
      { id: "captchaSolver", name: "Captcha Auto-Solver", description: "Automatically solves the login CAPTCHA" },
      { id: "generalUI", name: "Enhanced UI & Navigation", description: "Modern sidebar, navbar, and homepage improvements" }
    ]
  },
  {
    category: "Registration & Courses",
    items: [
      { id: "offeredFilters", name: "Offered Courses Filter", description: "Advanced filtering and clash detection" },
      { id: "registration", name: "Registration Enhancements", description: "Improved Academic and Home Registration UI" },
      { id: "dropApplication", name: "Drop Application", description: "Redesigned drop application flow" }
    ]
  },
  {
    category: "Academic Records",
    items: [
      { id: "courseAndResults", name: "Course & Results", description: "Upgraded view for current courses and grades" },
      { id: "gradeReport", name: "Grade Reports", description: "Visual improvements for By Semester and By Curriculum grades" },
      { id: "examRoutine", name: "Exam Routine Builder", description: "Better schedule view with PNG download" },
      { id: "curriculum", name: "Curriculum View", description: "Prerequisite tracking and visual upgrades" }
    ]
  },
  {
    category: "Financial & Profile",
    items: [
      { id: "financials", name: "Financial Dashboard", description: "Clearer balance summary and accounts view" },
      { id: "paymentHistory", name: "Payment History", description: "Redesigned online payment history" },
      { id: "profile", name: "Profile & Settings", description: "Upgrades for Profile and Change Password pages" }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4 font-sans text-slate-800 selection:bg-blue-200">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-3xl bg-white/70 p-6 shadow-sm backdrop-blur-md ring-1 ring-slate-200/50">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl overflow-hidden bg-white shadow-md shadow-blue-500/10 ring-1 ring-slate-100">
              <img src="/logo/icon128.png" alt="AIUB+ Logo" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">AIUB+ Features Dashboard</h1>
              <p className="text-sm text-slate-500">Customize which portal enhancements and UI upgrades are active.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 md:ml-auto border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-4">
            <a 
              href="https://portal.aiub.edu" 
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Back to Portal
            </a>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">Extension</span>
              <button
                onClick={handleMasterToggle}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${masterEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                role="switch"
                aria-checked={masterEnabled}
              >
                <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${masterEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid gap-8 md:grid-cols-2">
          {FEATURES.map((category) => (
            <div key={category.category} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50 transition-shadow hover:shadow-md">
              <h2 className="mb-4 text-lg font-bold text-slate-800">{category.category}</h2>
              <div className="space-y-4">
                {category.items.map((item) => {
                  const isEnabled = settings[item.id] ?? true;
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 transition-colors hover:bg-slate-100/70">
                      <div>
                        <h3 className="font-semibold text-slate-800">{item.name}</h3>
                        <p className="text-xs text-slate-500">{item.description}</p>
                      </div>
                      <button
                        onClick={() => handleToggle(item.id)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${isEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
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

        <footer className="mt-12 text-center text-sm text-slate-500">
          <p>Settings are synced across your devices.</p>
        </footer>
      </div>
    </div>
  );
}
