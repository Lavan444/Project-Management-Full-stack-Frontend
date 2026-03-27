import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Project, Task, Notification, TimesheetEntry, Activity, Comment, ProjectFile, User } from '../types/index';
import { useAuth } from './AuthContext';
import {
  projectApi, taskApi, userApi, timesheetApi,
  notificationApi, activityApi
} from '../services/api';
import { cn } from '../lib/utils';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  projects: Project[];
  notifications: Notification[];
  timesheets: TimesheetEntry[];
  users: User[];
  activities: Activity[];
  tasks: Task[];
  toasts: Toast[];
  isLoading: boolean;
  addProject: (project: Omit<Project, 'id'>) => Promise<Project>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addTask: (projectId: string, task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (projectId: string, task: Task) => Promise<void>;
  updateTaskStatus: (taskId: string, status: string, projectId: string) => Promise<void>;
  deleteTask: (projectId: string, taskId: string) => Promise<void>;
  addUser: (user: Omit<User, 'id'> & { password?: string }) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  addTimesheetEntry: (entry: Omit<TimesheetEntry, 'id'>) => Promise<void>;
  updateTimesheetEntry: (entry: TimesheetEntry) => Promise<void>;
  deleteTimesheetEntry: (id: string) => Promise<void>;
  addComment: (projectId: string, taskId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => Promise<void>;
  addActivity: (activity: Pick<Activity, 'type' | 'targetId' | 'targetName'>) => Promise<void>;
  uploadFile: (projectId: string, file: File) => Promise<void>;
  deleteFile: (projectId: string, fileId: string) => Promise<void>;
  addProjectChat: (projectId: string, chat: { text: string }) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  refetchProjects: () => Promise<void>;
  refetchTasks: () => Promise<void>;
  refetchUsers: () => Promise<void>;
  refetchTimesheets: () => Promise<void>;
  refetchNotifications: () => Promise<void>;
  refetchActivities: () => Promise<void>;
  addTaskAttachment: (projectId: string, taskId: string, file: File) => Promise<void>;
  deleteTaskAttachment: (projectId: string, taskId: string, attachId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/** Map backend document (_id) to frontend shape (id) */
const mapId = (obj: any) => obj ? { ...obj, id: obj._id || obj.id } : obj;
const mapList = (arr: any[]) => arr.map(mapId);
const mapProject = (p: any): Project => ({
  ...p,
  id: p._id || p.id,
  members: (p.members || []).map((m: any) => (typeof m === 'object' ? m._id || m.id : m)),
  tasks: (p.tasks || []).map((t: any) => mapTask(t, p._id || p.id)),
  files: (p.files || []).map((f: any) => ({ ...mapId(f), uploadedAt: f.uploadedAt || f.createdAt })),
  chats: (p.chats || []).map(mapId),
  activity: (p.activity || []).map(mapId),
});
const mapTask = (t: any, projectId?: string): Task => ({
  ...t,
  id: t._id || t.id,
  projectId: t.projectId || projectId,
  assigneeId: typeof t.assigneeId === 'object' ? t.assigneeId?._id : t.assigneeId,
  assigneeIds: (t.assigneeIds || []).map((a: any) => (typeof a === 'object' ? a._id || a.id : a)),
  comments: (t.comments || []).map((c: any) => ({
    ...c,
    id: c._id || c.id,
    userId: typeof c.userId === 'object' ? c.userId._id || c.userId.id : c.userId,
  })),
  attachments: (t.attachments || []).map((a: any) => ({ ...mapId(a), uploadedAt: a.uploadedAt || a.createdAt })),
  subtasks: (t.subtasks || []).map(mapId),
});
const mapUser = (u: any): User => ({
  ...u,
  id: u._id || u.id,
  organizationId: typeof u.organizationId === 'object' ? u.organizationId?._id : u.organizationId,
});
const mapTimesheet = (e: any): TimesheetEntry => ({
  ...e,
  id: e._id || e.id,
  userId: typeof e.userId === 'object' ? e.userId._id || e.userId.id : e.userId,
  projectId: typeof e.projectId === 'object' ? e.projectId._id || e.projectId.id : e.projectId,
  taskId: typeof e.taskId === 'object' ? e.taskId?._id || e.taskId?.id : e.taskId,
});
const mapActivity = (a: any): Activity => ({
  ...a,
  id: a._id || a.id,
  userId: typeof a.userId === 'object' && a.userId !== null ? (a.userId._id || a.userId.id) : a.userId,
});
const mapNotification = (n: any): Notification => ({
  ...n,
  id: n._id || n.id,
  time: n.createdAt || n.time,
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── Data fetchers ────────────────────────────────────────────────────────────
  const refetchProjects = useCallback(async () => {
    try {
      const res = await projectApi.getAll();
      const mapped = (res.data || []).map(mapProject);
      setProjects(mapped);
    } catch (err: any) {
      showToast(err.message || 'Failed to load projects', 'error');
    }
  }, []);

  const refetchTasks = useCallback(async () => {
    try {
      const res = await taskApi.getAll();
      const projectsSnap = await projectApi.getAll();
      const projectMap = new Map(
        (projectsSnap.data || []).map((p: any) => [String(p._id || p.id), p.name])
      );
      const mapped = (res.data || []).map((t: any) => ({
        ...mapTask(t),
        project: projectMap.get(String(t.projectId?._id || t.projectId)) || '',
      }));
      setTasks(mapped);
    } catch (err: any) {
      showToast(err.message || 'Failed to load tasks', 'error');
    }
  }, []);

  const refetchUsers = useCallback(async () => {
    try {
      const res = await userApi.getAll();
      setUsers((res.data || []).map(mapUser));
    } catch { /* ignore */ }
  }, []);

  const refetchTimesheets = useCallback(async () => {
    try {
      const res = await timesheetApi.getAll();
      setTimesheets((res.data || []).map(mapTimesheet));
    } catch { /* ignore */ }
  }, []);

  const refetchNotifications = useCallback(async () => {
    try {
      const res = await notificationApi.getAll();
      setNotifications((res.data || []).map(mapNotification));
    } catch { /* ignore */ }
  }, []);

  const refetchActivities = useCallback(async () => {
    try {
      const res = await activityApi.getAll();
      setActivities((res.data || []).map(mapActivity));
    } catch { /* ignore */ }
  }, []);

  // Fetch all data when user logs in
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const fetchAll = async () => {
      setIsLoading(true);
      await Promise.all([
        refetchProjects(),
        refetchTasks(),
        refetchUsers(),
        refetchTimesheets(),
        refetchNotifications(),
        refetchActivities(),
      ]);
      setIsLoading(false);
    };
    fetchAll();
  }, [isAuthenticated, user?.id]);

  // ── Toast ────────────────────────────────────────────────────────────────────
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // ── Projects ─────────────────────────────────────────────────────────────────
  const addProject = async (projectData: any): Promise<Project> => {
    try {
      const res = await projectApi.create(projectData);
      const created = mapProject(res.data);
      setProjects(prev => [...prev, created]);
      await refetchActivities();
      showToast('Project created successfully');
      return created;
    } catch (err: any) { showToast(err.message || 'Failed to create project', 'error'); throw err; }
  };

  const updateProject = async (project: Project) => {
    try {
      await projectApi.update(project.id, project);
      await refetchProjects();
      await refetchActivities();
      showToast('Project updated successfully');
    } catch (err: any) { showToast(err.message || 'Failed to update project', 'error'); throw err; }
  };

  const deleteProject = async (id: string) => {
    try {
      await projectApi.delete(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      setTasks(prev => prev.filter(t => t.projectId !== id));
      setTimesheets(prev => prev.filter(t => t.projectId !== id));
      await refetchActivities();
      showToast('Project deleted successfully');
    } catch (err: any) { showToast(err.message || 'Failed to delete project', 'error'); throw err; }
  };

  // ── Tasks ─────────────────────────────────────────────────────────────────────
  const addTask = async (projectId: string, taskData: any) => {
    try {
      await taskApi.create(projectId, taskData);
      await refetchTasks();
      await refetchActivities();
      showToast('Task added successfully');
    } catch (err: any) { showToast(err.message || 'Failed to add task', 'error'); throw err; }
  };

  const updateTask = async (projectId: string, task: Task) => {
    try {
      await taskApi.update(projectId, task.id, task);
      await refetchTasks();
      await refetchActivities();
      showToast('Task updated successfully');
    } catch (err: any) { showToast(err.message || 'Failed to update task', 'error'); throw err; }
  };

  const updateTaskStatus = async (taskId: string, status: string, projectId: string) => {
    // Optimistic Update
    setTasks(prevTasks => {
      const newTasks = prevTasks.map(t => t.id === taskId ? { ...t, status: status as any } : t);
      setProjects(prevProjects => prevProjects.map(p => {
        if (p.id !== projectId) return p;
        const pTasks = newTasks.filter(t => t.projectId === projectId);
        const done = pTasks.filter(t => t.status === 'done').length;
        return { ...p, progress: pTasks.length ? Math.round((done / pTasks.length) * 100) : 0 };
      }));
      return newTasks;
    });

    try {
      await taskApi.updateStatus(projectId, taskId, status);
      await refetchActivities();
    } catch (err: any) {
      // Rollback on error
      await refetchTasks();
      await refetchProjects();
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const deleteTask = async (projectId: string, taskId: string) => {
    try {
      await taskApi.delete(projectId, taskId);
      setTasks(prevTasks => {
        const newTasks = prevTasks.filter(t => t.id !== taskId);
        setProjects(prevProjects => prevProjects.map(p => {
          if (p.id !== projectId) return p;
          const pTasks = newTasks.filter(t => t.projectId === projectId);
          const done = pTasks.filter(t => t.status === 'done').length;
          return { ...p, progress: pTasks.length ? Math.round((done / pTasks.length) * 100) : 0 };
        }));
        return newTasks;
      });
      await refetchActivities();
      showToast('Task deleted successfully');
    } catch (err: any) { showToast(err.message || 'Failed to delete task', 'error'); }
  };

  // ── Users ─────────────────────────────────────────────────────────────────────
  const addUser = async (userData: any) => {
    try {
      await userApi.create({ ...userData, password: userData.password || 'ProFlow@123' });
      await refetchUsers();
      await refetchActivities();
      showToast('Team member added successfully');
    } catch (err: any) { showToast(err.message || 'Failed to add member', 'error'); throw err; }
  };

  const updateUser = async (updatedUser: User) => {
    try {
      await userApi.update(updatedUser.id, updatedUser);
      await refetchUsers();
      await refetchActivities();
      showToast('Member updated successfully');
    } catch (err: any) { showToast(err.message || 'Failed to update member', 'error'); throw err; }
  };

  const deleteUser = async (id: string) => {
    try {
      await userApi.delete(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      await refetchActivities();
      showToast('Member removed successfully');
    } catch (err: any) { showToast(err.message || 'Failed to remove member', 'error'); }
  };

  // ── Notifications ─────────────────────────────────────────────────────────────
  const markNotificationRead = async (id: string) => {
    try {
      await notificationApi.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch { /* ignore */ }
  };

  // ── Timesheets ────────────────────────────────────────────────────────────────
  const addTimesheetEntry = async (entry: any) => {
    try {
      await timesheetApi.create(entry);
      await refetchTimesheets();
      showToast('Time logged successfully');
    } catch (err: any) { showToast(err.message || 'Failed to log time', 'error'); throw err; }
  };

  const updateTimesheetEntry = async (entry: TimesheetEntry) => {
    try {
      await timesheetApi.update(entry.id, entry);
      await refetchTimesheets();
      showToast('Time entry updated successfully');
    } catch (err: any) { showToast(err.message || 'Failed to update entry', 'error'); throw err; }
  };

  const deleteTimesheetEntry = async (id: string) => {
    try {
      await timesheetApi.delete(id);
      setTimesheets(prev => prev.filter(t => t.id !== id));
      showToast('Time entry deleted successfully');
    } catch (err: any) { showToast(err.message || 'Failed to delete entry', 'error'); }
  };

  // ── Comments ──────────────────────────────────────────────────────────────────
  const addComment = async (projectId: string, taskId: string, comment: any) => {
    try {
      await taskApi.addComment(projectId, taskId, comment.text);
      await refetchProjects();
      await refetchTasks();
      await refetchActivities();
    } catch (err: any) { showToast(err.message || 'Failed to add comment', 'error'); throw err; }
  };

  // ── Activities ────────────────────────────────────────────────────────────────
  const addActivity = async (activity: any) => {
    // Activities are auto-created by the backend; this is a no-op placeholder
    // to maintain interface compatibility
  };

  // ── Files ─────────────────────────────────────────────────────────────────────
  const uploadFile = async (projectId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      await projectApi.uploadFile(projectId, formData);
      await refetchProjects();
      await refetchActivities();
      showToast('File uploaded successfully');
    } catch (err: any) { showToast(err.message || 'Failed to upload file', 'error'); throw err; }
  };

  const deleteFile = async (projectId: string, fileId: string) => {
    try {
      await projectApi.deleteFile(projectId, fileId);
      await refetchProjects();
      await refetchActivities();
      showToast('File deleted successfully');
    } catch (err: any) { showToast(err.message || 'Failed to delete file', 'error'); throw err; }
  };

  const addTaskAttachment = async (projectId: string, taskId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      await taskApi.addAttachment(projectId, taskId, formData);
      await refetchTasks();
      await refetchActivities();
      showToast('Attachment added successfully');
    } catch (err: any) { showToast(err.message || 'Failed to add attachment', 'error'); throw err; }
  };

  const deleteTaskAttachment = async (projectId: string, taskId: string, attachId: string) => {
    try {
      await taskApi.deleteAttachment(projectId, taskId, attachId);
      await refetchTasks();
      await refetchActivities();
      showToast('Attachment deleted successfully');
    } catch (err: any) { showToast(err.message || 'Failed to delete attachment', 'error'); throw err; }
  };

  // ── Chat ──────────────────────────────────────────────────────────────────────
  const addProjectChat = async (projectId: string, chat: { text: string }) => {
    try {
      await projectApi.sendChat(projectId, chat.text);
      await refetchProjects();
      await refetchActivities();
    } catch (err: any) { showToast(err.message || 'Failed to send message', 'error'); throw err; }
  };

  const projectsWithTasks = React.useMemo(() => {
    return projects.map(p => ({
      ...p,
      tasks: tasks.filter(t => t.projectId === p.id),
      activity: activities.filter(a => a.projectId === p.id || a.targetId === p.id)
    }));
  }, [projects, tasks, activities]);

  return (
    <AppContext.Provider value={{
      projects: projectsWithTasks,
      notifications,
      timesheets,
      users,
      activities,
      tasks,
      toasts,
      isLoading,
      addProject,
      updateProject,
      deleteProject,
      addTask,
      updateTask,
      updateTaskStatus,
      deleteTask,
      addUser,
      updateUser,
      deleteUser,
      markNotificationRead,
      addTimesheetEntry,
      updateTimesheetEntry,
      deleteTimesheetEntry,
      addComment,
      addActivity,
      uploadFile,
      deleteFile,
      addTaskAttachment,
      deleteTaskAttachment,
      addProjectChat,
      showToast,
      refetchProjects,
      refetchTasks,
      refetchUsers,
      refetchTimesheets,
      refetchNotifications,
      refetchActivities,
    }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={cn(
              "px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300 pointer-events-auto",
              toast.type === 'success' ? "bg-emerald-600 text-white" :
                toast.type === 'error' ? "bg-rose-600 text-white" : "bg-slate-800 text-white"
            )}
          >
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
