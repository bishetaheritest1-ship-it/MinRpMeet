import React from 'react';
import { AppEvent } from '../types';
import { X, Clock, User } from 'lucide-react';

interface EventLogPanelProps {
  events: AppEvent[];
  onClose: () => void;
}

export const EventLogPanel: React.FC<EventLogPanelProps> = ({ events, onClose }) => {
  return (
    <div className="h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col w-80 shadow-2xl z-50 animate-in slide-in-from-right">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
            <h3 className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-2">
                <Clock className="text-blue-500" size={16} />
                لاگ رویدادهای کلاس
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition">
                <X size={18} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
            {events.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs">هیچ رویدادی ثبت نشده است.</div>
            ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {[...events].reverse().map(event => (
                        <div key={event.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition flex gap-3 items-start">
                             <div className="mt-0.5 shrink-0">
                                {event.userAvatar ? (
                                    <img src={event.userAvatar} className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600" alt={event.userName} />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                                        <User size={14} />
                                    </div>
                                )}
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate max-w-[100px]">{event.userName || 'سیستم'}</span>
                                    <span className="text-[10px] text-gray-400 font-mono">{new Date(event.timestamp).toLocaleTimeString('fa-IR')}</span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {event.message}
                                </p>
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        
        <div className="p-2 text-[10px] text-center text-gray-400 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
            نمایش {events.length} رویداد
        </div>
    </div>
  );
};