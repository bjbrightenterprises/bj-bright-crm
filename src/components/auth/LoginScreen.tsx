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
    <div className="flex-1 min-h-dvh bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4 pt-safe pb-safe relative overflow-x-hidden">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-[#0B1F4B] text-white p-6 text-center space-y-2 border-b-4 border-[#F5A623]">
          <img
            src="/assets/aistudio/BJ-Bright-logo-circle_cb142036.png"
            alt="BJ Bright Enterprises Logo"
            className="w-20 h-20 rounded-full object-contain mx-auto mb-1 shadow-md ring-2 ring-[#F5A623] bg-[#0B1F4B]"
          />
          <h1 className="text-lg sm:text-xl font-extrabold text-white">{companySettings.companyName}</h1>
          <p className="text-xs text-slate-200 font-medium">
            {companySettings.city} • Manpower & Recruitment CRM Portal
          </p>
        </div>

        <div className="p-6 space-y-5 bg-white text-slate-900">
          {displayError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
              <span>{displayError}</span>
            </div>
          )}

          {resetSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
              <span>{resetSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  inputMode="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full min-h-[44px] pl-10 pr-3 py-2.5 rounded-xl bg-white border border-slate-300 text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">Password</label>
                <button
                  type="button"
                  disabled={isSendingReset}
                  onClick={handleForgotPassword}
                  className="min-h-[36px] px-2 text-xs font-bold text-[#0B1F4B] hover:text-blue-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#F5A623]" />
                  <span>{isSendingReset ? 'Sending reset link...' : 'Forgot password?'}</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full min-h-[44px] pl-10 pr-11 py-2.5 rounded-xl bg-white border border-slate-300 text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer rounded-lg"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[44px] py-3 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] disabled:opacity-60 text-white font-extrabold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isSubmitting ? 'Signing in...' : 'Sign In to CRM Portal'}</span>
              <ArrowRight className="w-4 h-4 text-[#F5A623]" />
            </button>
          </form>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-center gap-2 text-xs text-slate-600 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#0B1F4B] shrink-0" />
            <span>Firebase Auth • Role-Based Cloud Access Control</span>
          </div>
        </div>
      </div>
    </div>
  );
};
