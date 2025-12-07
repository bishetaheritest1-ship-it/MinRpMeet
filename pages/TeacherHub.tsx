
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScheduledClass, UserRole } from '../types';
import { Button } from '../components/Button';
import { 
  Calendar, Clock, Users, Plus, Play, MoreVertical, 
  Layout, Trash2, CheckCircle, Settings, FileText, Archive, Link as LinkIcon, Video, X, UserMinus, LogOut
} from 'lucide-react';

const MOCK_CLASSES: ScheduledClass[] = [
    { id: 'c1', title: 'ریاضی پیشرفته - جلسه ۱۰', date: '1403/08/01', time: '10:00', studentCount: 15, status: 'LIVE' },
    { id: 'c2', title: 'فیزیک کوانتوم - مقدماتی', date: '1403/08/02', time: '14:30', studentCount: 20, status: 'UPCOMING' },
    { id: 'c3', title: 'شیمی آلی - آزمایشگاه', date: '1403/08/05', time: '09:00', studentCount: 12, status: 'UPCOMING' },
    { id: 'c4', title: 'ادبیات فارسی - حافظ خوانی', date: '1403/07/28', time: '16:00', studentCount: 25, status: 'COMPLETED' },
    { id: 'c5', title: 'برنامه‌نویسی پایتون - مقدماتی', date: '1403/07/25', time: '18:00', studentCount: 30, status: 'COMPLETED' },
];

const StatCard = ({ icon, label, value, color }: any) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center gap-4 shadow-sm">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div>
      <div className="text-2xl font-bold dark:text-white text-gray-800">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  </div>
);

