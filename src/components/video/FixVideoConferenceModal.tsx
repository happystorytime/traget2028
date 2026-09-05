import React, { useState, useEffect } from 'react';
import {
  X,
  Video,
  Calendar,
  Clock,
  MapPin,
  Building,
  UserCheck,
  Shield,
  FileText,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { Village, VillageVideoConference, VideoConferenceStatus } from '../../types';
import { StorageService } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { ALL_124_VILLAGES } from '../../data/officialVillages';

interface FixVideoConferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editConference?: VillageVideoConference | null;
  villages: Village[];
  onSaved: (conference: VillageVideoConference) => void;
}

const DEPARTMENTS = [
  'Rural Water Supply & Sanitation (RDPR)',
  'Public Works Department (PWD)',
  'Gulbarga Electricity Supply Company (GESCOM)',
  'Tungabhadra Left Bank Canal (TLBC) / Irrigation',
  'Agriculture & Horticulture Department',
  'Health and Family Welfare Services',
  'School Education & Literacy (BEO)',
  'Revenue & Taluk Administration',
  'City Municipal Council (CMC Sindhanur)',
];

export const FixVideoConferenceModal: React.FC<FixVideoConferenceModalProps> = ({
  isOpen,
  onClose,
  editConference,
  villages,
  onSaved,
}) => {
  const { currentUser } = useAuth();
  const isVillageHead = currentUser.role === 'VILLAGE HEAD';

  // Form states
  const [village, setVillage] = useState<string>('');
  const [gramPanchayat, setGramPanchayat] = useState<string>('');
  const [villageHeadName, setVillageHeadName] = useState<string>('');
  const [villageHeadPhone, setVillageHeadPhone] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>('11:00 AM');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [status, setStatus] = useState<VideoConferenceStatus>('Scheduled');
  const [agenda, setAgenda] = useState<string>('');
  const [departmentInvited, setDepartmentInvited] = useState<string>(DEPARTMENTS[0]);
  const [mlaOfficeAttending, setMlaOfficeAttending] = useState<boolean>(true);
  const [expectedParticipants, setExpectedParticipants] = useState<number>(40);

  // Initialize or populate
  useEffect(() => {
    if (editConference) {
      setVillage(editConference.village);
      setGramPanchayat(editConference.gramPanchayat || '');
      setVillageHeadName(editConference.fixedByVillageHead);
      setVillageHeadPhone(editConference.villageHeadPhone || '');
      setTitle(editConference.title);
      setDate(editConference.date);
      setTime(editConference.time);
      setDurationMinutes(editConference.durationMinutes || 45);
      setStatus(editConference.status);
      setAgenda(editConference.agenda);
      setDepartmentInvited(editConference.departmentInvited || DEPARTMENTS[0]);
      setMlaOfficeAttending(editConference.mlaOfficeAttending ?? true);
      setExpectedParticipants(editConference.expectedParticipants || 40);
    } else {
      // For new conference: if current user is Village Head, use their village
      const initialVillageName =
        (isVillageHead && currentUser.village) ||
        currentUser.village ||
        villages[0]?.name ||
        'Alabanoor';

      setVillage(initialVillageName);

      // Find matching village record from ALL_124_VILLAGES or villages
      const matched = ALL_124_VILLAGES.find(
        (v) => v.name.toLowerCase() === initialVillageName.toLowerCase()
      );

      const headName = isVillageHead
        ? currentUser.name
        : matched?.villageHead?.name || 'Goudappa Gowda Patil';
      const headPhone = isVillageHead
        ? currentUser.phone || '+91 94481 44556'
        : matched?.villageHead?.phone || '+91 94481 44556';

      setVillageHeadName(headName);
      setVillageHeadPhone(headPhone);
      setGramPanchayat(matched?.gramPanchayat || '');
      setTitle(`Janaspandana & Grievance Video Sabha (${initialVillageName})`);
      setDate(new Date().toISOString().slice(0, 10));
      setTime('11:00 AM');
      setDurationMinutes(45);
      setStatus('Scheduled');
      setAgenda(
        `1. Drinking water pipeline repairs & valve check\n2. Status of pending citizen grievances\n3. Monsoon road drainage clearance`
      );
      setDepartmentInvited(DEPARTMENTS[0]);
      setMlaOfficeAttending(true);
      setExpectedParticipants(50);
    }
  }, [editConference, currentUser, isVillageHead, villages, isOpen]);

  // When village changes in dropdown, auto-update the designated village head
  const handleVillageSelect = (selectedName: string) => {
    setVillage(selectedName);
    const matched = ALL_124_VILLAGES.find(
      (v) => v.name.toLowerCase() === selectedName.toLowerCase()
    );
    if (matched) {
      setGramPanchayat(matched.gramPanchayat);
      if (!isVillageHead) {
        setVillageHeadName(matched.villageHead.name);
        setVillageHeadPhone(matched.villageHead.phone);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !village.trim() || !villageHeadName.trim()) return;

    const shortCode = village.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'VIL');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const roomCode = editConference?.roomCode || `SIN-${shortCode}-${randomSuffix}`;
    const confId = editConference?.id || `VC-2025-${randomSuffix}`;

    const newConf: VillageVideoConference = {
      id: confId,
      title: title.trim(),
      village,
      gramPanchayat: gramPanchayat || undefined,
      fixedByVillageHead: villageHeadName.trim(),
      villageHeadPhone: villageHeadPhone.trim(),
      date,
      time,
      durationMinutes: Number(durationMinutes) || 45,
      status,
      agenda: agenda.trim(),
      roomCode,
      meetingLink: `https://constituencyconnect.karnataka.gov.in/join/${roomCode}`,
      departmentInvited,
      mlaOfficeAttending,
      expectedParticipants: Number(expectedParticipants) || 30,
      actualAttendeesCount: editConference?.actualAttendeesCount,
      keyIssuesDiscussed: editConference?.keyIssuesDiscussed || [],
      decisionsMade: editConference?.decisionsMade || [],
      chatMessages: editConference?.chatMessages || [],
      createdAt: editConference?.createdAt || new Date().toISOString(),
    };

    StorageService.saveVideoConference(newConf, currentUser);
    onSaved(newConf);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editConference ? 'Edit Village Video Conference' : 'Fix Village Video Conference'}
              </h2>
              <p className="text-xs text-slate-500">
                Authorized for Village Heads &amp; Constituency Administration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          
          {/* Village Head Authority Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-950">
                Designated Village Head Meeting Fixer
              </div>
              <p className="text-[11px] text-amber-800 leading-snug">
                Every village has an official Village Head who has the power to fix virtual conferences with villagers, invite department officers, and record binding resolutions.
              </p>
            </div>
          </div>

          {/* Row 1: Village & Village Head */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Village (Select from 124 Villages) *
              </label>
              <select
                value={village}
                onChange={(e) => handleVillageSelect(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                required
              >
                {ALL_124_VILLAGES.map((v) => (
                  <option key={v.villageCode} value={v.name}>
                    {v.name} ({v.gramPanchayat})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Fixed by Village Head *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={villageHeadName}
                  onChange={(e) => setVillageHeadName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-semibold"
                  placeholder="Village Head Name"
                  required
                />
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 absolute right-2.5 top-3" />
              </div>
            </div>
          </div>

          {/* Row 2: Village Head Contact & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Village Head Contact Phone
              </label>
              <input
                type="tel"
                value={villageHeadPhone}
                onChange={(e) => setVillageHeadPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                placeholder="+91 94481 00000"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Conference Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VideoConferenceStatus)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Live">Live (Start Now)</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Row 3: Title */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Conference Title / Subject *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-semibold"
              placeholder="e.g. Village Drinking Water & Road Clearance Samvada"
              required
            />
          </div>

          {/* Row 4: Date, Time & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Time *
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                placeholder="11:00 AM"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Duration (Minutes)
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                min={15}
                max={180}
              />
            </div>
          </div>

          {/* Row 5: Department to Invite & Expected Participants */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Invite Government Department (Nodal Officer)
              </label>
              <select
                value={departmentInvited}
                onChange={(e) => setDepartmentInvited(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Expected Participants
              </label>
              <input
                type="number"
                value={expectedParticipants}
                onChange={(e) => setExpectedParticipants(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                min={5}
                max={500}
              />
            </div>
          </div>

          {/* Checkbox: Invite MLA Office */}
          <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <input
              type="checkbox"
              id="mlaOfficeAttending"
              checked={mlaOfficeAttending}
              onChange={(e) => setMlaOfficeAttending(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <label htmlFor="mlaOfficeAttending" className="font-semibold text-slate-800 cursor-pointer">
              Invite MLA Constituency Office Representative to attend video call
            </label>
          </div>

          {/* Agenda */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Agenda &amp; Village Issues to Address *
            </label>
            <textarea
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
              placeholder="List specific village problems, pipeline works, grievance numbers, or community questions..."
              required
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <div className="text-[11px] text-slate-500">
              Direct video meeting link will be auto-generated upon fixing.
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editConference ? 'Save Changes' : 'Fix Video Conference'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
