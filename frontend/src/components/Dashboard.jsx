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

  // 1. Task Completion Trend (Past 7 Days dynamic area chart coords)
  const trendChart = useMemo(() => {
    const dates = [];
    const labels = [];
    const counts = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dates.push(dateStr);
      labels.push(d.toLocaleDateString([], { month: 'short', day: 'numeric' }));
      
      const count = logs.filter(l => (currentUser.role === 'admin' || l.staff === currentUser.email) && l.date === dateStr).length;
      counts.push(count);
    }
    
    const maxVal = Math.max(...counts, 1);
    
    // Width of graph is 500px, left margin 50px.
    const points = counts.map((c, idx) => {
      const x = 50 + idx * 65;
      const y = 170 - (c / maxVal) * 130; 
      return { x, y, count: c };
    });

    const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const fillD = `${pathD} L ${points[points.length - 1].x} 170 L ${points[0].x} 170 Z`;
    
    return { labels, points, pathD, fillD, maxVal };
  }, [logs, currentUser]);

  // 2. Category Distribution (Dynamic Donut sectors)
  const categoryDonut = useMemo(() => {
    const categoriesList = ['Field Visit', 'Community Survey', 'Admin Work', 'Fundraising', 'Health Camp', 'Training'];
    const counts = categoriesList.map(cat => myTasks.filter(t => t.category === cat).length);
    const total = counts.reduce((a, b) => a + b, 0);

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];
    const badgeColors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-pink-500', 'bg-slate-500'];

    if (total === 0) {
      return {
        segments: [{ category: 'Empty', percent: 100, strokeDasharray: '100 0', strokeDashoffset: 100, color: '#cbd5e1' }],
        counts: categoriesList.map((c, i) => ({ name: c, count: 0, color: badgeColors[i] }))
      };
    }
    
    let currentOffset = 100;
    const segments = counts.map((c, idx) => {
      const percent = Math.round((c / total) * 100);
      const strokeDasharray = `${percent} ${100 - percent}`;
      const strokeDashoffset = currentOffset;
      currentOffset -= percent;
      return {
        category: categoriesList[idx],
        percent,
        strokeDasharray,
        strokeDashoffset,
        color: colors[idx]
      };
    }).filter(s => s.percent > 0);

    const countsWithColor = categoriesList.map((c, idx) => ({
      name: c,
      count: counts[idx],
      color: badgeColors[idx]
    }));

    return { segments, counts: countsWithColor };
  }, [myTasks]);

  // 3. Weekly Productivity (Monday to Sunday dynamic completed logs counts)
  const weeklyProductivity = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday);

    const counts = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const count = logs.filter(l => (currentUser.role === 'admin' || l.staff === currentUser.email) && l.date === dateStr).length;
      counts.push(count);
    }

    const maxVal = Math.max(...counts, 1);
    
    return counts.map((c, idx) => ({
      day: days[idx],
      height: `${(c / maxVal) * 160}px`,
      count: c
    }));
  }, [logs, currentUser]);

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
              <path d={trendChart.fillD} fill="rgba(59, 130, 246, 0.1)" />
              {/* Curve Line */}
              <path d={trendChart.pathD} fill="none" stroke="#3b82f6" strokeWidth="3" />
              
              {/* Nodes */}
              {trendChart.points.map((p, idx) => (
                <g key={idx}>
                  <circle cx={p.x} cy={p.y} r="4.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                  {p.count > 0 && (
                    <text x={p.x} y={p.y - 10} fill="#3b82f6" fontSize="9" fontWeight="bold" textAnchor="middle">{p.count}</text>
                  )}
                </g>
              ))}

              {/* Labels */}
              {trendChart.labels.map((lbl, idx) => (
                <text key={idx} x={50 + idx * 65} y="190" fill="#94a3b8" fontSize="10" textAnchor="middle">{lbl}</text>
              ))}
            </svg>
          </div>
        </div>

        {/* Donut Chart Category Distribution (SVG) */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-md p-5 rounded-2xl">
          <h3 className="font-bold text-slate-900 dark:text-white font-outfit mb-4">Category Distribution</h3>
          <div className="h-64 flex flex-col justify-center items-center">
            <svg width="150" height="150" viewBox="0 0 36 36" className="transform -rotate-90">
              <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="#f1f5f9" strokeWidth="3" className="dark:stroke-slate-700"></circle>
              {categoryDonut.segments.map((seg, idx) => (
                <circle 
                  key={idx}
                  cx="18" 
                  cy="18" 
                  r="15.91" 
                  fill="transparent" 
                  stroke={seg.color} 
                  strokeWidth="3.2" 
                  strokeDasharray={seg.strokeDasharray} 
                  strokeDashoffset={seg.strokeDashoffset}
                />
              ))}
            </svg>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-4 text-[10px]">
              {categoryDonut.counts.map((c, idx) => (
                <span key={idx} className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <span className={`w-2 h-2 rounded-full ${c.color}`}></span> 
                  {c.name}: <strong>{c.count}</strong>
                </span>
              ))}
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
            {weeklyProductivity.map((p, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 w-8">
                <div className="w-full flex flex-col justify-end items-center group relative h-[160px]">
                  {p.count > 0 && (
                    <span className="absolute bottom-full mb-1 text-[10px] font-bold text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">{p.count}</span>
                  )}
                  <div 
                    className="w-full bg-emerald-500/90 hover:bg-emerald-600 rounded-t-lg transition-all duration-500 cursor-pointer" 
                    style={{ height: p.height }}
                  ></div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{p.day}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
