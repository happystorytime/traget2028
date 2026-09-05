import React, { useState, useMemo } from 'react';
import {
  Video,
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Search,
  CheckCircle2,
  Shield,
  Phone,
  Share2,
  Edit2,
  Trash2,
  Sparkles,
  ExternalLink,
  Building,
  UserCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { VillageVideoConference, Village, VideoConferenceStatus } from '../../types';
import { StorageService } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { LiveVideoRoomModal } from './LiveVideoRoomModal';
import { FixVideoConferenceModal } from './FixVideoConferenceModal';
import { ALL_124_VILLAGES } from '../../data/officialVillages';

interface VillageVideoConferencesViewProps {
  villages?: Village[];
  onNavigateToVillage?: (villageName: string) => void;
}

export const VillageVideoConferencesView: React.FC<VillageVideoConferencesViewProps> = ({
  villages = [],
  onNavigateToVillage,
}) => {
  const { currentUser, isAdmin, isVillageHead, canFixVillageVideoConference } = useAuth();

  // Storage data
  const [conferences, setConferences] = useState<VillageVideoConference[]>(() =>
    StorageService.getVideoConferences()
  );

  // Modals state
  const [activeRoomConference, setActiveRoomConference] = useState<VillageVideoConference | null>(null);
  const [fixModalOpen, setFixModalOpen] = useState(false);
  const [editingConference, setEditingConference] = useState<VillageVideoConference | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | VideoConferenceStatus>('All');
  const [villageFilter, setVillageFilter] = useState<string>('All');
  const [showAllHeadsDirectory, setShowAllHeadsDirectory] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  // Refresh data helper
  const reloadConferences = () => {
    setConferences(StorageService.getVideoConferences());
  };

  // Filter conferences
  const filteredConferences = useMemo(() => {
    return conferences.filter((c) => {
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (villageFilter !== 'All' && c.village !== villageFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          c.village.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.fixedByVillageHead.toLowerCase().includes(q) ||
          (c.agenda && c.agenda.toLowerCase().includes(q)) ||
          (c.departmentInvited && c.departmentInvited.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [conferences, statusFilter, villageFilter, searchQuery]);

  // Handle WhatsApp / link share
  const handleShareInvite = (c: VillageVideoConference) => {
    const inviteText = `*Village Video Conference - ${c.village}*\nFixed by Village Head: ${c.fixedByVillageHead} (${c.villageHeadPhone || ''})\nDate & Time: ${c.date} at ${c.time}\nAgenda: ${c.agenda}\nDirect Video Meeting Link: ${c.meetingLink}\n\nAll village members, cadre workers, and concerned department officers are requested to join.`;
    navigator.clipboard.writeText(inviteText);
    setCopiedInviteId(c.id);
    setTimeout(() => setCopiedInviteId(null), 2500);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to cancel and delete this video conference record?')) {
      StorageService.deleteVideoConference(id, currentUser);
      reloadConferences();
    }
  };

  // Stats calculation
  const totalCount = conferences.length;
  const liveCount = conferences.filter((c) => c.status === 'Live').length;
  const scheduledCount = conferences.filter((c) => c.status === 'Scheduled').length;
  const completedCount = conferences.filter((c) => c.status === 'Completed').length;

  return (
    <div className="space-y-4">
      
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-4 sm:p-6 border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Village Head Direct Governance • Sindhanur AC-58</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Village-Wise Video Conferences
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Every village has a designated Village Head with authority to fix virtual conferences, summon department nodal officers, and address community grievances in real time.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canFixVillageVideoConference && (
              <button
                onClick={() => {
                  setEditingConference(null);
                  setFixModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Fix Video Conference</span>
              </button>
            )}
          </div>
        </div>

        {/* Role Highlight Bar */}
        {isVillageHead && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-amber-500/10 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 p-3 sm:px-6">
            <div className="flex items-center gap-2 text-amber-300">
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Logged in as <strong>{currentUser.name}</strong> (Village Head of <strong>{currentUser.village || 'Alabanoor'}</strong>).
              </span>
            </div>
            <span className="text-[11px] text-amber-200/80 font-mono">
              Meeting Fixer Permissions Active
            </span>
          </div>
        )}
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">{totalCount}</div>
            <div className="text-xs text-slate-500 font-medium">Total Fixed Conferences</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-ping"></span>
          </div>
          <div>
            <div className="text-xl font-extrabold text-red-600">{liveCount}</div>
            <div className="text-xs text-slate-500 font-medium">Live Now (In Sabha)</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">{scheduledCount}</div>
            <div className="text-xs text-slate-500 font-medium">Scheduled Ahead</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">{completedCount}</div>
            <div className="text-xs text-slate-500 font-medium">Completed &amp; Resolved</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'Live', 'Scheduled', 'Completed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? st === 'Live'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {st === 'Live' ? '🔴 Live Now' : st}
            </button>
          ))}
        </div>

        {/* Search & Village Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md justify-end">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search village, title, or head..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <select
            value={villageFilter}
            onChange={(e) => setVillageFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
          >
            <option value="All">All 124 Villages</option>
            {ALL_124_VILLAGES.slice(0, 30).map((v) => (
              <option key={v.villageCode} value={v.name}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Video Conferences Cards Grid */}
      {filteredConferences.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <Video className="w-12 h-12 text-slate-400 mx-auto mb-3 stroke-[1.5]" />
          <h3 className="text-sm font-bold text-slate-800 mb-1">No video conferences found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            No virtual conferences match your current search or status filters.
          </p>
          {canFixVillageVideoConference && (
            <button
              onClick={() => {
                setEditingConference(null);
                setFixModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Fix First Video Conference</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredConferences.map((conf) => (
            <div
              key={conf.id}
              className={`bg-white rounded-xl border shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden ${
                conf.status === 'Live'
                  ? 'border-red-300 ring-2 ring-red-500/20'
                  : 'border-slate-200'
              }`}
            >
              {/* Card Top */}
              <div className="p-4 space-y-3">
                
                {/* Status + Village Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-extrabold text-sm text-slate-900 truncate">
                      {conf.village}
                    </span>
                    {conf.gramPanchayat && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-medium truncate">
                        {conf.gramPanchayat}
                      </span>
                    )}
                  </div>

                  {conf.status === 'Live' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 animate-pulse whitespace-nowrap">
                      <span className="w-2 h-2 rounded-full bg-red-600"></span>
                      LIVE SABHA
                    </span>
                  ) : conf.status === 'Completed' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                      Scheduled
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">
                  {conf.title}
                </h3>

                {/* Village Head Badge */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-900 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700 flex items-center gap-1">
                      <Shield className="w-3 h-3 text-amber-600" />
                      Fixed by Village Head
                    </span>
                    {conf.villageHeadPhone && (
                      <span className="text-[10px] text-amber-700 font-mono">
                        {conf.villageHeadPhone}
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-amber-950 text-xs">
                    {conf.fixedByVillageHead}
                  </div>
                </div>

                {/* Date & Time Info */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{conf.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{conf.time}</span>
                  </div>
                </div>

                {/* Department & MLA Office attendance */}
                <div className="space-y-1 text-xs">
                  {conf.departmentInvited && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Building className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span className="truncate">{conf.departmentInvited}</span>
                    </div>
                  )}
                  {conf.mlaOfficeAttending && (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>MLA Office Representation Confirmed</span>
                    </div>
                  )}
                </div>

                {/* Agenda snippet */}
                {conf.agenda && (
                  <div className="text-[11px] text-slate-500 line-clamp-2 bg-white rounded border border-slate-100 p-1.5 italic">
                    "{conf.agenda}"
                  </div>
                )}

              </div>

              {/* Card Footer Actions */}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setActiveRoomConference(conf)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                    conf.status === 'Live'
                      ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{conf.status === 'Live' ? 'Enter Live Sabha' : 'Join Video Call'}</span>
                </button>

                <button
                  onClick={() => handleShareInvite(conf)}
                  className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs transition-colors"
                  title="Share WhatsApp Invite"
                >
                  {copiedInviteId === conf.id ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Share2 className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {(isAdmin || isVillageHead) && (
                  <>
                    <button
                      onClick={() => {
                        setEditingConference(conf);
                        setFixModalOpen(true);
                      }}
                      className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs transition-colors"
                      title="Edit / Reschedule"
                    >
                      <Edit2 className="w-4 h-4 text-slate-500" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={(e) => handleDelete(conf.id, e)}
                        className="p-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Collapsible: Official 124 Village Heads Directory */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <button
          onClick={() => setShowAllHeadsDirectory(!showAllHeadsDirectory)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                Official Village Heads Directory (All 124 Villages)
              </div>
              <p className="text-xs text-slate-500">
                Browse each village's designated head, phone contact, and schedule a video conference directly.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
            {showAllHeadsDirectory ? 'Hide Directory' : 'View All 124 Heads'}
            <ChevronRight className={`w-4 h-4 transition-transform ${showAllHeadsDirectory ? 'rotate-90' : ''}`} />
          </span>
        </button>

        {showAllHeadsDirectory && (
          <div className="border-t border-slate-200 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-96 overflow-y-auto pr-1">
              {ALL_124_VILLAGES.map((vil) => (
                <div
                  key={vil.villageCode}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">
                      {vil.name}
                    </div>
                    <div className="text-[11px] text-amber-800 font-semibold truncate">
                      👤 {vil.villageHead.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      📞 {vil.villageHead.phone}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEditingConference(null);
                      setFixModalOpen(true);
                    }}
                    className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-semibold text-[10px] shrink-0 transition-colors"
                  >
                    Fix Call
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Live Video Call Room Modal */}
      {activeRoomConference && (
        <LiveVideoRoomModal
          isOpen={!!activeRoomConference}
          onClose={() => setActiveRoomConference(null)}
          conference={activeRoomConference}
          onConferenceUpdated={(updated) => {
            setActiveRoomConference(updated);
            reloadConferences();
          }}
        />
      )}

      {/* Fix Video Conference Modal */}
      {fixModalOpen && (
        <FixVideoConferenceModal
          isOpen={fixModalOpen}
          onClose={() => {
            setFixModalOpen(false);
            setEditingConference(null);
          }}
          editConference={editingConference}
          villages={villages}
          onSaved={() => {
            reloadConferences();
          }}
        />
      )}

    </div>
  );
};
