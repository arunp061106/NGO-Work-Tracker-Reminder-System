# NGO Work Tracker & Reminder System

A modern, professional, and mobile-responsive web dashboard tailored for NGO staff members and administrators to manage daily activities, receive smart reminders, log field work logs, document outcomes, upload evidence photos, and monitor organization productivity.

This project is built using a **Dual-Architecture** layout:
1. **🚀 Single-Page Live Demonstration (`index.html`)**: A self-contained, high-fidelity static portal running entirely in the browser. It integrates local mock database services via `localStorage` and `IndexedDB` (for persistent evidence image storage) so it can be hosted instantly on **GitHub Pages** with zero server-side setups.
2. **💻 Full-Stack React + FastAPI Codebase**: Production-ready code split into `frontend/` (React + Tailwind CSS) and `backend/` (FastAPI + SQLAlchemy + PostgreSQL) directories.

---

## 🎯 Key Feature Modules

### 🔐 1. Authentication Portal
* Complete Login, Sign Up, and simulated Forgot Password views.
* Preconfigured credentials for immediate evaluator entry:
  * **Staff Account**: `staff@ngo.org` / `password`
  * **Admin Account**: `admin@ngo.org` / `password`

### 📊 2. Dynamic Impact Dashboard
* Key performance metrics cards (Total Tasks, Pending Tasks, Completed Tasks, High Priority Tasks).
* **AI-Powered Daily Summary Generator**: Local natural language summary generator summarizing accomplishments, check-ins, and uploaded photos.
* **SVG Interactive Charts**:
  * Task completion trend line.
  * Category distribution donut chart.
  * Weekly productivity bar graphs.
* **Stopwatch Attendance Tracking**: Punch in and punch out tracking log.

### 📝 3. Task Management
* Modals to create, edit, and delete tasks.
* Fields: Task Title, Description, Category, Priority, Due Date, Due Time, Reminder Offsets, Location, and Notes.
* Automatic check-in status validation (Pending, In Progress, Completed, Overdue).

### 📅 4. Triple-Layout Calendar View
* Tabbed scheduling displays: **Month Calendar Grid**, **Weekly Columns**, and **Daily Hourly Timeline lists**.
* Event color-coding based on priority.

### 📸 5. Daily Work Log & Photo Documentation
* Submission forms for Remarks, Observations, and Outcome stats.
* **Multiple Image Uploads**: Supported via drag-and-drop file uploader.
* **IndexedDB Store**: Encodes and saves photo evidence binaries locally in browser database storage (survives page reloads!).
* Fullscreen Lightbox gallery to view, inspect, and download uploaded photos.
* **GPS Location Integration**: Geolocation checks reading device coordinates.

### 📂 6. Reports & Archive Module
* Global search queries across task names, remarks, outcomes, or notes.
* Advanced parameters: Date Range, Categories, Statuses, and Staff.
* **Export PDF**: Clean, print-styled print stylesheets layout.
* **Export Excel**: Automatic CSV generator compilation.

### 🛡️ 7. Administrative Controls
* Organization-wide performance grids monitoring staff logs.
* Real-time field punch status tracking.
* Simple role privilege modification controls.

---

## 🚀 How to Run and Present the App

### 1. Run Locally
Because the standalone demo in the root directory is fully client-side:
* Simply **double-click** `index.html` to run the application immediately in any browser (Chrome/Edge/Safari).
* Alternatively, run a simple Python server:
  ```bash
  python -m http.server 8000
  ```
  Then open [http://localhost:8000](http://localhost:8000) in your browser.

### 2. Deploy to GitHub Pages (Static Hosting)
Since `index.html` is in the root directory, you can publish the demo online in under a minute:
1. Push this project to your GitHub repository: `arunp061106/NGO-Work-Tracker-Reminder-System`.
2. On GitHub, navigate to your repository's **Settings** tab.
3. Scroll down the left sidebar and click on **Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Choose **`main`** (or `master`) as your branch, select **`/root`** as the folder, and click **Save**.
6. Wait 30 seconds, and your live URL will be ready at:
   `https://arunp061106.github.io/NGO-Work-Tracker-Reminder-System/`

---

## 🛠️ Stack Structure Details

```
NGO-Work-Tracker-Reminder-System/
│
├── index.html                   # Static HTML/CSS/JS Standalone Demo App
├── README.md                    # Documentation
│
├── frontend/                    # React + Tailwind Frontend Source Files
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx              # App state coordinator
│       ├── index.css
│       └── components/          # React modules
│
└── backend/                     # FastAPI Backend Source Files
    ├── requirements.txt
    ├── main.py                  # API endpoints
    ├── database.py              # PostgreSQL database helper
    ├── models.py                # SQLAlchemy ORM schemas
    ├── schemas.py               # Pydantic schemas
    └── auth.py                  # Authentication utility functions
```
