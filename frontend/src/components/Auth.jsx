import React, { useState } from 'react';
import { HeartHandshake, Mail, Lock, User, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { loginUser, registerUser, getToken, getMe } from '../api';

export default function Auth({ onLoginSuccess }) {
  const [view, setView] = useState('login'); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('staff');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginUser(email, password);
      const user = await getMe();
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Invalid login details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerUser(name, email, password, role);
      setError('');
      alert('Account request submitted successfully! Your account is pending approval by the group leader. An email notification has been scheduled. You will be able to sign in once approved.');
      setView('login');
    } catch (err) {
      setError(err.message || 'Registration failed. Email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    alert(`A password reset email has been simulated and sent to: ${email}`);
    setView('login');
  };



  return (
    <div className="flex-grow flex items-center justify-center p-4 min-h-screen bg-gradient-to-tr from-blue-500/10 via-slate-50 to-emerald-500/10 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xl rounded-2xl p-8">
        
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-brand-500/10 rounded-2xl text-brand-600 dark:text-brand-500 mb-3">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold font-outfit tracking-tight text-slate-900 dark:text-white">NGO Work Tracker</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Staff Work Tracker &amp; Reminder System</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input 
                  type="email" 
                  required 
                  placeholder="name@ngo.org" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
                <button type="button" onClick={() => setView('forgot')} className="text-xs text-brand-600 dark:text-brand-500 hover:underline">Forgot Password?</button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white text-sm"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-6 py-2.5 bg-gradient-to-r from-brand-600 to-blue-500 hover:from-brand-700 hover:to-blue-600 text-white font-medium rounded-xl shadow-lg shadow-brand-500/20 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? 'Signing In...' : 'Sign In'}
            </button>



            <div className="text-center mt-6">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Don't have an account? <button type="button" onClick={() => setView('register')} className="text-brand-600 dark:text-brand-500 hover:underline font-semibold">Sign up</button>
              </p>
            </div>
          </form>
        )}

        {view === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
              <input 
                type="text" 
                required 
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
              <input 
                type="email" 
                required 
                placeholder="name@ngo.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Password</label>
              <input 
                type="password" 
                required 
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">User Role</label>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white text-sm"
              >
                <option value="staff">Staff Member</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-6 py-2.5 bg-gradient-to-r from-brand-600 to-blue-500 text-white font-medium rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className="text-center mt-6">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Already have an account? <button type="button" onClick={() => setView('login')} className="text-brand-600 dark:text-brand-500 hover:underline font-semibold">Sign in</button>
              </p>
            </div>
          </form>
        )}

        {view === 'forgot' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Enter your email and we'll send a password recovery simulation link.</p>
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                <input 
                  type="email" 
                  required 
                  placeholder="name@ngo.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white text-sm"
                />
              </div>
              <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-brand-600 to-blue-500 text-white font-medium rounded-xl shadow-lg transition-all text-sm">
                Send Reset Code
              </button>
            </form>
            <div className="text-center">
              <button onClick={() => setView('login')} className="text-xs text-slate-500 dark:text-slate-400 hover:underline">Back to Login</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
