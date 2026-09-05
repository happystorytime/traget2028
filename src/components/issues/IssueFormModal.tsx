import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2 } from 'lucide-react';
import {
  Issue,
  IssueCategory,
  IssuePriority,
  IssueStatus,
  Village,
  GramPanchayat,
  Department,
  User,
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../services/storage';

interface IssueFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editIssue?: Issue | null;
  presetCategory?: IssueCategory | null;
  villages: Village[];
  gramPanchayats: GramPanchayat[];
  departments: Department[];
  users: User[];
  onSaved: (issue: Issue) => void;
}

const CATEGORIES: IssueCategory[] = [
  'Roads',
  'Drinking Water',
  'Drainage',
  'Electricity',
  'Street Lights',
  'Sanitation',
  'Waste Management',
  'Agriculture',
  'Irrigation',
  'Education',
  'Healthcare',
  'Transport',
  'Housing',
  'Government Services',
  'Other',
];

const PRIORITIES: IssuePriority[] = ['Low', 'Medium', 'High', 'Critical'];

const STATUSES: IssueStatus[] = [
  'New',
  'Verified',
  'Assigned',
  'In Progress',
  'Waiting for Department',
  'Resolved',
  'Closed',
  'Rejected',
];

// Helper to suggest appropriate department based on category
function getSuggestedDepartment(cat: IssueCategory): string {
  switch (cat) {
    case 'Roads':
      return 'Public Works Department (PWD)';
    case 'Drinking Water':
    case 'Sanitation':
    case 'Drainage':
      return 'Rural Water Supply & Sanitation (RDPR)';
    case 'Electricity':
    case 'Street Lights':
      return 'Gulbarga Electricity Supply Company (GESCOM)';
    case 'Agriculture':
      return 'Agriculture & Horticulture Department';
    case 'Irrigation':
      return 'Tungabhadra Left Bank Canal (TLBC) / Irrigation';
    case 'Education':
      return 'School Education & Literacy (BEO)';
    case 'Healthcare':
      return 'Health and Family Welfare Services';
    case 'Waste Management':
      return 'City Municipal Council (CMC Sindhanur)';
    default:
      return 'Revenue & Taluk Administration';
  }
}

