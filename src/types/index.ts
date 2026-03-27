export type Priority = 'low' | 'medium' | 'high';
export type Status = 'todo' | 'in-progress' | 'review' | 'done';
export type Role = 'Super Admin' | 'Admin' | 'Employee' | 'Manager' | 'Developer' | 'Designer';
export type ProjectStatus = 'Active' | 'Completed' | 'On Hold' | 'At Risk';
export type ProjectHealth = 'Healthy' | 'At Risk' | 'Critical';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: Role;
  organizationId?: string; // For SaaS multi-tenancy
  department?: string;
  workload?: number; // percentage 0-100
  status?: 'online' | 'offline' | 'busy';
  timezone?: string;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: string;
  uploadedAt: string;
  file?: File; // For newly added files to be uploaded
}

export interface Task {
  id: string;
  projectId: string;
  project?: string; // Project name for display
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate?: string;
  assigneeId: string; // Keep for backward compatibility
  assigneeIds?: string[]; // New field for multiple assignees
  subtasks: { id: string; title: string; completed: boolean }[];
  comments?: Comment[];
  attachments?: Attachment[];
  labels?: string[];
}

export interface Activity {
  id: string;
  userId: string;
  type: 'task_created' | 'task_completed' | 'task_updated' | 'task_deleted' | 'comment_added' | 'file_uploaded' | 'project_created' | 'project_updated' | 'project_deleted' | 'member_added' | 'member_updated' | 'member_deleted';
  targetId: string; // Task ID or Project ID
  targetName: string;
  timestamp?: string;  // legacy compat
  createdAt?: string;  // from backend
}

export interface ProjectFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Project {
  id: string;
  organizationId: string; // To which org this project belongs
  name: string;
  description: string;
  status: ProjectStatus;
  health: ProjectHealth;
  progress: number;
  startDate: string;
  endDate: string;
  members: string[]; // User IDs
  tasks: Task[];
  files?: ProjectFile[];
  attachments?: Attachment[];
  activity?: Activity[];
  chats?: Comment[];
}

export interface TimesheetEntry {
  id: string;
  userId: string;
  projectId: string;
  taskId: string;
  date: string;
  hours: number;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'task' | 'project' | 'team' | 'system';
}
