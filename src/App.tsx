import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StorageService } from './services/storage';
import {
  ActiveTab,
  Issue,
  Village,
  GramPanchayat,
  DevelopmentWork,
  PublicMeeting,
  FieldVisit,
  Department,
  ConstituencySettings,
  User,
  AppNotification,
} from './types';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { DataQualityBanner } from './components/common/DataQualityBanner';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { NotificationCenter } from './components/common/NotificationCenter';
import { DashboardView } from './components/dashboard/DashboardView';
import { IssuesListView } from './components/issues/IssuesListView';
import { IssueDetailModal } from './components/issues/IssueDetailModal';
import { IssueFormModal } from './components/issues/IssueFormModal';
import { VillagesView } from './components/villages/VillagesView';
import { VillageMembersView } from './components/members/VillageMembersView';
import { OtpLoginModal } from './components/auth/OtpLoginModal';
import { ConstituencyMapView } from './components/map/ConstituencyMapView';
import { FieldVisitsView } from './components/visits/FieldVisitsView';
import { PublicMeetingsView } from './components/meetings/PublicMeetingsView';
import { DevelopmentWorksView } from './components/works/DevelopmentWorksView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { MemberIssuePortal } from './components/issues/MemberIssuePortal';
import { IssueCategory } from './types';

