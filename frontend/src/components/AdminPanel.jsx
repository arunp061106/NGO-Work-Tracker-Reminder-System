import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Users, Layers, Image, MapPin } from 'lucide-react';

export default function AdminPanel({ currentUser, tasks, logs }) {
  const [usersList, setUsersList] = useState([]);

  // Load and cache demo users
  useEffect(() => {
    const db = JSON.parse(localStorage.getItem('ngo_work_tracker_db'));
    if (db && db.users) {
      setUsersList(db.users);
    } else {
      const defaultUsers = [
        { name: 'John Doe', email: 'staff@ngo.org', role: 'staff', tasksCompleted: 4, punchStatus: 'PUNCHED_OUT' },
        { name: 'Sarah Connor', email: 'admin@ngo.org', role: 'admin', tasksCompleted: 8, punchStatus: 'PUNCHED_IN' },
        { name: 'Jane Foster', email: 'jane@ngo.org', role: 'staff', tasksCompleted: 2, punchStatus: 'PUNCHED_OUT' }
      ];
      setUsersList(defaultUsers);
    }
  }, []);

  const handleToggleRole = (email) => {
    const updated = usersList.map(u => u.email === email ? {
      ...u, role: u.role === 'admin' ? 'staff' : 'admin'
    } : u);
    setUsersList(updated);

    // Sync back to master database mock
    const db = JSON.parse(localStorage.getItem('ngo_work_tracker_db')) || {};
    db.users = updated;
    localStorage.setItem('ngo_work_tracker_db', JSON.stringify(db));
  };

  // Metrics summary
  const summary = useMemo(() => {
    const totalStaff = usersList.length;
    const orgTasks = tasks.length;
    const gpsVisits = logs.filter(l => l.gps).length;
    
    return { totalStaff, orgTasks, gpsVisits };
  }, [usersList, tasks, logs]);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-outfit dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-500" /> Admin Management Panel
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Audit organization-wide productivity, attendance lists, and staff authorization</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-400 uppercase tracking-wider block font-bold">Total Staff</span>
          <span className="text-2xl font-black font-outfit mt-1 dark:text-white">{summary.totalStaff}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-400 uppercase tracking-wider block font-bold">Org Total Tasks</span>
          <span className="text-2xl font-black font-outfit mt-1 dark:text-white">{summary.orgTasks}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-400 uppercase tracking-wider block font-bold">GPS Visits Conducted</span>
          <span className="text-2xl font-black font-outfit mt-1 dark:text-white">{summary.gpsVisits}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-400 uppercase tracking-wider block font-bold">Active Submissions</span>
          <span className="text-2xl font-black font-outfit mt-1 dark:text-white">{logs.length} Logs</span>
        </div>
      </div>

      {/* Users Admin Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl shadow-sm p-6">
        <h3 className="font-bold text-base text-slate-950 dark:text-white font-outfit mb-4">NGO Staff Users Management</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3">Staff Name</th>
                <th className="pb-3">Email Address</th>
                <th className="pb-3">Authorization Role</th>
                <th className="pb-3">Logged Activities</th>
                <th className="pb-3">Punch State</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-600 dark:text-slate-300">
              {usersList.map((u) => (
                <tr key={u.email} className="text-[11px]">
                  <td className="py-3 font-semibold text-slate-900 dark:text-white">{u.name}</td>
                  <td className="py-3 text-slate-500">{u.email}</td>
                  <td className="py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${u.role === 'admin' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-brand-500/10 text-brand-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 font-semibold">{u.tasksCompleted || 0} tasks</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1.5 font-bold">
                      <span className={`w-1.5 h-1.5 rounded-full ${u.punchStatus === 'PUNCHED_IN' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      {u.punchStatus === 'PUNCHED_IN' ? 'Active In Field' : 'Offline'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button 
                      onClick={() => handleToggleRole(u.email)} 
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-lg text-[10px] transition-all"
                    >
                      Toggle Authorization
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
