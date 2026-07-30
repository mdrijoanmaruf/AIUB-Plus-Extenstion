import { useEffect, useMemo, useState } from 'react'

const features = [
  'Settings Dashboard with feature toggles',
  'Auto CAPTCHA solver for fast login',
  'Advanced offered-course filters and clash detection',
  'Live AIUB notices from native bell',
  'Registration and fee insights panel',
  'Redesigned grades and financial dashboards',
]

function getChromeApi() {
  if (typeof globalThis === 'undefined') return null
  return globalThis.chrome ?? null
}

function storageGetEnabled(api) {
  return new Promise((resolve) => {
    try {
      api.storage.sync.get({ extensionEnabled: true }, (result) => {
        resolve(Boolean(result?.extensionEnabled ?? true))
      })
    } catch {
      resolve(true)
    }
  })
}

function queryCurrentTab(api) {
  return new Promise((resolve) => {
    try {
      api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs?.[0] ?? null)
      })
    } catch {
      resolve(null)
    }
  })
}

function setEnabled(api, enabled) {
  return new Promise((resolve) => {
    try {
      api.storage.sync.set({ extensionEnabled: enabled }, () => resolve())
    } catch {
      resolve()
    }
  })
}

function reloadTab(api, tabId) {
  if (!tabId) return
  try {
    api.tabs.reload(tabId)
  } catch {
    // no-op
  }
}

function App() {
  const chromeApi = useMemo(getChromeApi, [])
  const [enabled, setEnabledState] = useState(true)
  const [currentTab, setCurrentTab] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function initPopup() {
      if (!chromeApi) {
        setReady(true)
        return
      }

      const [enabledState, tab] = await Promise.all([
        storageGetEnabled(chromeApi),
        queryCurrentTab(chromeApi),
      ])

      setEnabledState(enabledState)
      setCurrentTab(tab)
      setReady(true)
    }

    initPopup()
  }, [chromeApi])

  const isOfferedPage = Boolean(
    currentTab?.url?.includes('portal.aiub.edu/Student/Section/Offered'),
  )

  const isStudentPortalPage = Boolean(
    currentTab?.url?.includes('portal.aiub.edu/Student'),
  )

  const status = useMemo(() => {
    if (!ready) {
      return {
        text: 'Loading extension status...',
        classes: 'bg-slate-100 text-slate-700 border-slate-200',
      }
    }

    if (!chromeApi) {
      return {
        text: 'Open as a Chrome extension popup to use toggle controls.',
        classes: 'bg-amber-50 text-amber-800 border-amber-200',
      }
    }

    if (!enabled) {
      return {
        text: 'Extension is disabled. Toggle ON to activate.',
        classes: 'bg-red-50 text-red-700 border-red-200',
      }
    }

    if (isOfferedPage) {
      return {
        text: 'Advanced filter tools are active on this page.',
        classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      }
    }

    if (isStudentPortalPage) {
      return {
        text: 'AIUB+ enhancements are active on this portal page.',
        classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      }
    }

    return {
      text: 'Go to AIUB Student Portal pages to use AIUB+ tools.',
      classes: 'bg-amber-50 text-amber-800 border-amber-200',
    }
  }, [chromeApi, enabled, isOfferedPage, isStudentPortalPage, ready])

  const handleToggle = async () => {
    if (!chromeApi) return
    const next = !enabled
    setEnabledState(next)
    await setEnabled(chromeApi, next)
    reloadTab(chromeApi, currentTab?.id)
  }

  const handleOpenSettings = () => {
    if (chromeApi && chromeApi.runtime.openOptionsPage) {
      chromeApi.runtime.openOptionsPage()
    } else {
      window.open('/options.html', '_blank')
    }
  }

  return (
    <div className="relative w-[340px] overflow-hidden rounded-2xl border border-aiub-blue/15 bg-gradient-to-br from-white via-aiub-sky to-[#dbeaff] font-display text-[#20314f] shadow-card">
      <div className="absolute -top-14 right-[-52px] h-40 w-40 rounded-full bg-aiub-blue/20 blur-2xl" />

      <header className="relative flex items-center justify-between gap-3 bg-gradient-to-r from-aiub-navy via-aiub-blue to-[#2f7be7] px-4 py-4 text-white">
        <div className="flex items-center gap-3">
          <img
            src="/logo/logo128.png"
            alt="AIUB Portal+"
            className="h-10 w-10 rounded-xl border border-white/40 object-contain"
          />
          <div>
            <h1 className="text-[15px] font-bold leading-tight tracking-wide">AIUB Portal+</h1>
            <p className="text-[11px] text-white/75">Portal Enhancement Suite</p>
          </div>
        </div>
        <button 
          onClick={handleOpenSettings}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          title="Settings Dashboard"
        >
          <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </button>
      </header>

      <main className="relative space-y-3 px-4 pb-3 pt-4">
        <section className="flex items-center justify-between rounded-xl border border-aiub-blue/15 bg-white/90 px-3 py-3 shadow-sm">
          <div>
            <p className="text-[13px] font-bold text-aiub-navy">Extension</p>
            <p className={`text-[11px] font-semibold ${enabled ? 'text-aiub-success' : 'text-aiub-danger'}`}>
              {enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggle}
            disabled={!chromeApi}
            aria-label="Enable or disable extension"
            className={`relative h-7 w-14 rounded-full border transition ${enabled ? 'border-aiub-blue bg-aiub-blue' : 'border-slate-300 bg-slate-300'} ${chromeApi ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
          >
            <span
              className={`absolute top-[2px] h-5 w-5 rounded-full bg-white shadow transition ${enabled ? 'left-[31px]' : 'left-[3px]'}`}
            />
          </button>
        </section>

        <section className={`rounded-lg border px-3 py-2 text-center text-[12px] font-semibold ${status.classes}`}>
          {status.text}
        </section>

        <section className="rounded-xl border border-aiub-blue/15 bg-white/90 px-3 py-3 shadow-sm">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Features</p>
          <ul className="space-y-1.5">
            {features.map((item) => (
              <li key={item} className="relative pl-3.5 text-[12px] leading-5 text-slate-700">
                <span className="absolute left-0 top-2 h-1.5 w-1.5 rounded-full bg-aiub-blue" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="px-4 pb-4 text-center text-[11px] text-slate-500">
        Developed by{' '}
        <a
          href="https://rijoan.com"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-aiub-blue hover:underline"
        >
          Md Rijoan Maruf
        </a>
      </footer>
    </div>
  )
}

export default App
