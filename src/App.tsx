import React, { useState } from 'react';
import { CRMProvider, useCRM } from './context/CRMContext';
import { Sidebar, NavItem } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardModule } from './components/dashboard/DashboardModule';
import { CandidatesModule } from './components/candidates/CandidatesModule';
import { ClientsModule } from './components/clients/ClientsModule';
import { JobsModule } from './components/jobs/JobsModule';
import { PipelineKanbanModule } from './components/pipeline/PipelineKanbanModule';
import { InterviewsModule } from './components/interviews/InterviewsModule';
import { SettingsModule } from './components/settings/SettingsModule';
import { ReportsAnalyticsModule } from './components/reports/ReportsAnalyticsModule';
import { MyTasksModule } from './components/reminders/MyTasksModule';
import { LoginScreen } from './components/auth/LoginScreen';
import { AccessRestricted } from './components/common/AccessRestricted';

import { CandidateFormModal } from './components/candidates/CandidateFormModal';
import { JobFormModal } from './components/jobs/JobFormModal';
import { ClientFormModal } from './components/clients/ClientFormModal';
import { ScheduleInterviewModal } from './components/interviews/ScheduleInterviewModal';
import { CandidateProfileModal } from './components/candidates/CandidateProfileModal';
import { StatusRemarkModal } from './components/candidates/StatusRemarkModal';
import { Candidate, Client } from './types/crm';
import { dataService } from './lib/dataService';

const CRMAppContent: React.FC = () => {
  const {
    currentUser,
    authLoading,
    isAuthenticated,
    logoutFromFirebase,
    activeStatusRemarkModal,
    closeStatusRemarkModal,
    submitStatusRemark,
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-full border-3 border-[#F5A623] border-t-transparent animate-spin" />
          <p className="text-xs font-bold text-slate-300">Connecting to BJ Bright Cloud CRM...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleNavigate}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-68 flex-1 flex flex-col min-w-0">
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

        {/* Dynamic Page Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
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

          {currentTab === 'settings' && (
            currentUser.role === 'admin' ? (
              <SettingsModule />
            ) : (
              <AccessRestricted onNavigate={handleNavigate} />
            )
          )}
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
