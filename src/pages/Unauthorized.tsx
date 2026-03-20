import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldAlert, ArrowLeft, Layout } from 'lucide-react';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 p-12 text-center"
      >
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Layout className="text-white" size={20} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ProFlow</h1>
        </div>

        <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
          <ShieldAlert size={48} />
        </div>

        <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Access Denied</h2>
        <p className="text-slate-500 text-lg mb-10 leading-relaxed">
          You don't have the required permissions to access this page. 
          Please contact your system administrator if you believe this is an error.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate(-1)}
            className="px-8 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
          <button 
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Return to Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
};
