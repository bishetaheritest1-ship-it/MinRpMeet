import React from 'react';
import { Reaction } from '../types';

interface ReactionOverlayProps {
  reactions: Reaction[];
}

export const ReactionOverlay: React.FC<ReactionOverlayProps> = ({ reactions }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {reactions.map((reaction) => (
        <div
          key={reaction.id}
          className="absolute bottom-20 text-4xl animate-float"
          style={{ 
            left: `${reaction.leftOffset}%`,
            willChange: 'transform, opacity' 
          }}
        >
          {reaction.emoji}
        </div>
      ))}
    </div>
  );
};