import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Download, 
  Filter, 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp,
  FileText,
  ChevronRight,
  Clock,
  Calendar,
  Share2,
  Printer,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Users,
  Layers
} from 'lucide-react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';

export const Reports: React.FC = () => {
  const { projects, tasks, users } = useAppContext();
  const [reportType, setReportType] = useState('Overview');

  // Dynamic Task Distribution Data
  const todoTasks = tasks.filter(t => t.status === 'todo').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const reviewTasks = tasks.filter(t => t.status === 'review').length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;

  const performanceData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Completed Tasks',
        data: [45, 52, 48, 70, 65, doneTasks], // Using actual doneTasks for the current month
        borderColor: '#4f46e1',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#4f46e1',
      },
      {
        label: 'New Projects',
        data: [12, 15, 10, 22, 18, projects.length], // Using actual projects length
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#10b981',
      }
    ],
  };

  const projectStatusData = {
    labels: ['On Track', 'At Risk', 'Off Track'],
    datasets: [{
      data: [
        projects.filter(p => p.health === 'Healthy').length,
        projects.filter(p => p.health === 'At Risk').length,
        projects.filter(p => p.health === 'Critical').length,
      ],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const taskDistributionData = {
    labels: ['To Do', 'In Progress', 'In Review', 'Done'],
    datasets: [{
      label: 'Tasks',
      data: [todoTasks, inProgressTasks, reviewTasks, doneTasks],
      backgroundColor: ['#f1f5f9', '#dbeafe', '#fef3c7', '#d1fae5'],
      borderColor: ['#cbd5e1', '#3b82f6', '#f59e0b', '#10b981'],
      borderWidth: 1,
      borderRadius: 8,
    }]
  };

  const kpis = [
    { label: 'Avg. Completion Time', value: '3.2 Days', change: '+12%', trend: 'up', icon: Clock, color: 'indigo' },
    { label: 'Project Success Rate', value: `${((projects.filter(p => p.status === 'Completed').length / (projects.length || 1)) * 100).toFixed(1)}%`, change: '+2.4%', trend: 'up', icon: Target, color: 'emerald' },
    { label: 'Resource Utilization', value: `${(users.reduce((sum, u) => sum + (u.workload || 0), 0) / (users.length || 1)).toFixed(0)}%`, change: '-5%', trend: 'down', icon: Users, color: 'amber' },
    { label: 'Active Tasks', value: tasks.filter(t => t.status !== 'done').length.toString(), change: '+8', trend: 'up', icon: Layers, color: 'blue' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-slate-500 mt-1">Comprehensive insights into your team's productivity and project health.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
            {['Overview', 'Team', 'Projects'].map(type => (
              <button 
                key={type}
                onClick={() => setReportType(type)}
                className={cn(
                  "px-5 py-2 rounded-xl text-sm font-bold transition-all",
                  reportType === type ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {type}
              </button>
            ))}
          </div>
          
          <button className="p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
            <Share2 size={20} />
          </button>
          
          <button className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            <Download size={20} />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm group hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn(
                "p-3 rounded-2xl shadow-sm",
                kpi.color === 'indigo' ? "bg-indigo-50 text-indigo-600" :
                kpi.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                kpi.color === 'amber' ? "bg-amber-50 text-amber-600" :
                "bg-blue-50 text-blue-600"
              )}>
                <kpi.icon size={24} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg",
                kpi.trend === 'up' ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
              )}>
                {kpi.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {kpi.change}
              </div>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
            <p className="text-3xl font-bold text-slate-900">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Performance Trends</h2>
              <p className="text-slate-500 text-sm">Monthly task completion vs project starts</p>
            </div>
            <select className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer pr-10 relative">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[400px]">
            <Line 
              data={performanceData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { 
                  legend: { 
                    position: 'bottom',
                    labels: {
                      usePointStyle: true,
                      padding: 20,
                      font: { weight: 'bold', size: 12 }
                    }
                  } 
                },
                scales: {
                  y: { 
                    grid: { color: '#f1f5f9' },
                    ticks: { font: { weight: 'bold' }, color: '#94a3b8' }
                  },
                  x: { 
                    grid: { display: false },
                    ticks: { font: { weight: 'bold' }, color: '#94a3b8' }
                  }
                }
              }} 
            />
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Project Health</h3>
            <div className="h-64 relative">
              <Doughnut 
                data={projectStatusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '75%',
                  plugins: { legend: { display: false } }
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-slate-900">{projects.length}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</span>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              {[
                { label: 'Healthy', count: projects.filter(p => p.health === 'Healthy').length, color: 'bg-emerald-500' },
                { label: 'At Risk', count: projects.filter(p => p.health === 'At Risk').length, color: 'bg-amber-500' },
                { label: 'Critical', count: projects.filter(p => p.health === 'Critical').length, color: 'bg-rose-500' },
              ].map(status => (
                <div key={status.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-3 h-3 rounded-full", status.color)} />
                    <span className="text-sm font-bold text-slate-600">{status.label}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{status.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-all" />
            <h3 className="text-xl font-bold mb-6 relative z-10">Recent Reports</h3>
            <div className="space-y-4 relative z-10">
              {[
                { name: 'Q1_Performance.pdf', date: '2 days ago', size: '2.4 MB' },
                { name: 'Team_Capacity.csv', date: '5 days ago', size: '1.1 MB' },
                { name: 'Project_Audit.pdf', date: '1 week ago', size: '4.8 MB' },
              ].map(file => (
                <div key={file.name} className="flex items-center justify-between p-4 bg-white/5 rounded-3xl hover:bg-white/10 transition-all cursor-pointer group/item border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/10 rounded-xl">
                      <FileText size={20} className="text-indigo-300" />
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-slate-200">{file.name}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{file.date} • {file.size}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-600 group-hover/item:text-white transition-colors" />
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-sm transition-all border border-white/10">
              View All Reports
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Task Distribution</h2>
            <p className="text-slate-500 text-sm">Task count by current status</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-100 transition-all">
            <Filter size={18} />
            Filter by Team
          </button>
        </div>
        <div className="h-80">
          <Bar 
            data={taskDistributionData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { grid: { color: '#f1f5f9' }, ticks: { font: { weight: 'bold' }, color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { font: { weight: 'bold' }, color: '#94a3b8' } }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
