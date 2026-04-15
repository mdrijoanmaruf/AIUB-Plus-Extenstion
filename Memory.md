# AIUB Portal+ Chrome Extension — Project Memory

Last analyzed: 2026-04-15

This workspace contains a **Manifest V3 Chrome extension** (works in Chrome/Edge) that enhances the **AIUB Student Portal** at `https://portal.aiub.edu/Student*`.

The extension is contained in the folder:

- `Course Filter Extenstion AIUB/`

The root `Memory.md` is intentionally used as an internal “how it works” note so the project can be resumed quickly.

---

## 1) What this extension does (high level)

It injects page-specific UI/UX enhancements across the AIUB portal:

- **Offered Courses:** advanced filtering + load-all + clash detection + “selected courses” routine panel.
- **Home:** schedule cards + live countdown timers + small UI polish.
- **Academic pages:** richer layouts for course results, curriculum, financials, drop application, registration.
- **Grade reports:** replaces the original grade report tables with cleaner, more readable views.
- **Global navigation:** enhanced sidebar with profile block + active link highlighting.

There is **no backend** and **no network calls** by the extension. Everything is DOM parsing + UI injection.

---

## 2) How to run / test

1. Open `chrome://extensions/` (or Edge equivalent).
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select the folder `Course Filter Extenstion AIUB/`.
5. Visit `https://portal.aiub.edu/` and navigate to the supported pages.

Debugging:

- Open DevTools on the portal page and check **Console** for logs/errors.
- Offered Courses (`content.js`) logs messages like `[AIUB Filter] ...`.

---

## 3) Extension architecture (MV3)

### 3.1 Manifest + entry points

File: `Course Filter Extenstion AIUB/manifest.json`

- `manifest_version: 3`
- No service worker / background script.
- `permissions`: `activeTab`, `storage`, `tabs`
- `host_permissions`: `https://portal.aiub.edu/*`
- `action.default_popup`: `popup.html`

### 3.2 Global enable/disable toggle

There is one global switch:

- Chrome storage (sync): `extensionEnabled` (boolean, default `true`)

Where it’s controlled:

- `popup.js` reads/writes `chrome.storage.sync` and reloads the current tab.

How content scripts check it:

- Most content scripts call `chrome.storage.sync.get({ extensionEnabled: true }, ...)` and return early if disabled.

### 3.3 MAIN-world script bridge (important)

The Offered Courses script runs in the **page MAIN world** (so it can access the portal’s `FooTable` object).

In MAIN world you typically **cannot use `chrome.*` APIs**, so the extension passes the enable/disable flag through `localStorage`:

- `Shared/contentBridge.js` (runs at `document_start`) reads `extensionEnabled` and writes:
	- `localStorage['__aiubPortalEnabled'] = '1' | '0'`
- `content.js` (MAIN world) checks:
	- `localStorage.getItem('__aiubPortalEnabled') === '0'` → exit

### 3.4 Idempotency (avoid double-injection)

Every page script sets a guard on `window`:

- Example: `window.__aiubSidebarEnhanced = true`

This prevents running twice if the portal re-renders or if scripts are injected more than once.

---

## 4) Script wiring (URL → scripts → purpose)

Source of truth: `Course Filter Extenstion AIUB/manifest.json`

### 4.1 Always-on (portal-wide)

| URL match | Script(s) | Run at | Purpose |
|---|---|---:|---|
| `https://portal.aiub.edu/Student*` | `Shared/contentBridge.js` | `document_start` | Writes enable flag into `localStorage` for MAIN-world scripts |
| `https://portal.aiub.edu/Student*` | `Shared/Sidebar.js` | `document_idle` | Enhanced left navigation sidebar |

### 4.2 Offered Courses (advanced filter)

| URL match | Script(s) | CSS | Run at | Notes |
|---|---|---|---:|---|
| `/Student/Section/Offered*` | `content.js` | `styles.css` | `document_idle` | **Runs in MAIN world** to access `FooTable` |