export const IssueFormModal: React.FC<IssueFormModalProps> = ({
  isOpen,
  onClose,
  editIssue,
  presetCategory,
  villages,
  gramPanchayats,
  departments,
  users,
  onSaved,
}) => {
  const { currentUser } = useAuth();
  const isMember = currentUser.role === 'VILLAGE MEMBER';

  const [id, setId] = useState('');
  const [dateReported, setDateReported] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [village, setVillage] = useState('');
  const [gramPanchayat, setGramPanchayat] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [category, setCategory] = useState<IssueCategory>('Drinking Water');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<IssuePriority>('Medium');
  const [department, setDepartment] = useState('');
  const [assignedStaff, setAssignedStaff] = useState('');
  const [status, setStatus] = useState<IssueStatus>('New');
  const [expectedResolutionDate, setExpectedResolutionDate] = useState('');
  const [resolvedDate, setResolvedDate] = useState('');
  const [resolutionDetails, setResolutionDetails] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoInput, setPhotoInput] = useState('');

  // Auto populate on edit or initialize for new
  useEffect(() => {
    if (editIssue) {
      setId(editIssue.id);
      setDateReported(editIssue.dateReported);
      setVillage(editIssue.village);
      setGramPanchayat(editIssue.gramPanchayat);
      setReporterName(editIssue.reporterName);
      setContactNumber(editIssue.contactNumber);
      setCategory(editIssue.category);
      setDescription(editIssue.description);
      setPriority(editIssue.priority);
      setDepartment(editIssue.department);
      setAssignedStaff(editIssue.assignedStaff || '');
      setStatus(editIssue.status);
      setExpectedResolutionDate(editIssue.expectedResolutionDate || '');
      setResolvedDate(editIssue.resolvedDate || '');
      setResolutionDetails(editIssue.resolutionDetails || '');
      setPhotos(editIssue.photos || []);
    } else {
      // New issue: generate next ID
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      setId(`CC-2025-${randomNum}`);
      setDateReported(new Date().toISOString().slice(0, 10));

      const memberVillage = currentUser.village;
      const initialVillage = memberVillage || villages[0]?.name || 'Gorebal';
      setVillage(initialVillage);
      // Auto-linking to Gram Panchayat removed per user request: user can manually select or leave empty
      setGramPanchayat(editIssue ? (editIssue.gramPanchayat || '') : '');

      if (isMember) {
        setReporterName(currentUser.name);
        setContactNumber(currentUser.phone || '');
      } else {
        setReporterName('');
        setContactNumber('');
      }

      const initialCategory = presetCategory || 'Drinking Water';
      setCategory(initialCategory);
      setDescription('');
      setPriority('Medium');
      setDepartment(getSuggestedDepartment(initialCategory));
      setAssignedStaff('');
      setStatus('New');
      // Set expected resolution date to 7 days from now
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setExpectedResolutionDate(d.toISOString().slice(0, 10));
      setResolvedDate('');
      setResolutionDetails('');
      setPhotos([]);
    }
  }, [editIssue, villages, isOpen, presetCategory, isMember, currentUser]);

  // Handle village change (independent of Gram Panchayat)
  const handleVillageChange = (selectedVil: string) => {
    setVillage(selectedVil);
  };

  // Handle category change -> auto update Department
  const handleCategoryChange = (selectedCat: IssueCategory) => {
    setCategory(selectedCat);
    setDepartment(getSuggestedDepartment(selectedCat));
  };

  // Add photo URL
  const handleAddPhoto = () => {
    if (photoInput.trim()) {
      setPhotos([...photos, photoInput.trim()]);
      setPhotoInput('');
    }
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotos([...photos, reader.result]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !reporterName.trim() || !village) return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const isCreating = !editIssue;
    let updatedIssue: Issue;

    if (isCreating) {
      updatedIssue = {
        id,
        dateReported,
        village,
        gramPanchayat,
        reporterName: reporterName.trim(),
        contactNumber: contactNumber.trim(),
        category,
        description: description.trim(),
        priority,
        department: department || getSuggestedDepartment(category),
        assignedStaff,
        status,
        expectedResolutionDate: expectedResolutionDate || undefined,
        resolvedDate: status === 'Resolved' ? (resolvedDate || dateReported) : undefined,
        resolutionDetails: status === 'Resolved' ? resolutionDetails : undefined,
        photos,
        documents: [],
        createdBy: `${currentUser.name} (${currentUser.role})`,
        lastUpdated: now,
        timeline: [
          {
            id: `t-${Date.now()}`,
            timestamp: now,
            author: currentUser.name,
            title: 'Grievance Registered',
            description: `Grievance officially registered into Constituency Connect platform.`,
            type: 'creation',
          },
        ],
        comments: [],
        statusHistory: [
          {
            from: 'New',
            to: status,
            changedBy: currentUser.name,
            timestamp: now,
            note: 'Initial status on creation',
          },
        ],
        assignmentHistory: assignedStaff
          ? [
              {
                fromStaff: 'Unassigned',
                toStaff: assignedStaff,
                assignedBy: currentUser.name,
                timestamp: now,
              },
            ]
          : [],
      };
    } else {
      updatedIssue = {
        ...editIssue,
        dateReported,
        village,
        gramPanchayat,
        reporterName: reporterName.trim(),
        contactNumber: contactNumber.trim(),
        category,
        description: description.trim(),
        priority,
        department,
        assignedStaff,
        status,
        expectedResolutionDate: expectedResolutionDate || undefined,
        resolvedDate: status === 'Resolved' ? (resolvedDate || now.slice(0, 10)) : undefined,
        resolutionDetails: status === 'Resolved' ? resolutionDetails : undefined,
        photos,
        lastUpdated: now,
      };
    }

    StorageService.saveIssue(
      updatedIssue,
      currentUser,
      isCreating ? `Created issue ${id}` : `Updated details of ${id}`
    );
    onSaved(updatedIssue);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {editIssue ? `Edit Grievance (${editIssue.id})` : 'Register New Grievance'}
            </h2>
            <p className="text-xs text-slate-500">
              Sindhanur AC-58 Citizen Grievance &amp; Issue Record
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Row 1: ID & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Grievance ID</label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-mono font-bold text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date Reported</label>
              <input
                type="date"
                value={dateReported}
                onChange={(e) => setDateReported(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                required
              />
            </div>
          </div>

          {/* Row 2: Village & Gram Panchayat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Village *</label>
              <select
                value={village}
                onChange={(e) => handleVillageChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                required
              >
                {villages.map((v) => (
                  <option key={v.id} value={v.name}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gram Panchayat (Optional)</label>
              <select
                value={gramPanchayat}
                onChange={(e) => setGramPanchayat(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
              >
                <option value="">-- None / Select Manually --</option>
                {gramPanchayats.map((gp) => (
                  <option key={gp.id} value={gp.name}>
                    {gp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Reporter Name & Contact Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reporter Name *</label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Citizen or community representative"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Number</label>
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+91 98450 00000"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
              />
            </div>
          </div>

          {/* Row 4: Category, Priority, Department */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as IssueCategory)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                required
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as IssuePriority)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 truncate"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="text-xs">
            <label className="block font-semibold text-slate-700 mb-1">Grievance Description *</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed explanation of the issue, specific location/ward/landmark, and public impact..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 leading-relaxed"
              required
            />
          </div>

          {/* Row 5: Status, Assigned Staff, Target Date (Admin / Staff only) */}
          {!isMember ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as IssueStatus)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Staff</label>
                <select
                  value={assignedStaff}
                  onChange={(e) => setAssignedStaff(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 truncate"
                >
                  <option value="">-- Unassigned --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Resolution Date
                </label>
                <input
                  type="date"
                  value={expectedResolutionDate}
                  onChange={(e) => setExpectedResolutionDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>
            </div>
          ) : (
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs flex items-center justify-between text-indigo-900">
              <span className="font-semibold">Workflow Status:</span>
              <span className="text-indigo-700 font-medium">
                Will be registered as <strong className="font-bold text-indigo-950">New</strong> and automatically forwarded to MLA Constituency Officers.
              </span>
            </div>
          )}

          {/* Resolution Details if status is Resolved */}
          {status === 'Resolved' && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
              <div className="font-bold text-emerald-800">Resolution Information</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Resolved Date</label>
                  <input
                    type="date"
                    value={resolvedDate}
                    onChange={(e) => setResolvedDate(e.target.value)}
                    className="w-full bg-white border border-emerald-300 rounded-lg p-2 text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Rectification Summary
                  </label>
                  <input
                    type="text"
                    value={resolutionDetails}
                    onChange={(e) => setResolutionDetails(e.target.value)}
                    placeholder="E.g. Repaired pump, replaced transformer..."
                    className="w-full bg-white border border-emerald-300 rounded-lg p-2 text-slate-800"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Photos / Attachments */}
          <div className="text-xs space-y-2">
            <label className="block font-semibold text-slate-700">Attach Field Photos</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={photoInput}
                onChange={(e) => setPhotoInput(e.target.value)}
                placeholder="Paste image URL..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
              />
              <button
                type="button"
                onClick={handleAddPhoto}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 font-medium text-slate-700 rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add URL
              </button>
              <label className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-medium rounded-lg flex items-center gap-1 cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Thumbnail previews */}
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {photos.map((p, idx) => (
                  <div
                    key={idx}
                    className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 group"
                  >
                    <img src={p} alt="Thumbnail" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                      className="absolute inset-0 bg-red-600/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              {editIssue ? 'Update Grievance' : 'Register Grievance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
