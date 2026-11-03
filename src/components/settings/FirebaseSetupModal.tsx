import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useCRM } from '../../context/CRMContext';
import {
  Database,
  Copy,
  ExternalLink,
  Save,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface FirebaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseSetupModal: React.FC<FirebaseSetupModalProps> = ({ isOpen, onClose }) => {
  const {
    isFirebaseConfigured,
    firebaseConfig,
    saveFirebaseSettings,
    removeFirebaseSettings,
    resetAllData,
    showToast,
  } = useCRM();

  const [apiKey, setApiKey] = useState(firebaseConfig?.apiKey || '');
  const [projectId, setProjectId] = useState(firebaseConfig?.projectId || '');
  const [authDomain, setAuthDomain] = useState(firebaseConfig?.authDomain || '');
  const [appId, setAppId] = useState(firebaseConfig?.appId || '');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim()) {
      showToast('Please provide at least Firebase API Key and Project ID.', 'error');
      return;
    }

    saveFirebaseSettings({
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      appId: appId.trim(),
    });

    onClose();
  };

  const handleDisconnect = () => {
    if (confirm('Disconnect Firebase credentials and switch back to Local Persistence mode?')) {
      removeFirebaseSettings();
      setApiKey('');
      setProjectId('');
      setAuthDomain('');
      setAppId('');
      onClose();
    }
  };

  const sampleRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`;

  const copyRules = () => {
    navigator.clipboard.writeText(sampleRules);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Firebase Cloud Database & Sync Setup"
      subtitle="Connect Firebase Firestore + Authentication to persist and share CRM data across your Noida recruitment team"
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between gap-3 w-full flex-wrap">
          <button
            type="button"
            onClick={copyRules}
            className="min-h-[40px] px-2 text-xs text-[#0B1F4B] font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedSnippet ? 'Copied Security Rules!' : 'Copy Recommended Firestore Rules'}</span>
          </button>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 font-bold text-slate-700 border border-slate-300 bg-white hover:bg-slate-50 rounded-xl text-xs cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              form="firebase-setup-form"
              className="min-h-[44px] px-5 py-2 bg-[#0B1F4B] hover:bg-[#163270] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-[#F5A623]" />
              <span>Save Credentials</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5 text-xs">
        {/* Status Banner */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 flex-wrap ${
            isFirebaseConfigured
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-[#F5A623] shrink-0" />
            <div>
              <p className="font-bold text-sm">
                Status: {isFirebaseConfigured ? 'Connected to Firebase' : 'Active in Local Storage Mode'}
              </p>
              <p className="mt-0.5 text-slate-700">
                {isFirebaseConfigured
                  ? `Target Project: ${firebaseConfig?.projectId}. Ready for team-wide Firestore persistence.`
                  : 'All candidate data, client records, and job openings are currently saved in your browser.'}
              </p>
            </div>
          </div>

          {isFirebaseConfigured && (
            <button
              onClick={handleDisconnect}
              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          )}
        </div>

        {/* Short Setup Instructions */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F5A623]" />
            <span>Quick Setup Instructions: Connecting Your Firebase Project</span>
          </h3>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-700 leading-relaxed">
            <li>
              Go to the{' '}
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-[#0B1F4B] font-bold hover:underline inline-flex items-center gap-0.5"
              >
                <span>Firebase Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>{' '}
              and click <strong>Add Project</strong> (e.g. <code>bj-bright-crm</code>).
            </li>
            <li>
              Navigate to <strong>Build &gt; Firestore Database</strong> and click <strong>Create Database</strong>.
            </li>
            <li>
              Navigate to <strong>Project Settings &gt; General &gt; Your apps</strong> and add a <strong>Web App (&lt;/&gt;)</strong>.
            </li>
            <li>
              Copy the <code>firebaseConfig</code> values (API Key, Project ID, App ID) and paste them in the form below.
            </li>
          </ol>
        </div>

        {/* Credentials Form */}
        <form id="firebase-setup-form" onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Firebase API Key *
              </label>
              <input
                type="text"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Firebase Project ID *
              </label>
              <input
                type="text"
                placeholder="bj-bright-enterprises-crm"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Auth Domain (Optional)
              </label>
              <input
                type="text"
                placeholder="bj-bright-enterprises.firebaseapp.com"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                App ID (Optional)
              </label>
              <input
                type="text"
                placeholder="1:714256749852:web:..."
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
            </div>
          </div>
        </form>

        {/* Reset Database to Sample Data */}
        <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="font-bold text-slate-900">Restore Initial Dataset</p>
            <p className="text-[11px] text-slate-600">
              Reset candidate records, Noida clients, jobs, and interviews back to default seed data.
            </p>
          </div>
          <button
            onClick={() => {
              if (confirm('Restore initial sample candidates and clients?')) {
                resetAllData();
                onClose();
              }
            }}
            className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold whitespace-nowrap cursor-pointer"
          >
            Reset Sample Data
          </button>
        </div>
      </div>
    </Modal>
  );
};
