import {
  User,
  Village,
  VillageMember,
  GramPanchayat,
  PollingBooth,
  Department,
  Issue,
  FieldVisit,
  PublicMeeting,
  VillageVideoConference,
  VideoConferenceChatMessage,
  DevelopmentWork,
  AppNotification,
  AuditLog,
  UserRole,
  IssueStatus,
  ConstituencySettings,
  VillageHead,
  VillageHeadAssignment,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_GRAM_PANCHAYATS,
  INITIAL_DEPARTMENTS,
  INITIAL_VILLAGES,
  INITIAL_VILLAGE_MEMBERS,
  INITIAL_POLLING_BOOTHS,
  INITIAL_ISSUES,
  INITIAL_FIELD_VISITS,
  INITIAL_PUBLIC_MEETINGS,
  INITIAL_VIDEO_CONFERENCES,
  INITIAL_DEVELOPMENT_WORKS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from '../data/initialData';
import { ALL_124_VILLAGES } from '../data/officialVillages';

const STORAGE_KEY_PREFIX = 'constituency_connect_v1_';

function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
    notifyListeners();
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

// Storage event listeners for multi-component reactive synchronization
type StorageListener = () => void;
const listeners = new Set<StorageListener>();

export function subscribeToStorage(listener: StorageListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Storage listener error:', e);
    }
  });
}

// Helper to log audit event
export function logAudit(
  user: string,
  userRole: UserRole,
  action: string,
  entityType: string,
  entityId: string,
  details: string
) {
  const logs = getStorageItem<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
  const newLog: AuditLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    user,
    userRole,
    action,
    entityType,
    entityId,
    details,
  };
  setStorageItem('audit_logs', [newLog, ...logs]);
}

// Ensure database initialization
export function initializeStorageIfEmpty(): void {
  const isV3Initialized = localStorage.getItem(STORAGE_KEY_PREFIX + 'initialized_v3');
  const storedVillages = getStorageItem<Village[]>('villages', []);
  const storedMembers = getStorageItem<VillageMember[]>('village_members', []);
  const storedUsers = getStorageItem<User[]>('users', []);
  const storedVC = getStorageItem<VillageVideoConference[]>('video_conferences', []);

  if (!isV3Initialized || storedVillages.length < 124 || !storedMembers || storedMembers.length === 0 || storedVC.length === 0 || !storedVillages[0]?.villageHead) {
    // Preserve users or ensure USR-007 (Village Head) exists
    if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'users') || storedUsers.length < 7) {
      setStorageItem('users', INITIAL_USERS);
    }
    setStorageItem('gram_panchayats', INITIAL_GRAM_PANCHAYATS);
    if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'departments')) {
      setStorageItem('departments', INITIAL_DEPARTMENTS);
    }
    // Update villages to ensure all 124 villages have their designated village head
    setStorageItem('villages', INITIAL_VILLAGES);
    if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'polling_booths')) {
      setStorageItem('polling_booths', INITIAL_POLLING_BOOTHS);
    }
    if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'issues')) {
      setStorageItem('issues', INITIAL_ISSUES);
    }
    if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'field_visits')) {
      setStorageItem('field_visits', INITIAL_FIELD_VISITS);
    }
    if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'public_meetings')) {
      setStorageItem('public_meetings', INITIAL_PUBLIC_MEETINGS);
    }
    // Initialize video conferences if empty
    if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'video_conferences') || storedVC.length === 0) {
      setStorageItem('video_conferences', INITIAL_VIDEO_CONFERENCES);
    }
    if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'development_works')) {
      setStorageItem('development_works', INITIAL_DEVELOPMENT_WORKS);
    }
    if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'notifications')) {
      setStorageItem('notifications', INITIAL_NOTIFICATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'audit_logs')) {
      setStorageItem('audit_logs', INITIAL_AUDIT_LOGS);
    }
    if (!storedMembers || storedMembers.length === 0) {
      setStorageItem('village_members', INITIAL_VILLAGE_MEMBERS);
    }
    localStorage.setItem(STORAGE_KEY_PREFIX + 'initialized_v3', 'true');
    localStorage.setItem(STORAGE_KEY_PREFIX + 'initialized_v2', 'true');
    localStorage.setItem(STORAGE_KEY_PREFIX + 'initialized', 'true');
  }
}

