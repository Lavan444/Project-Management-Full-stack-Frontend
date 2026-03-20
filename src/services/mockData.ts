import { User, Project, Notification, Activity } from '../types/index';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Lavan Kumar', email: 'lavan@example.com', avatar: 'https://picsum.photos/seed/lavan/100/100', role: 'Admin', organizationId: '507f1f77bcf86cd799439011', department: 'Engineering', workload: 85, status: 'online' },
  { id: 'u2', name: 'Sarath', email: 'sarath@example.com', avatar: 'https://picsum.photos/seed/sarath/100/100', role: 'Employee', organizationId: '507f1f77bcf86cd799439011', department: 'Product', workload: 60, status: 'busy' },
  { id: 'u3', name: 'Mike Johnson', email: 'mike@example.com', avatar: 'https://picsum.photos/seed/mike/100/100', role: 'Employee', organizationId: '507f1f77bcf86cd799439011', department: 'Design', workload: 45, status: 'online' },
  { id: 'u4', name: 'Emma Wilson', email: 'emma@example.com', avatar: 'https://picsum.photos/seed/emma/100/100', role: 'Employee', organizationId: '507f1f77bcf86cd799439011', department: 'Marketing', workload: 90, status: 'offline' },
  { id: 'u5', name: 'Alex Rivera', email: 'alex@example.com', avatar: 'https://picsum.photos/seed/alex/100/100', role: 'Employee', organizationId: '507f1f77bcf86cd799439011', department: 'Engineering', workload: 30, status: 'online' },
  { id: 'u-sa', name: 'System Admin', email: 'admin@proflow.com', avatar: 'https://picsum.photos/seed/sa/100/100', role: 'Super Admin', status: 'online' },
];

export const MOCK_ACTIVITIES: Activity[] = [
  { id: 'a1', userId: 'u1', type: 'task_completed', targetId: 't1', targetName: 'Authentication Module', timestamp: '2024-03-03T10:00:00Z' },
  { id: 'a2', userId: 'u2', type: 'comment_added', targetId: 't2', targetName: 'Kanban Board', timestamp: '2024-03-03T14:30:00Z' },
  { id: 'a3', userId: 'u3', type: 'file_uploaded', targetId: 'p1', targetName: 'ProFlow SaaS Platform', timestamp: '2024-03-04T09:15:00Z' },
  { id: 'a4', userId: 'u4', type: 'task_created', targetId: 't5', targetName: 'SEO Optimization', timestamp: '2024-03-04T11:00:00Z' },
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    organizationId: '507f1f77bcf86cd799439011',
    name: 'ProFlow SaaS Platform',
    description: 'Building a comprehensive project management tool for modern teams.',
    status: 'Active',
    health: 'Healthy',
    progress: 65,
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    members: ['u1', 'u2', 'u3', 'u5'],
    tasks: [
      {
        id: 't1',
        projectId: 'p1',
        title: 'Authentication Module',
        description: 'Implement login, register and forgot password flows.',
        status: 'done',
        priority: 'high',
        dueDate: '2024-03-10',
        assigneeId: 'u1',
        subtasks: [
          { id: 's1', title: 'Login UI', completed: true },
          { id: 's2', title: 'API Integration', completed: true },
        ],
        labels: ['Backend', 'Security'],
        comments: [
          { id: 'c1', userId: 'u2', text: 'Great progress on the auth flow!', createdAt: '2024-03-02T09:00:00Z' }
        ]
      },
      {
        id: 't2',
        projectId: 'p1',
        title: 'Kanban Board',
        description: 'Develop drag and drop functionality for tasks.',
        status: 'in-progress',
        priority: 'high',
        dueDate: '2024-03-25',
        assigneeId: 'u2',
        subtasks: [
          { id: 's3', title: 'Drag Logic', completed: true },
          { id: 's4', title: 'Column Management', completed: false },
        ],
        labels: ['Frontend', 'UX'],
        attachments: [
          { id: 'at1', name: 'Board_Design.fig', url: '#', type: 'figma', size: '2.4 MB', uploadedAt: '2024-03-01T10:00:00Z' }
        ]
      },
      {
        id: 't3',
        projectId: 'p1',
        title: 'Dashboard Analytics',
        description: 'Create charts for project and task progress.',
        status: 'todo',
        priority: 'medium',
        dueDate: '2024-04-05',
        assigneeId: 'u3',
        subtasks: [],
        labels: ['Frontend', 'Data']
      }
    ],
    files: [
      { id: 'f1', name: 'Project_Requirements.pdf', type: 'pdf', size: '1.2 MB', uploadedBy: 'u2', uploadedAt: '2024-01-15T10:00:00Z' },
      { id: 'f2', name: 'Brand_Assets.zip', type: 'zip', size: '15.5 MB', uploadedBy: 'u3', uploadedAt: '2024-02-10T14:00:00Z' }
    ],
    activity: MOCK_ACTIVITIES.filter(a => a.targetId === 'p1' || ['t1', 't2', 't3'].includes(a.targetId))
  },
  {
    id: 'p2',
    organizationId: '507f1f77bcf86cd799439011',
    name: 'Marketing Campaign',
    description: 'Q2 digital marketing strategy and execution.',
    status: 'At Risk',
    health: 'At Risk',
    progress: 30,
    startDate: '2024-02-15',
    endDate: '2024-05-15',
    members: ['u1', 'u4', 'u2'],
    tasks: [
      {
        id: 't4',
        projectId: 'p2',
        title: 'Social Media Strategy',
        description: 'Plan content for LinkedIn and Twitter.',
        status: 'review',
        priority: 'medium',
        dueDate: '2024-03-15',
        assigneeId: 'u4',
        subtasks: [],
        labels: ['Marketing']
      },
      {
        id: 't5',
        projectId: 'p2',
        title: 'SEO Optimization',
        description: 'Improve search engine rankings for the landing page.',
        status: 'todo',
        priority: 'high',
        dueDate: '2024-03-20',
        assigneeId: 'u4',
        subtasks: [],
        labels: ['SEO', 'Content']
      }
    ]
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'New Task Assigned', message: 'You have been assigned to "Dashboard Analytics"', time: '2 hours ago', read: false, type: 'info', category: 'task' },
  { id: 'n2', title: 'Project Completed', message: 'The "Internal Audit" project has been marked as done.', time: '1 day ago', read: true, type: 'success', category: 'project' },
  { id: 'n3', title: 'New Comment', message: 'Sarath commented on "Kanban Board"', time: '3 hours ago', read: false, type: 'info', category: 'task' },
];
