import React, { useState, useMemo } from 'react';
import { FileText, FileSpreadsheet, Search } from 'lucide-react';

export default function ReportsModule({ currentUser, logs, tasks }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = useMemo(() => {
    // Show user logs (admin sees all)
    const activeLogs = logs.filter(l => currentUser.role === 'admin' || l.staff === currentUser.email);
    
    return activeLogs.filter(log => {
      const dateMatch = (!startDate || log.date >= startDate) && 
                        (!endDate || log.date <= endDate);
      const catMatch = category === 'all' || log.taskName.toLowerCase().includes(category.toLowerCase());
      const queryStr = searchQuery.toLowerCase();
      const textMatch = !searchQuery || 
                        log.taskName.toLowerCase().includes(queryStr) || 
                        log.remarks.toLowerCase().includes(queryStr) ||
                        log.outcome.toLowerCase().includes(queryStr);
      return dateMatch && catMatch && textMatch;
    });
  }, [logs, startDate, endDate, category, searchQuery, currentUser]);

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Task Name,Outcome,GPS Location,Remarks,Staff Member\n";
    
    filteredLogs.forEach(l => {
      const row = `"${l.date}","${l.taskName}","${l.outcome}","${l.gps || ''}","${l.remarks}","${l.staff}"`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NGO_Work_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold font-outfit dark:text-white">Reports & Archive</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Filter, search and export historical records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold transition-all">
            <FileText className="w-4 h-4" /> Export PDF Report
          </button>
          <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold transition-all">
            <FileSpreadsheet className="w-4 h-4" /> Export Excel (CSV)
          </button>
        </div>
      </div>

      {/* Advanced Filter Box */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 p-5 rounded-2xl shadow-sm space-y-4 no-print">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white font-outfit">Archive Advanced Filter</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Start Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">End Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)} 
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white"
            >
              <option value="all">All Categories</option>
              <option value="Field Visit">Field Visit</option>
              <option value="Community Survey">Community Survey</option>
              <option value="Admin Work">Admin Work</option>
              <option value="Fundraising">Fundraising</option>
              <option value="Health Camp">Health Camp</option>
              <option value="Training">Training</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Search Keywords</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input 
                type="text" 
                placeholder="Search remark, outcome..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white" 
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button 
            onClick={() => { setStartDate(''); setEndDate(''); setCategory('all'); setSearchQuery(''); }} 
            className="text-xs text-slate-400 hover:text-slate-600 py-1.5 px-3"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Printable Report Output Area */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl shadow-sm p-6 overflow-hidden print-container">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-bold text-lg text-slate-950 dark:text-white font-outfit">NGO Performance & Completed Tasks Archive</h3>
            <p className="text-[10px] text-slate-400 mt-1">Generated on {new Date().toLocaleDateString()}</p>
          </div>
          <span className="px-3 py-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold rounded-full no-print">Official Record</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 pr-2">Date</th>
                <th className="pb-3 pr-2">Task Title</th>
                <th className="pb-3 pr-2">Outcome</th>
                <th className="pb-3 pr-2">Remarks</th>
                <th className="pb-3 pr-2">GPS Location</th>
                <th className="pb-3 text-right">Staff Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-600 dark:text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-400">No archived logs found matching the filter options.</td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="text-[11px]">
                    <td className="py-3 font-semibold">{log.date}</td>
                    <td className="py-3 font-medium text-slate-900 dark:text-white">{log.taskName}</td>
                    <td className="py-3">{log.outcome}</td>
                    <td className="py-3 max-w-[200px] truncate">{log.remarks}</td>
                    <td className="py-3 font-mono text-[10px]">{log.gps || 'N/A'}</td>
                    <td className="py-3 text-right">{log.staff}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