### 4.3 Home / dashboard

| URL match | Script(s) | CSS |
|---|---|---|
| `/Student`, `/Student/`, `/Student/Home/*` | `Home/Intro.js`, `Home/ClassSchedule.js`, `Home/Registration.js` | `Home/Intro.css`, `Home/ClassSchedule.css`, `Home/Registration.css` |

### 4.4 Academic pages

| URL match | Script(s) | CSS |
|---|---|---|
| `/Student/Course?*` | `Academic/CourseAndResults.js` | `Academic/CourseAndResults.css` |
| `/Student/Curriculum*` | `Academic/MkCurriculumn.js` | `Academic/MkCurriculumn.css` |
| `/Student/Accounts*` | `Academic/Financials.js` | `Academic/Financials.css` |
| `/Student/Adrop/DropApplication*` | `Academic/DropApplication.js` | `Academic/DropApplication.css` |
| `/Student/Registration?*` | `Academic/Registration.js` | `Academic/Registration.css` |

### 4.5 Grade reports

| URL match | Script(s) | CSS |
|---|---|---|
| `/Student/GradeReport/ByCurriculum*` | `Grade/carriculum_grade_report.js` | `Grade/carriculum_grade_report.css` |
| `/Student/GradeReport/BySemester*` | `Grade/carriculum_grade_semester.js` | `Grade/carriculum_grade_semester.css` |

---

## 5) Module behavior details (by file)

### 5.1 Offered Courses — `content.js` + `styles.css`

Scope: `https://portal.aiub.edu/Student/Section/Offered*`

Key dependencies/assumptions:

- Portal renders a `table.footable` with paginated rows (FooTable v3 on the portal page).
- The schedule cell contains a nested table describing time slots.

Main behaviors:

1. Waits up to ~30s for `table.footable` and at least one data cell.
2. Loads *all* offered courses:
	 - Prefers `FooTable.get(table).rows.all` if available.
	 - Fallback: temporarily expands FooTable paging size to `99999` and calls `draw()`.
	 - Fallback: DOM parse of currently visible rows.
3. Injects an **Advanced Course Filter** panel (`#aiub-filter-panel`) and a custom results container (`#aiub-results-container`).
4. Filters by:
	 - Text search (course title/fullTitle/classId)
	 - Status multi-select
	 - Day-of-week multi-select
	 - Start-time range (based on parsed start times)
5. Renders results in a custom table with internal pagination.
6. “Routine builder” / selections:
	 - Click **Select** to add a section.
	 - Prevents selecting more than one section of the same course title.
	 - Clash detection: marks sections as **Clash** if time overlap with any selected section.
	 - Shows a **Selected Courses** panel (`#aiub-selected-panel`) with cards + “Clear All”.
	 - “Linked sections” viewer: sections with same course title + identical time signature are displayed as alternative rows.

LocalStorage keys (portal domain):

- `__aiubPortalEnabled` → `'1'` or `'0'` (set by bridge)
- `aiub_selectedSections` → JSON array of selected course section objects
- `aiub_selectedTimestamp` → ISO timestamp

Notable guard flags:

- `window.__aiubFilterInjected`

UI IDs/classes worth knowing:

- `#aiub-filter-panel`, `#aiub-results-container`, `#aiub-selected-panel`
- CSS classes: `aiub-*` (defined in `styles.css`)

### 5.2 Shared sidebar — `Shared/Sidebar.js` + `Shared/Sidebar.css`

Scope: all `/Student*` pages.

Behavior:

- Enhances `#navigation-bar` (portal sidebar) by:
	- Injecting a profile block (student name + ID) at the top.
	- Highlighting the current active link by comparing `window.location.pathname` against each `.list-group-item` link.
	- Auto-expanding the current section’s collapse panel.
	- Inserting divider lines between major nav sections.

How it finds student name/id:

