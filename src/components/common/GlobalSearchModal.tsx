import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, AlertCircle, MapPin, Calendar, Briefcase, User as UserIcon, ArrowRight } from 'lucide-react';
import { StorageService } from '../../services/storage';
import { ActiveTab } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: ActiveTab, id?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const rawIssues = StorageService.getIssues();
    const issues = (Array.isArray(rawIssues) ? rawIssues : []).filter((i) => {
      const id = i.id || '';
      const reporter = i.reporterName || '';
      const desc = i.description || '';
      const vil = i.village || '';
      const cat = i.category || '';
      return (
        id.toLowerCase().includes(q) ||
        reporter.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q) ||
        vil.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q)
      );
    }).slice(0, 5);

    const rawVillages = StorageService.getVillages();
    const villages = (Array.isArray(rawVillages) ? rawVillages : []).filter((v) => {
      const name = v.name || '';
      const gp = v.gramPanchayat || '';
      return name.toLowerCase().includes(q) || gp.toLowerCase().includes(q);
    }).slice(0, 4);

    const rawMeetings = StorageService.getPublicMeetings();
    const meetings = (Array.isArray(rawMeetings) ? rawMeetings : []).filter((m) => {
      const title = m.title || '';
      const vil = m.village || '';
      const agendaStr =
        typeof m.agenda === 'string'
          ? m.agenda
          : Array.isArray(m.agenda as unknown)
          ? ((m.agenda as unknown) as string[]).join(' ')
          : '';
      const purpose = m.purpose || '';
      return (
        title.toLowerCase().includes(q) ||
        vil.toLowerCase().includes(q) ||
        agendaStr.toLowerCase().includes(q) ||
        purpose.toLowerCase().includes(q)
      );
    }).slice(0, 4);

    const rawVisits = StorageService.getFieldVisits();
    const visits = (Array.isArray(rawVisits) ? rawVisits : []).filter((f) => {
      const id = f.id || '';
      const vil = f.village || '';
      const purpose = f.purpose || '';
      return (
        id.toLowerCase().includes(q) ||
        vil.toLowerCase().includes(q) ||
        purpose.toLowerCase().includes(q)
      );
    }).slice(0, 4);

    const rawWorks = StorageService.getDevelopmentWorks();
    const works = (Array.isArray(rawWorks) ? rawWorks : []).filter((w) => {
      const id = w.id || '';
      const name = w.workName || '';
      const vil = w.village || '';
      const dept = w.department || '';
      return (
        id.toLowerCase().includes(q) ||
        name.toLowerCase().includes(q) ||
        vil.toLowerCase().includes(q) ||
        dept.toLowerCase().includes(q)
      );
    }).slice(0, 4);

    const rawUsers = StorageService.getUsers();
    const users = (Array.isArray(rawUsers) ? rawUsers : []).filter((u) => {
      const name = u.name || '';
      const email = u.email || '';
      const desig = u.designation || '';
      return (
        name.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        desig.toLowerCase().includes(q)
      );
    }).slice(0, 4);

    const totalCount =
      issues.length +
      villages.length +
      meetings.length +
      visits.length +
      works.length +
      users.length;

    return { issues, villages, meetings, visits, works, users, totalCount };
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-3 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search issues, villages, meetings, field visits, works, staff..."
            className="w-full bg-transparent border-0 focus:outline-hidden text-sm text-slate-900 placeholder:text-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded font-medium hover:bg-slate-300 transition-colors"
          >
            ESC
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query && (
            <div className="text-center py-8 text-slate-400 text-sm">
              <p>Type keywords to search across Sindhanur AC-58 database</p>
              <div className="flex justify-center gap-2 mt-3 text-xs text-slate-500">
                <span className="px-2 py-1 bg-slate-100 rounded">Try: "Water"</span>
                <span className="px-2 py-1 bg-slate-100 rounded">"Gorebal"</span>
                <span className="px-2 py-1 bg-slate-100 rounded">"Road"</span>
                <span className="px-2 py-1 bg-slate-100 rounded">"PWD"</span>
              </div>
            </div>
          )}

          {results && results.totalCount === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">
              No matching records found for "{query}"
            </div>
          )}

          {Boolean(results && (results.issues?.length ?? 0) > 0) && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                Issues / Grievances ({results?.issues?.length ?? 0})
              </h3>
              <div className="space-y-1">
                {(results?.issues || []).map((i) => (
                  <button
                    key={i.id}
                    onClick={() => {
                      onNavigate('issues', i.id);
                      onClose();
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-100 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          {i.id}
                        </span>
                        <span className="text-xs font-semibold text-slate-800">{i.category}</span>
                        <span className="text-xs text-slate-500">• {i.village}</span>
                      </div>
                      <p className="text-xs text-slate-600 truncate mt-0.5 max-w-md">
                        {i.description}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {Boolean(results && (results.villages?.length ?? 0) > 0) && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Villages ({results?.villages?.length ?? 0})
              </h3>
              <div className="space-y-1">
                {(results?.villages || []).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      onNavigate('villages', v.id);
                      onClose();
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-100 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-800">{v.name}</span>
                      <span className="text-xs text-slate-500 ml-2">GP: {v.gramPanchayat}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {Boolean(results && (results.works?.length ?? 0) > 0) && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                Development Works ({results?.works?.length ?? 0})
              </h3>
              <div className="space-y-1">
                {(results?.works || []).map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      onNavigate('development-works', w.id);
                      onClose();
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-100 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                          {w.id}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 truncate max-w-sm">
                          {w.workName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{w.village} • {w.department}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {Boolean(results && (results.meetings?.length ?? 0) > 0) && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                Public Meetings ({results?.meetings?.length ?? 0})
              </h3>
              <div className="space-y-1">
                {(results?.meetings || []).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onNavigate('meetings', m.id);
                      onClose();
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-100 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-800">{m.title}</span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {m.date} • {m.village} ({m.location})
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {Boolean(results && (results.users?.length ?? 0) > 0) && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-600" />
                Staff &amp; Field Officers ({results?.users?.length ?? 0})
              </h3>
              <div className="space-y-1">
                {(results?.users || []).map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onNavigate('users');
                      onClose();
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-100 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-800">{u.name}</span>
                      <span className="text-xs text-slate-500 ml-2">({u.role}) - {u.designation}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
