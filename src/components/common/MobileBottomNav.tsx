import React from 'react';
import {
  LayoutDashboard,
  Map,
  AlertCircle,
  Video,
  Menu,
  PlusCircle,
  MapPin,
  Calendar,
} from 'lucide-react';
import { ActiveTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenMobileMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenMobileMenu,
}) => {
  const { isMember } = useAuth();
  const { t } = useLanguage();

  if (isMember) {
    return (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => onSelectTab('issues')}
          className={`flex flex-col items-center gap-1 text-xs font-bold ${
            activeTab === 'issues' ? 'text-emerald-600' : 'text-slate-600'
          }`}
        >
          <PlusCircle className="w-5 h-5" />
          <span>{t('nav_raise_issue', 'Raise Issue')}</span>
        </button>
      </nav>
    );
  }

  const items: {
    id: ActiveTab;
    label: string;
    icon: React.ElementType;
  }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'issues', label: 'Issues', icon: AlertCircle },
    { id: 'video-conferences', label: 'Sabha', icon: Video },
    { id: 'villages', label: 'Villages', icon: MapPin },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-xl">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors cursor-pointer min-w-[56px] ${
              isActive
                ? 'text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] mt-0.5 whitespace-nowrap">{item.label}</span>
          </button>
        );
      })}

      <button
        onClick={onOpenMobileMenu}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-slate-500 hover:text-slate-800 font-medium cursor-pointer min-w-[56px]"
      >
        <Menu className="w-5 h-5 stroke-[1.8]" />
        <span className="text-[10px] mt-0.5 whitespace-nowrap">More</span>
      </button>
    </nav>
  );
};
