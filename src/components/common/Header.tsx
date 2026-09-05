import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Settings,
  Shield,
  UserCheck,
  ChevronDown,
  Building2,
  RefreshCw,
  LogOut,
  Smartphone,
  CheckCircle2,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from './Badge';
import { UserRole } from '../../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onOpenOtpLogin?: () => void;
  onOpenNewIssue?: () => void;
  unreadNotificationsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenSearch,
  onOpenNotifications,
  onOpenSettings,
  onOpenOtpLogin = () => {},
  onOpenNewIssue,
  unreadNotificationsCount = 0,
}) => {
  const { currentUser, switchRole, allUsers, isOtpLoggedIn, logout, isMember, isAdmin } = useAuth();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const roles: { role: UserRole; label: string; desc: string }[] = [
    {
      role: 'ADMIN',
      label: 'ADMIN',
      desc: 'See All Activity & Operations',
    },
    {
      role: 'VILLAGE HEAD',
      label: 'VILLAGE HEAD',
      desc: 'Fix Meetings & Video Conferences',
    },
    {
      role: 'VILLAGE MEMBER',
      label: 'VILLAGE MEMBER',
      desc: 'Only See & Raise an Issue',
    },
    {
      role: 'STAFF',
      label: 'STAFF',
      desc: 'Office Operations & Grievances',
    },
    {
      role: 'FIELD EXECUTIVE',
      label: 'FIELD EXECUTIVE',
      desc: 'Field Visits & Inspection',
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Mobile Menu Toggle & Constituency Branding */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-indigo-900 text-white flex items-center justify-center font-bold text-sm tracking-wider shrink-0 shadow-xs border border-indigo-800">
              CC
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm tracking-tight truncate">
                  CONSTITUENCY CONNECT
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 whitespace-nowrap">
                  SINDHANUR AC-58
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate hidden md:block">
                Constituency Engagement &amp; Issue Management • Raichur District, Karnataka
              </p>
            </div>
          </div>
        </div>

        {/* Center: Search Trigger (Desktop) */}
        <div className="hidden sm:flex flex-1 max-w-md mx-2">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between bg-slate-100 hover:bg-slate-200/80 text-slate-500 px-3 py-1.5 rounded-lg text-xs font-normal transition-colors border border-slate-200/80"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search issues, villages, members, works...</span>
            </span>
            <kbd className="text-[10px] bg-white text-slate-400 font-mono px-1.5 py-0.5 rounded border border-slate-200">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right: Actions & Role / User Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Member Quick Raise Issue Button */}
          {isMember && onOpenNewIssue && (
            <button
              onClick={onOpenNewIssue}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Raise an Issue</span>
              <span className="sm:hidden">Raise</span>
            </button>
          )}

          {/* Mobile Search Icon */}
          <button
            onClick={onOpenSearch}
            className="sm:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* OTP Login Action Button */}
          {isOtpLoggedIn ? (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate max-w-[110px]">OTP Verified</span>
            </div>
          ) : (
            <button
              id="header-otp-login-btn"
              onClick={onOpenOtpLogin}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">OTP Login</span>
              <span className="sm:hidden">OTP</span>
            </button>
          )}

          {/* Notifications */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Open notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            )}
          </button>

          {/* Settings / Data Tools (Admin/Staff only) */}
          {!isMember && (
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="System Settings, GIS & Data Management"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Role / User Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-100 flex items-center justify-center text-xs font-bold uppercase shrink-0">
                {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
              </div>
              <div className="hidden xl:block min-w-0">
                <div className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">
                  {currentUser?.name || 'User'}
                </div>
                <div className="text-[10px] text-slate-500 leading-none">
                  {currentUser?.role || 'STAFF'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-800">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <RoleBadge role={currentUser.role} />
                    <span className="text-[10px] text-slate-400 truncate">{currentUser.designation}</span>
                  </div>
                </div>

                {/* Mobile OTP Login option */}
                <div className="p-2 border-b border-slate-100 bg-slate-50/70">
                  <button
                    onClick={() => {
                      setRoleDropdownOpen(false);
                      onOpenOtpLogin();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <span className="flex items-center space-x-1.5">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>{isOtpLoggedIn ? 'Switch / Re-verify Mobile' : 'Login Through OTP'}</span>
                    </span>
                    <span className="text-[10px] bg-emerald-800 px-1 py-0.2 rounded font-mono">
                      SMS
                    </span>
                  </button>
                </div>

                <div className="px-3 py-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-indigo-600" />
                      Switch User Role
                    </span>
                    <span className="text-[9px] text-slate-400 font-normal">RBAC Preview</span>
                  </div>
                  <div className="space-y-1.5">
                    {roles.map(({ role, label, desc }) => (
                      <button
                        key={role}
                        onClick={() => {
                          switchRole(role);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors ${
                          currentUser.role === role
                            ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{label}</span>
                          {currentUser.role === role && (
                            <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-mono font-normal">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {isOtpLoggedIn && (
                  <div className="border-t border-slate-100 pt-1 px-3">
                    <button
                      onClick={() => {
                        logout();
                        setRoleDropdownOpen(false);
                      }}
                      className="w-full text-left py-1.5 text-xs text-rose-600 hover:text-rose-800 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out (Exit OTP Session)
                    </button>
                  </div>
                )}

                {!isMember && (
                  <div className="border-t border-slate-100 pt-1 px-3">
                    <button
                      onClick={() => {
                        setRoleDropdownOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full text-left py-1.5 text-xs text-slate-600 hover:text-indigo-600 flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Data &amp; Security Settings
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

