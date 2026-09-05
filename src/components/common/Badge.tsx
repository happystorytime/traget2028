import React from 'react';
import { IssuePriority, IssueStatus, UserRole, DevelopmentWorkStatus, FieldVisitStatus } from '../../types';

export const StatusBadge: React.FC<{ status: IssueStatus | DevelopmentWorkStatus | FieldVisitStatus | string }> = ({ status }) => {
  let style = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    case 'New':
    case 'Proposed':
    case 'Scheduled':
      style = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'Verified':
    case 'Approved':
      style = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      break;
    case 'Assigned':
    case 'Tender':
    case 'Started':
      style = 'bg-purple-50 text-purple-700 border-purple-200';
      break;
    case 'In Progress':
      style = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'Waiting for Department':
    case 'Follow-up Required':
    case 'Delayed':
      style = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case 'Resolved':
    case 'Completed':
    case 'Closed':
      style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'Rejected':
    case 'Cancelled':
      style = 'bg-slate-100 text-slate-600 border-slate-300 line-through';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${style} whitespace-nowrap`}
    >
      {status}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: IssuePriority }> = ({ priority }) => {
  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  let dot = 'bg-slate-400';

  switch (priority) {
    case 'Critical':
      style = 'bg-red-50 text-red-700 border-red-200 font-bold';
      dot = 'bg-red-500 animate-pulse';
      break;
    case 'High':
      style = 'bg-orange-50 text-orange-700 border-orange-200';
      dot = 'bg-orange-500';
      break;
    case 'Medium':
      style = 'bg-amber-50 text-amber-700 border-amber-200';
      dot = 'bg-amber-500';
      break;
    case 'Low':
      style = 'bg-slate-100 text-slate-700 border-slate-200';
      dot = 'bg-slate-400';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${style} whitespace-nowrap`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
      {priority}
    </span>
  );
};

export const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  switch (role) {
    case 'ADMIN':
      style = 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold';
      break;
    case 'STAFF':
      style = 'bg-sky-50 text-sky-700 border-sky-200 font-medium';
      break;
    case 'FIELD EXECUTIVE':
      style = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium';
      break;
    case 'VILLAGE HEAD':
      style = 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
      break;
    case 'VILLAGE MEMBER':
      style = 'bg-teal-50 text-teal-800 border-teal-200 font-medium';
      break;
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${style} whitespace-nowrap`}>
      {role}
    </span>
  );
};
