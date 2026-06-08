import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, Sun, Moon, LayoutDashboard, CheckSquare, 
  Calendar, ClipboardList, BarChart3, Shield, LogOut, 
  Menu, Search, Bell, MapPin, Loader2
} from 'lucide-react';

import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import TaskManagement from './components/TaskManagement';
import CalendarView from './components/CalendarView';
import DailyWorkLog from './components/DailyWorkLog';
import ReportsModule from './components/ReportsModule';
import AdminPanel from './components/AdminPanel';

import {
  getToken, removeToken, getMe,
  fetchTasks, createTask, updateTask, completeTask, deleteTask,
  fetchLogs,
  punchIn, punchOut,
} from './api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);  // avoid flash of login page
  const [activePanel, setActivePanel] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  
  const [punchActive, setPunchActive] = useState(false);
  const [punchTime, setPunchTime] = useState(0);
  const [gpsCoords, setGpsCoords] = useState(null);

  // ── Restore session on mount ──────────────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      const token = getToken();
      if (token) {
        try {
          const user = await getMe();
          setCurrentUser(user);
          await loadAppData();
        } catch {
          removeToken();
        }
      }
      setAuthChecked(true);
    };
    restore();

    // Push notifications request
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const loadAppData = async () => {
    try {
      const [tasksData, logsData] = await Promise.all([fetchTasks(), fetchLogs()]);
      setTasks(normalizeTasksFromApi(tasksData));
      setLogs(normalizeLogsFromApi(logsData));
    } catch (err) {
      console.error('Failed to load app data:', err);
    }
  };

  // ── Data normalization (API shape → component shape) ─────────────────────
  // The backend uses snake_case; the frontend components use camelCase.
  const normalizeTasksFromApi = (apiTasks) =>
    apiTasks.map((t) => ({
      id: t.id,
      title: t.title,
      desc: t.description,
      category: t.category,
      priority: t.priority,
      dueDate: t.due_date,
      dueTime: t.due_time,
      reminder: t.reminder,
      location: t.location,
      notes: t.notes,
      status: t.status,
      staff_id: t.staff_id,
    }));

  const normalizeLogsFromApi = (apiLogs) =>
    apiLogs.map((l) => ({
      id: l.id,
      taskName: l.task_name,
      date: l.date,
      completionTime: l.completion_time,
      remarks: l.remarks,
      observations: l.observations,
      outcome: l.outcome,
      gps: l.gps,
      staff_id: l.staff_id,
      photos: l.photos || [],
    }));

  // ── Auth handlers ─────────────────────────────────────────────────────────
  const handleLoginSuccess = async (user) => {
    setCurrentUser(user);
    await loadAppData();
  };

  const handleLogout = () => {
    removeToken();
    setCurrentUser(null);
    setPunchActive(false);
    setPunchTime(0);
    setTasks([]);
    setLogs([]);
    setActivePanel('dashboard');
  };

  // ── Task CRUD ─────────────────────────────────────────────────────────────
  const handleCreateTask = async (taskData) => {
    try {
      const created = await createTask(taskData);
      const normalized = normalizeTasksFromApi([created]);
      setTasks((prev) => [...prev, ...normalized]);
      addNotification(`New task created: ${created.title}`);
      return normalized[0];
    } catch (err) {
      alert(`Failed to create task: ${err.message}`);
    }
  };

  const handleUpdateTask = async (taskId, taskData) => {
    try {
      const updated = await updateTask(taskId, taskData);
      const normalized = normalizeTasksFromApi([updated])[0];
      setTasks((prev) => prev.map((t) => (t.id === taskId ? normalized : t)));
      addNotification(`Task updated: ${updated.title}`);
    } catch (err) {
      alert(`Failed to update task: ${err.message}`);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      const updated = await completeTask(taskId);
      const normalized = normalizeTasksFromApi([updated])[0];
      setTasks((prev) => prev.map((t) => (t.id === taskId ? normalized : t)));
      addNotification(`Completed task: "${updated.title}"`);
    } catch (err) {
      alert(`Failed to complete task: ${err.message}`);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      addNotification('Task deleted successfully.');
    } catch (err) {
      alert(`Failed to delete task: ${err.message}`);
    }
  };

  // ── Logs ──────────────────────────────────────────────────────────────────
  const refreshLogs = async () => {
    try {
      const logsData = await fetchLogs();
      setLogs(normalizeLogsFromApi(logsData));
    } catch (err) {
      console.error('Failed to refresh logs:', err);
    }
  };

  // ── Notifications (local only, UI feedback) ───────────────────────────────
  const addNotification = (message) => {
    const newNotif = {
      id: 'n-' + Date.now(),
      message,
      timestamp: new Date().toLocaleString(),
    };
    setNotifications((prev) => {
      const updated = [newNotif, ...prev];
      if (Notification.permission === 'granted') {
        new Notification('NGO Tracker Update', { body: message });
      }
      return updated;
    });
  };

  const clearNotifications = () => setNotifications([]);

  // ── Attendance timer ──────────────────────────────────────────────────────
  useEffect(() => {
    let interval = null;
    if (punchActive) {
      interval = setInterval(() => setPunchTime((prev) => prev + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [punchActive]);

  const togglePunch = async () => {
    if (!punchActive) {
      try { await punchIn(); } catch {}
      setPunchActive(true);
      addNotification('You have punched in successfully.');
    } else {
      try { await punchOut(); } catch {}
      setPunchActive(false);
      const hrs = Math.floor(punchTime / 3600).toString().padStart(2, '0');
      const mins = Math.floor((punchTime % 3600) / 60).toString().padStart(2, '0');
      const secs = (punchTime % 60).toString().padStart(2, '0');
      addNotification(`Checked out. Total hours logged: ${hrs}:${mins}:${secs}`);
      setPunchTime(0);
    }
  };

  const triggerGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
          setGpsCoords(coords);
          addNotification(`GPS Visit checked at ${coords}`);
        },
        () => {
          const mockCoords = `${(12.9716 + (Math.random() - 0.5) * 0.05).toFixed(4)}, ${(77.5946 + (Math.random() - 0.5) * 0.05).toFixed(4)}`;
          setGpsCoords(mockCoords);
          addNotification(`GPS Checked (Mock coordinates): ${mockCoords}`);
        }
      );
    }
  };

  const formatTimer = () => {
    const hrs = Math.floor(punchTime / 3600).toString().padStart(2, '0');
    const mins = Math.floor((punchTime % 3600) / 60).toString().padStart(2, '0');
    const secs = (punchTime % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  // ── Loading splash ────────────────────────────────────────────────────────
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden text-slate-800 dark:text-slate-200">
      
      {/* Sidebar Panel */}
      <aside className={`no-print w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700/60 flex flex-col flex-shrink-0 z-30 transition-transform md:translate-x-0 fixed md:static inset-y-0 left-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 px-6 border-b border-slate-100 dark:border-slate-700/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-brand-500/10 rounded-xl text-brand-600 dark:text-brand-500">
              <HeartHandshake className="w-5 h-5" />
            </span>
            <span className="font-outfit font-bold tracking-tight text-lg text-slate-900 dark:text-white">NGO Tracker</span>
          </div>
          <button onClick={toggleDarkMode} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className="p-4 mx-4 my-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-blue-500 flex items-center justify-center text-white font-bold font-outfit">
            {currentUser.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">{currentUser.name}</h4>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-brand-500/15 text-brand-600 dark:text-brand-400 capitalize">
              {currentUser.role === 'admin' ? 'Administrator' : 'Staff Member'}
            </span>
          </div>
        </div>

        <nav className="flex-grow px-4 space-y-1.5 py-2 overflow-y-auto">
          <button onClick={() => { setActivePanel('dashboard'); setSidebarOpen(false); }} className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${activePanel === 'dashboard' ? 'bg-brand-500 text-white shadow-md shadow-brand-500/15' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}>
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
          <button onClick={() => { setActivePanel('task-manager'); setSidebarOpen(false); }} className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${activePanel === 'task-manager' ? 'bg-brand-500 text-white shadow-md shadow-brand-500/15' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}>
            <CheckSquare className="w-4 h-4" /> Task Management
          </button>
          <button onClick={() => { setActivePanel('calendar-view'); setSidebarOpen(false); }} className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${activePanel === 'calendar-view' ? 'bg-brand-500 text-white shadow-md shadow-brand-500/15' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}>
            <Calendar className="w-4 h-4" /> Calendar View
          </button>
          <button onClick={() => { setActivePanel('daily-log'); setSidebarOpen(false); }} className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${activePanel === 'daily-log' ? 'bg-brand-500 text-white shadow-md shadow-brand-500/15' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}>
            <ClipboardList className="w-4 h-4" /> Daily Work Log
          </button>
          <button onClick={() => { setActivePanel('reports'); setSidebarOpen(false); }} className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${activePanel === 'reports' ? 'bg-brand-500 text-white shadow-md shadow-brand-500/15' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}>
            <BarChart3 className="w-4 h-4" /> Reports &amp; Archive
          </button>
          {currentUser.role === 'admin' && (
            <button onClick={() => { setActivePanel('admin-panel'); setSidebarOpen(false); }} className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${activePanel === 'admin-panel' ? 'bg-brand-500 text-white shadow-md shadow-brand-500/15' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}>
              <Shield className="w-4 h-4 text-emerald-500" /> Admin Panel
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700/40">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all">
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-grow flex flex-col min-w-0 overflow-y-auto h-screen relative">
        
        {/* Header Topbar */}
        <header className="no-print h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/60 px-6 flex items-center justify-between flex-shrink-0 z-20 sticky top-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg mr-2">
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative w-64 md:w-80 max-w-sm hidden sm:block">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              placeholder="Search tasks, categories..." 
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs dark:text-white"
            />
          </div>

          <div className="flex items-center gap-4 ml-auto">
            
            {/* Punch clock */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800">
              <span className="text-xs font-semibold px-2 font-mono text-slate-600 dark:text-slate-400">{formatTimer()}</span>
              <button onClick={togglePunch} className={`px-3 py-1 text-white rounded-lg text-xs font-medium transition-all shadow-sm ${punchActive ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'}`}>
                {punchActive ? 'Punch Out' : 'Punch In'}
              </button>
            </div>

            {/* GPS check */}
            <button onClick={triggerGPS} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-medium transition-all">
              <MapPin className="w-3.5 h-3.5" />
              <span>{gpsCoords ? `Coords: ${gpsCoords}` : 'GPS Checkin'}</span>
            </button>

            {/* In-App Alerts dropdown */}
            <div className="relative">
              <button onClick={() => setNotifDropdownOpen(!notifDropdownOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 relative">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
                )}
              </button>
              
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl p-4 z-50">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700/60 mb-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5"><Bell className="w-4 h-4" /> Alerts</h4>
                    <button onClick={clearNotifications} className="text-xs text-brand-600 dark:text-brand-500 hover:underline">Clear all</button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No notifications yet.</p>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div key={n.id} className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                          <p className="font-medium text-slate-800 dark:text-slate-200">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{n.timestamp}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Content area */}
        <div className="flex-grow p-6 container mx-auto">
          {activePanel === 'dashboard' && (
            <Dashboard 
              currentUser={currentUser} 
              tasks={tasks} 
              logs={logs} 
              gpsCoords={gpsCoords}
              triggerComplete={handleCompleteTask}
            />
          )}

          {activePanel === 'task-manager' && (
            <TaskManagement 
              currentUser={currentUser} 
              tasks={tasks} 
              onCreateTask={handleCreateTask}
              onUpdateTask={handleUpdateTask}
              onCompleteTask={handleCompleteTask}
              onDeleteTask={handleDeleteTask}
              addNotification={addNotification}
              globalSearch={globalSearch}
            />
          )}

          {activePanel === 'calendar-view' && (
            <CalendarView 
              currentUser={currentUser} 
              tasks={tasks} 
              onCompleteTask={handleCompleteTask}
            />
          )}

          {activePanel === 'daily-log' && (
            <DailyWorkLog 
              currentUser={currentUser} 
              tasks={tasks} 
              logs={logs} 
              onRefreshLogs={refreshLogs}
              onCompleteTask={handleCompleteTask}
              addNotification={addNotification}
              gpsCoords={gpsCoords}
            />
          )}

          {activePanel === 'reports' && (
            <ReportsModule 
              currentUser={currentUser} 
              logs={logs} 
              tasks={tasks}
            />
          )}

          {activePanel === 'admin-panel' && (
            <AdminPanel 
              currentUser={currentUser} 
              tasks={tasks} 
              logs={logs}
            />
          )}
        </div>
      </main>
    </div>
  );
}
