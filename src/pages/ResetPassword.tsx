import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authApi } from '../services/api';
import { motion } from 'motion/react';

export const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await authApi.resetPassword(token!, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Reset link is invalid or has expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8"
      >
        {!success ? (
          <>
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
                <Lock className="text-white" size={24} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Set New Password</h1>
              <p className="text-slate-500 mt-2">Create a secure password for your account</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 rounded-2xl mb-6 text-rose-700 text-sm font-medium">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">New Password</label>
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

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Reset Password'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Password Reset!</h2>
            <p className="text-slate-500 mb-8">Your password has been successfully updated. Redirecting you to login...</p>
            <Link 
              to="/login"
              className="text-indigo-600 font-bold hover:underline"
            >
              Go to Login now
            </Link>
          </div>
        )}

        {!success && (
          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-slate-500 text-sm font-medium hover:text-indigo-600 transition-colors">
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};
