import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { NavItem } from '../layout/Sidebar';

interface AccessRestrictedProps {
  onNavigate: (tab: NavItem) => void;
}

export const AccessRestricted: React.FC<AccessRestrictedProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4 shadow-lg">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">
        Access Restricted
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-6">
        This module (Settings & System Administration) is restricted to Admin users only under BJ Bright Enterprises role security policies.
      </p>
      <button
        onClick={() => onNavigate('dashboard')}
        className="px-4 py-2.5 rounded-xl bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold flex items-center gap-2 shadow-md transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 text-[#F5A623]" />
        <span>Return to Dashboard</span>
      </button>
    </div>
  );
};
