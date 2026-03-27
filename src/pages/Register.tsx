import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, User, Lock, ArrowRight, Loader2, AlertCircle, Layout } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const { register } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setErrorMsg('Name is required'); return; }
    if (!email.trim()) { setErrorMsg('Email is required'); return; }
    if (!password.trim()) { setErrorMsg('Password is required'); return; }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
        <div className="text-center mb-8">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Layout className="text-white" size={20} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">PMS APP</h1>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Create Account</h2>
          <p className="text-slate-500 mt-2">Join PMS APP to streamline your workflow</p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 rounded-2xl mb-6 text-rose-700 text-sm font-medium">
            <AlertCircle size={16} className="flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 group disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <>Get Started <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-8">
          Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
};
