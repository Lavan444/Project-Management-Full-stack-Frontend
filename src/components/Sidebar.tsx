import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  Users, 
  Clock, 
  BarChart3, 
  Settings, 
  LogOut,
  X,
  ChevronDown,
  Plus,
  HelpCircle,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'Admin', 'Employee'] },
    { to: '/projects', label: 'Projects', icon: Briefcase, roles: ['Super Admin', 'Admin', 'Employee'] },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare, roles: ['Super Admin', 'Admin', 'Employee'] },
    { to: '/team', label: 'Team', icon: Users, roles: ['Super Admin', 'Admin'] },
    { to: '/timesheet', label: 'Timesheet', icon: Clock, roles: ['Super Admin', 'Admin', 'Employee'] },
    { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['Super Admin', 'Admin'] },
    { to: '/settings', label: 'Settings', icon: Settings, roles: ['Super Admin', 'Admin', 'Employee'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.role))
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-50 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] w-72 flex flex-col shadow-2xl lg:shadow-none",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo & Workspace Selector */}
        <div className="p-8 pb-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Sparkles className="text-white" size={20} />
              </div>
              <span className="font-black text-2xl text-slate-900 tracking-tight">ProFlow</span>
            </div>
            <button className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
              className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center shadow-sm">
                  <span className="text-indigo-600 font-bold text-xs">
                    {user?.role === 'Super Admin' ? 'SA' : 'PC'}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900">
                    {user?.role === 'Super Admin' ? 'System Console' : 'ProFlow Creative'}
                  </p>
                  <p className="text-[10px] font-medium text-slate-500">
                    {user?.role === 'Super Admin' ? 'Root Access' : 'Free Plan'}
                  </p>
                </div>
              </div>
              <ChevronDown size={14} className={cn("text-slate-400 transition-transform", showWorkspaceMenu && "rotate-180")} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Main Menu</p>
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => { if (window.innerWidth < 1024) onClose(); }}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all relative group",
                isActive 
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} className={cn("transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600")} />
                  {item.label}
                  {isActive && (
                    <motion.div 
                      layoutId="active-nav"
                      className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}

          {user?.role !== 'Employee' && (
            <div className="pt-8 px-4">
              <button 
                onClick={() => navigate('/projects')}
                className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-[24px] text-sm font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 group"
              >
                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                New Project
              </button>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-6 space-y-4 border-t border-slate-100">
          {/* <div className="bg-indigo-50 rounded-3xl p-5 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-indigo-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10">
              <p className="text-xs font-bold text-indigo-900 mb-1">Upgrade to Pro</p>
              <p className="text-[10px] text-indigo-700 mb-3 leading-relaxed">Get unlimited projects and advanced team features.</p>
              <button className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold hover:bg-indigo-700 transition-all">Upgrade Now</button>
            </div>
          </div> */}

          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all">
              <HelpCircle size={16} />
              Help Center
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all">
              <MessageCircle size={16} />
              Contact Support
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
