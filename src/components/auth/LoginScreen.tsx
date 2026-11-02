import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const {
    companySettings,
    loginWithFirebase,
    sendForgotPasswordEmail,
    accessDeniedMessage,
    clearAccessDeniedMessage,
  } = useCRM();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSuccessMsg('');
    clearAccessDeniedMessage();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) return;

    setIsSubmitting(true);
    try {
      await loginWithFirebase(cleanEmail, password);
      onLoginSuccess?.();
    } catch (err: any) {
      const code = err?.code || '';
      if (
        err?.message === 'Your access is not active. Please contact your Admin.'
      ) {
        setError('Your access is not active. Please contact your Admin.');
      } else if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setError('Invalid email or password. Please verify your credentials.');
      } else if (code === 'auth/user-disabled') {
        setError('Your access is not active. Please contact your Admin.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed sign-in attempts. Please reset your password or try again shortly.');
      } else {
        setError(err?.message || 'Sign-in failed. Please check your connection and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setResetSuccessMsg('');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your registered email address above to receive a password reset link.');
      return;
    }

    setIsSendingReset(true);
    try {
      await sendForgotPasswordEmail(cleanEmail);
      setResetSuccessMsg(
        `Password reset email sent to ${cleanEmail}. Please check your inbox and spam folder.`
      );
    } catch (err: any) {
      setError(
        err?.message || 'Unable to send password reset email. Verify your email address.'
      );
    } finally {
      setIsSendingReset(false);
    }
  };

  const displayError = accessDeniedMessage || error;

  return (
    <div className="flex-1 bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-7 space-y-5">
        <div className="text-center space-y-2">
          <img
            src="/assets/aistudio/BJ-Bright-logo-circle_cb142036.png"
            alt="BJ Bright Enterprises Logo"
            className="w-24 h-24 rounded-full object-contain mx-auto mb-2 shadow-xl ring-2 ring-[#F5A623]/40 bg-[#0B1F4B]"
          />
          <h1 className="text-xl font-extrabold text-white">{companySettings.companyName}</h1>
          <p className="text-xs text-slate-400">
            {companySettings.city} • Manpower & Recruitment CRM Portal
          </p>
        </div>

        {displayError && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{displayError}</span>
          </div>
        )}

        {resetSuccessMsg && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{resetSuccessMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300">Password</label>
              <button
                type="button"
                disabled={isSendingReset}
                onClick={handleForgotPassword}
                className="text-[11px] font-bold text-[#F5A623] hover:text-amber-400 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <KeyRound className="w-3 h-3" />
                <span>{isSendingReset ? 'Sending reset link...' : 'Forgot password?'}</span>
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-[#F5A623] hover:bg-amber-500 disabled:opacity-60 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isSubmitting ? 'Signing in...' : 'Sign In to CRM Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-[#F5A623] shrink-0" />
          <span>Firebase Auth • Role-Based Cloud Access Control</span>
        </div>
      </div>
    </div>
  );
};
