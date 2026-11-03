import React, { useState, Suspense, lazy } from 'react';
import { CRMProvider, useCRM } from './context/CRMContext';
import { Sidebar, NavItem } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardModule } from './components/dashboard/DashboardModule';
import { CandidatesModule } from './components/candidates/CandidatesModule';
import { ClientsModule } from './components/clients/ClientsModule';
import { LoginScreen } from './components/auth/LoginScreen';
import { AccessRestricted } from './components/common/AccessRestricted';

import { CandidateFormModal } from './components/candidates/CandidateFormModal';
import { JobFormModal } from './components/jobs/JobFormModal';
import { ClientFormModal } from './components/clients/ClientFormModal';
import { ScheduleInterviewModal } from './components/interviews/ScheduleInterviewModal';
import { CandidateProfileModal } from './components/candidates/CandidateProfileModal';
import { StatusRemarkModal } from './components/candidates/StatusRemarkModal';
import { Candidate, Client } from './types/crm';

// Lazy-load secondary screens for fast mobile initial load
const JobsModule = lazy(() =>
  import('./components/jobs/JobsModule').then((m) => ({ default: m.JobsModule }))
);
const PipelineKanbanModule = lazy(() =>
  import('./components/pipeline/PipelineKanbanModule').then((m) => ({
    default: m.PipelineKanbanModule,
  }))
);
const InterviewsModule = lazy(() =>
  import('./components/interviews/InterviewsModule').then((m) => ({
    default: m.InterviewsModule,
  }))
);
const MyTasksModule = lazy(() =>
  import('./components/reminders/MyTasksModule').then((m) => ({
    default: m.MyTasksModule,
  }))
);
const ReportsAnalyticsModule = lazy(() =>
  import('./components/reports/ReportsAnalyticsModule').then((m) => ({
    default: m.ReportsAnalyticsModule,
  }))
);
const SettingsModule = lazy(() =>
  import('./components/settings/SettingsModule').then((m) => ({
    default: m.SettingsModule,
  }))
);

const ModuleFallback: React.FC = () => (
  <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-600">
    <div className="w-8 h-8 rounded-full border-3 border-[#0B1F4B] border-t-[#F5A623] animate-spin" />
    <span className="text-xs font-bold">Loading module...</span>
  </div>
);

