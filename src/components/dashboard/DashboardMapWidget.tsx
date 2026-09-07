import React, { useState, useMemo } from 'react';
import {
  MapPin,
  AlertCircle,
  Briefcase,
  ChevronRight,
  Maximize2,
  Layers,
  Compass,
  Building,
  Vote,
  Users,
} from 'lucide-react';
import { Village, Issue, DevelopmentWork, ActiveTab } from '../../types';

interface DashboardMapWidgetProps {
  villages?: Village[];
  issues?: Issue[];
  developmentWorks?: DevelopmentWork[];
  onNavigate: (tab: ActiveTab, id?: string) => void;
}

export const DashboardMapWidget: React.FC<DashboardMapWidgetProps> = ({
  villages = [],
  issues = [],
  developmentWorks = [],
  onNavigate,
}) => {
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(() => villages[0] || null);
  const [filterType, setFilterType] = useState<'all' | 'issues' | 'works'>('all');

  // Coordinate projection for Sindhanur bounds (Lat 15.65 - 15.90, Lng 76.62 - 76.95)
  const project = (lat: number, lng: number) => {
    const minLat = 15.65;
    const maxLat = 15.90;
    const minLng = 76.62;
    const maxLng = 76.95;
    const x = ((lng - minLng) / (maxLng - minLng)) * 680 + 60;
    const y = 440 - ((lat - minLat) / (maxLat - minLat)) * 380;
    return { x, y };
  };

  const villageIssues = useMemo(() => {
    if (!selectedVillage) return [];
    return issues.filter((i) => i.village === selectedVillage.name);
  }, [issues, selectedVillage]);

  const villageWorks = useMemo(() => {
    if (!selectedVillage) return [];
    return developmentWorks.filter((w) => w.village === selectedVillage.name);
  }, [developmentWorks, selectedVillage]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-indigo-600" />
              <span>Sindhanur AC-58 Live Constituency Map</span>
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              124 Villages Mapped
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive GIS vector layer: click any village node to inspect local grievances, development works, and booth stats.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Layers
            </button>
            <button
              onClick={() => setFilterType('issues')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filterType === 'issues'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Issues
            </button>
            <button
              onClick={() => setFilterType('works')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filterType === 'works'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Projects
            </button>
          </div>

          <button
            onClick={() => onNavigate('map')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open Full GIS</span>
          </button>
        </div>
      </div>

      {/* Map Body: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        {/* SVG Map Canvas */}
        <div className="lg:col-span-2 relative bg-slate-950 p-2 sm:p-4 overflow-hidden min-h-[380px] flex items-center justify-center select-none">
          <svg
            viewBox="0 0 800 500"
            className="w-full h-full max-h-[440px] drop-shadow-md"
            style={{ shapeRendering: 'geometricPrecision' }}
          >
            {/* Background Grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" />
              </pattern>
              <linearGradient id="boundaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#312e81" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <rect width="800" height="500" fill="url(#grid)" />

            {/* Sindhanur Outer Boundary Polygon */}
            <polygon
              points="140,80 280,40 480,50 660,110 740,240 710,380 540,460 320,470 160,420 80,280 90,160"
              fill="url(#boundaryGrad)"
              stroke="#6366f1"
              strokeWidth="2.5"
              strokeDasharray="6 3"
              className="transition-all"
            />

            {/* Tungabhadra Left Bank Canal (TLBC) Vector Flow */}
            <path
              d="M 100,180 Q 240,210 380,230 T 640,320 T 730,370"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.8"
            />
            <text x="380" y="222" fill="#7dd3fc" fontSize="9" fontWeight="bold" opacity="0.9">
              TLBC Main Canal Flow
            </text>

            {/* National & State Highway Network */}
            <path
              d="M 120,400 L 390,260 L 680,130"
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              strokeDasharray="4 2"
              opacity="0.6"
            />

            {/* Key Government Headquarter: Mini Vidhana Soudha / Sindhanur CMC */}
            <g transform="translate(390, 260)">
              <circle r="14" fill="#4f46e5" fillOpacity="0.3" className="animate-ping" />
              <circle r="8" fill="#4338ca" stroke="#ffffff" strokeWidth="2" />
              <text x="12" y="4" fill="#ffffff" fontSize="11" fontWeight="bold">
                Sindhanur Town (HQ)
              </text>
            </g>

            {/* Plotted Villages */}
            {villages.map((v) => {
              const pt = project(v.coordinates.lat, v.coordinates.lng);
              const isSelected = selectedVillage?.id === v.id;
              const hasOpenIssues = (v.openIssuesCount || 0) > 0;
              const hasWorks = (v.developmentWorksCount || 0) > 0;

              if (filterType === 'issues' && !hasOpenIssues) return null;
              if (filterType === 'works' && !hasWorks) return null;

              let circleColor = '#10b981'; // Green (default good)
              if (hasOpenIssues) circleColor = '#f59e0b'; // Amber (pending issues)
              if ((v.openIssuesCount || 0) >= 3) circleColor = '#ef4444'; // Red (hotspot)

              return (
                <g
                  key={v.id}
                  transform={`translate(${pt.x}, ${pt.y})`}
                  onClick={() => setSelectedVillage(v)}
                  className="cursor-pointer transition-transform hover:scale-125 group"
                >
                  {isSelected && (
                    <circle r="14" fill="#6366f1" fillOpacity="0.4" stroke="#a5b4fc" strokeWidth="1.5" />
                  )}
                  <circle
                    r={isSelected ? 6 : 4.5}
                    fill={circleColor}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  <text
                    x="8"
                    y="3"
                    fill={isSelected ? '#ffffff' : '#cbd5e1'}
                    fontSize={isSelected ? '11' : '8.5'}
                    fontWeight={isSelected ? 'bold' : 'normal'}
                    className="pointer-events-none drop-shadow-sm select-none"
                  >
                    {v.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Quick Legend Overlay */}
          <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs border border-slate-800 rounded-lg p-2 text-[10px] text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Normal Status</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Active Issues</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>Grievance Hotspot</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-sky-400" />
              <span>TLBC Canal</span>
            </div>
          </div>
        </div>

        {/* Selected Village Detail Panel */}
        <div className="p-4 bg-white flex flex-col justify-between space-y-4">
          {selectedVillage ? (
            <div className="space-y-3.5">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      Selected Village
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {selectedVillage.name}
                    </h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 whitespace-nowrap">
                    GP: {selectedVillage.gramPanchayat}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Taluk: Sindhanur • PIN: {selectedVillage.pinCode || '584128'}
                </p>
              </div>

              {/* Village Quick Stats */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Issues</div>
                  <div className="text-base font-bold text-slate-900">{villageIssues.length}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="text-[10px] text-amber-700 font-semibold uppercase">Open Grievances</div>
                  <div className="text-base font-bold text-amber-800">
                    {villageIssues.filter((i) => !['Resolved', 'Closed', 'Rejected'].includes(i.status)).length}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="text-[10px] text-purple-700 font-semibold uppercase">Projects</div>
                  <div className="text-base font-bold text-purple-800">{villageWorks.length}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="text-[10px] text-emerald-700 font-semibold uppercase">Cadre Cadre</div>
                  <div className="text-base font-bold text-emerald-800">
                    {selectedVillage.membersCount || 12}
                  </div>
                </div>
              </div>

              {/* Recent Issue in this Village */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/60 text-xs space-y-1.5">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Recent Village Grievances</span>
                </div>
                {villageIssues.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No active grievances logged for this village.</p>
                ) : (
                  <div className="space-y-1.5">
                    {villageIssues.slice(0, 2).map((iss) => (
                      <div
                        key={iss.id}
                        onClick={() => onNavigate('issues', iss.village)}
                        className="bg-white p-2 rounded border border-slate-200 hover:border-indigo-300 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-900">
                          <span className="truncate max-w-[140px]">{iss.category}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                            {iss.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{iss.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs">
              Click any village pin on the map to inspect its portfolio.
            </div>
          )}

          {/* Action Button */}
          {selectedVillage && (
            <button
              onClick={() => onNavigate('villages', selectedVillage.id)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <span>View Full Village Portfolio</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
