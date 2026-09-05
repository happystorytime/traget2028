import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Users,
  FileCheck,
  Share2,
  Send,
  Hand,
  Shield,
  Clock,
  Sparkles,
  CheckCircle,
  Copy,
  Volume2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { VillageVideoConference, VideoConferenceChatMessage, User } from '../../types';
import { StorageService } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';

interface LiveVideoRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  conference: VillageVideoConference;
  onConferenceUpdated?: (updated: VillageVideoConference) => void;
}

export const LiveVideoRoomModal: React.FC<LiveVideoRoomModalProps> = ({
  isOpen,
  onClose,
  conference,
  onConferenceUpdated,
}) => {
  const { currentUser } = useAuth();

  // Media states
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'chat' | 'decisions' | 'participants'>('chat');
  const [copiedLink, setCopiedLink] = useState(false);

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(864); // starts at ~14m for realism

  // Chat state
  const [chatMessages, setChatMessages] = useState<VideoConferenceChatMessage[]>(() => {
    return conference.chatMessages && conference.chatMessages.length > 0
      ? conference.chatMessages
      : [
          {
            id: 'msg-1',
            senderName: conference.fixedByVillageHead,
            senderRole: 'Village Head / Host',
            message: `Namaskara to everyone from ${conference.village}! We are discussing the key agenda points today.`,
            timestamp: '11:02 AM',
            isVillageHead: true,
          },
          {
            id: 'msg-2',
            senderName: conference.departmentInvited || 'Nodal Officer (RDPR)',
            senderRole: 'Department Officer',
            message: 'All pipeline maintenance reports for this sector have been retrieved. Ready for review.',
            timestamp: '11:04 AM',
          },
          {
            id: 'msg-3',
            senderName: 'Basavaraj Patil',
            senderRole: 'Village Member',
            message: 'Ward 2 borewell motor requires replacement as water supply has been low since Tuesday.',
            timestamp: '11:06 AM',
          },
        ];
  });
  const [newTextMessage, setNewTextMessage] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Decisions / Resolutions state
  const [decisionsList, setDecisionsList] = useState<string[]>(() => {
    return conference.decisionsMade && conference.decisionsMade.length > 0
      ? conference.decisionsMade
      : [
          `Immediate water tanker deployment to Ward 2 approved by ${conference.fixedByVillageHead}`,
          `Joint site inspection scheduled for Thursday with ${conference.departmentInvited || 'RDPR Officer'}`,
        ];
  });
  const [newDecisionInput, setNewDecisionInput] = useState('');

  // Elapsed timer ticker
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Scroll chat to bottom
  useEffect(() => {
    if (activeSidebarTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeSidebarTab]);

  if (!isOpen) return null;

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTextMessage.trim()) return;

    const newMsg: VideoConferenceChatMessage = {
      id: `msg-${Date.now()}`,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      message: newTextMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isVillageHead: currentUser.role === 'VILLAGE HEAD',
    };

    const updated = [...chatMessages, newMsg];
    setChatMessages(updated);
    setNewTextMessage('');

    // Persist via StorageService
    StorageService.addVideoConferenceMessage(conference.id, newMsg);

    const updatedConf = { ...conference, chatMessages: updated };
    if (onConferenceUpdated) onConferenceUpdated(updatedConf);
  };

  const handleAddDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDecisionInput.trim()) return;

    const updatedDecisions = [...decisionsList, newDecisionInput.trim()];
    setDecisionsList(updatedDecisions);
    setNewDecisionInput('');

    const updatedConf = {
      ...conference,
      decisionsMade: updatedDecisions,
    };
    StorageService.saveVideoConference(updatedConf, currentUser);
    if (onConferenceUpdated) onConferenceUpdated(updatedConf);
  };

  const handleCopyMeetingLink = () => {
    navigator.clipboard.writeText(
      `https://constituencyconnect.karnataka.gov.in/join/${conference.roomCode}`
    );
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isUserVillageHead =
    currentUser.role === 'VILLAGE HEAD' ||
    currentUser.name.toLowerCase().includes(conference.fixedByVillageHead.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-2 sm:p-4 overflow-hidden">
      <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600/90 text-white rounded-full text-xs font-bold tracking-wider animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              LIVE SABHA
            </span>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-2">
                <span>{conference.village} Village Video Conference</span>
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700 font-mono hidden md:inline-block">
                  {conference.roomCode}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 truncate flex items-center gap-2">
                <span>Fixed by Village Head: <strong className="text-amber-400">{conference.fixedByVillageHead}</strong></span>
                <span>•</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimer(elapsedSeconds)} elapsed
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMeetingLink}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
              title="Copy conference invite link"
            >
              {copiedLink ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Share Link</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Close video call preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Center: Main Stage (Video Grid + Sidebar) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Video Grid (Left / Center) */}
          <div className="flex-1 p-3 sm:p-4 bg-slate-950/60 overflow-y-auto flex flex-col justify-between gap-3">
            
            {/* 2x2 Grid of High-Fidelity Video Feeds */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 auto-rows-fr">
              
              {/* Tile 1: Village Head (Host / Moderator) */}
              <div className="relative bg-slate-900 rounded-xl border border-amber-500/40 overflow-hidden shadow-lg flex flex-col items-center justify-center group min-h-[160px] sm:min-h-[190px]">
                {/* Simulated live video background with active speaker aura */}
                <div className="absolute inset-0 bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-950 flex items-center justify-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-inner border-4 border-amber-400/80 animate-pulse">
                    GP
                  </div>
                </div>

                {/* Animated speaking audio waveform */}
                <div className="absolute top-3 right-3 flex items-center gap-0.5 px-2 py-1 bg-slate-950/80 rounded-full border border-amber-500/40 text-amber-400 text-[10px] font-mono">
                  <Volume2 className="w-3 h-3 text-amber-400 animate-bounce" />
                  <span>Speaking</span>
                </div>

                {/* Village Head / Host Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/90 text-slate-950 font-extrabold rounded-md text-[11px] shadow-sm">
                  <Shield className="w-3 h-3" />
                  <span>Village Head (Host)</span>
                </div>

                {/* Bottom label */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 bg-slate-950/85 backdrop-blur-xs rounded-lg border border-slate-800 text-xs">
                  <div className="font-semibold text-white truncate">
                    {conference.fixedByVillageHead} ({conference.village})
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono">Presiding</span>
                </div>
              </div>

              {/* Tile 2: Department Nodal Officer */}
              <div className="relative bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg flex flex-col items-center justify-center min-h-[160px] sm:min-h-[190px]">
                <div className="absolute inset-0 bg-gradient-to-b from-sky-950/20 via-slate-900 to-slate-950 flex items-center justify-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center text-white font-black text-2xl shadow-inner border-4 border-sky-400/50">
                    GOV
                  </div>
                </div>

                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 bg-sky-900/80 text-sky-200 font-semibold rounded-md text-[11px] border border-sky-700">
                  <span>{conference.departmentInvited || 'RDPR Department'}</span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 bg-slate-950/85 backdrop-blur-xs rounded-lg border border-slate-800 text-xs">
                  <div className="font-semibold text-white truncate">
                    Assistant Executive Engineer (Nodal)
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">Present</span>
                </div>
              </div>

              {/* Tile 3: Village Members / Grama Chavadi Hub */}
              <div className="relative bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg flex flex-col items-center justify-center min-h-[160px] sm:min-h-[190px]">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-slate-900 to-slate-950 flex items-center justify-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-2xl shadow-inner border-4 border-emerald-400/50">
                    16+
                  </div>
                </div>

                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 bg-emerald-900/80 text-emerald-200 font-semibold rounded-md text-[11px] border border-emerald-700">
                  <Users className="w-3 h-3" />
                  <span>Village Sabha Center ({conference.village})</span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 bg-slate-950/85 backdrop-blur-xs rounded-lg border border-slate-800 text-xs">
                  <div className="font-semibold text-white truncate">
                    Basavaraj Patil &amp; 16 Villagers
                  </div>
                  <span className="text-[10px] text-slate-400">Community Screen</span>
                </div>
              </div>

              {/* Tile 4: You (Current Participant) */}
              <div className="relative bg-slate-900 rounded-xl border border-indigo-500/50 overflow-hidden shadow-lg flex flex-col items-center justify-center min-h-[160px] sm:min-h-[190px]">
                {cameraOn ? (
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/30 via-slate-900 to-slate-950 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-lg border-2 border-indigo-400">
                      {currentUser.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="mt-2 text-[11px] text-indigo-300 font-medium">
                      Camera Active (Simulated HD Feed)
                    </span>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-slate-500">
                    <VideoOff className="w-10 h-10 mb-1 opacity-40" />
                    <span className="text-xs">Camera is Off</span>
                  </div>
                )}

                {/* Hand raised indicator */}
                {handRaised && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-amber-500 text-slate-950 font-bold rounded-md text-xs animate-bounce">
                    <Hand className="w-3.5 h-3.5" />
                    <span>Hand Raised</span>
                  </div>
                )}

                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 bg-indigo-900/80 text-indigo-200 font-semibold rounded-md text-[11px] border border-indigo-700">
                  <span>You ({currentUser.role})</span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 bg-slate-950/85 backdrop-blur-xs rounded-lg border border-slate-800 text-xs">
                  <div className="font-semibold text-white truncate">
                    {currentUser.name}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {micOn ? (
                      <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <MicOff className="w-3.5 h-3.5 text-red-400" />
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Call Control Bar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between shrink-0">
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMicOn(!micOn)}
                  className={`p-2.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-colors ${
                    micOn
                      ? 'bg-slate-800 hover:bg-slate-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  title={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  <span className="hidden sm:inline">{micOn ? 'Mute' : 'Unmuted'}</span>
                </button>

                <button
                  onClick={() => setCameraOn(!cameraOn)}
                  className={`p-2.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-colors ${
                    cameraOn
                      ? 'bg-slate-800 hover:bg-slate-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  title={cameraOn ? 'Turn off video' : 'Turn on video'}
                >
                  {cameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  <span className="hidden sm:inline">{cameraOn ? 'Video' : 'Video Off'}</span>
                </button>

                <button
                  onClick={() => setHandRaised(!handRaised)}
                  className={`p-2.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-colors ${
                    handRaised
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title={handRaised ? 'Lower Hand' : 'Raise Hand to Speak'}
                >
                  <Hand className="w-4 h-4" />
                  <span className="hidden md:inline">{handRaised ? 'Hand Raised' : 'Raise Hand'}</span>
                </button>
              </div>

              {/* Center Meeting Info */}
              <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
                <span className="font-medium text-slate-200">{conference.title}</span>
                <span>•</span>
                <span className="text-amber-400 font-semibold">{conference.village}</span>
              </div>

              {/* Right: Drawer Toggles & Leave Call */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSidebarTab(activeSidebarTab === 'chat' ? 'decisions' : 'chat')}
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors ${
                    activeSidebarTab === 'chat'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Chat</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-900/60 rounded-full font-mono">
                    {chatMessages.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveSidebarTab(activeSidebarTab === 'decisions' ? 'chat' : 'decisions')}
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors ${
                    activeSidebarTab === 'decisions'
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Resolutions</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-900/60 rounded-full font-mono">
                    {decisionsList.length}
                  </span>
                </button>

                <button
                  onClick={onClose}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors ml-1 cursor-pointer"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>Leave</span>
                </button>
              </div>

            </div>

          </div>

          {/* Right Sidebar: Chat & Live Decisions (Fixed by Village Head) */}
          <div className="w-full lg:w-80 bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col shrink-0 h-64 lg:h-auto">
            
            {/* Sidebar Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-900/60 p-1">
              <button
                onClick={() => setActiveSidebarTab('chat')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg text-center transition-colors ${
                  activeSidebarTab === 'chat'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Grievance Chat
              </button>
              <button
                onClick={() => setActiveSidebarTab('decisions')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg text-center transition-colors ${
                  activeSidebarTab === 'decisions'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Head's Decisions ({decisionsList.length})
              </button>
            </div>

            {/* TAB 1: Chat Stream */}
            {activeSidebarTab === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  <div className="text-[11px] text-center text-slate-500 py-1 border-b border-slate-800/60">
                    Live record for {conference.village} Village Conference
                  </div>
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col text-xs rounded-xl p-2.5 border ${
                        msg.isVillageHead
                          ? 'bg-amber-950/30 border-amber-500/30 text-amber-100'
                          : msg.senderName === currentUser.name
                          ? 'bg-indigo-950/40 border-indigo-700/40 text-indigo-100 self-end max-w-[90%]'
                          : 'bg-slate-900 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-bold text-slate-300 flex items-center gap-1">
                          {msg.isVillageHead && <Shield className="w-2.5 h-2.5 text-amber-400" />}
                          {msg.senderName}
                        </span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className="leading-relaxed">{msg.message}</p>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>

                {/* Input Bar */}
                <form onSubmit={handleSendMessage} className="p-2 border-t border-slate-800 bg-slate-900 flex gap-2">
                  <input
                    type="text"
                    value={newTextMessage}
                    onChange={(e) => setNewTextMessage(e.target.value)}
                    placeholder="Type grievance or question..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs transition-colors shrink-0"
                    title="Send"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: Live Resolutions & Decisions */}
            {activeSidebarTab === 'decisions' && (
              <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-3">
                <div className="bg-amber-950/30 border border-amber-600/30 rounded-lg p-2.5 text-xs text-amber-200">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-400">
                    <Shield className="w-3.5 h-3.5" />
                    Village Head Authority
                  </div>
                  <p className="text-[11px] text-amber-300/90 leading-snug">
                    Decisions logged here are official public resolutions recorded on behalf of {conference.village} Village Sabha.
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                  {decisionsList.map((dec, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 flex items-start gap-2"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{dec}</span>
                    </div>
                  ))}
                </div>

                {/* Form to add live resolution */}
                <form onSubmit={handleAddDecision} className="space-y-2 pt-2 border-t border-slate-800">
                  <input
                    type="text"
                    value={newDecisionInput}
                    onChange={(e) => setNewDecisionInput(e.target.value)}
                    placeholder="Add official resolution / decision..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Record Resolution as Village Head
                  </button>
                </form>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
