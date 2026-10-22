import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { CRMProvider, useCRM } from './context/CRMContext';
import { Header } from './components/layout/Header';
import { Sidebar, NavItem } from './components/layout/Sidebar';
import { LoginScreen } from './components/auth/LoginScreen';
import { DashboardModule } from './components/dashboard/DashboardModule';
import { CandidatesModule } from './components/candidates/CandidatesModule';
import { ClientsModule } from './components/clients/ClientsModule';
import { JobsModule } from './components/jobs/JobsModule';
import { PipelineKanbanModule } from './components/pipeline/PipelineKanbanModule';
import { InterviewsModule } from './components/interviews/InterviewsModule';
import { MyTasksModule } from './components/reminders/MyTasksModule';
import { ReportsAnalyticsModule } from './components/reports/ReportsAnalyticsModule';
import { SettingsModule } from './components/settings/SettingsModule';
import { CandidateFormModal } from './components/candidates/CandidateFormModal';
import { JobFormModal } from './components/jobs/JobFormModal';
import { ClientFormModal } from './components/clients/ClientFormModal';
import { ScheduleInterviewModal } from './components/interviews/ScheduleInterviewModal';
import { FirebaseSetupModal } from './components/settings/FirebaseSetupModal';
import { CandidateProfileModal } from './components/candidates/CandidateProfileModal';
import { ClientProfileModal } from './components/clients/ClientProfileModal';
import { Candidate, Client, JobOpening } from './types/crm';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Something went wrong</h2>
              <p className="text-xs text-slate-400 mt-1">
                {this.state.error?.message || 'An unexpected rendering error occurred.'}
              </p>
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5A623] hover:bg-amber-500 text-slate-950 font-semibold rounded-lg text-xs transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const CRMApp: React.FC = () => {
  const {
    firebaseAuthActive,
    authReady,
    isAuthenticated,
    syncError,
    dismissSyncError,
    logout,
  } = useCRM();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('bj_logged_in') === 'true';
  });

  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Global modals state
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isScheduleInterviewOpen, setIsScheduleInterviewOpen] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);

  // Selected items for detail modals
  const [selectedCandidateProfile, setSelectedCandidateProfile] = useState<Candidate | null>(null);
  const [selectedClientProfile, setSelectedClientProfile] = useState<Client | null>(null);
  const [preSelectedCandidate, setPreSelectedCandidate] = useState<Candidate | null>(null);
  const [preSelectedClient, setPreSelectedClient] = useState<Client | null>(null);
  const [selectedPipelineJobId, setSelectedPipelineJobId] = useState<string | undefined>(undefined);

  // Synchronize local login state
  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(localStorage.getItem('bj_logged_in') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // When Firebase Auth is active, show loading while verifying session
  if (firebaseAuthActive && !authReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F5A623] to-amber-600 items-center justify-center font-extrabold text-white shadow-lg shadow-amber-500/20 mb-4 animate-pulse">
          <span className="text-2xl">BJ</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-[#F5A623]" />
          <span>Initializing secure session...</span>
        </div>
      </div>
    );
  }

  // Determine if user is authenticated
  const authenticated = firebaseAuthActive ? isAuthenticated : isLoggedIn;

  if (!authenticated) {
    return (
      <LoginScreen
        onLoginSuccess={() => {
          setIsLoggedIn(true);
        }}
      />
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    } finally {
      setIsLoggedIn(false);
      localStorage.removeItem('bj_logged_in');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setIsMobileSidebarOpen(false);
        }}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-68 flex flex-col flex-1 min-w-0">
        <Header
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigate={(tab) => setCurrentTab(tab)}
          onOpenAddCandidate={() => setIsAddCandidateOpen(true)}
          onOpenAddJob={() => {
            setPreSelectedClient(null);
            setIsAddJobOpen(true);
          }}
          onOpenAddClient={() => setIsAddClientOpen(true)}
          onOpenScheduleInterview={() => {
            setPreSelectedCandidate(null);
            setIsScheduleInterviewOpen(true);
          }}
          onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Sync notification banner if error occurs */}
        {syncError && (
          <div className="bg-amber-500/10 dark:bg-amber-900/30 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2 truncate">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="truncate">{syncError}</span>
            </div>
            <button
              onClick={dismissSyncError}
              className="ml-3 font-semibold underline hover:no-underline text-amber-700 dark:text-amber-300 shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Active Module View */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {currentTab === 'dashboard' && (
            <DashboardModule
              onNavigate={(tab) => setCurrentTab(tab)}
              onOpenCandidateForm={() => setIsAddCandidateOpen(true)}
              onOpenScheduleInterview={() => {
                setPreSelectedCandidate(null);
                setIsScheduleInterviewOpen(true);
              }}
            />
          )}

          {currentTab === 'candidates' && (
            <CandidatesModule
              onScheduleInterviewForCandidate={(candidate) => {
                setPreSelectedCandidate(candidate);
                setIsScheduleInterviewOpen(true);
              }}
            />
          )}

          {currentTab === 'clients' && (
            <ClientsModule
              onOpenCreateJobForClient={(client) => {
                setPreSelectedClient(client);
                setIsAddJobOpen(true);
              }}
            />
          )}

          {currentTab === 'jobs' && (
            <JobsModule
              onNavigateToPipeline={(jobId) => {
                setSelectedPipelineJobId(jobId);
                setCurrentTab('pipeline');
              }}
              onViewCandidateProfile={(candidate) => {
                setSelectedCandidateProfile(candidate);
              }}
            />
          )}

          {currentTab === 'pipeline' && (
            <PipelineKanbanModule
              initialJobId={selectedPipelineJobId}
              onViewCandidateProfile={(candidate) => {
                setSelectedCandidateProfile(candidate);
              }}
              onScheduleInterview={(candidate) => {
                setPreSelectedCandidate(candidate);
                setIsScheduleInterviewOpen(true);
              }}
            />
          )}

          {currentTab === 'interviews' && (
            <InterviewsModule
              onViewCandidateProfile={(candidate) => {
                setSelectedCandidateProfile(candidate);
              }}
            />
          )}

          {currentTab === 'tasks' && (
            <MyTasksModule
              onViewCandidateProfile={(candidate) => {
                setSelectedCandidateProfile(candidate);
              }}
              onViewClientProfile={(client) => {
                setSelectedClientProfile(client);
              }}
            />
          )}

          {currentTab === 'reports' && <ReportsAnalyticsModule />}

          {currentTab === 'settings' && <SettingsModule />}
        </main>
      </div>

      {/* Global Modals */}
      <CandidateFormModal
        isOpen={isAddCandidateOpen}
        onClose={() => setIsAddCandidateOpen(false)}
      />

      <JobFormModal
        isOpen={isAddJobOpen}
        onClose={() => {
          setIsAddJobOpen(false);
          setPreSelectedClient(null);
        }}
        preSelectedClientId={preSelectedClient?.id}
      />

      <ClientFormModal
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
      />

      <ScheduleInterviewModal
        isOpen={isScheduleInterviewOpen}
        onClose={() => {
          setIsScheduleInterviewOpen(false);
          setPreSelectedCandidate(null);
        }}
        preSelectedCandidate={preSelectedCandidate}
      />

      <FirebaseSetupModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />

      <CandidateProfileModal
        isOpen={!!selectedCandidateProfile}
        onClose={() => setSelectedCandidateProfile(null)}
        candidate={selectedCandidateProfile}
        onEdit={() => {}}
        onScheduleInterview={(cand) => {
          setSelectedCandidateProfile(null);
          setPreSelectedCandidate(cand);
          setIsScheduleInterviewOpen(true);
        }}
      />

      <ClientProfileModal
        isOpen={!!selectedClientProfile}
        onClose={() => setSelectedClientProfile(null)}
        client={selectedClientProfile}
        onEdit={() => {}}
        onOpenCreateJobForClient={(client) => {
          setSelectedClientProfile(null);
          setPreSelectedClient(client);
          setIsAddJobOpen(true);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <CRMProvider>
        <CRMApp />
      </CRMProvider>
    </ErrorBoundary>
  );
}