export const TeacherHub: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ScheduledClass[]>(MOCK_CLASSES);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [mockStudentList, setMockStudentList] = useState<string[]>(['علی رضایی', 'مریم احمدی', 'سارا حسینی', 'محمد کریمی']);
  const [newStudentName, setNewStudentName] = useState('');

  const [newClass, setNewClass] = useState({ title: '', date: '', time: '' });

  const handleCreateClass = (e: React.FormEvent) => {
      e.preventDefault();
      const created: ScheduledClass = {
          id: Math.random().toString(36).substr(2, 9),
          title: newClass.title,
          date: newClass.date,
          time: newClass.time,
          studentCount: 0,
          status: 'UPCOMING'
      };
      setClasses([created, ...classes]);
      setShowCreateModal(false);
      setNewClass({ title: '', date: '', time: '' });
  };

  const handleDelete = (id: string) => {
      if(window.confirm('آیا از حذف این کلاس و تمام اطلاعات آن اطمینان دارید؟')) {
          setClasses(classes.filter(c => c.id !== id));
      }
      setOpenMenuId(null);
  };

  const handleCopyLink = (id: string) => {
      const link = `${window.location.origin}/#/room/${id}?role=STUDENT`;
      navigator.clipboard.writeText(link);
      alert('لینک دعوت کپی شد:\n' + link);
      setOpenMenuId(null);
  };

  const openSettings = (id: string) => {
      setEditingClassId(id);
      setShowSettingsModal(true);
      setOpenMenuId(null);
  };

  const handleAddStudent = () => {
      if (newStudentName.trim()) {
          setMockStudentList([...mockStudentList, newStudentName]);
          setNewStudentName('');
      }
  };

  const handleRemoveStudent = (index: number) => {
      const newList = [...mockStudentList];
      newList.splice(index, 1);
      setMockStudentList(newList);
  };

  const toggleMenu = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setOpenMenuId(openMenuId === id ? null : id);
  };

  // Close menu when clicking outside
  React.useEffect(() => {
      const handleClickOutside = () => setOpenMenuId(null);
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredClasses = classes.filter(c => {
      if (activeTab === 'active') return c.status !== 'COMPLETED';
      return c.status === 'COMPLETED';
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans">
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                        <Layout size={22} />
                    </div>
                    <h1 className="font-bold text-lg hidden sm:block">پنل مدیریت کلاس‌ها</h1>
                </div>
                
                <div className="flex items-center gap-3">
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Plus size={18} className="ml-2" /> تعریف کلاس جدید
                    </Button>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                    <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher" alt="Teacher" />
                         </div>
                         <button onClick={() => navigate('/')} className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition" title="خروج">
                             <LogOut size={20} />
                         </button>
                    </div>
                </div>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard icon={<Play className="text-green-500"/>} label="کلاس‌های جاری" value={classes.filter(c => c.status === 'LIVE').length} color="bg-green-100 dark:bg-green-900/20" />
                <StatCard icon={<Calendar className="text-blue-500"/>} label="آینده" value={classes.filter(c => c.status === 'UPCOMING').length} color="bg-blue-100 dark:bg-blue-900/20" />
                <StatCard icon={<Archive className="text-orange-500"/>} label="آرشیو شده" value={classes.filter(c => c.status === 'COMPLETED').length} color="bg-orange-100 dark:bg-orange-900/20" />
                <StatCard icon={<Users className="text-purple-500"/>} label="کل دانش‌آموزان" value={classes.reduce((acc, c) => acc + c.studentCount, 0)} color="bg-purple-100 dark:bg-purple-900/20" />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                <button 
                    onClick={() => setActiveTab('active')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'active' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                >
                    کلاس‌های فعال و آینده
                    {activeTab === 'active' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('archive')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'archive' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                >
                    آرشیو کلاس‌های برگزار شده
                    {activeTab === 'archive' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>}
                </button>
            </div>

            {/* Classes Grid */}
            <div className="grid gap-4">
                {filteredClasses.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        {activeTab === 'active' ? 'هیچ کلاس فعالی وجود ندارد.' : 'آرشیو خالی است.'}
                    </div>
                )}

                {filteredClasses.map((cls) => (
                    <div key={cls.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all flex flex-col md:flex-row md:items-center gap-5 relative group">
                        
                        {/* Status Strip */}
                        <div className={`absolute right-0 top-0 bottom-0 w-1.5 rounded-r-xl ${
                            cls.status === 'LIVE' ? 'bg-green-500' : 
                            cls.status === 'UPCOMING' ? 'bg-blue-500' : 'bg-gray-400'
                        }`}></div>

                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-xl flex shrink-0 items-center justify-center mr-2 ${
                             cls.status === 'LIVE' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 
                             cls.status === 'UPCOMING' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'
                        }`}>
                            {cls.status === 'COMPLETED' ? <CheckCircle size={24}/> : <Video size={24}/>}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                                <h3 className="font-bold text-lg">{cls.title}</h3>
                                {cls.status === 'LIVE' && (
                                    <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div> در حال برگزاری
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded"><Calendar size={14}/> {cls.date}</span>
                                <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded"><Clock size={14}/> {cls.time}</span>
                                <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded"><Users size={14}/> {cls.studentCount} نفر</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0 justify-end">
                            {cls.status !== 'COMPLETED' ? (
                                <Button 
                                    className="flex-1 md:flex-none min-w-[140px]" 
                                    variant={cls.status === 'LIVE' ? 'danger' : 'primary'}
                                    onClick={() => navigate(`/room/${cls.id}?role=${UserRole.TEACHER}&name=${encodeURIComponent('استاد رضایی')}`)}
                                >
                                    {cls.status === 'LIVE' ? <><Play size={16} className="ml-2" /> ورود به کلاس</> : 'شروع کلاس'}
                                </Button>
                            ) : (
                                <Button variant="secondary" className="flex-1 md:flex-none" disabled>
                                    مشاهده گزارش
                                </Button>
                            )}

                            {/* Menu Trigger */}
                            <div className="relative">
                                <button 
                                    onClick={(e) => toggleMenu(cls.id, e)}
                                    className={`p-2.5 rounded-lg text-gray-500 transition ${openMenuId === cls.id ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    <MoreVertical size={20} />
                                </button>
                                
                                {/* Dropdown Menu */}
                                {openMenuId === cls.id && (
                                    <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-left">
                                        <div className="p-1">
                                            <button 
                                                onClick={() => navigate('/planner')} 
                                                className="w-full text-right px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 rounded-lg flex items-center gap-2 transition"
                                            >
                                                <FileText size={16} className="text-blue-500" /> برنامه‌ریزی درس و فایل‌ها
                                            </button>
                                            <button 
                                                onClick={() => handleCopyLink(cls.id)}
                                                className="w-full text-right px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 rounded-lg flex items-center gap-2 transition"
                                            >
                                                <LinkIcon size={16} className="text-gray-400" /> دریافت لینک دعوت
                                            </button>
                                            <button 
                                                onClick={() => openSettings(cls.id)}
                                                className="w-full text-right px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 rounded-lg flex items-center gap-2 transition"
                                            >
                                                <Settings size={16} className="text-gray-400" /> تنظیمات دانش‌آموزان
                                            </button>
                                            
                                            <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                                            
                                            <button 
                                                onClick={() => handleDelete(cls.id)}
                                                className="w-full text-right px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 transition"
                                            >
                                                <Trash2 size={16} /> حذف کلاس
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
                    <h3 className="text-xl font-bold mb-4">تعریف کلاس جدید</h3>
                    <form onSubmit={handleCreateClass} className="space-y-4">
                        <div>
                            <label className="block text-sm mb-1 text-gray-500">عنوان کلاس</label>
                            <input 
                                required
                                value={newClass.title}
                                onChange={e => setNewClass({...newClass, title: e.target.value})}
                                className="w-full bg-gray-100 dark:bg-gray-700 rounded p-2 border border-transparent focus:border-blue-500 outline-none"
                                placeholder="مثال: ریاضی پایه نهم"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm mb-1 text-gray-500">تاریخ</label>
                                <input 
                                    required
                                    type="text"
                                    value={newClass.date}
                                    onChange={e => setNewClass({...newClass, date: e.target.value})}
                                    className="w-full bg-gray-100 dark:bg-gray-700 rounded p-2 outline-none"
                                    placeholder="1403/xx/xx"
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-gray-500">ساعت</label>
                                <input 
                                    required
                                    type="time"
                                    value={newClass.time}
                                    onChange={e => setNewClass({...newClass, time: e.target.value})}
                                    className="w-full bg-gray-100 dark:bg-gray-700 rounded p-2 outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 pt-4">
                            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreateModal(false)}>انصراف</Button>
                            <Button type="submit" className="flex-1">ایجاد کلاس</Button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Settings / Students Modal */}
        {showSettingsModal && (
             <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
                     <button onClick={() => setShowSettingsModal(false)} className="absolute left-4 top-4 text-gray-400 hover:text-red-500"><X size={20}/></button>
                     <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Settings size={20} className="text-blue-500"/> مدیریت دانش‌آموزان</h3>
                     
                     <div className="mb-4">
                         <div className="flex gap-2">
                             <input 
                                value={newStudentName}
                                onChange={(e) => setNewStudentName(e.target.value)}
                                className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="نام دانش‌آموز جدید..."
                             />
                             <Button onClick={handleAddStudent} size="sm"><Plus size={16}/></Button>
                         </div>
                     </div>

                     <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2 mb-4">
                         {mockStudentList.length === 0 && <p className="text-center text-sm text-gray-500 py-4">دانش‌آموزی ثبت نشده است.</p>}
                         {mockStudentList.map((student, idx) => (
                             <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg group">
                                 <div className="flex items-center gap-2">
                                     <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-xs text-blue-600">
                                         {idx + 1}
                                     </div>
                                     <span className="text-sm">{student}</span>
                                 </div>
                                 <button onClick={() => handleRemoveStudent(idx)} className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition">
                                     <UserMinus size={16} />
                                 </button>
                             </div>
                         ))}
                     </div>

                     <div className="flex gap-2 pt-2 border-t dark:border-gray-700">
                        <Button className="w-full" onClick={() => setShowSettingsModal(false)}>ذخیره تغییرات</Button>
                     </div>
                </div>
             </div>
        )}
    </div>
  );
};
