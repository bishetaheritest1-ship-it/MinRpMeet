
import React, { useEffect, useRef } from 'react';
import { Participant, ActivityType } from '../types';
import { MicOff, Mic, Video, VideoOff, Hand, Activity, BookOpen, CheckSquare, MonitorPlay, Maximize2, LogOut, Star } from 'lucide-react';

interface VideoTileProps {
  participant: Participant;
  isLocal?: boolean;
  onClick?: () => void;
  compact?: boolean;
  isAdmin?: boolean;
  onMute?: () => void;
  onToggleVideo?: () => void;
  onKick?: () => void;
  onGiveStar?: () => void;
}

// Helper to get icon for activity
const getActivityIcon = (type?: ActivityType) => {
  switch (type) {
    case 'WATCHING_VIDEO': return <MonitorPlay size={10} />;
    case 'SOLVING_EXERCISE': return <BookOpen size={10} />;
    case 'TAKING_QUIZ': return <CheckSquare size={10} />;
    case 'SUBMITTING_ASSIGNMENT': return <Activity size={10} />;
    default: return null;
  }
};

export const VideoTile: React.FC<VideoTileProps> = ({ 
  participant, 
  isLocal, 
  onClick, 
  compact,
  isAdmin,
  onMute,
  onToggleVideo,
  onKick,
  onGiveStar
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  const displayName = participant.name || 'کاربر';

  return (
    <div 
      onClick={onClick}
      className={`relative w-full h-full bg-gray-800 dark:bg-gray-800 bg-gray-200 rounded-lg overflow-hidden shadow-md border border-gray-700 dark:border-gray-700 border-gray-300 group hover:border-blue-500 transition-all cursor-pointer aspect-video`}
    >
      {/* Speaking Visualizer (Ripple Effect) */}
      {participant.isSpeaking && !participant.isMuted && (
        <>
            <div className="absolute inset-0 border-2 border-blue-500/50 rounded-lg animate-pulse z-20"></div>
            <div className="absolute inset-0 bg-blue-500/10 z-10 animate-ping opacity-20"></div>
        </>
      )}

      {participant.stream && !participant.isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          muted={isLocal} // Mute local video
          playsInline
          className="w-full h-full object-cover transform scale-x-[-1]"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-700 dark:bg-gray-700 bg-gray-300 relative">
          {participant.avatar ? (
             <img 
               src={participant.avatar} 
               alt={displayName} 
               className="w-full h-full object-cover opacity-70"
             />
          ) : (
             <div className={`rounded-full bg-blue-600 flex items-center justify-center font-bold text-white uppercase shadow-lg aspect-square w-[40%]`}>
                <span className="text-[1em]">{displayName.slice(0, 2)}</span>
             </div>
          )}
        </div>
      )}

      {/* Hover Overlay for Maximize */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
        <Maximize2 className="text-white opacity-50" size={16} />
      </div>

      {/* Admin Controls (Horizontal Bottom) */}
      {isAdmin && !isLocal && (
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-40 flex flex-row gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-1 rounded-full backdrop-blur-sm shadow-lg scale-90 hover:scale-100">
            <button 
                onClick={(e) => { e.stopPropagation(); onMute && onMute(); }} 
                className={`p-1 rounded-full text-white shadow-sm transition-colors ${participant.isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                title={participant.isMuted ? "وصل کردن صدا" : "قطع کردن صدا"}
            >
                {participant.isMuted ? <MicOff size={12}/> : <Mic size={12}/>}
            </button>
             <button 
                onClick={(e) => { e.stopPropagation(); onToggleVideo && onToggleVideo(); }} 
                className={`p-1 rounded-full text-white shadow-sm transition-colors ${participant.isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                title={participant.isVideoOff ? "وصل کردن تصویر" : "قطع کردن تصویر"}
            >
                {participant.isVideoOff ? <VideoOff size={12}/> : <Video size={12}/>}
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); onGiveStar && onGiveStar(); }} 
                className="p-1 bg-yellow-500/90 text-white rounded-full shadow-sm hover:bg-yellow-600 transition-colors"
                title="دادن ستاره"
            >
                <Star size={12} fill="currentColor"/>
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); onKick && onKick(); }} 
                className="p-1 bg-red-600/90 text-white rounded-full shadow-sm hover:bg-red-700 transition-colors"
                title="اخراج از کلاس"
            >
                <LogOut size={12}/>
            </button>
        </div>
      )}

      {/* Star Badge */}
      {participant.stars > 0 && (
          <div className="absolute top-1 left-1 z-30 flex items-center gap-1 bg-yellow-500/90 text-white text-[9px] px-1.5 py-0.5 rounded-full shadow-lg border border-yellow-300 animate-in zoom-in">
              <Star size={8} fill="currentColor" />
              <span className="font-bold">{participant.stars}</span>
          </div>
      )}

      {/* Status Indicators (Top Right) */}
      <div className="absolute top-1 right-1 flex flex-col gap-1 z-20 scale-75 origin-top-right">
          {participant.currentActivity && participant.currentActivity !== 'IDLE' && (
             <div className={`p-1 rounded bg-blue-500 text-white shadow-sm`} title={participant.currentActivity}>
                {getActivityIcon(participant.currentActivity)}
             </div>
          )}
          {participant.isHandRaised && <div className="bg-yellow-500 p-1 rounded text-black"><Hand size={10} /></div>}
          {participant.isMuted && <div className="bg-red-500 p-1 rounded text-white"><MicOff size={10} /></div>}
      </div>

      {/* Name Tag (Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-[2px] p-1.5 z-20">
        <p className="text-xs font-bold text-white text-center drop-shadow-md truncate px-1">
            {isLocal ? 'شما' : displayName}
        </p>
      </div>
    </div>
  );
};

interface VideoGridProps {
  localParticipant: Participant;
  remoteParticipants: Participant[];
  onTileClick: (participantId: string) => void;
  zoomLevel: number;
  isAdmin?: boolean;
  onMuteParticipant?: (id: string) => void;
  onToggleVideoParticipant?: (id: string) => void;
  onKickParticipant?: (id: string) => void;
  onGiveStarParticipant?: (id: string) => void;
}

export const VideoGrid: React.FC<VideoGridProps> = ({ 
  localParticipant, 
  remoteParticipants,
  onTileClick,
  zoomLevel,
  isAdmin,
  onMuteParticipant,
  onToggleVideoParticipant,
  onKickParticipant,
  onGiveStarParticipant
}) => {
  const minTileWidth = 60 + (zoomLevel * 25);

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar p-2">
      <div 
        className="grid gap-2 transition-all duration-300"
        style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(${minTileWidth}px, 1fr))`
        }}
      >
        <div className="w-full">
            <VideoTile 
                participant={localParticipant} 
                isLocal 
                compact 
                onClick={() => onTileClick(localParticipant.id)} 
            />
        </div>
        {remoteParticipants.map(participant => (
          <div key={participant.id} className="w-full">
            <VideoTile 
                participant={participant} 
                compact 
                onClick={() => onTileClick(participant.id)} 
                isAdmin={isAdmin}
                onMute={() => onMuteParticipant?.(participant.id)}
                onToggleVideo={() => onToggleVideoParticipant?.(participant.id)}
                onKick={() => onKickParticipant?.(participant.id)}
                onGiveStar={() => onGiveStarParticipant?.(participant.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
