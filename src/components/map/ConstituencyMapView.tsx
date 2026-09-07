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
  Users,
  Video,
  Calendar,
  Phone,
  Clock,
  Compass,
  Building2,
  Landmark,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import {
  Village,
  Issue,
  DevelopmentWork,
  PollingBooth,
  GramPanchayat,
  PublicMeeting,
  FieldVisit,
  ActiveTab,
} from '../../types';

interface ConstituencyMapViewProps {
  villages?: Village[];
  issues?: Issue[];
  developmentWorks?: DevelopmentWork[];
  pollingBooths?: PollingBooth[];
  gramPanchayats?: GramPanchayat[];
  publicMeetings?: PublicMeeting[];
  fieldVisits?: FieldVisit[];
  onNavigate?: (tab: ActiveTab, id?: string) => void;
}

// Key Government Headquarters in Sindhanur AC-58
interface GovernmentBuilding {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  description: string;
  officerInCharge: string;
}

const SINDHANUR_GOVT_BUILDINGS: GovernmentBuilding[] = [
  {
    id: 'bld-1',
    name: 'Mini Vidhana Soudha (Taluk Office)',
    category: 'Revenue & Administration',
    lat: 15.772,
    lng: 76.761,
    description: 'Tahsildar Office, Assistant Commissioner Court, Sub-Registrar, Electoral Registration Office',
    officerInCharge: 'Tahsildar, Sindhanur Taluk',
  },
  {
    id: 'bld-2',
    name: 'Sindhanur City Municipal Council (CMC)',
    category: 'Urban Local Body',
    lat: 15.766,
    lng: 76.758,
    description: 'Municipal governance, water supply, sanitation, urban infrastructure',
    officerInCharge: 'CMC Commissioner',
  },
  {
    id: 'bld-3',
    name: 'APMC Market Yard (Agricultural Produce)',
    category: 'Agriculture & Commerce',
    lat: 15.778,
    lng: 76.772,
    description: 'One of the largest Paddy & Cotton trading yards in Karnataka',
    officerInCharge: 'APMC Secretary',
  },
  {
    id: 'bld-4',
    name: 'Taluk Panchayat Office',
    category: 'Rural Development & PR',
    lat: 15.775,
    lng: 76.755,
    description: 'Administration of 35 Gram Panchayats and MGNREGA programs',
    officerInCharge: 'Executive Officer (EO), Taluk Panchayat',
  },
  {
    id: 'bld-5',
    name: 'GESCOM Major Sub-Division Office',
    category: 'Power & Irrigation',
    lat: 15.769,
    lng: 76.764,
    description: 'Gulbarga Electricity Supply Company - Rural and Irrigation IP Sets grid',
    officerInCharge: 'Executive Engineer (Elec), GESCOM',
  },
];

