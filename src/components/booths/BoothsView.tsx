import React, { useState, useMemo } from 'react';
import {
  Vote,
  Search,
  Building,
  Users,
  Phone,
  Calendar,
  Shield,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Filter,
  UserCheck,
  Edit2,
  Plus,
  X,
  Compass,
} from 'lucide-react';
import { PollingBooth, Village, GramPanchayat, ActiveTab } from '../../types';
import { StorageService } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface BoothsViewProps {
  pollingBooths?: PollingBooth[];
  villages?: Village[];
  gramPanchayats?: GramPanchayat[];
  onNavigate?: (tab: ActiveTab, id?: string) => void;
}

export const BoothsView: React.FC<BoothsViewProps> = ({
  pollingBooths = [],
  villages = [],
  gramPanchayats = [],
  onNavigate = (_tab: ActiveTab, _id?: string) => {},
}) => {
  const { isAdmin, canEditSettings } = useAuth();
  const { t } = useLanguage();

  const [booths, setBooths] = useState<PollingBooth[]>(() => {
    const list = StorageService.getPollingBooths();
    return list.length > 0 ? list : pollingBooths;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterGP, setFilterGP] = useState('all');
  const [filterVillage, setFilterVillage] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Active' | 'Sensitive'>('all');

  // Selected Booth Inspector Modal
  const [selectedBooth, setSelectedBooth] = useState<PollingBooth | null>(null);

  // Edit / Add Booth Modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingBooth, setEditingBooth] = useState<PollingBooth | null>(null);
  const [boothNumber, setBoothNumber] = useState('');
  const [boothName, setBoothName] = useState('');
  const [village, setVillage] = useState('');
  const [gp, setGP] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [votersCount, setVotersCount] = useState('850');
  const [maleVoters, setMaleVoters] = useState('430');
  const [femaleVoters, setFemaleVoters] = useState('420');
  const [coordinatorName, setCoordinatorName] = useState('');
  const [coordinatorPhone, setCoordinatorPhone] = useState('');
  const [status, setStatus] = useState<'Active' | 'Sensitive' | 'Normal'>('Active');

  const reloadBooths = () => {
    setBooths(StorageService.getPollingBooths());
  };

  const filteredBooths = useMemo(() => {
    return booths.filter((b) => {
      if (filterGP !== 'all' && b.gramPanchayat !== filterGP) return false;
      if (filterVillage !== 'all' && b.village !== filterVillage) return false;
      if (filterStatus !== 'all' && b.status !== filterStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          b.boothNumber.toString().includes(q) ||
          b.boothName.toLowerCase().includes(q) ||
          b.village.toLowerCase().includes(q) ||
          b.gramPanchayat.toLowerCase().includes(q) ||
          (b.coordinatorName && b.coordinatorName.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [booths, filterGP, filterVillage, filterStatus, searchQuery]);

  const totalVoters = useMemo(() => {
    return booths.reduce((acc, b) => acc + (b.votersCount || 0), 0);
  }, [booths]);

  const sensitiveCount = useMemo(() => {
    return booths.filter((b) => b.status === 'Sensitive').length;
  }, [booths]);

  const handleOpenEdit = (b: PollingBooth, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingBooth(b);
    setBoothNumber(b.boothNumber.toString());
    setBoothName(b.boothName);
    setVillage(b.village);
    setGP(b.gramPanchayat);
    setBuildingName(b.buildingName);
    setVotersCount((b.votersCount || 850).toString());
    setMaleVoters((b.maleVoters || 430).toString());
    setFemaleVoters((b.femaleVoters || 420).toString());
    setCoordinatorName(b.coordinatorName || '');
    setCoordinatorPhone(b.coordinatorPhone || '');
    setStatus(b.status || 'Active');
    setFormOpen(true);
  };

  const handleSaveBooth = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(boothNumber, 10);
    if (isNaN(num)) return;

    const saved: PollingBooth = {
      id: editingBooth?.id || `PB-${String(num).padStart(3, '0')}`,
      boothNumber: num,
      boothName: boothName.trim(),
      village,
      gramPanchayat: gp,
      buildingName: buildingName.trim(),
      votersCount: parseInt(votersCount, 10) || 0,
      maleVoters: parseInt(maleVoters, 10) || 0,
      femaleVoters: parseInt(femaleVoters, 10) || 0,
      coordinatorName: coordinatorName.trim(),
      coordinatorPhone: coordinatorPhone.trim(),
      volunteersCount: editingBooth?.volunteersCount || 5,
      lastFieldVisitDate: editingBooth?.lastFieldVisitDate || '2025-02-20',
      status,
    };

    StorageService.savePollingBooth(saved);
    reloadBooths();
    setFormOpen(false);
    if (selectedBooth?.id === saved.id) setSelectedBooth(saved);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-4 sm:p-6 border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
              <Vote className="w-3.5 h-3.5 text-emerald-400" />
              <span>AC-58 Sindhanur • Election Commission Official Delimitation</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Polling Booth Management (262 Booths)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Every polling station in Sindhanur is mapped with designated booth coordinators, verified voter rolls, cadre volunteers, and field monitoring.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canEditSettings && (
              <button
                onClick={() => {
                  setEditingBooth(null);
                  setBoothNumber((booths.length + 1).toString());
                  setBoothName('');
                  setVillage(villages[0]?.name || 'Gorebal');
                  setGP(gramPanchayats[0]?.name || 'Gorebal GP');
                  setBuildingName('Government School Hall');
                  setCoordinatorName('');
                  setCoordinatorPhone('');
                  setFormOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add / Update Booth</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <Vote className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">{booths.length}</div>
            <div className="text-xs text-slate-500 font-medium">Total Polling Booths</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">
              {totalVoters.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-500 font-medium">Total Registered Electors</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">100%</div>
            <div className="text-xs text-slate-500 font-medium">Coordinator Coverage</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-amber-700">{sensitiveCount}</div>
            <div className="text-xs text-slate-500 font-medium">Sensitive Monitored</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 w-full sm:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search booth number (e.g. 45), school, village, coordinator..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={filterGP}
            onChange={(e) => setFilterGP(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
          >
            <option value="all">All Gram Panchayats</option>
            {gramPanchayats.map((g) => (
              <option key={g.id} value={g.name}>
                {g.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
          >
            <option value="all">All Types</option>
            <option value="Active">Active Standard</option>
            <option value="Sensitive">Sensitive Monitored</option>
          </select>
        </div>
      </div>

      {/* Booths Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredBooths.map((booth) => (
          <div
            key={booth.id}
            onClick={() => setSelectedBooth(booth)}
            className={`bg-white rounded-xl border p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${
              booth.status === 'Sensitive'
                ? 'border-amber-300 ring-1 ring-amber-400/30'
                : 'border-slate-200 hover:border-indigo-300'
            }`}
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-md bg-indigo-900 text-white shadow-xs">
                    Booth #{String(booth.boothNumber).padStart(3, '0')}
                  </span>
                  {booth.status === 'Sensitive' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      Sensitive
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                      Standard
                    </span>
                  )}
                </div>

                {canEditSettings && (
                  <button
                    onClick={(e) => handleOpenEdit(booth, e)}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                    title="Edit Booth"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Station Name */}
              <h3 className="font-bold text-sm text-slate-900 leading-snug mb-1">
                {booth.boothName}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                <Building className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{booth.buildingName}</span>
              </p>

              {/* Village & GP */}
              <div className="bg-slate-50 rounded-lg p-2 text-xs text-slate-700 border border-slate-100 space-y-1 mb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Village:</span>
                  <span className="font-bold text-slate-900">{booth.village}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gram Panchayat:</span>
                  <span className="font-medium text-slate-700">{booth.gramPanchayat}</span>
                </div>
              </div>

              {/* Electors Breakdown */}
              <div className="grid grid-cols-3 gap-1.5 text-center text-xs mb-3">
                <div className="bg-indigo-50/60 border border-indigo-100 p-1.5 rounded-md">
                  <div className="text-[10px] text-indigo-700 font-semibold">Total</div>
                  <div className="font-bold font-mono text-indigo-950">
                    {booth.votersCount || 850}
                  </div>
                </div>
                <div className="bg-blue-50/60 border border-blue-100 p-1.5 rounded-md">
                  <div className="text-[10px] text-blue-700 font-semibold">Male</div>
                  <div className="font-bold font-mono text-blue-950">
                    {booth.maleVoters || Math.round((booth.votersCount || 850) * 0.51)}
                  </div>
                </div>
                <div className="bg-pink-50/60 border border-pink-100 p-1.5 rounded-md">
                  <div className="text-[10px] text-pink-700 font-semibold">Female</div>
                  <div className="font-bold font-mono text-pink-950">
                    {booth.femaleVoters || Math.round((booth.votersCount || 850) * 0.49)}
                  </div>
                </div>
              </div>

              {/* Coordinator */}
              {booth.coordinatorName && (
                <div className="text-xs text-slate-600 flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 truncate">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-semibold truncate">{booth.coordinatorName}</span>
                  </div>
                  {booth.coordinatorPhone && (
                    <a
                      href={`tel:${booth.coordinatorPhone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] text-indigo-600 font-mono flex items-center gap-1 hover:underline shrink-0"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{booth.coordinatorPhone.slice(-5)}</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-bold">
              <span>View Full Booth Profile</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* Booth Inspector Modal */}
      {selectedBooth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs px-2.5 py-1 rounded bg-indigo-900 text-white">
                    Booth #{String(selectedBooth.boothNumber).padStart(3, '0')}
                  </span>
                  <h2 className="text-base font-bold text-slate-900">
                    {selectedBooth.village} Polling Station
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedBooth.boothName} • GP: {selectedBooth.gramPanchayat}
                </p>
              </div>

              <button
                onClick={() => setSelectedBooth(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Electors Demographics */}
              <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-4">
                <div className="font-bold text-indigo-950 text-xs uppercase tracking-wider mb-2">
                  Voter Roll Statistics (AC-58 Electoral Registry)
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-2xs">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Electors</div>
                    <div className="text-lg font-bold font-mono text-indigo-900">
                      {selectedBooth.votersCount || 850}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-2xs">
                    <div className="text-[10px] text-blue-500 font-semibold uppercase">Male Electors</div>
                    <div className="text-lg font-bold font-mono text-blue-900">
                      {selectedBooth.maleVoters || Math.round((selectedBooth.votersCount || 850) * 0.51)}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-2xs">
                    <div className="text-[10px] text-pink-500 font-semibold uppercase">Female Electors</div>
                    <div className="text-lg font-bold font-mono text-pink-900">
                      {selectedBooth.femaleVoters || Math.round((selectedBooth.votersCount || 850) * 0.49)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Organization & Booth Team */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Designated Booth Team &amp; In-Charge
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                      BC
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">
                        {selectedBooth.coordinatorName || 'Basavaraj Patil'}
                      </div>
                      <div className="text-[11px] text-slate-500">Booth Coordinator (In-Charge)</div>
                    </div>
                  </div>
                  {selectedBooth.coordinatorPhone && (
                    <a
                      href={`tel:${selectedBooth.coordinatorPhone}`}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Coordinator</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                  <span>Registered Cadre Volunteers:</span>
                  <span className="font-bold text-slate-900">
                    {selectedBooth.volunteersCount || 6} Cadre Volunteers
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                  <span>Last Inspection / Visit:</span>
                  <span className="font-semibold text-indigo-700">
                    {selectedBooth.lastFieldVisitDate || '2025-02-18'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => {
                    const vil = selectedBooth.village;
                    setSelectedBooth(null);
                    onNavigate('map', vil);
                  }}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Inspect on Constituency Map</span>
                </button>

                <button
                  onClick={() => {
                    const vil = selectedBooth.village;
                    setSelectedBooth(null);
                    onNavigate('issues', vil);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>View Booth Issues</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                {editingBooth ? `Edit Booth #${editingBooth.boothNumber}` : 'Add New Polling Booth'}
              </h2>
              <button
                onClick={() => setFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBooth} className="p-4 sm:p-6 overflow-y-auto space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Booth Number *</label>
                  <input
                    type="number"
                    value={boothNumber}
                    onChange={(e) => setBoothNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  >
                    <option value="Active">Active Standard</option>
                    <option value="Sensitive">Sensitive Monitored</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Polling Station Name *
                </label>
                <input
                  type="text"
                  value={boothName}
                  onChange={(e) => setBoothName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-semibold"
                  placeholder="e.g. Government Higher Primary School (South Wing)"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Village</label>
                  <select
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
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
                  <select
                    value={gp}
                    onChange={(e) => setGP(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  >
                    {gramPanchayats.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Building &amp; Room Details
                </label>
                <input
                  type="text"
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  placeholder="e.g. Room No. 2, Main Block"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Voters</label>
                  <input
                    type="number"
                    value={votersCount}
                    onChange={(e) => setVotersCount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Male Voters</label>
                  <input
                    type="number"
                    value={maleVoters}
                    onChange={(e) => setMaleVoters(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Female Voters</label>
                  <input
                    type="number"
                    value={femaleVoters}
                    onChange={(e) => setFemaleVoters(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Coordinator Name
                  </label>
                  <input
                    type="text"
                    value={coordinatorName}
                    onChange={(e) => setCoordinatorName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-semibold"
                    placeholder="e.g. Basavaraj Patil"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Coordinator Phone
                  </label>
                  <input
                    type="tel"
                    value={coordinatorPhone}
                    onChange={(e) => setCoordinatorPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
                    placeholder="+91 94480 00000"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                >
                  Save Booth
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
