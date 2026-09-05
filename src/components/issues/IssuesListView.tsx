import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Printer,
  Plus,
  ArrowUpDown,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Table,
  LayoutGrid,
} from 'lucide-react';
import { Issue, Village, Department, IssueCategory, IssuePriority, IssueStatus } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';

interface IssuesListViewProps {
  issues: Issue[];
  villages: Village[];
  departments: Department[];
  onSelectIssue: (issue: Issue) => void;
  onOpenNewModal: () => void;
  selectedIssueId?: string;
}

export const IssuesListView: React.FC<IssuesListViewProps> = ({
  issues,
  villages,
  departments,
  onSelectIssue,
  onOpenNewModal,
  selectedIssueId,
}) => {
  const { currentUser } = useAuth();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterVillage, setFilterVillage] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');

  // Sorting
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'id' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const resetFilters = () => {
    setSearchQuery('');
    setFilterCategory('all');
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterVillage('all');
    setFilterDepartment('all');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    filterCategory !== 'all' ||
    filterStatus !== 'all' ||
    filterPriority !== 'all' ||
    filterVillage !== 'all' ||
    filterDepartment !== 'all';

  // Filter & Search
  const filteredIssues = useMemo(() => {
    return issues.filter((i) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          i.id.toLowerCase().includes(q) ||
          i.reporterName.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.village.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          (i.assignedStaff && i.assignedStaff.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Filters
      if (filterCategory !== 'all' && i.category !== filterCategory) return false;
      if (filterStatus !== 'all' && i.status !== filterStatus) return false;
      if (filterPriority !== 'all' && i.priority !== filterPriority) return false;
      if (filterVillage !== 'all' && i.village !== filterVillage) return false;
      if (filterDepartment !== 'all' && i.department !== filterDepartment) return false;

      return true;
    });
  }, [
    issues,
    searchQuery,
    filterCategory,
    filterStatus,
    filterPriority,
    filterVillage,
    filterDepartment,
  ]);

  // Sorting
  const sortedIssues = useMemo(() => {
    return [...filteredIssues].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.dateReported).getTime();
        const dateB = new Date(b.dateReported).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      if (sortBy === 'priority') {
        const pOrder: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        const valA = pOrder[a.priority] || 0;
        const valB = pOrder[b.priority] || 0;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      if (sortBy === 'status') {
        return sortOrder === 'asc'
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      }
      return sortOrder === 'asc' ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
    });
  }, [filteredIssues, sortBy, sortOrder]);

  // Pagination slice
  const totalPages = Math.ceil(sortedIssues.length / pageSize) || 1;
  const paginatedIssues = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedIssues.slice(start, start + pageSize);
  }, [sortedIssues, currentPage, pageSize]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Issue ID',
      'Date Reported',
      'Village',
      'Gram Panchayat',
      'Category',
      'Priority',
      'Status',
      'Department',
      'Reporter Name',
      'Contact Number',
      'Assigned Staff',
      'Expected Resolution',
      'Resolved Date',
      'Description',
    ];

    const rows = sortedIssues.map((i) => [
      `"${i.id}"`,
      `"${i.dateReported}"`,
      `"${i.village}"`,
      `"${i.gramPanchayat}"`,
      `"${i.category}"`,
      `"${i.priority}"`,
      `"${i.status}"`,
      `"${i.department}"`,
      `"${i.reporterName}"`,
      `"${i.contactNumber}"`,
      `"${i.assignedStaff || ''}"`,
      `"${i.expectedResolutionDate || ''}"`,
      `"${i.resolvedDate || ''}"`,
      `"${i.description.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sindhanur_AC58_Issues_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Issue Management</h1>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
              {filteredIssues.length} of {issues.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Public grievance lifecycle tracking, departmental assignments &amp; resolution timelines.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md ${
                viewMode === 'table' ? 'bg-white shadow-xs text-slate-800' : 'text-slate-500'
              }`}
              title="Table View"
            >
              <Table className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md ${
                viewMode === 'cards' ? 'bg-white shadow-xs text-slate-800' : 'text-slate-500'
              }`}
              title="Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button
            onClick={onOpenNewModal}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Grievance
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by ID, citizen name, phone, village, keyword..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Quick Clear */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-2.5 py-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 self-center"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        {/* Filters Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Village</label>
            <select
              value={filterVillage}
              onChange={(e) => {
                setFilterVillage(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-800 truncate"
            >
              <option value="all">All Villages</option>
              {villages.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-800 truncate"
            >
              <option value="all">All Categories</option>
              {[
                'Roads',
                'Drinking Water',
                'Drainage',
                'Electricity',
                'Street Lights',
                'Sanitation',
                'Waste Management',
                'Agriculture',
                'Irrigation',
                'Education',
                'Healthcare',
                'Transport',
                'Housing',
                'Government Services',
                'Other',
              ].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-800 truncate"
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

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => {
                setFilterPriority(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-800"
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Sort By</label>
            <div className="flex gap-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-800"
              >
                <option value="date">Date</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
                <option value="id">ID</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-600"
                title={`Sort order: ${sortOrder}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {sortedIssues.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          <p>No issues found matching the selected search or filter criteria.</p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-3 text-xs text-indigo-600 font-semibold underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Issue ID</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Village / GP</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Reporter</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Assigned Staff</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedIssues.map((i) => {
                  const isOverdue =
                    i.expectedResolutionDate &&
                    !['Resolved', 'Closed', 'Rejected'].includes(i.status) &&
                    new Date(i.expectedResolutionDate) < new Date();

                  return (
                    <tr
                      key={i.id}
                      onClick={() => onSelectIssue(i)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        selectedIssueId === i.id ? 'bg-indigo-50/50' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{i.id}</span>
                          {isOverdue && (
                            <span title="Overdue" className="text-red-500">
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {i.dateReported}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800 whitespace-nowrap">
                          {i.village}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          GP: {i.gramPanchayat}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">
                        {i.category}
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-800 font-medium whitespace-nowrap">
                          {i.reporterName}
                        </div>
                        <div className="text-[10px] text-slate-400">{i.contactNumber}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <PriorityBadge priority={i.priority} />
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <StatusBadge status={i.status} />
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-[11px] whitespace-nowrap">
                        {i.assignedStaff || (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectIssue(i);
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded border border-indigo-200 transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded p-1 text-slate-700"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, sortedIssues.length)} of {sortedIssues.length}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {paginatedIssues.map((i) => (
            <div
              key={i.id}
              onClick={() => onSelectIssue(i)}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                    {i.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <PriorityBadge priority={i.priority} />
                    <StatusBadge status={i.status} />
                  </div>
                </div>

                <h3 className="font-bold text-sm text-slate-800 mb-1">{i.category}</h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                  {i.description}
                </p>

                <div className="space-y-1 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{i.village} (GP: {i.gramPanchayat})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Reported: {i.dateReported}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[10px]">
                  Assigned: {i.assignedStaff || 'Unassigned'}
                </span>
                <span className="text-indigo-600 font-semibold text-xs flex items-center gap-1">
                  Details &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