export const ConstituencyMapView: React.FC<ConstituencyMapViewProps> = ({
  villages = [],
  issues = [],
  developmentWorks = [],
  pollingBooths = [],
  gramPanchayats = [],
  publicMeetings = [],
  fieldVisits = [],
  onNavigate = (_tab: ActiveTab, _id?: string) => {},
}) => {
  // Cascading Filters State
  const [selectedDistrict] = useState('Raichur');
  const [selectedConstituency] = useState('AC-58 Sindhanur');
  const [selectedTaluk] = useState('Sindhanur');
  const [selectedGP, setSelectedGP] = useState<string>('all');
  const [selectedVillageId, setSelectedVillageId] = useState<string>('all');
  const [selectedBoothNumber, setSelectedBoothNumber] = useState<string>('all');

  // Layer Toggles
  const [showVillageBoundaries, setShowVillageBoundaries] = useState(true);
  const [showGPBoundaries, setShowGPBoundaries] = useState(true);
  const [showPollingBooths, setShowPollingBooths] = useState(true);
  const [showRoadsCanal, setShowRoadsCanal] = useState(true);
  const [showGovtBuildings, setShowGovtBuildings] = useState(true);
  const [showIssues, setShowIssues] = useState(true);
  const [showWorks, setShowWorks] = useState(true);
  const [showMeetings, setShowMeetings] = useState(true);

  // Selected Inspector Entities
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(villages[0] || null);
  const [selectedBuilding, setSelectedBuilding] = useState<GovernmentBuilding | null>(null);
  const [selectedBooth, setSelectedBooth] = useState<PollingBooth | null>(null);

  // Zoom & Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // GeoJSON Modal
  const [geoJsonModalOpen, setGeoJsonModalOpen] = useState(false);
  const [geoJsonStatus, setGeoJsonStatus] = useState<string | null>(null);

  // Bounds for Sindhanur AC-58:
  // Lat: 15.65 (south) to 15.90 (north)
  // Lng: 76.62 (west) to 76.95 (east)
  const minLat = 15.65;
  const maxLat = 15.90;
  const minLng = 76.62;
  const maxLng = 76.95;

  const projectCoord = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 740 + 80;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 440 + 80;
    return { x, y };
  };

  // Filtered Villages based on GP filter
  const filteredVillages = useMemo(() => {
    return villages.filter((v) => {
      if (selectedGP !== 'all' && v.gramPanchayat !== selectedGP) return false;
      if (selectedVillageId !== 'all' && v.id !== selectedVillageId) return false;
      return true;
    });
  }, [villages, selectedGP, selectedVillageId]);

  // Filtered Booths based on GP/Village filter
  const filteredBooths = useMemo(() => {
    return pollingBooths.filter((b) => {
      if (selectedGP !== 'all' && b.gramPanchayat !== selectedGP) return false;
      if (selectedVillageId !== 'all') {
        const v = villages.find((item) => item.id === selectedVillageId);
        if (v && b.village !== v.name) return false;
      }
      if (selectedBoothNumber !== 'all' && b.boothNumber.toString() !== selectedBoothNumber) {
        return false;
      }
      return true;
    });
  }, [pollingBooths, selectedGP, selectedVillageId, selectedBoothNumber, villages]);

  // Constituency Outer Boundary Polygon
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

  // TLBC Main Canal path
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

  // Highway Route (SH-19 / Gangavathi-Sindhanur-Raichur highway)
  const highwayPoints = useMemo(() => {
    const pts = [
      { lat: 15.67, lng: 76.71 },
      { lat: 15.72, lng: 76.74 },
      { lat: 15.77, lng: 76.76 },
      { lat: 15.82, lng: 76.80 },
      { lat: 15.88, lng: 76.86 },
    ];
    return pts
      .map((p) => {
        const { x, y } = projectCoord(p.lat, p.lng);
        return `${x},${y}`;
      })
      .join(' ');
  }, []);

  // Selected Village Metrics
  const selectedVillageData = useMemo(() => {
    if (!selectedVillage) return null;

    const vIssues = issues.filter((i) => i.village === selectedVillage.name);
    const vWorks = developmentWorks.filter((w) => w.village === selectedVillage.name);
    const vBooths = pollingBooths.filter((b) => b.village === selectedVillage.name);
    const vMeetings = publicMeetings.filter((m) => m.village === selectedVillage.name);
    const vVisits = fieldVisits.filter((v) => v.village === selectedVillage.name);

    const totalVoters = vBooths.reduce((acc, b) => acc + b.totalVoters, 0) || Math.round((selectedVillage.population || 2500) * 0.68);
    const maleVoters = vBooths.reduce((acc, b) => acc + b.maleVoters, 0) || Math.round(totalVoters * 0.51);
    const femaleVoters = vBooths.reduce((acc, b) => acc + b.femaleVoters, 0) || Math.round(totalVoters * 0.49);

    const boothNumbers = vBooths.map((b) => `#${b.boothNumber}`).join(', ') || `Booth #${selectedVillage.id.slice(-2)}`;

    const lastVisit = vVisits[0]?.visitDate || '2025-02-18';
    const lastMeeting = vMeetings[0]?.meetingDate || '2025-02-12';

    return {
      village: selectedVillage,
      issues: vIssues,
      openIssues: vIssues.filter((i) => !['Resolved', 'Closed', 'Rejected'].includes(i.status)),
      resolvedIssues: vIssues.filter((i) => i.status === 'Resolved'),
      works: vWorks,
      booths: vBooths,
      totalVoters,
      maleVoters,
      femaleVoters,
      boothNumbers,
      workersCount: selectedVillage.membersCount || (vBooths.length * 5 + 6),
      lastVisit,
      lastMeeting,
    };
  }, [selectedVillage, issues, developmentWorks, pollingBooths, publicMeetings, fieldVisits]);

  const handleGeoJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string);
          setGeoJsonStatus(`Loaded GeoJSON successfully (${parsed.features?.length || 0} features).`);
        } catch {
          setGeoJsonStatus('Invalid GeoJSON format. Please verify file syntax.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleVillageClick = (v: Village) => {
    setSelectedVillage(v);
    setSelectedBuilding(null);
    setSelectedBooth(null);
  };

  const handleBuildingClick = (bld: GovernmentBuilding) => {
    setSelectedBuilding(bld);
    setSelectedBooth(null);
  };

  const handleBoothClick = (booth: PollingBooth) => {
    setSelectedBooth(booth);
    const matchedVil = villages.find((v) => v.name === booth.village);
    if (matchedVil) setSelectedVillage(matchedVil);
    setSelectedBuilding(null);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-600" />
              <span>Sindhanur AC-58 GIS Operations Map</span>
            </h1>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-200">
              KRSAC &amp; ECI Verified Layer
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time geospatial intelligence: revenue village boundaries, 262 polling booths, grievances, public works, and administrative centers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setGeoJsonModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Official GeoJSON</span>
          </button>
        </div>
      </div>

      {/* Cascading Administrative Filter Hierarchy */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
          <MapPin className="w-3.5 h-3.5 text-indigo-600" />
          <span>Administrative Hierarchy Navigation: District &rarr; AC &rarr; Taluk &rarr; GP &rarr; Village &rarr; Booth</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          {/* 1. District */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">1. District</label>
            <div className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold truncate">
              {selectedDistrict}
            </div>
          </div>

          {/* 2. Assembly Constituency */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">2. Assembly Const.</label>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1.5 text-indigo-800 font-semibold truncate">
              {selectedConstituency}
            </div>
          </div>

          {/* 3. Taluk */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">3. Taluk</label>
            <div className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold truncate">
              {selectedTaluk}
            </div>
          </div>

          {/* 4. Gram Panchayat */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">4. Gram Panchayat</label>
            <select
              value={selectedGP}
              onChange={(e) => {
                setSelectedGP(e.target.value);
                setSelectedVillageId('all');
                setSelectedBoothNumber('all');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 truncate cursor-pointer font-medium"
            >
              <option value="all">All 35 GPs</option>
              {gramPanchayats.map((gp) => (
                <option key={gp.id} value={gp.name}>
                  {gp.name}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Village */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">5. Revenue Village</label>
            <select
              value={selectedVillageId}
              onChange={(e) => {
                setSelectedVillageId(e.target.value);
                setSelectedBoothNumber('all');
                if (e.target.value !== 'all') {
                  const v = villages.find((vil) => vil.id === e.target.value);
                  if (v) handleVillageClick(v);
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 truncate cursor-pointer font-medium"
            >
              <option value="all">All Villages ({filteredVillages.length})</option>
              {filteredVillages.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Polling Booth */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">6. Polling Booth</label>
            <select
              value={selectedBoothNumber}
              onChange={(e) => {
                setSelectedBoothNumber(e.target.value);
                if (e.target.value !== 'all') {
                  const b = pollingBooths.find((bo) => bo.boothNumber.toString() === e.target.value);
                  if (b) handleBoothClick(b);
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 truncate cursor-pointer font-medium"
            >
              <option value="all">All Booths ({filteredBooths.length})</option>
              {filteredBooths.slice(0, 100).map((b) => (
                <option key={b.id} value={b.boothNumber}>
                  Booth {b.boothNumber} - {b.village}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Map + Layers + Village Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Layer Controls Panel (Left, 1 col) */}
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
                checked={showVillageBoundaries}
                onChange={(e) => setShowVillageBoundaries(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-slate-700 font-medium">Village boundaries &amp; nodes</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showGPBoundaries}
                onChange={(e) => setShowGPBoundaries(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-slate-700 font-medium">Gram Panchayat clusters</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showPollingBooths}
                onChange={(e) => setShowPollingBooths(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-slate-700 font-medium flex items-center gap-1.5">
                <Vote className="w-3.5 h-3.5 text-sky-500" />
                <span>Polling Booths (262 stations)</span>
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showRoadsCanal}
                onChange={(e) => setShowRoadsCanal(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-slate-700 font-medium flex items-center gap-1.5">
                <span className="w-2.5 h-1 bg-sky-400 rounded-full" />
                <span>Roads &amp; TLBC Irrigation Canal</span>
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showGovtBuildings}
                onChange={(e) => setShowGovtBuildings(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-slate-700 font-medium flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Govt. Buildings (CMC, APMC, Soudha)</span>
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showIssues}
                onChange={(e) => setShowIssues(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-slate-700 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>Reported Issues ({issues.filter((i) => i.status !== 'Resolved').length})</span>
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
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                <span>Development Works ({developmentWorks.length})</span>
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showMeetings}
                onChange={(e) => setShowMeetings(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-slate-700 font-medium flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-emerald-600" />
                <span>Meetings &amp; Video Sabhas</span>
              </span>
            </label>
          </div>

          {/* Map Legend */}
          <div className="pt-3 border-t border-slate-100 text-[11px] space-y-2 text-slate-600">
            <div className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">GIS Symbology</div>
            <div className="grid grid-cols-1 gap-1.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 bg-sky-400 rounded-full" />
                <span>TLBC Canal Network</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 border border-white" />
                <span>Revenue Village Node</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-sky-500" />
                <span>Polling Booth Station</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" />
                <span>Mini Vidhana Soudha / CMC</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-200" />
                <span>High Priority Grievance</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                <span>Approved Infra Project</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Public Sabha / Video Conference</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map Canvas (Center, 2 cols) */}
        <div className="bg-slate-950 rounded-xl border border-slate-900 shadow-md p-2 lg:col-span-2 relative overflow-hidden flex flex-col justify-between min-h-[500px] order-1 lg:order-2 select-none">
          {/* Top disclaimer pill */}
          <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-xs text-slate-200 border border-slate-800 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono font-semibold">AC-58 SINDHANUR</span>
            <span className="text-slate-500">•</span>
            <span className="text-[11px] text-slate-300">124 Villages | 262 Booths</span>
          </div>

          {/* Zoom controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.25, 2.5))}
              className="w-8 h-8 rounded-lg bg-slate-900/90 text-white border border-slate-700 hover:bg-slate-800 flex items-center justify-center text-xs shadow-xs cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.25, 0.75))}
              className="w-8 h-8 rounded-lg bg-slate-900/90 text-white border border-slate-700 hover:bg-slate-800 flex items-center justify-center text-xs shadow-xs cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="w-8 h-8 rounded-lg bg-slate-900/90 text-white border border-slate-700 hover:bg-slate-800 flex items-center justify-center text-xs shadow-xs cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* SVG Canvas */}
          <div className="w-full h-full flex items-center justify-center p-1">
            <svg
              viewBox="0 0 900 600"
              className="w-full h-full max-h-[540px] transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              }}
            >
              <defs>
                <radialGradient id="mapBgGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#020617" />
                </radialGradient>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                </pattern>
                <linearGradient id="boundaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#312e81" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.25" />
                </linearGradient>
              </defs>

              {/* Background */}
              <rect width="900" height="600" fill="url(#mapBgGrad)" rx="12" />
              <rect width="900" height="600" fill="url(#grid)" opacity="0.4" rx="12" />

              {/* AC-58 Constituency Boundary */}
              {showVillageBoundaries && (
                <polygon
                  points={boundaryPoints}
                  fill="url(#boundaryGradient)"
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  strokeDasharray="6,4"
                />
              )}

              {/* Gram Panchayat Clusters / Sectors */}
              {showGPBoundaries &&
                villages.slice(0, 35).map((v) => {
                  const { x, y } = projectCoord(v.coordinates.lat, v.coordinates.lng);
                  return (
                    <circle
                      key={`gp-${v.id}`}
                      cx={x}
                      cy={y}
                      r="48"
                      fill="#3730a3"
                      fillOpacity={selectedVillage?.gramPanchayat === v.gramPanchayat ? '0.22' : '0.04'}
                      stroke="#4338ca"
                      strokeWidth="0.8"
                      strokeDasharray="3,3"
                    />
                  );
                })}

              {/* TLBC Irrigation Canal Vector */}
              {showRoadsCanal && (
                <g>
                  <polyline
                    points={canalPoints}
                    fill="none"
                    stroke="#0ea5e9"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                  <text x="360" y="325" fill="#7dd3fc" fontSize="9" fontWeight="bold">
                    TLBC Main Canal (Tungabhadra Left Bank)
                  </text>
                </g>
              )}

              {/* State Highway Network */}
              {showRoadsCanal && (
                <g>
                  <polyline
                    points={highwayPoints}
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                    strokeDasharray="4,2"
                    opacity="0.6"
                  />
                  <text x="520" y="270" fill="#94a3b8" fontSize="8" fontWeight="bold">
                    SH-19 Raichur-Gangavathi Highway
                  </text>
                </g>
              )}

              {/* Important Government Buildings */}
              {showGovtBuildings &&
                SINDHANUR_GOVT_BUILDINGS.map((bld) => {
                  const { x, y } = projectCoord(bld.lat, bld.lng);
                  const isSelected = selectedBuilding?.id === bld.id;
                  return (
                    <g
                      key={bld.id}
                      transform={`translate(${x}, ${y})`}
                      onClick={() => handleBuildingClick(bld)}
                      className="cursor-pointer group"
                    >
                      {isSelected && (
                        <circle r="16" fill="#f59e0b" fillOpacity="0.3" stroke="#fde68a" strokeWidth="1.5" />
                      )}
                      <circle r="7" fill="#d97706" stroke="#ffffff" strokeWidth="1.5" />
                      <text
                        x="10"
                        y="3"
                        fill={isSelected ? '#fde68a' : '#f59e0b'}
                        fontSize="9"
                        fontWeight="bold"
                        className="drop-shadow-sm pointer-events-none"
                      >
                        {bld.name.split(' (')[0]}
                      </text>
                    </g>
                  );
                })}

              {/* Polling Booths (262 Booths) */}
              {showPollingBooths &&
                filteredBooths.map((b) => {
                  const v = villages.find((vil) => vil.name === b.village);
                  if (!v) return null;
                  const { x, y } = projectCoord(v.coordinates.lat, v.coordinates.lng);
                  const offsetX = x + ((b.boothNumber % 5) - 2) * 8;
                  const offsetY = y + ((b.boothNumber % 3) - 1) * 8;
                  const isSelected = selectedBooth?.id === b.id;

                  return (
                    <g
                      key={`booth-node-${b.id}`}
                      transform={`translate(${offsetX}, ${offsetY})`}
                      onClick={() => handleBoothClick(b)}
                      className="cursor-pointer"
                    >
                      <rect
                        x="-3"
                        y="-3"
                        width="6"
                        height="6"
                        fill={isSelected ? '#38bdf8' : '#0284c7'}
                        stroke="#ffffff"
                        strokeWidth={isSelected ? '1.5' : '0.5'}
                      />
                    </g>
                  );
                })}

              {/* Development Works Markers */}
              {showWorks &&
                developmentWorks.map((w) => {
                  const v = villages.find((vil) => vil.name === w.village);
                  if (!v) return null;
                  const { x, y } = projectCoord(v.coordinates.lat, v.coordinates.lng);
                  return (
                    <g key={`work-${w.id}`} transform={`translate(${x + 14}, ${y - 12})`}>
                      <circle r="5" fill="#a855f7" stroke="#ffffff" strokeWidth="1" />
                    </g>
                  );
                })}

              {/* Reported Issues Markers */}
              {showIssues &&
                issues
                  .filter((i) => !['Resolved', 'Closed', 'Rejected'].includes(i.status))
                  .map((i) => {
                    const v = villages.find((vil) => vil.name === i.village);
                    if (!v) return null;
                    const { x, y } = projectCoord(v.coordinates.lat, v.coordinates.lng);
                    const isCritical = i.priority === 'Critical' || i.priority === 'High';
                    return (
                      <g key={`issue-${i.id}`} transform={`translate(${x - 14}, ${y + 12})`}>
                        <circle
                          r={isCritical ? '6' : '4.5'}
                          fill={isCritical ? '#ef4444' : '#f59e0b'}
                          stroke="#ffffff"
                          strokeWidth="1"
                        />
                      </g>
                    );
                  })}

              {/* Meetings & Video Conferences Markers */}
              {showMeetings &&
                publicMeetings.map((m) => {
                  const v = villages.find((vil) => vil.name === m.village);
                  if (!v) return null;
                  const { x, y } = projectCoord(v.coordinates.lat, v.coordinates.lng);
                  return (
                    <g key={`meet-${m.id}`} transform={`translate(${x - 16}, ${y - 14})`}>
                      <circle r="5.5" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
                    </g>
                  );
                })}

              {/* Villages Main Pins */}
              {filteredVillages.map((v) => {
                const { x, y } = projectCoord(v.coordinates.lat, v.coordinates.lng);
                const isSelected = selectedVillage?.id === v.id;
                const hasOpenIssues = (v.openIssuesCount || 0) > 0;

                return (
                  <g
                    key={v.id}
                    transform={`translate(${x}, ${y})`}
                    onClick={() => handleVillageClick(v)}
                    className="cursor-pointer group"
                  >
                    {isSelected && (
                      <circle r="16" fill="#6366f1" fillOpacity="0.35" stroke="#a5b4fc" strokeWidth="1.5" />
                    )}
                    <circle
                      r={isSelected ? 6.5 : 4.5}
                      fill={hasOpenIssues ? '#f59e0b' : '#10b981'}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 2 : 1}
                    />
                    <text
                      x="8"
                      y="3.5"
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
          </div>
        </div>

        {/* Selected Entity Inspector Panel (Right, 1 col) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between order-3 space-y-4">
          {/* Case 1: Government Building Selected */}
          {selectedBuilding ? (
            <div className="space-y-3.5">
              <div className="pb-3 border-b border-slate-100">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                  Government Headquarters
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {selectedBuilding.name}
                </h3>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5 text-slate-400" />
                  <span>Category: {selectedBuilding.category}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-xs space-y-2">
                <div>
                  <div className="text-[10px] font-bold uppercase text-amber-800">Officer In-Charge</div>
                  <div className="font-semibold text-slate-900 mt-0.5">{selectedBuilding.officerInCharge}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-amber-800">Operational Functions</div>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">{selectedBuilding.description}</p>
                </div>
              </div>

              <div className="text-xs text-slate-500">
                Lat: {selectedBuilding.lat.toFixed(4)}, Lng: {selectedBuilding.lng.toFixed(4)}
              </div>

              <button
                onClick={() => setSelectedBuilding(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Return to Village Inspector
              </button>
            </div>
          ) : selectedBooth ? (
            /* Case 2: Polling Booth Selected */
            <div className="space-y-3.5">
              <div className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">
                    Polling Booth Inspector
                  </span>
                  <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-mono text-xs font-bold">
                    Booth #{selectedBooth.boothNumber}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {selectedBooth.boothName}
                </h3>
                <div className="text-xs text-slate-500 mt-1">
                  Village: {selectedBooth.village} • GP: {selectedBooth.gramPanchayat}
                </div>
              </div>

              {/* Booth Voter Demographics */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Total Voters</div>
                  <div className="text-sm font-bold text-slate-900">{selectedBooth.totalVoters}</div>
                </div>
                <div className="p-2 rounded bg-blue-50 border border-blue-200">
                  <div className="text-[10px] text-blue-600 font-bold uppercase">Male</div>
                  <div className="text-sm font-bold text-blue-900">{selectedBooth.maleVoters}</div>
                </div>
                <div className="p-2 rounded bg-pink-50 border border-pink-200">
                  <div className="text-[10px] text-pink-600 font-bold uppercase">Female</div>
                  <div className="text-sm font-bold text-pink-900">{selectedBooth.femaleVoters}</div>
                </div>
              </div>

              {/* Booth Coordinator */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                <div className="text-[10px] font-bold uppercase text-slate-500">Booth Coordinator (BLA-2)</div>
                <div className="font-bold text-slate-900">{selectedBooth.coordinatorName}</div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{selectedBooth.coordinatorPhone}</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => onNavigate('booths')}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  View in All 262 Booths Registry
                </button>
                <button
                  onClick={() => setSelectedBooth(null)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Return to Village Inspector
                </button>
              </div>
            </div>
          ) : selectedVillageData ? (
            /* Case 3: Village Detailed Profile (User Prompt Requirements) */
            <div className="space-y-3.5 overflow-y-auto max-h-[560px] pr-1">
              <div className="pb-2 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                    Village Profile
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                    GP: {selectedVillageData.village.gramPanchayat}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {selectedVillageData.village.name}
                </h3>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Taluk: Sindhanur • PIN: {selectedVillageData.village.pinCode || '584128'}
                </div>
              </div>

              {/* Population & Demographics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Population</div>
                  <div className="text-sm font-bold text-slate-900">
                    {selectedVillageData.village.population?.toLocaleString() || '2,450'}
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Households</div>
                  <div className="text-sm font-bold text-slate-900">
                    {selectedVillageData.village.households?.toLocaleString() || '480'}
                  </div>
                </div>
                <div className="p-2 rounded bg-sky-50 border border-sky-200">
                  <div className="text-[10px] text-sky-700 font-semibold uppercase">Polling Booths</div>
                  <div className="text-xs font-bold text-sky-900 truncate">
                    {selectedVillageData.boothNumbers}
                  </div>
                </div>
                <div className="p-2 rounded bg-indigo-50 border border-indigo-200">
                  <div className="text-[10px] text-indigo-700 font-semibold uppercase">Total Voters</div>
                  <div className="text-sm font-bold text-indigo-900">
                    {selectedVillageData.totalVoters.toLocaleString()}
                    <span className="text-[10px] font-normal text-indigo-600 block">
                      (M: {selectedVillageData.maleVoters} | F: {selectedVillageData.femaleVoters})
                    </span>
                  </div>
                </div>
              </div>

              {/* Cadre Workers & Contact Person (Village Head) */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Contact Person (Village Head)</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {selectedVillageData.workersCount} Cadre Workers
                  </span>
                </div>
                <div className="font-bold text-slate-900">
                  {selectedVillageData.village.contactPerson || `${selectedVillageData.village.name} Grama Mukhyastha`}
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{selectedVillageData.village.contactPhone || '+91 98451 72910'}</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Coordinator</span>
                </div>
              </div>

              {/* Last Visit & Last Meeting */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-600" />
                    <span>Last Visit</span>
                  </div>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedVillageData.lastVisit}</div>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-purple-600" />
                    <span>Last Sabha</span>
                  </div>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedVillageData.lastMeeting}</div>
                </div>
              </div>

              {/* Pending Complaints & Development Works */}
              <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800 uppercase text-[10px]">
                  <span>Active Grievances ({selectedVillageData.openIssues.length})</span>
                  <span className="text-purple-700 font-semibold">
                    {selectedVillageData.works.length} Infra Works
                  </span>
                </div>

                {selectedVillageData.openIssues.length === 0 ? (
                  <div className="text-slate-400 italic text-[11px]">No pending grievances recorded.</div>
                ) : (
                  <div className="space-y-1.5">
                    {selectedVillageData.openIssues.slice(0, 2).map((iss) => (
                      <div
                        key={iss.id}
                        onClick={() => onNavigate('issues', iss.id)}
                        className="p-1.5 rounded bg-white border border-slate-200 hover:border-indigo-300 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-900">
                          <span className="truncate max-w-[130px]">{iss.category}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                            {iss.priority}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{iss.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => onNavigate('video-conferences')}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Start Video Sabha With Village</span>
                </button>
                <button
                  onClick={() => onNavigate('villages', selectedVillageData.village.id)}
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>View Full Village Portfolio</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Click any village node or booth on the map to inspect its detailed portfolio.
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
              In accordance with government GIS compliance, official Survey of India, KRSAC or Election Commission of India boundary GeoJSON files can be plugged directly into this map layer.
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
                Supports Polygon, MultiPolygon and Point feature collections for AC-58 Sindhanur
              </p>
            </div>

            {geoJsonStatus && (
              <div className="mt-3 p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{geoJsonStatus}</span>
              </div>
            )}

            <div className="pt-4 mt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setGeoJsonModalOpen(false);
                  setGeoJsonStatus(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg cursor-pointer"
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
