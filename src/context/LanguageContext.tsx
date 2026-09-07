import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'kn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header & Brand
    app_title: 'CONSTITUENCY CONNECT',
    constituency_name: 'SINDHANUR AC-58',
    constituency_sub: 'Constituency Engagement & Issue Management • Raichur District, Karnataka',
    today_in_sindhanur: 'What is happening in Sindhanur AC-58 today?',
    today_subtitle: 'Real-time constituency operations, citizen grievances, village video sabhas, and development tracking.',
    
    // KPI Cards
    total_villages: 'Total Villages',
    total_gps: 'Total Gram Panchayats',
    total_booths: 'Total Polling Booths',
    total_workers: 'Registered Cadre / Workers',
    total_issues: 'Total Issues',
    open_issues: 'Open Grievances',
    resolved_issues: 'Resolved Issues',
    upcoming_meetings: 'Upcoming Meetings & Sabhas',

    // Navigation
    nav_dashboard: 'Dashboard (All Activity)',
    nav_issues: 'Issue Management',
    nav_raise_issue: 'Raise an Issue',
    nav_villages: 'Village Directory (124)',
    nav_members: 'Village Members & Cadre',
    nav_map: 'Constituency Map (GIS)',
    nav_booths: 'Booths Management (262)',
    nav_field_visits: 'Field Visits',
    nav_meetings: 'Public Meetings',
    nav_video_conferences: 'Village Video Calls',
    nav_development: 'Development Works',
    nav_reports: 'Official Reports',
    nav_settings: 'Settings & Admin',

    // Roles
    role_admin: 'Admin',
    role_village_head: 'Village Head',
    role_member: 'Village Member',
    role_staff: 'Staff',
    role_field: 'Field Executive',

    // Common words
    village: 'Village',
    gram_panchayat: 'Gram Panchayat',
    booth: 'Polling Booth',
    status: 'Status',
    priority: 'Priority',
    category: 'Category',
    resolved: 'Resolved',
    in_progress: 'In Progress',
    critical: 'Critical',
    scheduled: 'Scheduled',
    completed: 'Completed',
    live: 'Live Now',
    offline_mode: 'Offline Cached',
    online_mode: 'Online Live',
  },
  kn: {
    // Header & Brand
    app_title: 'ಕ್ಷೇತ್ರ ಕನೆಕ್ಟ್ (CONSTITUENCY CONNECT)',
    constituency_name: 'ಸಿಂಧನೂರು ವಿಧಾನಸಭಾ ಕ್ಷೇತ್ರ-58',
    constituency_sub: 'ಕ್ಷೇತ್ರದ ಸಾರ್ವಜನಿಕ ಕುಂದುಕೊರತೆ, ಗ್ರಾಮ ಸಂವಾದ ಮತ್ತು ಅಭಿವೃದ್ಧಿ ನಿರ್ವಹಣಾ ವೇದಿಕೆ',
    today_in_sindhanur: 'ಇಂದು ಸಿಂಧನೂರು ಕ್ಷೇತ್ರದಲ್ಲಿ (AC-58) ಏನಾಗುತ್ತಿದೆ?',
    today_subtitle: 'ನೈಜ ಸಮಯದ ಕ್ಷೇತ್ರ ಚಟುವಟಿಕೆಗಳು, ನಾಗರಿಕ ಸಮಸ್ಯೆಗಳು, ಗ್ರಾಮ ಸಭೆಗಳು ಮತ್ತು ಅಭಿವೃದ್ಧಿ ಕಾಮಗಾರಿಗಳ ವಿವರ.',

    // KPI Cards
    total_villages: 'ಒಟ್ಟು ಗ್ರಾಮಗಳು (124)',
    total_gps: 'ಒಟ್ಟು ಗ್ರಾಮ ಪಂಚಾಯತಿಗಳು (35)',
    total_booths: 'ಒಟ್ಟು ಮತಗಟ್ಟೆಗಳು (262)',
    total_workers: 'ನೋಂದಾಯಿತ ಕಾರ್ಯಕರ್ತರು (1,480)',
    total_issues: 'ಒಟ್ಟು ದೂರುಗಳು / ಸಮಸ್ಯೆಗಳು',
    open_issues: 'ಬಾಕಿ ಇರುವ ಸಮಸ್ಯೆಗಳು',
    resolved_issues: 'ಪರಿಹರಿಸಲಾದ ಸಮಸ್ಯೆಗಳು',
    upcoming_meetings: 'ಮುಂಬರುವ ಸಭೆಗಳು & ವಿಡಿಯೋ ಸಂವಾದ',

    // Navigation
    nav_dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ (ಎಲ್ಲಾ ಚಟುವಟಿಕೆಗಳು)',
    nav_issues: 'ಸಮಸ್ಯೆಗಳ ನಿರ್ವಹಣೆ',
    nav_raise_issue: 'ಸಮಸ್ಯೆ ದಾಖಲಿಸಿ',
    nav_villages: 'ಗ್ರಾಮಗಳ ವಿವರ (124)',
    nav_members: 'ಗ್ರಾಮ ಸದಸ್ಯರು ಮತ್ತು ಕಾರ್ಯಕರ್ತರು',
    nav_map: 'ಕ್ಷೇತ್ರದ ನಕ್ಷೆ (GIS)',
    nav_booths: 'ಮತಗಟ್ಟೆಗಳ ನಿರ್ವಹಣೆ (262)',
    nav_field_visits: 'ಕ್ಷೇತ್ರ ಭೇಟಿಗಳು',
    nav_meetings: 'ಸಾರ್ವಜನಿಕ ಸಭೆಗಳು',
    nav_video_conferences: 'ಗ್ರಾಮ ವಿಡಿಯೋ ಸಂವಾದ',
    nav_development: 'ಅಭಿವೃದ್ಧಿ ಕಾಮಗಾರಿಗಳು',
    nav_reports: 'ಅಧಿಕೃತ ವರದಿಗಳು',
    nav_settings: 'ಸೆಟ್ಟಿಂಗ್ಸ್ & ಆಡಳಿತ',

    // Roles
    role_admin: 'ಮುಖ್ಯ ಆಡಳಿತಾಧಿಕಾರಿ (Admin)',
    role_village_head: 'ಗ್ರಾಮ ಪ್ರಮುಖರು / ಅಧ್ಯಕ್ಷರು',
    role_member: 'ಗ್ರಾಮ ಸದಸ್ಯರು (Member)',
    role_staff: 'ಕಚೇರಿ ಸಿಬ್ಬಂದಿ (Staff)',
    role_field: 'ಕ್ಷೇತ್ರ ಅಧಿಕಾರಿ (Field)',

    // Common words
    village: 'ಗ್ರಾಮ',
    gram_panchayat: 'ಗ್ರಾಮ ಪಂಚಾಯಿತಿ',
    booth: 'ಮತಗಟ್ಟೆ',
    status: 'ಸ್ಥಿತಿ',
    priority: 'ಆದ್ಯತೆ',
    category: 'ವಿಭಾಗ',
    resolved: 'ಪರಿಹರಿಸಲಾಗಿದೆ',
    in_progress: 'ಪ್ರಗತಿಯಲ್ಲಿದೆ',
    critical: 'ತುರ್ತು / ಗಂಭೀರ',
    scheduled: 'ನಿಗದಿಪಡಿಸಲಾಗಿದೆ',
    completed: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    live: 'ಲೈವ್ ಸಂವಾದ',
    offline_mode: 'ಆಫ್‌ಲೈನ್ ಮೋಡ್',
    online_mode: 'ಆನ್‌ಲೈನ್ ಲೈವ್',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('cc_language') as Language;
      return saved === 'kn' ? 'kn' : 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('cc_language', lang);
    } catch {
      // Storage access blocked or restricted
    }
  };

  const toggleLanguage = () => {
    const next = language === 'en' ? 'kn' : 'en';
    setLanguage(next);
  };

  const t = (key: string, fallback?: string): string => {
    return translations[language]?.[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

const defaultLanguageContext: LanguageContextType = {
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string, fallback?: string) => translations['en']?.[key] || fallback || key,
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    return defaultLanguageContext;
  }
  return context;
};
