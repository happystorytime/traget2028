import React from 'react';
import {
  LayoutDashboard,
  AlertCircle,
  MapPin,
  Map,
  Compass,
  Users2,
  Briefcase,
  Users,
  FileText,
  Settings,
  X,
  Building,
  Calendar,
  Layers,
  PlusCircle,
  Shield,
  UserCheck,
  Video,
} from 'lucide-react';
import { ActiveTab } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOpen?: boolean;
  onClose?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  openIssuesCount?: number;
  scheduledVisitsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
  mobileOpen,
  onCloseMobile,
  collapsed,
  onToggleCollapse,
  openIssuesCount = 0,
  scheduledVisitsCount = 0,
}) => {
  const { currentUser, canManageUsers, isMember, isAdmin } = useAuth();

  const isSidebarOpen = isOpen ?? mobileOpen ?? false;
  const handleClose = onClose ?? onCloseMobile ?? (() => {});

  // For members, strictly show ONLY "Raise an Issue"
  const memberNavItems: {
    id: ActiveTab;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
    adminOnly?: boolean;
  }[] = [
    {
      id: 'issues',
      label: 'Raise an Issue',
      icon: PlusCircle,
      badge: 'Public Grievance',
      badgeColor: 'bg-emerald-600 text-white font-bold',
    },
  ];

  // For Admin & Staff, show all activity and full operations
  const adminNavItems: {
    id: ActiveTab;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
    adminOnly?: boolean;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard (All Activity)',
      icon: LayoutDashboard,
    },
    {
      id: 'issues',
      label: 'Issue Management',
      icon: AlertCircle,
      badge: openIssuesCount > 0 ? openIssuesCount : undefined,
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: 'villages',
      label: 'Village Directory (124)',
      icon: MapPin,
    },
    {
      id: 'members',
      label: 'Village Members & Cadre',
      icon: Users2,
      badge: '124 Villages',
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'map',
      label: 'Constituency Map',
      icon: Map,
      badge: 'GIS',
      badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    },
    {
      id: 'field-visits',
      label: 'Field Visits',
      icon: Compass,
      badge: scheduledVisitsCount > 0 ? scheduledVisitsCount : undefined,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'meetings',
      label: 'Public Meetings',
      icon: Calendar,
    },
    {
      id: 'video-conferences',
      label: 'Village Video Calls',
      icon: Video,
      badge: 'Virtual',
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'development-works',
      label: 'Development Works',
      icon: Briefcase,
    },
    {
      id: 'reports',
      label: 'Official Reports',
      icon: FileText,
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      adminOnly: true,
    },
    {
      id: 'settings',
      label: 'System & Data Backup',
      icon: Settings,
    },
  ];

  // For Village Head: focused on fixing meetings, video conferences, and village grievances
  const villageHeadNavItems: {
    id: ActiveTab;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
    adminOnly?: boolean;
  }[] = [
    {
      id: 'video-conferences',
      label: 'Fix Video Conference',
      icon: Video,
      badge: 'Live',
      badgeColor: 'bg-amber-400 text-slate-950 font-bold',
    },
    {
      id: 'meetings',
      label: 'Fix Public Meetings',
      icon: Calendar,
      badge: 'Sabha',
      badgeColor: 'bg-indigo-500 text-white',
    },
    {
      id: 'issues',
      label: 'Village Grievances',
      icon: AlertCircle,
      badge: openIssuesCount > 0 ? openIssuesCount : undefined,
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: 'villages',
      label: 'Village Directory (124)',
      icon: MapPin,
    },
  ];

  const displayedNavItems = isMember
    ? memberNavItems
    : currentUser.role === 'VILLAGE HEAD'
    ? villageHeadNavItems
    : adminNavItems;

  const handleNavClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    handleClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={handleClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              CC
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-wide">
                CONSTITUENCY CONNECT
              </div>
              <div className="text-[10px] text-slate-400">
                SINDHANUR AC-58 PORTAL
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="lg:hidden p-1 text-slate-400 hover:text-white rounded"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Indicator Banner */}
        <div className="px-3 pt-3">
          {isMember ? (
            <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-800/80 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-0.5">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Village Member</span>
              </div>
              <p className="text-[11px] text-emerald-200/80 leading-snug">
                Portal restricted to raising and tracking civic issues.
              </p>
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-indigo-950/70 border border-indigo-800/80 text-xs">
              <div className="flex items-center gap-1.5 text-indigo-300 font-bold mb-0.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Office Administration</span>
              </div>
              <p className="text-[11px] text-indigo-200/80 leading-snug">
                Full access to all constituency activity and logs.
              </p>
            </div>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            {isMember ? 'Member Action' : 'Operations & Governance'}
          </div>

          {displayedNavItems.map((item) => {
            if (item.adminOnly && !canManageUsers) return null;
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      item.badgeColor || 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info: Constituency jurisdiction */}
        <div className="p-3 m-3 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
            <Building className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sindhanur Taluk</span>
          </div>
          <div className="text-[11px] text-slate-400 space-y-0.5">
            <div>Raichur District, Karnataka</div>
            <div className="text-[10px] text-slate-400">
              {isMember ? 'Grievance Redressal Service' : 'AC No: 58 • 31 CMC Wards'}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

