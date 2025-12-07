import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LessonStage, ToolbarConfig, LessonResource } from '../types';
import { Button } from '../components/Button';
import { ArrowLeft, Plus, Trash2, Save, GripVertical, Settings, FileText, CheckSquare, MonitorPlay, Layout, Upload, Image as ImageIcon, Video, X } from 'lucide-react';

const MOCK_STAGES: LessonStage[] = [
    { id: '1', title: 'مقدمه و خوش‌آمدگویی', type: 'IDLE', durationMin: 5, isActive: false, isCompleted: false },
    { id: '2', title: 'تدریس مبحث اصلی', type: 'WATCHING_VIDEO', durationMin: 20, isActive: false, isCompleted: false },
];

const MOCK_FILES: LessonResource[] = [
    { id: 'f1', name: 'اسلاید_معرفی.pdf', type: 'PDF', url: '#' },
    { id: 'f2', name: 'ویدیو_آموزشی.mp4', type: 'VIDEO', url: '#' }
];

export const TeacherPlanner: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'stages' | 'files' | 'settings'>('stages');
  
  // State for Planning
  const [stages, setStages] = useState<LessonStage[]>(MOCK_STAGES);
  const [files, setFiles] = useState<LessonResource[]>(MOCK_FILES);
  const [toolbarConfig, setToolbarConfig] = useState<ToolbarConfig>({
      whiteboard: true, screenShare: true, files: true, chat: true, grid: true
  });

  // Drag & Drop State
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const handleAddStage = () => {
      const newStage: LessonStage = {
          id: Math.random().toString(),
          title: 'مرحله جدید',
          type: 'IDLE',
          durationMin: 10,
          isActive: false,
          isCompleted: false
      };
      setStages([...stages, newStage]);
  };

  const handleDeleteStage = (id: string) => {
      setStages(stages.filter(s => s.id !== id));
  };

  const handleUpdateStage = (id: string, field: keyof LessonStage, value: any) => {
      setStages(stages.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Drag & Drop Handlers
  const onDragStart = (e: React.DragEvent, index: number) => {
      setDraggedItemIndex(index);
      e.dataTransfer.effectAllowed = "move";
      // Optional: Set a drag image or style
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault(); // Necessary to allow dropping
      e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (draggedItemIndex === null || draggedItemIndex === dropIndex) return;

      const newStages = [...stages];
      const [draggedItem] = newStages.splice(draggedItemIndex, 1);
      newStages.splice(dropIndex, 0, draggedItem);
      
      setStages(newStages);
      setDraggedItemIndex(null);
  };

  // File Upload Handlers
  const handleFileClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          // Fix: Explicitly type `file` as `File` to avoid "unknown" type error in strict mode
          const newFiles: LessonResource[] = Array.from(e.target.files).map((file: File) => ({
              id: Math.random().toString(36).substr(2, 9),
              name: file.name,
              type: file.type.includes('image') ? 'IMAGE' : file.type.includes('video') ? 'VIDEO' : 'PDF',
              url: URL.createObjectURL(file) // Create a local preview URL
          }));
          setFiles([...files, ...newFiles]);
          // Reset input
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const handleDeleteFile = (id: string) => {
      setFiles(files.filter(f => f.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
        {/* Header */}
        <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6 shadow-md z-10">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                    <Settings size={22} />
                </div>
                <div>
                    <h1 className="font-bold text-lg">پنل برنامه‌ریزی مدرس</h1>
                    <p className="text-xs text-gray-400">تنظیمات کلاس: ریاضی پیشرفته</p>
                </div>
            </div>
            <div className="flex gap-3">
                <Button variant="ghost" onClick={() => navigate('/teacher-hub')}>
                    <ArrowLeft size={18} className="ml-2" /> بازگشت به میز کار
                </Button>
                <Button variant="primary" onClick={() => alert('تنظیمات ذخیره شد!')}>
                    <Save size={18} className="ml-2" /> ذخیره تغییرات
                </Button>
            </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="w-64 bg-gray-800/50 border-l border-gray-700 p-4 space-y-2">
                <TabButton active={activeTab === 'stages'} onClick={() => setActiveTab('stages')} icon={<CheckSquare size={18} />} label="مراحل درس (Lesson Plan)" />
                <TabButton active={activeTab === 'files'} onClick={() => setActiveTab('files')} icon={<FileText size={18} />} label="مدیریت فایل‌ها" />
                <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Layout size={18} />} label="چیدمان و ابزارها" />
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-gray-900 p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    
                    {activeTab === 'stages' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-blue-400">طراحی سناریو کلاس</h2>
                                <Button onClick={handleAddStage} size="sm"><Plus size={16} className="ml-1"/> افزودن مرحله</Button>
                            </div>
                            
                            <p className="text-sm text-gray-400 bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                                برای تغییر اولویت، آیتم‌ها را با استفاده از آیکون دستگیره <GripVertical className="inline w-4 h-4"/> بکشید و رها کنید.
                            </p>

                            <div className="grid gap-4">
                                {stages.map((stage, index) => (
                                    <div 
                                        key={stage.id} 
                                        draggable
                                        onDragStart={(e) => onDragStart(e, index)}
                                        onDragOver={(e) => onDragOver(e, index)}
                                        onDrop={(e) => onDrop(e, index)}
                                        className={`bg-gray-800 border ${draggedItemIndex === index ? 'border-blue-500 opacity-50' : 'border-gray-700'} rounded-xl p-4 flex gap-4 items-start group hover:border-blue-500/50 transition cursor-default`}
                                    >
                                        <div className="mt-4 text-gray-500 cursor-grab hover:text-white" title="جابجایی"><GripVertical size={20} /></div>
                                        <div className="w-8 h-8 rounded-full bg-blue-900/50 text-blue-300 flex items-center justify-center font-bold mt-1 shrink-0 border border-blue-500/20">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1">عنوان مرحله</label>
                                                <input 
                                                    type="text" 
                                                    value={stage.title} 
                                                    onChange={(e) => handleUpdateStage(stage.id, 'title', e.target.value)}
                                                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm focus:border-blue-500 outline-none" 
                                                />
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <label className="block text-xs text-gray-400 mb-1">نوع فعالیت</label>
                                                    <select 
                                                        value={stage.type}
                                                        onChange={(e) => handleUpdateStage(stage.id, 'type', e.target.value)}
                                                        className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm focus:border-blue-500 outline-none"
                                                    >
                                                        <option value="IDLE">صحبت / عادی</option>
                                                        <option value="WATCHING_VIDEO">نمایش ویدیو</option>
                                                        <option value="SOLVING_EXERCISE">حل تمرین</option>
                                                        <option value="TAKING_QUIZ">آزمون</option>
                                                    </select>
                                                </div>
                                                <div className="w-24">
                                                    <label className="block text-xs text-gray-400 mb-1">مدت (دقیقه)</label>
                                                    <input 
                                                        type="number" 
                                                        value={stage.durationMin} 
                                                        onChange={(e) => handleUpdateStage(stage.id, 'durationMin', parseInt(e.target.value))}
                                                        className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm focus:border-blue-500 outline-none text-center" 
                                                    />
                                                </div>
                                            </div>
                                            <div className="md:col-span-2">
                                                 <label className="block text-xs text-gray-400 mb-1">توضیحات تکمیلی (برای خودتان)</label>
                                                 <textarea 
                                                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm focus:border-blue-500 outline-none h-20 resize-none"
                                                    placeholder="نکات مهمی که باید در این مرحله بگویم..."
                                                 />
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteStage(stage.id)} className="p-2 text-gray-500 hover:text-red-500 mt-1">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'files' && (
                        <div className="space-y-6 animate-in fade-in">
                            <h2 className="text-2xl font-bold text-blue-400 mb-6">مدیریت منابع کلاس</h2>

                            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 border-dashed flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-4">
                                    <Upload size={40} className="text-blue-500" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-300">آپلود فایل‌های جدید</h3>
                                <p className="text-gray-500 mt-2 max-w-md mx-auto mb-6">فایل‌های PDF، تصاویر یا ویدیوهای خود را برای استفاده در کلاس انتخاب کنید.</p>
                                
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    multiple 
                                    onChange={handleFileChange}
                                />
                                <Button onClick={handleFileClick} variant="primary">
                                    انتخاب فایل‌ها از سیستم
                                </Button>
                            </div>

                            {/* File List */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                {files.map(file => (
                                    <div key={file.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center gap-4 group">
                                        <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center text-gray-400">
                                            {file.type === 'VIDEO' ? <Video size={24}/> : file.type === 'IMAGE' ? <ImageIcon size={24}/> : <FileText size={24}/>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm truncate">{file.name}</div>
                                            <div className="text-xs text-gray-500 uppercase">{file.type}</div>
                                        </div>
                                        <button onClick={() => handleDeleteFile(file.id)} className="text-gray-500 hover:text-red-500 p-2">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-6 animate-in fade-in">
                            <h2 className="text-2xl font-bold text-blue-400 mb-6">شخصی‌سازی محیط کلاس</h2>
                            
                            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                                <h3 className="font-bold mb-4 flex items-center gap-2"><Layout size={18}/> نوار ابزار سمت چپ (دانش‌آموزان)</h3>
                                <div className="space-y-3">
                                    <Toggle label="تخته وایت‌برد" checked={toolbarConfig.whiteboard} onChange={(v) => setToolbarConfig({...toolbarConfig, whiteboard: v})} />
                                    <Toggle label="اشتراک‌گذاری فایل" checked={toolbarConfig.files} onChange={(v) => setToolbarConfig({...toolbarConfig, files: v})} />
                                    <Toggle label="چت متنی" checked={toolbarConfig.chat} onChange={(v) => setToolbarConfig({...toolbarConfig, chat: v})} />
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
    >
        {icon}
        <span className="font-medium text-sm">{label}</span>
    </button>
);

const Toggle = ({ label, checked, onChange }: any) => (
    <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-700">
        <span className="text-sm text-gray-300">{label}</span>
        <button 
            onClick={() => onChange(!checked)}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${checked ? 'bg-blue-600' : 'bg-gray-600'}`}
        >
            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-[-24px]' : 'translate-x-0'}`} />
        </button>
    </div>
);