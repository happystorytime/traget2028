import React, { useState } from 'react';
import { Info, X, MapPin, Database, CheckCircle2 } from 'lucide-react';

interface DataQualityBannerProps {
  onOpenSettings?: () => void;
}

export const DataQualityBanner: React.FC<DataQualityBannerProps> = ({ onOpenSettings }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <aside
      aria-label="Dataset verification banner"
      className="bg-slate-900 text-slate-200 border-b border-slate-800 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 transition-all shadow-sm"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded text-[10px] tracking-wide uppercase border border-amber-500/30">
          DEMO GIS &amp; SAMPLE DATA
        </span>
        <span className="text-slate-300">
          <strong>Constituency:</strong> Sindhanur AC-58 (Raichur, Karnataka). Displaying curated test entities for review.
        </span>
        <span className="hidden md:inline text-slate-400">
          Official revenue boundaries, electoral roll figures &amp; departmental files can be imported via System Tools.
        </span>
      </div>
      <div className="flex items-center gap-3">
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="text-amber-300 hover:text-amber-200 underline font-medium cursor-pointer"
          >
            Import / Manage Data
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-slate-200 p-0.5 rounded"
          title="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