export const DEFAULT_SETTINGS: ConstituencySettings = {
  constituencyName: 'Sindhanur',
  constituencyNumber: 'AC-58',
  district: 'Raichur',
  state: 'Karnataka',
  mlaName: 'Shri Hampanagouda Badarli',
  officeContact: '+91 8535 220123',
  officeEmail: 'mla.sindhanur58@karnataka.gov.in',
  officeAddress:
    'MLA Constituency Office, Near Mini Vidhana Soudha, Sindhanur, Raichur District, Karnataka - 584128',
  helpdeskPhone: '1800-425-0058 / +91 8535 220999',
};

export const StorageService = {
  subscribeToStorage(listener: StorageListener) {
    return subscribeToStorage(listener);
  },

  getSettings(): ConstituencySettings {
    return getStorageItem<ConstituencySettings>('settings', DEFAULT_SETTINGS);
  },

  saveSettings(settings: ConstituencySettings): void {
    setStorageItem('settings', settings);
  },

  resetToDefaults(): void {
    this.resetToSampleData();
  },

  exportFullBackup(): string {
    return this.exportDatabaseJSON();
  },

  importFullBackup(jsonStr: string): boolean {
    const res = this.importDatabaseJSON(jsonStr);
    return res.success;
  },

  // Reset database to initial sample dataset
  resetToSampleData(): void {
    setStorageItem('users', INITIAL_USERS);
    setStorageItem('gram_panchayats', INITIAL_GRAM_PANCHAYATS);
    setStorageItem('departments', INITIAL_DEPARTMENTS);
    setStorageItem('villages', INITIAL_VILLAGES);
    setStorageItem('village_members', INITIAL_VILLAGE_MEMBERS);
    setStorageItem('polling_booths', INITIAL_POLLING_BOOTHS);
    setStorageItem('issues', INITIAL_ISSUES);
    setStorageItem('field_visits', INITIAL_FIELD_VISITS);
    setStorageItem('public_meetings', INITIAL_PUBLIC_MEETINGS);
    setStorageItem('development_works', INITIAL_DEVELOPMENT_WORKS);
    setStorageItem('notifications', INITIAL_NOTIFICATIONS);
    setStorageItem('audit_logs', INITIAL_AUDIT_LOGS);
    setStorageItem('initialized', 'true');
    setStorageItem('initialized_v2', 'true');
  },

  // Clear all data
  clearAllData(): void {
    setStorageItem('users', []);
    setStorageItem('gram_panchayats', []);
    setStorageItem('departments', INITIAL_DEPARTMENTS);
    setStorageItem('villages', []);
    setStorageItem('village_members', []);
    setStorageItem('polling_booths', []);
    setStorageItem('issues', []);
    setStorageItem('field_visits', []);
    setStorageItem('public_meetings', []);
    setStorageItem('development_works', []);
    setStorageItem('notifications', []);
    setStorageItem('audit_logs', []);
  },

  // Export full JSON dump
  exportDatabaseJSON(): string {
    const data = {
      version: '2.0',
      constituency: 'Sindhanur AC-58',
      district: 'Raichur',
      state: 'Karnataka',
      exportedAt: new Date().toISOString(),
      users: this.getUsers(),
      gramPanchayats: this.getGramPanchayats(),
      departments: this.getDepartments(),
      villages: this.getVillages(),
      villageMembers: this.getVillageMembers(),
      pollingBooths: this.getPollingBooths(),
      issues: this.getIssues(),
      fieldVisits: this.getFieldVisits(),
      publicMeetings: this.getPublicMeetings(),
      developmentWorks: this.getDevelopmentWorks(),
      notifications: this.getNotifications(),
      auditLogs: this.getAuditLogs(),
    };
    return JSON.stringify(data, null, 2);
  },

  // Import JSON dump
  importDatabaseJSON(jsonStr: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.issues)) setStorageItem('issues', parsed.issues);
      if (Array.isArray(parsed.villages)) setStorageItem('villages', parsed.villages);
      if (Array.isArray(parsed.villageMembers)) setStorageItem('village_members', parsed.villageMembers);
      if (Array.isArray(parsed.gramPanchayats)) setStorageItem('gram_panchayats', parsed.gramPanchayats);
      if (Array.isArray(parsed.developmentWorks)) setStorageItem('development_works', parsed.developmentWorks);
      if (Array.isArray(parsed.fieldVisits)) setStorageItem('field_visits', parsed.fieldVisits);
      if (Array.isArray(parsed.publicMeetings)) setStorageItem('public_meetings', parsed.publicMeetings);
      if (Array.isArray(parsed.users)) setStorageItem('users', parsed.users);
      if (Array.isArray(parsed.pollingBooths)) setStorageItem('polling_booths', parsed.pollingBooths);
      if (Array.isArray(parsed.departments)) setStorageItem('departments', parsed.departments);
      if (Array.isArray(parsed.notifications)) setStorageItem('notifications', parsed.notifications);
      if (Array.isArray(parsed.auditLogs)) setStorageItem('audit_logs', parsed.auditLogs);
      return { success: true, message: 'Database imported successfully.' };
    } catch (e: any) {
      return { success: false, message: 'Failed to parse JSON file: ' + e.message };
    }
  },

  // Users
  getUsers(): User[] {
    return getStorageItem<User[]>('users', INITIAL_USERS);
  },
  saveUser(user: User): void {
    const list = this.getUsers();
    const idx = list.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      list[idx] = user;
    } else {
      list.push(user);
    }
    setStorageItem('users', list);
  },
  deleteUser(userId: string): void {
    const list = this.getUsers().filter((u) => u.id !== userId);
    setStorageItem('users', list);
  },

  // Gram Panchayats
  getGramPanchayats(): GramPanchayat[] {
    const raw = getStorageItem<GramPanchayat[]>('gram_panchayats', INITIAL_GRAM_PANCHAYATS);
    return Array.isArray(raw) ? raw : [];
  },

  // Departments
  getDepartments(): Department[] {
    const raw = getStorageItem<Department[]>('departments', INITIAL_DEPARTMENTS);
    return Array.isArray(raw) ? raw : [];
  },
  saveDepartment(dept: Department): void {
    const list = this.getDepartments();
    const idx = list.findIndex((d) => d.id === dept.id);
    if (idx >= 0) {
      list[idx] = dept;
    } else {
      list.push(dept);
    }
    setStorageItem('departments', list);
  },
  deleteDepartment(deptId: string): void {
    const list = this.getDepartments().filter((d) => d.id !== deptId);
    setStorageItem('departments', list);
  },

  // Polling Booths
  getPollingBooths(): PollingBooth[] {
    const raw = getStorageItem<PollingBooth[]>('polling_booths', INITIAL_POLLING_BOOTHS);
    return Array.isArray(raw) ? raw : [];
  },
  savePollingBooth(booth: PollingBooth): void {
    const list = this.getPollingBooths();
    const idx = list.findIndex((b) => b.id === booth.id);
    if (idx >= 0) list[idx] = booth;
    else list.push(booth);
    setStorageItem('polling_booths', list);
  },

  // Villages
  getVillages(): Village[] {
    const raw = getStorageItem<Village[]>('villages', INITIAL_VILLAGES);
    const villages = Array.isArray(raw) ? raw : [];
    const issues = this.getIssues();
    const works = this.getDevelopmentWorks();
    const meetings = this.getPublicMeetings();
    const visits = this.getFieldVisits();
    const members = this.getVillageMembers();

    // Dynamically calculate actual counts and ensure 1:1 Village Head integrity
    return villages.map((v, idx) => {
      const vIssues = issues.filter((i) => i.village === v.name);
      const vWorks = works.filter((w) => w.village === v.name);
      const vMeetings = meetings.filter((m) => m.village === v.name);
      const vVisits = visits.filter((f) => f.village === v.name);
      const vMembers = members.filter((m) => m.village === v.name);

      // Guarantee villageHead exists and matches 1:1 assigned village head
      let head = v.villageHead;
      if (!head || !head.name) {
        const official =
          ALL_124_VILLAGES.find((ov) => ov.name.toLowerCase() === v.name.toLowerCase()) ||
          ALL_124_VILLAGES[idx % ALL_124_VILLAGES.length];
        head = official?.villageHead || {
          name: v.villageHeadName || `${v.name} Village Head`,
          phone:
            v.villageHeadPhone ||
            `+91 9448${String(10000 + ((idx * 73) % 89999)).padStart(5, '0')}`,
          designation: v.villageHeadDesignation || 'Grama Pradhan / Village Head',
          termStartDate: '2023-01-15',
          email: `head.${v.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@sindhanur.gov.in`,
        };
      }

      return {
        ...v,
        villageHead: head,
        villageHeadName: head.name,
        villageHeadPhone: head.phone,
        villageHeadDesignation: head.designation,
        membersCount: vMembers.length,
        openIssuesCount: vIssues.filter(
          (i) => !['Resolved', 'Closed', 'Rejected'].includes(i.status)
        ).length,
        resolvedIssuesCount: vIssues.filter((i) => i.status === 'Resolved').length,
        developmentWorksCount: vWorks.length,
        meetingsCount: vMeetings.length,
        fieldVisitsCount: vVisits.length,
      };
    });
  },

  /**
   * Validates that a village head is assigned to exactly one village.
   * If the head name or phone is already linked to another village, flags conflict.
   */
  validateVillageHeadAssignment(
    headName: string,
    headPhone: string,
    targetVillageId?: string
  ): { isValid: boolean; conflictVillage?: Village; reason?: string } {
    const cleanPhone = (headPhone || '').replace(/[^0-9]/g, '').slice(-10);
    const cleanName = (headName || '').trim().toLowerCase();

    if (!cleanName && !cleanPhone) return { isValid: true };

    const raw = getStorageItem<Village[]>('villages', INITIAL_VILLAGES);
    const villages = Array.isArray(raw) ? raw : [];

    for (const v of villages) {
      if (targetVillageId && v.id === targetVillageId) continue;
      const vHeadName = (v.villageHead?.name || v.villageHeadName || '').trim().toLowerCase();
      const vHeadPhone = (v.villageHead?.phone || v.villageHeadPhone || '').replace(/[^0-9]/g, '').slice(-10);

      // Check name collision
      if (cleanName && vHeadName && cleanName === vHeadName) {
        return {
          isValid: false,
          conflictVillage: v,
          reason: `Village Head "${v.villageHead?.name || v.villageHeadName}" is already assigned to ${v.name}. Under constituency governance regulations, a Village Head must be assigned to exactly one village.`,
        };
      }

      // Check phone collision
      if (cleanPhone && vHeadPhone && cleanPhone.length >= 10 && cleanPhone === vHeadPhone) {
        return {
          isValid: false,
          conflictVillage: v,
          reason: `Contact phone ${headPhone} belongs to Village Head "${v.villageHead?.name || v.villageHeadName}" already assigned to ${v.name}. A Village Head must be assigned to exactly one village.`,
        };
      }
    }

    return { isValid: true };
  },

  saveVillage(village: Village, allowReassign: boolean = false): { success: boolean; error?: string } {
    const raw = getStorageItem<Village[]>('villages', INITIAL_VILLAGES);
    const list = Array.isArray(raw) ? [...raw] : [];

    // Ensure villageHead object and scalar fields are in sync
    const headName = (village.villageHead?.name || village.villageHeadName || '').trim();
    const headPhone = (village.villageHead?.phone || village.villageHeadPhone || '').trim();
    const headDesignation =
      village.villageHead?.designation || village.villageHeadDesignation || 'Grama Pradhan / Village Head';

    if (headName) {
      // Validate 1:1 assignment rule
      const validation = this.validateVillageHeadAssignment(headName, headPhone, village.id);
      if (!validation.isValid) {
        if (!allowReassign) {
          return { success: false, error: validation.reason };
        }

        // Handle re-assignment: update old village so 1:1 rule remains intact
        if (validation.conflictVillage) {
          const prevIdx = list.findIndex((v) => v.id === validation.conflictVillage!.id);
          if (prevIdx >= 0) {
            const oldV = list[prevIdx];
            const replacementHead: VillageHead = {
              name: `${oldV.name} Acting Head`,
              phone: `+91 94480 ${String(1000 + (prevIdx % 8999))}`,
              designation: 'Interim Grama Pradhan / Village Head',
              termStartDate: new Date().toISOString().slice(0, 10),
              email: `head.${oldV.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@sindhanur.gov.in`,
            };
            list[prevIdx] = {
              ...oldV,
              villageHead: replacementHead,
              villageHeadName: replacementHead.name,
              villageHeadPhone: replacementHead.phone,
              villageHeadDesignation: replacementHead.designation,
            };
          }
        }
      }

      village.villageHead = {
        name: headName,
        phone: headPhone || '+91 94481 00000',
        designation: headDesignation,
        termStartDate: village.villageHead?.termStartDate || '2023-01-15',
        email:
          village.villageHead?.email ||
          `head.${village.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@sindhanur.gov.in`,
        avatar: village.villageHead?.avatar,
      };
      village.villageHeadName = headName;
      village.villageHeadPhone = headPhone;
      village.villageHeadDesignation = headDesignation;
    }

    const idx = list.findIndex((v) => v.id === village.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...village };
    } else {
      list.push(village);
    }
    setStorageItem('villages', list);

    const activeUser = this.getCurrentUser();
    this.logAudit(
      activeUser.name,
      activeUser.role,
      'SAVE_VILLAGE',
      'Village',
      village.id,
      `Saved village details for ${village.name}. Designated Village Head: ${village.villageHeadName || 'None'} (1:1 assigned).`
    );

    return { success: true };
  },

  assignVillageHead(
    villageId: string,
    head: VillageHead,
    forceReassign: boolean = false
  ): { success: boolean; error?: string } {
    const villages = this.getVillages();
    const target = villages.find((v) => v.id === villageId);
    if (!target) {
      return { success: false, error: `Village with ID ${villageId} not found.` };
    }

    const updatedVillage: Village = {
      ...target,
      villageHead: head,
      villageHeadName: head.name,
      villageHeadPhone: head.phone,
      villageHeadDesignation: head.designation,
    };

    return this.saveVillage(updatedVillage, forceReassign);
  },

  getAllVillageHeadAssignments(): VillageHeadAssignment[] {
    const villages = this.getVillages();
    return villages.map((v) => ({
      villageId: v.id,
      villageName: v.name,
      gramPanchayat: v.gramPanchayat,
      villageHead: v.villageHead || {
        name: v.villageHeadName || `${v.name} Village Head`,
        phone: v.villageHeadPhone || '+91 94481 00000',
        designation: v.villageHeadDesignation || 'Grama Pradhan / Village Head',
      },
      isExclusive: true,
    }));
  },

  verifyVillageHeadUniqueness(): {
    totalVillages: number;
    assignedHeadsCount: number;
    uniqueHeadsCount: number;
    isCompliant: boolean;
    conflicts: { headName: string; villages: string[] }[];
  } {
    const villages = this.getVillages();
    const nameMap = new Map<string, string[]>();
    villages.forEach((v) => {
      const name = (v.villageHead?.name || v.villageHeadName || '').trim();
      if (name) {
        const list = nameMap.get(name) || [];
        list.push(v.name);
        nameMap.set(name, list);
      }
    });
    const conflicts: { headName: string; villages: string[] }[] = [];
    nameMap.forEach((vils, hName) => {
      if (vils.length > 1) {
        conflicts.push({ headName: hName, villages: vils });
      }
    });
    return {
      totalVillages: villages.length,
      assignedHeadsCount: villages.filter((v) => !v.villageHead?.name && !v.villageHeadName ? false : true).length,
      uniqueHeadsCount: nameMap.size,
      isCompliant: conflicts.length === 0,
      conflicts,
    };
  },
  deleteVillage(villageId: string): void {
    const list = this.getVillages().filter(
      (v) => v.id !== villageId
    );
    setStorageItem('villages', list);
  },

  // Village Members
  getVillageMembers(): VillageMember[] {
    const raw = getStorageItem<VillageMember[]>('village_members', INITIAL_VILLAGE_MEMBERS);
    return Array.isArray(raw) ? raw : [];
  },
  saveVillageMember(member: VillageMember): void {
    const list = this.getVillageMembers();
    const idx = list.findIndex((m) => m.id === member.id);
    if (idx >= 0) {
      list[idx] = member;
    } else {
      list.unshift(member);
    }
    setStorageItem('village_members', list);
  },
  deleteVillageMember(memberId: string): void {
    const list = this.getVillageMembers().filter((m) => m.id !== memberId);
    setStorageItem('village_members', list);
  },
  getMembersByVillage(villageName: string): VillageMember[] {
    return this.getVillageMembers().filter((m) => m.village.toLowerCase() === villageName.toLowerCase());
  },
  getMemberByMobile(mobile: string): VillageMember | undefined {
    const clean = mobile.replace(/[^0-9]/g, '');
    return this.getVillageMembers().find((m) => {
      const mClean = m.mobileNumber.replace(/[^0-9]/g, '');
      return mClean === clean || mClean.endsWith(clean) || clean.endsWith(mClean);
    });
  },

  // Issues
  getIssues(): Issue[] {
    const raw = getStorageItem<Issue[]>('issues', INITIAL_ISSUES);
    if (!Array.isArray(raw)) return [];
    return raw.map((i) => ({
      ...i,
      timeline: Array.isArray(i.timeline) ? i.timeline : [],
      comments: Array.isArray(i.comments) ? i.comments : [],
      photos: Array.isArray(i.photos) ? i.photos : [],
      documents: Array.isArray(i.documents) ? i.documents : [],
      statusHistory: Array.isArray(i.statusHistory) ? i.statusHistory : [],
      assignmentHistory: Array.isArray(i.assignmentHistory) ? i.assignmentHistory : [],
    }));
  },
  getIssueById(id: string): Issue | undefined {
    return this.getIssues().find((i) => i.id === id);
  },
  saveIssue(issue: Issue, user: User, actionNote?: string): void {
    const list = this.getIssues();
    const idx = list.findIndex((i) => i.id === issue.id);
    const isNew = idx < 0;

    if (isNew) {
      list.unshift(issue);
      logAudit(user.name, user.role, 'CREATE_ISSUE', 'Issue', issue.id, `Created grievance: ${issue.category} at ${issue.village}`);
      
      // Auto create notification
      this.addNotification({
        id: `notif-${Date.now()}`,
        type: 'New Issue',
        title: 'New Issue Registered',
        message: `${issue.id} reported: ${issue.category} at ${issue.village}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        read: false,
        linkId: issue.id,
        linkType: 'issue',
      });
    } else {
      const oldIssue = list[idx];
      list[idx] = issue;
      logAudit(
        user.name,
        user.role,
        'UPDATE_ISSUE',
        'Issue',
        issue.id,
        actionNote || `Updated grievance details for ${issue.id}`
      );

      if (oldIssue.status !== issue.status && issue.status === 'Resolved') {
        this.addNotification({
          id: `notif-${Date.now()}`,
          type: 'Issue Resolved',
          title: 'Issue Marked Resolved',
          message: `${issue.id} marked resolved by ${user.name}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          read: false,
          linkId: issue.id,
          linkType: 'issue',
        });
      }
    }
    setStorageItem('issues', list);
  },
  deleteIssue(issueId: string, user: User): void {
    const list = this.getIssues().filter((i) => i.id !== issueId);
    setStorageItem('issues', list);
    logAudit(user.name, user.role, 'DELETE_ISSUE', 'Issue', issueId, `Deleted grievance ${issueId}`);
  },

  // Field Visits
  getFieldVisits(): FieldVisit[] {
    const raw = getStorageItem<FieldVisit[]>('field_visits', INITIAL_FIELD_VISITS);
    if (!Array.isArray(raw)) return [];
    return raw.map((v) => ({
      ...v,
      team: Array.isArray(v.team) ? v.team : (Array.isArray(v.attendees) ? v.attendees : []),
      attendees: Array.isArray(v.attendees) ? v.attendees : (Array.isArray(v.team) ? v.team : []),
      issuesFound: Array.isArray(v.issuesFound) ? v.issuesFound : (Array.isArray(v.issuesInspected) ? v.issuesInspected : []),
      issuesInspected: Array.isArray(v.issuesInspected) ? v.issuesInspected : (Array.isArray(v.issuesFound) ? v.issuesFound : []),
      notes: v.notes || v.keyObservations || '',
      keyObservations: v.keyObservations || v.notes || '',
      actionItems: Array.isArray(v.actionItems) ? v.actionItems : [],
      followUpRequired: v.followUpRequired ?? Boolean(v.followUpDate),
      photos: Array.isArray(v.photos) ? v.photos : [],
    }));
  },
  saveFieldVisit(visit: FieldVisit, user?: User): void {
    const activeUser = user || ({ name: 'Admin', role: 'ADMIN' } as User);
    const list = this.getFieldVisits();
    const idx = list.findIndex((v) => v.id === visit.id);
    if (idx >= 0) {
      list[idx] = visit;
      logAudit(activeUser.name, activeUser.role, 'UPDATE_FIELD_VISIT', 'FieldVisit', visit.id, `Updated field visit at ${visit.village}`);
    } else {
      list.unshift(visit);
      logAudit(activeUser.name, activeUser.role, 'CREATE_FIELD_VISIT', 'FieldVisit', visit.id, `Scheduled field visit at ${visit.village}`);
      this.addNotification({
        id: `notif-${Date.now()}`,
        type: 'Field Visit Reminder',
        title: 'New Field Visit Scheduled',
        message: `Field visit to ${visit.village} on ${visit.date} at ${visit.time}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        read: false,
        linkId: visit.id,
        linkType: 'visit',
      });
    }
    setStorageItem('field_visits', list);
  },
  deleteFieldVisit(visitId: string, user?: User): void {
    const activeUser = user || ({ name: 'Admin', role: 'ADMIN' } as User);
    const list = this.getFieldVisits().filter((v) => v.id !== visitId);
    setStorageItem('field_visits', list);
    logAudit(activeUser.name, activeUser.role, 'DELETE_FIELD_VISIT', 'FieldVisit', visitId, `Deleted field visit ${visitId}`);
  },

  // Public Meetings
  getPublicMeetings(): PublicMeeting[] {
    const raw = getStorageItem<PublicMeeting[]>('public_meetings', INITIAL_PUBLIC_MEETINGS);
    if (!Array.isArray(raw)) return [];
    return raw.map((m) => ({
      ...m,
      purpose: m.purpose || m.title || 'Public Consultation',
      attendeesCount:
        m.attendeesCount || (typeof m.participants === 'number' ? m.participants : 0),
      participants: m.participants || m.attendeesCount || 0,
      issuesDiscussed: Array.isArray(m.issuesDiscussed) ? m.issuesDiscussed : (Array.isArray(m.keyIssuesDiscussed) ? m.keyIssuesDiscussed : []),
      keyIssuesDiscussed: Array.isArray(m.keyIssuesDiscussed) ? m.keyIssuesDiscussed : (Array.isArray(m.issuesDiscussed) ? m.issuesDiscussed : []),
      decisionsMade: Array.isArray(m.decisionsMade) ? m.decisionsMade : (m.decisions ? [m.decisions] : []),
      status: m.status || 'Completed',
      followUpActions: Array.isArray(m.followUpActions) ? m.followUpActions : [],
      photos: Array.isArray(m.photos) ? m.photos : [],
      documents: Array.isArray(m.documents) ? m.documents : [],
    }));
  },
  savePublicMeeting(meeting: PublicMeeting, user?: User): void {
    const activeUser = user || ({ name: 'Admin', role: 'ADMIN' } as User);
    const list = this.getPublicMeetings();
    const idx = list.findIndex((m) => m.id === meeting.id);
    if (idx >= 0) {
      list[idx] = meeting;
      logAudit(activeUser.name, activeUser.role, 'UPDATE_MEETING', 'PublicMeeting', meeting.id, `Updated meeting: ${meeting.title}`);
    } else {
      list.unshift(meeting);
      logAudit(activeUser.name, activeUser.role, 'CREATE_MEETING', 'PublicMeeting', meeting.id, `Scheduled meeting: ${meeting.title}`);
      this.addNotification({
        id: `notif-${Date.now()}`,
        type: 'Meeting Reminder',
        title: 'New Meeting Scheduled',
        message: `${meeting.title} on ${meeting.date} at ${meeting.location}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        read: false,
        linkId: meeting.id,
        linkType: 'meeting',
      });
    }
    setStorageItem('public_meetings', list);
  },
  deletePublicMeeting(meetingId: string, user?: User): void {
    const activeUser = user || ({ name: 'Admin', role: 'ADMIN' } as User);
    const list = this.getPublicMeetings().filter((m) => m.id !== meetingId);
    setStorageItem('public_meetings', list);
    logAudit(activeUser.name, activeUser.role, 'DELETE_MEETING', 'PublicMeeting', meetingId, `Deleted meeting ${meetingId}`);
  },

  // Development Works
  getDevelopmentWorks(): DevelopmentWork[] {
    const raw = getStorageItem<DevelopmentWork[]>('development_works', INITIAL_DEVELOPMENT_WORKS);
    if (!Array.isArray(raw)) return [];
    return raw.map((w) => ({
      ...w,
      contractorName: w.contractorName || w.agencyContractor || 'Assigned Contractor',
      agencyContractor: w.agencyContractor || w.contractorName || 'Assigned Contractor',
      targetCompletionDate: w.targetCompletionDate || w.expectedCompletion || '',
      expectedCompletion: w.expectedCompletion || w.targetCompletionDate || '',
      financialYear: w.financialYear || '2024-25',
      schemeName: w.schemeName || 'Constituency Development Fund (MLACDS)',
      expenditureAmount:
        w.expenditureAmount ??
        Math.round((w.approvedAmount || 0) * ((w.progress || 0) / 100)),
      documents: Array.isArray(w.documents) ? w.documents : [],
      photos: Array.isArray(w.photos) ? w.photos : [],
    }));
  },
  saveDevelopmentWork(work: DevelopmentWork, user?: User): void {
    const activeUser = user || ({ name: 'Admin', role: 'ADMIN' } as User);
    const list = this.getDevelopmentWorks();
    const idx = list.findIndex((w) => w.id === work.id);
    if (idx >= 0) {
      const old = list[idx];
      list[idx] = work;
      logAudit(activeUser.name, activeUser.role, 'UPDATE_WORK', 'DevelopmentWork', work.id, `Updated development work: ${work.workName}`);
      if (old.status !== 'Delayed' && work.status === 'Delayed') {
        this.addNotification({
          id: `notif-${Date.now()}`,
          type: 'Development Work Delayed',
          title: 'Development Work Delayed',
          message: `${work.workName} is marked delayed (${work.progress}% progress)`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          read: false,
          linkId: work.id,
          linkType: 'work',
        });
      }
    } else {
      list.unshift(work);
      logAudit(activeUser.name, activeUser.role, 'CREATE_WORK', 'DevelopmentWork', work.id, `Created development work: ${work.workName}`);
    }
    setStorageItem('development_works', list);
  },
  deleteDevelopmentWork(workId: string, user?: User): void {
    const activeUser = user || ({ name: 'Admin', role: 'ADMIN' } as User);
    const list = this.getDevelopmentWorks().filter((w) => w.id !== workId);
    setStorageItem('development_works', list);
    logAudit(activeUser.name, activeUser.role, 'DELETE_WORK', 'DevelopmentWork', workId, `Deleted development work ${workId}`);
  },

  // Notifications
  getNotifications(): AppNotification[] {
    const raw = getStorageItem<AppNotification[]>('notifications', INITIAL_NOTIFICATIONS);
    return Array.isArray(raw) ? raw : [];
  },
  addNotification(notif: AppNotification): void {
    const list = this.getNotifications();
    setStorageItem('notifications', [notif, ...list]);
  },
  markNotificationAsRead(id: string): void {
    const list = this.getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
    setStorageItem('notifications', list);
  },
  markAllNotificationsAsRead(): void {
    const list = this.getNotifications().map((n) => ({ ...n, read: true }));
    setStorageItem('notifications', list);
  },
  clearNotifications(): void {
    setStorageItem('notifications', []);
  },

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    const raw = getStorageItem<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
    return Array.isArray(raw) ? raw : [];
  },

  // Village Video Conferences
  getVideoConferences(): VillageVideoConference[] {
    const raw = getStorageItem<VillageVideoConference[]>('video_conferences', INITIAL_VIDEO_CONFERENCES);
    if (!Array.isArray(raw)) return [];
    return raw.map((vc) => ({
      ...vc,
      chatMessages: Array.isArray(vc.chatMessages) ? vc.chatMessages : [],
      keyIssuesDiscussed: Array.isArray(vc.keyIssuesDiscussed) ? vc.keyIssuesDiscussed : [],
      decisionsMade: Array.isArray(vc.decisionsMade) ? vc.decisionsMade : [],
      actionItems: Array.isArray(vc.actionItems) ? vc.actionItems : [],
    }));
  },
  getVideoConferenceById(id: string): VillageVideoConference | undefined {
    return this.getVideoConferences().find((vc) => vc.id === id);
  },
  saveVideoConference(conference: VillageVideoConference, user?: User): void {
    const activeUser = user || ({ name: 'Admin', role: 'ADMIN' } as User);
    const list = this.getVideoConferences();
    const idx = list.findIndex((c) => c.id === conference.id);
    if (idx >= 0) {
      list[idx] = conference;
      logAudit(activeUser.name, activeUser.role, 'UPDATE_VIDEO_CONFERENCE', 'VideoConference', conference.id, `Updated village video conference: ${conference.title} for ${conference.village}`);
    } else {
      list.unshift(conference);
      logAudit(activeUser.name, activeUser.role, 'FIX_VIDEO_CONFERENCE', 'VideoConference', conference.id, `Village Head ${conference.fixedByVillageHead} fixed video conference: ${conference.title} for ${conference.village}`);
      this.addNotification({
        id: `notif-${Date.now()}`,
        type: 'Meeting Reminder',
        title: `Village Video Conference Fixed: ${conference.village}`,
        message: `${conference.fixedByVillageHead} fixed a video conference on ${conference.date} at ${conference.time}. Agenda: ${conference.agenda}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        read: false,
        linkId: conference.id,
        linkType: 'meeting',
      });
    }
    setStorageItem('video_conferences', list);
  },
  addVideoConferenceMessage(confId: string, message: VideoConferenceChatMessage): void {
    const list = this.getVideoConferences();
    const conf = list.find((c) => c.id === confId);
    if (conf) {
      if (!conf.chatMessages) conf.chatMessages = [];
      conf.chatMessages.push(message);
      setStorageItem('video_conferences', list);
    }
  },
  deleteVideoConference(confId: string, user?: User): void {
    const activeUser = user || ({ name: 'Admin', role: 'ADMIN' } as User);
    const list = this.getVideoConferences().filter((c) => c.id !== confId);
    setStorageItem('video_conferences', list);
    logAudit(activeUser.name, activeUser.role, 'DELETE_VIDEO_CONFERENCE', 'VideoConference', confId, `Deleted video conference ${confId}`);
  },
};
