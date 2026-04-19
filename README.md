# AIUB Portal+ 🚀

> A comprehensive Chrome extension that supercharges the official AIUB Student Portal with a modern UI, intelligent scheduling, grade analytics, and financial insights.

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Manifest](https://img.shields.io/badge/Manifest-V3-4285F4?style=flat-square&logo=googlechrome)](https://developer.chrome.com/docs/extensions/mv3/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**Repository:** [github.com/mdrijoanmaruf/AIUB-Plus-Extenstion](https://github.com/mdrijoanmaruf/AIUB-Plus-Extenstion)

---

## 📋 Table of Contents

- [What This Extension Does](#-what-this-extension-does)
- [Tech Stack](#-tech-stack)
- [How It Works](#-how-it-works)
- [Features by Portal Page](#-features-by-portal-page)
- [Project Structure](#-project-structure)
- [Setup and Installation](#-setup-and-installation)
- [NPM Scripts](#-npm-scripts)
- [Configuration and Data Files](#-configuration-and-data-files)
- [Permissions and Privacy](#-permissions-and-privacy)
- [Troubleshooting](#-troubleshooting)
- [Known Limitations](#-known-limitations)

---

## 🌟 What This Extension Does

AIUB Portal+ adds page-specific enhancements on [https://portal.aiub.edu](https://portal.aiub.edu) for:

| Page | Enhancement |
|------|-------------|
| **Offered Courses** | Search, filters, clash checking, section selection, routine generation & PNG export |
| **Registration** | Cleaner cards, semester switch, credit summary, fee side panel |
| **Course Results** | Modernized display with expandable section cards |
| **Grade Reports** | Curriculum-wise and semester-wise visualization with GPA parsing |
| **Financials** | Debit-credit-balance parsing with summary cards |
| **Curriculum** | Prerequisite enrichment via bundled CSE catalog |
| **Drop Application** | Improved readability and refund status panel |
| **Shared UI** | Sidebar, navbar, and profile widget improvements |

> Pure client-side — no backend API calls. All data is parsed from the existing portal DOM in-browser.

---

## 🛠 Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| **React** | 19 | UI rendering |
| **React DOM** | 19 | DOM management |
| **Vite** | 8 | Build tooling |
| **CRXJS Vite Plugin** | — | Chrome Extension MV3 build flow |
| **Tailwind CSS** | 3 | Styling |
| **PostCSS + Autoprefixer** | — | CSS processing |
| **Recharts** | — | Grade visualizations |
| **html2canvas** | — | Routine PNG export |
| **ESLint** | 9 | Code linting |

**Primary config files:** `manifest.json` · `vite.config.js` · `tailwind.config.js` · `postcss.config.js` · `eslint.config.js`

---

## ⚙️ How It Works

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────────────┐
│  Popup UI   │────▶│  contentBridge   │────▶│  Content Scripts      │
│ (App.jsx)   │     │  (localStorage)  │     │  (self-guarded)       │
└─────────────┘     └──────────────────┘     └───────────────────────┘
chrome.storage.sync   mirrors enabled state      parse & enhance DOM
```

**Step 1 — Popup controls state**
Popup UI (`src/App.jsx`) reads and writes `extensionEnabled` via `chrome.storage.sync`.

**Step 2 — Shared bridge mirrors state**
`src/components/shared/contentBridge.jsx` listens for storage changes and mirrors enabled state into `localStorage.__aiubPortalEnabled`.

**Step 3 — Content scripts self-guard**
Each content entry uses mount guards and enabled-state checks to avoid duplicate injections and to skip work when disabled.

**Step 4 — Page-specific modules parse the DOM**
Feature modules parse portal HTML tables/panels, then replace or augment them with React-rendered views and styled cards.

---

## 📄 Features by Portal Page

### 📅 Offered Courses
**Entry:** `src/components/entries/offeredFilters.content.jsx`  
**Component:** `src/components/content/OfferedCoursesFilter.jsx`

- Parses FooTable courses and nested time slots
- Filters by search, status, day, and start-time range
- Detects schedule overlaps before selection
- Prevents duplicate course title selection
- Shows linked/alternative sections via time signature matching
- Generates weekly routine modal with color-coded course blocks
- Exports routine as PNG image via `html2canvas`
- Persists selected sections in `localStorage.aiub_selectedSections`

---

### 📝 Registration
**Entry:** `src/components/entries/academicRegistration.content.jsx`  
**Component:** `src/components/academic/Registration.jsx`

- Parses course cards from `StudentCourseList`
- Displays dropped, active, and result labels
- Shows semester selector and print shortcut
- Builds fee breakdown panel from `divAssesment`

---

### 📊 Course and Results
**Entry:** `src/components/entries/academicCourseResults.content.jsx`  
**Component:** `src/components/academic/CourseAndResults.jsx`

- Parses active course and term breakdown
- Builds expandable section cards with grade/score metadata
- Preserves section and semester navigation behavior

---

### 🎓 Grade Report — By Curriculum
**Entry:** `src/components/entries/gradeCurriculum.content.jsx`  
**Component:** `src/components/grade/carriculum_grade_report.jsx`

- Parses curriculum report rows and summary info
- Applies status/grade-aware visual cues
- Integrates prerequisite information from `Academic/CSE.json`

---

### 📆 Grade Report — By Semester
**Entry:** `src/components/entries/gradeSemester.content.jsx`  
**Component:** `src/components/grade/carriculum_grade_semester.jsx`

- Parses semester groups and course rows
- Displays compact semester cards with GPA indicators
- Tracks ongoing, dropped, failed, and passed statuses

---

### 💰 Financials
**Entry:** `src/components/entries/academicFinancials.content.jsx`  
**Component:** `src/components/academic/Financials.jsx`

- Parses transaction table and total rows
- Computes total charged, paid, and current balance
- Styles rows by transaction type and amount semantics

---

### 🗂️ Curriculum
**Entry:** `src/components/entries/academicCurriculum.content.jsx`  
**Component:** `src/components/academic/MkCurriculumn.jsx`

- Loads bundled `public/Academic/CSE.json`
- Matches course by code and/or normalized name
- Injects prerequisite column and modal table styling

---

### ❌ Drop Application
**Entry:** `src/components/entries/academicDropApplication.content.jsx`  
**Component:** `src/components/academic/DropApplication.jsx`

- Preserves Angular-rendered content while wrapping in improved React layout
- Shows a refund eligibility panel
- Applies structured styling to rules and course rows

---

### 🎨 Shared UI Enhancements

| Component | Path |
|-----------|------|
| Sidebar | `src/components/shared/Sidebar.jsx` |
| Navbar | `src/components/shared/Navbar.jsx` |
| Profile page | `src/components/entries/profileContent.content.jsx` |
| Home bundle | `src/components/entries/homeBundle.content.jsx` |
| ↳ Intro widget | `src/components/home/Intro.jsx` |
| ↳ Class Schedule | `src/components/home/ClassSchedule.jsx` |
| ↳ Registration widget | `src/components/home/Registration.jsx` |

---

## 📁 Project Structure

```
.
├── manifest.json
├── vite.config.js
├── package.json
├── public/
│   ├── aiub.jpg
│   └── Academic/
│       └── CSE.json                  # Prerequisite & curriculum data
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── content.css
    └── components/
        ├── entries/                  # Content-script entry points
        ├── content/                  # Offered course filter + routine
        ├── academic/                 # Registration, curriculum, financials, drop
        ├── grade/                    # Grade report modules
        ├── home/                     # Homepage widgets
        ├── profile/                  # Profile module
        └── shared/                   # Sidebar, navbar, bridge
```

---

## 🚀 Setup and Installation

### Prerequisites

- **Node.js** 18+
- **npm**
- **Google Chrome** (or Chromium-based browser)

### 1 — Clone and install

```bash
git clone https://github.com/mdrijoanmaruf/AIUB-Plus-Extenstion.git
cd AIUB-Plus-Extenstion
npm install
```

### 2 — Build the extension

```bash
npm run build
```

### 3 — Load into Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder generated by the build

### 4 — Use on the portal

1. Go to [https://portal.aiub.edu](https://portal.aiub.edu)
2. Open the extension popup
3. Toggle extension **ON**
4. Navigate to any supported `/Student` page

---

## 📦 NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `npm run dev` | Starts Vite dev server |
| Build | `npm run build` | Production extension build |
| Lint | `npm run lint` | ESLint checks |
| Preview | `npm run preview` | Preview production build |

> ⚠️ `npm run build:popup` and `npm run watch:popup` currently fail because `vite.popup.config.js` is missing from the repository.

---

## 🔧 Configuration and Data Files

### `manifest.json`
- Manifest Version 3
- Host permissions: `https://portal.aiub.edu/*`
- Permissions: `activeTab`, `storage`, `tabs`
- Content scripts mapped per portal route
- `web_accessible_resources` includes `aiub.jpg` and `Academic/CSE.json`

### `tailwind.config.js`
Defines a custom `aiub` color palette and font/box-shadow extensions.

### `public/Academic/CSE.json`
Bundled curriculum dataset used for prerequisite matching and curriculum enrichment across grade and curriculum pages.

---

## 🔒 Permissions and Privacy

### Permissions used

| Permission | Purpose |
|------------|---------|
| `activeTab` | Reads current tab context for popup status behavior |
| `storage` | Persists extension enabled state across sessions |
| `tabs` | Tab query/reload triggered from popup |
| `host: portal.aiub.edu` | Required to inject content scripts |

### Data handling

- ✅ No backend API calls for student data
- ✅ All data parsed from portal DOM in-browser only
- ✅ Extension state stored in `chrome.storage.sync`
- ✅ Selected course sections stored in browser `localStorage`
- ✅ Nothing leaves your browser

---

## 🐛 Troubleshooting

**Extension not working on page**
- Confirm popup toggle is **ON**
- Reload the target portal tab
- Ensure the URL matches routes under `/Student`

**Offered Courses panel not appearing**
- Page must contain FooTable and course rows
- Script waits for the table; if the portal is slow, wait a few seconds then refresh

**Routine download not working**
- Ensure the routine modal is open before downloading
- Browser popup blockers can sometimes interfere with automatic downloads

**Build warnings from CRXJS plugin**
- `MAIN` world content script entries may show HMR warnings during build
- The production build still completes successfully

**Popup-specific build fails**
- Expected — `vite.popup.config.js` is missing from the repository

---

## ⚠️ Known Limitations

- Portal DOM changes can break parser-dependent modules
- Some enhancements rely on exact portal CSS classes and structure
- `build:popup` / `watch:popup` scripts are stale without their config file
- Type usage is mostly JSX/JavaScript; only limited TSX usage in the profile module

---

## 👤 Credits

Developed by **Md Rijoan Maruf**

---

*If you maintain this project, consider adding:*
- *A release/changelog section*
- *Screenshots or GIFs for each major feature*
- *Contribution guidelines and issue templates*