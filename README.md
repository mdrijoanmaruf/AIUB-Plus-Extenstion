# AIUB Portal+ ðŸš€

> A comprehensive Chrome extension that supercharges the official AIUB Student Portal with a modern UI, intelligent scheduling, grade analytics, and financial insights.

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Manifest](https://img.shields.io/badge/Manifest-V3-4285F4?style=flat-square&logo=googlechrome)](https://developer.chrome.com/docs/extensions/mv3/)
[![Version](https://img.shields.io/badge/Version-3.1.0-orange?style=flat-square)](https://github.com/mdrijoanmaruf/AIUB-Plus-Extenstion)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**Repository:** [github.com/mdrijoanmaruf/AIUB-Plus-Extenstion](https://github.com/mdrijoanmaruf/AIUB-Plus-Extenstion)

---

## ðŸ“‹ Table of Contents

- [What This Extension Does](#-what-this-extension-does)
- [What's New in v3.1.0](#-whats-new-in-v310)
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

## ðŸŒŸ What This Extension Does

AIUB Portal+ adds page-specific enhancements on [https://portal.aiub.edu](https://portal.aiub.edu) for:

| Page | Enhancement |
|------|-------------|
| **Offered Courses** | Search, filters, clash checking, section selection, routine generation & PNG export |
| **Registration** | Cleaner cards, semester switch, credit summary, print shortcut |
| **Registration Print** | Fully redesigned payment print page with payment cards, bank selector & trust footer |
| **Course Results** | Modernized display with expandable section cards |
| **Grade Reports** | Curriculum-wise and semester-wise visualization with GPA parsing |
| **Financials** | Debit-credit-balance parsing with summary cards |
| **Online Payment History** | Styled transaction table with color-coded status badges |
| **Curriculum** | Prerequisite enrichment via bundled CSE catalog |
| **Drop Application** | Improved readability and refund status panel |
| **Change Password** | Premium redesigned form with eye-toggle buttons and placeholders |
| **Exam Routine** | Countdown timers and "Completed" status badges |
| **Shared UI** | Sidebar, navbar, profile widget, and live Notices bell from aiub.edu |

> Pure client-side â€” no backend API calls. All data is parsed from the existing portal DOM in-browser.

---

## ðŸ†• What's New in v3.1.0

### ðŸ”” Navbar â€” Live Notice Bell
- New custom bell icon (`FiBell`) injected into the top navbar
- Fetches and displays **Latest Notices from aiub.edu** in a glassmorphism dropdown (380px wide)
- Badge counter shows unread notice count
- Auto-closes when native notification dropdown is opened (and vice versa)
- Close button in dropdown header
- Styled scrollbar matching the notification popup design

### ðŸ” Change Password â€” Premium Redesign
- Fully redesigned Change Password page (`/Student/Credential/ChangePassword`)
- Eye toggle buttons (`FiEye` / `FiEyeOff`) for all three password fields using `react-icons`
- Input placeholders: *Enter current password*, *Enter new password*, *Confirm new password*
- Eye button is correctly centered vertically within each input using an isolated wrapper
- Respects extension ON/OFF toggle

### ðŸ§¾ Registration Print â€” New Page
- Brand new redesign for `/Student/Registration/Print`
- **Info card** showing Student ID, Printout For, Payment Option, and Credit badges
- **Alert banner** with payment bank instructions
- **Bank selector** dropdown with styled chevron
- **Payment cards** (Third Instalment & Full) with gradient icons, amount, and action buttons
- **Trust footer** â€” Secure Payment, Trusted by Thousands, Contact Support
- Print and Pay Online buttons wired to original portal functions
- Respects extension ON/OFF toggle

### ðŸ’³ Online Payment History â€” New Page
- Brand new redesign for `/Student/Payment/List`
- Styled table with rounded card container and subtle shadow
- Monospace transaction ID column
- Amount column with à§³ symbol and 2 decimal formatting
- **Color-coded status badges** using `react-icons`:
  - ðŸŸ¢ Success Â· ðŸ”´ Failed Â· ðŸŸ¡ Cancelled Â· ðŸ”µ Pending
- "Check Status" button with gradient blue style and arrow icon
- "Not Applicable" replaced with clean muted text
- Row hover highlight effect
- Respects extension ON/OFF toggle

### ðŸŽ¨ React Icons Migration
All inline SVG icons across the following components have been replaced with `react-icons/fi`:

| Component | Icons Replaced |
|-----------|---------------|
| `Navbar.jsx` | `FiBell` |
| `HomeRegistration.jsx` | `FiBook`, `FiChevronDown` |
| `ClassSchedule.jsx` | `FiClock`, `FiMapPin`, `FiCalendar` |
| `by_carriculum.jsx` | `FiRotateCcw` |
| `Financials.jsx` | `FiDollarSign`, `FiCheckCircle`, `FiAlertCircle` |
| `ExamRoutine.jsx` | `FiCheckCircle` |
| `AcademicRegistration.jsx` | `FiPrinter` |
| `ChangePassword.jsx` | `FiEye`, `FiEyeOff`, `FiInfo` |
| `RegistrationPrint.jsx` | `FiPrinter`, `FiCreditCard`, `FiShield`, `FiLock`, `FiChevronDown`, `FiClock`, `FiMoreVertical` |
| `OnlinePaymentHistory.jsx` | `FiCheckCircle`, `FiXCircle`, `FiClock`, `FiRefreshCw`, `FiCreditCard`, `FiAlertCircle`, `FiArrowUpRight` |

---

## ðŸ›  Tech Stack

| Tool | Version | Purpose |
|------|---------|---------| 
| **React** | 19 | UI rendering |
| **React DOM** | 19 | DOM management |
| **react-icons** | â€” | Feather icon set (replacing inline SVGs) |
| **Vite** | 8 | Build tooling |
| **CRXJS Vite Plugin** | â€” | Chrome Extension MV3 build flow |
| **Tailwind CSS** | 3 | Styling |
| **PostCSS + Autoprefixer** | â€” | CSS processing |
| **Recharts** | â€” | Grade visualizations |
| **html2canvas** | â€” | Routine PNG export |
| **ESLint** | 9 | Code linting |

**Primary config files:** `manifest.json` Â· `vite.config.js` Â· `tailwind.config.js` Â· `postcss.config.js` Â· `eslint.config.js`

---

## âš™ï¸ How It Works

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Popup UI   â”‚â”€â”€â”€â”€â–¶â”‚  contentBridge   â”‚â”€â”€â”€â”€â–¶â”‚  Content Scripts      â”‚
â”‚ (App.jsx)   â”‚     â”‚  (localStorage)  â”‚     â”‚  (self-guarded)       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
chrome.storage.sync   mirrors enabled state      parse & enhance DOM
```

**Step 1 â€” Popup controls state**
Popup UI (`src/App.jsx`) reads and writes `extensionEnabled` via `chrome.storage.sync`.

**Step 2 â€” Shared bridge mirrors state**
`src/components/shared/contentBridge.jsx` listens for storage changes and mirrors enabled state into `localStorage.__aiubPortalEnabled`.

**Step 3 â€” Content scripts self-guard**
Each content entry uses mount guards (`window.__aiub*Mounted`) and `chrome.storage.sync.get({ extensionEnabled })` checks to avoid duplicate injections and to skip work when disabled.

**Step 4 â€” Page-specific modules parse the DOM**
Feature modules parse portal HTML tables/panels, then replace or augment them with React-rendered views and styled cards.

---

## ðŸ“„ Features by Portal Page

### ðŸ“… Offered Courses
**Component:** `src/components/content/OfferedFilters.jsx`

- Parses FooTable courses and nested time slots
- Filters by search, status, day, and start-time range
- Detects schedule overlaps before selection
- Prevents duplicate course title selection
- Shows linked/alternative sections via time signature matching
- Generates weekly routine modal with color-coded course blocks
- Exports routine as PNG image via `html2canvas`
- Persists selected sections in `localStorage.aiub_selectedSections`

---

### ðŸ“ Registration
**Component:** `src/components/academic/AcademicRegistration.jsx`

- Parses course cards from `StudentCourseList`
- Displays dropped, active, and result labels
- Shows semester selector and print shortcut (`FiPrinter`)
- Builds fee breakdown panel from `divAssesment`

---

### ðŸ§¾ Registration Print *(New in v3.1.0)*
**Component:** `src/components/academic/RegistrationPrint.jsx`

- Triggered on `/Student/Registration/Print*`
- Parses all student info, payment panels, bank options, and alert messages from the portal DOM
- Renders modern info card, alert banner, bank select, payment cards, and trust footer
- Print button calls native `Confirmation3()` function
- Respects the extension ON/OFF toggle

---

### ðŸ“Š Course and Results
**Component:** `src/components/academic/CourseAndResults.jsx`

- Parses active course and term breakdown
- Builds expandable section cards with grade/score metadata
- Preserves section and semester navigation behavior

---

### ðŸŽ“ Grade Report â€” By Curriculum
**Component:** `src/components/grade/by_carriculum.jsx`

- Parses curriculum report rows and summary info
- Applies status/grade-aware visual cues
- Integrates prerequisite information from `Academic/CSE.json`
- Reset filter button using `FiRotateCcw`

---

### ðŸ“† Grade Report â€” By Semester
**Component:** `src/components/grade/by_semester.jsx`

- Parses semester groups and course rows
- Displays compact semester cards with GPA indicators
- Tracks ongoing, dropped, failed, and passed statuses

---

### ðŸ’° Financials
**Component:** `src/components/academic/Financials.jsx`

- Parses transaction table and total rows
- Computes total charged (`FiDollarSign`), paid (`FiCheckCircle`), and current balance (`FiAlertCircle`)
- Styles rows by transaction type and amount semantics

---

### ðŸ’³ Online Payment History *(New in v3.1.0)*
**Component:** `src/components/academic/OnlinePaymentHistory.jsx`

- Triggered on `/Student/Payment/List*`
- Parses all transaction rows from the portal table
- Formats amounts with à§³ symbol and 2-decimal precision
- Color-coded status badges: Success (green), Failed (red), Cancelled (amber), Pending (blue)
- "Check Status" links styled as gradient blue buttons with `FiArrowUpRight`
- Row hover highlight, monospace ID column, clean "Not Applicable" text
- Respects the extension ON/OFF toggle

---

### ðŸ—‚ï¸ Curriculum
**Component:** `src/components/academic/MkCurriculumn.jsx`

- Loads bundled `public/Academic/CSE.json`
- Matches course by code and/or normalized name
- Injects prerequisite column and modal table styling

---

### âŒ Drop Application
**Component:** `src/components/academic/DropApplication.jsx`

- Preserves Angular-rendered content while wrapping in improved React layout
- Shows a refund eligibility panel
- Applies structured styling to rules and course rows

---

### ðŸ“… Exam Routine
**Component:** `src/components/academic/ExamRoutine.jsx`

- Countdown timers per exam
- "Completed" badge using `FiCheckCircle` for past exams

---

### ðŸ” Change Password *(Redesigned in v3.1.0)*
**Component:** `src/components/credential/ChangePassword.jsx`

- Triggered on `/Student/Credential/ChangePassword*`
- Full premium redesign with rounded card, gradient header
- Eye toggle buttons using `FiEye` / `FiEyeOff`
- Per-field placeholders (Current / New / Confirm)
- Eye button is correctly centered using an input wrapper div
- Respects the extension ON/OFF toggle

---

### ðŸŽ¨ Shared UI Enhancements

| Component | Path | Notes |
|-----------|------|-------|
| Sidebar | `src/components/shared/Sidebar.jsx` | â€” |
| Navbar | `src/components/shared/Navbar.jsx` | Live notice bell (`FiBell`), native notification styling |
| Profile page | `src/components/content/ProfileContent.jsx` | â€” |
| Intro widget | `src/components/home/Intro.jsx` | â€” |
| Class Schedule | `src/components/home/ClassSchedule.jsx` | `FiClock`, `FiMapPin`, `FiCalendar` |
| Registration widget | `src/components/home/HomeRegistration.jsx` | `FiBook`, `FiChevronDown` |

---

## ðŸ“ Project Structure

```
.
â”œâ”€â”€ manifest.json
â”œâ”€â”€ vite.config.js
â”œâ”€â”€ package.json
â”œâ”€â”€ public/
â”‚   â””â”€â”€ Academic/
â”‚       â””â”€â”€ CSE.json                  # Prerequisite & curriculum data
â””â”€â”€ src/
    â”œâ”€â”€ App.jsx
    â”œâ”€â”€ main.jsx
    â”œâ”€â”€ content.css
    â””â”€â”€ components/
        â”œâ”€â”€ content/                  # Offered course filter + routine, profile
        â”œâ”€â”€ academic/                 # Registration, RegistrationPrint, Financials,
        â”‚                             # OnlinePaymentHistory, Curriculum, Drop,
        â”‚                             # ExamRoutine, CourseAndResults
        â”œâ”€â”€ credential/               # ChangePassword
        â”œâ”€â”€ grade/                    # by_carriculum, by_semester
        â”œâ”€â”€ home/                     # ClassSchedule, HomeRegistration, Intro
        â””â”€â”€ shared/                   # Sidebar, Navbar, contentBridge
```

---

## ðŸš€ Setup and Installation

### Prerequisites

- **Node.js** 18+
- **npm**
- **Google Chrome** (or Chromium-based browser)

### 1 â€” Clone and install

```bash
git clone https://github.com/mdrijoanmaruf/AIUB-Plus-Extenstion.git
cd AIUB-Plus-Extenstion
npm install
```

### 2 â€” Build the extension

```bash
npm run build
```

### 3 â€” Load into Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder generated by the build

### 4 â€” Use on the portal

1. Go to [https://portal.aiub.edu](https://portal.aiub.edu)
2. Open the extension popup
3. Toggle extension **ON**
4. Navigate to any supported `/Student` page

---

## ðŸ“¦ NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `npm run dev` | Starts Vite dev server |
| Build | `npm run build` | Production extension build |
| Lint | `npm run lint` | ESLint checks |
| Preview | `npm run preview` | Preview production build |

---

## ðŸ”§ Configuration and Data Files

### `manifest.json`
- Manifest Version 3
- Host permissions: `https://portal.aiub.edu/*`
- Permissions: `activeTab`, `storage`, `tabs`
- Content scripts mapped per portal route (16 total entries in v3.1.0)
- `web_accessible_resources` includes icons and `Academic/CSE.json`

### `tailwind.config.js`
Defines a custom `aiub` color palette and font/box-shadow extensions.

### `public/Academic/CSE.json`
Bundled curriculum dataset used for prerequisite matching and curriculum enrichment across grade and curriculum pages.

---

## ðŸ”’ Permissions and Privacy

### Permissions used

| Permission | Purpose |
|------------|---------|
| `activeTab` | Reads current tab context for popup status behavior |
| `storage` | Persists extension enabled state across sessions |
| `tabs` | Tab query/reload triggered from popup |
| `host: portal.aiub.edu` | Required to inject content scripts |

### Data handling

- âœ… No backend API calls for student data
- âœ… All data parsed from portal DOM in-browser only
- âœ… Extension state stored in `chrome.storage.sync`
- âœ… Selected course sections stored in browser `localStorage`
- âœ… Nothing leaves your browser

---

## ðŸ› Troubleshooting

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

**Notice bell not showing in navbar**
- The bell uses `createRoot` from React â€” ensure the extension is toggled ON and the page has fully loaded
- Hard-refresh (Ctrl+Shift+R) the portal page

**Build warnings from CRXJS plugin**
- `MAIN` world content script entries may show HMR warnings during build
- Both `rollupOptions`/`rolldownOptions` conflict warnings are harmless â€” the production build still completes successfully

---

## âš ï¸ Known Limitations

- Portal DOM changes can break parser-dependent modules
- Some enhancements rely on exact portal CSS classes and structure
- Prerequisite unlock feature works only for AIUB CSE students
- AngularJS-managed elements (e.g. native notification list) may re-render and require CSS injection rather than inline DOM styling

---

## ðŸ“ Changelog

### v3.1.0
- âœ¨ New: Registration Print page redesign (`/Student/Registration/Print`)
- âœ¨ New: Online Payment History redesign (`/Student/Payment/List`)
- âœ¨ New: if the portal is slow, wait a few seconds then refresh

**Routine download not working**
- Ensure the routine modal is open before downloading
- Browser popup blockers can sometimes interfere with automatic downloads

**Build warnings from CRXJS plugin**
- `MAIN` world content script entries may show HMR warnings during build
- The production build still completes successfully

**Popup-specific build fails**
- Expected â€” `vite.popup.config.js` is missing from the repository

---

## âš ï¸ Known Limitations

- Portal DOM changes can break parser-dependent modules
- Some enhancements rely on exact portal CSS classes and structure
- Prerequisite unlock feature works only for AIUB CSE students
- AngularJS-managed elements (e.g. native notification list) may re-render and require CSS injection rather than inline DOM styling

---

## Changelog

### v3.1.0
- New: Registration Print page redesign (/Student/Registration/Print)
- New: Online Payment History redesign (/Student/Payment/List)
- New: Change Password premium redesign with eye toggle and placeholders
- New: Live Notice bell in navbar fetching notices from aiub.edu
- Migrated all inline SVGs to react-icons/fi across 10 components
- Notification popup redesigned to match Notice popup (glassmorphism)
- Fixed: Eye button vertical centering in Change Password
- Fixed: Navbar bell missing createRoot / FiBell imports

---

## Credits

Developed by **Md Rijoan Maruf**

---

*For contribution guidelines, screenshots, or issue templates - consider adding them to help future maintainers.*
