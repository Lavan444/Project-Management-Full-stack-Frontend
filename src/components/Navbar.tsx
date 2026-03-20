import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  Menu, 
  User as UserIcon, 
  Check, 
  Settings, 
  LogOut, 
  User, 
  ChevronDown,
  MessageSquare,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  X,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAppContext();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (category?: string) => {
    switch (category) {
      case 'Task': return <CheckCircle2 className="text-emerald-500" size={16} />;
      case 'System': return <AlertCircle className="text-rose-500" size={16} />;
      case 'Team': return <MessageSquare className="text-blue-500" size={16} />;
      default: return <Bell className="text-slate-400" size={16} />;
    }
  };

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 lg:px-10 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2.5 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all"
        >
          <Menu size={22} />
        </button>
        <div className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl w-80 lg:w-[400px] group focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
          <Search size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search projects, tasks, or team..." 
            className="bg-transparent border-none outline-none text-sm w-full text-slate-900 placeholder:text-slate-400 font-medium"
          />
          <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-400 shadow-sm">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              "p-3 text-slate-500 hover:bg-slate-100 rounded-2xl relative transition-all",
              showNotifications && "bg-slate-100 text-indigo-600"
            )}
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-[400px] bg-white border border-slate-200 rounded-[32px] shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Notifications</h3>
                    <p className="text-xs text-slate-500 font-medium">You have {unreadCount} unread messages</p>
                  </div>
                  <button 
                    onClick={markAllNotificationsRead}
                    className="text-xs text-indigo-600 font-bold hover:text-indigo-700 px-3 py-1.5 bg-indigo-50 rounded-xl transition-all"
                  >
                    Mark all as read
                  </button>
                </div>
                <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="text-slate-300" size={32} />
                      </div>
                      <p className="text-slate-500 font-bold">All caught up!</p>
                      <p className="text-xs text-slate-400 mt-1">No new notifications for you.</p>
                    </div>
                  ) : (
                    notifications.map((n, idx) => (
                      <motion.div 
                        key={n.id} 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={cn(
                          "p-5 border-b border-slate-50 hover:bg-slate-50 transition-all cursor-pointer flex gap-4 relative group",
                          !n.read && "bg-indigo-50/20"
                        )}
                        onClick={() => markNotificationRead(n.id)}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm",
                          n.category === 'Task' ? "bg-emerald-50" : 
                          n.category === 'System' ? "bg-rose-50" : 
                          n.category === 'Team' ? "bg-blue-50" : "bg-slate-50"
                        )}>
                          {getNotificationIcon(n.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-bold text-slate-900 truncate pr-4">{n.title}</h4>
                            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{n.time}</span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed mb-2 line-clamp-2">{n.message}</p>
                          {!n.read && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">New</span>
                            </div>
                          )}
                        </div>
                        <button className="absolute top-5 right-5 p-1 text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-all">
                          <X size={14} />
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>
                <div className="p-4 text-center border-t border-slate-100 bg-slate-50/50">
                  <button className="text-sm text-slate-600 font-bold hover:text-indigo-600 flex items-center justify-center gap-2 mx-auto transition-all">
                    View all notifications
                    <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-10 w-px bg-slate-200 hidden sm:block" />
        
        {/* Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-1.5 hover:bg-slate-100 rounded-2xl transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 border-2 border-white shadow-md overflow-hidden group-hover:shadow-lg transition-all">
              <img 
                src={user?.avatar} 
                alt="Profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-left hidden sm:block pr-2">
              <p className="text-sm font-bold text-slate-900 line-clamp-1">{user?.name}</p>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-sm",
                  user?.role === 'Super Admin' ? "bg-rose-50 text-rose-600 border-rose-100" :
                  user?.role === 'Admin' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                  "bg-emerald-50 text-emerald-600 border-emerald-100"
                )}>
                  {user?.role}
                </span>
                <ChevronDown size={12} className={cn("text-slate-400 transition-transform", showProfileMenu && "rotate-180")} />
              </div>
            </div>
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-64 bg-white border border-slate-200 rounded-[32px] shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Account</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 border-2 border-white shadow-sm overflow-hidden">
                      <img src={user?.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-2xl transition-all">
                    <User size={18} />
                    My Profile
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-2xl transition-all">
                    <Settings size={18} />
                    Account Settings
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-2xl transition-all">
                    <Calendar size={18} />
                    My Schedule
                  </button>
                </div>
                <div className="p-3 bg-slate-50/50 border-t border-slate-100">
                  <button 
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