function MainLayout() {
  const { currentUser, isMember, isAdmin } = useAuth();

  // Navigation state
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Synchronize tab with user role: members are restricted to 'issues'
  useEffect(() => {
    if (isMember && activeTab !== 'issues') {
      setActiveTab('issues');
    }
  }, [isMember, activeTab]);

  // Entities state from StorageService
  const [issues, setIssues] = useState<Issue[]>(() => StorageService.getIssues());
  const [villages, setVillages] = useState<Village[]>(() => StorageService.getVillages());
  const [gramPanchayats, setGramPanchayats] = useState<GramPanchayat[]>(() =>
    StorageService.getGramPanchayats()
  );
  const [developmentWorks, setDevelopmentWorks] = useState<DevelopmentWork[]>(() =>
    StorageService.getDevelopmentWorks()
  );
  const [publicMeetings, setPublicMeetings] = useState<PublicMeeting[]>(() =>
    StorageService.getPublicMeetings()
  );
  const [fieldVisits, setFieldVisits] = useState<FieldVisit[]>(() =>
    StorageService.getFieldVisits()
  );
  const [departments, setDepartments] = useState<Department[]>(() =>
    StorageService.getDepartments()
  );
  const [settings, setSettings] = useState<ConstituencySettings>(() =>
    StorageService.getSettings()
  );
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    StorageService.getNotifications()
  );

  // Subscription for reactive storage updates
  useEffect(() => {
    const unsubscribe = StorageService.subscribeToStorage(() => {
      setIssues(StorageService.getIssues());
      setVillages(StorageService.getVillages());
      setGramPanchayats(StorageService.getGramPanchayats());
      setDevelopmentWorks(StorageService.getDevelopmentWorks());
      setPublicMeetings(StorageService.getPublicMeetings());
      setFieldVisits(StorageService.getFieldVisits());
      setDepartments(StorageService.getDepartments());
      setSettings(StorageService.getSettings());
      setUsers(StorageService.getUsers());
      setNotifications(StorageService.getNotifications());
    });
    return unsubscribe;
  }, []);

  // Modal states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNewIssueModalOpen, setIsNewIssueModalOpen] = useState(false);
  const [presetCategoryForNewIssue, setPresetCategoryForNewIssue] = useState<IssueCategory | null>(null);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [selectedIssueForDetail, setSelectedIssueForDetail] = useState<Issue | null>(null);
  const [selectedIssueForEdit, setSelectedIssueForEdit] = useState<Issue | null>(null);

  // Deep linking targets
  const [selectedVillageId, setSelectedVillageId] = useState<string | undefined>(undefined);
  const [selectedWorkId, setSelectedWorkId] = useState<string | undefined>(undefined);
  const [selectedMemberVillage, setSelectedMemberVillage] = useState<string | undefined>(undefined);

  // Cross-module navigation handler
  const handleNavigate = (tab: ActiveTab, targetId?: string) => {
    if (isMember && tab !== 'issues') {
      setActiveTab('issues');
      return;
    }
    setActiveTab(tab);
    if (tab === 'issues' && targetId) {
      const found = issues.find((i) => i.id === targetId);
      if (found) setSelectedIssueForDetail(found);
    } else if (tab === 'villages' && targetId) {
      setSelectedVillageId(targetId);
    } else if (tab === 'development-works' && targetId) {
      setSelectedWorkId(targetId);
    } else if (tab === 'members') {
      setSelectedMemberVillage(targetId);
    }
  };

  const handleOpenIssueDetail = (issue: Issue) => {
    setSelectedIssueForDetail(issue);
  };

  const handleEditIssue = (issue: Issue) => {
    setSelectedIssueForDetail(null);
    setSelectedIssueForEdit(issue);
  };

  const handleDeleteIssue = (issueId: string) => {
    StorageService.deleteIssue(issueId, currentUser);
    setSelectedIssueForDetail(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenSettings={() => {
          if (!isMember) setActiveTab('settings');
        }}
        onOpenOtpLogin={() => setIsOtpModalOpen(true)}
        onOpenNewIssue={() => {
          setSelectedIssueForEdit(null);
          setPresetCategoryForNewIssue(null);
          setIsNewIssueModalOpen(true);
        }}
        onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        unreadNotificationsCount={(notifications || []).filter((n) => !n?.read).length}
      />

      {/* Body container with Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (isMember && tab !== 'issues') {
              setActiveTab('issues');
            } else {
              setActiveTab(tab);
            }
            setMobileSidebarOpen(false);
          }}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 space-y-4">
          {/* Data Quality & Official Demarcation Banner (Admin/Staff only) */}
          {!isMember && <DataQualityBanner />}

          {/* View Router */}
          {/* 1. Issues View: Dedicated Member Portal for Members, Full Management for Admins */}
          {activeTab === 'issues' && (
            isMember ? (
              <MemberIssuePortal
                issues={issues}
                villages={villages}
                onSelectIssue={handleOpenIssueDetail}
                onOpenNewModal={(presetCategory) => {
                  setPresetCategoryForNewIssue(presetCategory || null);
                  setSelectedIssueForEdit(null);
                  setIsNewIssueModalOpen(true);
                }}
                selectedIssueId={selectedIssueForDetail?.id}
              />
            ) : (
              <IssuesListView
                issues={issues}
                villages={villages}
                departments={departments}
                onSelectIssue={handleOpenIssueDetail}
                onOpenNewModal={() => {
                  setSelectedIssueForEdit(null);
                  setPresetCategoryForNewIssue(null);
                  setIsNewIssueModalOpen(true);
                }}
                selectedIssueId={selectedIssueForDetail?.id}
              />
            )
          )}

          {/* All other views are accessible to Admin and Staff */}
          {!isMember && activeTab === 'dashboard' && (
            <DashboardView
              issues={issues}
              villages={villages}
              gramPanchayats={gramPanchayats}
              developmentWorks={developmentWorks}
              publicMeetings={publicMeetings}
              fieldVisits={fieldVisits}
              departments={departments}
              onNavigate={handleNavigate}
              onOpenNewIssueModal={() => setIsNewIssueModalOpen(true)}
              onOpenNewIssue={() => setIsNewIssueModalOpen(true)}
              onSelectIssue={handleOpenIssueDetail}
            />
          )}

          {!isMember && activeTab === 'villages' && (
            <VillagesView
              villages={villages}
              gramPanchayats={gramPanchayats}
              issues={issues}
              developmentWorks={developmentWorks}
              publicMeetings={publicMeetings}
              fieldVisits={fieldVisits}
              onNavigate={handleNavigate}
              selectedVillageId={selectedVillageId}
            />
          )}

          {!isMember && activeTab === 'members' && (
            <VillageMembersView
              villages={villages}
              initialVillage={selectedMemberVillage}
              onNavigate={handleNavigate}
            />
          )}

          {!isMember && activeTab === 'map' && (
            <ConstituencyMapView
              villages={villages}
              issues={issues}
              developmentWorks={developmentWorks}
              pollingBooths={StorageService.getPollingBooths()}
              gramPanchayats={gramPanchayats}
              onNavigate={handleNavigate}
            />
          )}

          {!isMember && activeTab === 'field-visits' && (
            <FieldVisitsView
              fieldVisits={fieldVisits}
              villages={villages}
              issues={issues}
              onOpenIssue={(issueId) => handleNavigate('issues', issueId)}
            />
          )}

          {!isMember && activeTab === 'meetings' && (
            <PublicMeetingsView
              publicMeetings={publicMeetings}
              villages={villages}
            />
          )}

          {!isMember && activeTab === 'development-works' && (
            <DevelopmentWorksView
              developmentWorks={developmentWorks}
              villages={villages}
              gramPanchayats={gramPanchayats}
              departments={departments}
              selectedWorkId={selectedWorkId}
            />
          )}

          {!isMember && activeTab === 'reports' && (
            <ReportsView
              issues={issues}
              villages={villages}
              developmentWorks={developmentWorks}
              publicMeetings={publicMeetings}
              fieldVisits={fieldVisits}
              departments={departments}
            />
          )}

          {!isMember && activeTab === 'settings' && (
            <SettingsView
              users={users}
              departments={departments}
              settings={settings}
              onRefreshData={() => {
                setIssues(StorageService.getIssues());
                setVillages(StorageService.getVillages());
                setGramPanchayats(StorageService.getGramPanchayats());
                setDevelopmentWorks(StorageService.getDevelopmentWorks());
                setPublicMeetings(StorageService.getPublicMeetings());
                setFieldVisits(StorageService.getFieldVisits());
                setDepartments(StorageService.getDepartments());
                setSettings(StorageService.getSettings());
                setUsers(StorageService.getUsers());
              }}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      {/* 1. Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        issues={issues}
        villages={villages}
        developmentWorks={developmentWorks}
        onNavigate={handleNavigate}
      />

      {/* 2. Notification Center Drawer */}
      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onNavigate={handleNavigate}
      />

      {/* 3. Issue Detail Modal */}
      <IssueDetailModal
        issue={selectedIssueForDetail}
        onClose={() => setSelectedIssueForDetail(null)}
        onEdit={handleEditIssue}
        onDelete={handleDeleteIssue}
      />

      {/* 4. Issue Form Modal (Create or Edit) */}
      <IssueFormModal
        isOpen={isNewIssueModalOpen || !!selectedIssueForEdit}
        onClose={() => {
          setIsNewIssueModalOpen(false);
          setSelectedIssueForEdit(null);
          setPresetCategoryForNewIssue(null);
        }}
        editIssue={selectedIssueForEdit}
        presetCategory={presetCategoryForNewIssue}
        villages={villages}
        gramPanchayats={gramPanchayats}
        departments={departments}
        users={users}
        onSaved={(saved) => {
          setSelectedIssueForDetail(saved);
          setPresetCategoryForNewIssue(null);
        }}
      />

      {/* 5. Mobile OTP Login Modal */}
      <OtpLoginModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
