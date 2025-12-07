import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, UserRole } from '../types';
import { Button } from './Button';
import { Send, X } from 'lucide-react';

interface ChatWindowProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
  onClose: () => void;
  canChat: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, 
  currentUserId, 
  onSendMessage, 
  onClose,
  canChat
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && canChat) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 w-full h-full">
      <div className="p-4 border-b dark:border-gray-700 border-gray-200 flex justify-between items-center dark:bg-gray-900 bg-gray-50">
        <h3 className="font-bold text-lg dark:text-white text-gray-800">گفتگوی متنی</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-red-500">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            <p>پیامی وجود ندارد.</p>
            <p className="text-xs mt-2">پیام‌ها فقط برای افراد حاضر در کلاس نمایش داده می‌شود.</p>
          </div>
        )}
        
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          if (msg.isSystem) {
             return (
               <div key={msg.id} className="text-center text-xs text-gray-400 my-2 italic px-4 py-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto w-max">
                 {msg.text}
               </div>
             )
          }

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xs font-bold dark:text-gray-300 text-gray-700">{isMe ? 'شما' : msg.senderName}</span>
                <span className="text-[10px] text-gray-500">
                  {new Date(msg.timestamp).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <div 
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm break-words shadow-sm ${
                  isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'dark:bg-gray-700 bg-white border border-gray-200 dark:border-gray-600 dark:text-gray-200 text-gray-800 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 dark:bg-gray-900 bg-white border-t dark:border-gray-700 border-gray-200">
        {canChat ? (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="پیام خود را بنویسید..."
              className="flex-1 dark:bg-gray-700 bg-gray-100 dark:text-white text-gray-900 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              style={{ textAlign: 'right', direction: 'rtl' }}
            />
            <Button 
              type="submit" 
              variant="primary" 
              size="icon" 
              disabled={!inputText.trim()}
              className="rounded-full w-10 h-10 flex-shrink-0 rotate-180" // Rotate icon for RTL
            >
              <Send size={18} />
            </Button>
          </form>
        ) : (
          <div className="text-center text-gray-500 text-sm py-2">
            چت توسط مدرس غیرفعال شده است.
          </div>
        )}
      </div>
    </div>
  );
};