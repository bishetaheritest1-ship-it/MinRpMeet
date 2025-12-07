import React, { useEffect, useState } from 'react';
import { AppEvent } from '../types';
import { MessageSquare, Hand, Mic, Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface EventTickerProps {
  events: AppEvent[];
}

const getEventIcon = (type: string) => {
    switch (type) {
        case 'CHAT': return <MessageSquare size={12} className="text-blue-400" />;
        case 'HAND': return <Hand size={12} className="text-yellow-400" />;
        case 'SPEAKING': return <Mic size={12} className="text-green-400" />;
        case 'WARNING': return <AlertTriangle size={12} className="text-red-400" />;
        case 'SUCCESS': return <CheckCircle size={12} className="text-green-400" />;
        default: return <Info size={12} className="text-gray-400" />;
    }
};

export const EventTicker: React.FC<EventTickerProps> = ({ events }) => {
  const [visibleEvents, setVisibleEvents] = useState<AppEvent[]>([]);

  useEffect(() => {
      // Keep only the last 3 events for the ticker
      if (events.length > 0) {
          setVisibleEvents(prev => {
              const newEvent = events[events.length - 1];
              // Avoid duplicates if effect runs twice rapidly
              if (prev.length > 0 && prev[prev.length - 1].id === newEvent.id) return prev;
              return [...prev, newEvent].slice(-3);
          });
      }
  }, [events]);

  return (
    <div className="h-full flex flex-col justify-center overflow-hidden w-full max-w-lg mx-4 relative mask-linear-fade">
        {visibleEvents.map((event) => (
            <div 
                key={event.id} 
                className="flex items-center gap-2 text-[10px] md:text-xs text-gray-600 dark:text-gray-300 py-0.5 animate-ticker-item absolute w-full"
                style={{ bottom: 0 }} // Start from bottom
            >
                <span className="shrink-0">{getEventIcon(event.type)}</span>
                <span className="font-bold text-gray-800 dark:text-white shrink-0">{new Date(event.timestamp).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})}</span>
                {event.userAvatar && <img src={event.userAvatar} className="w-4 h-4 rounded-full border border-gray-500" alt="" />}
                <span className="truncate opacity-90 font-medium">{event.message}</span>
            </div>
        ))}
        {visibleEvents.length === 0 && (
            <div className="text-[10px] text-gray-400 text-center opacity-50">بدون رویداد جدید</div>
        )}
    </div>
  );
};