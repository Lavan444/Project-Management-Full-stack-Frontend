import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Mail,
  MoreVertical,
  Shield,
  Search,
  Filter,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  X,
  UserPlus,
  Globe,
  Briefcase,
  CheckCircle2,
  Trash2,
  Edit2
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { MemberAvatar } from '../components/MemberAvatar';
import { cn } from '../lib/utils';
import { User, Role } from '../types';

export const Team: React.FC = () => {
  const { users, addUser, updateUser, deleteUser } = useAppContext();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState('All Roles');

  const canManageTeam = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Employee' as Role,
    department: 'Engineering',
    timezone: 'UTC+0',
    avatar: `https://i.pravatar.cc/150?u=${Date.now()}`
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'All Roles' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const roles = ['All Roles', 'Super Admin', 'Admin', 'Employee', 'Manager', 'Developer', 'Designer'];

  const handleOpenModal = (user?: User) => {
    if (!canManageTeam && !user) return;
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || 'Engineering',
        timezone: user.timezone || 'UTC+0',
        avatar: user.avatar
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'Employee',
        department: 'Engineering',
        timezone: 'UTC+0',
        avatar: `https://i.pravatar.cc/150?u=${Date.now()}`
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUser({
        ...editingUser,
        ...formData
      });
    } else {
      const newUser: User = {
        id: `u${Date.now()}`,
        ...formData,
        status: 'online',
        workload: 0,
        organizationId: currentUser?.organizationId
      };
      addUser(newUser);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Team Members</h1>
          <p className="text-slate-500 mt-1">Manage your organization's talent and permissions.</p>
        </div>
        {canManageTeam && (
          <button
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <UserPlus size={20} />
            Invite Member
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex-1 relative w-full lg:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {roles.map(role => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                  filterRole === role ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {canManageTeam && (
          <button
            onClick={() => handleOpenModal()}
            className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center gap-4 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group min-h-[400px]"
          >
            <div className="p-5 bg-white rounded-3xl shadow-sm group-hover:shadow-md transition-all">
              <UserPlus size={32} />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">Invite New Member</p>
              <p className="text-sm font-medium opacity-60">Add a teammate to your workspace</p>
            </div>
          </button>
        )}
        {filteredUsers.map((user, idx) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-[32px] border border-slate-200 shadow-sm text-center relative group hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col h-full"
          >
            <div className="p-8 flex-1">
              {canManageTeam && (
                <div className="absolute top-6 right-6">
                  <div className="relative group/menu">
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                      <MoreVertical size={18} />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 overflow-hidden">
                      <button
                        onClick={() => handleOpenModal(user)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all text-left"
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => setIsDeleteConfirmOpen(user.id)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all text-left"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="relative inline-block mb-6">
                <MemberAvatar user={user} size="2xl" />
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white shadow-sm",
                  user.status === 'online' ? "bg-emerald-500" : user.status === 'busy' ? "bg-amber-500" : "bg-slate-300"
                )} />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-1">{user.name}</h3>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4">{user.role}</p>

              <div className="flex flex-col gap-2 mb-8">
                <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-medium">
                  <Briefcase size={14} />
                  <span>{user.department || 'General'}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-medium">
                  <Globe size={14} />
                  <span>{user.timezone || 'UTC+0'}</span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-slate-400">Workload</span>
                  <span className={cn(
                    (user.workload || 0) > 80 ? "text-rose-600" :
                      (user.workload || 0) > 50 ? "text-amber-600" : "text-emerald-600"
                  )}>{user.workload}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${user.workload}%` }}
                    className={cn(
                      "h-full rounded-full",
                      (user.workload || 0) > 80 ? "bg-rose-500" :
                        (user.workload || 0) > 50 ? "bg-amber-500" : "bg-emerald-500"
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex gap-3">
              <button className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                <Mail size={14} />
                Email
              </button>
              <button className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                <MessageSquare size={14} />
                Chat
              </button>
            </div>
          </motion.div>
        ))}


      </div>

      {/* Invite/Edit Modal */}
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
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-[40px] shadow-2xl z-[101] overflow-hidden"
            >
              <div className="sticky top-0 z-30 p-8 pt-10 pb-4 bg-white/90 backdrop-blur-md rounded-t-[40px] border-b border-slate-100">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500" />
                <div className="flex justify-between mb-2">
                  <h2 className="text-xl font-bold text-slate-400">{editingUser ? 'Edit Member' : 'Invite Teammate'}</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
                <div className="flex items-start justify-between gap-4 mt-2">
                  <input
                    required
                    form="user-form"
                    type="text"
                    placeholder="Full Name..."
                    className="text-4xl font-black text-slate-900 bg-transparent border-none outline-none w-full placeholder:text-slate-200 tracking-tight"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <form id="user-form" onSubmit={handleSubmit} className="p-8 space-y-8 pt-6">
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
                  <div className="h-px bg-slate-100" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
                    <div className="flex items-center gap-4 group md:col-span-2">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors text-indigo-500">
                        <Mail size={20} />
                      </div>
                      <div className="flex-1 relative">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Email Address</p>
                        <input
                          required
                          type="email"
                          placeholder="teammate@example.com"
                          className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-300"
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                        <Shield size={20} />
                      </div>
                      <div className="flex-1 relative">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Role</p>
                        <select
                          className="w-full appearance-none bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
                          value={formData.role}
                          onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                        >
                          <option value="Employee">Employee</option>
                          <option value="Manager">Manager</option>
                          <option value="Developer">Developer</option>
                          <option value="Designer">Designer</option>
                          {currentUser?.role === 'Super Admin' && (
                            <>
                              <option value="Admin">Admin</option>
                              <option value="Super Admin">Super Admin</option>
                            </>
                          )}
                        </select>
                        <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                        <Briefcase size={20} />
                      </div>
                      <div className="flex-1 relative">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Department</p>
                        <select
                          className="w-full appearance-none bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
                          value={formData.department}
                          onChange={e => setFormData({ ...formData, department: e.target.value })}
                        >
                          <option>Engineering</option>
                          <option>Product</option>
                          <option>Design</option>
                          <option>Marketing</option>
                          <option>Sales</option>
                          <option>Operations</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
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
                    {editingUser ? 'Save Changes' : 'Send Invite'}
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
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Remove Member?</h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Are you sure you want to remove this member from the team? They will lose access to all projects.
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
                    deleteUser(isDeleteConfirmOpen);
                    setIsDeleteConfirmOpen(null);
                  }}
                  className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
