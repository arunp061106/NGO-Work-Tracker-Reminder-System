import React, { useMemo } from 'react';
import { Clipboard, Clock, CheckCircle, AlertTriangle, Sparkles, Check } from 'lucide-react';

export default function Dashboard({ currentUser, tasks, logs, gpsCoords, triggerComplete }) {
  
  // Tasks filtered for the currently logged in user
  const myTasks = useMemo(() => {
    return tasks.filter(t => currentUser.role === 'admin' || t.staff === currentUser.email);
  }, [tasks, currentUser]);

  const stats = useMemo(() => {
    const total = myTasks.length;
    const pending = myTasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
    const completed = myTasks.filter(t => t.status === 'Completed').length;
    const high = myTasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length;
    return { total, pending, completed, high };
  }, [myTasks]);

  const todayTasksList = useMemo(() => {
    return myTasks.filter(t => t.status !== 'Completed');
  }, [myTasks]);

  // AI Summary text generator
  const aiSummary = useMemo(() => {
    const userLogs = logs.filter(l => currentUser.role === 'admin' || l.staff === currentUser.email);
    const completedCount = stats.completed;
    const gpsCount = userLogs.filter(l => l.gps).length;
    
    return `Today you have completed ${completedCount} task${completedCount === 1 ? '' : 's'}. You conducted ${gpsCount} field/community visit${gpsCount === 1 ? '' : 's'} with logged GPS coordinates. Complete your remaining ${stats.pending} task${stats.pending === 1 ? '' : 's'} to meet today's quota!`;
  }, [logs, stats, currentUser]);

  return (
    <div className="space-y-6 fade-in">
      
      {/* Top Welcome Banner with AI Summary */}
      <div className="bg-gradient-to-r from-brand-600 via-blue-500 to-indigo-600 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-brand-500/10 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-extrabold font-outfit tracking-tight">Welcome back, {currentUser.name.split(' ')[0]}!</h2>
          <p className="text-white/80 text-sm mt-1.5">Here is your customized NGO impact report and activities summaries.</p>
          
          <div className="mt-6 p-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl">
            <div className="flex items-center gap-2 text-white font-semibold text-xs tracking-wider uppercase mb-1.5">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" /> AI Generated Daily Summary
            </div>
            <p className="text-sm text-white/95 leading-relaxed">
              "{aiSummary}"
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-lg shadow-slate-100/50 dark:shadow-none p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Tasks</span>
            <span className="text-2xl md:text-3xl font-extrabold font-outfit mt-1 block dark:text-white">{stats.total}</span>
          </div>
          <div className="p-3 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl">
            <Clipboard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-lg shadow-slate-100/50 dark:shadow-none p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Pending Tasks</span>
            <span className="text-2xl md:text-3xl font-extrabold font-outfit mt-1 block dark:text-white">{stats.pending}</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-lg shadow-slate-100/50 dark:shadow-none p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Completed</span>
            <span className="text-2xl md:text-3xl font-extrabold font-outfit mt-1 block dark:text-white">{stats.completed}</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-lg shadow-slate-100/50 dark:shadow-none p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">High Priority</span>
            <span className="text-2xl md:text-3xl font-extrabold font-outfit mt-1 block dark:text-white">{stats.high}</span>
          </div>
          <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SVG Interactive Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Completion Trend Curve (SVG) */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-md p-5 rounded-2xl lg:col-span-2">
          <h3 className="font-bold text-slate-900 dark:text-white font-outfit mb-4">Task Completion Trend</h3>
          <div className="h-64 w-full relative">
            <svg viewBox="0 0 500 200" className="w-full h-full">
              {/* Grid Lines */}
              <line x1="50" y1="20" x2="480" y2="20" stroke="#e2e8f0" strokeDasharray="4" className="dark:stroke-slate-700" />
              <line x1="50" y1="80" x2="480" y2="80" stroke="#e2e8f0" strokeDasharray="4" className="dark:stroke-slate-700" />
              <line x1="50" y1="140" x2="480" y2="140" stroke="#e2e8f0" strokeDasharray="4" className="dark:stroke-slate-700" />
              
              {/* Curve Fill Area */}
              <path d="M 50 170 L 120 120 L 190 140 L 260 70 L 330 110 L 400 40 L 400 170 Z" fill="rgba(59, 130, 246, 0.1)" />
              {/* Curve Line */}
              <path d="M 50 170 L 120 120 L 190 140 L 260 70 L 330 110 L 400 40" fill="none" stroke="#3b82f6" strokeWidth="3" />
              
              {/* Nodes */}
              <circle cx="50" cy="170" r="4" fill="#3b82f6" />
              <circle cx="120" cy="120" r="4" fill="#3b82f6" />
              <circle cx="190" cy="140" r="4" fill="#3b82f6" />
              <circle cx="260" cy="70" r="4" fill="#3b82f6" />
              <circle cx="330" cy="110" r="4" fill="#3b82f6" />
              <circle cx="400" cy="40" r="4" fill="#3b82f6" />

              {/* Labels */}
              <text x="50" y="190" fill="#94a3b8" fontSize="10" textAnchor="middle">Jun 2</text>
              <text x="120" y="190" fill="#94a3b8" fontSize="10" textAnchor="middle">Jun 3</text>
              <text x="190" y="190" fill="#94a3b8" fontSize="10" textAnchor="middle">Jun 4</text>
              <text x="260" y="190" fill="#94a3b8" fontSize="10" textAnchor="middle">Jun 5</text>
              <text x="330" y="190" fill="#94a3b8" fontSize="10" textAnchor="middle">Jun 6</text>
              <text x="400" y="190" fill="#94a3b8" fontSize="10" textAnchor="middle">Jun 7</text>
            </svg>
          </div>
        </div>

        {/* Donut Chart Category Distribution (SVG) */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-md p-5 rounded-2xl">
          <h3 className="font-bold text-slate-900 dark:text-white font-outfit mb-4">Category Distribution</h3>
          <div className="h-64 flex flex-col justify-center items-center">
            <svg width="150" height="150" viewBox="0 0 36 36" className="transform -rotate-90">
              <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="#f1f5f9" strokeWidth="3" className="dark:stroke-slate-700"></circle>
              {/* Segment 1: Field Visit (40%) */}
              <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="#3b82f6" strokeWidth="3.2" strokeDasharray="40 60" strokeDashoffset="100"></circle>
              {/* Segment 2: Health Camp (30%) */}
              <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="#10b981" strokeWidth="3.2" strokeDasharray="30 70" strokeDashoffset="60"></circle>
              {/* Segment 3: Other (30%) */}
              <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="#f59e0b" strokeWidth="3.2" strokeDasharray="30 70" strokeDashoffset="30"></circle>
            </svg>
            <div className="grid grid-cols-3 gap-2 mt-4 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> Field Visit</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Health Camp</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-full"></span> Admin Work</span>
            </div>
          </div>
        </div>

      </div>

      {/* Task Checklist & Bar Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Today's Tasks */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-md p-5 rounded-2xl flex flex-col h-[350px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white font-outfit">Today's Tasks</h3>
            <span className="text-xs bg-brand-500/10 text-brand-600 dark:text-brand-400 py-1 px-2.5 rounded-full font-medium">
              {todayTasksList.length} Remaining
            </span>
          </div>
          <div className="flex-grow overflow-y-auto space-y-2.5 pr-1">
            {todayTasksList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-20">No tasks pending for today. Well done!</p>
            ) : (
              todayTasksList.slice(0, 5).map(t => (
                <div key={t.id} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between hover:border-brand-500/20 transition-all">
                  <div className="flex items-center gap-3">
                    <button onClick={() => triggerComplete(t.id)} className="p-1 border border-slate-200 dark:border-slate-700 hover:bg-emerald-500/10 hover:border-emerald-500/50 rounded-lg text-slate-400 hover:text-emerald-500 transition-colors">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white">{t.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">{t.category}</span>
                        <span className={`text-[9px] font-bold ${t.priority === 'High' ? 'text-red-500' : 'text-blue-500'}`}>{t.priority}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{t.dueDate}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Weekly Productivity SVG Bars */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-md p-5 rounded-2xl flex flex-col h-[350px]">
          <h3 className="font-bold text-slate-900 dark:text-white font-outfit mb-4">Weekly Productivity</h3>
          <div className="flex-grow flex items-end justify-between px-4 pb-2 pt-6">
            {/* Mon */}
            <div className="flex flex-col items-center gap-2 w-8">
              <div className="w-full bg-emerald-500/90 rounded-t-lg transition-all duration-500" style={{ height: '80px' }}></div>
              <span className="text-[10px] text-slate-400 font-medium">Mon</span>
            </div>
            {/* Tue */}
            <div className="flex flex-col items-center gap-2 w-8">
              <div className="w-full bg-emerald-500/90 rounded-t-lg transition-all duration-500" style={{ height: '120px' }}></div>
              <span className="text-[10px] text-slate-400 font-medium">Tue</span>
            </div>
            {/* Wed */}
            <div className="flex flex-col items-center gap-2 w-8">
              <div className="w-full bg-emerald-500/90 rounded-t-lg transition-all duration-500" style={{ height: '60px' }}></div>
              <span className="text-[10px] text-slate-400 font-medium">Wed</span>
            </div>
            {/* Thu */}
            <div className="flex flex-col items-center gap-2 w-8">
              <div className="w-full bg-emerald-500/90 rounded-t-lg transition-all duration-500" style={{ height: '140px' }}></div>
              <span className="text-[10px] text-slate-400 font-medium">Thu</span>
            </div>
            {/* Fri */}
            <div className="flex flex-col items-center gap-2 w-8">
              <div className="w-full bg-emerald-500/90 rounded-t-lg transition-all duration-500" style={{ height: '100px' }}></div>
              <span className="text-[10px] text-slate-400 font-medium">Fri</span>
            </div>
            {/* Sat */}
            <div className="flex flex-col items-center gap-2 w-8">
              <div className="w-full bg-emerald-500/90 rounded-t-lg transition-all duration-500" style={{ height: '160px' }}></div>
              <span className="text-[10px] text-slate-400 font-medium">Sat</span>
            </div>
            {/* Sun */}
            <div className="flex flex-col items-center gap-2 w-8">
              <div className="w-full bg-emerald-500/90 rounded-t-lg transition-all duration-500" style={{ height: '40px' }}></div>
              <span className="text-[10px] text-slate-400 font-medium">Sun</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
