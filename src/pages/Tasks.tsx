import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List as ListIcon,
  MoreVertical,
  Calendar,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  User as UserIcon,
  Trash2,
  Edit2,
  X,
  ChevronDown,
  Flag
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
const DraggableComponent = Draggable as any;
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Task, Status, Priority, Attachment } from '../types';
import { TaskCard } from '../components/TaskCard';
import { MemberAvatar } from '../components/MemberAvatar';
import { MultiSelectMembers } from '../components/MultiSelectMembers';
import { FileUploader } from '../components/FileUploader';

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'low': return 'text-emerald-600 bg-emerald-100';
    case 'medium': return 'text-amber-600 bg-amber-100';
    case 'high': return 'text-rose-600 bg-rose-100';
    default: return 'text-slate-600 bg-slate-100';
  }
};

const STATUS_COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-slate-400' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-indigo-500' },
  { id: 'review', title: 'In Review', color: 'bg-amber-500' },
  { id: 'done', title: 'Completed', color: 'bg-emerald-500' },
];

export const Tasks: React.FC = () => {
  const { tasks, projects, users, addTask, updateTask, updateTaskStatus, deleteTask } = useAppContext();
  const { user } = useAuth();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<{ projectId: string, taskId: string } | null>(null);

  const canManageTasks = user?.role === 'Super Admin' || user?.role === 'Admin';

  // Form State
  const [formData, setFormData] = useState({
    projectId: '',
    title: '',
    description: '',
    status: 'todo' as Status,
    priority: 'medium' as Priority,
    dueDate: new Date().toISOString().split('T')[0],
    assigneeIds: [] as string[],
    attachments: [] as Attachment[],
    subtasks: [] as { id: string, title: string, completed: boolean }[]
  });

  const filteredTasks = tasks.filter(task => {
    // Role-based visibility logic
    const canSeeTask = user?.role === 'Super Admin' || user?.role === 'Admin' || user?.role === 'Manager' ||
      task.assigneeId === user?.id || task.assigneeIds?.includes(user?.id || '');

    // Search query matching
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.project || '').toLowerCase().includes(searchQuery.toLowerCase());

    return canSeeTask && matchesSearch;
  });

  const handleOpenModal = (task?: Task) => {
    if (!canManageTasks && !task) return; // Employees can't create
    if (task) {
      setEditingTask(task);
      setFormData({
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        assigneeIds: task.assigneeIds || (task.assigneeId ? [task.assigneeId] : []),
        attachments: task.attachments || [],
        subtasks: task.subtasks || []
      });
    } else {
      setEditingTask(null);
      setFormData({
        projectId: projects[0]?.id || '',
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        dueDate: new Date().toISOString().split('T')[0],
        assigneeIds: [],
        attachments: [],
        subtasks: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const taskData = {
      ...formData,
      assigneeId: formData.assigneeIds[0] || '', // Maintain backward compatibility
    };

    if (editingTask) {
      if (!canManageTasks) {
        if (formData.status !== editingTask.status) {
          await updateTaskStatus(editingTask.id, formData.status, formData.projectId);
        }
      } else {
        await updateTask(formData.projectId, {
          ...editingTask,
          ...taskData
        });
      }
    } else {
      await addTask(formData.projectId, {
        ...taskData,
        comments: [],
        labels: []
      });
    }
    setIsModalOpen(false);
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Find the task to get its projectId
    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;
    updateTaskStatus(draggableId, destination.droppableId as any, task.projectId);
  };

  const getAssignee = (id: string) => users.find(u => u.id === id);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tasks</h1>
          <p className="text-slate-500 mt-1">Manage and track your team's progress across all projects.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
            <button
              onClick={() => setView('kanban')}
              className={cn(
                "p-2 rounded-xl transition-all",
                view === 'kanban' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                "p-2 rounded-xl transition-all",
                view === 'list' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <ListIcon size={18} />
            </button>
          </div>
          {canManageTasks && (
            <button
              onClick={() => handleOpenModal()}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <Plus size={18} />
              Add Task
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search tasks, projects, or descriptions..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm">
          <Filter size={18} />
          Filters
        </button>
      </div>

      {view === 'kanban' ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar min-h-[600px]">
            {STATUS_COLUMNS.map(column => (
              <div key={column.id} className="flex-shrink-0 w-80">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2.5 h-2.5 rounded-full", column.color)} />
                    <h3 className="font-bold text-slate-900">{column.title}</h3>
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {filteredTasks.filter(t => t.status === column.id).length}
                    </span>
                  </div>
                  <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                    <MoreVertical size={16} />
                  </button>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={cn(
                        "space-y-4 min-h-[500px] rounded-[32px] transition-all p-2",
                        snapshot.isDraggingOver ? "bg-indigo-50/50 ring-2 ring-indigo-200 ring-dashed" : "bg-transparent"
                      )}
                    >
                      {filteredTasks
                        .filter(task => task.status === column.id)
                        .map((task, index) => (
                          <DraggableComponent key={task.id} draggableId={task.id} index={index}>
                            {(provided: any, snapshot: any) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <TaskCard
                                  task={task}
                                  assignees={users.filter(u => (task.assigneeIds || [task.assigneeId]).includes(u.id))}
                                  canManage={canManageTasks}
                                  onMenuClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                  onEditClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenModal(task);
                                  }}
                                  onClick={() => handleOpenModal(task)}
                                  className={snapshot.isDragging ? "shadow-2xl border-indigo-500 ring-4 ring-indigo-500/10 rotate-2" : ""}
                                />
                              </div>
                            )}
                          </DraggableComponent>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      ) : (
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Task Name</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Project</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Priority</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Due Date</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Assignee</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task, idx) => (
                <tr key={task.id} className="group hover:bg-slate-50 transition-all">
                  <td className="px-8 py-5 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        STATUS_COLUMNS.find(c => c.id === task.status)?.color
                      )} />
                      <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{task.title}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 border-b border-slate-50">
                    <span className="text-xs font-medium text-slate-500">{task.project}</span>
                  </td>
                  <td className="px-8 py-5 border-b border-slate-50">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      getPriorityColor(task.priority).split(' ')[0],
                      getPriorityColor(task.priority).split(' ')[1]
                    )}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-8 py-5 border-b border-slate-50">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar size={14} />
                      <span className="text-xs font-bold">{task.dueDate}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 border-b border-slate-50">
                    <MemberAvatar user={users.find(u => u.id === (task.assigneeIds?.[0] || task.assigneeId))} size="sm" showName />
                  </td>
                  <td className="px-8 py-5 border-b border-slate-50 text-right">
                    <div className="flex justify-end gap-2">
                      {canManageTasks && (
                        <>
                          <button
                            onClick={() => handleOpenModal(task)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setIsDeleteConfirmOpen({ projectId: task.projectId, taskId: task.id })}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
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
      )}

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
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-[40px] shadow-2xl z-[101] overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <div className="sticky top-0 z-30 p-8 pt-10 pb-4 bg-white/90 backdrop-blur-md rounded-t-[40px] border-b border-slate-100">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />
                <div className="flex justify-between mb-2">
                  <h2 className="text-xl font-bold text-slate-400">{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
                <div className="flex items-start justify-between gap-4 mt-2">
                  <input
                    required
                    form="main-task-form"
                    disabled={!canManageTasks}
                    type="text"
                    placeholder="Task Title..."
                    className="text-3xl font-black text-slate-900 bg-transparent border-none outline-none w-full placeholder:text-slate-200 tracking-tight disabled:bg-transparent"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <textarea
                  required
                  form="main-task-form"
                  disabled={!canManageTasks}
                  rows={2}
                  placeholder="Add a detailed description..."
                  className="w-full mt-4 text-slate-500 bg-transparent border-none outline-none resize-none placeholder:text-slate-300 leading-relaxed disabled:bg-transparent"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <form id="main-task-form" onSubmit={handleSubmit} className="p-8 space-y-8 pt-6">
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
                  <div className="h-px bg-slate-100" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
                    <div className="flex items-center gap-4 group md:col-span-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                        <LayoutGrid size={20} className="text-indigo-500" />
                      </div>
                      <div className="flex-1 relative">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Project</p>
                        <select
                          required
                          disabled={!!editingTask || !canManageTasks}
                          className="w-full appearance-none bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer disabled:opacity-50"
                          value={formData.projectId}
                          onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                        >
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                        <div className={cn("w-3 h-3 rounded-full animate-pulse", STATUS_COLUMNS.find(c => c.id === formData.status)?.color?.replace('bg-', 'bg-').split(' ')[0] || 'bg-slate-300')} />
                      </div>
                      <div className="flex-1 relative">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Status</p>
                        <select
                          className="w-full appearance-none bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer disabled:opacity-50"
                          value={formData.status}
                          onChange={e => setFormData({ ...formData, status: e.target.value as Status })}
                        >
                          {STATUS_COLUMNS.map(col => (
                            <option key={col.id} value={col.id}>{col.title}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                        <Flag size={20} className={cn(getPriorityColor(formData.priority).split(' ')[0])} />
                      </div>
                      <div className="flex-1 relative">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Priority</p>
                        <select
                          disabled={!canManageTasks}
                          className="w-full appearance-none bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer disabled:opacity-50"
                          value={formData.priority}
                          onChange={e => setFormData({ ...formData, priority: e.target.value as Priority })}
                        >
                          <option value="low">Low Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="high">High Priority</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <Calendar size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Due Date</p>
                        <input
                          disabled={!canManageTasks}
                          type="date"
                          className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer appearance-none disabled:opacity-50"
                          style={{ WebkitAppearance: 'none' }}
                          value={formData.dueDate}
                          onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100" />

                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 bg-slate-50 text-indigo-400 rounded-lg">
                        <UserIcon size={16} />
                      </div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Assignees</p>
                    </div>
                    {canManageTasks ? (
                      <MultiSelectMembers
                        allUsers={users}
                        selectedUserIds={formData.assigneeIds}
                        onChange={(ids) => setFormData({ ...formData, assigneeIds: ids })}
                        highlightUserIds={projects.find(p => p.id === formData.projectId)?.members || []}
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {formData.assigneeIds.map(id => {
                          const assignee = users.find(u => u.id === id);
                          if (!assignee) return null;
                          return (
                            <div key={id} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                              <MemberAvatar user={assignee} size="sm" />
                              <span className="text-sm font-bold text-slate-700">{assignee.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-slate-100 mt-8 mb-8" />
                  <div>
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
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    {editingTask ? 'Save Changes' : 'Create Task'}
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
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Delete Task?</h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Are you sure you want to delete this task? This action cannot be undone.
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
                    deleteTask(isDeleteConfirmOpen.projectId, isDeleteConfirmOpen.taskId);
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
