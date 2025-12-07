import React from 'react';
import { LessonStage, UserRole } from '../types';
import { CheckCircle, Circle, PlayCircle, Clock } from 'lucide-react';
import { Button } from './Button';

interface LessonProgressBarProps {
  stages: LessonStage[];
  currentStageId: string | null;
  role: UserRole;
  onSetStage: (stageId: string) => void;
}

export const LessonProgressBar: React.FC<LessonProgressBarProps> = ({ 
  stages, 
  currentStageId, 
  role,
  onSetStage 
}) => {
  const isAdmin = role === UserRole.TEACHER;

  return (
    <div className="w-full bg-gray-800 border-b border-gray-700 p-2 overflow-x-auto">
      <div className="flex items-center justify-between min-w-max px-2">
        <div className="flex items-center gap-1 mr-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lesson Plan</span>
        </div>
        
        <div className="flex-1 flex items-center gap-2">
          {stages.map((stage, index) => {
            const isCurrent = stage.id === currentStageId;
            const isPast = stage.isCompleted && !isCurrent;
            
            return (
              <div key={stage.id} className="flex items-center">
                {/* Line connector */}
                {index > 0 && (
                   <div className={`w-8 h-0.5 mx-2 ${isPast || isCurrent ? 'bg-blue-500' : 'bg-gray-600'}`} />
                )}

                <button 
                  onClick={() => isAdmin && onSetStage(stage.id)}
                  disabled={!isAdmin}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all
                    ${isCurrent 
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
                      : isPast 
                        ? 'bg-green-900/20 border-green-700 text-green-400' 
                        : 'bg-gray-700 border-gray-600 text-gray-400'}
                    ${isAdmin ? 'hover:bg-gray-600 cursor-pointer' : 'cursor-default'}
                  `}
                >
                  {isPast ? <CheckCircle size={14} /> : isCurrent ? <PlayCircle size={14} /> : <Circle size={14} />}
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-bold whitespace-nowrap">{stage.title}</span>
                    {isCurrent && (
                        <span className="text-[10px] flex items-center gap-1 opacity-80">
                           <Clock size={10} /> {stage.durationMin}m
                        </span>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};