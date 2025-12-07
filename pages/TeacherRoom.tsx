
import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { UserRole, Participant, ChatMessage, Reaction, LessonStage, LessonResource, BoardComment, AppEvent } from '../types';
import { VideoGrid } from '../components/VideoGrid';
import { ChatWindow } from '../components/ChatWindow';
import { Button } from '../components/Button';
import { Whiteboard } from '../components/Whiteboard';
import { ReactionOverlay } from '../components/ReactionOverlay';
import { StudioSidePanel } from '../components/StudioSidePanel';
import { FileManager } from '../components/FileManager';
import { EventTicker } from '../components/EventTicker';
import { EventLogPanel } from '../components/EventLogPanel';
import { 
  Mic, MicOff, Video, VideoOff, Monitor, MessageSquare, 
  Hand, Settings, PenTool, Smile, X, Layout, Moon, Sun, Grid,
  LogOut, Users, Menu, FolderOpen, Clock, Layers
} from 'lucide-react';

const REACTION_EMOJIS = ['💖', '👍', '🎉', '😂', '😮', '😢', '🤔', '👋'];

const DEFAULT_STAGES: LessonStage[] = [
  { id: '1', title: 'حضور و غیاب', type: 'IDLE', durationMin: 5, isActive: false, isCompleted: false },
  { id: '2', title: 'مرور جلسه قبل', type: 'IDLE', durationMin: 10, isActive: false, isCompleted: false },
  { id: '3', title: 'تدریس اصلی', type: 'IDLE', durationMin: 40, isActive: false, isCompleted: false },
  { id: '4', title: 'پرسش و پاسخ', type: 'IDLE', durationMin: 15, isActive: false, isCompleted: false },
];

