import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Calendar,
  Plus,
  Users,
  Search,
  Filter,
  MoreHorizontal,
  ChevronRight,
  Activity as ActivityIcon,
  Heart,
  Shield,
  Building2,
  Layout
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { MemberAvatar } from '../components/MemberAvatar';
import { cn } from '../lib/utils';
import { format, isAfter, isBefore, addDays } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { projects, users, activities, tasks } = useAppContext();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('Last 7 Days');

  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const todoTasks = tasks.filter(t => t.status === 'todo').length;
  const reviewTasks = tasks.filter(t => t.status === 'review').length;

  const upcomingDeadlines = tasks
    .filter(t => t.status !== 'done' && t.dueDate && isAfter(new Date(t.dueDate), new Date()) && isBefore(new Date(t.dueDate), addDays(new Date(), 7)))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  // Dynamic stats based on role
  const getStats = () => {
    if (user?.role === 'Super Admin') {
      return [
        { label: 'Total Projects', value: projects.length, icon: Layout, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+8%', path: '/projects' },
        { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+15%', path: '/team' },
        { label: 'System Health', value: '99.9%', icon: Shield, color: 'text-rose-600', bg: 'bg-rose-50', trend: 'Stable', path: '/reports' },
      ];
    }

    if (user?.role === 'Admin' || user?.role === 'Manager') {
      return [
        { label: user?.role === 'Admin' ? 'Team Projects' : 'My Projects', value: projects.length, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%', path: '/projects' },
        { label: 'Active Tasks', value: tasks.length - completedTasks, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', trend: '+5%', path: '/tasks' },
        { label: 'Completed', value: completedTasks, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+18%', path: '/tasks' },
        { label: 'Overdue', value: tasks.filter(t => t.status !== 'done' && isBefore(new Date(t.dueDate), new Date())).length, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', trend: '-2%', path: '/tasks' },
      ];
    }

    // Employee Stats
    return [
      { label: 'My Projects', value: projects.length, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'Active', path: '/projects' },
      { label: 'My Tasks', value: tasks.length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', trend: `${inProgressTasks} In Progress`, path: '/tasks' },
      { label: 'Completed', value: completedTasks, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Lifetime', path: '/tasks' },
    ];
  };

  const stats = getStats();

  const barData = {
    labels: projects.map(p => p.name),
    datasets: [
      {
        label: 'Progress (%)',
        data: projects.map(p => p.progress),
        backgroundColor: 'rgba(79, 70, 229, 0.8)',
        borderRadius: 8,
        barThickness: 24,
      },
    ],
  };

  const pieData = {
    labels: ['To Do', 'In Progress', 'Review', 'Done'],
    datasets: [
      {
        data: [todoTasks, inProgressTasks, reviewTasks, completedTasks],
        backgroundColor: ['#f1f5f9', '#dbeafe', '#fef3c7', '#d1fae5'],
        borderColor: ['#cbd5e1', '#3b82f6', '#f59e0b', '#10b981'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {user?.role === 'Super Admin' ? 'System Overview' :
              user?.role === 'Admin' ? 'Organization Dashboard' :
                user?.role === 'Manager' ? 'Management Workspace' : 'My Workspace'}
          </h1>
          <p className="text-slate-500 mt-1">
            {user?.role === 'Super Admin' ? 'Manage global organizations and system health.' :
              user?.role === 'Admin' ? "Welcome back! Here's what's happening across your team." :
                user?.role === 'Manager' ? "Welcome back! Overview of your managed projects and tasks." :
                  "Welcome back! Here's a summary of your assigned work."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-300 transition-all text-sm font-medium text-slate-600">
              <Calendar size={16} className="text-slate-400" />
              {dateRange}
              <Filter size={14} className="ml-1 text-slate-400" />
            </button>
          </div>

          {/* {user?.role !== 'Employee' && (
            <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
              <Plus size={18} />
              New Project
            </button>
          )} */}

          {/* <button className="bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
            <Plus size={18} />
            {user?.role === 'Super Admin' ? 'Add Admin' : 'Add Task'}
          </button> */}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => stat.path && navigate(stat.path)}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer hover:border-indigo-100 hover:bg-indigo-50/5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-2xl transition-colors", stat.bg)}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <span className={cn(
                "text-xs font-bold px-2 py-1 rounded-lg",
                stat.trend.startsWith('+') ? "bg-emerald-50 text-emerald-600" :
                  stat.trend.includes('Stable') || stat.trend.includes('Active') ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
              )}>
                {stat.trend}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900">
                  {user?.role === 'Super Admin' ? 'Org Growth' : 'Project Progress'}
                </h2>
                <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <MoreHorizontal size={18} className="text-slate-400" />
                </button>
              </div>
              <div className="h-64">
                <Bar
                  data={barData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true, max: 100, grid: { color: '#f1f5f9' } },
                      x: { grid: { display: false } }
                    }
                  }}
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900">Task Distribution</h2>
                <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <MoreHorizontal size={18} className="text-slate-400" />
                </button>
              </div>
              <div className="h-64 flex justify-center">
                <Pie
                  data={pieData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' as const, labels: { usePointStyle: true, padding: 20 } } }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <ActivityIcon className="text-indigo-600" size={20} />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
              </div>
              <button className="text-indigo-600 text-sm font-bold hover:underline flex items-center gap-1">
                View All <ChevronRight size={14} />
              </button>
            </div>

            <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 custom-scrollbar" style={{ maxHeight: "300px", overflowY: "auto" }}>
              {activities.slice(0, 5).map((activity, idx) => {
                const activityUser = users.find(u => u.id === activity.userId);
                return (
                  <div key={activity.id} className="flex gap-4 relative z-10">
                    <MemberAvatar
                      user={activityUser}
                      size="md"
                      className="flex-shrink-0 z-10"
                    />
                    <div className="flex-1 pt-1">
                      <p className="text-sm text-slate-600">
                        <span className="font-bold text-slate-900">{activityUser?.name}</span>
                        {' '}
                        {activity.type === 'task_completed' && 'completed the task'}
                        {activity.type === 'comment_added' && 'commented on'}
                        {activity.type === 'file_uploaded' && 'uploaded a file to'}
                        {activity.type === 'task_created' && 'created a new task'}
                        {activity.type === 'project_created' && 'created a new project'}
                        {' '}
                        <span className="font-bold text-indigo-600 cursor-pointer hover:underline">{activity.targetName}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{activity.createdAt ? format(new Date(activity.createdAt), 'MMM d, h:mm a') : ''}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          {/* Project Health Widget */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 rounded-xl">
                <Heart className="text-emerald-600" size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Project Health</h2>
            </div>
            <div className="space-y-4 custom-scrollbar" style={{ maxHeight: "254px", overflowY: "auto", minHeight: "254px" }}>
              {projects.slice(0, 5).map(project => (
                <div key={project.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      project.health === 'Healthy' ? "bg-emerald-500" :
                        project.health === 'At Risk' ? "bg-amber-500" : "bg-rose-500"
                    )} />
                    <span className="text-sm font-bold text-slate-700">{project.name}</span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg",
                    project.health === 'Healthy' ? "bg-emerald-50 text-emerald-600" :
                      project.health === 'At Risk' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                  )}>
                    {project.health}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Deadlines Widget */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-rose-50 rounded-xl">
                <Calendar className="text-rose-600" size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Upcoming Deadlines</h2>
            </div>
            <div className="space-y-4">
              {upcomingDeadlines.length > 0 ? upcomingDeadlines.map(task => (
                <div key={task.id} className="group cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors line-clamp-1">{task.title}</span>
                    <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg">
                      {task.dueDate ? format(new Date(task.dueDate), 'MMM d') : '—'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{projects.find(p => p.id === task.projectId)?.name}</p>
                </div>
              )) : (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-400 italic">No upcoming deadlines</p>
                </div>
              )}
            </div>
          </div>

          {/* Team Workload Widget */}
          {user?.role !== 'Employee' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Users className="text-blue-600" size={20} />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Team Workload</h2>
              </div>
              <div className="space-y-5 custom-scrollbar" style={{ maxHeight: "254px", overflowY: "auto" }}>
                {users.slice(0, 4).map(teamUser => (
                  <div key={teamUser.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MemberAvatar user={teamUser} size="xs" showName />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">{teamUser.workload}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${teamUser.workload}%` }}
                        className={cn(
                          "h-full rounded-full",
                          (teamUser.workload || 0) > 80 ? "bg-rose-500" :
                            (teamUser.workload || 0) > 50 ? "bg-amber-500" : "bg-emerald-500"
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
