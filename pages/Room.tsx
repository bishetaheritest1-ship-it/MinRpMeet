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
  Hand, PhoneOff, Settings, PenTool, Smile, X, AlertCircle, 
  Layout, Moon, Sun, ChevronDown, ChevronUp, Grid,
  MoreVertical, Share2, Users, Maximize, Minimize, Menu, Edit3, Megaphone, Clock, LogOut,
  Home, Save, Archive
} from 'lucide-react';

const REACTION_EMOJIS = ['💖', '👍', '🎉', '😂', '😮', '😢', '🤔', '👋'];

const DEFAULT_STAGES: LessonStage[] = [
  { 
    id: '1', 
    title: 'حضور و غیاب و معرفی', 
    type: 'IDLE', 
    durationMin: 5, 
    isActive: false, 
    isCompleted: false,
    description: 'خوش‌آمدگویی به دانش‌آموزان و بررسی اتصال.'
  },
  { 
    id: '2', 
    title: 'ویدیو آموزشی: هوک‌های ری‌اکت', 
    type: 'WATCHING_VIDEO', 
    durationMin: 15, 
    isActive: false, 
    isCompleted: false,
    resources: [
        { id: 'f1', name: 'Intro_to_Hooks.mp4', type: 'VIDEO', url: '#' },
        { id: 'f2', name: 'اسلاید_شماره_یک.pdf', type: 'PDF', url: '#' }
    ]
  },
  { 
    id: '3', 
    title: 'تمرین گروهی کدنویسی', 
    type: 'SOLVING_EXERCISE', 
    durationMin: 20, 
    isActive: false, 
    isCompleted: false,
    description: 'پیاده‌سازی شمارنده با useState توسط دانش‌آموزان.',
    resources: [
        { id: 'f3', name: 'کدهای_اولیه.zip', type: 'LINK', url: '#' }
    ]
  },
  { 
    id: '4', 
    title: 'آزمون: چرخه حیات', 
    type: 'TAKING_QUIZ', 
    durationMin: 10, 
    isActive: false, 
    isCompleted: false,
    resources: [
        { id: 'f4', name: 'لینک_آزمون', type: 'LINK', url: '#' }
    ]
  },
  { 
    id: '5', 
    title: 'تکلیف منزل', 
    type: 'SUBMITTING_ASSIGNMENT', 
    durationMin: 10, 
    isActive: false, 
    isCompleted: false 
  },
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
  const [announcement, setAnnouncement] = useState<string>('');
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [showEventLog, setShowEventLog] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Layout State
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null);
  const [activeSidePanel, setActiveSidePanel] = useState<'studio' | 'files' | null>('studio');
  const [studentGridZoom, setStudentGridZoom] = useState(2); 
  const [isStudentGridMinimized, setIsStudentGridMinimized] = useState(false); 
  
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
    
    // Auto pin whiteboard for everyone initially, but only Admin controls it
    setPinnedParticipantId('whiteboard');
    
    // If student, hide side panel by default
    if (session.role === UserRole.STUDENT) {
        setActiveSidePanel(null);
    } else {
        // Default announcement for teacher
        setAnnouncement('به کلاس ریاضی پیشرفته خوش آمدید. لطفا دوربین‌های خود را روشن کنید.');
    }

    // Load persisted state for this room
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

  // Simulate Random Classroom Events (Ticker Feed)
  useEffect(() => {
      if (!participants.length) return;
      
      const eventTypes = [
          { msg: 'در حال تایپ...', type: 'CHAT' },
          { msg: 'دست خود را بالا برد', type: 'HAND' },
          { msg: 'شروع به صحبت کرد', type: 'SPEAKING' },
          { msg: 'پاسخ صحیح داد', type: 'SUCCESS' },
      ];

      const interval = setInterval(() => {
          if (Math.random() > 0.7) {
              const randomUser = participants[Math.floor(Math.random() * participants.length)];
              const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
              addEvent(`${randomUser.name} ${randomEvent.msg}`, randomEvent.type as any, randomUser.id);
          }
      }, 5000);

      return () => clearInterval(interval);
  }, [participants]);

  // Mock Voice Activity Simulation
  useEffect(() => {
    const interval = setInterval(() => {
        setParticipants(prev => prev.map(p => {
            if (p.isMuted) return { ...p, isSpeaking: false };
            return { ...p, isSpeaking: Math.random() > 0.6 };
        }));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Media
  useEffect(() => {
    if (!currentUser) return;
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        addEvent('شما به کلاس پیوستید', 'SUCCESS');
      } catch (err) { setError("عدم دسترسی به دوربین/میکروفون."); }
    };
    initMedia();

    // Mock Students
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
      avatar: Math.random() > 0.6 ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}` : undefined,
      currentActivity: 'IDLE'
    }));
    setParticipants(mockStudents);
  }, [currentUser?.id]);

  // Fix: Attach Screen Stream to Video Element
  useEffect(() => {
    if (pinnedParticipantId === 'screen' && screenRef.current && screenStreamRef.current) {
      screenRef.current.srcObject = screenStreamRef.current;
    }
  }, [pinnedParticipantId]);

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
      addEvent('اشتراک‌گذاری صفحه متوقف شد', 'WARNING');
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setIsScreenSharing(true);
        setPinnedParticipantId('screen'); 
        setPresentationContent(null); 
        addEvent('اشتراک‌گذاری صفحه آغاز شد', 'INFO');
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

  const handleLeaveRequest = () => {
      setShowExitModal(true);
  };

  const confirmExit = (shouldEndSession: boolean) => {
      // Stop media tracks
      localStream?.getTracks().forEach(track => track.stop());
      screenStreamRef.current?.getTracks().forEach(track => track.stop());
      
      setShowExitModal(false);

      // Redirect based on role and choice
      if (currentUser.role === UserRole.TEACHER) {
          navigate('/teacher-hub');
      } else {
          navigate('/');
      }
  };

  const handlePresentFile = (file: LessonResource) => {
      setPresentationContent(file);
      setPinnedParticipantId(null); 
      setIsScreenSharing(false); 
      addEvent(`فایل ${file.name} ارائه شد`, 'INFO');
  };

  const handleDrop = (e: React.DragEvent) => {
      if (currentUser.role !== UserRole.TEACHER) return;
      e.preventDefault();
      const data = e.dataTransfer.getData("application/json");
      if (data) {
          try {
              const file = JSON.parse(data);
              handlePresentFile(file);
          } catch (e) {}
      }
  };

  const handleAddBoardComment = (comment: BoardComment) => {
      setBoardComments(prev => [...prev, comment]);
      addEvent(`${comment.authorName} سوالی روی تخته نوشت`, 'WARNING');
  };

  const handleResolveComment = (id: string) => {
      setBoardComments(prev => prev.map(c => c.id === id ? { ...c, isResolved: true } : c));
  };

  // --- Admin Actions ---
  const handleMuteParticipant = (id: string) => {
    if (currentUser.role !== UserRole.TEACHER) return;
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, isMuted: !p.isMuted } : p));
  };

  const handleToggleVideoParticipant = (id: string) => {
    if (currentUser.role !== UserRole.TEACHER) return;
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, isVideoOff: !p.isVideoOff } : p));
  };

  const handleKickParticipant = (id: string) => {
    if (currentUser.role !== UserRole.TEACHER) return;
    if (window.confirm("آیا از اخراج این کاربر اطمینان دارید؟")) {
      const user = participants.find(p => p.id === id);
      setParticipants(prev => prev.filter(p => p.id !== id));
      if (pinnedParticipantId === id) {
        setPinnedParticipantId(null);
      }
      addEvent(`${user?.name} از کلاس اخراج شد`, 'WARNING');
    }
  };

  const handleGiveStar = (id: string) => {
      if (currentUser.role !== UserRole.TEACHER) return;
      setParticipants(prev => prev.map(p => p.id === id ? { ...p, stars: p.stars + 1 } : p));
      triggerReaction('⭐', id);
      const user = participants.find(p => p.id === id);
      addEvent(`به ${user?.name} ستاره داده شد`, 'SUCCESS');
  };

  const renderMainStage = () => {
    if (presentationContent) {
        return (
            <div className="w-full h-full bg-black flex flex-col items-center justify-center relative group">
                {presentationContent.type === 'VIDEO' ? (
                    <video 
                        src={presentationContent.url} 
                        controls 
                        autoPlay 
                        className={`max-w-full max-h-full ${isPresentationMaximized ? 'object-contain w-full h-full' : 'w-full md:w-4/5 h-auto md:h-4/5 shadow-2xl rounded-lg'}`}
                    />
                ) : (
                    <div className={`relative ${isPresentationMaximized ? 'w-full h-full' : 'w-full md:w-4/5 h-full md:h-4/5 p-2'}`}>
                        <img 
                            src={presentationContent.url} 
                            alt={presentationContent.name} 
                            className="w-full h-full object-contain"
                        />
                    </div>
                )}
                
                {currentUser.role === UserRole.TEACHER && (
                <div className="absolute top-4 right-4 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => setIsPresentationMaximized(!isPresentationMaximized)} className="p-2 bg-black/60 text-white rounded hover:bg-black/80 backdrop-blur">
                        {isPresentationMaximized ? <Minimize size={20} /> : <Maximize size={20} />}
                    </button>
                    <button onClick={() => setPresentationContent(null)} className="p-2 bg-red-600/80 text-white rounded hover:bg-red-700/80 backdrop-blur">
                        <X size={20} />
                    </button>
                </div>
                )}
                
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-1 rounded-full text-xs md:text-sm backdrop-blur whitespace-nowrap">
                    در حال ارائه: {presentationContent.name}
                </div>
            </div>
        );
    }

    if (pinnedParticipantId === 'whiteboard') {
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
            </div>
        );
    }
    
    if (pinnedParticipantId === 'screen') {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center relative group">
                 <video ref={screenRef} autoPlay playsInline className="w-full h-full object-contain" />
                 <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded">اشتراک صفحه</div>
                 {/* Back to Grid Button */}
                 <button
                    onClick={() => setPinnedParticipantId(null)}
                    className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition backdrop-blur-sm opacity-0 group-hover:opacity-100"
                 >
                    <Grid size={16} />
                    <span className="text-xs font-bold">بازگشت به شبکه</span>
                 </button>
            </div>
        );
    }

    const pinnedUser = participants.find(p => p.id === pinnedParticipantId) || (pinnedParticipantId === currentUser.id ? { ...currentUser, stream: localStream, isVideoOff: !isVideoOn } : null);

    if (pinnedUser) {
        return (
            <div className="w-full h-full bg-black relative flex items-center justify-center group">
                {pinnedUser.stream && !pinnedUser.isVideoOff ? (
                    <video ref={pinnedVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-blue-600 flex items-center justify-center text-4xl font-bold text-white shadow-2xl relative">
                            {pinnedUser.name.slice(0, 2)}
                            {!pinnedUser.isMuted && pinnedUser.isSpeaking && (
                                <div className="absolute inset-0 rounded-full border-4 border-white/50 animate-ping"></div>
                            )}
                        </div>
                        <div className="text-white text-xl font-bold">{pinnedUser.name}</div>
                    </div>
                )}
                
                {/* Back to Grid Button */}
                <button
                    onClick={() => setPinnedParticipantId(null)}
                    className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition backdrop-blur-sm opacity-0 group-hover:opacity-100 z-50"
                >
                    <Grid size={16} />
                    <span className="text-xs font-bold">بازگشت به شبکه</span>
                </button>
            </div>
        );
    }

    return (
        <div className="w-full h-full p-2 md:p-4 overflow-hidden bg-gray-200 dark:bg-gray-900">
            <VideoGrid
                localParticipant={localParticipant}
                remoteParticipants={participants}
                onTileClick={(id) => { setPinnedParticipantId(id); }}
                zoomLevel={3} 
                isAdmin={currentUser.role === UserRole.TEACHER}
                onMuteParticipant={handleMuteParticipant}
                onToggleVideoParticipant={handleToggleVideoParticipant}
                onKickParticipant={handleKickParticipant}
                onGiveStarParticipant={handleGiveStar}
            />
        </div>
    );
  };

  if (!currentUser) return <div className="h-screen bg-gray-900 text-white flex items-center justify-center font-sans">در حال بارگذاری استودیو...</div>;

  const localParticipant: Participant = {
    id: currentUser.id, name: currentUser.name, role: currentUser.role,
    isMuted: !isMicOn, isVideoOff: !isVideoOn, isHandRaised, isScreenSharing,
    isSpeaking: false,
    stars: 0,
    stream: localStream || undefined,
    currentActivity: currentStageId ? lessonStages.find(s => s.id === currentStageId)?.type : 'IDLE'
  };

  const isAdmin = currentUser.role === UserRole.TEACHER;

  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-screen w-screen overflow-hidden fixed inset-0`}>
      {/* Mobile: Column Layout, Desktop: Row Layout */}
      <div className="flex flex-col md:flex-row h-full bg-gray-50 dark:bg-gray-950 dark:text-gray-100 text-gray-800 transition-colors duration-300 font-sans">
        
        {/* 1. NAVIGATION BAR (Bottom on Mobile, Left on Desktop) */}
        <div className="order-last md:order-first w-full h-14 md:w-16 md:h-full bg-white dark:bg-gray-900 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 flex flex-row md:flex-col items-center justify-around md:justify-start md:py-4 gap-2 md:gap-4 z-30 shadow-lg shrink-0">
           {/* Logo - Hidden on mobile nav, shown on desktop */}
           <div className="hidden md:flex w-10 h-10 bg-blue-600 rounded-xl items-center justify-center text-white mb-4 shadow-lg shadow-blue-500/30">
             <Layout size={20} />
           </div>
           
           {/* Navigation Items */}
           <div className="flex flex-row md:flex-col gap-1 md:gap-3 w-full px-2 justify-around md:justify-center">
             <ToolButton icon={<Grid size={20}/>} label="شبکه" active={!pinnedParticipantId} onClick={() => { setPinnedParticipantId(null); setPresentationContent(null); }} />
             <ToolButton icon={<PenTool size={20}/>} label="تخته" active={pinnedParticipantId === 'whiteboard' && !presentationContent} onClick={() => { setPinnedParticipantId('whiteboard'); setPresentationContent(null); }} />
             
             {isAdmin && (
                <>
                  <ToolButton icon={<Monitor size={20}/>} label="صفحه" active={isScreenSharing} onClick={toggleScreenShare} />
                  <ToolButton icon={<Share2 size={20}/>} label="فایل" active={activeSidePanel === 'files'} onClick={() => setActiveSidePanel(activeSidePanel === 'files' ? null : 'files')} />
                </>
             )}
             
             {/* Mobile Only Extras */}
             <div className="md:hidden">
                 <ToolButton icon={<MessageSquare size={20}/>} label="چت" active={isChatOpen} onClick={() => setIsChatOpen(!isChatOpen)} />
             </div>
           </div>

           {/* Bottom Actions (Desktop Only mainly) */}
           <div className="hidden md:flex mt-auto flex-col gap-3 w-full px-2">
              <ToolButton icon={isDarkMode ? <Sun size={20}/> : <Moon size={20}/>} label="تم" onClick={() => setIsDarkMode(!isDarkMode)} />
              {isAdmin && <ToolButton icon={<Settings size={20}/>} label="تنظیمات" onClick={() => alert('تنظیمات')} />}
              <div className="h-px bg-gray-300 dark:bg-gray-700 w-full my-1"></div>
              
              {/* EXIT BUTTON */}
              <button 
                  onClick={handleLeaveRequest} 
                  className="p-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition shadow-lg hover:shadow-red-500/30 group relative"
              >
                  <LogOut size={20} />
                  <span className="absolute right-full mr-2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-50 pointer-events-none">خروج از کلاس</span>
              </button>
           </div>
        </div>

        {/* 2. MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col relative overflow-hidden min-h-0">
            
            {/* Header / Top Bar */}
            <div className="h-14 shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-3 md:px-6 z-20">
               <div className="flex items-center gap-3 w-1/4">
                   {/* Mobile Leave Button */}
                   <button onClick={handleLeaveRequest} className="md:hidden p-2 text-white bg-red-600 rounded-lg shadow-sm">
                      <LogOut size={18} />
                   </button>
                   <div className="flex flex-col">
                      <h1 className="font-bold text-sm md:text-lg text-gray-800 dark:text-white truncate max-w-[150px] md:max-w-xs">ریاضی پیشرفته</h1>
                      <div className="hidden md:flex text-xs text-gray-500 items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          <span>آنلاین | {participants.length + 1} نفر</span>
                      </div>
                   </div>
               </div>

               {/* Center Ticker Area */}
               <div className="flex-1 h-full flex items-center justify-center">
                   <EventTicker events={events} />
               </div>

               <div className="flex items-center gap-2 md:gap-3 justify-end w-1/4">
                   {/* Main Controls */}
                   <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-full border border-gray-200 dark:border-gray-700">
                      <ControlButton active={isMicOn} onClick={() => setIsMicOn(!isMicOn)} onIcon={<Mic size={18}/>} offIcon={<MicOff size={18}/>} />
                      <ControlButton active={isVideoOn} onClick={() => setIsVideoOn(!isVideoOn)} onIcon={<Video size={18}/>} offIcon={<VideoOff size={18}/>} />
                      <ControlButton active={!isHandRaised} onClick={() => setIsHandRaised(!isHandRaised)} onIcon={<Hand size={18}/>} offIcon={<Hand size={18} className="text-yellow-500"/>} />
                   </div>
                   
                   {/* Event Log Toggle */}
                   <button 
                       onClick={() => setShowEventLog(!showEventLog)}
                       className={`hidden md:block p-2 rounded-full transition hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 ${showEventLog ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                       title="مشاهده لاگ کلاس"
                   >
                       <Clock size={18} />
                   </button>

                   {/* Desktop Chat/Menu Toggles */}
                   <button 
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className={`hidden md:block relative p-2 rounded-full transition ${isChatOpen ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                  >
                    <MessageSquare size={18} />
                    {messages.length > 0 && !isChatOpen && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>}
                  </button>

                  {isAdmin && (
                    <button 
                        onClick={() => setActiveSidePanel(activeSidePanel === 'studio' ? null : 'studio')}
                        className={`p-2 rounded-full transition ${activeSidePanel === 'studio' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                    >
                        <MoreVertical size={18} />
                    </button>
                  )}
               </div>
            </div>

            {/* Sticky Announcement Bar */}
            {announcement && (
                <div className="bg-gradient-to-r from-blue-900/90 to-blue-800/90 text-white text-xs md:text-sm py-1 px-4 flex justify-between items-center shadow-md relative z-20 backdrop-blur-sm border-b border-blue-700">
                    <div className="flex items-center gap-2 flex-1 overflow-hidden">
                        <Megaphone size={16} className="text-yellow-400 animate-pulse shrink-0" />
                        {isEditingAnnouncement && isAdmin ? (
                            <input 
                                autoFocus
                                className="bg-blue-950/50 border border-blue-500 rounded px-2 py-0.5 w-full outline-none text-white"
                                value={announcement}
                                onChange={(e) => setAnnouncement(e.target.value)}
                                onBlur={() => setIsEditingAnnouncement(false)}
                                onKeyDown={(e) => e.key === 'Enter' && setIsEditingAnnouncement(false)}
                            />
                        ) : (
                            <span className="truncate font-medium">{announcement}</span>
                        )}
                    </div>
                    {isAdmin && !isEditingAnnouncement && (
                        <button onClick={() => setIsEditingAnnouncement(true)} className="ml-2 opacity-50 hover:opacity-100">
                            <Edit3 size={14} />
                        </button>
                    )}
                    {isAdmin && (
                        <button onClick={() => setAnnouncement('')} className="ml-2 opacity-50 hover:opacity-100 hover:text-red-300">
                            <X size={14} />
                        </button>
                    )}
                </div>
            )}

            {/* Stage Area */}
            <div 
                className="flex-1 bg-gray-100 dark:bg-gray-950 relative shadow-inner overflow-hidden flex flex-col min-h-0"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
            >
                {/* Main Visuals */}
                <div className={`flex-1 relative overflow-hidden ${isPresentationMaximized ? 'z-50 bg-black fixed inset-0' : ''}`}>
                   {renderMainStage()}
                   <ReactionOverlay reactions={reactions} />
                </div>
                
                {/* Mobile Emoji Fab (Shifted up slightly due to bottom nav) */}
                {!isPresentationMaximized && (
                    <div className="absolute bottom-4 right-4 md:bottom-6 md:left-6 md:right-auto z-30">
                        <div className="relative">
                            <button 
                                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                                className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-yellow-500 shadow-xl border border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform"
                            >
                                <Smile size={20} className="md:w-6 md:h-6" />
                            </button>
                            {isEmojiPickerOpen && (
                            <div className="absolute bottom-full right-0 md:left-0 md:right-auto mb-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-3 flex gap-2 w-max animate-in fade-in slide-in-from-bottom-2">
                                {REACTION_EMOJIS.map(emoji => (
                                <button key={emoji} onClick={() => { triggerReaction(emoji, currentUser.id); setIsEmojiPickerOpen(false); }} className="text-xl md:text-2xl hover:scale-125 transition">
                                    {emoji}
                                </button>
                                ))}
                            </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Resizable Student Strip (Hidden if Maximized or minimized on mobile to save space) */}
            {!isPresentationMaximized && (
                <div className={`flex-shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col ${isStudentGridMinimized ? 'h-8 md:h-10' : 'h-28 md:h-36'}`}>
                    
                    {/* Grid Controls Bar */}
                    <div className="h-8 md:h-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
                        <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-500">
                            <Users size={12} className="md:w-3.5 md:h-3.5" />
                            <span>({participants.length})</span>
                        </div>

                        {!isStudentGridMinimized && (
                        <div className="hidden md:flex items-center gap-3 w-48">
                            <span className="text-[10px] text-gray-400">کوچک</span>
                            <input 
                                type="range" 
                                min="1" 
                                max="5" 
                                step="0.5"
                                value={studentGridZoom} 
                                onChange={(e) => setStudentGridZoom(parseFloat(e.target.value))}
                                className="flex-1 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-[10px] text-gray-400">بزرگ</span>
                        </div>
                        )}

                        <button 
                            onClick={() => setIsStudentGridMinimized(!isStudentGridMinimized)}
                            className="text-gray-500 hover:text-blue-500 p-1 rounded"
                        >
                            {isStudentGridMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    </div>

                    {/* Grid Content */}
                    {!isStudentGridMinimized && (
                        <div className="flex-1 overflow-hidden">
                            <VideoGrid 
                                localParticipant={localParticipant} 
                                remoteParticipants={participants}
                                onTileClick={(id) => { setPinnedParticipantId(id); setPresentationContent(null); }}
                                zoomLevel={studentGridZoom}
                                isAdmin={currentUser.role === UserRole.TEACHER}
                                onMuteParticipant={handleMuteParticipant}
                                onToggleVideoParticipant={handleToggleVideoParticipant}
                                onKickParticipant={handleKickParticipant}
                                onGiveStarParticipant={handleGiveStar}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* 3. RIGHT PANELS (Overlays on Mobile) */}
        {activeSidePanel === 'studio' && isAdmin && (
            <div className="absolute inset-0 md:relative md:w-80 md:inset-auto z-40 flex flex-col h-full">
                 <StudioSidePanel 
                    stages={lessonStages}
                    currentStageId={currentStageId}
                    role={currentUser.role}
                    onSetStage={handleSetStage}
                    sessionDuration={sessionDuration}
                    onClose={() => setActiveSidePanel(null)}
                 />
            </div>
        )}
        {activeSidePanel === 'files' && isAdmin && (
            <div className="absolute inset-0 md:relative md:w-80 md:inset-auto z-40 flex flex-col h-full">
                <FileManager 
                    onClose={() => setActiveSidePanel(null)}
                    onSelectFile={handlePresentFile}
                />
            </div>
        )}

        {/* Event Log Side Panel */}
        {showEventLog && (
             <div className="absolute inset-0 md:left-auto md:right-0 md:w-80 bg-black/50 md:bg-transparent z-50 flex justify-end">
                <div onClick={() => setShowEventLog(false)} className="absolute inset-0 md:hidden"></div>
                <EventLogPanel events={events} onClose={() => setShowEventLog(false)} />
            </div>
        )}
        
        {/* Chat Drawer (Full screen on mobile) */}
        {isChatOpen && (
            <div className="absolute inset-0 md:left-0 md:right-auto md:w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 shadow-2xl animate-in slide-in-from-left">
                 <ChatWindow 
                    messages={messages} 
                    currentUserId={currentUser.id} 
                    onSendMessage={handleSendMessage} 
                    onClose={() => setIsChatOpen(false)}
                    canChat={chatEnabled || currentUser.role === UserRole.TEACHER}
                 />
            </div>
        )}

        {/* EXIT MODAL */}
        {showExitModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
                            <LogOut size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-2 dark:text-white text-gray-900">
                            {isAdmin ? 'پایان کلاس درس' : 'خروج از کلاس'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                            {isAdmin 
                                ? 'شما مدرس کلاس هستید. می‌خواهید کلاس را برای همه به پایان برسانید یا فقط خودتان خارج شوید؟'
                                : 'آیا از خروج از کلاس اطمینان دارید؟'
                            }
                        </p>

                        <div className="flex flex-col gap-3">
                            {isAdmin ? (
                                <>
                                    <button 
                                        onClick={() => confirmExit(true)}
                                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 transition"
                                    >
                                        <Layout size={18} /> پایان جلسه و مدیریت کلاس‌ها
                                    </button>
                                    <p className="text-[10px] text-gray-400 mt-1 leading-relaxed px-4">
                                        بازگشت به پنل جهت: تنظیم زمان شروع و پایان، مدیریت لینک‌ها و دانش‌آموزان، ویرایش طرح درس و فایل‌ها، و دسترسی به آرشیو جلسات.
                                    </p>
                                    
                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        <button 
                                            onClick={() => confirmExit(false)}
                                            className="py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition"
                                        >
                                            خروج موقت
                                        </button>
                                        <button 
                                            onClick={() => setShowExitModal(false)}
                                            className="py-3 border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl font-medium transition"
                                        >
                                            انصراف
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setShowExitModal(false)}
                                        className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition"
                                    >
                                        انصراف
                                    </button>
                                    <button 
                                        onClick={() => confirmExit(false)}
                                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition"
                                    >
                                        بله، خروج
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Error Toast */}
        {error && (
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-bounce">
            <AlertCircle size={20} /> {error} <X size={16} className="cursor-pointer opacity-80 hover:opacity-100" onClick={() => setError(null)}/>
            </div>
        )}
      </div>
    </div>
  );
};

// --- Sub Components ---

const ToolButton = ({ icon, label, onClick, active }: any) => (
  <button 
    onClick={onClick}
    className={`w-full md:aspect-square py-2 md:py-0 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
        active 
        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`}
    title={label}
  >
    {icon}
    <span className="text-[9px] md:text-[9px] font-medium hidden md:block">{label}</span>
  </button>
);

const ControlButton = ({ active, onClick, onIcon, offIcon }: any) => (
    <button 
        onClick={onClick}
        className={`p-2 rounded-full transition ${
            active 
            ? 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300' 
            : 'bg-red-500 text-white hover:bg-red-600 shadow-md'
        }`}
    >
        {active ? onIcon : offIcon}
    </button>
);