- Name from `.navbar-text .navbar-link` (split by comma, title-cased)
- ID extracted via regex `\d{2}-\d{5}-\d+` from `.navbar-text .navbar-link small`

CSS loading style:

- Injects `<link href="chrome.runtime.getURL('Shared/Sidebar.css')">`
- This is why `Shared/Sidebar.css` exists in `web_accessible_resources`.

Guard flag:

- `window.__aiubSidebarEnhanced`

### 5.3 Bridge — `Shared/contentBridge.js`

Scope: all `/Student*` pages, `document_start`.

- Reads `chrome.storage.sync.extensionEnabled`
- Writes `localStorage.__aiubPortalEnabled` so MAIN-world scripts can read it.

### 5.4 Popup — `popup.html` / `popup.js` / `popup.css`

- Shows a toggle switch for **Extension Enabled/Disabled**.
- Uses `chrome.storage.sync`.
- Reloads the current tab after toggle to re-run content scripts.
- Shows page status (currently only detects Offered Courses URL for “filter active”).

### 5.5 Home page enhancements

Files:

- `Home/Intro.js` / `Home/Intro.css`
- `Home/ClassSchedule.js` / `Home/ClassSchedule.css`
- `Home/Registration.js` / `Home/Registration.css`

Key behavior:

- `Home/ClassSchedule.js` transforms the “Class Schedule” panel:
	- Adds a top banner (greeting + date + live clock)
	- Groups schedule entries per day
	- Adds per-class timers (`Starts in`, `In Progress`, `Ended`) and updates every second
	- Uses the portal’s day labels (“Today”, “Tomorrow”, or `dd-MMM-yyyy`) to build real timestamps

Notes:

- `Home/Intro.js` and `Home/Registration.js` also inject CSS via `chrome.runtime.getURL(...)` even though CSS is already provided in the manifest. (Redundant but harmless.)

Legacy/unused:

- `Home/home.js` appears to be an older “all-in-one home enhancement” script (inline CSS + greeting + schedule + timers). It is **not referenced by the manifest**.

### 5.6 Academic: Course & Results — `Academic/CourseAndResults.js` + `.css`

Scope: `/Student/Course?*`

- Reads existing portal UI:
	- `#SectionDropDown` and `#SemesterDropDown` options (navigation)
	- Active course block inside `.list-group-item.active`
	- Term breakdown blocks under `.list-group-item:not(.active) ...`
- Replaces the page content with:
	- A filter bar (course + semester select)
	- A course summary card (final grade)
	- Term cards (Midterm / Final) containing sections and sub-items
- Clicking a term header or section header toggles expansion.

### 5.7 Academic: Curriculum — `Academic/MkCurriculumn.js` + `.css`

Scope: `/Student/Curriculum*`

- Styles the curriculum cards as “Core” vs “Elective”.
- Adds a page header using the first two `h4` elements (faculty, degree).
- Styles the “Show Curriculum Courses” modal content by:
	- Adding table classes
	- Wrapping content in a `.cur-modal-inner`
	- Using `MutationObserver` on `#divCurriculumCourses` to re-style after async loads

### 5.8 Academic: Financials — `Academic/Financials.js` + `.css`

Scope: `/Student/Accounts*`

- Wraps the transaction table (`table.table-details`) in a scroll container.
- Adds summary cards computed from the portal’s total row:
	- Total Charged (Debit)
	- Total Paid (Credit)
	- Balance Due
- Tags rows as `Assessment`, `Payment`, or `Fee` based on:
	- Presence of modal links in the “Particulars” cell
	- Text matching “semester payment”
- Styles assessment detail modal tables via `MutationObserver`.

### 5.9 Academic: Drop Application — `Academic/DropApplication.js` (+ `.css`)

Scope: `/Student/Adrop/DropApplication*`

- Targets Angular markup (`ng-controller="DropApplicationController2"`).
- Hides the original warning alert.
- Adds a top header with “Current Refund %” (parsed from the original alert badge).
- Applies heavy UI styling for rules table and course rows.

