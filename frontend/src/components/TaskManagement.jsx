import React, { useState, useMemo } from 'react';
import { PlusCircle, Edit3, Trash2, Calendar, MapPin, AlertCircle, X, Check } from 'lucide-react';

export default function TaskManagement({ currentUser, tasks, updateTasks, addNotification, globalSearch }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  // Filters
  const [filterCat, setFilterCat] = useState('all');
  const [filterPri, setFilterPri] = useState('all');
  const [filterStat, setFilterStat] = useState('all');

  // Form Fields
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Field Visit');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [reminder, setReminder] = useState('60');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const myTasks = useMemo(() => {
    return tasks.filter(t => currentUser.role === 'admin' || t.staff === currentUser.email);
  }, [tasks, currentUser]);

  const filteredTasks = useMemo(() => {
    return myTasks.filter(t => {
      const catMatch = filterCat === 'all' || t.category === filterCat;
      const priMatch = filterPri === 'all' || t.priority === filterPri;
      const statMatch = filterStat === 'all' || t.status === filterStat;
      
      const searchStr = globalSearch.toLowerCase();
      const searchMatch = !globalSearch || 
        t.title.toLowerCase().includes(searchStr) || 
        t.category.toLowerCase().includes(searchStr) ||
        (t.notes && t.notes.toLowerCase().includes(searchStr));

      return catMatch && priMatch && statMatch && searchMatch;
    });
  }, [myTasks, filterCat, filterPri, filterStat, globalSearch]);

  const handleOpenModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setTitle(task.title);
      setDesc(task.desc);
      setCategory(task.category);
      setPriority(task.priority);
      setDueDate(task.dueDate);
      setDueTime(task.dueTime);
      setReminder(task.reminder);
      setLocation(task.location || '');
      setNotes(task.notes || '');
    } else {
      setEditingTask(null);
      setTitle('');
      setDesc('');
      setCategory('Field Visit');
      setPriority('Medium');
      setDueDate('');
      setDueTime('');
      setReminder('60');
      setLocation('');
      setNotes('');
    }
    setModalOpen(true);
  };

  const handleSaveTask = (e) => {
    e.preventDefault();
    if (editingTask) {
      // Update
      const updated = tasks.map(t => t.id === editingTask.id ? {
        ...t, title, desc, category, priority, dueDate, dueTime, reminder, location, notes
      } : t);
      updateTasks(updated);
      addNotification(`Task updated: ${title}`);
    } else {
      // Create new
      const newTask = {
        id: 't-' + Date.now(),
        title, desc, category, priority, dueDate, dueTime, reminder, location, notes,
        status: 'Pending',
        staff: currentUser.email
      };
      updateTasks([...tasks, newTask]);
      addNotification(`New task created: ${title}`);
    }
    setModalOpen(false);
  };

  const handleDeleteTask = (id) => {
    if (confirm("Are you sure you want to delete this task?")) {
      const updated = tasks.filter(t => t.id !== id);
      updateTasks(updated);
      addNotification("Task deleted successfully.");
    }
  };

  const handleQuickComplete = (id) => {
    const updated = tasks.map(t => t.id === id ? { ...t, status: 'Completed' } : t);
    updateTasks(updated);
    addNotification(`Task completed: ${tasks.find(t => t.id === id).title}`);
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-outfit dark:text-white">Task Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create, view, filter, and track daily tasks</p>
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10">
          <PlusCircle className="w-4 h-4" /> Create Task
        </button>
      </div>

      {/* Task Filters */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 p-4 rounded-2xl flex flex-wrap items-center gap-3 shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-2">Filters:</span>
        
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300">
          <option value="all">All Categories</option>
          <option value="Field Visit">Field Visit</option>
          <option value="Community Survey">Community Survey</option>
          <option value="Admin Work">Admin Work</option>
          <option value="Fundraising">Fundraising</option>
          <option value="Health Camp">Health Camp</option>
          <option value="Training">Training</option>
        </select>

        <select value={filterPri} onChange={(e) => setFilterPri(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300">
          <option value="all">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select value={filterStat} onChange={(e) => setFilterStat(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300">
          <option value="all">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Overdue">Overdue</option>
        </select>

        <button onClick={() => { setFilterCat('all'); setFilterPri('all'); setFilterStat('all'); }} className="text-xs text-slate-400 hover:text-brand-600 transition-all">Reset Filters</button>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-400">No tasks match your filter configurations. Create one to begin!</p>
          </div>
        ) : (
          filteredTasks.map(t => {
            let statusColor = "bg-amber-500/10 text-amber-600 dark:text-amber-500";
            if (t.status === 'Completed') statusColor = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
            if (t.status === 'In Progress') statusColor = "bg-blue-500/10 text-blue-600 dark:text-blue-400";
            if (t.status === 'Overdue') statusColor = "bg-red-500/10 text-red-600 dark:text-red-400";

            return (
              <div key={t.id} className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400">{t.category}</span>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-semibold ${statusColor}`}>{t.status}</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-950 dark:text-white">{t.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2">{t.desc || 'No description provided.'}</p>
                  
                  <div className="mt-4 space-y-1.5 border-t border-slate-50 dark:border-slate-700/40 pt-3">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Due: {t.dueDate} @ {t.dueTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Location: {t.location || 'Not Specified'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Priority: <span className={`font-semibold ${t.priority === 'High' ? 'text-red-500' : t.priority === 'Medium' ? 'text-amber-500' : 'text-blue-500'}`}>{t.priority}</span></span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-50 dark:border-slate-700/40 flex justify-between gap-2">
                  <button 
                    onClick={() => handleQuickComplete(t.id)} 
                    disabled={t.status === 'Completed'} 
                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30 disabled:hover:bg-emerald-500 text-white font-semibold rounded-lg text-[10px] flex items-center gap-1 transition-all"
                  >
                    <Check className="w-3 h-3" /> Finish
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => handleOpenModal(t)} className="p-1 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-brand-500 transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteTask(t.id)} className="p-1 border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-slate-500 hover:text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200/60 dark:border-slate-700/60 scale-100 transition-all">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/60 flex justify-between items-center">
              <h3 className="font-bold text-base text-slate-950 dark:text-white font-outfit">{editingTask ? 'Edit Existing Task' : 'Create New Task'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSaveTask} className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Task Title</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Conduct village health screening" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs dark:text-white"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                <textarea 
                  rows="2.5" 
                  placeholder="Include goals, context, or checklist..." 
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs dark:text-white"
                  >
                    <option value="Field Visit">Field Visit</option>
                    <option value="Community Survey">Community Survey</option>
                    <option value="Admin Work">Admin Work</option>
                    <option value="Fundraising">Fundraising</option>
                    <option value="Health Camp">Health Camp</option>
                    <option value="Training">Training</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Priority Level</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs dark:text-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Due Date</label>
                  <input 
                    type="date" 
                    required 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Due Time</label>
                  <input 
                    type="time" 
                    required 
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reminder Setting</label>
                  <select 
                    value={reminder}
                    onChange={(e) => setReminder(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs dark:text-white"
                  >
                    <option value="5">5 minutes before</option>
                    <option value="15">15 minutes before</option>
                    <option value="30">30 minutes before</option>
                    <option value="60">1 hour before</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Task Location</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Community Center A" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Additional Notes</label>
                <input 
                  type="text" 
                  placeholder="Contact person info..." 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs dark:text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/10">Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
