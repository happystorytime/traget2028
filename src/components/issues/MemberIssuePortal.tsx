import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Droplet,
  Zap,
  Truck,
  Trash2,
  HeartPulse,
  Sprout,
  GraduationCap,
  FileCheck2,
  ChevronRight,
  Eye,
  MapPin,
  Phone,
  Shield,
  Info,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Issue, Village, IssueCategory } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';

interface MemberIssuePortalProps {
  issues: Issue[];
  villages: Village[];
  onSelectIssue: (issue: Issue) => void;
  onOpenNewModal: (presetCategory?: IssueCategory) => void;
  selectedIssueId?: string;
}

interface CategoryQuickOption {
  category: IssueCategory;
  title: string;
  kannadaTitle: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

const QUICK_CATEGORIES: CategoryQuickOption[] = [
  {
    category: 'Drinking Water',
    title: 'Drinking Water',
    kannadaTitle: 'ಕುಡಿಯುವ ನೀರು',
    icon: Droplet,
    color: 'text-sky-700',
    bgColor: 'bg-sky-50 hover:bg-sky-100/80',
    borderColor: 'border-sky-200',
    description: 'Pipeline leakage, RO plant breakdown, borewell failure',
  },
  {
    category: 'Electricity',
    title: 'Electricity & Power',
    kannadaTitle: 'ವಿದ್ಯುತ್ ಸರಬರಾಜು',
    icon: Zap,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 hover:bg-amber-100/80',
    borderColor: 'border-amber-200',
    description: 'Transformer burnt, low voltage, dangling wires',
  },
  {
    category: 'Roads',
    title: 'Roads & Potholes',
    kannadaTitle: 'ರಸ್ತೆಗಳು ಮತ್ತು ಗುಂಡಿಗಳು',
    icon: Truck,
    color: 'text-orange-700',
    bgColor: 'bg-orange-50 hover:bg-orange-100/80',
    borderColor: 'border-orange-200',
    description: 'Damaged village roads, potholes, culvert repair',
  },
  {
    category: 'Sanitation',
    title: 'Sanitation & Drainage',
    kannadaTitle: 'ಚರಂಡಿ ಮತ್ತು ನೈರ್ಮಲ್ಯ',
    icon: Trash2,
    color: 'text-teal-700',
    bgColor: 'bg-teal-50 hover:bg-teal-100/80',
    borderColor: 'border-teal-200',
    description: 'Blocked drainages, overflow, stagnant water cleaning',
  },
  {
    category: 'Street Lights',
    title: 'Street Lights',
    kannadaTitle: 'ಬೀದಿ ದೀಪಗಳು',
    icon: Zap,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50 hover:bg-yellow-100/80',
    borderColor: 'border-yellow-200',
    description: 'Dark streets, non-working LED lights, broken poles',
  },
  {
    category: 'Agriculture',
    title: 'Agriculture & Irrigation',
    kannadaTitle: 'ಕೃಷಿ ಮತ್ತು ನೀರಾವರಿ',
    icon: Sprout,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100/80',
    borderColor: 'border-emerald-200',
    description: 'Canal water tail-end issues, seed/fertilizer distribution',
  },
  {
    category: 'Healthcare',
    title: 'Hospital & PHC',
    kannadaTitle: 'ಆರೋಗ್ಯ ಮತ್ತು ಚಿಕಿತ್ಸೆ',
    icon: HeartPulse,
    color: 'text-rose-700',
    bgColor: 'bg-rose-50 hover:bg-rose-100/80',
    borderColor: 'border-rose-200',
    description: 'Doctor unavailability, lack of emergency drugs, sub-centre',
  },
  {
    category: 'Education',
    title: 'Schools & Anganwadi',
    kannadaTitle: 'ಶಾಲೆಗಳು ಮತ್ತು ಅಂಗನವಾಡಿ',
    icon: GraduationCap,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100/80',
    borderColor: 'border-indigo-200',
    description: 'School building leaks, drinking water, desk repair',
  },
];

export const MemberIssuePortal: React.FC<MemberIssuePortalProps> = ({
  issues,
  villages,
  onSelectIssue,
  onOpenNewModal,
  selectedIssueId,
}) => {
  const { currentUser } = useAuth();
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter issues for this member: issues created by them, or matching their village/phone
  const myIssues = useMemo(() => {
    const memberVillage = currentUser.village || '';
    const memberName = currentUser.name.toLowerCase();
    const memberPhone = (currentUser.phone || '').replace(/[^0-9]/g, '');

    return issues.filter((issue) => {
      // Direct match on creator or reporter
      const matchesReporter =
        issue.reporterName.toLowerCase().includes(memberName) ||
        (issue.createdBy && issue.createdBy.toLowerCase().includes(memberName));

      // Match phone if available
      const issuePhone = (issue.contactNumber || '').replace(/[^0-9]/g, '');
      const matchesPhone = memberPhone && issuePhone && (issuePhone === memberPhone || issuePhone.endsWith(memberPhone));

      // Match village if member has a village assigned
      const matchesVillage = memberVillage && issue.village.toLowerCase() === memberVillage.toLowerCase();

      // In member mode: show all issues from their village or issues they created
      return matchesReporter || matchesPhone || matchesVillage;
    });
  }, [issues, currentUser]);

  // Apply tab filter & search
  const displayedIssues = useMemo(() => {
    return myIssues.filter((i) => {
      if (filterTab === 'pending') {
        if (i.status === 'Resolved' || i.status === 'Closed' || i.status === 'Rejected') {
          return false;
        }
      } else if (filterTab === 'resolved') {
        if (i.status !== 'Resolved' && i.status !== 'Closed') {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          i.id.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.village.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [myIssues, filterTab, searchQuery]);

  const totalCount = myIssues.length;
  const pendingCount = myIssues.filter(
    (i) => !['Resolved', 'Closed', 'Rejected'].includes(i.status)
  ).length;
  const resolvedCount = myIssues.filter(
    (i) => i.status === 'Resolved' || i.status === 'Closed'
  ).length;

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Role Scoping Notice */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs shadow-xs">
        <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="font-bold text-emerald-400">Village Member View</span>
          <span className="text-slate-300 mx-1.5">•</span>
          <span className="text-slate-300">
            You can raise issues and track grievances directly with the Sindhanur MLA Office. Full constituency activity feeds and administrative controls are reserved for Admins.
          </span>
        </div>
      </div>

      {/* Hero Welcome & Primary Action Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-indigo-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Public Grievance Redressal • Sindhanur AC-58</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Raise an Issue / ಹೊಸ ಸಮಸ್ಯೆ ದಾಖಲಿಸಿ
            </h1>
            <p className="text-sm text-indigo-100/90 max-w-2xl leading-relaxed">
              Report civic problems directly to the Constituency Office. Upload photos, track real-time departmental verification, and receive resolution updates.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-indigo-200">
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Village: <strong className="text-white">{currentUser.village || 'Sindhanur Constituency'}</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                <Phone className="w-3.5 h-3.5 text-amber-300" />
                Member Mobile: <strong className="text-white">+91 {currentUser.phone || '9845198765'}</strong>
              </span>
            </div>
          </div>

          {/* Big Primary CTA Button */}
          <div className="shrink-0 flex flex-col items-stretch sm:items-end gap-2">
            <button
              id="member-portal-raise-issue-btn"
              onClick={() => onOpenNewModal()}
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              <span>+ Raise a New Issue</span>
            </button>
            <span className="text-[11px] text-indigo-200 text-center sm:text-right">
              Direct submission to MLA Camp Office
            </span>
          </div>
        </div>
      </div>

      {/* Quick Category Triggers */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Quick Issue Categories / ತ್ವರಿತ ಸಮಸ್ಯೆ ವಿಭಾಗಗಳು
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click a category to immediately open the issue form with that category selected.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {QUICK_CATEGORIES.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.category}
                onClick={() => onOpenNewModal(opt.category)}
                className={`p-3.5 rounded-xl border ${opt.borderColor} ${opt.bgColor} text-left transition-all hover:shadow-xs group cursor-pointer flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg bg-white/80 shadow-2xs ${opt.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-slate-600 transition-colors">
                      + Raise
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 mb-0.5">
                    {opt.title}
                  </div>
                  <div className="text-[11px] font-medium text-slate-600">
                    {opt.kannadaTitle}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* My Raised Issues & Grievance Tracker */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header & Tabs */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                My Village Grievance Status / ಸಮಸ್ಯೆಗಳ ಪರಿಹಾರ ಸ್ಥಿತಿ
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                {totalCount} Total
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status tracking for grievances raised in your village ({currentUser.village || 'Sindhanur'}).
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setFilterTab('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterTab === 'pending'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In Progress ({pendingCount})
            </button>
            <button
              onClick={() => setFilterTab('resolved')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterTab === 'resolved'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>
        </div>

        {/* List of Issues */}
        <div className="p-5">
          {displayedIssues.length === 0 ? (
            <div className="text-center py-12 px-4 max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {filterTab === 'all'
                    ? 'No Grievances Logged Yet'
                    : filterTab === 'pending'
                    ? 'No Pending Grievances'
                    : 'No Resolved Grievances Yet'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Have an issue in your village? Click the button below to report drinking water, roads, electricity, or sanitation problems.
                </p>
              </div>
              <button
                onClick={() => onOpenNewModal()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Raise an Issue Now</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedIssues.map((issue) => {
                const isResolved = issue.status === 'Resolved' || issue.status === 'Closed';
                const isUnderReview = issue.status === 'New' || issue.status === 'Verified';

                return (
                  <div
                    key={issue.id}
                    onClick={() => onSelectIssue(issue)}
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs bg-white transition-all cursor-pointer group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {issue.id}
                        </span>
                        <StatusBadge status={issue.status} />
                        <PriorityBadge priority={issue.priority} />
                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {issue.category}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Reported: {issue.dateReported}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-800 font-medium mb-3 leading-relaxed">
                      {issue.description}
                    </p>

                    {/* Step Tracker Visual */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>Resolution Progress Pipeline</span>
                        {issue.expectedResolutionDate && (
                          <span className="text-indigo-600 font-semibold lowercase">
                            target: {issue.expectedResolutionDate}
                          </span>
                        )}
                      </div>

                      {/* 4-step progress dots */}
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                        {/* Step 1 */}
                        <div className="space-y-1">
                          <div className="h-1.5 rounded-full bg-emerald-500" />
                          <div className="font-semibold text-emerald-700">1. Logged</div>
                        </div>
                        {/* Step 2 */}
                        <div className="space-y-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              issue.status !== 'New' ? 'bg-emerald-500' : 'bg-slate-200'
                            }`}
                          />
                          <div
                            className={`font-semibold ${
                              issue.status !== 'New' ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          >
                            2. Review
                          </div>
                        </div>
                        {/* Step 3 */}
                        <div className="space-y-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              ['Assigned', 'In Progress', 'Resolved', 'Closed'].includes(issue.status)
                                ? 'bg-emerald-500'
                                : 'bg-slate-200'
                            }`}
                          />
                          <div
                            className={`font-semibold ${
                              ['Assigned', 'In Progress', 'Resolved', 'Closed'].includes(issue.status)
                                ? 'text-emerald-700'
                                : 'text-slate-400'
                            }`}
                          >
                            3. Assigned
                          </div>
                        </div>
                        {/* Step 4 */}
                        <div className="space-y-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              isResolved ? 'bg-emerald-500' : 'bg-slate-200'
                            }`}
                          />
                          <div
                            className={`font-semibold ${
                              isResolved ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          >
                            4. Resolved
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom row: Village, Department, Details link */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <strong className="text-slate-700">{issue.village}</strong> ({issue.gramPanchayat})
                        </span>
                        <span className="truncate max-w-[200px] text-[11px] text-slate-500">
                          Dept: {issue.department}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-indigo-600 font-semibold group-hover:text-indigo-800 transition-colors">
                        <span>View Grievance Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
