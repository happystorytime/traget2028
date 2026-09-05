export type UserRole = 'ADMIN' | 'STAFF' | 'FIELD EXECUTIVE' | 'VILLAGE MEMBER' | 'VILLAGE HEAD';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  department?: string;
  designation: string;
  active: boolean;
  avatar?: string;
  village?: string;
}

export interface VillageHead {
  name: string;
  phone: string;
  designation: string; // e.g. "Grama Pradhan / Village Head"
  termStartDate?: string;
  email?: string;
  avatar?: string;
}

export interface VillageMember {
  id: string;
  slNo?: number;
  nameAsPerAadhaar: string;
  voterId: string; // EPIC Voter ID Number
  aadhaarNumber?: string; // e.g. XXXX-XXXX-1234
  photo?: string; // Base64 data URL from device upload
  village: string; // Linked to 124 villages
  gramPanchayat: string; // Auto-linked GP
  mobileNumber: string; // 10-digit mobile for OTP login
  role: string; // e.g. Village Representative, Booth President, Cadre Worker, Citizen Member
  designation?: string;
  boothNumber?: string | number;
  status: 'Verified' | 'Active' | 'Pending Verification';
  joinedDate: string;
  address?: string;
  notes?: string;
}

export interface Village {
  id: string;
  slNo?: number;
  name: string;
  gramPanchayat: string;
  taluk: string;
  constituency: string;
  district: string;
  coordinates: { lat: number; lng: number };
  pinCode?: string;
  villageHead?: VillageHead;
  villageHeadName?: string;
  villageHeadPhone?: string;
  villageHeadDesignation?: string;
  pollingBoothsCount?: number;
  membersCount?: number;
  openIssuesCount?: number;
  resolvedIssuesCount?: number;
  developmentWorksCount?: number;
  meetingsCount?: number;
  fieldVisitsCount?: number;
  videoConferencesCount?: number;
}

export interface GramPanchayat {
  id: string;
  name: string;
  taluk: string;
  officeLocation: string;
  secretaryName: string;
  contactNumber: string;
  villages: string[];
}

export interface PollingBooth {
  id: string;
  boothNumber: number;
  boothName: string;
  village: string;
  gramPanchayat: string;
  buildingName: string;
  votersCount?: number;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headOfficer: string;
  contactEmail: string;
  contactPhone: string;
  nodalOfficer?: string;
  contactNumber?: string;
}

export interface ConstituencySettings {
  constituencyName: string;
  constituencyNumber: string;
  district: string;
  state: string;
  mlaName: string;
  officeContact: string;
  officeEmail: string;
  officeAddress: string;
  helpdeskPhone: string;
}

export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type IssueStatus =
  | 'New'
  | 'Verified'
  | 'Assigned'
  | 'In Progress'
  | 'Waiting for Department'
  | 'Resolved'
  | 'Closed'
  | 'Rejected';

export type IssueCategory =
  | 'Roads'
  | 'Drinking Water'
  | 'Drainage'
  | 'Electricity'
  | 'Street Lights'
  | 'Sanitation'
  | 'Waste Management'
  | 'Agriculture'
  | 'Irrigation'
  | 'Education'
  | 'Healthcare'
  | 'Transport'
  | 'Housing'
  | 'Government Services'
  | 'Other';

export interface IssueTimelineEntry {
  id: string;
  timestamp: string;
  author: string;
  title: string;
  description: string;
  type: 'creation' | 'status_change' | 'assignment' | 'comment' | 'attachment' | 'resolution';
}

export interface IssueComment {
  id: string;
  author: string;
  authorRole: UserRole;
  text: string;
  timestamp: string;
}

export interface IssueStatusHistory {
  from: IssueStatus;
  to: IssueStatus;
  changedBy: string;
  timestamp: string;
  note?: string;
}