const CRMAppContent: React.FC = () => {
  const {
    currentUser,
    authLoading,
    isAuthenticated,
    logoutFromFirebase,
    activeStatusRemarkModal,
    closeStatusRemarkModal,
    submitStatusRemark,
    migrationNotice,
    clearMigrationNotice,
  } = useCRM();

  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Global modals
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [addClientInitialName, setAddClientInitialName] = useState('');
  const [isScheduleInterviewOpen, setIsScheduleInterviewOpen] = useState(false);

  // Profile modal & preselected entities
  const [activeCandidateForProfile, setActiveCandidateForProfile] = useState<Candidate | null>(null);
  const [candidateToEdit, setCandidateToEdit] = useState<Candidate | null>(null);
  const [selectedClientIdForProfile, setSelectedClientIdForProfile] = useState<string | undefined>();

  const [preSelectedJobIdForPipeline, setPreSelectedJobIdForPipeline] = useState<string | undefined>();
  const [preSelectedClientIdForJob, setPreSelectedClientIdForJob] = useState<string | undefined>();
  const [preSelectedCandidateForInterview, setPreSelectedCandidateForInterview] = useState<Candidate | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-full border-3 border-[#0B1F4B] border-t-[#F5A623] animate-spin" />
          <p className="text-xs font-bold text-slate-800">Connecting to BJ Bright Cloud CRM...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <LoginScreen />
      </div>
    );
  }

  const handleNavigate = (tab: NavItem) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToPipeline = (jobId?: string) => {
    setPreSelectedJobIdForPipeline(jobId);
    setCurrentTab('pipeline');
  };

  const handleOpenCreateJobForClient = (client: Client) => {
    setPreSelectedClientIdForJob(client.id);
    setIsAddJobOpen(true);
  };

  const handleScheduleInterviewForCandidate = (candidate: Candidate) => {
    setPreSelectedCandidateForInterview(candidate);
    setIsScheduleInterviewOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased overflow-x-hidden">
      {/* Sidebar Drawer (<1024px) & Fixed Bottom Nav (<768px) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleNavigate}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-68 flex-1 flex flex-col min-w-0 max-w-full">
        {/* Top Header */}
        <Header
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigate={handleNavigate}
          onOpenAddCandidate={() => setIsAddCandidateOpen(true)}
          onOpenAddJob={() => {
            setPreSelectedClientIdForJob(undefined);
            setIsAddJobOpen(true);
          }}
          onOpenAddClient={(initialName?: string) => {
            setAddClientInitialName(initialName || '');
            setIsAddClientOpen(true);
          }}
          onOpenClientProfile={(client: Client) => {
            setSelectedClientIdForProfile(client.id);
            setCurrentTab('clients');
          }}
          onOpenScheduleInterview={() => {
            setPreSelectedCandidateForInterview(null);
            setIsScheduleInterviewOpen(true);
          }}
          onOpenFirebaseModal={() => {}}
          onLogout={() => {
            logoutFromFirebase();
          }}
        />

        {/* One-time Admin Migration Banner */}
        {migrationNotice && (
          <div className="mx-3 sm:mx-6 lg:mx-8 mt-3 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-3 text-xs font-bold text-emerald-900 shadow-xs">
            <span>{migrationNotice}</span>
            <button
              type="button"
              onClick={clearMigrationNotice}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dynamic Page Views with Fluid Spacing & Safe Bottom Padding for Phone Nav */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-[clamp(0.75rem,2.5vw,2rem)] pt-[clamp(0.875rem,2vw,1.75rem)] pb-24 md:pb-8 min-w-0">
          <Suspense fallback={<ModuleFallback />}>
            {currentTab === 'dashboard' && (
              <DashboardModule
                onNavigate={handleNavigate}
                onOpenCandidateForm={() => setIsAddCandidateOpen(true)}
                onOpenScheduleInterview={() => setIsScheduleInterviewOpen(true)}
              />
            )}

            {currentTab === 'candidates' && (
              <CandidatesModule
                onScheduleInterviewForCandidate={handleScheduleInterviewForCandidate}
              />
            )}

            {currentTab === 'clients' && (
              <ClientsModule
                onOpenCreateJobForClient={handleOpenCreateJobForClient}
                initialProfileClientId={selectedClientIdForProfile}
                onClearInitialProfileClient={() => setSelectedClientIdForProfile(undefined)}
              />
            )}

            {currentTab === 'jobs' && (
              <JobsModule
                onNavigateToPipeline={handleNavigateToPipeline}
                onViewCandidateProfile={(cand) => setActiveCandidateForProfile(cand)}
              />
            )}

            {currentTab === 'pipeline' && (
              <PipelineKanbanModule
                initialJobId={preSelectedJobIdForPipeline}
                onViewCandidateProfile={(cand) => setActiveCandidateForProfile(cand)}
                onScheduleInterview={handleScheduleInterviewForCandidate}
              />
            )}

            {currentTab === 'interviews' && (
              <InterviewsModule
                onViewCandidateProfile={(cand) => setActiveCandidateForProfile(cand)}
              />
            )}

            {currentTab === 'tasks' && (
              <MyTasksModule
                onViewCandidateProfile={(cand) => setActiveCandidateForProfile(cand)}
              />
            )}

            {currentTab === 'reports' && <ReportsAnalyticsModule />}

            {currentTab === 'settings' &&
              (currentUser.role === 'admin' ? (
                <SettingsModule />
              ) : (
                <AccessRestricted onNavigate={handleNavigate} />
              ))}
          </Suspense>
        </main>
      </div>

      {/* Global Modals */}
      <CandidateFormModal
        isOpen={isAddCandidateOpen}
        onClose={() => {
          setIsAddCandidateOpen(false);
          setCandidateToEdit(null);
        }}
        candidateToEdit={candidateToEdit}
      />

      <JobFormModal
        isOpen={isAddJobOpen}
        onClose={() => {
          setIsAddJobOpen(false);
          setPreSelectedClientIdForJob(undefined);
        }}
        preSelectedClientId={preSelectedClientIdForJob}
      />

      <ClientFormModal
        isOpen={isAddClientOpen}
        onClose={() => {
          setIsAddClientOpen(false);
          setAddClientInitialName('');
        }}
        initialName={addClientInitialName}
        onOpenExistingClient={(cl) => {
          setIsAddClientOpen(false);
          setAddClientInitialName('');
          setSelectedClientIdForProfile(cl.id);
          setCurrentTab('clients');
        }}
      />

      <ScheduleInterviewModal
        isOpen={isScheduleInterviewOpen}
        onClose={() => {
          setIsScheduleInterviewOpen(false);
          setPreSelectedCandidateForInterview(null);
        }}
        preSelectedCandidate={preSelectedCandidateForInterview}
      />

      {/* Candidate Profile Modal */}
      <CandidateProfileModal
        isOpen={!!activeCandidateForProfile}
        onClose={() => setActiveCandidateForProfile(null)}
        candidate={activeCandidateForProfile}
        onEdit={(cand) => {
          setActiveCandidateForProfile(null);
          setCandidateToEdit(cand);
          setIsAddCandidateOpen(true);
        }}
        onScheduleInterview={(cand) => {
          setActiveCandidateForProfile(null);
          handleScheduleInterviewForCandidate(cand);
        }}
      />

      <StatusRemarkModal
        isOpen={!!activeStatusRemarkModal}
        onClose={closeStatusRemarkModal}
        candidate={activeStatusRemarkModal?.candidate || null}
        newStatus={activeStatusRemarkModal?.newStatus}
        isStatusChange={activeStatusRemarkModal?.isStatusChange ?? false}
        onSubmitWithRemark={submitStatusRemark}
        onSkip={() => submitStatusRemark('')}
      />
    </div>
  );
};

export default function App() {
  return (
    <CRMProvider>
      <CRMAppContent />
    </CRMProvider>
  );
}
