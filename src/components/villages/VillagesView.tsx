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
  Shield,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Check,
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

  // Sub-tabs: 'directory' | 'heads_registry'
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'heads_registry'>('directory');

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

  // Village Head Fields (Rule: exactly one village per head)
  const [headName, setHeadName] = useState('');
  const [headPhone, setHeadPhone] = useState('');
  const [headDesignation, setHeadDesignation] = useState('Grama Pradhan / Village Head');
  const [headEmail, setHeadEmail] = useState('');
  const [allowReassign, setAllowReassign] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<{ conflictVillage?: Village; reason?: string } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Uniqueness integrity check
  const headIntegrity = useMemo(() => {
    return StorageService.verifyVillageHeadUniqueness();
  }, [villages, formModalOpen]);

  // Open Form
  const handleOpenCreate = () => {
    setEditingVillage(null);
    setName('');
    setGP(gramPanchayats[0]?.name || 'Gorebal GP');
    setLat('15.7725');
    setLng('76.7575');
    setPinCode('584128');
    setPollingBoothsCount('4');
    setHeadName('');
    setHeadPhone('');
    setHeadDesignation('Grama Pradhan / Village Head');
    setHeadEmail('');
    setAllowReassign(false);
    setConflictWarning(null);
    setSaveError(null);
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
    setHeadName(v.villageHead?.name || v.villageHeadName || '');
    setHeadPhone(v.villageHead?.phone || v.villageHeadPhone || '');
    setHeadDesignation(v.villageHead?.designation || v.villageHeadDesignation || 'Grama Pradhan / Village Head');
    setHeadEmail(v.villageHead?.email || '');
    setAllowReassign(false);
    setConflictWarning(null);
    setSaveError(null);
    setFormModalOpen(true);
  };

  const handleHeadNameChange = (val: string) => {
    setHeadName(val);
    setSaveError(null);
    if (!val.trim()) {
      setConflictWarning(null);
      return;
    }
    const check = StorageService.validateVillageHeadAssignment(val, headPhone, editingVillage?.id);
    if (!check.isValid) {
      setConflictWarning({ conflictVillage: check.conflictVillage, reason: check.reason });
    } else {
      setConflictWarning(null);
    }
  };

  const handleHeadPhoneChange = (val: string) => {
    setHeadPhone(val);
    setSaveError(null);
    if (!val.trim()) {
      setConflictWarning(null);
      return;
    }
    const check = StorageService.validateVillageHeadAssignment(headName, val, editingVillage?.id);
    if (!check.isValid) {
      setConflictWarning({ conflictVillage: check.conflictVillage, reason: check.reason });
    } else {
      setConflictWarning(null);
    }
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

    if (conflictWarning && !allowReassign) {
      setSaveError(
        conflictWarning.reason ||
          'Village head is already assigned to another village. Exactly one village per village head is permitted.'
      );
      return;
    }

    const vId = editingVillage ? editingVillage.id : `VIL-${Date.now().toString().slice(-4)}`;
    const newVillage: Village = {
      ...(editingVillage || {}),
      id: vId,
      name: name.trim(),
      gramPanchayat: gp,
      taluk: 'Sindhanur',
      constituency: 'Sindhanur AC-58',
      district: 'Raichur',
      coordinates: { lat: parseFloat(lat) || 15.7725, lng: parseFloat(lng) || 76.7575 },
      pinCode: pinCode.trim(),
      pollingBoothsCount: parseInt(pollingBoothsCount, 10) || 0,
      villageHead: headName.trim()
        ? {
            name: headName.trim(),
            phone: headPhone.trim() || '+91 94481 00000',
            designation: headDesignation.trim() || 'Grama Pradhan / Village Head',
            termStartDate: editingVillage?.villageHead?.termStartDate || '2023-01-15',
            email:
              headEmail.trim() ||
              `head.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@sindhanur.gov.in`,
          }
        : editingVillage?.villageHead,
      villageHeadName: headName.trim() || editingVillage?.villageHeadName,
      villageHeadPhone: headPhone.trim() || editingVillage?.villageHeadPhone,
      villageHeadDesignation: headDesignation.trim() || editingVillage?.villageHeadDesignation,
    };

    const result = StorageService.saveVillage(newVillage, allowReassign);
    if (!result.success) {
      setSaveError(result.error || 'Failed to save village.');
      return;
    }

    setFormModalOpen(false);
    if (activeVillage?.id === newVillage.id) {
      setActiveVillage(newVillage);
    }
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
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Village
            </button>
          )}
        </div>
      </div>

      {/* 1:1 Village Head Allocation Rule Banner & Sub-Tabs */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 flex items-center justify-center font-bold shrink-0">
            <Shield className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                1:1 Village Head Assignment Rule
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Active &amp; Enforced</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Each Village Head must be assigned to exactly one village ({headIntegrity.uniqueHeadsCount}/{headIntegrity.totalVillages} heads uniquely mapped).
            </p>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab('directory')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'directory'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Villages Directory ({filteredVillages.length})
          </button>
          <button
            onClick={() => setActiveSubTab('heads_registry')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'heads_registry'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-700" />
            <span>Village Heads Registry (1:1)</span>
          </button>
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
            placeholder={
              activeSubTab === 'heads_registry'
                ? 'Search Village Head name, assigned village, phone...'
                : 'Search village name, GP, PIN code...'
            }
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

      {/* View Content: Directory OR Heads Registry */}
      {activeSubTab === 'heads_registry' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-600" />
                <span>Official Village Heads 1:1 Assignment Registry ({filteredVillages.length} Records)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Statutory roster ensuring every Village Head is allocated to exactly one village.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Unique Village Heads</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  <th className="py-3 px-3.5">#</th>
                  <th className="py-3 px-3.5">Village Head Name</th>
                  <th className="py-3 px-3.5">Assigned Village (1:1 Exclusive)</th>
                  <th className="py-3 px-3.5">Gram Panchayat</th>
                  <th className="py-3 px-3.5">Contact Phone</th>
                  <th className="py-3 px-3.5">Designation</th>
                  <th className="py-3 px-3.5">1:1 Status</th>
                  {canEditSettings && <th className="py-3 px-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredVillages.map((v, idx) => {
                  const hName = v.villageHead?.name || v.villageHeadName || 'Pending';
                  const hPhone = v.villageHead?.phone || v.villageHeadPhone || '+91 94481 00000';
                  const hDesig = v.villageHead?.designation || v.villageHeadDesignation || 'Grama Pradhan / Village Head';

                  return (
                    <tr
                      key={v.id}
                      onClick={() => setActiveVillage(v)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3.5 font-mono text-slate-400 font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-bold flex items-center justify-center text-xs shrink-0">
                            {hName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{hName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {v.villageHead?.email || `head.${v.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@sindhanur.gov.in`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                          {v.name}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 font-medium">
                        {v.gramPanchayat}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-800">
                        <a
                          href={`tel:${hPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{hPhone}</span>
                        </a>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">
                        {hDesig}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>1 Village Only</span>
                        </span>
                      </td>
                      {canEditSettings && (
                        <td className="py-3 px-3.5 text-right">
                          <button
                            onClick={(e) => handleOpenEdit(v, e)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded font-semibold text-[11px] shadow-2xs cursor-pointer inline-flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3 text-slate-500" />
                            <span>Edit / Reassign</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Villages Grid */
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

                  {/* 1:1 Designated Village Head Box */}
                  <div className="my-2.5 p-2 rounded-lg bg-amber-50/80 border border-amber-200/90 flex items-start justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-amber-900 tracking-wider">
                        <Shield className="w-3 h-3 text-amber-700" />
                        <span>Village Head (1:1 Assigned)</span>
                      </div>
                      <div className="font-bold text-slate-900 truncate mt-0.5">
                        {v.villageHead?.name || v.villageHeadName || 'Pending Assignment'}
                      </div>
                      <div className="text-[11px] text-slate-600 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{v.villageHead?.phone || v.villageHeadPhone || '+91 94481 00000'}</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold bg-white text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded shadow-2xs">
                      1 Village Only
                    </span>
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
      )}

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
              {/* Designated Village Head Profile Card (1:1 Exclusivity) */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                    <Shield className="w-6 h-6 text-amber-100" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 border border-amber-300">
                        Designated Village Head
                      </span>
                      <span className="text-xs text-emerald-800 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Exclusively Assigned to {activeVillage.name} Only</span>
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {activeVillage.villageHead?.name || activeVillage.villageHeadName || 'Pending Assignment'}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">
                      {activeVillage.villageHead?.designation || activeVillage.villageHeadDesignation || 'Grama Pradhan / Village Head'}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-600">
                      <a
                        href={`tel:${activeVillage.villageHead?.phone || activeVillage.villageHeadPhone}`}
                        className="flex items-center gap-1 font-mono font-bold text-indigo-700 hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{activeVillage.villageHead?.phone || activeVillage.villageHeadPhone || '+91 94481 00000'}</span>
                      </a>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600">
                        {activeVillage.villageHead?.email || `head.${activeVillage.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@sindhanur.gov.in`}
                      </span>
                    </div>
                  </div>
                </div>

                {canEditSettings && (
                  <button
                    onClick={() => handleOpenEdit(activeVillage)}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shrink-0 shadow-2xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Reassign Head</span>
                  </button>
                )}
              </div>

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

            <form onSubmit={handleSaveVillage} className="space-y-3.5 text-xs">
              {saveError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-300 text-red-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold">Validation Error: </span>
                    {saveError}
                  </div>
                </div>
              )}

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

              {/* Village Head 1:1 Exclusive Assignment Section */}
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                    <Shield className="w-4 h-4 text-amber-700" />
                    <span>Designated Village Head (1:1 Exclusive Assignment)</span>
                  </div>
                  <span className="text-[10px] font-bold bg-white text-amber-800 border border-amber-300 px-2 py-0.5 rounded shadow-2xs">
                    1 Village Head = Exactly 1 Village
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Village Head Full Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={headName}
                      onChange={(e) => handleHeadNameChange(e.target.value)}
                      placeholder="e.g. Basavarajappa Gowda Patil"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                      required
                    />
                    <UserCheck className="w-4 h-4 text-emerald-600 absolute right-2.5 top-2.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      value={headPhone}
                      onChange={(e) => handleHeadPhoneChange(e.target.value)}
                      placeholder="+91 94481 00000"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Official Designation
                    </label>
                    <input
                      type="text"
                      value={headDesignation}
                      onChange={(e) => setHeadDesignation(e.target.value)}
                      placeholder="Grama Pradhan / Village Head"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={headEmail}
                    onChange={(e) => setHeadEmail(e.target.value)}
                    placeholder="head.village@sindhanur.gov.in"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>

                {/* Live Validation Warning or Success Feedback */}
                {conflictWarning && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-300 text-red-800 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>Assignment Invariant Conflict</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {conflictWarning.reason}
                    </p>
                    <label className="flex items-center gap-2 pt-1 font-semibold text-[11px] text-red-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowReassign}
                        onChange={(e) => setAllowReassign(e.target.checked)}
                        className="rounded border-red-300 text-red-600 focus:ring-red-500"
                      />
                      <span>
                        Reassign from {conflictWarning.conflictVillage?.name} to this village (maintains 1:1 rule by setting an acting head for {conflictWarning.conflictVillage?.name})
                      </span>
                    </label>
                  </div>
                )}

                {!conflictWarning && headName.trim() && (
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1.5 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Validated: Village Head is available for exclusive 1:1 assignment to this village.</span>
                  </div>
                )}
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
