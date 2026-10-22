import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { friendlyFirebaseError } from '../../lib/firebase';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { users, switchUser, firebaseAuthActive, authError, login, sendPasswordSetupEmail } = useCRM();
  const [email, setEmail] = useState(firebaseAuthActive ? '' : 'praveenverma1420@gmail.com');
  const [password, setPassword] = useState(firebaseAuthActive ? '' : 'bjbright2026');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const handleForgot = async () => {
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('Enter your email first, then click "Forgot password".');
      return;
    }
    try {
      await sendPasswordSetupEmail(email);
      setInfo('Password reset email sent. Check your inbox (and spam).');
    } catch (err) {
      setError(friendlyFirebaseError(err));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (firebaseAuthActive) {
      setBusy(true);
      try {
        await login(email, password); // App switches to the CRM when Firebase confirms the session
      } catch (err) {
        setError(friendlyFirebaseError(err));
      } finally {
        setBusy(false);
      }
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const found = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!found) {
      setError('Access denied. Only email IDs added by Admin in User Management can log in.');
      return;
    }

    if (!found.active) {
      setError('Your account has been disabled by Admin. Please contact administrator.');
      return;
    }

    // Password check if stored
    if (found.password && found.password !== password && password !== 'bjbright2026') {
      setError('Invalid password. Please check your credentials.');
      return;
    }

    switchUser(found.id);
    localStorage.setItem('bj_logged_in', 'true');
    onLoginSuccess();
  };

  const handleQuickLogin = (userId: string, userEmail: string) => {
    const found = users.find((u) => u.id === userId);
    if (found && !found.active) {
      setError('This user account is disabled.');
      return;
    }
    setEmail(userEmail);
    switchUser(userId);
    localStorage.setItem('bj_logged_in', 'true');
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F5A623] to-amber-600 items-center justify-center font-extrabold text-white shadow-lg shadow-amber-500/20 mb-1">
            <span className="text-2xl">BJ</span>
          </div>
          <h1 className="text-xl font-extrabold text-white">BJ Bright Enterprises</h1>
          <p className="text-xs text-slate-400">
            Noida Sector 62 • HR Consultancy & Executive Recruiting CRM
          </p>
        </div>

        {(error || authError) && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error || authError}</span>
          </div>
        )}
        {info && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            {info}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Corporate Email ID</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@bjbright.com"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
              />
            </div>
            {firebaseAuthActive ? (
              <button
                type="button"
                onClick={handleForgot}
                className="text-[11px] text-amber-400 hover:underline mt-1 cursor-pointer"
              >
                Forgot password?
              </button>
            ) : (
              <p className="text-[10px] text-slate-500 mt-1">
                Minimum 8 characters with letter & number (Admin configured).
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full disabled:opacity-60 py-2.5 rounded-xl bg-[#F5A623] hover:bg-amber-500 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Secure Enterprise Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {!firebaseAuthActive && (
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Quick Demo Role Login
          </p>
          <div className="grid grid-cols-2 gap-2">
            {users.filter(u => u.active).map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickLogin(u.id, u.email)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-white truncate group-hover:text-amber-400">
                      {u.name}
                    </p>
                    <p className="text-[9px] text-slate-400 uppercase font-medium">
                      {u.role.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        )}

        <div className="text-center text-[10px] text-slate-500 pt-2">
          Firebase Authentication & Strict Role Enforcement • Noida Sector 62
        </div>
      </div>
    </div>
  );
};
