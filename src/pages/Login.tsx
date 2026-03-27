import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Layout, LogIn, Shield, Users, User as UserIcon, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setErrorMsg('Email is required'); return; }
    if (!password.trim()) { setErrorMsg('Password is required'); return; }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100"
      >
        <div className="p-10">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Layout className="text-white" size={20} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">PMS APP</h1>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1">Sign in to your workspace</p>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 rounded-2xl mb-6 text-rose-700 text-sm font-medium">
              <AlertCircle size={16} className="flex-shrink-0" />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <input
                type="email"
                placeholder="name@company.com"
                required
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm pr-12"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end p-1">
              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
              {isSubmitting ? 'Signing in...' : 'Sign In to Workspace'}
            </button>
          </form>
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-600 font-bold hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-medium">
            Powered by PMS
          </p>
        </div>
      </motion.div>
    </div>
  );
};
