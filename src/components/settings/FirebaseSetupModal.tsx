import React, { useState } from 'react';
import rulesText from '../../../firestore.rules?raw';
import { getFirebaseDb, getSavedFirebaseConfig, testFirestoreConnection } from '../../lib/firebase';
import { countLocalData, uploadLocalDataToFirestore } from '../../lib/firestoreSync';
import { Modal } from '../common/Modal';
import { useCRM } from '../../context/CRMContext';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldAlert,
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
    currentUser,
  } = useCRM();

  const hasSavedConfig = !!getSavedFirebaseConfig();
  const localCounts = countLocalData();
  const localTotal = Object.values(localCounts).reduce((a, b) => a + b, 0);
  const [testMsg, setTestMsg] = useState('');
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleTest = async () => {
    const db = getFirebaseDb();
    if (!db) {
      setTestMsg('Firebase is not configured.');
      return;
    }
    setTestMsg('Testing...');
    const r = await testFirestoreConnection(db);
    setTestMsg((r.success ? 'OK: ' : 'Failed: ') + r.message);
  };

  const handleUpload = async () => {
    if (!confirm(`Upload ${localTotal} records saved in this browser to Firebase? Records with the same ID will be overwritten.`)) return;
    setUploading(true);
    setUploadMsg('Uploading...');
    try {
      const counts = await uploadLocalDataToFirestore((d, t) => setUploadMsg(`Uploading ${d}/${t}...`));
      setUploadMsg('Done: ' + Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', '));
    } catch (e) {
      setUploadMsg('Failed: ' + (e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const [apiKey, setApiKey] = useState(firebaseConfig?.apiKey || '');
  const [projectId, setProjectId] = useState(firebaseConfig?.projectId || '');
  const [authDomain, setAuthDomain] = useState(firebaseConfig?.authDomain || '');
  const [appId, setAppId] = useState(firebaseConfig?.appId || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim()) {
      alert('Please provide at least Firebase API Key and Project ID.');
      return;
    }

    saveFirebaseSettings({
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      appId: appId.trim(),
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1500);
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

  const sampleRules = rulesText;

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
    >
      <div className="space-y-6 text-xs">
        {/* Status Banner */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
            isFirebaseConfigured
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-[#F5A623]" />
            <div>
              <p className="font-bold text-sm">
                Status: {isFirebaseConfigured ? 'Connected to Firebase' : 'Active in Local Storage Mode'}
              </p>
              <p className="mt-0.5 opacity-90">
                {isFirebaseConfigured
                  ? `Target Project: ${firebaseConfig?.projectId}. Ready for team-wide Firestore persistence.`
                  : 'All candidate data, client records, and job openings are currently saved in your browser localStorage.'}
              </p>
            </div>
          </div>

          {isFirebaseConfigured && hasSavedConfig && (
            <button
              onClick={handleDisconnect}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          )}
        </div>

        {/* Short Setup Instructions */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F5A623]" />
            Quick Setup Instructions: Connecting Your Firebase Project
          </h3>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-700 dark:text-slate-300 leading-relaxed">
            <li>
              Go to the{' '}
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 dark:text-amber-400 font-bold hover:underline inline-flex items-center gap-0.5"
              >
                <span>Firebase Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>{' '}
              and click <strong>Add Project</strong> (e.g. <code>bj-bright-crm</code>).
            </li>
            <li>
              Navigate to <strong>Build &gt; Firestore Database</strong> and click <strong>Create Database</strong> in Test or Production mode.
            </li>
            <li>
              Navigate to <strong>Project Settings &gt; General &gt; Your apps</strong> and add a <strong>Web App (&lt;/&gt;)</strong>.
            </li>
            <li>
              Copy the <code>firebaseConfig</code> values (API Key, Project ID, App ID) and paste them in the form below.
            </li>
            <li>
              Deploy the provided <code>firestore.rules</code> file included in the project root to secure access.
            </li>
          </ol>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Firebase API Key *
              </label>
              <input
                type="text"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Firebase Project ID *
              </label>
              <input
                type="text"
                placeholder="bj-bright-enterprises-crm"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Auth Domain (Optional)
              </label>
              <input
                type="text"
                placeholder="bj-bright-enterprises.firebaseapp.com"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                App ID (Optional)
              </label>
              <input
                type="text"
                placeholder="1:714256749852:web:..."
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={copyRules}
              className="text-xs text-blue-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedSnippet ? 'Copied Security Rules!' : 'Copy Firestore Rules (paste in Firebase Console > Firestore > Rules > Publish)'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#0B1F4B] hover:bg-[#163270] text-white font-bold rounded-lg shadow-md flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-3.5 h-3.5 text-[#F5A623]" />
                <span>Save Credentials</span>
              </button>
            </div>
          </div>
        </form>

        {isFirebaseConfigured && (
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-bold text-slate-900 dark:text-white">Test Firestore connection</p>
              <button
                onClick={handleTest}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 font-bold whitespace-nowrap"
              >
                Test
              </button>
            </div>
            {testMsg && <p className="text-[11px] text-slate-600 dark:text-slate-300">{testMsg}</p>}

            {currentUser.role === 'admin' && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Upload data saved in this browser to Firebase</p>
                  <p className="text-[11px] text-slate-500">
                    {localTotal > 0
                      ? `Found ${localTotal} local records (${Object.entries(localCounts).map(([k, v]) => `${v} ${k}`).join(', ')}). Users are not uploaded; add them in Settings > Users.`
                      : 'No local records found in this browser.'}
                  </p>
                  {uploadMsg && <p className="text-[11px] mt-1 text-slate-700 dark:text-slate-200">{uploadMsg}</p>}
                </div>
                <button
                  onClick={handleUpload}
                  disabled={uploading || localTotal === 0}
                  className="px-3.5 py-1.5 rounded-lg bg-[#0B1F4B] hover:bg-[#163270] disabled:opacity-50 text-white font-bold whitespace-nowrap"
                >
                  Upload
                </button>
              </div>
            )}
          </div>
        )}

        {/* Reset Database to Sample Data */}
        {!isFirebaseConfigured && (
        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
          <div>
            <p className="font-bold text-slate-900 dark:text-white">Restore Initial Demo Dataset</p>
            <p className="text-[11px] text-slate-500">
              Reset candidate records, Noida clients, jobs, and interviews back to default realistic seed data.
            </p>
          </div>
          <button
            onClick={() => {
              if (confirm('Restore initial sample candidates and clients?')) {
                resetAllData();
                alert('Initial dataset restored successfully!');
                onClose();
              }
            }}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold whitespace-nowrap"
          >
            Reset Sample Data
          </button>
        </div>
        )}
      </div>
    </Modal>
  );
};
