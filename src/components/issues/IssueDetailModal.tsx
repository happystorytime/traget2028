import React, { useState } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Phone,
  User,
  Building,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Paperclip,
  Printer,
  Edit2,
  Trash2,
  Send,
  History,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Issue, IssueStatus, User as UserType } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { StorageService } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';

interface IssueDetailModalProps {
  issue: Issue | null;
  onClose: () => void;
  onEdit: (issue: Issue) => void;
  onDelete: (issueId: string) => void;
}

export const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  issue,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { currentUser, canAssignIssue, canDeleteIssue, allUsers } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'comments' | 'attachments'>('details');

  // Status Change State
  const [statusChangeOpen, setStatusChangeOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<IssueStatus>('In Progress');
  const [statusNote, setStatusNote] = useState('');
  const [resolutionText, setResolutionText] = useState('');

  // Assignment State
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');

  if (!issue) return null;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      id: `c-${Date.now()}`,
      author: currentUser.name,
      authorRole: currentUser.role,
      text: commentText.trim(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    const newTimelineEntry = {
      id: `t-${Date.now()}`,
      timestamp: newComment.timestamp,
      author: currentUser.name,
      title: 'Comment Added',
      description: commentText.trim(),
      type: 'comment' as const,
    };

    const updatedIssue: Issue = {
      ...issue,
      comments: [...issue.comments, newComment],
      timeline: [...issue.timeline, newTimelineEntry],
      lastUpdated: newComment.timestamp,
    };

    StorageService.saveIssue(updatedIssue, currentUser, `Added comment to ${issue.id}`);
    setCommentText('');
  };

  const handleStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const historyEntry = {
      from: issue.status,
      to: newStatus,
      changedBy: currentUser.name,
      timestamp,
      note: statusNote.trim() || undefined,
    };

    const timelineEntry = {
      id: `t-${Date.now()}`,
      timestamp,
      author: currentUser.name,
      title: `Status Changed to ${newStatus}`,
      description: statusNote.trim() || `Status updated from ${issue.status} to ${newStatus}`,
      type: (newStatus === 'Resolved' ? 'resolution' : 'status_change') as any,
    };

    const updatedIssue: Issue = {
      ...issue,
      status: newStatus,
      lastUpdated: timestamp,
      statusHistory: [...issue.statusHistory, historyEntry],
      timeline: [...issue.timeline, timelineEntry],
      resolvedDate: newStatus === 'Resolved' ? timestamp.slice(0, 10) : issue.resolvedDate,
      resolutionDetails: newStatus === 'Resolved' ? (resolutionText.trim() || issue.resolutionDetails) : issue.resolutionDetails,
    };

    StorageService.saveIssue(
      updatedIssue,
      currentUser,
      `Status updated to ${newStatus} for ${issue.id}`
    );
    setStatusChangeOpen(false);
    setStatusNote('');
    setResolutionText('');
  };

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const assignEntry = {
      fromStaff: issue.assignedStaff || 'Unassigned',
      toStaff: selectedStaff,
      assignedBy: currentUser.name,
      timestamp,
    };

    const timelineEntry = {
      id: `t-${Date.now()}`,
      timestamp,
      author: currentUser.name,
      title: `Assigned to ${selectedStaff}`,
      description: `Grievance handed over to ${selectedStaff} by ${currentUser.name}`,
      type: 'assignment' as const,
    };

    const updatedIssue: Issue = {
      ...issue,
      assignedStaff: selectedStaff,
      status: issue.status === 'New' ? 'Assigned' : issue.status,
      lastUpdated: timestamp,
      assignmentHistory: [...issue.assignmentHistory, assignEntry],
      timeline: [...issue.timeline, timelineEntry],
    };

    StorageService.saveIssue(
      updatedIssue,
      currentUser,
      `Assigned ${issue.id} to ${selectedStaff}`
    );
    setAssignOpen(false);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const isOverdue =
    issue.expectedResolutionDate &&
    !['Resolved', 'Closed', 'Rejected'].includes(issue.status) &&
    new Date(issue.expectedResolutionDate) < new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                {issue.id}
              </span>
              <StatusBadge status={issue.status} />
              <PriorityBadge priority={issue.priority} />
              {isOverdue && (
                <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> OVERDUE
                </span>
              )}
            </div>
            <h1 className="text-base font-bold text-slate-900 mt-1">
              {issue.category} • {issue.village}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handlePrintSlip}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
              title="Print Acknowledgement Slip"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(issue)}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Edit Grievance"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            {canDeleteIssue && (
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to permanently delete grievance ${issue.id}?`)) {
                    onDelete(issue.id);
                  }
                }}
                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Grievance (Admin Only)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview &amp; Citizen
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Timeline &amp; Audit ({issue.timeline.length})
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'comments'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Comments &amp; Notes ({issue.comments.length})
          </button>
          <button
            onClick={() => setActiveTab('attachments')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'attachments'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            Photos &amp; Docs ({issue.photos.length + issue.documents.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {activeTab === 'details' && (
            <div className="space-y-5">
              {/* Description Block */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Grievance Description
                </h3>
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {issue.description}
                </p>
              </div>

              {/* Resolution Details if resolved */}
              {issue.status === 'Resolved' && (
                <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Resolution Summary (Resolved on {issue.resolvedDate || 'Recorded'})
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    {issue.resolutionDetails || 'Issue successfully rectified and verified on site.'}
                  </p>
                </div>
              )}

              {/* Grid of details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Citizen Details */}
                <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    Citizen Reporter
                  </div>
                  <div className="font-semibold text-slate-800 text-sm">{issue.reporterName}</div>
                  <div className="text-slate-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {issue.contactNumber || 'Not provided'}
                  </div>
                  <div className="text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {issue.village} (GP: {issue.gramPanchayat})
                  </div>
                </div>

                {/* Administrative Routing */}
                <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-purple-600" />
                    Administrative Routing
                  </div>
                  <div className="text-slate-800">
                    <strong>Department:</strong> {issue.department}
                  </div>
                  <div className="text-slate-800 flex items-center justify-between">
                    <span>
                      <strong>Assigned Staff:</strong> {issue.assignedStaff || 'Unassigned'}
                    </span>
                    {canAssignIssue && (
                      <button
                        onClick={() => setAssignOpen(!assignOpen)}
                        className="text-indigo-600 hover:text-indigo-800 underline text-[11px] font-medium"
                      >
                        Change
                      </button>
                    )}
                  </div>
                  <div className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Reported: {issue.dateReported}
                  </div>
                  <div className="text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Target Resolution: {issue.expectedResolutionDate || 'Not set'}
                  </div>
                </div>
              </div>

              {/* Status Change & Assignment Action Section */}
              <div className="bg-slate-100/70 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="text-slate-500">Current Status: </span>
                  <strong className="text-slate-800">{issue.status}</strong>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setStatusChangeOpen(!statusChangeOpen)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Update Status
                  </button>
                </div>
              </div>

              {/* Status Change Drawer */}
              {statusChangeOpen && (
                <form
                  onSubmit={handleStatusChange}
                  className="bg-white p-4 rounded-xl border-2 border-indigo-200 space-y-3"
                >
                  <h4 className="text-xs font-bold text-slate-800 uppercase">Change Issue Status</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 mb-1 font-semibold">New Status</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as IssueStatus)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-slate-800 bg-slate-50"
                      >
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
                      <label className="block text-slate-600 mb-1 font-semibold">
                        Progress / Transition Note
                      </label>
                      <input
                        type="text"
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        placeholder="Reason or field verification note..."
                        className="w-full border border-slate-200 rounded-lg p-2 text-slate-800 bg-slate-50"
                      />
                    </div>
                  </div>

                  {newStatus === 'Resolved' && (
                    <div>
                      <label className="block text-slate-600 mb-1 text-xs font-semibold text-emerald-800">
                        Resolution Details (Rectification Summary)
                      </label>
                      <textarea
                        rows={2}
                        value={resolutionText}
                        onChange={(e) => setResolutionText(e.target.value)}
                        placeholder="Provide details on how the issue was rectified on ground..."
                        className="w-full border border-emerald-300 rounded-lg p-2 text-xs text-slate-800 bg-emerald-50/40"
                        required
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setStatusChangeOpen(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
                    >
                      Save Status
                    </button>
                  </div>
                </form>
              )}

              {/* Assign Drawer */}
              {assignOpen && (
                <form
                  onSubmit={handleAssign}
                  className="bg-white p-4 rounded-xl border-2 border-indigo-200 space-y-3"
                >
                  <h4 className="text-xs font-bold text-slate-800 uppercase">Assign Grievance to Staff</h4>
                  <div className="text-xs">
                    <label className="block text-slate-600 mb-1 font-semibold">Select Staff Member</label>
                    <select
                      value={selectedStaff}
                      onChange={(e) => setSelectedStaff(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-slate-800 bg-slate-50"
                      required
                    >
                      <option value="">-- Select Staff or Field Executive --</option>
                      {allUsers.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name} ({u.role} - {u.designation})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setAssignOpen(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
                    >
                      Confirm Assignment
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Full Activity &amp; Status Audit Log
              </h4>

              {issue.timeline.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">No timeline entries yet</div>
              ) : (
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-5 py-2">
                  {issue.timeline.map((entry) => (
                    <div key={entry.id} className="relative pl-6">
                      <span className="absolute -left-2 top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-600"></span>
                      <div className="text-xs font-bold text-slate-800">{entry.title}</div>
                      <p className="text-xs text-slate-600 mt-0.5">{entry.description}</p>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>By {entry.author}</span>
                        <span>•</span>
                        <span>{entry.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              {/* Existing Comments */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {issue.comments.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No comments recorded yet. Add notes below.
                  </div>
                ) : (
                  issue.comments.map((c) => (
                    <div key={c.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-800">
                          {c.author} <span className="text-slate-400 font-normal">({c.authorRole})</span>
                        </span>
                        <span className="text-[10px] text-slate-400">{c.timestamp}</span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap">{c.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="pt-2 border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={`Add a note as ${currentUser.name}...`}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  Post
                </button>
              </form>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-600 uppercase mb-2">Field Photos</h4>
                {issue.photos.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No photos attached</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {issue.photos.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-lg overflow-hidden border border-slate-200 aspect-video group relative"
                      >
                        <img
                          src={url}
                          alt="Grievance field photo"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 right-1 bg-slate-900/70 text-white text-[10px] px-1 rounded">
                          Photo {idx + 1}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-3">
                <h4 className="text-xs font-bold text-slate-600 uppercase mb-2">
                  Documents &amp; Petitions
                </h4>
                {issue.documents.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No documents attached</p>
                ) : (
                  <div className="space-y-1.5">
                    {issue.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-indigo-600" />
                          <span className="font-medium text-slate-800">{doc.name}</span>
                          {doc.size && <span className="text-slate-400">({doc.size})</span>}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Uploaded {doc.uploadedAt}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>Registered By: {issue.createdBy} • Last Updated: {issue.lastUpdated}</div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-200 text-slate-700 hover:bg-slate-300 font-medium rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
