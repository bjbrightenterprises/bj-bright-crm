import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { dataService } from '../../lib/dataService';
import { Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, ShieldCheck, UserCheck } from 'lucide-react';
import { UserRole } from '../../types/crm';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  hr_executive: 'HR Executive',
  recruiter: 'Recruiter',
};

const DEFAULT_PASSWORDS_BY_EMAIL: Record<string, string> = {
  'praveenverma1420@gmail.com': 'Admin@123',
  'admin@bjbright.com': 'Admin@123',
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { users, switchUser, companySettings } = useCRM();
  const [email, setEmail] = useState(() => dataService.getLastLoginEmail());
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    const found = users.find((u) => {
      const uEmail = u.email.toLowerCase();
      if (uEmail === cleanEmail) return true;
      if (
        (cleanEmail === 'praveenverma1420@gmail.com' || cleanEmail === 'admin@bjbright.com') &&
        u.role === 'admin'
      ) {
        return true;
      }
      return false;
    });

    if (!found) {
      setError('Invalid email address. Only accounts registered by the Administrator can sign in.');
      return;
    }

    if (!found.active) {
      setError('Your account has been disabled by the Administrator. Please contact HR Admin.');
      return;
    }

    const expectedPassword =
      found.password ||
      DEFAULT_PASSWORDS_BY_EMAIL[cleanEmail] ||
      DEFAULT_PASSWORDS_BY_EMAIL[found.email.toLowerCase()] ||
      'bjbright2026';

    if (password !== expectedPassword) {
      setError('Incorrect password. Please verify your password and try again.');
      return;
    }

    dataService.startSession(found.id, cleanEmail);
    switchUser(found.id);
    onLoginSuccess();
  };

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

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
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
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Password</label>
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
            className="w-full py-2.5 rounded-xl bg-[#F5A623] hover:bg-amber-500 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Sign In to CRM Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-[#F5A623] shrink-0" />
          <span>Authorized Personnel Only • Role-Based Access Control</span>
        </div>
      </div>
    </div>
  );
};
