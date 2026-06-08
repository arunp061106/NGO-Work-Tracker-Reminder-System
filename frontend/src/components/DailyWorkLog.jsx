import React, { useState } from 'react';
import { ClipboardSignature, Image, Check, MapPin, Trash2, Download, X, Loader2 } from 'lucide-react';
import { createLog } from '../api';

export default function DailyWorkLog({ currentUser, tasks, logs, onRefreshLogs, onCompleteTask, addNotification, gpsCoords }) {
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [observations, setObservations] = useState('');
  const [outcome, setOutcome] = useState('');
  const [photoFiles, setPhotoFiles] = useState([]); // { file: File, preview: string }[]
  const [submitting, setSubmitting] = useState(false);
  
  // Lightbox state
  const [lightboxImg, setLightboxImg] = useState(null);

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setPhotoFiles(prev => [...prev, { file, preview: evt.target.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setPhotoFiles(prev => [...prev, { file, preview: evt.target.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeSelectedPhoto = (index) => {
    setPhotoFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTaskId) {
      alert('Please select a task to document.');
      return;
    }

    const task = tasks.find(t => String(t.id) === String(selectedTaskId));
    setSubmitting(true);

    try {
      // Build multipart form data for the backend
      const formData = new FormData();
      formData.append('task_name', task.title);
      formData.append('date', new Date().toISOString().split('T')[0]);
      formData.append('completion_time', new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      formData.append('remarks', remarks);
      formData.append('observations', observations);
      formData.append('outcome', outcome);
      formData.append('gps', gpsCoords || '');
      photoFiles.forEach(({ file }) => formData.append('images', file));

      await createLog(formData);

      // Mark the task as completed
      await onCompleteTask(Number(selectedTaskId));

      // Refresh logs from server
      await onRefreshLogs();

      // Reset form
      setSelectedTaskId('');
      setRemarks('');
      setObservations('');
      setOutcome('');
      setPhotoFiles([]);

      addNotification(`Daily Work Log submitted: "${task.title}"`);
    } catch (err) {
      alert(`Failed to submit log: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const pendingTasks = tasks.filter(t => t.status !== 'Completed' && (currentUser.role === 'admin' || t.staff_id === currentUser.id));
  const myLogs = logs.filter(l => currentUser.role === 'admin' || l.staff_id === currentUser.id);

  // Backend base URL for serving uploaded photos
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  return (
    <div className="space-y-6 fade-in">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold font-outfit dark:text-white">Daily Work Log</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Upload evidence photos, record outcome observations and achievements</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Submission Form */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-md p-6 rounded-2xl lg:col-span-1 h-fit space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white font-outfit border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
            <ClipboardSignature className="w-5 h-5 text-brand-500" /> Record Completed Work
          </h3>

          <form onSubmit={handleLogSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Select Completed Task</label>
              <select 
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs dark:text-white"
              >
                <option value="" disabled>Choose a pending task...</option>
                {pendingTasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title} ({t.category})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Remarks</label>
              <textarea 
                rows="2" 
                required 
                placeholder="What was achieved?" 
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Observations</label>
              <textarea 
                rows="2" 
                placeholder="Field difficulties or local suggestions" 
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Outcome</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. 50 families distributed kits" 
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs dark:text-white"
              />
            </div>

            {/* Photos Uploader */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Evidence Photos</label>
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload-input').click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-xl p-4 text-center cursor-pointer transition-colors flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/10"
              >
                <Image className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-[11px] text-slate-500">Drag &amp; drop files or <span className="text-brand-500 font-semibold">Browse</span></span>
                <input 
                  type="file" 
                  id="file-upload-input" 
                  multiple 
                  accept="image/*" 
                  onChange={handlePhotoSelect} 
                  className="hidden" 
                />
              </div>

              {/* Photos Previews */}
              {photoFiles.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {photoFiles.map(({ preview }, index) => (
                    <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                      <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                      <button 
                        type="button" 
                        onClick={() => removeSelectedPhoto(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={submitting} className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-semibold rounded-xl text-xs shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-1 disabled:opacity-70">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {submitting ? 'Submitting...' : 'Submit Work Log'}
            </button>
          </form>
        </div>

        {/* Logs Feed Panel */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-md p-6 rounded-2xl lg:col-span-2 flex flex-col h-[580px]">
          <h3 className="font-bold text-slate-900 dark:text-white font-outfit border-b border-slate-100 dark:border-slate-700 pb-3 flex justify-between items-center">
            <span>Recent Work Logs Feed</span>
            <span className="text-xs text-slate-400">{myLogs.length} Entries</span>
          </h3>

          <div className="flex-grow overflow-y-auto space-y-4 pt-4 pr-1">
            {myLogs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-20">No logged achievements recorded.</p>
            ) : (
              myLogs.slice().reverse().map(log => (
                <div key={log.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl flex flex-col space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-slate-950 dark:text-white font-outfit">{log.taskName}</h4>
                      <span className="text-[9px] text-slate-400">Staff ID {log.staff_id} | {log.date} @ {log.completionTime}</span>
                    </div>
                    {log.gps && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-500 py-0.5 px-2 bg-emerald-500/10 rounded-full">
                        <MapPin className="w-2.5 h-2.5" /> {log.gps}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <div><span className="font-bold text-slate-700 dark:text-slate-300 block">Remarks:</span> {log.remarks}</div>
                    <div><span className="font-bold text-slate-700 dark:text-slate-300 block">Observations:</span> {log.observations || 'N/A'}</div>
                    <div><span className="font-bold text-slate-700 dark:text-slate-300 block">Outcome:</span> {log.outcome}</div>
                  </div>

                  {/* Backend-served photo gallery */}
                  {log.photos && log.photos.length > 0 && (
                    <div className="grid grid-cols-5 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {log.photos.map((photo, pIdx) => (
                        <div 
                          key={pIdx} 
                          className="aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer" 
                          onClick={() => setLightboxImg(`${API_BASE}${photo.cloudinary_url}`)}
                        >
                          <img 
                            src={`${API_BASE}${photo.cloudinary_url}`} 
                            className="w-full h-full object-cover hover:scale-110 transition-transform" 
                            alt="Evidence" 
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button onClick={() => setLightboxImg(null)} className="absolute top-4 right-4 p-2 text-white bg-white/10 hover:bg-white/25 rounded-full">
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl max-h-full flex flex-col items-center">
            <img src={lightboxImg} alt="Evidence Large" className="max-w-full max-h-[80vh] rounded-lg object-contain shadow-2xl" />
            <a href={lightboxImg} download="evidence.png" className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1">
              <Download className="w-4 h-4" /> Download Image
            </a>
          </div>
        </div>
      )}

    </div>
  );
}