Note: JS injects a `<style>` block (`#aiub-drop-css`) and the manifest also injects `Academic/DropApplication.css` with nearly identical rules.

### 5.10 Academic: Registration — `Academic/Registration.js` (+ `.css`)

Scope: `/Student/Registration?*` (script also checks `pathname === '/Student/Registration'`)

- Parses the original registration tables to build a modern layout:
	- Semester dropdown (rebuilt) → navigation via `window.location.href = option.value`
	- Credit summary chips
	- Course cards: code, name, section badge, schedule chips, dropped-state styling
	- Sticky “Fee Assessment” side panel parsed from `#divAssesment` list items

Note: JS injects a `<style>` block (`#aiub-reg-css`) and the manifest also injects `Academic/Registration.css` (duplicated styling).

---

## 6) Grade report modules

### 6.1 By Curriculum — `Grade/carriculum_grade_report.js` + `.css`

Scope: `/Student/GradeReport/ByCurriculum*`

- Reads `.grade-report` content (portal tables/labels) and rebuilds it into:
	- Top info grid (ID, name, program, CGPA, etc.) from the first table.
	- “Not Attempted Yet” section with tabbed tables.
	- Core curriculum tables by semester label.
	- Elective curriculum table.
	- Legend (Ongoing/Completed/Withdrawn/Not Attempted).

Grade parsing:

- Expects grade text like: `(Semester Name) [A+]` repeated.
- Uses the last grade entry as the “current” grade.

Known quirk:

- Some template strings contain `â€”` where an em-dash was intended. If the UI shows `â€”`, it’s an encoding issue in the source file.

### 6.2 By Semester — `Grade/carriculum_grade_semester.js` + `.css`

Scope: `/Student/GradeReport/BySemester*`

- Parses the grade report into semester cards:
	- Semester header row detected by `td[colspan="12"]`
	- Semester summary detected by `td[colspan="6"]`
	- Course rows include: classId, name, credits, mid/final grade, final grade, TGP, status
- Adds collapsible semester cards + legend.

Course state heuristics:

- `sts === 'DRP'` → dropped
- `fg === '-'` → ongoing
- `fg === 'F'` → failed
- `W/UW` logic uses both mid/final and `prn` value.

---

## 7) Web accessible resources

Configured in `manifest.json`:

- `Home/Registration.css`
- `Home/Intro.css`
- `Shared/Sidebar.css`
- `Shared/contentBridge.js`

Reason:

- Some scripts inject `<link href="chrome-extension://...">` into the page. Those files must be listed as web-accessible.

---

## 8) Unused / legacy files (as of current manifest)

- `Academic/OfferedCourses.js` is empty.
- `Shared/Navbar.js` is not referenced by the manifest (and `Shared/Navbar.css` is NOT declared web-accessible).
- `Home/home.js` is not referenced by the manifest (appears to be an older combined Home enhancer).

If you later decide to enable `Shared/Navbar.js`, you must:

- Add it to `manifest.json` content_scripts, and
- Add `Shared/Navbar.css` to `web_accessible_resources` (because the script injects it as a `<link>`).

---

## 9) Quick troubleshooting checklist

- Enhancements not showing?
	- Open extension popup → ensure toggle is ON.
	- Reload the portal tab.
	- Check DevTools Console for script errors.

- Offered Courses filter not loading?
	- Confirm URL matches `/Student/Section/Offered*`.
	- Confirm the portal still uses `table.footable` and FooTable.
	- Look for `[AIUB Filter] Init failed:` in console.

- Sidebar styling missing?
	- Ensure `Shared/Sidebar.css` is reachable (web_accessible_resources).
	- Check if `#navigation-bar` exists (some portal views may differ).

- Any page breaks after portal redesign?
	- Most scripts depend on specific selectors/IDs (`#main-content`, `.panel`, `.grade-report`, etc.).
	- Fix by updating selectors in the corresponding page module.