export interface IssueAssignmentHistory {
  fromStaff: string;
  toStaff: string;
  assignedBy: string;
  timestamp: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Issue {
  id: string; // e.g. CC-2025-0101
  dateReported: string;
  village: string;
  gramPanchayat: string;
  reporterName: string;
  contactNumber: string;
  category: IssueCategory;
  description: string;
  priority: IssuePriority;
  department: string;
  assignedStaff: string;
  status: IssueStatus;
  expectedResolutionDate?: string;
  resolvedDate?: string;
  resolutionDetails?: string;
  photos: string[];
  documents: Attachment[];
  createdBy: string;
  lastUpdated: string;
  timeline: IssueTimelineEntry[];
  comments: IssueComment[];
  statusHistory: IssueStatusHistory[];
  assignmentHistory: IssueAssignmentHistory[];
}

export type FieldVisitStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Follow-up Required';

export interface FieldVisit {
  id: string; // FV-2025-001
  village: string;
  date: string;
  time: string;
  team: string[];
  purpose: string;
  issuesFound: string[]; // Issue IDs or brief summaries
  photos: string[];
  notes: string;
  followUpDate?: string;
  status: FieldVisitStatus;
  conductedBy?: string;
  attendees?: string[];
  keyObservations?: string;
  actionItems?: string[];
  followUpRequired?: boolean;
  issuesInspected?: string[];
}

export interface MeetingFollowUpAction {
  id: string;
  action: string;
  assignedTo: string;
  dueDate: string;
  completed: boolean;
}

export interface PublicMeeting {
  id: string; // PM-2025-001
  title: string;
  date: string;
  time: string;
  location: string;
  village: string;
  agenda: string;
  participants: number | string;
  issuesDiscussed: string[];
  decisions: string;
  followUpActions: MeetingFollowUpAction[];
  photos: string[];
  documents: Attachment[];
  purpose?: string;
  attendeesCount?: number;
  keyIssuesDiscussed?: string[];
  decisionsMade?: string[];
  status?: string;
  fixedByVillageHead?: string; // Village Head name who fixed the meeting
  villageHeadContact?: string;
  meetingType?: 'Gram Sabha' | 'Video Conference' | 'Grievance Redressal' | 'Department Review' | 'Ward Meeting';
  videoRoomCode?: string;
}

export type VideoConferenceStatus = 'Scheduled' | 'Live' | 'Completed' | 'Cancelled';

export interface VideoConferenceChatMessage {
  id: string;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: string;
  isVillageHead?: boolean;
}

export interface VillageVideoConference {
  id: string; // VC-2025-001
  title: string;
  village: string;
  gramPanchayat?: string;
  fixedByVillageHead: string; // Name of the village head who fixed/scheduled the call
  villageHeadPhone?: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "11:00 AM"
  durationMinutes: number;
  status: VideoConferenceStatus;
  agenda: string;
  roomCode: string; // e.g. "SIN-ALB-821"
  meetingLink: string;
  departmentInvited?: string;
  mlaOfficeAttending?: boolean;
  expectedParticipants?: number;
  actualAttendeesCount?: number;
  keyIssuesDiscussed?: string[];
  decisionsMade?: string[];
  meetingNotes?: string;
  actionItems?: string[];
  chatMessages?: VideoConferenceChatMessage[];
  createdAt: string;
}

export type DevelopmentWorkStatus =
  | 'Proposed'
  | 'Approved'
  | 'Tender'
  | 'Started'
  | 'In Progress'
  | 'Completed'
  | 'Delayed'
  | 'Cancelled';

export interface DevelopmentWork {
  id: string; // DW-2025-001
  workName: string;
  village: string;
  gramPanchayat: string;
  department: string;
  estimatedCost: number; // in INR
  approvedAmount: number; // in INR
  agencyContractor: string;
  startDate: string;
  expectedCompletion: string;
  actualCompletion?: string;
  progress: number; // 0 to 100
  status: DevelopmentWorkStatus;
  documents: Attachment[];
  photos: string[];
  remarks?: string;
  financialYear?: string;
  schemeName?: string;
  expenditureAmount?: number;
  contractorName?: string;
  targetCompletionDate?: string;
  description?: string;
}

export type NotificationType =
  | 'New Issue'
  | 'Issue Assigned'
  | 'Issue Updated'
  | 'Issue Overdue'
  | 'Issue Resolved'
  | 'Meeting Reminder'
  | 'Field Visit Reminder'
  | 'Development Work Delayed';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  linkId?: string;
  linkType?: 'issue' | 'meeting' | 'visit' | 'work';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'issues'
  | 'villages'
  | 'members'
  | 'map'
  | 'field-visits'
  | 'meetings'
  | 'video-conferences'
  | 'development-works'
  | 'users'
  | 'reports'
  | 'settings';
