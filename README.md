# 🎓 AIUB Course Filter Chrome Extension

A powerful Chrome extension that makes course selection at AIUB portal effortless. Search, filter, and organize 250+ offered courses by status, timing, and day of the week — all in one place.

## ✨ Features

- **🔍 Advanced Search** — Find courses instantly by name or Class ID
- **📋 Status Filter** — Filter by Open, Freshman, Sophomore, Junior, Senior sections (multi-select)
- **⏰ Time Range Filter** — Select your preferred class time window (8 AM to 6 PM in 10-minute increments)
- **📅 Day of Week Filter** — Choose your preferred class days
- **📊 View All Courses** — Access all 250+ offered courses at once (no more pagination clicking)
- **💾 Customizable Display** — Pagination with 10, 25, 50, or 100 courses per page
- **🎨 Modern UI** — Professional, responsive design for desktop and tablet
- **⚡ Fast & Smooth** — Real-time filtering with debounced search

## 🛡️ Safety & Privacy

- **100% Local Processing** — All data processing happens on your device
- **No Data Transmission** — The extension only reads course data from your browser session
- **Open Source** — Full code transparency; anyone can review and audit
- **Portal Read-Only** — The extension only reads data from the AIUB Offered Courses page

## 📥 Installation Guide

### Quick Setup (3 minutes)

1. **Download the Extension**
   ```bash
   git clone https://github.com/mdrijoanmaruf/Course-Filter-Extenstion-AIUB.git
   cd "Course Filter Extenstion AIUB"
   ```

2. **Load into Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable **Developer Mode** (toggle in top-right corner)
   - Click **Load unpacked**
   - Select the `Course Filter Extenstion AIUB` folder
   - The extension icon (AIUB logo) will appear in your toolbar

3. **Start Using**
   - Go to [AIUB Portal](https://portal.aiub.edu/) → **Offered Courses** page
   - The filter panel appears automatically at the top
   - Start filtering! 🚀

## 🚀 How to Use

### Filter Panel

**Row 1:**
- **Search Course** — Type course name or Class ID (searches in real-time)
- **Status** — Click status buttons to toggle (Open, Freshman, etc.) — multi-select supported

**Row 2:**
- **Day of Week** — Select preferred days (Sun, Mon, Tue, Wed, Thu)
- **Class Start Time** — Set From/To time range (defaults: 8 AM → 6 PM)

### Results
- View filtered courses in a results table with pagination
- Change "per page" display (default: 25)
- Click **Reset** to clear all filters and return to portal's original table

## 📦 Project Structure

```
Course Filter Extenstion AIUB/
├── manifest.json           # Extension configuration & permissions
├── content.js             # Core filtering logic & DOM manipulation
├── styles.css             # Extension UI styling
├── popup.html             # Extension popup UI
├── popup.js               # Popup functionality
├── popup.css              # Popup styling
├── aiub.jpg               # Extension icon
└── README.md              # This file
```

## 🔧 Technical Details

- **Manifest Version:** 3 (Chrome's latest standard)
- **JavaScript Framework:** Vanilla JS (no dependencies)
- **Data Source:** FooTable v3 (pagination library on portal)
- **Injection Method:** Main world execution (MAIN) — allows direct access to page's FooTable API
- **CSS Framework:** Bootstrap 3 (portal's native framework)

### Key Functions
- `getAllCourses()` — Extracts all courses from FooTable (all pages)
- `parseRowElements()` — Converts DOM rows to course objects
- `applyFilters()` — Applies multi-filter logic
- `renderFilteredResults()` — Displays results in custom table

## 💡 Use Cases

✅ Find all Open sections for a course  
✅ Schedule classes between 9 AM and 2 PM on MWF  
✅ Find lab courses with available seats  
✅ Search by Class ID to see all sections  
✅ Browse without the portal's pagination limit  

## 🐛 Known Limitations

- Works only on AIUB portal's Offered Courses page
- Requires Chrome/Edge (Chromium-based browsers)
- Course data is cached during page load (refresh to update)

## 🤝 Contributing

Found a bug? Want to suggest a feature? Feel free to:
1. Open an Issue on GitHub
2. Submit a Pull Request with improvements
3. Share feedback in the comments

## 📋 License

This project is open-source and free to use. No restrictions on personal or educational use.

## ✉️ Support

Have questions? Issues? Feedback?
- **GitHub Issues:** [Create an issue](https://github.com/mdrijoanmaruf/Course-Filter-Extenstion-AIUB/issues)
- **Contact:** Md Rijoan Maruf

---

**Built with ❤️ for AIUB students**

*Last updated: April 2026*
