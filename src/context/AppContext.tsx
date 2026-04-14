import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Project, Task, Notification, TimesheetEntry, Activity, Comment, ProjectFile, User } from '../types/index';
import { useAuth } from './AuthContext';
import {
  projectApi, taskApi, userApi, timesheetApi,
  notificationApi, activityApi, BACKEND_URL
} from '../services/api';
import { cn } from '../lib/utils';
import { socketService } from '../services/socket';

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
  files: (p.files || []).map((f: any) => ({ 
    ...mapId(f), 
    uploadedAt: f.uploadedAt || f.createdAt,
    url: f.url ? (f.url.startsWith('http') ? f.url : `${BACKEND_URL}${f.url}`) : ''
  })),
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
  attachments: (t.attachments || []).map((a: any) => ({ 
    ...mapId(a), 
    uploadedAt: a.uploadedAt || a.createdAt,
    url: a.url ? (a.url.startsWith('http') ? a.url : `${BACKEND_URL}${a.url}`) : ''
  })),
  subtasks: (t.subtasks || []).map(mapId),
});
const mapUser = (u: any): User => ({
  ...u,
  id: u._id || u.id,
  organizationId: typeof u.organizationId === 'object' ? u.organizationId?._id : u.organizationId,
  avatar: u.avatar ? (u.avatar.startsWith('http') ? u.avatar : `${BACKEND_URL}${u.avatar}`) : u.avatar,
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

  // -- Data fetchers ------------------------------------------------------------
  const refetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await projectApi.getAll();
      const mapped = (res.data || []).map(mapProject);
      setProjects(mapped);
    } catch (err: any) {
      showToast(err.message || 'Failed to load projects', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await userApi.getAll();
      setUsers((res.data || []).map(mapUser));
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
  }, []);

  const refetchTimesheets = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await timesheetApi.getAll();
      setTimesheets((res.data || []).map(mapTimesheet));
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
  }, []);

  const refetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await notificationApi.getAll();
      setNotifications((res.data || []).map(mapNotification));
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
  }, []);

  const refetchActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await activityApi.getAll();
      setActivities((res.data || []).map(mapActivity));
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
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


  useEffect(() => {
    const socket = socketService.getSocket();
    if (socket && isAuthenticated) {
      // 1. Join all project rooms automatically
      projects.forEach(p => socketService.joinProject(p.id));

      // 2. Global Listeners
      socket.on('task_created', () => refetchTasks());
      socket.on('task_updated', () => refetchTasks());
      socket.on('task_deleted', () => refetchTasks());
      socket.on('task_status_updated', () => {
        refetchTasks();
        refetchProjects(); // Progress might change
      });

      socket.on('project_created', () => refetchProjects());
      socket.on('project_updated', () => refetchProjects());
      socket.on('project_deleted', () => refetchProjects());

      socket.on('new_chat_message', () => refetchProjects()); // Updates chat in details

      return () => {
        projects.forEach(p => socketService.leaveProject(p.id));
        socket.off('task_created');
        socket.off('task_updated');
        socket.off('task_deleted');
        socket.off('task_status_updated');
        socket.off('project_created');
        socket.off('project_updated');
        socket.off('project_deleted');
        socket.off('new_chat_message');
      };
    }
  }, [isAuthenticated, projects, refetchTasks, refetchProjects]);


  // -- Toast --------------------------------------------------------------------
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // -- Projects -----------------------------------------------------------------
  const addProject = async (projectData: any): Promise<Project> => {
    try {
      setIsLoading(true);
      const res = await projectApi.create(projectData);
      const created = mapProject(res.data);
      setProjects(prev => [...prev, created]);
      await refetchActivities();
      showToast('Project created successfully');
      return created;
    } catch (err: any) { showToast(err.message || 'Failed to create project', 'error'); throw err; }
    finally { setIsLoading(false); }
  };

  const updateProject = async (project: Project) => {
    try {
      setIsLoading(true);
      await projectApi.update(project.id, project);
      await refetchProjects();
      await refetchActivities();
      showToast('Project updated successfully');
    } catch (err: any) { showToast(err.message || 'Failed to update project', 'error'); throw err; }
    finally { setIsLoading(false); }
  };

  const deleteProject = async (id: string) => {
    try {
      setIsLoading(true);
      await projectApi.delete(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      setTasks(prev => prev.filter(t => t.projectId !== id));
      setTimesheets(prev => prev.filter(t => t.projectId !== id));
      await refetchActivities();
      showToast('Project deleted successfully');
    } catch (err: any) { showToast(err.message || 'Failed to delete project', 'error'); throw err; }
    finally { setIsLoading(false); }
  };

  // -- Tasks ---------------------------------------------------------------------
  const addTask = async (projectId: string, taskData: any) => {
    try {
      setIsLoading(true);
      await taskApi.create(projectId, taskData);
      await refetchTasks();
      await refetchActivities();
      showToast('Task added successfully');
    } catch (err: any) { showToast(err.message || 'Failed to add task', 'error'); throw err; }
    finally { setIsLoading(false); }
  };

  const updateTask = async (projectId: string, task: Task) => {
    try {
      setIsLoading(true);
      await taskApi.update(projectId, task.id, task);
      await refetchTasks();
      await refetchActivities();
      showToast('Task updated successfully');
    } catch (err: any) { showToast(err.message || 'Failed to update task', 'error'); throw err; }
    finally { setIsLoading(false); }
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
      setIsLoading(true);
      await taskApi.updateStatus(projectId, taskId, status);
      await refetchActivities();
    } catch (err: any) {
      // Rollback on error
      await refetchTasks();
      await refetchProjects();
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTask = async (projectId: string, taskId: string) => {
    try {
      setIsLoading(true);
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
    finally { setIsLoading(false); }
  };

  // -- Users ---------------------------------------------------------------------
  const addUser = async (userData: any) => {
    try {
      setIsLoading(true);
      await userApi.create(userData);
      await refetchUsers();
      await refetchActivities();
      showToast('Team member added and invitation sent');
    } catch (err: any) { showToast(err.message || 'Failed to add member', 'error'); throw err; }
    finally { setIsLoading(false); }
  };

  const updateUser = async (updatedUser: User) => {
    try {
      setIsLoading(true);
      await userApi.update(updatedUser.id, updatedUser);
      await refetchUsers();
      await refetchActivities();
      showToast('Member updated successfully');
    } catch (err: any) { showToast(err.message || 'Failed to update member', 'error'); throw err; }
    finally { setIsLoading(false); }
  };

  const deleteUser = async (id: string) => {
    try {
      setIsLoading(true);
      await userApi.delete(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      await refetchActivities();
      showToast('Member removed successfully');
    } catch (err: any) { showToast(err.message || 'Failed to remove member', 'error'); }
    finally { setIsLoading(false); }
  };

  // -- Notifications -------------------------------------------------------------
  const markNotificationRead = async (id: string) => {
    try {
      await notificationApi.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch { /* ignore */ }
  };

  // -- Timesheets ----------------------------------------------------------------
  const addTimesheetEntry = async (entry: any) => {
    try {
      setIsLoading(true);
      await timesheetApi.create(entry);
      await refetchTimesheets();
      showToast('Time logged successfully');
    } catch (err: any) { showToast(err.message || 'Failed to log time', 'error'); throw err; }
    finally { setIsLoading(false); }
  };

  const updateTimesheetEntry = async (entry: TimesheetEntry) => {
    try {
      setIsLoading(true);
      await timesheetApi.update(entry.id, entry);
      await refetchTimesheets();
      showToast('Time entry updated successfully');
    } catch (err: any) { showToast(err.message || 'Failed to update entry', 'error'); throw err; }
    finally { setIsLoading(false); }
  };

  const deleteTimesheetEntry = async (id: string) => {
    try {
      setIsLoading(true);
      await timesheetApi.delete(id);
      setTimesheets(prev => prev.filter(t => t.id !== id));
      showToast('Time entry deleted successfully');
    } catch (err: any) { showToast(err.message || 'Failed to delete entry', 'error'); }
    finally { setIsLoading(false); }
  };

  // -- Comments ------------------------------------------------------------------
  const addComment = async (projectId: string, taskId: string, comment: any) => {
    try {
      setIsLoading(true);
      await taskApi.addComment(projectId, taskId, comment.text);
      await refetchProjects();
      await refetchTasks();
      await refetchActivities();
    } catch (err: any) { showToast(err.message || 'Failed to add comment', 'error'); throw err; }
    finally { setIsLoading(false); }
  };

  // -- Activities ----------------------------------------------------------------
  const addActivity = async (activity: any) => {
    // Activities are auto-created by the backend; this is a no-op placeholder
    // to maintain interface compatibility
  };

  // -- Files ---------------------------------------------------------------------
  const uploadFile = async (projectId: string, file: File) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      await projectApi.uploadFile(projectId, formData);
      await refetchProjects();
      await refetchActivities();
      showToast('File uploaded successfully');
    } catch (err: any) { showToast(err.message || 'Failed to upload file', 'error'); throw err; }
    finally { setIsLoading(false); }
  };

  const deleteFile = async (projectId: string, fileId: string) => {
    try {
      setIsLoading(true);
      await projectApi.deleteFile(projectId, fileId);
      await refetchProjects();
      await refetchActivities();
      showToast('File deleted successfully');
    } catch (err: any) { showToast(err.message || 'Failed to delete file', 'error'); throw err; }
    finally { setIsLoading(false); }
  };

  const addTaskAttachment = async (projectId: string, taskId: string, file: File) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      await taskApi.addAttachment(projectId, taskId, formData);
      await refetchTasks();
      await refetchActivities();
      showToast('Attachment added successfully');
    } catch (err: any) { showToast(err.message || 'Failed to add attachment', 'error'); throw err; }
    finally { setIsLoading(false); }
  };

  const deleteTaskAttachment = async (projectId: string, taskId: string, attachId: string) => {
    try {
      setIsLoading(true);
      await taskApi.deleteAttachment(projectId, taskId, attachId);
      await refetchTasks();
      await refetchActivities();
      showToast('Attachment deleted successfully');
    } catch (err: any) { showToast(err.message || 'Failed to delete attachment', 'error'); throw err; }
    finally { setIsLoading(false); }
  };

  // -- Chat ----------------------------------------------------------------------
  const addProjectChat = async (projectId: string, chat: { text: string }) => {
    try {
      setIsLoading(true);
      await projectApi.sendChat(projectId, chat.text);
      await refetchProjects();
      await refetchActivities();
    } catch (err: any) { showToast(err.message || 'Failed to send message', 'error'); throw err; }
    finally { setIsLoading(false); }
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
