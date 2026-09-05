import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  IndianRupee,
  Building,
  Calendar,
  Clock,
  TrendingUp,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { DevelopmentWork, Village, GramPanchayat, Department } from '../../types';
import { StorageService } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/Badge';

interface DevelopmentWorksViewProps {
  developmentWorks?: DevelopmentWork[];
  villages?: Village[];
  gramPanchayats?: GramPanchayat[];
  departments?: Department[];
  selectedWorkId?: string;
}

export const DevelopmentWorksView: React.FC<DevelopmentWorksViewProps> = ({
  developmentWorks = [],
  villages = [],
  gramPanchayats = [],
  departments = [],
  selectedWorkId,
}) => {
  const { currentUser, canEditSettings } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterScheme, setFilterScheme] = useState('all');
  const [filterVillage, setFilterVillage] = useState('all');

  // Selected work for detail
  const [selectedWork, setSelectedWork] = useState<DevelopmentWork | null>(() => {
    if (selectedWorkId) {
      return developmentWorks.find((w) => w.id === selectedWorkId) || null;
    }
    return null;
  });

  // Modal form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<DevelopmentWork | null>(null);

  // Form fields
  const [id, setId] = useState('');
  const [workName, setWorkName] = useState('');
  const [village, setVillage] = useState(villages[0]?.name || 'Gorebal');
  const [gramPanchayat, setGramPanchayat] = useState('Gorebal GP');
  const [department, setDepartment] = useState('Public Works Department (PWD)');
  const [financialYear, setFinancialYear] = useState('2024-25');
  const [schemeName, setSchemeName] = useState('MLA-LADS (Sindhanur AC-58)');
  const [approvedAmount, setApprovedAmount] = useState('2500000');
  const [expenditureAmount, setExpenditureAmount] = useState('1500000');
  const [contractorName, setContractorName] = useState('');
  const [status, setStatus] = useState<any>('Work in Progress');
  const [progress, setProgress] = useState('60');
  const [startDate, setStartDate] = useState('2024-11-01');
  const [targetCompletionDate, setTargetCompletionDate] = useState('2025-05-30');
  const [description, setDescription] = useState('');

  const handleOpenCreate = () => {
    setEditingWork(null);
    setId(`DW-2025-${Math.floor(100 + Math.random() * 900)}`);
    setWorkName('');
    const defVil = villages[0]?.name || 'Gorebal';
    setVillage(defVil);
    const m = villages.find((v) => v.name === defVil);
    setGramPanchayat(m?.gramPanchayat || 'Gorebal GP');
    setDepartment('Public Works Department (PWD)');
    setFinancialYear('2024-25');
    setSchemeName('MLA-LADS (Sindhanur AC-58)');
    setApprovedAmount('2000000');
    setExpenditureAmount('0');
    setContractorName('');
    setStatus('Work in Progress');
    setProgress('30');
    setStartDate(new Date().toISOString().slice(0, 10));
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    setTargetCompletionDate(d.toISOString().slice(0, 10));
    setDescription('');
    setFormOpen(true);
  };

  const handleOpenEdit = (w: DevelopmentWork, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingWork(w);
    setId(w.id);
    setWorkName(w.workName);
    setVillage(w.village);
    setGramPanchayat(w.gramPanchayat);
    setDepartment(w.department);
    setFinancialYear(w.financialYear || '2024-25');
    setSchemeName(w.schemeName || 'MLA-LADS');
    setApprovedAmount(w.approvedAmount.toString());
    setExpenditureAmount((w.expenditureAmount ?? Math.round(w.approvedAmount * 0.6)).toString());
    setContractorName(w.contractorName || w.agencyContractor || '');
    setStatus(w.status);
    setProgress(w.progress.toString());
    setStartDate(w.startDate || '');
    setTargetCompletionDate(w.targetCompletionDate || w.expectedCompletion || '');
    setDescription(w.description || w.remarks || '');
    setFormOpen(true);
  };

  const handleDelete = (workId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete development work ${workId}?`)) {
      StorageService.deleteDevelopmentWork(workId);
      if (selectedWork?.id === workId) setSelectedWork(null);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workName.trim() || !village) return;

    const approved = parseFloat(approvedAmount) || 0;
    const spent = parseFloat(expenditureAmount) || 0;

    const newWork: DevelopmentWork = {
      id,
      workName: workName.trim(),
      village,
      gramPanchayat,
      department,
      estimatedCost: approved,
      approvedAmount: approved,
      agencyContractor: contractorName.trim() || 'State PWD Contractor',
      startDate: startDate || new Date().toISOString().slice(0, 10),
      expectedCompletion: targetCompletionDate || '2025-06-30',
      progress: parseInt(progress, 10) || 0,
      status,
      documents: editingWork ? editingWork.documents : [],
      photos: editingWork ? editingWork.photos : [],
      remarks: description.trim() || undefined,
      financialYear,
      schemeName,
      expenditureAmount: spent,
      contractorName: contractorName.trim() || undefined,
      targetCompletionDate: targetCompletionDate || undefined,
      description: description.trim() || undefined,
    };

    StorageService.saveDevelopmentWork(newWork);
    setFormOpen(false);
    if (selectedWork?.id === id) setSelectedWork(newWork);
  };

  // Financial summary
  const totalSanctioned = useMemo(() => {
    return developmentWorks.reduce((acc, w) => acc + (w.approvedAmount || 0), 0);
  }, [developmentWorks]);

  const totalSpent = useMemo(() => {
    return developmentWorks.reduce((acc, w) => acc + (w.expenditureAmount || 0), 0);
  }, [developmentWorks]);

  // Unique schemes
  const schemes = useMemo(() => {
    return Array.from(
      new Set(
        developmentWorks
          .map((w) => w.schemeName)
          .filter((name): name is string => Boolean(name && name.trim()))
      )
    );
  }, [developmentWorks]);

  const filteredWorks = useMemo(() => {
    return developmentWorks.filter((w) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          w.workName.toLowerCase().includes(q) ||
          w.village.toLowerCase().includes(q) ||
          w.id.toLowerCase().includes(q) ||
          (w.contractorName && w.contractorName.toLowerCase().includes(q)) ||
          w.department.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterStatus !== 'all' && w.status !== filterStatus) return false;
      if (filterScheme !== 'all' && w.schemeName !== filterScheme) return false;
      if (filterVillage !== 'all' && w.village !== filterVillage) return false;
      return true;
    });
  }, [developmentWorks, searchQuery, filterStatus, filterScheme, filterVillage]);

  return (
    <div className="space-y-4 pb-12">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Development Works &amp; Schemes
            </h1>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
              {filteredWorks.length} Projects
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Public infrastructure sanctions, expenditure tracking &amp; contractor milestones for Sindhanur AC-58.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEditSettings && (
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Sanction Work
            </button>
          )}
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Sanctioned Capital
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            ₹{(totalSanctioned / 10000000).toFixed(2)} Cr
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Across {developmentWorks.length} infrastructure projects
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Disbursed Expenditure
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
            ₹{(totalSpent / 10000000).toFixed(2)} Cr
          </div>
          <div className="text-xs text-emerald-600 mt-0.5 font-medium">
            {(totalSanctioned > 0 ? (totalSpent / totalSanctioned) * 100 : 0).toFixed(1)}% Financial Utilization
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Active Projects In Progress
          </div>
          <div className="text-xl font-bold font-mono text-purple-700 mt-1">
            {
              developmentWorks.filter(
                (w) => w.status === 'Work in Progress' || w.status === 'In Progress'
              ).length
            } Works
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {developmentWorks.filter((w) => w.status === 'Completed').length} Completed
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search work name, ID, contractor, village..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800"
          >
            <option value="all">All Statuses</option>
            <option value="Proposed">Proposed</option>
            <option value="Sanctioned">Sanctioned</option>
            <option value="Tendering">Tendering</option>
            <option value="Work in Progress">Work in Progress</option>
            <option value="Completed">Completed</option>
            <option value="Delayed">Delayed</option>
          </select>

          <select
            value={filterScheme}
            onChange={(e) => setFilterScheme(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 max-w-[170px] truncate"
          >
            <option value="all">All Schemes</option>
            {schemes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={filterVillage}
            onChange={(e) => setFilterVillage(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 max-w-[150px] truncate"
          >
            <option value="all">All Villages</option>
            {villages.map((v) => (
              <option key={v.id} value={v.name}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Development Works Grid */}
      {filteredWorks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          No development works match criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredWorks.map((w) => {
            const utilizationPct = w.approvedAmount > 0
              ? Math.min(Math.round((w.expenditureAmount / w.approvedAmount) * 100), 100)
              : 0;

            return (
              <div
                key={w.id}
                onClick={() => setSelectedWork(w)}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                      {w.id}
                    </span>
                    <StatusBadge status={w.status} />
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">
                    {w.workName}
                  </h3>
                  <div className="text-xs text-slate-500 mb-3">{w.schemeName} ({w.financialYear})</div>

                  {/* Financials & Progress */}
                  <div className="space-y-2 border-t border-slate-100 pt-2.5 text-xs">
                    <div className="flex justify-between items-center text-slate-700">
                      <span>Sanction Amount:</span>
                      <span className="font-mono font-bold">
                        ₹{(w.approvedAmount / 100000).toFixed(1)} Lakhs
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-500 text-[11px]">
                      <span>Spent to date:</span>
                      <span className="font-mono text-emerald-700 font-semibold">
                        ₹{(w.expenditureAmount / 100000).toFixed(1)} Lakhs ({utilizationPct}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Physical Progress</span>
                        <span className="font-bold text-slate-700">{w.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${w.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 pt-1 space-y-0.5">
                      <div>Village: <strong>{w.village}</strong> (GP: {w.gramPanchayat})</div>
                      <div>Dept: {w.department}</div>
                      {w.contractorName && <div>Contractor: {w.contractorName}</div>}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-indigo-600 font-semibold">Inspect Details &rarr;</span>

                  {canEditSettings && (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleOpenEdit(w, e)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                        title="Edit work"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(w.id, e)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                        title="Delete work"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Work Detail Modal */}
      {selectedWork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                    {selectedWork.id}
                  </span>
                  <StatusBadge status={selectedWork.status} />
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  {selectedWork.workName}
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  {selectedWork.village} • {selectedWork.schemeName} ({selectedWork.financialYear})
                </div>
              </div>
              <button
                onClick={() => setSelectedWork(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Financial Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Sanction Amount</span>
                  <div className="text-base font-mono font-bold text-slate-900 mt-0.5">
                    ₹{(selectedWork.approvedAmount / 100000).toFixed(2)} Lakhs
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Total Expenditure</span>
                  <div className="text-base font-mono font-bold text-emerald-700 mt-0.5">
                    ₹{(selectedWork.expenditureAmount / 100000).toFixed(2)} Lakhs
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Physical Progress</span>
                  <div className="text-base font-mono font-bold text-indigo-700 mt-0.5">
                    {selectedWork.progress}%
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedWork.description && (
                <div>
                  <h4 className="font-bold text-slate-700 uppercase text-[10px] mb-1">
                    Project Scope &amp; Deliverables
                  </h4>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {selectedWork.description}
                  </p>
                </div>
              )}

              {/* Administrative Details */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-700 uppercase text-[10px]">
                  Administrative &amp; Execution Specifications
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <strong>Department:</strong> {selectedWork.department}
                  </div>
                  <div>
                    <strong>Gram Panchayat:</strong> {selectedWork.gramPanchayat}
                  </div>
                  <div>
                    <strong>Contractor / Agency:</strong> {selectedWork.contractorName || 'Under Tendering'}
                  </div>
                  <div>
                    <strong>Target Completion:</strong> {selectedWork.targetCompletionDate || 'Not specified'}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedWork(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-5 my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-sm text-slate-800">
                {editingWork ? 'Edit Development Work' : 'Add New Sanctioned Work'}
              </h3>
              <button
                onClick={() => setFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Work ID *</label>
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-mono font-bold text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Financial Year</label>
                  <select
                    value={financialYear}
                    onChange={(e) => setFinancialYear(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  >
                    <option value="2025-26">2025-26</option>
                    <option value="2024-25">2024-25</option>
                    <option value="2023-24">2023-24</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work Name *</label>
                <input
                  type="text"
                  value={workName}
                  onChange={(e) => setWorkName(e.target.value)}
                  placeholder="E.g. Construction of CC Road in Gorebal"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Village *</label>
                  <select
                    value={village}
                    onChange={(e) => {
                      setVillage(e.target.value);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                    required
                  >
                    {villages.map((v) => (
                      <option key={v.id} value={v.name}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gram Panchayat</label>
                  <input
                    type="text"
                    value={gramPanchayat}
                    onChange={(e) => setGramPanchayat(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Scheme Name *</label>
                  <input
                    type="text"
                    value={schemeName}
                    onChange={(e) => setSchemeName(e.target.value)}
                    placeholder="MLA-LADS, JJM, PMGSY..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 truncate"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Approved Sanction (₹) *
                  </label>
                  <input
                    type="number"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Expenditure Spent (₹)
                  </label>
                  <input
                    type="number"
                    value={expenditureAmount}
                    onChange={(e) => setExpenditureAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  >
                    <option value="Proposed">Proposed</option>
                    <option value="Sanctioned">Sanctioned</option>
                    <option value="Tendering">Tendering</option>
                    <option value="Work in Progress">Work in Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contractor Name</label>
                  <input
                    type="text"
                    value={contractorName}
                    onChange={(e) => setContractorName(e.target.value)}
                    placeholder="Agency name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Completion Date
                </label>
                <input
                  type="date"
                  value={targetCompletionDate}
                  onChange={(e) => setTargetCompletionDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Technical scope, road length, capacity..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
                >
                  Save Sanction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
