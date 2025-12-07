
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService, toPersianDate } from '../services/api'; 
import { ClassLicense, Teacher, Student, WeeklySchedule } from '../types';
import { Button } from '../components/Button';
import { 
  School, Wallet, Users, Clock, CheckCircle, Plus, LogOut, Trash2, Edit2, AlertCircle, 
  Calendar, RefreshCw, XCircle, ChevronRight, PlayCircle, Loader2, Save, Mail, 
  CreditCard, ArrowUpCircle, GraduationCap, ArrowRight, ArrowLeft, MoreVertical,
  User, Search, Filter, Monitor
} from 'lucide-react';

const PRICES = {
    CAPACITY_30: { DAILY: 10000, WEEKLY: 70000 },
    CAPACITY_100: { DAILY: 25000, WEEKLY: 175000 }
};

const WEEK_DAYS = [
    { id: 6, label: 'شنبه' },
    { id: 0, label: 'یکشنبه' },
    { id: 1, label: 'دوشنبه' },
    { id: 2, label: 'سه‌شنبه' },
    { id: 3, label: 'چهارشنبه' },
    { id: 4, label: 'پنج‌شنبه' },
    { id: 5, label: 'جمعه' },
];

export const WorkspaceAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'classes' | 'teachers' | 'students'>('classes');
  
  // Data State
  const [balance, setBalance] = useState(0);
  const [activeLicenses, setActiveLicenses] = useState<ClassLicense[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); 

  // --- MODAL STATES ---
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [chargeAmount, setChargeAmount] = useState('');

  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [createClassForm, setCreateClassForm] = useState({
      title: '',
      capacity: 30 as 30 | 100,
      renewPeriod: 'DAILY' as 'DAILY' | 'WEEKLY'
  });

  const [managedClassId, setManagedClassId] = useState<string | null>(null);
  const [manageTab, setManageTab] = useState<'teacher' | 'students' | 'schedule'>('teacher');
  
  // Local state for management modal to avoid constant re-renders of main list
  const [editingLicense, setEditingLicense] = useState<ClassLicense | null>(null);

  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: '', email: '', subject: '' });
  
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', username: '', gradeLevel: '', parentPhone: '' });

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        const [ws, licenses, teachersList, studentsList] = await Promise.all([
            ApiService.getWorkspace(),
            ApiService.getLicenses(),
            ApiService.getTeachers(),
            ApiService.getStudents()
        ]);
        if (ws) setBalance(ws.walletBalance);
        setActiveLicenses(licenses);
        setTeachers(teachersList);
        setStudents(studentsList);
    } catch (e) {
        console.error("Error fetching data", e);
    } finally {
        setIsLoading(false);
    }
  };

  const getPrice = (cap: 30 | 100, period: 'DAILY' | 'WEEKLY') => {
      const tier = cap === 30 ? PRICES.CAPACITY_30 : PRICES.CAPACITY_100;
      return period === 'DAILY' ? tier.DAILY : tier.WEEKLY;
  };

  // --- WALLET ---
  const handleChargeWallet = async () => {
      const amount = parseInt(chargeAmount.replace(/,/g, ''));
      if (!amount || amount <= 0) return;
      setIsProcessing(true);
      try {
          const newBalance = balance + amount;
          await ApiService.updateWalletBalance(newBalance);
          setBalance(newBalance);
          setShowWalletModal(false);
          setChargeAmount('');
      } finally { setIsProcessing(false); }
  };

  // --- CLASS CREATION ---
  const handleCreateClass = async () => {
      if (!createClassForm.title) return alert("لطفا عنوان کلاس را وارد کنید");
      const cost = getPrice(createClassForm.capacity, createClassForm.renewPeriod);
      
      if (balance < cost) {
          alert("موجودی کیف پول کافی نیست. لطفا حساب خود را شارژ کنید.");
          return;
      }

      setIsProcessing(true);
      try {
           // 1. Deduct
           const newBalance = balance - cost;
           await ApiService.updateWalletBalance(newBalance);
           setBalance(newBalance);

           // 2. Create
           const startDate = new Date();
           const endDate = new Date();
           endDate.setDate(startDate.getDate() + (createClassForm.renewPeriod === 'DAILY' ? 1 : 7));

           const newLicense: ClassLicense = {
               id: Math.random().toString(36).substr(2, 9),
               title: createClassForm.title,
               capacity: createClassForm.capacity,
               startDate: startDate.toISOString(),
               endDate: endDate.toISOString(),
               autoRenew: true,
               renewPeriod: createClassForm.renewPeriod,
               costPerPeriod: cost,
               isActive: true,
               schedule: []
           };

           await ApiService.createLicense(newLicense);
           setActiveLicenses(prev => [...prev, newLicense]);
           setShowCreateClassModal(false);
           setCreateClassForm({ title: '', capacity: 30, renewPeriod: 'DAILY' });
      } finally { setIsProcessing(false); }
  };

  // --- CLASS MANAGEMENT ---
  const openManageModal = (license: ClassLicense) => {
      setEditingLicense({ ...license }); // Clone
      setManagedClassId(license.id);
      setManageTab('teacher');
  };

  const saveManagedClass = async () => {
      if (!editingLicense) return;
      setIsProcessing(true);
      try {
          await ApiService.updateLicense(editingLicense);
          // Update local list
          setActiveLicenses(prev => prev.map(l => l.id === editingLicense.id ? editingLicense : l));
          setManagedClassId(null);
          setEditingLicense(null);
      } finally { setIsProcessing(false); }
  };

  const updateSchedule = (dayId: number, field: 'startTime' | 'endTime', value: string) => {
      if (!editingLicense) return;
      const currentSchedule = editingLicense.schedule || [];
      const existingDay = currentSchedule.find(s => s.dayOfWeek === dayId);
      
      let newSchedule = [...currentSchedule];
      
      if (!value && field === 'startTime') {
           // Clearing start time removes the day entry if end time is also gone or irrelevant logic
      }

      if (existingDay) {
          newSchedule = newSchedule.map(s => s.dayOfWeek === dayId ? { ...s, [field]: value } : s);
      } else {
          newSchedule.push({
              dayOfWeek: dayId,
              startTime: field === 'startTime' ? value : '',
              endTime: field === 'endTime' ? value : ''
          });
      }
      // Filter out invalid entries on save or keep them in state? Keeping in state is easier for UI
      setEditingLicense({ ...editingLicense, schedule: newSchedule });
  };

  // --- TEACHER & STUDENT CRUD ---
  const handleCreateTeacher = async () => {
    if (!newTeacher.name) return;
    setIsProcessing(true);
    try {
        const t = await ApiService.createTeacher({ id: Math.random().toString(36).substr(2,9), ...newTeacher });
        setTeachers(prev => [...prev, t]);
        setShowTeacherModal(false);
        setNewTeacher({ name: '', email: '', subject: '' });
    } finally { setIsProcessing(false); }
  };

  const handleCreateStudent = async () => {
    if (!newStudent.name || !newStudent.username) return;
    setIsProcessing(true);
    try {
        const s = await ApiService.createStudent({ id: Math.random().toString(36).substr(2,9), ...newStudent });
        setStudents(prev => [...prev, s]);
        setShowStudentModal(false);
        setNewStudent({ name: '', username: '', gradeLevel: '', parentPhone: '' });
    } finally { setIsProcessing(false); }
  };


  if (isLoading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" size={32}/></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-800 dark:text-gray-100 pb-12">
        
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <School size={22} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg hidden sm:block">پنل مدیریت مدرسه</h1>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Wallet Widget */}
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-1 pr-3 rounded-lg border border-gray-200 dark:border-gray-600">
                         <div className="flex flex-col items-end leading-tight">
                             <span className="font-bold text-sm">{balance.toLocaleString()}</span>
                             <span className="text-[10px] text-gray-500">تومان</span>
                         </div>
                         <button 
                            onClick={() => setShowWalletModal(true)}
                            className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center justify-center transition shadow-sm"
                            title="افزایش اعتبار"
                         >
                             <Plus size={16} />
                         </button>
                    </div>

                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

                    <button onClick={() => navigate('/')} className="text-gray-500 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-8">
            
            {/* Main Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex p-1 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm overflow-x-auto max-w-full">
                    {[
                        { id: 'classes', label: 'کلاس‌های فعال', icon: <Monitor size={16}/> },
                        { id: 'teachers', label: 'معلمین', icon: <User size={16}/> },
                        { id: 'students', label: 'دانش‌آموزان', icon: <GraduationCap size={16}/> },
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div>
                    {activeTab === 'classes' && (
                        <Button onClick={() => setShowCreateClassModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30">
                            <Plus size={18} className="ml-2"/> ایجاد کلاس جدید
                        </Button>
                    )}
                    {activeTab === 'teachers' && (
                        <Button onClick={() => setShowTeacherModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30">
                            <Plus size={18} className="ml-2"/> افزودن معلم
                        </Button>
                    )}
                    {activeTab === 'students' && (
                        <Button onClick={() => setShowStudentModal(true)} className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30">
                            <Plus size={18} className="ml-2"/> ثبت‌نام دانش‌آموز
                        </Button>
                    )}
                </div>
            </div>

            {/* --- CONTENT: CLASSES --- */}
            {activeTab === 'classes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
                    {activeLicenses.map(license => {
                        const isExpired = new Date(license.endDate) < new Date();
                        const teacherName = teachers.find(t => t.id === license.teacherId)?.name || '---';
                        const scheduleCount = license.schedule?.filter(s => s.startTime).length || 0;

                        return (
                            <div key={license.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col overflow-hidden">
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
                                            {(license.title || '').slice(0,1)}
                                        </div>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold border ${isExpired ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                            {isExpired ? 'منقضی' : 'فعال'}
                                        </span>
                                    </div>
                                    
                                    <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1">{license.title}</h3>
                                    <div className="text-xs text-gray-500 mb-4">انقضا: {toPersianDate(license.endDate)}</div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                                            <span className="text-gray-500">معلم:</span>
                                            <span className="font-bold">{teacherName}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                                            <span className="text-gray-500">دانش‌آموزان:</span>
                                            <span className="font-bold">{license.studentIds?.length || 0} / {license.capacity}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700 flex gap-2">
                                    <button 
                                        onClick={() => openManageModal(license)}
                                        className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded-lg text-sm font-bold hover:bg-blue-600 hover:text-white hover:border-blue-600 transition shadow-sm"
                                    >
                                        مدیریت و برنامه‌ریزی
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {activeLicenses.length === 0 && (
                        <div className="col-span-full py-16 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50">
                            <School size={48} className="mx-auto mb-4 opacity-50"/>
                            <p>هنوز کلاسی ایجاد نشده است.</p>
                            <Button onClick={() => setShowCreateClassModal(true)} variant="ghost" className="mt-2 text-blue-600">ایجاد اولین کلاس</Button>
                        </div>
                    )}
                </div>
            )}

            {/* --- CONTENT: TEACHERS --- */}
            {activeTab === 'teachers' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right min-w-[600px]">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 font-medium">
                                <tr>
                                    <th className="p-4 w-16">#</th>
                                    <th className="p-4">مشخصات معلم</th>
                                    <th className="p-4">ایمیل / نام کاربری</th>
                                    <th className="p-4">تخصص</th>
                                    <th className="p-4 text-center">عملیات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {teachers.map((t, idx) => (
                                    <tr key={t.id} className="hover:bg-blue-50/50 dark:hover:bg-gray-700/30 transition">
                                        <td className="p-4 text-center text-gray-400 text-sm">{idx + 1}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                                                    {(t.name || '').slice(0,1)}
                                                </div>
                                                <span className="font-bold text-gray-800 dark:text-gray-100">{t.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-sm text-gray-500">{t.email}</td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
                                                {t.subject || 'عمومی'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => { ApiService.deleteTeacher(t.id).then(fetchData) }} className="p-2 text-gray-400 hover:text-red-600 transition rounded-full hover:bg-red-50">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {teachers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">لیست معلمین خالی است.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- CONTENT: STUDENTS --- */}
            {activeTab === 'students' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right min-w-[700px]">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 font-medium">
                                <tr>
                                    <th className="p-4 w-16">#</th>
                                    <th className="p-4">مشخصات دانش‌آموز</th>
                                    <th className="p-4">نام کاربری</th>
                                    <th className="p-4">پایه تحصیلی</th>
                                    <th className="p-4">شماره والدین</th>
                                    <th className="p-4 text-center">عملیات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {students.map((s, idx) => (
                                    <tr key={s.id} className="hover:bg-green-50/50 dark:hover:bg-gray-700/30 transition">
                                        <td className="p-4 text-center text-gray-400 text-sm">{idx + 1}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm">
                                                    {(s.name || '').slice(0,1)}
                                                </div>
                                                <span className="font-bold text-gray-800 dark:text-gray-100">{s.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-sm text-blue-600">{s.username}</td>
                                        <td className="p-4 text-sm text-gray-600">{s.gradeLevel}</td>
                                        <td className="p-4 font-mono text-sm text-gray-500">{s.parentPhone || '---'}</td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => { ApiService.deleteStudent(s.id).then(fetchData) }} className="p-2 text-gray-400 hover:text-red-600 transition rounded-full hover:bg-red-50">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                 {students.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">لیست دانش‌آموزان خالی است.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>

        {/* ================= MODALS ================= */}

        {/* 1. WALLET MODAL */}
        {showWalletModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">افزایش اعتبار کیف پول</h3>
                        <button onClick={() => setShowWalletModal(false)}><XCircle className="text-gray-400 hover:text-red-500"/></button>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mb-4 text-center">
                        <span className="text-sm text-gray-500">موجودی فعلی</span>
                        <div className="text-2xl font-bold text-blue-600 mt-1">{balance.toLocaleString()} تومان</div>
                    </div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">مبلغ شارژ (تومان)</label>
                    <input 
                        type="number"
                        autoFocus
                        value={chargeAmount}
                        onChange={(e) => setChargeAmount(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-xl font-bold text-lg text-center mb-4 focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="مثلا ۱۰۰,۰۰۰"
                    />
                    <div className="flex gap-2">
                        <Button onClick={handleChargeWallet} disabled={isProcessing} className="w-full bg-green-600 hover:bg-green-700">
                            {isProcessing ? <Loader2 className="animate-spin"/> : 'پرداخت و شارژ'}
                        </Button>
                    </div>
                </div>
            </div>
        )}

        {/* 2. CREATE CLASS MODAL (SIMPLE) */}
        {showCreateClassModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 overflow-hidden">
                    <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                        <h3 className="font-bold text-lg">ایجاد کلاس جدید</h3>
                        <button onClick={() => setShowCreateClassModal(false)}><XCircle className="text-gray-400 hover:text-red-500"/></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-2">عنوان کلاس</label>
                            <input 
                                value={createClassForm.title}
                                onChange={(e) => setCreateClassForm({...createClassForm, title: e.target.value})}
                                className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-xl border-none focus:ring-2 focus:ring-blue-500"
                                placeholder="مثال: ریاضی پایه نهم"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">ظرفیت</label>
                                <div className="space-y-2">
                                    <button 
                                        onClick={() => setCreateClassForm({...createClassForm, capacity: 30})} 
                                        className={`w-full p-2 rounded-lg border text-sm transition ${createClassForm.capacity === 30 ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200'}`}
                                    >
                                        ۳۰ نفر
                                    </button>
                                    <button 
                                        onClick={() => setCreateClassForm({...createClassForm, capacity: 100})} 
                                        className={`w-full p-2 rounded-lg border text-sm transition ${createClassForm.capacity === 100 ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200'}`}
                                    >
                                        ۱۰۰ نفر
                                    </button>
                                </div>
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">مدت زمان</label>
                                <div className="space-y-2">
                                    <button 
                                        onClick={() => setCreateClassForm({...createClassForm, renewPeriod: 'DAILY'})} 
                                        className={`w-full p-2 rounded-lg border text-sm transition ${createClassForm.renewPeriod === 'DAILY' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200'}`}
                                    >
                                        یک روزه
                                    </button>
                                    <button 
                                        onClick={() => setCreateClassForm({...createClassForm, renewPeriod: 'WEEKLY'})} 
                                        className={`w-full p-2 rounded-lg border text-sm transition ${createClassForm.renewPeriod === 'WEEKLY' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200'}`}
                                    >
                                        یک هفته‌ای
                                    </button>
                                </div>
                             </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl flex justify-between items-center border border-gray-100 dark:border-gray-700 mt-4">
                             <span className="text-sm font-bold text-gray-500">مبلغ قابل پرداخت:</span>
                             <span className="text-xl font-bold text-blue-600">{getPrice(createClassForm.capacity, createClassForm.renewPeriod).toLocaleString()} تومان</span>
                        </div>
                    </div>
                    <div className="p-5 border-t dark:border-gray-700 flex gap-3">
                         <Button variant="secondary" className="flex-1" onClick={() => setShowCreateClassModal(false)}>انصراف</Button>
                         <Button className="flex-[2] bg-blue-600 hover:bg-blue-700" onClick={handleCreateClass} disabled={isProcessing}>
                             {isProcessing ? <Loader2 className="animate-spin"/> : 'پرداخت و ایجاد'}
                         </Button>
                    </div>
                </div>
            </div>
        )}

        {/* 3. MANAGE CLASS MODAL (THE BIG BOX) */}
        {managedClassId && editingLicense && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
                    
                    {/* Header */}
                    <div className="p-4 md:p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 shrink-0">
                        <div>
                            <h2 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-white truncate max-w-[200px] md:max-w-none">{editingLicense.title}</h2>
                            <p className="text-xs md:text-sm text-gray-500 mt-1 hidden md:block">مدیریت اعضا و برنامه‌ریزی کلاسی</p>
                        </div>
                        <div className="flex gap-2 md:gap-3">
                            <Button variant="ghost" onClick={() => { setManagedClassId(null); setEditingLicense(null); }} className="text-xs md:text-sm">بستن</Button>
                            <Button onClick={saveManagedClass} disabled={isProcessing} className="px-3 md:px-6 text-xs md:text-sm">
                                {isProcessing ? <Loader2 className="animate-spin"/> : <><Save size={16} className="md:ml-2"/> <span className="hidden md:inline">ذخیره تغییرات</span><span className="md:hidden">ذخیره</span></>}
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                        {/* Sidebar Tabs (Responsive: Top scroll row on mobile, Left column on Desktop) */}
                        <div className="w-full md:w-64 bg-white dark:bg-gray-800 border-b md:border-b-0 md:border-l dark:border-gray-700 p-2 md:p-4 flex flex-row md:flex-col gap-2 shadow-inner shrink-0 overflow-x-auto">
                             <button onClick={() => setManageTab('teacher')} className={`p-2 md:p-3 rounded-xl text-right flex items-center gap-2 md:gap-3 transition whitespace-nowrap min-w-max ${manageTab === 'teacher' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'hover:bg-gray-50 text-gray-600'}`}>
                                 <User size={18}/> <span className="text-sm">انتخاب معلم</span>
                             </button>
                             <button onClick={() => setManageTab('students')} className={`p-2 md:p-3 rounded-xl text-right flex items-center gap-2 md:gap-3 transition whitespace-nowrap min-w-max ${manageTab === 'students' ? 'bg-green-50 text-green-600 border border-green-200' : 'hover:bg-gray-50 text-gray-600'}`}>
                                 <Users size={18}/> <span className="text-sm">لیست دانش‌آموزان</span>
                             </button>
                             <button onClick={() => setManageTab('schedule')} className={`p-2 md:p-3 rounded-xl text-right flex items-center gap-2 md:gap-3 transition whitespace-nowrap min-w-max ${manageTab === 'schedule' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'hover:bg-gray-50 text-gray-600'}`}>
                                 <Calendar size={18}/> <span className="text-sm">تقویم آموزشی</span>
                             </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-900/50">
                            
                            {/* TEACHER TAB */}
                            {manageTab === 'teacher' && (
                                <div className="space-y-6 animate-in slide-in-from-right">
                                    <h3 className="font-bold text-lg border-b pb-2 mb-4">انتخاب معلم کلاس</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {teachers.map(t => (
                                            <div 
                                                key={t.id}
                                                onClick={() => setEditingLicense({...editingLicense, teacherId: t.id})}
                                                className={`p-4 rounded-xl border cursor-pointer flex items-center gap-4 transition-all ${editingLicense.teacherId === t.id ? 'bg-blue-600 text-white shadow-lg scale-[1.02]' : 'bg-white hover:border-blue-300'}`}
                                            >
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${editingLicense.teacherId === t.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                    {(t.name || '').slice(0,1)}
                                                </div>
                                                <div>
                                                    <div className="font-bold">{t.name}</div>
                                                    <div className={`text-xs ${editingLicense.teacherId === t.id ? 'text-blue-100' : 'text-gray-500'}`}>{t.subject}</div>
                                                </div>
                                                {editingLicense.teacherId === t.id && <CheckCircle className="mr-auto text-white" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STUDENTS TAB */}
                            {manageTab === 'students' && (
                                <div className="space-y-6 animate-in slide-in-from-right">
                                     <div className="flex justify-between items-center border-b pb-2 mb-4">
                                        <h3 className="font-bold text-lg">لیست دانش‌آموزان</h3>
                                        <div className="text-sm bg-gray-200 px-3 py-1 rounded-full">{editingLicense.studentIds?.length || 0} انتخاب شده</div>
                                     </div>
                                     
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                         {students.map(s => {
                                             const isSelected = editingLicense.studentIds?.includes(s.id);
                                             return (
                                                 <div 
                                                    key={s.id}
                                                    onClick={() => {
                                                        const currentIds = editingLicense.studentIds || [];
                                                        const newIds = isSelected ? currentIds.filter(id => id !== s.id) : [...currentIds, s.id];
                                                        setEditingLicense({...editingLicense, studentIds: newIds});
                                                    }}
                                                    className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition ${isSelected ? 'bg-green-50 border-green-500 ring-1 ring-green-500' : 'bg-white hover:bg-gray-50'}`}
                                                 >
                                                     <div className="flex items-center gap-3">
                                                         <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">{(s.name || '').slice(0,1)}</div>
                                                         <span className="text-sm font-bold">{s.name}</span>
                                                     </div>
                                                     {isSelected && <CheckCircle size={18} className="text-green-600"/>}
                                                 </div>
                                             )
                                         })}
                                     </div>
                                </div>
                            )}

                            {/* SCHEDULE TAB */}
                            {manageTab === 'schedule' && (
                                <div className="space-y-6 animate-in slide-in-from-right">
                                    <h3 className="font-bold text-lg border-b pb-2 mb-4">برنامه هفتگی برگزاری کلاس</h3>
                                    <div className="space-y-2">
                                        {WEEK_DAYS.map(day => {
                                            const schedule = editingLicense.schedule?.find(s => s.dayOfWeek === day.id);
                                            const isActive = !!schedule?.startTime;
                                            return (
                                                <div key={day.id} className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-4 rounded-xl border transition ${isActive ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200 opacity-75'}`}>
                                                    <div className="w-24 font-bold">{day.label}</div>
                                                    <div className="flex w-full sm:w-auto gap-4">
                                                        <div className="flex items-center gap-2 flex-1 sm:flex-none">
                                                            <span className="text-xs text-gray-500 whitespace-nowrap">از ساعت</span>
                                                            <input 
                                                                type="time" 
                                                                className="bg-gray-50 border rounded p-2 text-sm focus:border-orange-500 outline-none w-full"
                                                                value={schedule?.startTime || ''}
                                                                onChange={(e) => updateSchedule(day.id, 'startTime', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-1 sm:flex-none">
                                                            <span className="text-xs text-gray-500 whitespace-nowrap">تا ساعت</span>
                                                            <input 
                                                                type="time" 
                                                                className="bg-gray-50 border rounded p-2 text-sm focus:border-orange-500 outline-none w-full"
                                                                value={schedule?.endTime || ''}
                                                                onChange={(e) => updateSchedule(day.id, 'endTime', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        )}

         {/* --- TEACHER MODAL (Add New) --- */}
        {showTeacherModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl p-6 shadow-xl animate-in zoom-in-95">
                    <h3 className="font-bold text-lg mb-4">افزودن معلم جدید</h3>
                    <div className="space-y-3">
                        <input className="w-full bg-gray-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-500" placeholder="نام و نام خانوادگی" value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})} />
                        <input className="w-full bg-gray-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-500" placeholder="ایمیل" value={newTeacher.email} onChange={e => setNewTeacher({...newTeacher, email: e.target.value})} dir="ltr"/>
                        <input className="w-full bg-gray-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-500" placeholder="تخصص (مثال: ریاضی)" value={newTeacher.subject} onChange={e => setNewTeacher({...newTeacher, subject: e.target.value})} />
                        <div className="flex gap-2 pt-4">
                             <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={handleCreateTeacher} disabled={isProcessing}>{isProcessing ? <Loader2 className="animate-spin"/> : 'ذخیره'}</Button>
                             <Button variant="secondary" className="flex-1" onClick={() => setShowTeacherModal(false)}>لغو</Button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- STUDENT MODAL (Add New) --- */}
        {showStudentModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl p-6 shadow-xl animate-in zoom-in-95">
                    <h3 className="font-bold text-lg mb-4">ثبت نام دانش‌آموز جدید</h3>
                    <div className="space-y-3">
                        <input className="w-full bg-gray-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-green-500" placeholder="نام و نام خانوادگی" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                        <input className="w-full bg-gray-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-green-500" placeholder="نام کاربری (انگلیسی)" value={newStudent.username} onChange={e => setNewStudent({...newStudent, username: e.target.value})} dir="ltr"/>
                        <input className="w-full bg-gray-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-green-500" placeholder="پایه تحصیلی" value={newStudent.gradeLevel} onChange={e => setNewStudent({...newStudent, gradeLevel: e.target.value})} />
                         <input className="w-full bg-gray-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-green-500" placeholder="شماره تماس والدین" value={newStudent.parentPhone} onChange={e => setNewStudent({...newStudent, parentPhone: e.target.value})} dir="ltr"/>
                        <div className="flex gap-2 pt-4">
                             <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleCreateStudent} disabled={isProcessing}>{isProcessing ? <Loader2 className="animate-spin"/> : 'ذخیره'}</Button>
                             <Button variant="secondary" className="flex-1" onClick={() => setShowStudentModal(false)}>لغو</Button>
                        </div>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};
