
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../services/api';
import { Student, ClassLicense, UserRole } from '../types';
import { LogOut, Calendar, Clock, Video, Star, BookOpen, ChevronLeft, Bell, Trophy } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<ClassLicense[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate login by getting the first student (For demo purposes)
    const loadData = async () => {
        try {
            const studentsList = await ApiService.getStudents();
            if (studentsList.length > 0) {
                const current = studentsList[0];
                setStudent(current);
                const myClasses = await ApiService.getStudentClasses(current.id);
                setClasses(myClasses);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, []);

  const getDayLabel = (dayId: number) => {
      const days = ['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنج‌شنبه','جمعه','شنبه'];
      return days[dayId]; // 0 is Sunday based on our logic
  };

  const todayIndex = new Date().getDay(); 
  
  // Logic to determine active classes based on schedule
  const todaysClasses = classes.filter(c => c.schedule?.some(s => s.dayOfWeek === todayIndex));
  const otherClasses = classes.filter(c => !c.schedule?.some(s => s.dayOfWeek === todayIndex));

  if (loading) return <div className="h-screen flex items-center justify-center bg-yellow-50 font-sans text-gray-500 font-bold text-lg">در حال آماده‌سازی کیف مدرسه... 🎒</div>;

  if (!student) return (
      <div className="h-screen flex flex-col items-center justify-center bg-yellow-50 font-sans gap-4 p-4 text-center">
          <div className="text-6xl mb-4">😢</div>
          <div className="text-gray-800 font-bold text-xl">دانش‌آموزی پیدا نشد!</div>
          <p className="text-sm text-gray-500">لطفا ابتدا از پنل مدیریت مدرسه، یک دانش‌آموز تعریف کنید.</p>
          <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl shadow-lg hover:bg-blue-600 transition">بازگشت به خانه</button>
      </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFBEB] font-sans text-gray-800 pb-24">
      
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500 text-white p-6 pb-24 rounded-b-[50px] shadow-xl relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-[-30px] right-[-30px] w-48 h-48 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="max-w-md mx-auto relative z-10 flex justify-between items-center mt-2">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-full p-1 shadow-lg shadow-orange-600/20">
                    <div className="w-full h-full bg-orange-100 rounded-full flex items-center justify-center text-3xl overflow-hidden">
                        {student.avatar ? <img src={student.avatar} className="w-full h-full object-cover" alt=""/> : '👦'}
                    </div>
                </div>
                <div>
                    <h1 className="text-xl font-black mb-1 drop-shadow-md">سلام، {student.name} 👋</h1>
                    <div className="flex items-center gap-2 text-orange-100 text-sm font-medium bg-white/20 px-3 py-1 rounded-full w-fit backdrop-blur-sm">
                        <Trophy size={14} className="text-yellow-300"/>
                        پایه {student.gradeLevel || 'تحصیلی'}
                    </div>
                </div>
            </div>
            
            <button 
                onClick={() => navigate('/')} 
                className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl flex items-center justify-center transition shadow-inner border border-white/10"
            >
                <LogOut size={20} />
            </button>
        </div>
      </div>

      {/* Main Content Card - Floats over header */}
      <div className="max-w-md mx-auto px-4 -mt-16 relative z-20 space-y-6">
        
        {/* Stats Row */}
        <div className="flex gap-4">
            <div className="flex-1 bg-white p-4 rounded-3xl shadow-sm border-b-4 border-yellow-400 flex flex-col items-center justify-center gap-1 hover:transform hover:-translate-y-1 transition duration-300">
                <span className="text-3xl font-black text-gray-800">12</span>
                <span className="text-xs text-gray-400 font-bold flex items-center gap-1"><Star size={12} className="text-yellow-400 fill-yellow-400"/> ستاره‌های من</span>
            </div>
            <div className="flex-1 bg-white p-4 rounded-3xl shadow-sm border-b-4 border-blue-400 flex flex-col items-center justify-center gap-1 hover:transform hover:-translate-y-1 transition duration-300">
                <span className="text-3xl font-black text-gray-800">{classes.length}</span>
                <span className="text-xs text-gray-400 font-bold flex items-center gap-1"><BookOpen size={12} className="text-blue-400"/> کلاس‌های من</span>
            </div>
        </div>

        {/* Today's Schedule */}
        <div>
            <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2 pr-2">
                <span className="w-3 h-8 bg-orange-500 rounded-full shadow-lg shadow-orange-500/30"></span>
                برنامه امروز
            </h2>
            
            {todaysClasses.length > 0 ? (
                <div className="space-y-4">
                    {todaysClasses.map(cls => {
                        const schedule = cls.schedule?.find(s => s.dayOfWeek === todayIndex);
                        return (
                            <div key={cls.id} className="bg-white rounded-[2rem] p-5 shadow-lg shadow-gray-200/50 border border-gray-100 relative overflow-hidden group hover:shadow-xl transition-all">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[4rem] -mr-4 -mt-4 z-0"></div>
                                
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <div className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-lg w-fit mb-2">
                                                کلاس آنلاین
                                            </div>
                                            <h3 className="font-black text-xl text-gray-800">{cls.title}</h3>
                                            <div className="flex items-center gap-2 text-gray-400 text-sm mt-2 font-medium bg-gray-50 w-fit px-3 py-1 rounded-full">
                                                <Clock size={16} className="text-orange-400" />
                                                <span dir="ltr">{schedule?.startTime} - {schedule?.endTime}</span>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                                            <Video size={24} />
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => navigate(`/room/class-${cls.id}?role=${UserRole.STUDENT}&name=${encodeURIComponent(student.name)}`)}
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3 transition-transform transform active:scale-95 text-lg"
                                    >
                                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                            <ChevronLeft size={20} />
                                        </div>
                                        ورود به کلاس
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] p-8 text-center shadow-sm border-2 border-dashed border-gray-200">
                    <div className="text-6xl mb-4 grayscale opacity-50">🎉</div>
                    <p className="font-black text-gray-500 text-lg">امروز کلاسی نداری!</p>
                    <p className="text-sm text-gray-400 mt-2">می‌تونی استراحت کنی و تکالیفت رو انجام بدی.</p>
                </div>
            )}
        </div>

        {/* Weekly Schedule */}
        <div>
             <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2 pr-2">
                <span className="w-3 h-8 bg-purple-500 rounded-full shadow-lg shadow-purple-500/30"></span>
                سایر کلاس‌ها
            </h2>
            
            <div className="space-y-3">
                {otherClasses.length > 0 ? otherClasses.map(cls => (
                     <div key={cls.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:bg-purple-50/50 transition cursor-default">
                         <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center font-black text-xl">
                                 {(cls.title || '').slice(0,1)}
                             </div>
                             <div>
                                 <h4 className="font-bold text-gray-800 text-lg">{cls.title}</h4>
                                 <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-2">
                                     {cls.schedule?.map((s, idx) => (
                                         <span key={idx} className="bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">{getDayLabel(s.dayOfWeek)} ساعت {s.startTime}</span>
                                     ))}
                                 </div>
                             </div>
                         </div>
                     </div>
                )) : (
                    <div className="text-center text-gray-400 text-sm py-8 bg-white rounded-3xl border border-gray-100">کلاس دیگری وجود ندارد.</div>
                )}
            </div>
        </div>

      </div>

      {/* Bottom Nav (Decoration) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-2 pb-5 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex justify-around items-center md:hidden z-30">
          <button className="flex flex-col items-center gap-1 text-orange-500 p-2">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center shadow-sm">
                  <BookOpen size={24} />
              </div>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-300 hover:text-gray-500 p-2">
              <Calendar size={24} />
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-300 hover:text-gray-500 p-2">
              <Star size={24} />
          </button>
      </div>
    </div>
  );
};
