import React, { useState } from 'react';
import { Bell, CheckCheck, Trash2, X, ExternalLink, AlertCircle, Calendar, Briefcase, CheckCircle2 } from 'lucide-react';
import { StorageService } from '../../services/storage';
import { AppNotification, ActiveTab } from '../../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: AppNotification[];
  onNavigate?: (tab: ActiveTab, id?: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications = [],
  onNavigate,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (!isOpen) return null;

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const filtered = safeNotifications.filter((n) => (filter === 'unread' ? !n?.read : true));
  const unreadCount = safeNotifications.filter((n) => !n?.read).length;

  const handleItemClick = (n: AppNotification) => {
    StorageService.markNotificationAsRead(n.id);
    if (n.linkType && n.linkId && onNavigate) {
      if (n.linkType === 'issue') onNavigate('issues', n.linkId);
      else if (n.linkType === 'meeting') onNavigate('meetings', n.linkId);
      else if (n.linkType === 'visit') onNavigate('field-visits', n.linkId);
      else if (n.linkType === 'work') onNavigate('development-works', n.linkId);
    }
    onClose();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'New Issue':
      case 'Issue Overdue':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'Issue Resolved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'Meeting Reminder':
        return <Calendar className="w-4 h-4 text-indigo-600" />;
      case 'Field Visit Reminder':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'Development Work Delayed':
        return <Briefcase className="w-4 h-4 text-amber-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs">
      <div className="w-full max-w-sm sm:max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-800">Notification Center</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between text-xs">
          <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === 'all' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({safeNotifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === 'unread' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => StorageService.markAllNotificationsAsRead()}
                className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Read All
              </button>
            )}
            {safeNotifications.length > 0 && (
              <button
                onClick={() => StorageService.clearNotifications()}
                className="text-slate-400 hover:text-red-600 p-1"
                title="Clear all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>No notifications {filter === 'unread' ? 'in unread tab' : 'at this time'}</p>
            </div>
          ) : (
            filtered.map((n) => (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 items-start ${
                  !n.read ? 'bg-indigo-50/30' : ''
                }`}
              >
                <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {n.title}
                    </span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {n.timestamp.slice(5)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-1.5">
                    {n.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      {n.type}
                    </span>
                    {n.linkId && (
                      <span className="text-[10px] text-indigo-600 flex items-center gap-0.5 font-medium hover:underline">
                        View record <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>
                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600 mt-2 shrink-0"></span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
