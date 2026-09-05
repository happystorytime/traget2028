import React, { useState, useMemo } from 'react';
import {
  Layers,
  MapPin,
  AlertCircle,
  Briefcase,
  Upload,
  Info,
  Building,
  CheckCircle2,
  ChevronRight,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Vote,
} from 'lucide-react';
import { Village, Issue, DevelopmentWork, PollingBooth, GramPanchayat, ActiveTab } from '../../types';

interface ConstituencyMapViewProps {
  villages?: Village[];
  issues?: Issue[];
  developmentWorks?: DevelopmentWork[];
  pollingBooths?: PollingBooth[];
  gramPanchayats?: GramPanchayat[];
  onNavigate?: (tab: ActiveTab, id?: string) => void;
}

export const ConstituencyMapView: React.FC<ConstituencyMapViewProps> = ({
  villages = [],
  issues = [],
  developmentWorks = [],
  pollingBooths = [],
  gramPanchayats = [],
  onNavigate = (_tab: ActiveTab, _id?: string) => {},
}) => {
  // Layer Toggles
  const [showBoundary, setShowBoundary] = useState(true);
  const [showVillageSectors, setShowVillageSectors] = useState(true);
  const [showVillageLabels, setShowVillageLabels] = useState(true);
  const [showGPs, setShowGPs] = useState(true);
  const [showPollingBooths, setShowPollingBooths] = useState(false);
  const [showWorks, setShowWorks] = useState(true);
  const [showIssues, setShowIssues] = useState(true);

  // Selected Village Inspector
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(villages[0] || null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Custom GeoJSON Upload Modal state
  const [geoJsonModalOpen, setGeoJsonModalOpen] = useState(false);
  const [geoJsonStatus, setGeoJsonStatus] = useState<string | null>(null);

  // Transform lat/lng coordinates to SVG viewBox (width: 900, height: 600)
  // Sindhanur bounds approximately:
  // Lat: 15.65 (south) to 15.90 (north) -> span: 0.25
  // Lng: 76.62 (west) to 76.95 (east) -> span: 0.33
  const minLat = 15.65;
  const maxLat = 15.90;
  const minLng = 76.62;
  const maxLng = 76.95;

  const projectCoord = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 740 + 80;
    // Invert Y because SVG coordinates go top-to-bottom
    const y = ((maxLat - lat) / (maxLat - minLat)) * 440 + 80;
    return { x, y };
  };

  // Constituency Boundary Polygon Points (Simulated realistic AC-58 perimeter)
  const boundaryPoints = useMemo(() => {
    const pts = [
      { lat: 15.89, lng: 76.75 },
      { lat: 15.88, lng: 76.84 },
      { lat: 15.84, lng: 76.92 },
      { lat: 15.77, lng: 76.94 },
      { lat: 15.71, lng: 76.88 },
      { lat: 15.66, lng: 76.80 },
      { lat: 15.66, lng: 76.72 },
      { lat: 15.69, lng: 76.65 },
      { lat: 15.76, lng: 76.63 },
      { lat: 15.83, lng: 76.66 },
      { lat: 15.87, lng: 76.71 },
    ];
    return pts
      .map((p) => {
        const { x, y } = projectCoord(p.lat, p.lng);
        return `${x},${y}`;
      })
      .join(' ');
  }, []);

  // Canal path (TLBC main canal crossing through Sindhanur)
  const canalPoints = useMemo(() => {
    const pts = [
      { lat: 15.88, lng: 76.64 },
      { lat: 15.82, lng: 76.70 },
      { lat: 15.78, lng: 76.77 },
      { lat: 15.73, lng: 76.82 },
      { lat: 15.68, lng: 76.90 },
    ];
    return pts
      .map((p) => {
        const { x, y } = projectCoord(p.lat, p.lng);
        return `${x},${y}`;
      })
      .join(' ');
  }, []);

  // Selected village info
  const selectedVillageIssues = useMemo(() => {
    if (!selectedVillage) return [];
    return issues.filter((i) => i.village === selectedVillage.name);
  }, [issues, selectedVillage]);

  const selectedVillageWorks = useMemo(() => {
    if (!selectedVillage) return [];
    return developmentWorks.filter((w) => w.village === selectedVillage.name);
  }, [developmentWorks, selectedVillage]);

  const handleGeoJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string);
          setGeoJsonStatus(`Loaded GeoJSON successfully (${parsed.features?.length || 0} features).`);
        } catch (err) {
          setGeoJsonStatus('Invalid GeoJSON format. Please verify file syntax.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Constituency GIS Map
            </h1>
            <span className="text-xs bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-300">
              DEMO GIS DATA
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive geographical representation of Sindhanur AC-58 villages, grievances, and public infrastructure works.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setGeoJsonModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Official GeoJSON
          </button>
        </div>
      </div>

      {/* Main Map + Layers + Inspector Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Layer Controls Panel (Left) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4 order-2 lg:order-1">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Map Layers &amp; Overlays
            </h2>
          </div>

          <div className="space-y-2.5 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showBoundary}
                onChange={(e) => setShowBoundary(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-slate-700 font-medium">Constituency Boundary (AC-58)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showVillageSectors}
                onChange={(e) => setShowVillageSectors(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-slate-700 font-medium">Village Sector Nodes</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showVillageLabels}
                onChange={(e) => setShowVillageLabels(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-slate-700 font-medium">Village Names</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showGPs}
                onChange={(e) => setShowGPs(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-slate-700 font-medium">Gram Panchayat Clusters</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showIssues}
                onChange={(e) => setShowIssues(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-slate-700 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Active Grievances ({issues.filter((i) => i.status !== 'Resolved').length})
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showWorks}
                onChange={(e) => setShowWorks(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-slate-700 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                Development Works ({developmentWorks.length})
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showPollingBooths}
                onChange={(e) => setShowPollingBooths(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-slate-700 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Polling Booths ({pollingBooths.length})
              </span>
            </label>
          </div>

          {/* Map Legend */}
          <div className="pt-3 border-t border-slate-100 text-[11px] space-y-1.5 text-slate-500">
            <div className="font-bold text-slate-700 uppercase text-[10px]">Legend</div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 bg-sky-500 rounded"></span>
              <span>TLBC Irrigation Canal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 border border-white"></span>
              <span>Revenue Village Center</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-200"></span>
              <span>Critical / High Priority Issue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              <span>Approved Development Work</span>
            </div>
          </div>

          {/* Quick Select Village */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
              Jump to Village
            </label>
            <select
              value={selectedVillage?.id || ''}
              onChange={(e) => {
                const found = villages.find((v) => v.id === e.target.value);
                if (found) setSelectedVillage(found);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800"
            >
              {villages.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Map Canvas (Center / Span 2 cols) */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-md p-2 lg:col-span-2 relative overflow-hidden flex flex-col justify-between min-h-[460px] order-1 lg:order-2">
          {/* Top disclaimer pill */}
          <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-xs text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Sindhanur AC-58 (Demo GIS Coordinates)</span>
          </div>

          {/* Zoom controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-1">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}
              className="w-7 h-7 rounded bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center text-xs shadow-xs"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.2, 0.8))}
              className="w-7 h-7 rounded bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center text-xs shadow-xs"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="w-7 h-7 rounded bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center text-xs shadow-xs"
              title="Reset View"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* SVG Map Render */}
          <div className="w-full h-full flex items-center justify-center p-2">
            <svg
              viewBox="0 0 900 600"
              className="w-full h-full max-h-[500px] select-none transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              }}
            >
              <defs>
                <radialGradient id="mapBgGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </radialGradient>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="#334155"
                    strokeWidth="0.5"
                    strokeDasharray="2,2"
                  />
                </pattern>
              </defs>

              {/* Background Grid */}
              <rect width="900" height="600" fill="url(#mapBgGrad)" rx="12" />
              <rect width="900" height="600" fill="url(#grid)" opacity="0.3" rx="12" />

              {/* AC-58 Constituency Boundary */}
              {showBoundary && (
                <polygon
                  points={boundaryPoints}
                  fill="#1e1b4b"
                  fillOpacity="0.4"
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  strokeDasharray="6,4"
                />
              )}

              {/* Canal Path (TLBC) */}
              <polyline
                points={canalPoints}
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="2.5"
                opacity="0.8"
              />

              {/* Sector Nodes / Connecting Links */}
              {showVillageSectors &&
                villages.map((v) => {
                  const { x, y } = projectCoord(v.coordinates.lat, v.coordinates.lng);
                  return (
                    <circle
                      key={`sector-${v.id}`}
                      cx={x}
                      cy={y}
                      r="40"
                      fill="#4f46e5"
                      fillOpacity={selectedVillage?.id === v.id ? '0.25' : '0.06'}
                      stroke="#818cf8"
                      strokeWidth="0.8"
                      strokeDasharray="2,2"
                    />
                  );
                })}

              {/* Development Works markers */}
              {showWorks &&
                developmentWorks.map((w) => {
                  const v = villages.find((vil) => vil.name === w.village);
                  if (!v) return null;
                  const { x, y } = projectCoord(v.coordinates.lat, v.coordinates.lng);
                  // Slight offset so markers don't overlap exactly
                  const offsetX = x + 14;
                  const offsetY = y - 10;
                  return (
                    <g key={`work-${w.id}`}>
                      <circle cx={offsetX} cy={offsetY} r="5" fill="#a855f7" />
                      <circle cx={offsetX} cy={offsetY} r="8" fill="#a855f7" opacity="0.3" />
                    </g>
                  );
                })}

              {/* Issues markers */}
              {showIssues &&
                issues
                  .filter((i) => !['Resolved', 'Closed', 'Rejected'].includes(i.status))
                  .map((i) => {
                    const v = villages.find((vil) => vil.name === i.village);
                    if (!v) return null;
                    const { x, y } = projectCoord(v.coordinates.lat, v.coordinates.lng);
                    const offsetX = x - 12;
                    const offsetY = y + 12;
                    const isCritical = i.priority === 'Critical' || i.priority === 'High';
                    return (
                      <g key={`issue-${i.id}`}>
                        <circle
                          cx={offsetX}
                          cy={offsetY}
                          r={isCritical ? '6' : '4.5'}
                          fill={isCritical ? '#ef4444' : '#f59e0b'}
                        />
                        {isCritical && (
                          <circle
                            cx={offsetX}
                            cy={offsetY}
                            r="10"
                            fill="#ef4444"
                            opacity="0.3"
                          />
                        )}
                      </g>
                    );
                  })}

              {/* Polling Booths markers */}
              {showPollingBooths &&
                pollingBooths.map((b) => {
                  const v = villages.find((vil) => vil.name === b.village);
                  if (!v) return null;
                  const { x, y } = projectCoord(v.coordinates.lat, v.coordinates.lng);
                  const offsetX = x + 6;
                  const offsetY = y + 16;
                  return (
                    <g key={`booth-${b.id}`}>
                      <rect
                        x={offsetX - 3}
                        y={offsetY - 3}
                        width="6"
                        height="6"
                        fill="#38bdf8"
                      />
                    </g>
                  );
                })}

              {/* Villages Nodes & Click Target */}
              {villages.map((v) => {
                const { x, y } = projectCoord(v.coordinates.lat, v.coordinates.lng);
                const isSelected = selectedVillage?.id === v.id;

                return (
                  <g
                    key={v.id}
                    onClick={() => setSelectedVillage(v)}
                    className="cursor-pointer group"
                  >
                    {/* Pulsing ring for selected village */}
                    {isSelected && (
                      <circle
                        cx={x}
                        cy={y}
                        r="14"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="2"
                        opacity="0.8"
                      />
                    )}

                    {/* Node dot */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? '7' : '5'}
                      fill={isSelected ? '#4f46e5' : '#ffffff'}
                      stroke="#1e1b4b"
                      strokeWidth="2"
                    />

                    {/* Village Label */}
                    {showVillageLabels && (
                      <text
                        x={x}
                        y={y - 10}
                        textAnchor="middle"
                        fill={isSelected ? '#e0e7ff' : '#cbd5e1'}
                        fontSize={isSelected ? '12' : '10'}
                        fontWeight={isSelected ? '700' : '500'}
                        className="pointer-events-none drop-shadow-md"
                      >
                        {v.name.split(' ')[0]}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="px-3 py-1 bg-slate-800/60 rounded text-[10px] text-slate-400 flex items-center justify-between">
            <span>Projection: WGS84 Sindhanur Sector Matrix</span>
            <span>Click any node to inspect village statistics</span>
          </div>
        </div>

        {/* Village Inspector Panel (Right) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between order-3">
          {selectedVillage ? (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                  Selected Village Inspector
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedVillage.name}
                </h3>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <Building className="w-3 h-3 text-slate-400" />
                  GP: {selectedVillage.gramPanchayat}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Issues</div>
                  <div className="text-base font-mono font-bold text-slate-800">
                    {selectedVillageIssues.length}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="text-[10px] text-amber-700 uppercase font-semibold">Open</div>
                  <div className="text-base font-mono font-bold text-amber-800">
                    {
                      selectedVillageIssues.filter(
                        (i) => !['Resolved', 'Closed', 'Rejected'].includes(i.status)
                      ).length
                    }
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                  <div className="text-[10px] text-emerald-700 uppercase font-semibold">Resolved</div>
                  <div className="text-base font-mono font-bold text-emerald-800">
                    {selectedVillageIssues.filter((i) => i.status === 'Resolved').length}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-100">
                  <div className="text-[10px] text-purple-700 uppercase font-semibold">Works</div>
                  <div className="text-base font-mono font-bold text-purple-800">
                    {selectedVillageWorks.length}
                  </div>
                </div>
              </div>

              {/* Active Works snippet */}
              <div>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Development Works
                </div>
                {selectedVillageWorks.length === 0 ? (
                  <div className="text-xs text-slate-400 italic">No current works in progress</div>
                ) : (
                  <div className="space-y-1.5">
                    {selectedVillageWorks.slice(0, 2).map((w) => (
                      <div
                        key={w.id}
                        onClick={() => onNavigate('development-works', w.id)}
                        className="p-2 rounded bg-slate-50 border border-slate-100 text-xs hover:bg-slate-100 cursor-pointer"
                      >
                        <div className="font-semibold text-slate-800 truncate">{w.workName}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 flex justify-between">
                          <span>{w.status}</span>
                          <span>Progress: {w.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Grievances snippet */}
              <div>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Recent Grievances
                </div>
                {selectedVillageIssues.length === 0 ? (
                  <div className="text-xs text-slate-400 italic">No issues reported</div>
                ) : (
                  <div className="space-y-1.5">
                    {selectedVillageIssues.slice(0, 2).map((i) => (
                      <div
                        key={i.id}
                        onClick={() => onNavigate('issues', i.id)}
                        className="p-2 rounded bg-slate-50 border border-slate-100 text-xs hover:bg-slate-100 cursor-pointer"
                      >
                        <div className="flex justify-between font-semibold text-slate-800">
                          <span className="font-mono text-indigo-600">{i.id}</span>
                          <span>{i.priority}</span>
                        </div>
                        <div className="text-slate-600 truncate mt-0.5">{i.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Select a village node on the map to inspect records
            </div>
          )}

          {selectedVillage && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <button
                onClick={() => onNavigate('villages', selectedVillage.id)}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                View Full Village Portfolio &rarr;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Official GeoJSON Import Modal */}
      {geoJsonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-5 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-slate-800 mb-1">
              Upload Official Constituency GeoJSON
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              In accordance with government GIS compliance, official Survey of India or Karnataka Remote Sensing Applications Centre (KRSAC) boundary GeoJSON files can be plugged directly into this map layer.
            </p>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <label className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer">
                Choose .geojson or .json file
                <input
                  type="file"
                  accept=".geojson,application/json"
                  onChange={handleGeoJsonUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-400 mt-1">
                Supports Polygon, MultiPolygon and Point feature collections
              </p>
            </div>

            {geoJsonStatus && (
              <div className="mt-3 p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-800">
                {geoJsonStatus}
              </div>
            )}

            <div className="pt-4 mt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setGeoJsonModalOpen(false);
                  setGeoJsonStatus(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
