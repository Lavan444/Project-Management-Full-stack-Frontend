import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Users,
  LayoutGrid,
  List,
  ChevronRight,
  Clock,
  AlertCircle,
  Heart,
  Edit2,
  Trash2,
  X,
  ChevronDown,
  Paperclip,
  Flag,
  MessageSquare
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Project, ProjectStatus, ProjectHealth, Attachment, Task, Priority, Status } from '../types';
import { MemberAvatar } from '../components/MemberAvatar';
import { AvatarGroup } from '../components/AvatarGroup';
import { MultiSelectMembers } from '../components/MultiSelectMembers';
import { FileUploader } from '../components/FileUploader';

export const Projects: React.FC = () => {
  const { projects, users, addProject, updateProject, deleteProject, addTask } = useAppContext();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'tasks'>('details');
  const [isNewlyCreated, setIsNewlyCreated] = useState(false);

  const canManageProjects = user?.role === 'Super Admin' || user?.role === 'Admin';

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Active' as ProjectStatus,
    health: 'Healthy' as ProjectHealth,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    members: [] as string[],
    attachments: [] as Attachment[],
    tasks: [] as Partial<Task>[]
  });

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (project?: Project) => {
    if (!canManageProjects) return;
    setActiveTab('details');
    setIsNewlyCreated(false);
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description,
        status: project.status,
        health: project.health,
        startDate: project.startDate,
        endDate: project.endDate,
        members: project.members,
        attachments: [],
        tasks: project.tasks || []
      });
    } else {
      setEditingProject(null);
      setFormData({
        name: '',
        description: '',
        status: 'Active',
        health: 'Healthy',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        members: [],
        attachments: [],
        tasks: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject) {
      if (isNewlyCreated && activeTab === 'tasks') {
        // "Save Tasks & Finish" — create each task via the API
        for (const t of formData.tasks) {
          if (!t.title?.trim()) continue;
          await addTask(editingProject.id, {
            title: t.title || '',
            description: t.description || '',
            status: (t.status as any) || 'todo',
            priority: (t.priority as any) || 'medium',
            dueDate: t.dueDate || formData.endDate,
            assigneeId: (t as any).assigneeId || '',
            assigneeIds: [],
            subtasks: [],
            labels: [],
            projectId: editingProject.id,
            comments: [],
          });
        }
        setIsModalOpen(false);
      } else {
        // Normal edit — update project fields only
        await updateProject({
          ...editingProject,
          ...formData,
          tasks: editingProject.tasks,
        });
        setIsModalOpen(false);
      }
    } else {
      // Create mode — let the backend assign the real MongoDB ObjectId
      try {
        const created = await addProject({
          organizationId: user?.organizationId || '',
          name: formData.name,
          description: formData.description,
          status: formData.status,
          health: formData.health,
          startDate: formData.startDate,
          endDate: formData.endDate,
          members: formData.members,
          progress: 0,
          tasks: [],
          files: []
        });
        // Use the real project with its backend-assigned _id for the task step
        setEditingProject(created);
        setIsNewlyCreated(true);
        setActiveTab('tasks');
      } catch {
        // error shown by addProject via showToast
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'On Hold': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'At Risk': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'Healthy': return 'text-emerald-500';
      case 'At Risk': return 'text-amber-500';
      case 'Critical': return 'text-rose-500';
      default: return 'text-slate-400';
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-blue-500';
      case 'Completed': return 'bg-emerald-500';
      case 'On Hold': return 'bg-amber-500';
      case 'At Risk': return 'bg-rose-500';
      case 'todo': return 'bg-slate-300';
      case 'in-progress': return 'bg-blue-500';
      case 'review': return 'bg-amber-500';
      case 'done': return 'bg-emerald-500';
      default: return 'bg-slate-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-emerald-600 bg-emerald-100';
      case 'medium': return 'text-amber-600 bg-amber-100';
      case 'high': return 'text-rose-600 bg-rose-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-slate-500 mt-1">Manage and monitor all your team's initiatives.</p>
        </div>
        {canManageProjects && (
          <button
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Plus size={20} />
            New Project
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex-1 relative w-full lg:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search projects by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'grid' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'table' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <List size={18} />
            </button>
          </div>

          <div className="h-8 w-px bg-slate-200 mx-1" />

          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all">
            <Filter size={16} />
            Filter
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
          >
            {filteredProjects.map((project, idx) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col h-full"
              >
                <div className="p-8 flex-1">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-2xl shadow-inner">
                      {project.name.charAt(0)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className={cn("transition-colors", getHealthColor(project.health))} size={18} fill="currentColor" />
                      <Link to={`/projects/${project.id}?tab=chat`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-colors">
                        <MessageSquare size={20} />
                      </Link>
                      {canManageProjects && (
                        <div className="relative group/menu">
                          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                            <MoreVertical size={20} />
                          </button>
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 overflow-hidden">
                            <button
                              onClick={() => handleOpenModal(project)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all text-left"
                            >
                              <Edit2 size={16} />
                              Edit Project
                            </button>
                            <button
                              onClick={() => setIsDeleteConfirmOpen(project.id)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all text-left"
                            >
                              <Trash2 size={16} />
                              Delete Project
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Link to={`/projects/${project.id}`} className="block group-hover:text-indigo-600 transition-colors">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">{project.name}</h3>
                  </Link>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-8 leading-relaxed">{project.description}</p>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-slate-900">{project.progress}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${project.progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-indigo-600 rounded-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar size={14} />
                        <span className="text-xs font-medium">{format(new Date(project.endDate), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock size={14} />
                        <span className="text-xs font-medium">{project.tasks.length} Tasks</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  <AvatarGroup
                    users={project.members.map(mId => users.find(u => u.id === mId)!).filter(Boolean)}
                    limit={3}
                    size="sm"
                  />
                  <span className={cn("px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border shadow-sm", getStatusColor(project.status))}>
                    {project.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Project Name</th>
                    <th className="px-7 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status </th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Progress</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Due Date</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Team</th>
                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProjects.map(project => (
                    <tr key={project.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-sm">
                            {project.name.charAt(0)}
                          </div>
                          <div>
                            <Link to={`/projects/${project.id}`} className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                              {project.name}
                            </Link>
                            <p className="text-xs text-slate-400 line-clamp-1">{project.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn("px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border", getStatusColor(project.status))}>
                          {project.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3 min-w-[120px]">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${project.progress}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-700">{project.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-medium text-slate-600">{format(new Date(project.endDate), 'MMM d, yyyy')}</span>
                      </td>
                      <td className="px-6 py-5">
                        <AvatarGroup
                          users={project.members.map(mId => users.find(u => u.id === mId)!).filter(Boolean)}
                          limit={2}
                          size="xs"
                        />
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/projects/${project.id}?tab=chat`} className="p-2 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all h-8 w-8">
                            <MessageSquare size={16} />
                          </Link>
                          {canManageProjects && (
                            <>
                              <button
                                onClick={() => handleOpenModal(project)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all h-8 w-8 flex items-center justify-center"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => setIsDeleteConfirmOpen(project.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all h-8 w-8 flex items-center justify-center"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-[40px] shadow-2xl z-[101] overflow-y-auto max-h-[90vh] custom-scrollbar" style={{ scrollbarWidth: "none" }}
            >
              <div className="sticky top-0 z-30 p-8 pt-10 pb-4 bg-white/90 backdrop-blur-md rounded-t-[40px] border-b border-slate-100">
                {/* <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500" /> */}
                <div className="flex justify-end mb-2">
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
                {activeTab === 'details' ? (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <input
                        required
                        form="project-form"
                        type="text"
                        placeholder="Project Name..."
                        className="text-4xl font-black text-slate-900 bg-transparent border-none outline-none w-full placeholder:text-slate-200 tracking-tight"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                      <div className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white font-bold text-sm text-slate-700 shadow-sm whitespace-nowrap -mt-1">
                        <div className={cn("w-2 h-2 rounded-full flex-shrink-0", getStatusDotColor(formData.status))} />
                        <select
                          className="appearance-none bg-transparent outline-none pr-4 cursor-pointer"
                          value={formData.status}
                          onChange={e => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                        >
                          <option value="Active">Active</option>
                          <option value="On Hold">On Hold</option>
                          <option value="Completed">Completed</option>
                          <option value="At Risk">At Risk</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <textarea
                      required
                      form="project-form"
                      placeholder="Description of the project..."
                      rows={2}
                      className="w-full mt-4 text-slate-500 bg-transparent border-none outline-none resize-none placeholder:text-slate-300 leading-relaxed"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </>
                ) : (
                  <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                      {isNewlyCreated ? 'Add Initial Tasks' : 'Project Tasks'}
                    </h2>
                  </div>
                )}
              </div>
              <form id="project-form" onSubmit={handleSubmit} className="p-8 pt-0 space-y-8 pb-10">
                <div className="flex items-center gap-6 border-b border-slate-100 pb-2 hidden">
                  {/* Kept hidden just in case but we aren't using the standard tab buttons anymore */}
                </div>

                {activeTab === 'details' ? (
                  <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
                    <div className="h-px bg-slate-100" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
                      <div className="flex items-center gap-4 group">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                          <Heart size={20} fill="currentColor" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Health</p>
                          <div className="relative">
                            <select
                              className="w-full appearance-none bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
                              value={formData.health}
                              onChange={e => setFormData({ ...formData, health: e.target.value as ProjectHealth })}
                            >
                              <option value="Healthy">Healthy</option>
                              <option value="At Risk">At Risk</option>
                              <option value="Critical">Critical</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 group">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                          <Calendar size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Start Date</p>
                          <input
                            type="date"
                            className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer appearance-none"
                            style={{ WebkitAppearance: 'none' }}
                            value={formData.startDate}
                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 group">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                          <Clock size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">End Date</p>
                          <input
                            type="date"
                            className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer appearance-none"
                            style={{ WebkitAppearance: 'none' }}
                            value={formData.endDate}
                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-slate-50 text-indigo-400 rounded-lg">
                          <Users size={16} />
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Team Members</p>
                      </div>
                      <MultiSelectMembers
                        allUsers={users}
                        selectedUserIds={formData.members}
                        onChange={(members) => setFormData({ ...formData, members })}
                      />
                    </div>

                    {!editingProject && (
                      <>
                        <div className="h-px bg-slate-100 mt-8 mb-8" />
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-slate-50 text-orange-400 rounded-lg">
                              <Paperclip size={16} />
                            </div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Attachments</p>
                          </div>
                          <FileUploader
                            attachments={formData.attachments}
                            onChange={(attachments) => setFormData({ ...formData, attachments })}
                          />
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {formData.tasks.map((task, idx) => (
                      <div key={idx} className="p-6 border border-slate-100 rounded-[28px] space-y-4 relative group bg-white shadow-sm hover:shadow-md transition-all">
                        <button type="button" onClick={() => {
                          const newTasks = [...formData.tasks];
                          newTasks.splice(idx, 1);
                          setFormData({ ...formData, tasks: newTasks });
                        }} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-rose-50 rounded-xl">
                          <X size={16} />
                        </button>

                        <input required type="text" placeholder="Task Title..." className="w-full pr-12 text-xl font-bold text-slate-900 bg-transparent border-none outline-none placeholder:text-slate-200" value={task.title || ''} onChange={e => {
                          const newTasks = [...formData.tasks];
                          newTasks[idx].title = e.target.value;
                          setFormData({ ...formData, tasks: newTasks });
                        }} />

                        <textarea required rows={2} placeholder="Add a description for this task..." className="w-full text-slate-500 bg-transparent border-none outline-none resize-none placeholder:text-slate-300 leading-relaxed" value={task.description || ''} onChange={e => {
                          const newTasks = [...formData.tasks];
                          newTasks[idx].description = e.target.value;
                          setFormData({ ...formData, tasks: newTasks });
                        }} />

                        <div className="h-px bg-slate-50" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 pt-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex flex-shrink-0 items-center justify-center group-hover:bg-slate-100 transition-colors">
                              <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse", getStatusDotColor(task.status || 'todo'))} />
                            </div>
                            <div className="flex-1 relative">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Status</p>
                              <select className="w-full appearance-none bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer" value={task.status || 'todo'} onChange={e => {
                                const newTasks = [...formData.tasks];
                                newTasks[idx].status = e.target.value as Status;
                                setFormData({ ...formData, tasks: newTasks });
                              }}>
                                <option value="todo">To Do</option>
                                <option value="in-progress">In Progress</option>
                                <option value="review">Review</option>
                                <option value="done">Done</option>
                              </select>
                              <ChevronDown size={14} className="absolute right-0 top-1 text-slate-300 pointer-events-none" />
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex flex-shrink-0 items-center justify-center group-hover:bg-slate-100 transition-colors">
                              <Flag size={14} className={cn(getPriorityColor(task.priority || 'medium').split(' ')[0])} />
                            </div>
                            <div className="flex-1 relative">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Priority</p>
                              <select className="w-full appearance-none bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer" value={task.priority || 'medium'} onChange={e => {
                                const newTasks = [...formData.tasks];
                                newTasks[idx].priority = e.target.value as Priority;
                                setFormData({ ...formData, tasks: newTasks });
                              }}>
                                <option value="low">Low Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="high">High Priority</option>
                              </select>
                              <ChevronDown size={14} className="absolute right-0 top-1 text-slate-300 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={() => setFormData({ ...formData, tasks: [...formData.tasks, { title: '', description: '', status: 'todo', priority: 'medium', assigneeId: user?.id || '' }] })} className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-slate-50 rounded-[28px] font-bold flex items-center justify-center gap-2 transition-all">
                      <Plus size={20} /> Add Task
                    </button>
                  </div>
                )}
                <div className="flex gap-4 pt-4">
                  {isNewlyCreated ? (
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                    >
                      Skip Tasks
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    {!editingProject
                      ? 'Create & Continue'
                      : isNewlyCreated
                        ? 'Save Tasks & Finish'
                        : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteConfirmOpen(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[40px] shadow-2xl z-[201] p-8 text-center"
            >
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} className="text-rose-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Delete Project?</h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Are you sure you want to delete this project? This action cannot be undone and all related tasks will be removed.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsDeleteConfirmOpen(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteProject(isDeleteConfirmOpen);
                    setIsDeleteConfirmOpen(null);
                  }}
                  className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
