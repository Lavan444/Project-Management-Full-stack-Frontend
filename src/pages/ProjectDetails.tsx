import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  Plus,
  ChevronLeft,
  Calendar,
  Users,
  LayoutGrid,
  List,
  MoreHorizontal,
  Clock,
  CheckSquare,
  FileText,
  Activity as ActivityIcon,
  Info,
  Search,
  Filter,
  Paperclip,
  MessageSquare,
  X,
  Download,
  Trash2,
  CheckCircle2,
  ChevronDown,
  Flag,
  Heart,
  Eye,
  Edit2
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'motion/react';

const DraggableComponent = Draggable as any;
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Status, Task, Priority, ProjectFile, Activity, Attachment, Comment } from '../types';
import { MemberAvatar } from '../components/MemberAvatar';
import { AvatarGroup } from '../components/AvatarGroup';
import { MultiSelectMembers } from '../components/MultiSelectMembers';
import { FileUploader } from '../components/FileUploader';
import { TaskCard } from '../components/TaskCard';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

const COLUMNS: { id: Status; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'bg-slate-100 text-slate-600' },
  { id: 'in-progress', label: 'In Progress', color: 'bg-blue-50 text-blue-600' },
  { id: 'review', label: 'Review', color: 'bg-amber-50 text-amber-600' },
  { id: 'done', label: 'Done', color: 'bg-emerald-50 text-emerald-600' },
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'low': return 'text-emerald-600 bg-emerald-100';
    case 'medium': return 'text-amber-600 bg-amber-100';
    case 'high': return 'text-rose-600 bg-rose-100';
    default: return 'text-slate-600 bg-slate-100';
  }
};

type TabType = 'overview' | 'tasks' | 'files' | 'activity' | 'team' | 'chat';