export const TeacherRoom: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { roomId } = useParams();
  
  // UI State
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeLeftPanel, setActiveLeftPanel] = useState<'studio' | 'files' | null>('studio');
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showEventLog, setShowEventLog] = useState(false);

  // Session State
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Content State
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>('whiteboard');
  const [presentationContent, setPresentationContent] = useState<LessonResource | null>(null);
  const [boardComments, setBoardComments] = useState<BoardComment[]>([]);
  const [whiteboardData, setWhiteboardData] = useState<string | null>(null);
  const [lessonStages, setLessonStages] = useState<LessonStage[]>(DEFAULT_STAGES);
  const [currentStageId, setCurrentStageId] = useState<string | null>(null);

  // Controls
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const screenStreamRef = useRef<MediaStream | null>(null);
  const participantsRef = useRef<Participant[]>([]);

  useEffect(() => { participantsRef.current = participants; }, [participants]);

  // Init
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const session: Participant = {
      id: params.get('id') || 'teacher-' + Math.random().toString(36).substr(2, 9),
      role: UserRole.TEACHER,
      name: params.get('name') || 'مدرس کلاس',
      isMuted: false,
      isVideoOff: false,
      isHandRaised: false,
      isScreenSharing: false,
      isSpeaking: false,
      stars: 0
    };
    setCurrentUser(session);

    // Load persisted whiteboard data
    if (roomId) {
        const savedWbData = localStorage.getItem(`wb_data_${roomId}`);
        const savedComments = localStorage.getItem(`wb_comments_${roomId}`);
        if (savedWbData) setWhiteboardData(savedWbData);
        if (savedComments) {
            try { setBoardComments(JSON.parse(savedComments)); } catch (e) {}
        }
    }

    // Timer
    const timer = setInterval(() => setSessionDuration(p => p + 1), 1000);
    return () => clearInterval(timer);
  }, [roomId, location.search]);

  // Mock Data & Media
  useEffect(() => {
    if (!currentUser) return;
    
    const initMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
        } catch (err) {
            console.warn("Media access failed in TeacherRoom, retrying...", err);
            try {
                // Fallback to audio only
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setLocalStream(audioStream);
            } catch (e) {
                console.warn("No devices found in TeacherRoom. Continuing without media.");
                setLocalStream(null);
            }
        }
    };
    initMedia();

    const mockStudents: Participant[] = Array.from({ length: 12 }).map((_, i) => ({
      id: `student-${i}`,
      name: `دانش‌آموز ${i + 1}`,
      role: UserRole.STUDENT,
      isMuted: Math.random() > 0.3,
      isVideoOff: Math.random() > 0.7,
      isHandRaised: Math.random() > 0.9,
      isScreenSharing: false,
      isSpeaking: false,
      stars: Math.floor(Math.random() * 5),
      avatar: Math.random() > 0.5 ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}` : undefined
    }));
    setParticipants(mockStudents);

    // Simulation
    const eventInterval = setInterval(() => {
        if(Math.random() > 0.7) {
            const p = mockStudents[Math.floor(Math.random() * mockStudents.length)];
            const type = Math.random() > 0.5 ? 'HAND' : 'CHAT';
            addEvent(type === 'HAND' ? `${p.name} دست بلند کرد` : `${p.name} پیام داد`, type, p.id);
        }
    }, 5000);
    return () => clearInterval(eventInterval);
  }, [currentUser]);

  const addEvent = (message: string, type: AppEvent['type'] = 'INFO', userId?: string) => {
      const user = userId ? participantsRef.current.find(p => p.id === userId) : null;
      setEvents(prev => [...prev, {
          id: Math.random().toString(36),
          message, type, timestamp: Date.now(), userId, userAvatar: user?.avatar, userName: user?.name
      }]);
  };

  const handleWhiteboardSave = (data: string) => {
      setWhiteboardData(data);
      if (roomId) localStorage.setItem(`wb_data_${roomId}`, data);
  };

  const handleSetStage = (stageId: string) => {
    const stage = lessonStages.find(s => s.id === stageId);
    setCurrentStageId(stageId);
    setLessonStages(prev => prev.map(s => {
      if (s.id === stageId) return { ...s, isActive: true };
      if (s.isActive) return { ...s, isActive: false, isCompleted: true };
      return s;
    }));
    if (stage) addEvent(`مرحله جدید: ${stage.title}`, 'INFO');
  };

  const handlePresentFile = (file: LessonResource) => {
      setPresentationContent(file);
      setPinnedParticipantId(null);
      setIsScreenSharing(false);
      addEvent(`فایل ${file.name} به نمایش گذاشته شد`, 'INFO');
  };

  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-screen w-screen overflow-hidden flex font-sans bg-gray-100 dark:bg-gray-950 text-gray-800 dark:text-gray-100`}>
      
      {/* 1. MAIN LEFT SIDEBAR (TOOLS) */}
      <div className="w-16 flex flex-col items-center py-4 bg-white dark:bg-gray-900 border-l dark:border-gray-800 z-30 shadow-sm">
         <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg mb-6">
             <Monitor size={22} />
         </div>

         <div className="flex flex-col gap-3 w-full px-2">
             <SidebarBtn icon={<Layers size={20}/>} active={activeLeftPanel === 'studio'} onClick={() => setActiveLeftPanel(activeLeftPanel === 'studio' ? null : 'studio')} tooltip="طرح درس" />
             <SidebarBtn icon={<FolderOpen size={20}/>} active={activeLeftPanel === 'files'} onClick={() => setActiveLeftPanel(activeLeftPanel === 'files' ? null : 'files')} tooltip="فایل‌ها" />
             <div className="h-px bg-gray-200 dark:bg-gray-800 my-1"></div>
             <SidebarBtn icon={<PenTool size={20}/>} active={pinnedParticipantId === 'whiteboard' && !presentationContent} onClick={() => {setPinnedParticipantId('whiteboard'); setPresentationContent(null);}} tooltip="تخته وایت‌برد" />
             <SidebarBtn icon={<Grid size={20}/>} active={!pinnedParticipantId && !presentationContent} onClick={() => {setPinnedParticipantId(null); setPresentationContent(null);}} tooltip="نمای شبکه‌ای" />
         </div>

         <div className="mt-auto flex flex-col gap-3 w-full px-2">
             <SidebarBtn icon={<MessageSquare size={20}/>} active={showRightPanel} onClick={() => setShowRightPanel(!showRightPanel)} tooltip="چت کلاس" />
             <SidebarBtn icon={isDarkMode ? <Sun size={20}/> : <Moon size={20}/>} onClick={() => setIsDarkMode(!isDarkMode)} tooltip="تم شب/روز" />
             <button onClick={() => navigate('/teacher-hub')} className="p-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition mt-2">
                 <LogOut size={20} />
             </button>
         </div>
      </div>

      {/* 2. EXPANDABLE PANELS */}
      {activeLeftPanel === 'studio' && (
          <div className="w-80 h-full border-l dark:border-gray-800 animate-in slide-in-from-right duration-300">
              <StudioSidePanel stages={lessonStages} currentStageId={currentStageId} role={UserRole.TEACHER} onSetStage={handleSetStage} sessionDuration={sessionDuration} onClose={() => setActiveLeftPanel(null)}/>
          </div>
      )}
      {activeLeftPanel === 'files' && (
          <div className="w-80 h-full border-l dark:border-gray-800 animate-in slide-in-from-right duration-300">
              <FileManager onClose={() => setActiveLeftPanel(null)} onSelectFile={handlePresentFile} />
          </div>
      )}

      {/* 3. MAIN STAGE AREA */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-gray-200 dark:bg-black">
          
          {/* Top Bar */}
          <div className="h-14 bg-white dark:bg-gray-900 border-b dark:border-gray-800 flex items-center justify-between px-4 z-20">
              <div className="flex items-center gap-4">
                  <h1 className="font-bold text-lg">کلاس ریاضی پیشرفته</h1>
                  <span className="flex items-center gap-1 text-xs text-green-500 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span> آنلاین
                  </span>
                  <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-2"></div>
                  <EventTicker events={events} />
              </div>
              
              <div className="flex items-center gap-2">
                  <ControlBtn active={isMicOn} onClick={() => setIsMicOn(!isMicOn)} onIcon={<Mic size={18}/>} offIcon={<MicOff size={18}/>} label="میکروفون" />
                  <ControlBtn active={isVideoOn} onClick={() => setIsVideoOn(!isVideoOn)} onIcon={<Video size={18}/>} offIcon={<VideoOff size={18}/>} label="تصویر" />
                  <Button size="sm" variant="secondary" onClick={() => setShowEventLog(true)}>
                      <Clock size={16} className="mr-1"/> وقایع
                  </Button>
              </div>
          </div>

          {/* Stage Content */}
          <div className="flex-1 relative overflow-hidden">
              {presentationContent ? (
                  <div className="w-full h-full bg-black flex items-center justify-center relative p-4">
                      {presentationContent.type === 'VIDEO' ? (
                          <video src={presentationContent.url} controls autoPlay className="max-w-full max-h-full rounded shadow-2xl" />
                      ) : (
                          <img src={presentationContent.url} alt="" className="max-w-full max-h-full object-contain rounded shadow-2xl" />
                      )}
                      <button onClick={() => setPresentationContent(null)} className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700"><X size={20}/></button>
                  </div>
              ) : pinnedParticipantId === 'whiteboard' ? (
                  <div className="w-full h-full bg-white relative">
                      <Whiteboard 
                          onClose={() => setPinnedParticipantId(null)}
                          backgroundImage={null}
                          comments={boardComments}
                          onAddComment={(c) => setBoardComments([...boardComments, c])}
                          onResolveComment={(id) => setBoardComments(boardComments.map(c => c.id === id ? {...c, isResolved: true} : c))}
                          currentUserName={currentUser?.name || 'Teacher'}
                          initialData={whiteboardData}
                          onSave={handleWhiteboardSave}
                      />
                  </div>
              ) : (
                  <div className="w-full h-full p-4 overflow-y-auto">
                     {currentUser && (
                      <VideoGrid 
                          localParticipant={{...currentUser, stream: localStream}}
                          remoteParticipants={participants}
                          onTileClick={setPinnedParticipantId}
                          zoomLevel={3}
                          isAdmin={true}
                          onKickParticipant={(id) => setParticipants(participants.filter(p => p.id !== id))}
                          onGiveStarParticipant={(id) => setParticipants(participants.map(p => p.id === id ? {...p, stars: p.stars + 1} : p))}
                      />
                     )}
                  </div>
              )}
              <ReactionOverlay reactions={reactions} />
          </div>

          {/* Bottom Strip (Participants) */}
          {(pinnedParticipantId === 'whiteboard' || presentationContent) && (
              <div className="h-32 bg-white dark:bg-gray-900 border-t dark:border-gray-800 p-2 flex gap-2 overflow-x-auto">
                  <div className="w-48 shrink-0 h-full">
                      {currentUser && (
                      <VideoGrid 
                          localParticipant={{...currentUser, stream: localStream}}
                          remoteParticipants={[]} // Only local
                          onTileClick={() => {}}
                          zoomLevel={1}
                      />
                      )}
                  </div>
                  <div className="w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                  {participants.map(p => (
                      <div key={p.id} className="w-40 shrink-0 h-full relative group">
                           {/* Simplified Tile for Strip */}
                           <div className="w-full h-full bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden border dark:border-gray-700 relative">
                               {p.isVideoOff ? (
                                   <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500">{(p.name || '').slice(0,1)}</div>
                               ) : (
                                   <div className="w-full h-full bg-black"></div> // Placeholder for stream
                               )}
                               <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate text-center">{p.name || 'کاربر'}</div>
                               {p.isHandRaised && <div className="absolute top-1 right-1 bg-yellow-500 text-black p-1 rounded-full"><Hand size={12}/></div>}
                           </div>
                      </div>
                  ))}
              </div>
          )}
      </div>

      {/* 4. RIGHT SIDEBAR (CHAT) */}
      {showRightPanel && currentUser && (
          <div className="w-80 h-full border-r dark:border-gray-800 animate-in slide-in-from-left z-20">
              <ChatWindow 
                  messages={messages} 
                  currentUserId={currentUser.id} 
                  onSendMessage={(txt) => setMessages([...messages, {id: Date.now().toString(), text: txt, senderId: currentUser.id, senderName: currentUser.name, timestamp: Date.now()}])}
                  onClose={() => setShowRightPanel(false)}
                  canChat={true}
              />
          </div>
      )}

      {/* 5. MODALS */}
      {showEventLog && (
          <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
              <EventLogPanel events={events} onClose={() => setShowEventLog(false)} />
          </div>
      )}
    </div>
  );
};

// UI Components
const SidebarBtn = ({ icon, active, onClick, tooltip }: any) => (
    <button 
        onClick={onClick} 
        title={tooltip}
        className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all ${active ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
    >
        {icon}
    </button>
);

const ControlBtn = ({ active, onClick, onIcon, offIcon, label }: any) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${active ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200' : 'bg-red-50 text-red-600 border border-red-100'}`}
    >
        {active ? onIcon : offIcon}
        <span className="hidden md:inline">{label}</span>
    </button>
);
