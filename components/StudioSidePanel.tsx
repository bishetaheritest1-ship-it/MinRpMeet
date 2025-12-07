import React from 'react';
import { LessonStage, UserRole, ActivityType } from '../types';
import { CheckCircle, Circle, Play, Clock, FileText, Video, Link as LinkIcon, Download, X } from 'lucide-react';

interface StudioSidePanelProps {
  stages: LessonStage[];
  currentStageId: string | null;
  role: UserRole;
  onSetStage: (stageId: string) => void;
  sessionDuration: number;
  onClose?: () => void;
}

const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case 'WATCHING_VIDEO': return 'text-purple-400 border-purple-400';
      case 'SOLVING_EXERCISE': return 'text-yellow-400 border-yellow-400';
      case 'TAKING_QUIZ': return 'text-red-400 border-red-400';
      case 'SUBMITTING_ASSIGNMENT': return 'text-green-400 border-green-400';
      default: return 'text-gray-400 border-gray-500';
    }
};

const getResourceIcon = (type: string) => {
    switch (type) {
        case 'PDF': return <FileText size={14} className="text-red-400" />;
        case 'VIDEO': return <Video size={14} className="text-blue-400" />;
        case 'LINK': return <LinkIcon size={14} className="text-blue-300" />;
        default: return <FileText size={14} />;
    }
};

export const StudioSidePanel: React.FC<StudioSidePanelProps> = ({ 
  stages, 
  currentStageId, 
  role,
  onSetStage,
  sessionDuration,
  onClose
}) => {
  const isAdmin = role === UserRole.TEACHER;

  return (
    <div className="h-full bg-gray-900 dark:bg-gray-900 bg-white border-l dark:border-gray-800 border-gray-200 flex flex-col w-80 shadow-xl z-20 transition-colors">
      
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-800 border-gray-200 flex items-center justify-between">
        <div>
            <h2 className="dark:text-white text-gray-900 font-bold text-lg flex items-center gap-2">
                <Clock size={18} className="text-blue-500" />
                استودیو کلاس
            </h2>
            <div className="mt-1 text-xs text-gray-500 flex gap-4">
                <span>گذشته: {new Date(sessionDuration * 1000).toISOString().substr(11, 8)}</span>
                <span>کل: {stages.reduce((acc, s) => acc + s.durationMin, 0)} دقیقه</span>
            </div>
        </div>
        {onClose && (
            <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition">
                <X size={20} />
            </button>
        )}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        {stages.map((stage, index) => {
            const isCurrent = stage.id === currentStageId;
            const isPast = stage.isCompleted && !isCurrent;

            return (
                <div key={stage.id} className={`relative pr-6 border-r-2 ${isCurrent ? 'border-blue-500' : 'border-gray-700'}`}>
                    {/* Bullet Point */}
                    <div className={`absolute -right-[9px] top-0 w-4 h-4 rounded-full border-2 dark:bg-gray-900 bg-white flex items-center justify-center ${isCurrent ? 'border-blue-500' : isPast ? 'border-green-500' : 'border-gray-400'}`}>
                        {isPast && <CheckCircle size={10} className="text-green-500" />}
                        {isCurrent && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
                    </div>

                    <div className={`group ${isCurrent ? 'opacity-100' : 'opacity-70 hover:opacity-100'} transition-opacity`}>
                        <div className="flex justify-between items-start mb-1">
                            <h3 className={`text-sm font-bold ${isCurrent ? 'dark:text-white text-gray-900' : 'dark:text-gray-300 text-gray-600'}`}>
                                {stage.title}
                            </h3>
                            <span className="text-[10px] dark:bg-gray-800 bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 border dark:border-gray-700 border-gray-200">
                                {stage.durationMin} د
                            </span>
                        </div>
                        
                        {stage.description && (
                            <p className="text-xs text-gray-500 mb-2 leading-relaxed">{stage.description}</p>
                        )}

                        {/* Files / Resources */}
                        {stage.resources && stage.resources.length > 0 && (
                            <div className="space-y-1 mb-2">
                                {stage.resources.map(res => (
                                    <div key={res.id} className="flex items-center gap-2 dark:bg-gray-800/50 bg-gray-50 p-1.5 rounded border dark:border-gray-700/50 border-gray-200 hover:dark:bg-gray-800 hover:bg-gray-100 transition cursor-pointer">
                                        {getResourceIcon(res.type)}
                                        <span className="text-xs dark:text-gray-300 text-gray-700 truncate flex-1">{res.name}</span>
                                        <Download size={12} className="text-gray-500" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Admin Action */}
                        {isAdmin && !isCurrent && (
                            <button 
                                onClick={() => onSetStage(stage.id)}
                                className="text-xs flex items-center gap-1 text-blue-500 hover:text-blue-400 mt-2 font-medium"
                            >
                                <Play size={10} /> شروع این مرحله
                            </button>
                        )}
                        
                        {isCurrent && (
                             <div className="mt-2 text-xs text-blue-500 font-mono animate-pulse font-bold">
                                ● در حال اجرا
                             </div>
                        )}
                    </div>
                </div>
            );
        })}
      </div>

      {/* Footer / Status */}
      <div className="p-3 dark:bg-gray-800 bg-gray-100 border-t dark:border-gray-700 border-gray-200 text-xs text-gray-500 text-center">
        {stages.filter(s => s.isCompleted).length} / {stages.length} مرحله تکمیل شده
      </div>
    </div>
  );
};