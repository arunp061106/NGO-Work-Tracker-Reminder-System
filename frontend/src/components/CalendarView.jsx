import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarView({ currentUser, tasks, updateTasks }) {
  const [view, setView] = useState('month'); // 'month' | 'week' | 'day'
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 7)); // June 7, 2026

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const myTasks = useMemo(() => {
    return tasks.filter(t => currentUser.role === 'admin' || t.staff === currentUser.email);
  }, [tasks, currentUser]);

  const changePeriod = (val) => {
    const nextDate = new Date(currentDate);
    if (view === 'month') {
      nextDate.setMonth(currentDate.getMonth() + val);
    } else if (view === 'week') {
      nextDate.setDate(currentDate.getDate() + (val * 7));
    } else {
      nextDate.setDate(currentDate.getDate() + val);
    }
    setCurrentDate(nextDate);
  };

  // Month Grid calculations
  const monthGridData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const blanks = Array(firstDayIndex).fill(null);
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    
    return { blanks, days, year, month };
  }, [currentDate]);

  // Week Grid calculations
  const weekGridData = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentDate]);

  const handleDropSimulation = (taskId, newDateStr) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, dueDate: newDateStr } : t);
    updateTasks(updated);
    alert(`Simulation: Rescheduled task to ${newDateStr}`);
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-outfit dark:text-white">Calendar View</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Plan activities, set reminders and coordinate visits</p>
        </div>
        {/* Toggle Views */}
        <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl">
          <button onClick={() => setView('month')} className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all ${view === 'month' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Month</button>
          <button onClick={() => setView('week')} className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all ${view === 'week' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Week</button>
          <button onClick={() => setView('day')} className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all ${view === 'day' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Day</button>
        </div>
      </div>

      {/* Selector Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 p-4 rounded-2xl shadow-sm">
        <button onClick={() => changePeriod(-1)} className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="font-bold text-base text-slate-950 dark:text-white font-outfit">
          {view === 'month' && `${monthNames[monthGridData.month]} ${monthGridData.year}`}
          {view === 'week' && `Week of ${weekGridData[0].getDate()} ${monthNames[weekGridData[0].getMonth()]} ${weekGridData[0].getFullYear()}`}
          {view === 'day' && `${currentDate.getDate()} ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
        </h3>
        <button onClick={() => changePeriod(1)} className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Monthly Layout */}
      {view === 'month' && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-4 shadow-sm overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-7 text-center font-bold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-3 mb-2">
              <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {monthGridData.blanks.map((_, idx) => (
                <div key={`blank-${idx}`} className="bg-slate-100/30 dark:bg-slate-900/10 border border-slate-200/40 dark:border-slate-800/40 rounded-xl p-2 min-h-[100px]"></div>
              ))}
              {monthGridData.days.map(day => {
                const dateStr = `${monthGridData.year}-${(monthGridData.month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                const dayTasks = myTasks.filter(t => t.dueDate === dateStr);
                const isToday = dateStr === '2026-06-07';

                return (
                  <div 
                    key={`day-${day}`} 
                    className={`border rounded-2xl p-2 min-h-[100px] flex flex-col justify-between ${isToday ? 'bg-brand-500/5 border-brand-500/40' : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800'}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropSimulation('t-1', dateStr)} // Simulating drag and drop
                  >
                    <span className={`text-xs font-bold ${isToday ? 'text-brand-600 dark:text-brand-500 font-extrabold' : 'text-slate-500 dark:text-slate-400'}`}>{day}</span>
                    <div className="flex-grow overflow-y-auto space-y-1 mt-1">
                      {dayTasks.map(t => (
                        <div key={t.id} className="text-[9px] px-1.5 py-0.5 rounded font-semibold truncate bg-brand-500/10 text-brand-600 dark:text-brand-400">
                          {t.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Weekly Layout */}
      {view === 'week' && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-4 shadow-sm overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-7 text-center font-bold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-3 mb-2">
              {weekGridData.map((day, idx) => (
                <div key={`week-header-${idx}`}>
                  {day.toLocaleDateString([], { weekday: 'short' })} {day.getDate()}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 min-h-[300px]">
              {weekGridData.map((day, idx) => {
                const dateStr = `${day.getFullYear()}-${(day.getMonth() + 1).toString().padStart(2, '0')}-${day.getDate().toString().padStart(2, '0')}`;
                const dayTasks = myTasks.filter(t => t.dueDate === dateStr);

                return (
                  <div key={`week-col-${idx}`} className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-2.5 space-y-1.5">
                    {dayTasks.length === 0 ? (
                      <span className="text-[9px] text-slate-400 italic block text-center mt-4">Free</span>
                    ) : (
                      dayTasks.map(t => (
                        <div key={t.id} className="p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px]">
                          <span className="font-bold text-slate-900 dark:text-white block truncate">{t.title}</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">{t.dueTime}</span>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Daily Layout */}
      {view === 'day' && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm">
          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2 flex justify-between items-center">
              <span>Task Timeline</span>
              <span className="text-sm font-normal text-slate-400">{currentDate.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </h3>
            
            {(() => {
              const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
              const dayTasks = myTasks.filter(t => t.dueDate === dateStr);
              
              if (dayTasks.length === 0) {
                return <p className="text-xs text-slate-400 text-center py-20">No tasks scheduled for this date.</p>;
              }
              
              return dayTasks.map(t => (
                <div key={t.id} className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${t.priority === 'High' ? 'bg-red-500' : t.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white">{t.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{t.desc || 'No description'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{t.dueTime}</span>
                    <span className="text-[9px] text-slate-400">{t.category}</span>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

    </div>
  );
}
