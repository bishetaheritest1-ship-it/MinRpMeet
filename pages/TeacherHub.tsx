
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../services/api';
import { ScheduledClass, UserRole, ClassLicense } from '../types';
import { Button } from '../components/Button';
import { 
  Calendar, Clock, Users, Play, Layout, LogOut, CheckCircle, Video, ArrowRight
} from 'lucide-react';

export const TeacherHub: React.FC = () => {
  const navigate = useNavigate();
  const [activeLicenses, setActiveLicenses] = useState<ClassLicense[]>([]);
  const [teacherName, setTeacherName] = useState('استاد نمونه'); // Mock login
  
  useEffect(() => {
      // Simulate teacher login by fetching all classes for now (in real app, filter by ID)
      const loadClasses = async () => {
          const all = await ApiService.getLicenses();
          // Assuming the first teacher found in DB for demo, or filter if login logic existed
          // For demo: Show all licenses that have a schedule
          setActiveLicenses(all.filter(l => l.isActive && l.schedule && l.schedule.length > 0));
      };
      loadClasses();
  }, []);

  const getDayLabel = (d: number) => ['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنج‌شنبه','جمعه','شنبه'][d];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans">
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                        <Layout size={22} />
                    </div>
                    <h1 className="font-bold text-lg hidden sm:block">پنل اساتید</h1>
                </div>
                
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/')} className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition" title="خروج">
                             <LogOut size={20} />
                    </button>
                </div>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold mb-6">کلاس‌های من</h2>
            
            <div className="grid gap-4">
                {activeLicenses.length === 0 && <div className="text-gray-500">کلاسی برای شما تعریف نشده است.</div>}
                
                {activeLicenses.map((license) => (
                    <div key={license.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all flex flex-col md:flex-row gap-5 relative group">
                        
                        <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-2xl font-bold shrink-0">
                            {(license.title || '').slice(0,1)}
                        </div>

                        <div className="flex-1">
                            <h3 className="font-bold text-lg mb-2">{license.title}</h3>
                            <div className="flex flex-wrap gap-2 mb-3">
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded flex items-center gap-1"><Users size={12}/> {license.studentIds?.length || 0} دانش‌آموز</span>
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded flex items-center gap-1"><Clock size={12}/> {license.renewPeriod === 'DAILY' ? 'روزانه' : 'هفتگی'}</span>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                                <div className="text-xs text-gray-500 mb-2">برنامه هفتگی:</div>
                                <div className="flex flex-wrap gap-2">
                                    {license.schedule?.map((s, idx) => (
                                        <span key={idx} className="text-xs font-medium bg-white dark:bg-gray-600 border dark:border-gray-500 px-2 py-1 rounded shadow-sm">
                                            {getDayLabel(s.dayOfWeek)} ساعت {s.startTime}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-center gap-2 min-w-[150px]">
                            <Button 
                                className="w-full flex items-center justify-center gap-2" 
                                onClick={() => navigate(`/teacher-room/class-${license.id}?name=${encodeURIComponent(teacherName)}`)}
                            >
                                <Play size={16} /> ورود به کلاس (معلم)
                            </Button>
                            <Button variant="secondary" onClick={() => navigate('/planner')} className="w-full text-xs">
                                طرح درس و فایل‌ها
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};
