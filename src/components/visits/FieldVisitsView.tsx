import React, { useState, useMemo } from 'react';
import {
  Compass,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Edit2,
  Trash2,
  X,
  List,
  CalendarDays,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { FieldVisit, Village, Issue } from '../../types';
import { StorageService } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/Badge';

interface FieldVisitsViewProps {
  fieldVisits?: FieldVisit[];
  villages?: Village[];
  issues?: Issue[];
  onOpenIssue?: (issueId: string) => void;
}

export const FieldVisitsView: React.FC<FieldVisitsViewProps> = ({
  fieldVisits = [],
  villages = [],
  issues = [],
  onOpenIssue,
}) => {
  const { currentUser, canCreateIssue } = useAuth();

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterVillage, setFilterVillage] = useState<string>('all');

  // Selected visit for detailed modal
  const [selectedVisit, setSelectedVisit] = useState<FieldVisit | null>(null);

  // Form Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<FieldVisit | null>(null);

  // Form inputs
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [village, setVillage] = useState(villages[0]?.name || 'Gorebal');
  const [purpose, setPurpose] = useState('');
  const [status, setStatus] = useState<'Planned' | 'Completed' | 'Cancelled'>('Planned');
  const [attendees, setAttendees] = useState('');
  const [keyObservations, setKeyObservations] = useState('');
  const [actionItems, setActionItems] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);

  const handleOpenCreate = () => {
    setEditingVisit(null);
    setDate(new Date().toISOString().slice(0, 10));
    setVillage(villages[0]?.name || 'Gorebal');
    setPurpose('');
    setStatus('Planned');
    setAttendees(`${currentUser.name} (${currentUser.role}), PWD AEE, Gram Panchayat President`);
    setKeyObservations('');
    setActionItems('');
    setFollowUpRequired(false);
    setFollowUpDate('');
    setSelectedIssues([]);
    setFormOpen(true);
  };

  const handleOpenEdit = (v: FieldVisit, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingVisit(v);
    setDate(v.date);
    setVillage(v.village);
    setPurpose(v.purpose);
    setStatus(v.status);
    setAttendees(v.attendees?.join(', ') || v.team?.join(', ') || '');
    setKeyObservations(v.keyObservations || v.notes || '');
    setActionItems(v.actionItems?.join('\n') || '');
    setFollowUpRequired(v.followUpRequired ?? !!v.followUpDate);
    setFollowUpDate(v.followUpDate || '');
    setSelectedIssues(v.issuesInspected || v.issuesFound || []);
    setFormOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this field visit log?')) {
      StorageService.deleteFieldVisit(id);
      if (selectedVisit?.id === id) setSelectedVisit(null);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim() || !village) return;

    const id = editingVisit ? editingVisit.id : `FV-2025-${Math.floor(100 + Math.random() * 900)}`;
    const teamList = attendees.split(',').map((a) => a.trim()).filter(Boolean);

    const newVisit: FieldVisit = {
      id,
      date,
      time: '11:00 AM',
      team: teamList,
      village,
      purpose: purpose.trim(),
      issuesFound: selectedIssues,
      notes: keyObservations.trim(),
      issuesInspected: selectedIssues,
      attendees: teamList,
      keyObservations: keyObservations.trim() || undefined,
      actionItems: actionItems.split('\n').map((a) => a.trim()).filter(Boolean),
      followUpRequired,
      followUpDate: followUpRequired ? followUpDate : undefined,
      status,
      photos: editingVisit ? editingVisit.photos : [],
    };

    StorageService.saveFieldVisit(newVisit);
    setFormOpen(false);
    if (selectedVisit?.id === id) setSelectedVisit(newVisit);
  };

  // Filter
  const filteredVisits = useMemo(() => {
    return fieldVisits.filter((v) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          v.purpose.toLowerCase().includes(q) ||
          v.village.toLowerCase().includes(q) ||
          (v.keyObservations && v.keyObservations.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (filterStatus !== 'all' && v.status !== filterStatus) return false;
      if (filterVillage !== 'all' && v.village !== filterVillage) return false;
      return true;
    });
  }, [fieldVisits, searchQuery, filterStatus, filterVillage]);

  return (
    <div className="space-y-4 pb-12">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Constituency Field Visits
            </h1>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
              {filteredVisits.length} Logs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            On-ground MLA &amp; staff inspection tours, grievance verifications &amp; action directives.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md ${
                viewMode === 'list' ? 'bg-white shadow-xs text-slate-800' : 'text-slate-500'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded-md ${
                viewMode === 'calendar' ? 'bg-white shadow-xs text-slate-800' : 'text-slate-500'
              }`}
              title="Calendar Schedule"
            >
              <CalendarDays className="w-3.5 h-3.5" />
            </button>
          </div>

          {canCreateIssue && (
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Schedule Visit
            </button>
          )}
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
            placeholder="Search purpose, village, observations..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800"
          >
            <option value="all">All Statuses</option>
            <option value="Planned">Planned</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={filterVillage}
            onChange={(e) => setFilterVillage(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 max-w-[160px] truncate"
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

      {/* Main Content */}
      {filteredVisits.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          No field visits found matching criteria.
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredVisits.map((v) => (
            <div
              key={v.id}
              onClick={() => setSelectedVisit(v)}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    {v.id}
                  </span>
                  <StatusBadge status={v.status} />
                  {v.followUpRequired && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Follow-up Required
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {v.purpose}
                </h3>

                <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                    {v.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {v.village}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {(v.attendees?.length ?? v.team?.length ?? 0)} Attendees
                  </span>
                  {(v.issuesInspected?.length ?? v.issuesFound?.length ?? 0) > 0 && (
                    <span className="text-indigo-600 font-medium">
                      {(v.issuesInspected?.length ?? v.issuesFound?.length ?? 0)} Grievances Inspected
                    </span>
                  )}
                </div>

                {(v.keyObservations || v.notes) && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2">
                    <strong>Observations:</strong> {v.keyObservations || v.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                  onClick={(e) => handleOpenEdit(v, e)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                  title="Edit visit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleDelete(v.id, e)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100"
                  title="Delete visit"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Calendar view */
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="font-bold text-xs text-slate-700 uppercase mb-3">
            Chronological Visit Calendar
          </div>
          <div className="space-y-4">
            {filteredVisits
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((v) => (
                <div
                  key={v.id}
                  onClick={() => setSelectedVisit(v)}
                  className="flex gap-4 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="w-24 text-center shrink-0 border-r border-slate-200 pr-3">
                    <div className="text-xs font-bold text-indigo-700">
                      {new Date(v.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {new Date(v.date).getFullYear()}
                    </div>
                    <span className="inline-block mt-1">
                      <StatusBadge status={v.status} />
                    </span>
                  </div>

                  <div className="flex-1 text-xs">
                    <h4 className="font-bold text-slate-900">{v.purpose}</h4>
                    <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      Village: {v.village}
                    </div>
                    {(v.actionItems?.length ?? 0) > 0 && (
                      <div className="text-[11px] text-slate-600 mt-1">
                        <strong>Directives:</strong> {(v.actionItems || []).join('; ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Field Visit Detail Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    {selectedVisit.id}
                  </span>
                  <StatusBadge status={selectedVisit.status} />
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  {selectedVisit.purpose}
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  {selectedVisit.village} • Visited on {selectedVisit.date}
                </div>
              </div>
              <button
                onClick={() => setSelectedVisit(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Attendees */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-700 uppercase text-[10px] mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  Inspection Team &amp; Attendees
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedVisit.attendees || selectedVisit.team || []).map((att, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-medium text-[11px]"
                    >
                      {att}
                    </span>
                  ))}
                </div>
              </div>

              {/* Key Observations */}
              {(selectedVisit.keyObservations || selectedVisit.notes) && (
                <div>
                  <h4 className="font-bold text-slate-700 uppercase text-[10px] mb-1">
                    Key Observations
                  </h4>
                  <p className="text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 whitespace-pre-wrap">
                    {selectedVisit.keyObservations || selectedVisit.notes}
                  </p>
                </div>
              )}

              {/* Action items */}
              {(selectedVisit.actionItems?.length ?? 0) > 0 && (
                <div>
                  <h4 className="font-bold text-slate-700 uppercase text-[10px] mb-1.5">
                    Directives &amp; Action Items
                  </h4>
                  <ul className="space-y-1.5">
                    {(selectedVisit.actionItems || []).map((item, idx) => (
                      <li
                        key={idx}
                        className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-900 flex items-start gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Inspected Issues */}
              {(selectedVisit.issuesInspected?.length ?? selectedVisit.issuesFound?.length ?? 0) > 0 && (
                <div>
                  <h4 className="font-bold text-slate-700 uppercase text-[10px] mb-1.5">
                    Grievances Inspected On Site
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedVisit.issuesInspected || selectedVisit.issuesFound || []).map((issueId) => (
                      <button
                        key={issueId}
                        onClick={() => {
                          setSelectedVisit(null);
                          if (onOpenIssue) onOpenIssue(issueId);
                        }}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-mono font-bold rounded-lg border border-indigo-200"
                      >
                        {issueId} &rarr;
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedVisit(null)}
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
                {editingVisit ? 'Edit Field Visit' : 'Schedule New Field Visit'}
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
                  <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Village *</label>
                  <select
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
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
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Visit Purpose *</label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="E.g. Inspection of road widening & RO plant"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  >
                    <option value="Planned">Planned</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Attendees (comma separated)</label>
                  <input
                    type="text"
                    value={attendees}
                    onChange={(e) => setAttendees(e.target.value)}
                    placeholder="MLA, PWD AEE, GP President"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Key Observations</label>
                <textarea
                  rows={2}
                  value={keyObservations}
                  onChange={(e) => setKeyObservations(e.target.value)}
                  placeholder="Status of works on ground, public grievances noted..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Directives &amp; Action Items (one per line)
                </label>
                <textarea
                  rows={2}
                  value={actionItems}
                  onChange={(e) => setActionItems(e.target.value)}
                  placeholder="Instructed contractor to complete drainage by 15th..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="followUpCheck"
                  checked={followUpRequired}
                  onChange={(e) => setFollowUpRequired(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="followUpCheck" className="font-semibold text-slate-700">
                  Follow-up Inspection Required
                </label>
              </div>

              {followUpRequired && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Follow-up Date</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
              )}

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
                  Save Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
