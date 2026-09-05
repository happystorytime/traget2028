import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  Calendar,
  Compass,
  ArrowUpRight,
  Filter,
  RotateCcw,
  Building2,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Issue, FieldVisit, PublicMeeting, DevelopmentWork, Village, GramPanchayat, Department, ActiveTab } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/Badge';

interface DashboardViewProps {
  issues?: Issue[];
  villages?: Village[];
  gramPanchayats?: GramPanchayat[];
  departments?: Department[];
  fieldVisits?: FieldVisit[];
  publicMeetings?: PublicMeeting[];
  developmentWorks?: DevelopmentWork[];
  onNavigate: (tab: ActiveTab, id?: string) => void;
  onOpenNewIssueModal?: () => void;
  onOpenNewIssue?: () => void;
  onSelectIssue?: (issue: Issue) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  issues = [],
  villages = [],
  gramPanchayats = [],
  departments = [],
  fieldVisits = [],
  publicMeetings = [],
  developmentWorks = [],
  onNavigate,
  onOpenNewIssueModal,
  onOpenNewIssue,
  onSelectIssue,
}) => {
  const handleOpenNewIssue = onOpenNewIssueModal || onOpenNewIssue || (() => {});
  // Filter States
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [selectedGP, setSelectedGP] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  const resetFilters = () => {
    setSelectedDateRange('all');
    setSelectedVillage('all');
    setSelectedGP('all');
    setSelectedDepartment('all');
    setSelectedStatus('all');
    setSelectedPriority('all');
  };

  const hasActiveFilters =
    selectedDateRange !== 'all' ||
    selectedVillage !== 'all' ||
    selectedGP !== 'all' ||
    selectedDepartment !== 'all' ||
    selectedStatus !== 'all' ||
    selectedPriority !== 'all';

  // Apply filters to issues
  const filteredIssues = useMemo(() => {
    const today = new Date();

    return issues.filter((i) => {
      // Date filter
      if (selectedDateRange !== 'all') {
        const issueDate = new Date(i.dateReported);
        if (selectedDateRange === '7d') {
          const diffDays = (today.getTime() - issueDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7) return false;
        } else if (selectedDateRange === '30d') {
          const diffDays = (today.getTime() - issueDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 30) return false;
        } else if (selectedDateRange === 'this_year') {
          if (issueDate.getFullYear() !== today.getFullYear()) return false;
        }
      }

      // Village
      if (selectedVillage !== 'all' && i.village !== selectedVillage) return false;

      // Gram Panchayat
      if (selectedGP !== 'all' && i.gramPanchayat !== selectedGP) return false;

      // Department
      if (selectedDepartment !== 'all' && i.department !== selectedDepartment) return false;

      // Status
      if (selectedStatus !== 'all' && i.status !== selectedStatus) return false;

      // Priority
      if (selectedPriority !== 'all' && i.priority !== selectedPriority) return false;

      return true;
    });
  }, [
    issues,
    selectedDateRange,
    selectedVillage,
    selectedGP,
    selectedDepartment,
    selectedStatus,
    selectedPriority,
  ]);

  // Metrics calculations
  const totalIssues = filteredIssues.length;
  const openIssues = filteredIssues.filter(
    (i) => !['Resolved', 'Closed', 'Rejected'].includes(i.status)
  ).length;
  const inProgressIssues = filteredIssues.filter((i) => i.status === 'In Progress').length;
  const resolvedIssues = filteredIssues.filter((i) => i.status === 'Resolved').length;

  // Overdue calculation: expectedResolutionDate is passed and status is not Resolved/Closed/Rejected
  const overdueIssues = filteredIssues.filter((i) => {
    if (['Resolved', 'Closed', 'Rejected'].includes(i.status)) return false;
    if (!i.expectedResolutionDate) return false;
    const exp = new Date(i.expectedResolutionDate);
    const now = new Date();
    // Compare YYYY-MM-DD
    return exp < new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }).length;

  const resolutionRate =
    totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;

  // Issues by Status
  const issuesByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    filteredIssues.forEach((i) => {
      map[i.status] = (map[i.status] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredIssues]);

  // Issues by Category
  const issuesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredIssues.forEach((i) => {
      map[i.category] = (map[i.category] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredIssues]);

  // Issues by Department
  const issuesByDepartment = useMemo(() => {
    const map: Record<string, number> = {};
    filteredIssues.forEach((i) => {
      map[i.department] = (map[i.department] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredIssues]);

  // Village-wise Issues
  const villageWiseIssues = useMemo(() => {
    const map: Record<string, { total: number; open: number; resolved: number }> = {};
    filteredIssues.forEach((i) => {
      if (!map[i.village]) {
        map[i.village] = { total: 0, open: 0, resolved: 0 };
      }
      map[i.village].total += 1;
      if (!['Resolved', 'Closed', 'Rejected'].includes(i.status)) {
        map[i.village].open += 1;
      }
      if (i.status === 'Resolved') {
        map[i.village].resolved += 1;
      }
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [filteredIssues]);

  // Monthly trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const months: { label: string; key: string; count: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short' });
      months.push({ label, key, count: 0 });
    }

    filteredIssues.forEach((issue) => {
      const issueKey = issue.dateReported.slice(0, 7);
      const m = months.find((entry) => entry.key === issueKey);
      if (m) m.count += 1;
    });

    const maxCount = Math.max(...months.map((m) => m.count), 1);
    return { months, maxCount };
  }, [filteredIssues]);

  // Upcoming items
  const upcomingMeetings = (publicMeetings || []).slice(0, 3);
  const upcomingFieldVisits = (fieldVisits || [])
    .filter((f) => f && (f.status === 'Scheduled' || f.status === 'Follow-up Required'))
    .slice(0, 3);
  const delayedDevelopmentWorks = (developmentWorks || []).filter(
    (w) => w && (w.status === 'Delayed' || w.status === 'In Progress')
  ).slice(0, 3);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Hero Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Constituency Overview &amp; All Activity
            </h1>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium border border-slate-200">
              AC-58 SINDHANUR
            </span>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold border border-indigo-200">
              Admin Oversight
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete administrative activity tracking, public grievances, department resolution logs, and infrastructure progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('reports')}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            Generate Report
          </button>
          <button
            onClick={handleOpenNewIssue}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            + Register New Grievance
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            Dashboard Filters
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Date Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Timeframe</label>
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="this_year">This Year</option>
            </select>
          </div>

          {/* Village Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Village</label>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 truncate"
            >
              <option value="all">All Villages ({villages?.length ?? 0})</option>
              {villages.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* GP Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Gram Panchayat</label>
            <select
              value={selectedGP}
              onChange={(e) => setSelectedGP(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 truncate"
            >
              <option value="all">All GPs ({gramPanchayats?.length ?? 0})</option>
              {gramPanchayats.map((gp) => (
                <option key={gp.id} value={gp.name}>
                  {gp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 truncate"
            >
              <option value="all">All Departments ({departments?.length ?? 0})</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="New">New</option>
              <option value="Verified">Verified</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting for Department">Waiting for Department</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Issues */}
        <div
          onClick={() => onNavigate('issues')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Issues</span>
            <AlertCircle className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalIssues}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Reported across AC-58</div>
        </div>

        {/* Open Issues */}
        <div
          onClick={() => onNavigate('issues')}
          className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs hover:border-blue-300 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <span className="text-xs font-semibold">Open Issues</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-blue-900">{openIssues}</div>
          <div className="text-[10px] text-blue-600/80 mt-0.5">Action pending</div>
        </div>

        {/* In Progress */}
        <div
          onClick={() => onNavigate('issues')}
          className="bg-white p-4 rounded-xl border border-amber-100 shadow-xs hover:border-amber-300 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-xs font-semibold">In Progress</span>
            <RotateCcw className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-900">{inProgressIssues}</div>
          <div className="text-[10px] text-amber-600/80 mt-0.5">Active field execution</div>
        </div>

        {/* Resolved */}
        <div
          onClick={() => onNavigate('issues')}
          className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs hover:border-emerald-300 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-xs font-semibold">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-900">{resolvedIssues}</div>
          <div className="text-[10px] text-emerald-600/80 mt-0.5">Verified completed</div>
        </div>

        {/* Overdue */}
        <div
          onClick={() => onNavigate('issues')}
          className="bg-white p-4 rounded-xl border border-red-100 shadow-xs hover:border-red-300 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-red-600 mb-1">
            <span className="text-xs font-semibold">Overdue</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-extrabold text-red-900">{overdueIssues}</div>
          <div className="text-[10px] text-red-600/80 mt-0.5">Past target resolution date</div>
        </div>

        {/* Resolution Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Resolution Rate</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{resolutionRate}%</div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${resolutionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Analytical Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Chart 1: Issues by Category */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Issues by Category
            </h2>
            <span className="text-[11px] text-slate-400">{issuesByCategory.length} categories</span>
          </div>

          {issuesByCategory.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No data available</div>
          ) : (
            <div className="space-y-2.5">
              {issuesByCategory.slice(0, 6).map(([category, count]) => {
                const percent = Math.round((count / totalIssues) * 100);
                return (
                  <div key={category}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700 truncate max-w-[180px]">
                        {category}
                      </span>
                      <span className="font-mono text-slate-500 text-[11px]">
                        {count} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart 2: Issues by Department */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Issues by Department
            </h2>
            <span className="text-[11px] text-slate-400">
              {issuesByDepartment.length} departments
            </span>
          </div>

          {issuesByDepartment.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No data available</div>
          ) : (
            <div className="space-y-2.5">
              {issuesByDepartment.slice(0, 6).map(([dept, count]) => {
                const percent = Math.round((count / totalIssues) * 100);
                return (
                  <div key={dept}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700 truncate max-w-[180px]">
                        {dept}
                      </span>
                      <span className="font-mono text-slate-500 text-[11px]">
                        {count} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart 3: Issues by Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Issues by Status
            </h2>
            <span className="text-[11px] text-slate-400">{issuesByStatus.length} states</span>
          </div>

          {issuesByStatus.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No data available</div>
          ) : (
            <div className="space-y-2">
              {issuesByStatus.map(([status, count]) => {
                const percent = Math.round((count / totalIssues) * 100);
                return (
                  <div
                    key={status}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <StatusBadge status={status} />
                    </div>
                    <div className="text-xs font-mono font-semibold text-slate-700">
                      {count} <span className="text-slate-400 font-normal">({percent}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart 4: Village-wise Issue Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Village-wise Grievances &amp; Resolution Status
            </h2>
            <button
              onClick={() => onNavigate('villages')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              View Village Directory <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {villageWiseIssues.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No data available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="pb-2">Village</th>
                    <th className="pb-2 text-center">Total Issues</th>
                    <th className="pb-2 text-center">Open</th>
                    <th className="pb-2 text-center">Resolved</th>
                    <th className="pb-2 text-right">Resolution %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {villageWiseIssues.slice(0, 6).map(([villageName, stats]) => {
                    const rate =
                      stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
                    return (
                      <tr key={villageName} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 font-medium text-slate-800">{villageName}</td>
                        <td className="py-2.5 text-center font-mono font-semibold text-slate-700">
                          {stats.total}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-mono text-[11px] font-semibold border border-amber-200">
                            {stats.open}
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[11px] font-semibold border border-emerald-200">
                            {stats.resolved}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-mono text-slate-700">
                          {rate}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Chart 5: Monthly Trend */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Monthly Issue Trend (6 Mos)
            </h2>
            <span className="text-[11px] text-slate-400">Activity volume</span>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-200">
            {monthlyTrend.months.map((m) => {
              const heightPercent =
                m.count > 0 ? Math.max(Math.round((m.count / monthlyTrend.maxCount) * 100), 12) : 4;
              return (
                <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] font-mono text-slate-600 font-semibold">{m.count}</span>
                  <div className="w-full bg-slate-100 rounded-t-sm h-full max-h-28 flex items-end">
                    <div
                      className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-t-sm transition-all duration-300"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 uppercase">{m.label}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 text-center">
            Reported grievances per calendar month
          </div>
        </div>
      </div>

      {/* Operational Highlights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Upcoming Field Visits */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Upcoming Field Visits
              </h2>
            </div>
            <button
              onClick={() => onNavigate('field-visits')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              All Visits ({fieldVisits?.length ?? 0})
            </button>
          </div>

          {(upcomingFieldVisits?.length ?? 0) === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">No visits scheduled</div>
          ) : (
            <div className="space-y-3">
              {upcomingFieldVisits.map((v) => (
                <div
                  key={v.id}
                  onClick={() => onNavigate('field-visits', v.id)}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-slate-800">{v.village}</span>
                    <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      {v.date} • {v.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-1.5">{v.purpose}</p>
                  <div className="text-[10px] text-slate-400">
                    Team: {(Array.isArray(v.team) ? v.team : Array.isArray(v.attendees) ? v.attendees : []).join(', ') || 'Assigned Officers'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Public Meetings */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Public Meetings &amp; Sabhas
              </h2>
            </div>
            <button
              onClick={() => onNavigate('meetings')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              All Meetings ({publicMeetings?.length ?? 0})
            </button>
          </div>

          {(upcomingMeetings?.length ?? 0) === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">No meetings scheduled</div>
          ) : (
            <div className="space-y-3">
              {upcomingMeetings.map((m) => {
                const followUps = Array.isArray(m.followUpActions) ? m.followUpActions : [];
                return (
                  <div
                    key={m.id}
                    onClick={() => onNavigate('meetings', m.id)}
                    className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-slate-800 truncate max-w-[180px]">
                        {m.title}
                      </span>
                      <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 shrink-0">
                        {m.date}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                      <span>{m.village} ({m.location})</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Follow-ups: {followUps.filter((a) => a?.completed).length}/
                      {followUps.length} completed
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Development Works */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-purple-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Major Development Works
              </h2>
            </div>
            <button
              onClick={() => onNavigate('development-works')}
              className="text-xs text-purple-600 hover:text-purple-800 font-medium"
            >
              All Works ({developmentWorks?.length ?? 0})
            </button>
          </div>

          {(delayedDevelopmentWorks?.length ?? 0) === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">No active works</div>
          ) : (
            <div className="space-y-3">
              {delayedDevelopmentWorks.map((w) => (
                <div
                  key={w.id}
                  onClick={() => onNavigate('development-works', w.id)}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-slate-800 truncate max-w-[180px]">
                      {w.workName}
                    </span>
                    <StatusBadge status={w.status} />
                  </div>
                  <div className="text-[11px] text-slate-500 mb-2">
                    {w.village} • ₹{(w.approvedAmount / 100000).toFixed(1)} Lakhs
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-600 mb-1">
                    <span>Progress: {w.progress}%</span>
                    <span>Target: {w.expectedCompletion}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        w.status === 'Delayed' ? 'bg-rose-500' : 'bg-purple-600'
                      }`}
                      style={{ width: `${w.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