export const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = (searchParams.get('tab') as TabType) || 'tasks';

  const { projects, users, tasks: allTasks, addTask, updateTask, updateTaskStatus, deleteTask, addComment, updateProject, addProjectChat } = useAppContext();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [commentText, setCommentText] = useState('');
  const [chatText, setChatText] = useState('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as Status,
    priority: 'medium' as Priority,
    dueDate: new Date().toISOString().split('T')[0],
    assigneeIds: [] as string[],
    attachments: [] as Attachment[]
  });
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const project = projects.find(p => p.id === id);

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  if (!project) return <div>Project not found</div>;

  const canManageProject = user?.role === 'Super Admin' || (user?.role === 'Admin' && project.organizationId === user.organizationId);
  const isProjectMember = project.members.includes(user?.id || '');

  // Tasks for this project — sourced from the context's tasks state (separate collection)
  const projectTasks = allTasks
    .filter(t => String(t.projectId) === String(id))
    .filter(t => user?.role === 'Employee'
      ? t.assigneeId === user.id || t.assigneeIds?.includes(user.id)
      : true
    );

  // Combine project native files with all task attachments
  const allProjectFiles = [
    ...(project.files || []),
    ...projectTasks.flatMap(task =>
      (task.attachments || []).map(att => ({
        id: att.id,
        name: att.name,
        type: att.type,
        size: att.size,
        uploadedBy: task.assigneeIds?.[0] || 'Unknown',
        uploadedAt: att.uploadedAt,
        taskId: task.id
      }))
    )
  ].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  const handleOpenTaskModal = (task?: Task, status: Status = 'todo') => {
    if (task) {
      setEditingTask(task);
      setTaskFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        assigneeIds: task.assigneeIds || (task.assigneeId ? [task.assigneeId] : []),
        attachments: task.attachments || []
      });
    } else {
      setEditingTask(null);
      setTaskFormData({
        title: '',
        description: '',
        status,
        priority: 'medium',
        dueDate: new Date().toISOString().split('T')[0],
        assigneeIds: [],
        attachments: []
      });
    }
    setIsTaskModalOpen(true);
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      projectId: project.id,
      ...taskFormData,
      assigneeId: taskFormData.assigneeIds[0] || '',
    };
    if (editingTask) {
      if (!canManageProject) {
        if (taskFormData.status !== editingTask.status) {
          await updateTaskStatus(editingTask.id, taskFormData.status, project.id);
        }
      } else {
        await updateTask(project.id, {
          ...editingTask,
          ...submitData
        });
      }
    } else {
      await addTask(project.id, {
        ...submitData,
        subtasks: [],
        comments: [],
        labels: []
      });
    }
    setIsTaskModalOpen(false);
  };

  const handlePostComment = async () => {
    if (!selectedTask || !commentText.trim() || !user) return;

    const newComment: Comment = {
      id: `c${Date.now()}`,
      userId: user.id,
      text: commentText.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      await addComment(project.id, selectedTask.id, newComment);
      setCommentText('');
    } catch (error) {
      // Error is handled in the context.
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const task = projectTasks.find(t => t.id === draggableId);
    if (task) {
      updateTaskStatus(task.id, destination.droppableId as Status, project.id);
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high': return 'bg-rose-50 text-rose-600';
      case 'medium': return 'bg-amber-50 text-amber-600';
      case 'low': return 'bg-emerald-50 text-emerald-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'files', label: 'Files', icon: FileText },
    { id: 'activity', label: 'Activity', icon: ActivityIcon },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link to="/projects" className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
              {/* <span className={cn(
                "px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest border",
                project.status === 'Active' ? "bg-blue-50 text-blue-600 border-blue-100" :
                project.status === 'Completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                "bg-amber-50 text-amber-600 border-amber-100"
              )}>
                {project.status}
              </span> */}
            </div>
            <div className="flex items-center gap-4 text-slate-500 text-sm font-medium">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-400" />
                <span>Due {format(new Date(project.endDate), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={14} className="text-slate-400" />
                <span>{project.members.length} Members</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart size={14} className={cn(
                  project.health === 'Healthy' ? "text-emerald-500" :
                    project.health === 'At Risk' ? "text-amber-500" : "text-rose-500"
                )} fill="currentColor" />
                <span className="capitalize">{project.health}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AvatarGroup
            users={project.members.map(mId => users.find(u => u.id === mId)!).filter(Boolean)}
            limit={5}
            size="sm"
          />
          {canManageProject && (
            <button
              onClick={() => handleOpenTaskModal()}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <Plus size={20} />
              Add Task
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative whitespace-nowrap",
              activeTab === tab.id ? "text-indigo-600" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        <AnimatePresence mode="wait">
          {activeTab === 'tasks' && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 max-w-md">
                  <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all">
                    <Filter size={18} />
                  </button>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={cn("p-2 rounded-lg transition-all", viewMode === 'kanban' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>

              {viewMode === 'kanban' ? (
                <DragDropContext onDragEnd={onDragEnd}>
                  <div className="flex gap-6 overflow-x-auto pb-6 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
                    {COLUMNS.map(column => (
                      <div key={column.id} className="flex-shrink-0 w-80">
                        <div className="flex items-center justify-between mb-4 px-2">
                          <div className="flex items-center gap-2">
                            <span className={cn("px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest", column.color)}>
                              {column.label}
                            </span>
                            <span className="text-slate-400 text-sm font-bold">
                              {projectTasks.filter(t => t.status === column.id).length}
                            </span>
                          </div>
                          {/* {canManageProject && (
                            <button 
                              onClick={() => handleOpenTaskModal(column.id)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            >
                              <Plus size={18} />
                            </button>
                          )} */}
                        </div>

                        <Droppable droppableId={column.id}>
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="space-y-4 min-h-[500px]"
                            >
                              {projectTasks
                                .filter(t => t.status === column.id)
                                .map((task, index) => {
                                  const assignee = users.find(u => u.id === task.assigneeId);
                                  return (
                                    <DraggableComponent draggableId={task.id} index={index} key={task.id}>
                                      {(provided: any, snapshot: any) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                        >
                                          <TaskCard
                                            task={task}
                                            assignees={users.filter(u => (task.assigneeIds || [task.assigneeId]).includes(u.id))}
                                            canManage={canManageProject}
                                            onMenuClick={(e) => {
                                              e.stopPropagation();
                                            }}
                                            onEditClick={(e) => {
                                              e.stopPropagation();
                                              handleOpenTaskModal(task);
                                            }}
                                            onDeleteClick={(e) => {
                                              e.stopPropagation();
                                              setTaskToDelete(task.id);
                                            }}
                                            onClick={() => setSelectedTask(task)}
                                            className={snapshot.isDragging ? "shadow-2xl border-indigo-500 ring-4 ring-indigo-500/10 rotate-2" : ""}
                                          />
                                        </div>
                                      )}
                                    </DraggableComponent>
                                  );
                                })}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    ))}
                  </div>
                </DragDropContext>
              ) : (
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Task Name</th>
                        <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Priority</th>
                        <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Assignee</th>
                        <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Due Date</th>
                        <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {projectTasks.map(task => {
                        const assignee = users.find(u => u.id === task.assigneeId);
                        return (
                          <tr
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            className="hover:bg-slate-50/30 transition-colors cursor-pointer group"
                          >
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <CheckCircle2 size={18} className={cn(task.status === 'done' ? "text-emerald-500" : "text-slate-200")} />
                                <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{task.title}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <span className={cn(
                                "px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest border",
                                task.status === 'done' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                  task.status === 'in-progress' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                    task.status === 'review' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                      "bg-slate-50 text-slate-600 border-slate-100"
                              )}>
                                {task.status}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <span className={cn(
                                "px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest border",
                                getPriorityColor(task.priority)
                              )}>
                                {task.priority}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <MemberAvatar user={users.find(u => u.id === (task.assigneeIds?.[0] || task.assigneeId))} size="sm" showName />
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                <Calendar size={14} />
                                {format(new Date(task.dueDate), 'MMM d, yyyy')}
                              </div>
                            </td>
                            <td className="px-8 py-5 text-right">
                              {canManageProject && (
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenTaskModal(task);
                                    }}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                  >
                                    <Edit2 size={18} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteTask(project.id, task.id);
                                    }}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Project Description</h3>
                  <p className="text-slate-500 leading-relaxed">{project.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                    <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Start Date</p>
                      <p className="text-lg font-bold text-slate-900">{format(new Date(project.startDate), 'MMM d, yyyy')}</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Target Date</p>
                      <p className="text-lg font-bold text-slate-900">{format(new Date(project.endDate), 'MMM d, yyyy')}</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Tasks</p>
                      <p className="text-lg font-bold text-slate-900">{projectTasks.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Project Activity</h3>
                  <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                    {project.activity?.map(activity => {
                      const user = users.find(u => u.id === activity.userId);
                      return (
                        <div key={activity.id} className="flex gap-4 relative z-10">
                          {user?.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm text-xs font-bold text-slate-500">
                              {(user?.name || String(activity.userId)).substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 pt-1">
                            <p className="text-sm text-slate-600">
                              <span className="font-bold text-slate-900">{user?.name}</span>
                              {' '}
                              {activity.type === 'task_completed' && 'completed the task'}
                              {activity.type === 'comment_added' && 'commented on'}
                              {activity.type === 'file_uploaded' && 'uploaded a file to'}
                              {activity.type === 'task_created' && 'created a new task'}
                              {' '}
                              <span className="font-bold text-indigo-600">{activity.targetName}</span>
                            </p>
                            <p className="text-xs text-slate-400 mt-1">{format(new Date(activity.createdAt || activity.timestamp || new Date()), 'MMM d, h:mm a')}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Project Progress</h3>
                  <div className="flex items-center justify-center mb-8">
                    <div className="relative w-40 h-40">
                      <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path
                          className="text-slate-100"
                          strokeDasharray="100, 100"
                          strokeWidth="3"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <motion.path
                          initial={{ strokeDasharray: "0, 100" }}
                          animate={{ strokeDasharray: `${project.progress}, 100` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="text-indigo-600"
                          strokeWidth="3"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-slate-900">{project.progress}%</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Complete</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <span className="text-sm font-bold text-slate-600">Tasks Done</span>
                      <span className="text-sm font-bold text-slate-900">{projectTasks.filter(t => t.status === 'done').length}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <span className="text-sm font-bold text-slate-600">Tasks Remaining</span>
                      <span className="text-sm font-bold text-slate-900">{projectTasks.filter(t => t.status !== 'done').length}</span>
                    </div>
                  </div>
                </div>

                {/* Attached Files Overview Widget */}
                {allProjectFiles.length > 0 && (
                  <div className="col-span-1 lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm mt-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                          <Paperclip size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Attached Files</h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('files')}
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-colors"
                      >
                        View All
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-4">
                      {allProjectFiles.slice(0, 2).map(file => (
                        <div key={file.id} className="group p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-indigo-100 hover:shadow-lg transition-all cursor-pointer">
                          <div className="flex column items-start gap-2">
                            <div className="p-3 bg-white text-indigo-600 rounded-xl shadow-sm border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                              <FileText size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate pr-4">{file.name}</p>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{file.size}</span>
                              {/* <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{file.type}</span>
                                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{file.size}</span>
                              </div> */}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-indigo-600 p-8 rounded-[32px] text-white shadow-xl shadow-indigo-100">
                  <h3 className="text-xl font-bold mb-4">Project Health</h3>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                      <Heart size={24} fill="currentColor" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{project.health}</p>
                      <p className="text-indigo-100 text-sm">On track for delivery</p>
                    </div>
                  </div>
                  <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 transition-all">
                    Generate Report
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'files' && (
            <motion.div
              key="files"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Project Assets</h3>
                {canManageProject && (
                  <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all">
                    <Plus size={18} />
                    Upload File
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">File Name</th>
                      {/* <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Type</th> */}
                      <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Size</th>
                      <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Uploaded By</th>
                      <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {allProjectFiles.map(file => {
                      const uploader = users.find(u => u.id === file.uploadedBy);
                      return (
                        <tr key={file.id} className="hover:bg-slate-50/30 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 cursor-pointer hover:bg-indigo-100 transition-colors">
                                <FileText size={20} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors">{file.name}</p>
                                <p className="text-xs text-slate-400">{format(new Date(file.uploadedAt), 'MMM d, yyyy')}</p>
                              </div>
                            </div>
                          </td>
                          {/* <td className="px-6 py-5">
                            <span className="text-xs font-bold text-slate-500 uppercase">{file.type}</span>
                          </td> */}
                          <td className="px-6 py-5">
                            <span className="text-xs font-medium text-slate-600">{file.size}</span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              {uploader?.avatar ? (
                                <img src={uploader.avatar} alt={uploader.name} className="w-6 h-6 rounded-full border border-slate-200" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-[8px] font-bold text-slate-500">
                                  {file.uploadedBy.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span className="text-xs font-medium text-slate-700">{uploader?.name || 'System / Task User'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* View Action opens external mapping */}
                              {/* <button onClick={() => setSelectedFile(file)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                <Eye size={18} />
                              </button> */}
                              <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                <Download size={18} />
                              </button>
                              {canManageProject && (
                                <button
                                  onClick={() => {
                                    // Implementation note: deletion removes it from the respective array it belongs to natively
                                    if ('taskId' in file && file.taskId) {
                                      const task = project.tasks.find(t => t.id === file.taskId);
                                      if (task && task.attachments) {
                                        task.attachments = task.attachments.filter(a => a.id !== file.id);
                                        updateProject({ ...project, tasks: [...project.tasks] });
                                      }
                                    } else {
                                      updateProject({
                                        ...project,
                                        files: project.files?.filter(f => f.id !== file.id)
                                      });
                                    }
                                  }}
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all block lg:hidden group-hover:block"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden p-8"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-8">Project Timeline</h3>

              {(!project.activity || project.activity.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <ActivityIcon size={48} className="mb-4 opacity-20" />
                  <p className="font-medium">No activity recorded for this project yet.</p>
                </div>
              ) : (
                <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                  {project.activity?.map(activity => {
                    const user = users.find(u => u.id === activity.userId);
                    return (
                      <div key={activity.id} className="flex gap-4 relative z-10">
                        {user?.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm text-xs font-bold text-slate-500">
                            {(user?.name || String(activity.userId)).substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 pt-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm ml-2 group hover:border-indigo-100 transition-colors">
                          <p className="text-sm text-slate-600">
                            <span className="font-bold text-slate-900">{user?.name || 'System'}</span>
                            {' '}
                            {activity.type === 'task_completed' && 'completed the task'}
                            {activity.type === 'comment_added' && 'commented on'}
                            {activity.type === 'file_uploaded' && 'uploaded a file to'}
                            {activity.type === 'task_created' && 'created a new task'}
                            {activity.type === 'project_created' && 'created the project'}
                            {' '}
                            <span className="font-bold text-indigo-600">{activity.targetName}</span>
                          </p>
                          <p className="text-xs text-slate-400 mt-2">{format(new Date(activity.createdAt || activity.timestamp || new Date()), 'MMM d, yyyy h:mm a')}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'team' && (
            <motion.div
              key="team"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {project.members.map(mId => {
                const user = users.find(u => u.id === mId);
                return (
                  <div key={mId} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm text-center group hover:shadow-xl transition-all">
                    <div className="relative inline-block mb-4">
                      <img src={user?.avatar} alt={user?.name} className="w-24 h-24 rounded-[32px] border-4 border-white shadow-lg object-cover" referrerPolicy="no-referrer" />
                      <div className={cn(
                        "absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-white",
                        user?.status === 'online' ? "bg-emerald-500" : user?.status === 'busy' ? "bg-amber-500" : "bg-slate-300"
                      )} />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mb-1">{user?.name}</h4>
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4">{user?.role}</p>
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                        <MessageSquare size={18} />
                      </button>
                      {canManageProject && (
                        <button className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                          <MoreHorizontal size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {canManageProject && (
                <button className="bg-slate-50 border-2 border-dashed border-slate-200 p-6 rounded-[32px] flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group">
                  <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:shadow-md transition-all">
                    <Plus size={24} />
                  </div>
                  <span className="text-sm font-bold">Invite Member</span>
                </button>
              )}
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px] lg:col-span-3"
            >
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Project Chat</h3>
                    <p className="text-xs text-slate-500">Discuss with the team</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {(project.chats || []).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <MessageSquare size={48} className="mb-4 opacity-20" />
                    <p className="font-medium text-sm">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  (project.chats || []).map(chat => {
                    const commenter = users.find(u => u.id === chat.userId);
                    const isMe = user?.id === chat.userId;
                    return (
                      <div key={chat.id} className={cn("flex gap-3", isMe ? "flex-row-reverse" : "")}>
                        <img src={commenter?.avatar} alt={commenter?.name} className="w-8 h-8 rounded-full shadow-sm" referrerPolicy="no-referrer" />
                        <div className={cn("max-w-[75%]", isMe ? "items-end flex flex-col" : "items-start flex flex-col")}>
                          <div className={cn("flex items-center gap-2 mb-1", isMe ? "flex-row-reverse" : "flex-row")}>
                            <span className="text-xs font-bold text-slate-700">{isMe ? 'You' : commenter?.name}</span>
                            <span className="text-[10px] text-slate-400">{format(new Date(chat.createdAt), 'MMM d, h:mm a')}</span>
                          </div>
                          <div className={cn("inline-block p-4 rounded-2xl text-sm leading-relaxed", isMe ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-slate-100 text-slate-700 rounded-tl-sm")} style={{ wordBreak: 'break-word' }}>
                            {chat.text}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-4 bg-white border-t border-slate-100">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!chatText.trim() || !user || !isProjectMember) return;
                    addProjectChat(project.id, {
                      id: `chat${Date.now()}`,
                      userId: user.id,
                      text: chatText.trim(),
                      createdAt: new Date().toISOString()
                    });
                    setChatText('');
                  }}
                  className="flex gap-2 relative"
                >
                  <input
                    type="text"
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder={isProjectMember ? "Type your message..." : "Only project members can send messages"}
                    disabled={!isProjectMember}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="submit"
                    disabled={!chatText.trim() || !isProjectMember}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    Send
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Task Detail Drawer */}
      <AnimatePresence>
        {selectedTask && (() => {
          const currentTask = project.tasks.find(t => t.id === selectedTask.id) || selectedTask;
          return (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedTask(null)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl z-50 overflow-y-auto"
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest border",
                        getPriorityColor(currentTask.priority)
                      )}>
                        {currentTask.priority} Priority
                      </span>
                      <select
                        value={currentTask.status}
                        onChange={(e) => updateTaskStatus(currentTask.id, e.target.value as Status, project.id)}
                        className={cn(
                          "px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest border outline-none cursor-pointer appearance-none",
                          currentTask.status === 'done' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            "bg-slate-50 text-slate-600 border-slate-100"
                        )}
                      >
                        {COLUMNS.map(c => (
                          <option key={c.id} value={c.id} className="bg-white text-slate-900 font-medium">
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      {canManageProject && (
                        <button
                          onClick={() => setTaskToDelete(currentTask.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="Delete Task"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedTask(null)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                      >
                        <X size={24} />
                      </button>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-slate-900 mb-1">{currentTask.title}</h2>
                  <p className="text-slate-500 leading-relaxed mb-8">{currentTask.description}</p>

                  <div className="grid grid-cols-3 gap-6 mb-10">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assignees</p>
                      <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                        {(currentTask.assigneeIds || [currentTask.assigneeId]).map(id => {
                          const assignee = users.find(u => u.id === id);
                          return (
                            <div key={id} className="flex items-center gap-2 p-1.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                              <img
                                src={assignee?.avatar}
                                alt={assignee?.name}
                                className="w-6 h-6 rounded-full"
                                referrerPolicy="no-referrer"
                                title={assignee?.name}
                              />
                              {/* <span className="text-xs font-bold text-slate-700">{assignee?.name}</span> */}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Due Date</p>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100" style={{ height: "56px" }}>
                        <Calendar size={18} className="text-slate-400" />
                        <span className="text-sm font-bold text-slate-700">{format(new Date(currentTask.dueDate), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Start Date</p>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100" style={{ height: "56px" }}>
                        <Calendar size={18} className="text-slate-400" />
                        <span className="text-sm font-bold text-slate-700">{format(new Date(project.startDate), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>

                  {/* {currentTask.subtasks.length > 0 && (
                  <div className="mb-10">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Subtasks</h3>
                    <div className="space-y-3">
                      {currentTask.subtasks.map(sub => (
                        <div key={sub.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                          <button className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                            sub.completed ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"
                          )}>
                            {sub.completed && <CheckCircle2 size={14} />}
                          </button>
                          <span className={cn("text-sm font-medium flex-1", sub.completed ? "text-slate-400 line-through" : "text-slate-700")}>
                            {sub.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )} */}

                  <div className="mb-5">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Attachments - <span className="text-indigo-600">({currentTask.attachments?.length || 0})</span></h3>
                    <div className="grid grid-cols-2 gap-3 items-center"
                      style={{ maxHeight: "85px", minHeight: "85px", overflow: "auto" }}>

                      {currentTask.attachments && currentTask.attachments.length > 0 ? (
                        currentTask.attachments.map(att => (
                          <div
                            key={att.id}
                            className="inline-flex items-center justify-between p-2 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all w-fit"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white rounded-xl shadow-sm">
                                <Paperclip size={16} className="text-indigo-600" />
                              </div>

                              <p className="text-sm font-bold text-slate-900">{att.name}</p>
                            </div>

                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                              <Download size={18} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-center py-0 pb-0 text-slate-400">
                          <Paperclip size={18} className="mb-0 me-2 opacity-50" />
                          <p className="text-sm font-medium">No attachments</p>
                        </div>
                      )}

                      {/* <button className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all font-bold text-sm">
                      <Plus size={18} />
                      Add Attachment
                    </button> */}
                    </div>
                  </div>


                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Comments</h3>
                  <div style={{ minHeight: "330px", maxHeight: "330px", overflow: "auto", padding: "15px" }}>

                    <div className="space-y-6 mb-8">
                      {currentTask.comments?.map(comment => {
                        const commenter = users.find(u => u.id === comment.userId);
                        return (
                          <div key={comment.id} className="flex gap-4">
                            <img src={commenter?.avatar} alt={commenter?.name} className="w-9 h-9 rounded-full shadow-sm" referrerPolicy="no-referrer" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-bold text-slate-900">{commenter?.name}</span>
                                <span className="text-[10px] font-bold text-slate-400">{format(new Date(comment.createdAt), 'MMM d, h:mm a')}</span>
                              </div>
                              <div className="p-4 pt-2 pb-2 bg-slate-50 rounded-2xl rounded-tl-none border border-slate-100">
                                <p className="text-sm text-slate-600 leading-relaxed">{comment.text}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                  <div className="relative">
                    <textarea
                      rows={0}
                      column={1}
                      placeholder="Write a comment..."
                      className="w-full p-3 pr-28 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <button
                      onClick={handlePostComment}
                      className="absolute bottom-6 right-3 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )
        })()}
      </AnimatePresence>

      {/* Create Task Modal */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTaskModalOpen(false)}
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
                  <button onClick={() => setIsTaskModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
                <div className="flex items-start justify-between gap-4 mt-2">
                  <input
                    required
                    form="project-task-form"
                    disabled={!canManageProject}
                    type="text"
                    placeholder="Task Title..."
                    className="text-3xl font-black text-slate-900 bg-transparent border-none outline-none w-full placeholder:text-slate-200 tracking-tight disabled:bg-transparent"
                    value={taskFormData.title}
                    onChange={e => setTaskFormData({ ...taskFormData, title: e.target.value })}
                  />
                </div>
                <textarea
                  required
                  form="project-task-form"
                  disabled={!canManageProject}
                  rows={2}
                  placeholder="Add a detailed description..."
                  className="w-full mt-4 text-slate-500 bg-transparent border-none outline-none resize-none placeholder:text-slate-300 leading-relaxed disabled:bg-transparent"
                  value={taskFormData.description}
                  onChange={e => setTaskFormData({ ...taskFormData, description: e.target.value })}
                />
              </div>
              <form id="project-task-form" onSubmit={handleTaskSubmit} className="p-8 space-y-8 pt-6">
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
                  <div className="h-px bg-slate-100" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                        <div className={cn("w-3 h-3 rounded-full animate-pulse", COLUMNS.find(c => c.id === taskFormData.status)?.color.split(' ')[0] || 'bg-slate-300')} />
                      </div>
                      <div className="flex-1 relative">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Status</p>
                        <select
                          className="w-full appearance-none bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
                          value={taskFormData.status}
                          onChange={e => setTaskFormData({ ...taskFormData, status: e.target.value as Status })}
                        >
                          {COLUMNS.map(col => (
                            <option key={col.id} value={col.id}>{col.label}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                        <Flag size={20} className={cn(getPriorityColor(taskFormData.priority).split(' ')[0])} />
                      </div>
                      <div className="flex-1 relative">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Priority</p>
                        <select
                          disabled={!canManageProject}
                          className="w-full appearance-none bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer disabled:opacity-50"
                          value={taskFormData.priority}
                          onChange={e => setTaskFormData({ ...taskFormData, priority: e.target.value as Priority })}
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
                          disabled={!canManageProject}
                          type="date"
                          className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer appearance-none disabled:opacity-50"
                          style={{ WebkitAppearance: 'none' }}
                          value={taskFormData.dueDate}
                          onChange={e => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100" />

                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 bg-slate-50 text-indigo-400 rounded-lg">
                        <Users size={16} />
                      </div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Assignees</p>
                    </div>
                    {canManageProject ? (
                      <MultiSelectMembers
                        allUsers={users}
                        selectedUserIds={taskFormData.assigneeIds}
                        onChange={(ids) => setTaskFormData({ ...taskFormData, assigneeIds: ids })}
                        highlightUserIds={project.members}
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {taskFormData.assigneeIds.map(id => {
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
                      attachments={taskFormData.attachments}
                      onChange={(attachments) => setTaskFormData({ ...taskFormData, attachments })}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
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

      {/* Side Wrapper Viewer for Selected File */}
      <AnimatePresence>
        {selectedFile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFile(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[120] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 line-clamp-1 break-all pr-4">{selectedFile.name}</h3>
                    <p className="text-sm text-slate-500 uppercase">{selectedFile.type}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center bg-slate-50 border-b border-slate-100">
                {selectedFile.type?.includes('pdf') || selectedFile.name?.endsWith('pdf') ? (
                  <div className="w-full max-w-sm aspect-[3/4] bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-400 to-rose-600" />
                    <FileText size={64} className="text-rose-400 mb-6" />
                    <h4 className="font-bold text-slate-900 mb-2">PDF Document</h4>
                    <p className="text-sm text-slate-500 max-w-xs break-all">{selectedFile.name}</p>
                  </div>
                ) : selectedFile.type?.includes('image') || selectedFile.name?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <div className="w-full max-w-sm aspect-square bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald-600" />
                    <FileText size={64} className="text-emerald-400 mb-6" />
                    <h4 className="font-bold text-slate-900 mb-2">Image File</h4>
                    <p className="text-sm text-slate-500 max-w-xs break-all">{selectedFile.name}</p>
                  </div>
                ) : (
                  <div className="w-full max-w-sm aspect-square bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-400 to-indigo-600" />
                    <FileText size={64} className="text-indigo-400 mb-6" />
                    <h4 className="font-bold text-slate-900 mb-2">{selectedFile.type ? selectedFile.type.toUpperCase() : 'Unknown'} Document</h4>
                    <p className="text-sm text-slate-500 max-w-xs break-all">{selectedFile.name}</p>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <span className="text-sm font-bold text-slate-500">File Size</span>
                    <span className="text-sm font-bold text-slate-900">{selectedFile.size}</span>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <span className="text-sm font-bold text-slate-500">Uploaded Date</span>
                    <span className="text-sm font-bold text-slate-900">{format(new Date(selectedFile.uploadedAt || new Date()), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <span className="text-sm font-bold text-slate-500">Extension</span>
                    <span className="text-sm font-bold text-slate-900 uppercase tracking-widest">{selectedFile.type || 'Unknown'}</span>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all shadow-sm">
                    <Download size={18} />
                    Download File
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Task Delete Confirmation Modal */}
      <AnimatePresence>
        {taskToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTaskToDelete(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-3xl shadow-2xl z-[120] overflow-hidden"
            >
              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-6 text-rose-500">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Delete Task?</h3>
                <p className="text-slate-500 mb-8 leading-relaxed text-sm">
                  Are you sure you want to permanently delete this task? This action cannot be undone.
                </p>
                <div className="flex gap-4 w-full">
                  <button
                    onClick={() => setTaskToDelete(null)}
                    className="flex-1 py-3.5 bg-slate-50 text-slate-700 rounded-2xl font-bold hover:bg-slate-100 transition-all shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      deleteTask(project.id, taskToDelete);
                      setTaskToDelete(null);
                      if (selectedTask && selectedTask.id === taskToDelete) {
                        setSelectedTask(null);
                      }
                    }}
                    className="flex-1 py-3.5 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-[0_8px_30px_rgb(225,29,72,0.3)] hover:shadow-[0_8px_30px_rgb(225,29,72,0.5)] transform hover:-translate-y-0.5"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
