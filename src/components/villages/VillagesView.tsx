import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Plus,
  Search,
  Building,
  AlertCircle,
  Briefcase,
  Calendar,
  Compass,
  Edit2,
  Trash2,
  X,
  ExternalLink,
  ChevronRight,
  Users,
  CreditCard,
  Phone,
  UserPlus,
} from 'lucide-react';
import { Village, GramPanchayat, Issue, DevelopmentWork, PublicMeeting, FieldVisit, ActiveTab, VillageMember } from '../../types';
import { StorageService } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/Badge';

interface VillagesViewProps {
  villages?: Village[];
  gramPanchayats?: GramPanchayat[];
  issues?: Issue[];
  developmentWorks?: DevelopmentWork[];
  publicMeetings?: PublicMeeting[];
  fieldVisits?: FieldVisit[];
  members?: VillageMember[];
  onNavigate?: (tab: ActiveTab, id?: string) => void;
  selectedVillageId?: string;
}

export const VillagesView: React.FC<VillagesViewProps> = ({
  villages = [],
  gramPanchayats = [],
  issues = [],
  developmentWorks = [],
  publicMeetings = [],
  fieldVisits = [],
  members = [],
  onNavigate = (_tab: ActiveTab, _id?: string) => {},
  selectedVillageId,
}) => {
  const { currentUser, canEditSettings } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterGP, setFilterGP] = useState('all');

  // Selected village for full profile modal
  const [activeVillage, setActiveVillage] = useState<Village | null>(() => {
    if (selectedVillageId) {
      return villages.find((v) => v.id === selectedVillageId) || null;
    }
    return null;
  });

  // Create / Edit Village Modal
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingVillage, setEditingVillage] = useState<Village | null>(null);
  const [name, setName] = useState('');
  const [gp, setGP] = useState('');
  const [lat, setLat] = useState('15.7725');
  const [lng, setLng] = useState('76.7575');
  const [pinCode, setPinCode] = useState('584128');
  const [pollingBoothsCount, setPollingBoothsCount] = useState('4');

  // Open Form
  const handleOpenCreate = () => {
    setEditingVillage(null);
    setName('');
    setGP(gramPanchayats[0]?.name || 'Gorebal GP');
    setLat('15.7725');
    setLng('76.7575');
    setPinCode('584128');
    setPollingBoothsCount('4');
    setFormModalOpen(true);
  };

  const handleOpenEdit = (v: Village, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingVillage(v);
    setName(v.name);
    setGP(v.gramPanchayat);
    setLat(v.coordinates?.lat?.toString() || '15.7725');
    setLng(v.coordinates?.lng?.toString() || '76.7575');
    setPinCode(v.pinCode || '584128');
    setPollingBoothsCount(v.pollingBoothsCount?.toString() || '4');
    setFormModalOpen(true);
  };

  const handleDeleteVillage = (v: Village, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${v.name} from the directory?`)) {
      StorageService.deleteVillage(v.id);
      if (activeVillage?.id === v.id) setActiveVillage(null);
    }
  };

  const handleSaveVillage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const vId = editingVillage ? editingVillage.id : `VIL-${Date.now().toString().slice(-4)}`;
    const newVillage: Village = {
      id: vId,
      name: name.trim(),
      gramPanchayat: gp,
      taluk: 'Sindhanur',
      constituency: 'Sindhanur AC-58',
      district: 'Raichur',
      coordinates: { lat: parseFloat(lat) || 15.7725, lng: parseFloat(lng) || 76.7575 },
      pinCode: pinCode.trim(),
      pollingBoothsCount: parseInt(pollingBoothsCount, 10) || 0,
    };

    StorageService.saveVillage(newVillage);
    setFormModalOpen(false);
  };

  // Filtered villages
  const filteredVillages = useMemo(() => {
    return villages.filter((v) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          v.name.toLowerCase().includes(q) ||
          v.gramPanchayat.toLowerCase().includes(q) ||
          (v.pinCode && v.pinCode.includes(q));
        if (!matches) return false;
      }
      if (filterGP !== 'all' && v.gramPanchayat !== filterGP) return false;
      return true;
    });
  }, [villages, searchQuery, filterGP]);

  // Village specific lists for active village
  const villageIssues = useMemo(() => {
    if (!activeVillage) return [];
    return issues.filter((i) => i.village === activeVillage.name);
  }, [issues, activeVillage]);

  const villageWorks = useMemo(() => {
    if (!activeVillage) return [];
    return developmentWorks.filter((w) => w.village === activeVillage.name);
  }, [developmentWorks, activeVillage]);

  const villageMeetings = useMemo(() => {
    if (!activeVillage) return [];
    return publicMeetings.filter((m) => m.village === activeVillage.name);
  }, [publicMeetings, activeVillage]);

  const villageVisits = useMemo(() => {
    if (!activeVillage) return [];
    return fieldVisits.filter((f) => f.village === activeVillage.name);
  }, [fieldVisits, activeVillage]);

  const villageMembers = useMemo(() => {
    if (!activeVillage) return [];
    const source = members.length > 0 ? members : StorageService.getVillageMembers();
    return source.filter((m) => m.village.toLowerCase() === activeVillage.name.toLowerCase());
  }, [members, activeVillage]);

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Village Directory &amp; Sector Profiles
            </h1>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
              {filteredVillages.length} Villages
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gram Panchayat mapping, polling infrastructure &amp; active developmental portfolios.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('members')}
            className="px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Village Members Directory</span>
          </button>
          {canEditSettings && (
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Village
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search village name, GP, PIN code..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={filterGP}
            onChange={(e) => setFilterGP(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800"
          >
            <option value="all">All Gram Panchayats</option>
            {gramPanchayats.map((gp) => (
              <option key={gp.id} value={gp.name}>
                {gp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Villages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredVillages.map((v) => {
          const vIssues = issues.filter((i) => i.village === v.name);
          const openCount = vIssues.filter(
            (i) => !['Resolved', 'Closed', 'Rejected'].includes(i.status)
          ).length;
          const resolvedCount = vIssues.filter((i) => i.status === 'Resolved').length;
          const worksCount = developmentWorks.filter((w) => w.village === v.name).length;
          const vMembers = (members.length > 0 ? members : StorageService.getVillageMembers()).filter(
            (m) => m.village.toLowerCase() === v.name.toLowerCase()
          );

          return (
            <div
              key={v.id}
              onClick={() => setActiveVillage(v)}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      {v.slNo && (
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          #{v.slNo}
                        </span>
                      )}
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {v.name}
                      </h3>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Building className="w-3 h-3 text-slate-400" />
                      GP: {v.gramPanchayat}
                    </div>
                  </div>

                  {canEditSettings && (
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={(e) => handleOpenEdit(v, e)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                        title="Edit village details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteVillage(v, e)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                        title="Delete village"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Metrics Pill Row */}
                <div className="grid grid-cols-3 gap-2 my-3 text-center">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Total</div>
                    <div className="text-sm font-mono font-bold text-slate-800">
                      {vIssues.length}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100">
                    <div className="text-[10px] text-amber-700 font-semibold uppercase">Open</div>
                    <div className="text-sm font-mono font-bold text-amber-800">{openCount}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                    <div className="text-[10px] text-emerald-700 font-semibold uppercase">
                      Resolved
                    </div>
                    <div className="text-sm font-mono font-bold text-emerald-800">
                      {resolvedCount}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-1.5 border-t border-slate-100 pt-2.5">
                  <div className="flex justify-between items-center">
                    <span>Cadre Members:</span>
                    <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1">
                      <Users className="w-3 h-3 text-emerald-600" />
                      {vMembers.length} {vMembers.length === 1 ? 'Member' : 'Members'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taluk &amp; District:</span>
                    <span className="font-medium text-slate-700">Sindhanur, Raichur</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Development Works:</span>
                    <span className="font-semibold text-purple-700">{worksCount} projects</span>
                  </div>
                  {v.pinCode && (
                    <div className="flex justify-between">
                      <span>Postal PIN:</span>
                      <span className="font-mono text-slate-600">{v.pinCode}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold">
                <span>View Full Village Portfolio</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Village Full Profile Modal */}
      {activeVillage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{activeVillage.name}</h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    GP: {activeVillage.gramPanchayat}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sindhanur AC-58 • Raichur District • PIN: {activeVillage.pinCode || '584128'}
                </p>
              </div>

              <button
                onClick={() => setActiveVillage(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Total Grievances</div>
                  <div className="text-xl font-bold text-slate-800">{villageIssues.length}</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-[10px] text-amber-700 font-bold uppercase">Open / In Progress</div>
                  <div className="text-xl font-bold text-amber-800">
                    {villageIssues.filter((i) => !['Resolved', 'Closed', 'Rejected'].includes(i.status)).length}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[10px] text-emerald-700 font-bold uppercase">Resolved Issues</div>
                  <div className="text-xl font-bold text-emerald-800">
                    {villageIssues.filter((i) => i.status === 'Resolved').length}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                  <div className="text-[10px] text-purple-700 font-bold uppercase">Development Works</div>
                  <div className="text-xl font-bold text-purple-800">{villageWorks.length}</div>
                </div>
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-200">
                  <div className="text-[10px] text-teal-700 font-bold uppercase">Cadre Members</div>
                  <div className="text-xl font-bold text-teal-800">{villageMembers.length}</div>
                </div>
              </div>

              {/* Village Members Section */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Village Cadre Members in {activeVillage.name} ({villageMembers.length})</span>
                  </h3>
                  <button
                    onClick={() => {
                      const vName = activeVillage.name;
                      setActiveVillage(null);
                      onNavigate('members', vName);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  >
                    <span>Open in Members Directory</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {villageMembers.length === 0 ? (
                  <div className="text-center py-4 bg-white rounded-lg border border-emerald-100">
                    <p className="text-xs text-slate-500 mb-2">No members registered yet for {activeVillage.name}.</p>
                    <button
                      onClick={() => {
                        const vName = activeVillage.name;
                        setActiveVillage(null);
                        onNavigate('members', vName);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register Member with Aadhaar &amp; Voter ID</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {villageMembers.map((m) => (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-lg border border-emerald-200 bg-white flex items-center gap-3 text-xs shadow-2xs"
                      >
                        {m.photo ? (
                          <img
                            src={m.photo}
                            alt={m.nameAsPerAadhaar}
                            className="w-10 h-10 rounded-lg object-cover border border-emerald-300 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0">
                            {m.nameAsPerAadhaar.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 truncate">
                            {m.nameAsPerAadhaar}
                          </div>
                          <div className="text-[10px] text-emerald-800 font-medium truncate">
                            {m.role} • EPIC: <span className="font-mono">{m.voterId}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            +91 {m.mobileNumber}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Development Works in this village */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                    Development Works in {activeVillage.name} ({villageWorks.length})
                  </h3>
                </div>

                {villageWorks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No development works recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {villageWorks.map((w) => (
                      <div
                        key={w.id}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-800">{w.workName}</div>
                          <div className="text-slate-500 mt-0.5">
                            {w.department} • Cost: ₹{(w.approvedAmount / 100000).toFixed(1)} Lakhs
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <StatusBadge status={w.status} />
                          <div className="text-[10px] text-slate-400 mt-1">{w.progress}% Done</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Issues in this village */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                    Citizen Grievances in {activeVillage.name} ({villageIssues.length})
                  </h3>
                </div>

                {villageIssues.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No issues logged for this village.</p>
                ) : (
                  <div className="space-y-2">
                    {villageIssues.map((i) => (
                      <div
                        key={i.id}
                        onClick={() => {
                          setActiveVillage(null);
                          onNavigate('issues', i.id);
                        }}
                        className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-700">{i.id}</span>
                            <span className="font-semibold text-slate-800">{i.category}</span>
                          </div>
                          <p className="text-slate-600 mt-0.5 line-clamp-1">{i.description}</p>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Reported by {i.reporterName} on {i.dateReported}
                          </div>
                        </div>
                        <div className="shrink-0">
                          <StatusBadge status={i.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Public Meetings & Field Visits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Meetings */}
                <div className="p-3.5 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-700 uppercase text-[11px] mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    Public Meetings ({villageMeetings.length})
                  </h4>
                  {villageMeetings.length === 0 ? (
                    <p className="text-slate-400 italic">No meetings recorded</p>
                  ) : (
                    <div className="space-y-1.5">
                      {villageMeetings.map((m) => (
                        <div key={m.id} className="p-2 rounded bg-slate-50 text-[11px]">
                          <div className="font-semibold text-slate-800">{m.title}</div>
                          <div className="text-slate-400">{m.date} • {m.location}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Field Visits */}
                <div className="p-3.5 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-700 uppercase text-[11px] mb-2 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-blue-600" />
                    Field Visits ({villageVisits.length})
                  </h4>
                  {villageVisits.length === 0 ? (
                    <p className="text-slate-400 italic">No field visits recorded</p>
                  ) : (
                    <div className="space-y-1.5">
                      {villageVisits.map((f) => (
                        <div key={f.id} className="p-2 rounded bg-slate-50 text-[11px]">
                          <div className="font-semibold text-slate-800">{f.purpose}</div>
                          <div className="text-slate-400">{f.date} • Status: {f.status}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setActiveVillage(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Village Form Modal */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-sm text-slate-800">
                {editingVillage ? `Edit Village (${editingVillage.name})` : 'Add New Village'}
              </h3>
              <button
                onClick={() => setFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVillage} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Village Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Official revenue village name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gram Panchayat *</label>
                <select
                  value={gp}
                  onChange={(e) => setGP(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  required
                >
                  {gramPanchayats.map((g) => (
                    <option key={g.id} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Latitude</label>
                  <input
                    type="text"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Longitude</label>
                  <input
                    type="text"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Polling Booths</label>
                  <input
                    type="number"
                    value={pollingBoothsCount}
                    onChange={(e) => setPollingBoothsCount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
                >
                  Save Village
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
