import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Download,
  Filter,
  X,
  ChevronDown,
  CheckSquare,
  DollarSign,
  Briefcase,
  History,
  Trash2,
  Edit2,
  Check,
  XCircle,
  User as UserIcon
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { format, startOfWeek, addDays, isSameDay, isWeekend, parseISO } from 'date-fns';
import { TimesheetEntry } from '../types';

export const Timesheet: React.FC = () => {
  const { projects, timesheets, addTimesheetEntry, updateTimesheetEntry, deleteTimesheetEntry, tasks, users } = useAppContext();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimesheetEntry | null>(null);
  const [viewMode, setViewMode] = useState<'personal' | 'team'>(user?.role === 'Employee' ? 'personal' : 'team');
  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const canApprove = user?.role === 'Super Admin' || user?.role === 'Admin';

  // Form State
  const [formData, setFormData] = useState({
    projectId: projects[0]?.id || '',
    taskId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    hours: 0,
    description: '',
    status: 'pending' as 'approved' | 'pending' | 'rejected'
  });

  const handleOpenModal = (entry?: TimesheetEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        projectId: entry.projectId,
        taskId: entry.taskId || '',
        date: entry.date,
        hours: entry.hours,
        description: entry.description || '',
        status: entry.status
      });
    } else {
      setEditingEntry(null);
      setFormData({
        projectId: projects[0]?.id || '',
        taskId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        hours: 0,
        description: '',
        status: 'pending'
      });
    }
    setIsLogModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEntry) {
      updateTimesheetEntry({
        ...editingEntry,
        ...formData
      });
    } else {
      const newEntry: TimesheetEntry = {
        id: `ts${Date.now()}`,
        userId: user?.id || 'u1',
        ...formData
      };
      addTimesheetEntry(newEntry);
    }
    setIsLogModalOpen(false);
  };

  const handleStatusChange = (entryId: string, newStatus: 'approved' | 'rejected') => {
    const entry = timesheets.find(ts => ts.id === entryId);
    if (entry && canApprove) {
      updateTimesheetEntry({ ...entry, status: newStatus });
    }
  };

  const calculateProjectTotal = (projectId: string) => {
    return timesheets
      .filter(ts => ts.projectId === projectId && weekDays.some(day => isSameDay(parseISO(ts.date), day)))
      .reduce((sum, ts) => sum + ts.hours, 0);
  };

  const calculateDayTotal = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return timesheets
      .filter(ts => ts.date === dateStr)
      .reduce((sum, ts) => sum + ts.hours, 0);
  };

  const totalWeeklyHours = timesheets
    .filter(ts => weekDays.some(day => isSameDay(parseISO(ts.date), day)))
    .reduce((sum, ts) => sum + ts.hours, 0);

  const getEntryForDay = (projectId: string, date: Date, userId?: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return timesheets.find(ts => 
      ts.projectId === projectId && 
      ts.date === dateStr && 
      (!userId || ts.userId === userId)
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Timesheet</h1>
          <p className="text-slate-500 mt-1">Track and manage your billable hours across projects.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canApprove && (
            <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm mr-2">
              <button 
                onClick={() => setViewMode('personal')}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                  viewMode === 'personal' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Personal
              </button>
              <button 
                onClick={() => setViewMode('team')}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                  viewMode === 'team' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Team
              </button>
            </div>
          )}

          <div className="flex bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
            <button 
              onClick={() => setCurrentDate(addDays(currentDate, -7))}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="px-6 flex items-center text-sm font-bold text-slate-700 min-w-[200px] justify-center">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </div>
            <button 
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <button className="p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
            <Download size={20} />
          </button>
          
          <button 
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Plus size={20} />
            Log Time
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Hours</p>
            <p className="text-2xl font-bold text-slate-900">{totalWeeklyHours}h</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Billable Amount</p>
            <p className="text-2xl font-bold text-slate-900">${(totalWeeklyHours * 85).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
            <AlertCircle size={28} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Approval</p>
            <p className="text-2xl font-bold text-slate-900">
              {timesheets.filter(ts => ts.status === 'pending').reduce((sum, ts) => sum + ts.hours, 0)}h
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center shadow-inner">
            <History size={28} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efficiency</p>
            <p className="text-2xl font-bold text-slate-900">94%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
              <Calendar className="text-indigo-600" size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {viewMode === 'personal' ? 'My Weekly Overview' : 'Team Weekly Overview'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <CheckCircle2 size={14} />
              Approved
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
              <Clock size={14} />
              Pending
            </span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {viewMode === 'personal' ? (
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-72">Project / Task</th>
                  {weekDays.map(day => (
                    <th key={day.toString()} className="px-4 py-6 text-center">
                      <div className={cn(
                        "text-[10px] font-bold uppercase tracking-widest mb-2",
                        isWeekend(day) ? "text-slate-300" : "text-slate-400"
                      )}>{format(day, 'EEE')}</div>
                      <div className={cn(
                        "text-sm font-bold w-10 h-10 flex items-center justify-center mx-auto rounded-2xl transition-all",
                        isSameDay(day, new Date()) ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : 
                        isWeekend(day) ? "text-slate-300" : "text-slate-700 bg-slate-50"
                      )}>
                        {format(day, 'd')}
                      </div>
                    </th>
                  ))}
                  <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-32">Weekly Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {projects.map(project => (
                  <tr key={project.id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-sm shadow-sm">
                          {project.name.charAt(0)}
                        </div>
                        <div>
                          <span className="block text-sm font-bold text-slate-900">{project.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{project.department || 'Engineering'}</span>
                        </div>
                      </div>
                    </td>
                    {weekDays.map(day => {
                      const entry = getEntryForDay(project.id, day, user?.id);
                      return (
                        <td key={day.toString()} className="px-2 py-6">
                          <div 
                            onClick={() => handleOpenModal(entry)}
                            className={cn(
                              "w-14 h-12 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-sm font-bold text-slate-900 cursor-pointer transition-all hover:border-indigo-300 hover:bg-indigo-50/30 relative",
                              entry?.status === 'approved' && "border-emerald-100 bg-emerald-50/30 text-emerald-700",
                              entry?.status === 'pending' && "border-amber-100 bg-amber-50/30 text-amber-700",
                              entry?.status === 'rejected' && "border-rose-100 bg-rose-50/30 text-rose-700"
                            )}
                          >
                            {entry?.hours || ''}
                            {entry && (
                              <div className={cn(
                                "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm",
                                entry.status === 'approved' ? "bg-emerald-500" : 
                                entry.status === 'rejected' ? "bg-rose-500" : "bg-amber-500"
                              )} />
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-8 py-6 text-center">
                      <span className="inline-flex items-center justify-center px-4 py-2 bg-slate-100 rounded-xl text-sm font-bold text-slate-900 min-w-[60px]">
                        {calculateProjectTotal(project.id)}h
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 space-y-6">
              {timesheets.length === 0 ? (
                <div className="text-center py-12">
                  <History size={48} className="text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold">No timesheet entries found for this period.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {timesheets.map(entry => {
                    const entryUser = users.find(u => u.id === entry.userId);
                    const entryProject = projects.find(p => p.id === entry.projectId);
                    return (
                      <div key={entry.id} className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all">
                        <div className="flex items-center gap-6">
                          <div className="flex -space-x-2">
                            <img src={entryUser?.avatar} className="w-12 h-12 rounded-2xl border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-slate-900">{entryUser?.name}</span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">• {format(parseISO(entry.date), 'EEE, MMM d')}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{entryProject?.name}</span>
                              <span className="text-xs text-slate-500 line-clamp-1">{entry.description}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className="text-xl font-bold text-slate-900">{entry.hours}h</p>
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-widest",
                              entry.status === 'approved' ? "text-emerald-500" : 
                              entry.status === 'rejected' ? "text-rose-500" : "text-amber-500"
                            )}>
                              {entry.status}
                            </span>
                          </div>
                          
                          {canApprove && entry.status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleStatusChange(entry.id, 'approved')}
                                className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                              >
                                <Check size={20} />
                              </button>
                              <button 
                                onClick={() => handleStatusChange(entry.id, 'rejected')}
                                className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                              >
                                <XCircle size={20} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="p-8 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-500 font-medium">
            <span className="font-bold text-slate-900">Note:</span> Changes are saved automatically as drafts. Submit for approval by Friday EOD.
          </p>
          <div className="flex gap-3">
            <button className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm">
              Discard Changes
            </button>
            <button className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
              <Save size={18} />
              Submit for Approval
            </button>
          </div>
        </div>
      </div>

      {/* Log Time Modal */}
      <AnimatePresence>
        {isLogModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLogModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-[40px] shadow-2xl z-[101] overflow-hidden"
            >
              <div className="sticky top-0 z-30 p-8 pt-10 pb-4 bg-white/90 backdrop-blur-md rounded-t-[40px] border-b border-slate-100">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-400 via-indigo-500 to-violet-500" />
                <div className="flex justify-between mb-2">
                  <h2 className="text-xl font-bold text-slate-400">{editingEntry ? 'Edit Time Entry' : 'Log Time Entry'}</h2>
                  <button onClick={() => setIsLogModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
                <div className="flex items-start justify-between gap-4 mt-2">
                  <div className="flex items-end gap-2 w-full">
                    <input 
                      required
                      form="time-form"
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      placeholder="0.0"
                      className="text-4xl font-black text-slate-900 bg-transparent border-none outline-none w-32 placeholder:text-slate-200 tracking-tight"
                      value={formData.hours || ''}
                      onChange={e => setFormData({...formData, hours: parseFloat(e.target.value) || 0})}
                    />
                    <span className="text-xl font-bold text-slate-400 mb-1">hours</span>
                  </div>
                </div>
                <textarea 
                  required
                  form="time-form"
                  placeholder="What did you work on?"
                  rows={2}
                  className="w-full mt-4 text-slate-500 bg-transparent border-none outline-none resize-none placeholder:text-slate-300 leading-relaxed"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <form id="time-form" onSubmit={handleSubmit} className="p-8 space-y-8 pt-6">
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
                  <div className="h-px bg-slate-100" />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
                    <div className="flex items-center gap-4 group md:col-span-2">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors text-indigo-500">
                        <Briefcase size={20} />
                      </div>
                      <div className="flex-1 relative">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Project</p>
                        <select 
                          required
                          className="w-full appearance-none bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
                          value={formData.projectId}
                          onChange={e => setFormData({...formData, projectId: e.target.value, taskId: ''})}
                        >
                          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                        <CheckSquare size={20} />
                      </div>
                      <div className="flex-1 relative">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Task (Optional)</p>
                        <select 
                          className="w-full appearance-none bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
                          value={formData.taskId}
                          onChange={e => setFormData({...formData, taskId: e.target.value})}
                        >
                          <option value="">General Work</option>
                          {tasks.filter(t => t.projectId === formData.projectId).map(t => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <Calendar size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Date</p>
                        <input 
                          required
                          type="date" 
                          className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer appearance-none"
                          style={{ WebkitAppearance: 'none' }}
                          value={formData.date}
                          onChange={e => setFormData({...formData, date: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  {editingEntry && (
                    <button 
                      type="button"
                      onClick={() => {
                        deleteTimesheetEntry(editingEntry.id);
                        setIsLogModalOpen(false);
                      }}
                      className="p-4 bg-rose-50 text-rose-600 rounded-2xl font-bold hover:bg-rose-100 transition-all shadow-sm"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                  <button 
                    type="button"
                    onClick={() => setIsLogModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    {editingEntry ? 'Save Changes' : 'Log Time'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
