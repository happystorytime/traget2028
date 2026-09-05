import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MapPin,
  CreditCard,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Camera,
  Upload,
  X,
  FileText,
  ChevronDown,
  Building,
  Eye,
  Trash2,
  Edit2,
  Download,
  Printer,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { Village, VillageMember, User } from '../../types';
import { StorageService } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';

interface VillageMembersViewProps {
  villages?: Village[];
  members?: VillageMember[];
  currentUser?: User;
  onRefresh?: () => void;
  selectedVillageName?: string;
  initialVillage?: string;
  onNavigate?: (tab: any, id?: string) => void;
}

export const VillageMembersView: React.FC<VillageMembersViewProps> = ({
  villages: propVillages,
  members: propMembers,
  currentUser: propUser,
  onRefresh: propOnRefresh,
  selectedVillageName: initialSelectedVillage,
  initialVillage,
  onNavigate,
}) => {
  const { currentUser: authUser } = useAuth();
  const currentUser = propUser || authUser;
  const [internalMembers, setInternalMembers] = useState<VillageMember[]>([]);

  const villages = useMemo(() => {
    return propVillages && propVillages.length > 0 ? propVillages : StorageService.getVillages();
  }, [propVillages]);

  const loadMembers = useCallback(() => {
    setInternalMembers(StorageService.getVillageMembers());
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const members = useMemo(() => {
    return propMembers && propMembers.length > 0 ? propMembers : internalMembers;
  }, [propMembers, internalMembers]);

  const onRefresh = propOnRefresh || loadMembers;

  const [selectedVillage, setSelectedVillage] = useState<string>(
    initialVillage || initialSelectedVillage || 'ALL'
  );

  useEffect(() => {
    if (initialVillage) {
      setSelectedVillage(initialVillage);
    }
  }, [initialVillage]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<VillageMember | null>(null);
  const [viewingIdCardMember, setViewingIdCardMember] = useState<VillageMember | null>(null);

  // Form states for Add / Edit Member
  const [formNameAsPerAadhaar, setFormNameAsPerAadhaar] = useState('');
  const [formVoterId, setFormVoterId] = useState('');
  const [formAadhaarNumber, setFormAadhaarNumber] = useState('');
  const [formVillage, setFormVillage] = useState(villages[0]?.name || 'Alabanoor');
  const [formGramPanchayat, setFormGramPanchayat] = useState('');
  const [formMobileNumber, setFormMobileNumber] = useState('');
  const [formRole, setFormRole] = useState('Cadre Worker');
  const [formDesignation, setFormDesignation] = useState('');
  const [formBoothNumber, setFormBoothNumber] = useState<string | number>('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhoto, setFormPhoto] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'Verified' | 'Active' | 'Pending Verification'>('Verified');
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gram Panchayats list (independent, not auto-linked to village)
  const allGramPanchayats = useMemo(() => {
    const s = new Set<string>();
    StorageService.getGramPanchayats().forEach((gp) => {
      if (gp.name) s.add(gp.name);
    });
    villages.forEach((v) => {
      if (v.gramPanchayat) s.add(v.gramPanchayat);
    });
    return Array.from(s).sort();
  }, [villages]);

  // Set form village independently (no auto-linking to Grama Panchayat)
  const handleFormVillageChange = (villageName: string) => {
    setFormVillage(villageName);
  };

  // Process photo upload from device
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image size should be less than 5MB.');
      return;
    }

    // Read and compress using Canvas
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setFormPhoto(compressedDataUrl);
          setFormError(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const openAddModal = () => {
    setEditingMember(null);
    setFormNameAsPerAadhaar('');
    setFormVoterId('');
    setFormAadhaarNumber('');
    const defaultVillage = selectedVillage !== 'ALL' ? selectedVillage : villages[0]?.name || 'Alabanoor';
    setFormVillage(defaultVillage);
    setFormGramPanchayat('');
    setFormMobileNumber('');
    setFormRole('Cadre Worker');
    setFormDesignation('');
    setFormBoothNumber('');
    setFormAddress('');
    setFormPhoto('');
    setFormStatus('Verified');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (m: VillageMember) => {
    setEditingMember(m);
    setFormNameAsPerAadhaar(m.nameAsPerAadhaar);
    setFormVoterId(m.voterId);
    setFormAadhaarNumber(m.aadhaarNumber || '');
    setFormVillage(m.village);
    setFormGramPanchayat(m.gramPanchayat);
    setFormMobileNumber(m.mobileNumber);
    setFormRole(m.role);
    setFormDesignation(m.designation || '');
    setFormBoothNumber(m.boothNumber || '');
    setFormAddress(m.address || '');
    setFormPhoto(m.photo || '');
    setFormStatus(m.status);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNameAsPerAadhaar.trim()) {
      setFormError('Please enter the full name as per Aadhaar card.');
      return;
    }
    if (!formVoterId.trim()) {
      setFormError('Please enter the Voter ID (EPIC) number.');
      return;
    }
    const cleanMobile = formMobileNumber.replace(/[^0-9]/g, '');
    if (cleanMobile.length !== 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const memberToSave: VillageMember = {
      id: editingMember?.id || `MEM-${Date.now().toString().slice(-6)}`,
      nameAsPerAadhaar: formNameAsPerAadhaar.trim(),
      voterId: formVoterId.trim().toUpperCase(),
      aadhaarNumber: formAadhaarNumber.trim() || 'XXXX-XXXX-****',
      photo: formPhoto || '',
      village: formVillage,
      gramPanchayat: formGramPanchayat,
      mobileNumber: cleanMobile,
      role: formRole,
      designation: formDesignation.trim() || formRole,
      boothNumber: formBoothNumber ? Number(formBoothNumber) || formBoothNumber : undefined,
      status: formStatus,
      joinedDate: editingMember?.joinedDate || new Date().toISOString().split('T')[0],
      address: formAddress.trim(),
    };

    StorageService.saveVillageMember(memberToSave);
    setIsAddModalOpen(false);
    onRefresh();
  };

  const handleDeleteMember = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove member "${name}"?`)) {
      StorageService.deleteVillageMember(id);
      onRefresh();
    }
  };

  // Village counts map
  const memberCountsByVillage = useMemo(() => {
    const map = new Map<string, number>();
    members.forEach((m) => {
      const v = m.village;
      map.set(v, (map.get(v) || 0) + 1);
    });
    return map;
  }, [members]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Village filter
      if (selectedVillage !== 'ALL' && m.village.toLowerCase() !== selectedVillage.toLowerCase()) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && m.status !== statusFilter) {
        return false;
      }
      // Role filter
      if (roleFilter !== 'ALL' && m.role !== roleFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = m.nameAsPerAadhaar.toLowerCase().includes(q);
        const matchVoter = m.voterId.toLowerCase().includes(q);
        const matchMobile = m.mobileNumber.includes(q);
        const matchVillage = m.village.toLowerCase().includes(q);
        const matchRole = m.role.toLowerCase().includes(q);
        return matchName || matchVoter || matchMobile || matchVillage || matchRole;
      }
      return true;
    });
  }, [members, selectedVillage, statusFilter, roleFilter, searchQuery]);

  // Distinct roles
  const availableRoles = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => set.add(m.role));
    return Array.from(set);
  }, [members]);

  // Stats calculation
  const totalMembers = members.length;
  const uniqueVillagesRepresented = new Set(members.map((m) => m.village)).size;
  const verifiedCount = members.filter((m) => m.status === 'Verified').length;
  const withPhotosCount = members.filter((m) => !!m.photo).length;

  return (
    <div id="village-members-container" className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <Users className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Constituency Cadre & Village Directory</span>
              <span>•</span>
              <span>Sindhanur AC-58</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Village-Wise Members & Booth Cadres
            </h1>
            <p className="text-sm text-emerald-100 max-w-2xl mt-1">
              Official register of verified grassroots members, booth presidents, and cadre
              workers across all 124 villages with Aadhaar-verified identity and Voter ID tracking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="add-member-top-btn"
              onClick={openAddModal}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span>Register New Member</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-emerald-600/60">
          <div className="bg-emerald-900/40 backdrop-blur rounded-xl p-3 border border-emerald-500/30">
            <div className="text-xs font-medium text-emerald-200">Total Members</div>
            <div className="text-2xl font-black text-white">{totalMembers}</div>
            <div className="text-[11px] text-emerald-300 mt-0.5">Grassroots Cadre</div>
          </div>
          <div className="bg-emerald-900/40 backdrop-blur rounded-xl p-3 border border-emerald-500/30">
            <div className="text-xs font-medium text-emerald-200">Villages Represented</div>
            <div className="text-2xl font-black text-white">
              {uniqueVillagesRepresented} <span className="text-xs font-normal text-emerald-300">/ 124</span>
            </div>
            <div className="text-[11px] text-emerald-300 mt-0.5">AC-58 Coverage</div>
          </div>
          <div className="bg-emerald-900/40 backdrop-blur rounded-xl p-3 border border-emerald-500/30">
            <div className="text-xs font-medium text-emerald-200">Aadhaar & Voter ID Verified</div>
            <div className="text-2xl font-black text-emerald-300">{verifiedCount}</div>
            <div className="text-[11px] text-emerald-200 mt-0.5">100% Authenticated</div>
          </div>
          <div className="bg-emerald-900/40 backdrop-blur rounded-xl p-3 border border-emerald-500/30">
            <div className="text-xs font-medium text-emerald-200">Device Photos Attached</div>
            <div className="text-2xl font-black text-white">{withPhotosCount}</div>
            <div className="text-[11px] text-emerald-300 mt-0.5">With Digital Badges</div>
          </div>
        </div>
      </div>

      {/* Village Selector & Filter Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 space-y-4">
        {/* Village Selection Carousel / Filter */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Village (124 Villages in Sindhanur AC-58)
              </span>
            </div>
            {selectedVillage !== 'ALL' && (
              <button
                onClick={() => setSelectedVillage('ALL')}
                className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold"
              >
                View All Villages
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              onClick={() => setSelectedVillage('ALL')}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                selectedVillage === 'ALL'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>All 124 Villages</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                {totalMembers}
              </span>
            </button>

            {villages.map((v) => {
              const count = memberCountsByVillage.get(v.name) || 0;
              const isSelected = selectedVillage.toLowerCase() === v.name.toLowerCase();
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVillage(v.name)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : count > 0
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{v.name}</span>
                  {count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isSelected ? 'bg-white text-emerald-800' : 'bg-emerald-200 text-emerald-900'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search, Filter, and View Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-members-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name as per Aadhaar, Voter ID, Mobile, or Village..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center space-x-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Roles</option>
                {availableRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1.5 text-xs text-slate-600">
              <span className="font-semibold">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Status</option>
                <option value="Verified">Verified</option>
                <option value="Active">Active</option>
                <option value="Pending Verification">Pending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Village Info Banner */}
      {selectedVillage !== 'ALL' && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">{selectedVillage} Village</h2>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-semibold">
                  AC-58 Sindhanur
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {villages.find((v) => v.name === selectedVillage)?.gramPanchayat || 'Gram Panchayat'} •{' '}
                {filteredMembers.length} Registered Cadre Member{filteredMembers.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          <button
            id="add-member-for-village-btn"
            onClick={openAddModal}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Member to {selectedVillage}</span>
          </button>
        </div>
      )}

      {/* Members Grid / Cards */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No Members Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed">
            {searchQuery || statusFilter !== 'ALL' || roleFilter !== 'ALL'
              ? 'Try changing your search keywords or filter criteria.'
              : `No members have been registered yet for ${selectedVillage === 'ALL' ? 'the selected filter' : selectedVillage}.`}
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register First Member for {selectedVillage === 'ALL' ? 'Sindhanur' : selectedVillage}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              id={`member-card-${member.id}`}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between relative group"
            >
              <div>
                {/* Card Top: Photo, Name, and Status */}
                <div className="flex items-start space-x-3.5 mb-4">
                  {/* Avatar / Device Photo */}
                  <div className="relative shrink-0">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={member.nameAsPerAadhaar}
                        className="w-14 h-14 rounded-xl object-cover border border-emerald-300 shadow-xs"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-lg flex items-center justify-center shadow-xs">
                        {member.nameAsPerAadhaar.charAt(0)}
                      </div>
                    )}
                    <span
                      title="Verified Identity"
                      className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {member.role}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          member.status === 'Verified'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {member.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900 mt-1 truncate">
                      {member.nameAsPerAadhaar}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      As per Aadhaar Card
                    </p>
                  </div>
                </div>

                {/* Key Attributes Box */}
                <div className="space-y-2 bg-slate-50/80 rounded-lg p-3 text-xs border border-slate-100">
                  {/* Voter ID */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center space-x-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span>Voter ID (EPIC):</span>
                    </span>
                    <span className="font-mono font-bold text-slate-800 tracking-wide bg-white px-2 py-0.5 rounded border border-slate-200">
                      {member.voterId}
                    </span>
                  </div>

                  {/* Village & GP */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Village:</span>
                    </span>
                    <span className="font-semibold text-emerald-800">
                      {member.village}
                    </span>
                  </div>

                  {/* Mobile & OTP */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Mobile:</span>
                    </span>
                    <span className="font-semibold text-slate-700">
                      +91 {member.mobileNumber}
                    </span>
                  </div>

                  {/* Booth Number if present */}
                  {member.boothNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Booth Number:</span>
                      <span className="font-bold text-slate-800">
                        Booth #{member.boothNumber}
                      </span>
                    </div>
                  )}

                  {/* Masked Aadhaar */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>Aadhaar:</span>
                    <span className="font-mono text-slate-600">{member.aadhaarNumber || 'XXXX-XXXX-****'}</span>
                  </div>
                </div>

                {member.notes && (
                  <p className="text-xs text-slate-600 italic mt-2.5 line-clamp-2 px-1">
                    "{member.notes}"
                  </p>
                )}
              </div>

              {/* Card Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setViewingIdCardMember(member)}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Digital ID Card</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(member)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                    title="Edit Member"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member.id, member.nameAsPerAadhaar)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Remove Member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Member Modal */}
      {isAddModalOpen && (
        <div
          id="member-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto"
        >
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <UserPlus className="w-5 h-5" />
                <h2 className="text-lg font-bold">
                  {editingMember ? 'Edit Village Member' : 'Register Village Cadre Member'}
                </h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  {formError}
                </div>
              )}

              {/* Photo Upload Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Photo Upload from Device
                </label>
                <div className="flex items-center space-x-4">
                  {formPhoto ? (
                    <div className="relative">
                      <img
                        src={formPhoto}
                        alt="Preview"
                        className="w-20 h-20 rounded-xl object-cover border-2 border-emerald-500 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setFormPhoto('')}
                        className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-xs"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400">
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[10px]">No Photo</span>
                    </div>
                  )}

                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="device-photo-input"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center space-x-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{formPhoto ? 'Change Photo from Device' : 'Upload Photo from Device'}</span>
                    </button>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Supports JPG, PNG, WEBP. Compressed automatically for offline ID card.
                    </p>
                  </div>
                </div>
              </div>

              {/* Name as per Aadhaar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name (As Per Aadhaar) *
                </label>
                <input
                  type="text"
                  required
                  value={formNameAsPerAadhaar}
                  onChange={(e) => setFormNameAsPerAadhaar(e.target.value)}
                  placeholder="e.g. Ramesh Gowda Patil"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Voter ID & Aadhaar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Voter ID Number (EPIC) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formVoterId}
                    onChange={(e) => setFormVoterId(e.target.value.toUpperCase())}
                    placeholder="e.g. KA58/012/104821"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Aadhaar Number (Masked)
                  </label>
                  <input
                    type="text"
                    value={formAadhaarNumber}
                    onChange={(e) => setFormAadhaarNumber(e.target.value)}
                    placeholder="XXXX-XXXX-4819"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Village and Gram Panchayat Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Village (From 124 AC-58 Villages) *
                  </label>
                  <select
                    value={formVillage}
                    onChange={(e) => handleFormVillageChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    {villages.map((v) => (
                      <option key={v.id} value={v.name}>
                        {v.slNo ? `${v.slNo}. ` : ''}{v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Grama Panchayat
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Independent / Optional</span>
                  </div>
                  <input
                    type="text"
                    list="panchayat-options-list"
                    value={formGramPanchayat}
                    onChange={(e) => setFormGramPanchayat(e.target.value)}
                    placeholder="Enter or choose Grama Panchayat"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <datalist id="panchayat-options-list">
                    {allGramPanchayats.map((gp) => (
                      <option key={gp} value={gp} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Mobile Number & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Number (Used for OTP Login) *
                  </label>
                  <div className="relative flex rounded-lg border border-slate-300 overflow-hidden">
                    <span className="inline-flex items-center px-2.5 bg-slate-100 border-r border-slate-300 text-xs font-bold text-slate-700">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={formMobileNumber}
                      onChange={(e) => setFormMobileNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="9845012340"
                      className="w-full px-3 py-2 text-sm text-slate-900 font-medium focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cadre Role / Wing *
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Village President">Village President</option>
                    <option value="Booth Committee Lead">Booth Committee Lead</option>
                    <option value="Cadre Worker">Cadre Worker</option>
                    <option value="Women Wing Lead">Women Wing Lead</option>
                    <option value="Youth Wing Member">Youth Wing Member</option>
                    <option value="Ward Coordinator">Ward Coordinator</option>
                    <option value="Citizen Member">Citizen Member</option>
                  </select>
                </div>
              </div>

              {/* Designation & Booth Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    placeholder="e.g. Booth In-Charge #12"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Polling Booth Number
                  </label>
                  <input
                    type="text"
                    value={formBoothNumber}
                    onChange={(e) => setFormBoothNumber(e.target.value)}
                    placeholder="e.g. 14"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Status & Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Residential Address
                </label>
                <textarea
                  rows={2}
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="e.g. Main Road, Near GHPS School, Alabanoor"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                >
                  {editingMember ? 'Save Changes' : 'Register Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Digital Cadre ID Card Modal */}
      {viewingIdCardMember && (
        <div
          id="id-card-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Digital Cadre Identity Card</span>
              </div>
              <button
                onClick={() => setViewingIdCardMember(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable ID Card Container */}
            <div className="p-6">
              <div
                id="printable-cadre-id-card"
                className="w-full bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden border-2 border-emerald-500/40"
              >
                {/* Government Watermark emblem */}
                <div className="absolute right-3 top-3 opacity-10 pointer-events-none">
                  <ShieldCheck className="w-36 h-36 text-white" />
                </div>

                {/* ID Card Top Header */}
                <div className="border-b border-emerald-600/60 pb-3 mb-4 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-emerald-200 font-bold block">
                      Government of Karnataka
                    </span>
                    <h4 className="text-sm font-black tracking-wide text-white">
                      AC-58 SINDHANUR CONSTITUENCY
                    </h4>
                    <span className="text-[10px] text-emerald-100 font-medium">
                      Official Constituency Cadre Card
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/40 text-[10px] font-bold border border-emerald-400/40 text-emerald-100">
                    AC-58
                  </span>
                </div>

                {/* Card Body with Photo and Official Details */}
                <div className="flex items-start space-x-4">
                  {/* Photo from Device */}
                  <div className="shrink-0">
                    {viewingIdCardMember.photo ? (
                      <img
                        src={viewingIdCardMember.photo}
                        alt={viewingIdCardMember.nameAsPerAadhaar}
                        className="w-24 h-28 object-cover rounded-xl border-2 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-24 h-28 bg-emerald-950/60 rounded-xl border-2 border-white/60 flex flex-col items-center justify-center text-white">
                        <Users className="w-8 h-8 opacity-60 mb-1" />
                        <span className="text-[10px] font-bold">CADRE</span>
                      </div>
                    )}
                  </div>

                  {/* Attributes */}
                  <div className="flex-1 min-w-0 space-y-1.5 text-xs">
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-emerald-300 font-bold">
                        Name (As Per Aadhaar)
                      </div>
                      <div className="text-sm font-extrabold text-white leading-tight">
                        {viewingIdCardMember.nameAsPerAadhaar}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-emerald-300 font-bold">
                        Voter ID (EPIC)
                      </div>
                      <div className="font-mono font-bold text-white text-xs bg-emerald-900/50 px-1.5 py-0.5 rounded inline-block">
                        {viewingIdCardMember.voterId}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      <div>
                        <span className="text-emerald-300 block text-[9px] uppercase">Village</span>
                        <span className="font-bold text-white truncate block">
                          {viewingIdCardMember.village}
                        </span>
                      </div>
                      <div>
                        <span className="text-emerald-300 block text-[9px] uppercase">Role</span>
                        <span className="font-bold text-white truncate block">
                          {viewingIdCardMember.role}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-emerald-300 text-[9px] uppercase block">Mobile</span>
                      <span className="font-mono text-emerald-100 font-semibold">
                        +91 {viewingIdCardMember.mobileNumber}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer with QR & Verification */}
                <div className="mt-4 pt-3 border-t border-emerald-600/60 flex items-center justify-between text-[10px]">
                  <div className="flex items-center space-x-1.5 text-emerald-200">
                    <QrCode className="w-7 h-7 text-white" />
                    <div>
                      <span className="block font-mono font-bold text-white">
                        {viewingIdCardMember.id}
                      </span>
                      <span className="text-[9px] text-emerald-300">Aadhaar Verified</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="block text-[8px] uppercase tracking-wider text-emerald-300">
                      Constituency Office
                    </span>
                    <span className="font-bold text-white text-[10px]">Sindhanur, Raichur</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print ID Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingIdCardMember(null)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
