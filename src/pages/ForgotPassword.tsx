import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { authApi } from '../services/api';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
        {!submitted ? (
          <>
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
                <span className="text-white font-bold text-2xl">P</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
              <p className="text-slate-500 mt-2">Enter your email to receive a reset link</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 rounded-2xl mb-6 text-rose-700 text-sm font-medium">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h2>
            <p className="text-slate-500 mb-8">We've sent a password reset link to <span className="font-bold text-slate-900">{email}</span></p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-indigo-600 font-bold hover:underline"
            >
              Didn't receive it? Try again
            </button>
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-slate-500 text-sm font-medium hover:text-indigo-600 transition-colors">
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};
