import React from 'react';
import { X, FileText, Image as ImageIcon, Video, GripVertical, MonitorPlay } from 'lucide-react';
import { LessonResource } from '../types';

interface FileManagerProps {
  onClose: () => void;
  onSelectFile: (file: LessonResource) => void;
}

const MOCK_FILES: LessonResource[] = [
    { id: '1', name: 'نقشه_ذهنی_ریاضی.png', type: 'IMAGE', url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80' },
    { id: '2', name: 'نمودار_تابع.jpg', type: 'IMAGE', url: 'https://images.unsplash.com/photo-1543286386-713df548e9cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80' },
    { id: '3', name: 'تمرین_شماره_یک.pdf', type: 'PDF', url: '#' },
    { id: '4', name: 'ویدیو_آموزشی.mp4', type: 'VIDEO', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }, // Real sample video
    { id: '5', name: 'اسلاید_جلسه_اول.pdf', type: 'PDF', url: '#' },
];

export const FileManager: React.FC<FileManagerProps> = ({ onClose, onSelectFile }) => {
  
  const handleDragStart = (e: React.DragEvent, file: LessonResource) => {
    e.dataTransfer.setData("application/json", JSON.stringify(file));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col w-80 shadow-xl z-20 animate-in slide-in-from-right duration-300">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-900">
            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                <FileText className="text-blue-500" />
                فایل‌های کلاس
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition">
                <X size={20} />
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            <p className="text-xs text-gray-500 mb-4 bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-800">
                فایل را بکشید و در صفحه رها کنید یا برای نمایش کلیک کنید.
            </p>
            <div className="grid gap-3">
                {MOCK_FILES.map(file => (
                    <div 
                        key={file.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, file)}
                        onClick={() => onSelectFile(file)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:shadow-md transition cursor-grab active:cursor-grabbing group"
                    >
                        <div className="text-gray-400">
                            <GripVertical size={16} />
                        </div>
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500 group-hover:text-blue-500 transition">
                            {file.type === 'IMAGE' ? <ImageIcon size={20} /> : 
                             file.type === 'VIDEO' ? <Video size={20} /> :
                             <FileText size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-gray-700 dark:text-gray-200 truncate">{file.name}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{file.type}</div>
                        </div>
                        <button className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-500 opacity-0 group-hover:opacity-100 transition">
                            <MonitorPlay size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};