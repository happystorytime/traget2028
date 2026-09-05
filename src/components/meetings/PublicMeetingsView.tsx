import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Search,
  CheckCircle2,
  FileText,
  Printer,
  Edit2,
  Trash2,
  X,
  Building,
} from 'lucide-react';
import { PublicMeeting, Village, MeetingFollowUpAction } from '../../types';
import { StorageService } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/Badge';

interface PublicMeetingsViewProps {
  publicMeetings?: PublicMeeting[];
  villages?: Village[];
}

export const PublicMeetingsView: React.FC<PublicMeetingsViewProps> = ({
  publicMeetings = [],
  villages = [],
}) => {
  const { currentUser, canCreateIssue } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterVillage, setFilterVillage] = useState<string>('all');

  // Active Meeting Inspector / MOM view
  const [selectedMeeting, setSelectedMeeting] = useState<PublicMeeting | null>(null);

  // Form Modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<PublicMeeting | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('10:30 AM');
  const [village, setVillage] = useState(villages[0]?.name || 'Gorebal');
  const [location, setLocation] = useState('Gram Panchayat Hall');
  const [purpose, setPurpose] = useState('');
  const [agenda, setAgenda] = useState('');
  const [attendeesCount, setAttendeesCount] = useState('120');
  const [keyIssuesDiscussed, setKeyIssuesDiscussed] = useState('');
  const [decisionsMade, setDecisionsMade] = useState('');
  const [followUpActions, setFollowUpActions] = useState('');
  const [status, setStatus] = useState<'Scheduled' | 'Completed' | 'Cancelled'>('Scheduled');

  const handleOpenCreate = () => {
    setEditingMeeting(null);
    setTitle('');
    setDate(new Date().toISOString().slice(0, 10));
    setTime('10:30 AM');
    setVillage(villages[0]?.name || 'Gorebal');
    setLocation('Gram Panchayat Meeting Hall');
    setPurpose('Public Grievance Redressal & Janaspandana');
    setAgenda('1. Review of drinking water pipelines\n2. New bus stop shelter request\n3. Crop insurance claims');
    setAttendeesCount('100');
    setKeyIssuesDiscussed('');
    setDecisionsMade('');
    setFollowUpActions('');
    setStatus('Scheduled');
    setFormOpen(true);
  };

  const handleOpenEdit = (m: PublicMeeting, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingMeeting(m);
    setTitle(m.title);
    setDate(m.date);
    setTime(m.time);
    setVillage(m.village);
    setLocation(m.location);
    setPurpose(m.purpose || m.title);
    setAgenda(
      typeof m.agenda === 'string'
        ? m.agenda
        : Array.isArray(m.agenda)
        ? (m.agenda as string[]).join('\n')
        : ''
    );
    setAttendeesCount(
      m.attendeesCount?.toString() ||
        (typeof m.participants === 'number'
          ? m.participants.toString()
          : (m.participants as string) || '0')
    );
    setKeyIssuesDiscussed(
      m.keyIssuesDiscussed?.join('\n') || m.issuesDiscussed?.join('\n') || ''
    );
    setDecisionsMade(
      m.decisionsMade?.join('\n') || (typeof m.decisions === 'string' ? m.decisions : '')
    );
    setFollowUpActions(
      m.followUpActions
        ? Array.isArray(m.followUpActions)
          ? m.followUpActions
              .map((f: any) => (typeof f === 'string' ? f : f.action))
              .join('\n')
          : ''
        : ''
    );
    setStatus((m.status as any) || 'Scheduled');
    setFormOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this meeting record?')) {
      StorageService.deletePublicMeeting(id);
      if (selectedMeeting?.id === id) setSelectedMeeting(null);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !village) return;

    const id = editingMeeting ? editingMeeting.id : `PM-2025-${Math.floor(100 + Math.random() * 900)}`;
    const parsedFollowUps: MeetingFollowUpAction[] = followUpActions
      .split('\n')
      .map((a) => a.trim())
      .filter(Boolean)
      .map((act, idx) => ({
        id: `act-${idx}`,
        action: act,
        assignedTo: 'Nodal Officer',
        dueDate: '2025-04-15',
        completed: false,
      }));

    const newMeeting: PublicMeeting = {
      id,
      title: title.trim(),
      date,
      time,
      village,
      location: location.trim(),
      purpose: purpose.trim(),
      agenda: agenda.trim(),
      participants: parseInt(attendeesCount, 10) || 0,
      issuesDiscussed: keyIssuesDiscussed.split('\n').map((a) => a.trim()).filter(Boolean),
      decisions: decisionsMade.trim(),
      followUpActions: parsedFollowUps,
      photos: editingMeeting ? editingMeeting.photos : [],
      documents: editingMeeting ? editingMeeting.documents : [],
      attendeesCount: parseInt(attendeesCount, 10) || 0,
      keyIssuesDiscussed: keyIssuesDiscussed.split('\n').map((a) => a.trim()).filter(Boolean),
      decisionsMade: decisionsMade.split('\n').map((a) => a.trim()).filter(Boolean),
      status,
    };

    StorageService.savePublicMeeting(newMeeting);
    setFormOpen(false);
    if (selectedMeeting?.id === id) setSelectedMeeting(newMeeting);
  };

  const filteredMeetings = useMemo(() => {
    return publicMeetings.filter((m) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          m.title.toLowerCase().includes(q) ||
          m.village.toLowerCase().includes(q) ||
          (m.purpose && m.purpose.toLowerCase().includes(q)) ||
          (m.location && m.location.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (filterStatus !== 'all' && m.status !== filterStatus) return false;
      if (filterVillage !== 'all' && m.village !== filterVillage) return false;
      return true;
    });
  }, [publicMeetings, searchQuery, filterStatus, filterVillage]);

  return (
    <div className="space-y-4 pb-12">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Public Meetings &amp; Town Halls
            </h1>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
              {filteredMeetings.length} Sessions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Janaspandana, Gram Sabha dialogues, citizen agendas &amp; official minutes of meetings (MOM).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canCreateIssue && (
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Schedule Meeting
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
            placeholder="Search meeting title, agenda, village, location..."
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
            <option value="Scheduled">Scheduled</option>
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

      {/* Meetings Grid */}
      {filteredMeetings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          No public meetings found matching criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredMeetings.map((m) => (
            <div
              key={m.id}
              onClick={() => setSelectedMeeting(m)}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    {m.id}
                  </span>
                  <StatusBadge status={m.status} />
                </div>

                <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">
                  {m.title}
                </h3>
                <p className="text-xs text-slate-500 mb-3">{m.purpose}</p>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {m.date} at {m.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {m.village} ({m.location})
                    </span>
                  </div>
                  {(m.attendeesCount || m.participants) && (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{m.attendeesCount || m.participants} Citizens Attended</span>
                    </div>
                  )}
                </div>

                {Boolean(m.agenda) && (
                  <div className="mt-3 bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] text-slate-600 line-clamp-2">
                    <span className="font-semibold text-slate-700">Agenda:</span>{' '}
                    {typeof m.agenda === 'string'
                      ? m.agenda
                      : Array.isArray(m.agenda)
                      ? (m.agenda as string[]).join(' • ')
                      : ''}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-indigo-600 font-semibold flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> View MOM
                </span>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleOpenEdit(m, e)}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                    title="Edit meeting"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(m.id, e)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                    title="Delete meeting"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Meeting Detail & MOM View Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    {selectedMeeting.id}
                  </span>
                  <StatusBadge status={selectedMeeting.status} />
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  {selectedMeeting.title}
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  {selectedMeeting.village} • {selectedMeeting.location} • {selectedMeeting.date} ({selectedMeeting.time})
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg"
                  title="Print Minutes of Meeting"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedMeeting(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Meeting Details Card */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-semibold text-[10px] uppercase">Purpose</span>
                  <div className="text-slate-800 font-medium">{selectedMeeting.purpose}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold text-[10px] uppercase">Citizen Attendance</span>
                  <div className="text-slate-800 font-medium">{selectedMeeting.attendeesCount || 0} Citizens</div>
                </div>
              </div>

              {/* Agenda */}
              <div>
                <h4 className="font-bold text-slate-700 uppercase text-[10px] mb-1.5">
                  Meeting Agenda
                </h4>
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {typeof selectedMeeting.agenda === 'string' ? (
                    <div className="text-slate-700 whitespace-pre-wrap">{selectedMeeting.agenda}</div>
                  ) : (
                    (selectedMeeting.agenda || []).map((item, idx) => (
                      <div key={idx} className="text-slate-700">
                        {item}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Key Issues Discussed */}
              {((selectedMeeting.keyIssuesDiscussed?.length ?? selectedMeeting.issuesDiscussed?.length ?? 0) > 0) && (
                <div>
                  <h4 className="font-bold text-slate-700 uppercase text-[10px] mb-1.5">
                    Issues &amp; Grievances Raised by Citizens
                  </h4>
                  <ul className="space-y-1.5">
                    {(selectedMeeting.keyIssuesDiscussed || selectedMeeting.issuesDiscussed || []).map((issue, idx) => (
                      <li
                        key={idx}
                        className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200 text-blue-900"
                      >
                        • {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Decisions Made */}
              {Boolean(selectedMeeting.decisionsMade?.length || selectedMeeting.decisions) && (
                <div>
                  <h4 className="font-bold text-slate-700 uppercase text-[10px] mb-1.5">
                    Decisions &amp; Resolutions Adopted
                  </h4>
                  <ul className="space-y-1.5">
                    {(selectedMeeting.decisionsMade || (selectedMeeting.decisions ? [selectedMeeting.decisions] : [])).map((dec, idx) => (
                      <li
                        key={idx}
                        className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-900 flex items-start gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{dec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Follow-up actions */}
              {((selectedMeeting.followUpActions?.length ?? 0) > 0) && (
                <div>
                  <h4 className="font-bold text-slate-700 uppercase text-[10px] mb-1.5">
                    Departmental Action Directives
                  </h4>
                  <ul className="space-y-1.5">
                    {(selectedMeeting.followUpActions || []).map((act: any, idx) => (
                      <li
                        key={idx}
                        className="p-2.5 rounded-lg bg-purple-50/60 border border-purple-200 text-purple-900"
                      >
                        &rarr;{' '}
                        {typeof act === 'string'
                          ? act
                          : `${act.action || ''} (${act.assignedTo || 'Nodal Officer'} - Due: ${act.dueDate || 'Scheduled'})`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Official Minutes of Meeting Record</span>
              <button
                onClick={() => setSelectedMeeting(null)}
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
                {editingMeeting ? 'Edit Meeting Details' : 'Schedule New Public Meeting'}
              </h3>
              <button
                onClick={() => setFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Meeting Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g. Gorebal Janaspandana Grievance Redressal"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  required
                />
              </div>

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
                  <label className="block font-semibold text-slate-700 mb-1">Time</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="10:30 AM"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
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
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location / Venue</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="E.g. Gram Panchayat Hall"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Attendance</label>
                  <input
                    type="number"
                    value={attendeesCount}
                    onChange={(e) => setAttendeesCount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Agenda (one per line)</label>
                <textarea
                  rows={2}
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  placeholder="1. Canal water distribution..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Key Issues Raised</label>
                <textarea
                  rows={2}
                  value={keyIssuesDiscussed}
                  onChange={(e) => setKeyIssuesDiscussed(e.target.value)}
                  placeholder="Low water pressure in Ward 3..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Decisions Made</label>
                <textarea
                  rows={2}
                  value={decisionsMade}
                  onChange={(e) => setDecisionsMade(e.target.value)}
                  placeholder="Sanctioned ₹5L for pipeline repairs..."
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
                  Save Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
