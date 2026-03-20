import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, 
  Shield, 
  Bell, 
  User, 
  Globe, 
  Lock, 
  Check,
  AlertCircle,
  ArrowRight,
  Zap,
  Building,
  Users,
  Layout,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const isSuperAdmin = user?.role === 'Super Admin';

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    ...(isSuperAdmin ? [
      { id: 'organization', label: 'Organization', icon: Building },
      { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
    ] : []),
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'billing':
        return (
          <div className="space-y-8">
            <div className="bg-indigo-600 rounded-[32px] p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={20} className="fill-white" />
                  <span className="text-xs font-bold uppercase tracking-widest opacity-80">Current Plan</span>
                </div>
                <h3 className="text-3xl font-bold mb-2">Enterprise Pro</h3>
                <p className="text-indigo-100 mb-8 max-w-md">Your organization is on the Enterprise plan with unlimited projects and advanced security features.</p>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Next Billing Date</p>
                    <p className="font-bold">Oct 24, 2024</p>
                  </div>
                  <div className="h-10 w-px bg-white/20" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Amount</p>
                    <p className="font-bold">$499.00/mo</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Active Projects', value: '128', total: 'Unlimited', icon: Layout },
                { label: 'Team Members', value: '42', total: '500', icon: Users },
                { label: 'Storage Used', value: '45.2 GB', total: '1 TB', icon: Globe },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-slate-50 rounded-xl text-slate-600">
                      <stat.icon size={18} />
                    </div>
                    <span className="text-sm font-bold text-slate-600">{stat.label}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
                    <span className="text-xs text-slate-400 font-medium">/ {stat.total}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100">
                <h4 className="text-lg font-bold text-slate-900">Payment Methods</h4>
              </div>
              <div className="p-8 space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-white border border-slate-200 rounded flex items-center justify-center font-bold text-[10px] text-slate-400">VISA</div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Visa ending in 4242</p>
                      <p className="text-xs text-slate-500">Expires 12/26</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider">Default</span>
                </div>
                <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 text-sm font-bold hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2">
                  <Plus size={18} />
                  Add Payment Method
                </button>
              </div>
            </div>
          </div>
        );
      case 'organization':
        return (
          <div className="space-y-8">
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8">
              <h4 className="text-lg font-bold text-slate-900 mb-6">Organization Profile</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Company Name</label>
                  <input 
                    type="text" 
                    defaultValue="ProFlow Technologies Inc."
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Organization ID</label>
                  <input 
                    type="text" 
                    readOnly
                    defaultValue="org_92837465"
                    className="w-full px-5 py-3.5 bg-slate-100 border border-slate-100 rounded-2xl outline-none text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Industry</label>
                  <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm">
                    <option>Technology</option>
                    <option>Design</option>
                    <option>Marketing</option>
                    <option>Finance</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Company Size</label>
                  <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm">
                    <option>1-10 employees</option>
                    <option>11-50 employees</option>
                    <option>51-200 employees</option>
                    <option>201-500 employees</option>
                    <option>500+ employees</option>
                  </select>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end">
                <button className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                  Save Changes
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-bold text-slate-900">Security Policies</h4>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider">Enterprise Only</span>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Enforce Two-Factor Authentication', enabled: true },
                  { label: 'Restrict Project Creation to Admins', enabled: true },
                  { label: 'Allow External Guests', enabled: false },
                  { label: 'IP Access Restriction', enabled: false },
                ].map((policy, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-sm font-bold text-slate-700">{policy.label}</span>
                    <button className={cn(
                      "w-12 h-6 rounded-full relative transition-all",
                      policy.enabled ? "bg-indigo-600" : "bg-slate-300"
                    )}>
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        policy.enabled ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-10">
            <div className="flex flex-col md:flex-row gap-10">
              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-[40px] border-4 border-white bg-slate-100 shadow-xl overflow-hidden relative group">
                  <img 
                    src={user?.avatar || "https://i.pravatar.cc/150?u=current"} 
                    alt={user?.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                    <Edit2 size={24} className="text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-slate-900">{user?.name}</h3>
                  <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest">{user?.role}</p>
                </div>
              </div>

              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                    <input 
                      type="text" 
                      defaultValue={user?.name}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue={user?.email}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Job Title</label>
                    <input 
                      type="text" 
                      defaultValue={user?.role}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Timezone</label>
                    <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm">
                      <option>UTC-8 (Pacific Time)</option>
                      <option>UTC-5 (Eastern Time)</option>
                      <option>UTC+0 (Greenwich Mean Time)</option>
                      <option>UTC+1 (Central European Time)</option>
                    </select>
                  </div>
                </div>
                <div className="pt-6 flex justify-end">
                  <button className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                    Update Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your personal preferences and organization settings.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all",
                activeTab === tab.id 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                  : "text-slate-500 hover:bg-white hover:text-slate-900"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const Edit2 = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);
