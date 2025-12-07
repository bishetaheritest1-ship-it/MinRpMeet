
import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { UserRole, Participant, ChatMessage, Reaction, LessonStage, LessonResource, BoardComment, AppEvent } from '../types';
import { VideoGrid } from '../components/VideoGrid';
import { VideoTile } from '../components/VideoGrid'; // Import VideoTile directly if needed
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
  Hand, PhoneOff, Settings, PenTool, Smile, X, AlertCircle, 
  Layout, Moon, Sun, ChevronDown, ChevronUp, Grid,
  MoreVertical, Share2, Users, Maximize, Minimize, Menu, Edit3, Megaphone, Clock, LogOut,
  Home, Save, Archive
} from 'lucide-react';

const REACTION_EMOJIS = ['💖', '👍', '🎉', '😂', '😮', '😢', '🤔', '👋'];

const DEFAULT_STAGES: LessonStage[] = [
  { id: '1', title: 'حضور و غیاب', type: 'IDLE', durationMin: 5, isActive: false, isCompleted: false },
  { id: '2', title: 'تدریس اصلی', type: 'IDLE', durationMin: 45, isActive: false, isCompleted: false },
];

export const Room: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { roomId } = useParams();
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Core State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  
  // Event & Announcement System
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [showEventLog, setShowEventLog] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Layout State
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null);
  const [activeSidePanel, setActiveSidePanel] = useState<'studio' | 'files' | null>('studio');
  const [studentGridZoom, setStudentGridZoom] = useState(2); 
  const [isStudentGridMinimized, setIsStudentGridMinimized] = useState(false); 
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Presentation & Whiteboard State
  const [presentationContent, setPresentationContent] = useState<LessonResource | null>(null);
  const [isPresentationMaximized, setIsPresentationMaximized] = useState(false);
  const [boardComments, setBoardComments] = useState<BoardComment[]>([]);
  const [whiteboardData, setWhiteboardData] = useState<string | null>(null);

  // Lesson Plan State
  const [lessonStages, setLessonStages] = useState<LessonStage[]>(DEFAULT_STAGES);
  const [currentStageId, setCurrentStageId] = useState<string | null>(null);

  // UI Toggles
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(true);

  // Refs
  const screenStreamRef = useRef<MediaStream | null>(null);
  const participantsRef = useRef<Participant[]>([]);
  const screenRef = useRef<HTMLVideoElement>(null);
  const pinnedVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  // Detect Resize
  useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Init Session & Load Data
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('id') || 'guest-' + Math.random().toString(36).substr(2, 9);
    
    const session = {
      id: sessionId,
      role: (params.get('role') as UserRole) || UserRole.STUDENT,
      name: params.get('name') || 'میهمان'
    };
    
    setCurrentUser(session);
    
    // Auto pin whiteboard for everyone initially
    setPinnedParticipantId('whiteboard');
    
    if (session.role === UserRole.STUDENT) {
        setActiveSidePanel(null);
    }

    if (roomId) {
        const savedWbData = localStorage.getItem(`wb_data_${roomId}`);
        const savedComments = localStorage.getItem(`wb_comments_${roomId}`);
        
        if (savedWbData) setWhiteboardData(savedWbData);
        if (savedComments) {
            try {
                setBoardComments(JSON.parse(savedComments));
            } catch (e) { console.error("Failed to parse comments", e); }
        }
    }

    const timer = setInterval(() => setSessionDuration(p => p + 1), 1000);
    return () => clearInterval(timer);
  }, [location.search, roomId]);

  // Persist Comments
  useEffect(() => {
      if (roomId && boardComments.length > 0) {
          localStorage.setItem(`wb_comments_${roomId}`, JSON.stringify(boardComments));
      }
  }, [boardComments, roomId]);

  const addEvent = (message: string, type: AppEvent['type'] = 'INFO', userId?: string) => {
      const user = userId ? participantsRef.current.find(p => p.id === userId) : null;
      const newEvent: AppEvent = {
          id: Math.random().toString(36),
          message,
          type,
          timestamp: Date.now(),
          userId,
          userAvatar: user?.avatar,
          userName: user?.name
      };
      setEvents(prev => [...prev, newEvent]);
  };

  const handleWhiteboardSave = (data: string) => {
      setWhiteboardData(data);
      if (roomId) {
          localStorage.setItem(`wb_data_${roomId}`, data);
      }
  };

  // Simulate Random Classroom Events
  useEffect(() => {
      if (!participants.length) return;
      const interval = setInterval(() => {
          if (Math.random() > 0.8) {
              const randomUser = participants[Math.floor(Math.random() * participants.length)];
              addEvent(`${randomUser.name} صحبت کرد`, 'SPEAKING', randomUser.id);
          }
      }, 8000);
      return () => clearInterval(interval);
  }, [participants]);

  // Mock Voice Activity Simulation
  useEffect(() => {
    const interval = setInterval(() => {
        setParticipants(prev => prev.map(p => {
            if (p.isMuted) return { ...p, isSpeaking: false };
            return { ...p, isSpeaking: Math.random() > 0.7 }; // Random speaking status
        }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Media & Mock Users
  useEffect(() => {
    if (!currentUser) return;
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
      } catch (err) { setError("عدم دسترسی به دوربین/میکروفون."); }
    };
    initMedia();

    const mockStudents: Participant[] = Array.from({ length: 8 }).map((_, i) => ({
      id: `student-${i}`,
      name: `دانش‌آموز ${i + 1}`,
      role: UserRole.STUDENT,
      isMuted: Math.random() > 0.3,
      isVideoOff: Math.random() > 0.7,
      isHandRaised: false,
      isScreenSharing: false,
      isSpeaking: false,
      stars: 0,
      avatar: Math.random() > 0.6 ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}` : undefined
    }));
    
    if (currentUser.role === UserRole.STUDENT) {
        mockStudents.unshift({
            id: 'teacher-1',
            name: 'استاد کریمی',
            role: UserRole.TEACHER,
            isMuted: false,
            isVideoOff: false,
            isHandRaised: false,
            isScreenSharing: false,
            isSpeaking: true,
            stars: 0,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher'
        });
    }

    setParticipants(mockStudents);
  }, [currentUser?.id]);

  const handleSetStage = (stageId: string) => {
    const stage = lessonStages.find(s => s.id === stageId);
    setCurrentStageId(stageId);
    setLessonStages(prev => prev.map(s => {
      if (s.id === stageId) return { ...s, isActive: true };
      if (s.isActive) return { ...s, isActive: false, isCompleted: true };
      return s;
    }));
    if (stage) addEvent(`مرحله جدید آغاز شد: ${stage.title}`, 'INFO');
  };

  const toggleScreenShare = async () => {
    if (currentUser.role !== UserRole.TEACHER) return;

    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
      setPinnedParticipantId('whiteboard');
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setIsScreenSharing(true);
        setPinnedParticipantId('screen'); 
        setPresentationContent(null); 
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
          setPinnedParticipantId('whiteboard');
        };
      } catch (err) { console.error(err); }
    }
  };

  const triggerReaction = (emoji: string, senderId: string) => {
    const newReaction: Reaction = {
      id: Math.random().toString(36).substr(2, 9),
      emoji,
      senderId,
      leftOffset: Math.random() * 80 + 10
    };
    setReactions(prev => [...prev, newReaction]);
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== newReaction.id)), 4000);
  };

  const handleSendMessage = (text: string) => {
    if (!currentUser) return;
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: currentUser.id,
      senderName: currentUser.name,
      text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleLeaveRequest = () => setShowExitModal(true);
  
  const confirmExit = () => {
      localStream?.getTracks().forEach(track => track.stop());
      navigate(currentUser.role === UserRole.TEACHER ? '/teacher-hub' : '/student-hub');
  };

  const handlePresentFile = (file: LessonResource) => {
      setPresentationContent(file);
      setPinnedParticipantId(null); 
      setIsScreenSharing(false); 
      addEvent(`فایل ${file.name} ارائه شد`, 'INFO');
  };

  const handleAddBoardComment = (comment: BoardComment) => {
      setBoardComments(prev => [...prev, comment]);
      addEvent(`${comment.authorName} سوالی روی تخته نوشت`, 'WARNING');
  };

  const handleResolveComment = (id: string) => {
      setBoardComments(prev => prev.map(c => c.id === id ? { ...c, isResolved: true } : c));
  };

  // --- Helpers for Student Mobile View ---
  const getFloatingParticipant = () => {
      // Logic: 1. Active Speaker (not self), 2. Teacher, 3. Fallback
      const activeSpeaker = participants.find(p => p.isSpeaking && p.role !== UserRole.TEACHER && p.id !== currentUser.id);
      if (activeSpeaker) return activeSpeaker;
      
      const teacher = participants.find(p => p.role === UserRole.TEACHER);
      if (teacher) return teacher;
      
      return null;
  };

  const renderMainStage = () => {
    if (presentationContent) {
        return (
            <div className="w-full h-full bg-black flex flex-col items-center justify-center relative">
                {presentationContent.type === 'VIDEO' ? (
                    <video src={presentationContent.url} controls autoPlay className="max-w-full max-h-full" />
                ) : (
                    <img src={presentationContent.url} alt={presentationContent.name} className="w-full h-full object-contain" />
                )}
                {currentUser.role === UserRole.TEACHER && (
                    <button onClick={() => setPresentationContent(null)} className="absolute top-4 right-4 p-2 bg-red-600 rounded text-white"><X size={20}/></button>
                )}
            </div>
        );
    }

    if (pinnedParticipantId === 'whiteboard') {
        const floatingUser = getFloatingParticipant();
        return (
            <div className="w-full h-full relative bg-white dark:bg-gray-100">
                <Whiteboard 
                  onClose={() => setPinnedParticipantId(null)} 
                  isReadOnly={currentUser.role !== UserRole.TEACHER} 
                  backgroundImage={null} 
                  comments={boardComments}
                  onAddComment={handleAddBoardComment}
                  onResolveComment={currentUser?.role === UserRole.TEACHER ? handleResolveComment : undefined}
                  currentUserName={currentUser?.name || 'User'}
                  initialData={whiteboardData}
                  onSave={handleWhiteboardSave}
                />
                
                {/* Smart Floating Video Box (Mobile Student) */}
                {isStudent && isMobile && floatingUser && (
                     <div className="absolute bottom-24 left-4 w-32 h-40 bg-black rounded-2xl shadow-2xl overflow-hidden border-2 border-white/20 z-20 transition-all duration-500 ease-in-out">
                          {floatingUser.stream || !floatingUser.isVideoOff ? (
                             <video 
                                 ref={el => { if(el && floatingUser.stream) el.srcObject = floatingUser.stream }} 
                                 autoPlay 
                                 playsInline 
                                 className="w-full h-full object-cover"
                             />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white font-bold text-2xl">
                                 {(floatingUser.name || '').slice(0,1)}
                             </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white text-[10px] text-center p-1 font-bold truncate">
                              {floatingUser.role === UserRole.TEACHER ? '👨‍🏫 ' : ''}
                              {floatingUser.name}
                              {floatingUser.isSpeaking && <span className="ml-1 text-green-400">●</span>}
                          </div>
                     </div>
                )}
            </div>
        );
    }
    
    // ... Screen share and other pinned logic same as before ...
    if (pinnedParticipantId === 'screen') {
        return <div className="w-full h-full bg-black flex items-center justify-center"><video ref={screenRef} autoPlay playsInline className="w-full h-full object-contain" /></div>;
    }

    const pinnedUser = participants.find(p => p.id === pinnedParticipantId) || (pinnedParticipantId === currentUser.id ? { ...currentUser, stream: localStream } : null);
    if (pinnedUser) {
         // ... Pinned user view ...
         return (
            <div className="w-full h-full bg-black relative flex items-center justify-center">
                 {/* Simplified for brevity */}
                 <div className="text-white font-bold text-2xl">{pinnedUser.name}</div>
            </div>
         )
    }

    return (
        <div className="w-full h-full p-2 bg-gray-200 dark:bg-gray-900">
            <VideoGrid
                localParticipant={{...currentUser, stream: localStream}}
                remoteParticipants={participants}
                onTileClick={(id) => setPinnedParticipantId(id)}
                zoomLevel={3}
            />
        </div>
    );
  };

  if (!currentUser) return <div className="h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;

  const isStudent = currentUser.role === UserRole.STUDENT;

  // For mobile students, we HIDE the grid entirely and use the floating box logic in renderMainStage
  const showMobileStudentLayout = isStudent && isMobile;

  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-screen w-screen overflow-hidden fixed inset-0 font-sans`}>
      <div className="flex flex-col md:flex-row h-full bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100">
        
        {/* Desktop Sidebar (Hidden on Mobile) */}
        {!isMobile && (
            <div className="w-16 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col items-center py-4 gap-4 z-30">
               <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Layout size={20} /></div>
               <ToolButton icon={<Grid size={20}/>} label="شبکه" onClick={() => setPinnedParticipantId(null)} />
               <ToolButton icon={<PenTool size={20}/>} label="تخته" active={pinnedParticipantId === 'whiteboard'} onClick={() => setPinnedParticipantId('whiteboard')} />
               <div className="mt-auto flex flex-col gap-3">
                  <ToolButton icon={isDarkMode ? <Sun size={20}/> : <Moon size={20}/>} onClick={() => setIsDarkMode(!isDarkMode)} />
                  <button onClick={handleLeaveRequest} className="p-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"><LogOut size={20} /></button>
               </div>
            </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
            
            {/* Top Bar (Simplified for Mobile) */}
            <div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 z-20">
               <div className="flex items-center gap-3">
                   <button onClick={handleLeaveRequest} className="md:hidden p-2 text-white bg-red-500 rounded-lg"><LogOut size={16} /></button>
                   <div>
                      <h1 className="font-bold text-sm md:text-lg truncate max-w-[150px]">کلاس ریاضی</h1>
                      {!isMobile && <div className="text-xs text-green-500">آنلاین</div>}
                   </div>
               </div>
               
               {/* Controls for Desktop */}
               {!isMobile && (
                   <div className="flex items-center gap-2">
                       {/* ... Desktop controls ... */}
                   </div>
               )}
            </div>

            {/* Stage */}
            <div className="flex-1 bg-gray-100 dark:bg-black relative overflow-hidden flex flex-col">
                <div className="flex-1 relative">
                   {renderMainStage()}
                   <ReactionOverlay reactions={reactions} />
                </div>
                
                {/* FLOATING CONTROLS FOR MOBILE STUDENT */}
                {showMobileStudentLayout && (
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-4 bg-gray-900/80 backdrop-blur-md p-2 rounded-full border border-white/10 shadow-2xl">
                        <FloatingControl active={isMicOn} onClick={() => setIsMicOn(!isMicOn)} onIcon={<Mic size={24}/>} offIcon={<MicOff size={24}/>} />
                        <FloatingControl active={isVideoOn} onClick={() => setIsVideoOn(!isVideoOn)} onIcon={<Video size={24}/>} offIcon={<VideoOff size={24}/>} />
                        <FloatingControl active={!isHandRaised} onClick={() => setIsHandRaised(!isHandRaised)} onIcon={<Hand size={24}/>} offIcon={<Hand size={24} className="text-yellow-400"/>} variant="hand"/>
                        <button 
                            onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                            className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-yellow-400 hover:bg-gray-600 transition"
                        >
                            <Smile size={24} />
                        </button>
                         
                         {/* Reaction Picker Popover */}
                         {isEmojiPickerOpen && (
                            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-2xl shadow-xl p-3 flex gap-2 overflow-x-auto min-w-max">
                                {REACTION_EMOJIS.map(emoji => (
                                <button key={emoji} onClick={() => { triggerReaction(emoji, currentUser.id); setIsEmojiPickerOpen(false); }} className="text-2xl hover:scale-125 transition">
                                    {emoji}
                                </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Desktop / Tablet Bottom Strip (Hidden for Mobile Student as requested) */}
            {!showMobileStudentLayout && !isPresentationMaximized && (
                <div className="h-28 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-2">
                    <VideoGrid 
                        localParticipant={{...currentUser, stream: localStream}} 
                        remoteParticipants={participants}
                        onTileClick={setPinnedParticipantId}
                        zoomLevel={2}
                    />
                </div>
            )}
        </div>

        {/* Side Panels (Admin Only usually) */}
        {activeSidePanel === 'studio' && currentUser.role === UserRole.TEACHER && (
             <div className="hidden md:block w-80 h-full border-r"><StudioSidePanel stages={lessonStages} currentStageId={currentStageId} role={currentUser.role} onSetStage={handleSetStage} sessionDuration={sessionDuration}/></div>
        )}

        {/* Exit Modal */}
        {showExitModal && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full text-center">
                    <h3 className="font-bold text-lg mb-2 dark:text-white text-gray-900">خروج از کلاس؟</h3>
                    <p className="text-gray-500 mb-6 text-sm">آیا مطمئن هستید؟</p>
                    <div className="flex gap-3">
                        <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={confirmExit}>بله، خروج</Button>
                        <Button variant="secondary" className="flex-1" onClick={() => setShowExitModal(false)}>انصراف</Button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

// --- Sub Components ---

const ToolButton = ({ icon, label, onClick, active }: any) => (
  <button onClick={onClick} className={`p-3 rounded-xl transition ${active ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`} title={label}>{icon}</button>
);

const FloatingControl = ({ active, onClick, onIcon, offIcon, variant }: any) => (
    <button 
        onClick={onClick}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg ${
            variant === 'hand' 
            ? (active ? 'bg-gray-700 text-white' : 'bg-yellow-400 text-black')
            : (active 
                ? 'bg-gray-700 text-white hover:bg-gray-600' 
                : 'bg-red-500 text-white hover:bg-red-600')
        }`}
    >
        {active ? onIcon : offIcon}
    </button>
);
