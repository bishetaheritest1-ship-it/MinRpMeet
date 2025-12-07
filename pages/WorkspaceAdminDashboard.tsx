
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService, toPersianDate } from '../services/api'; 
import { ClassLicense, Teacher } from '../types';
import { Button } from '../components/Button';
import { 
  School, Wallet, Users, Clock, CheckCircle, Plus, LogOut, Trash2, Edit2, AlertCircle, Calendar, RefreshCw, XCircle, ChevronRight, PlayCircle, Loader2, Save, Mail, CreditCard, ArrowUpCircle
} from 'lucide-react';

const PRICES = {
    CAPACITY_30: { DAILY: 10000, WEEKLY: 70000 },
    CAPACITY_100: { DAILY: 25000, WEEKLY: 175000 }
};

// Helper to convert Persian digits to English
const toEnglishDigits = (str: string) => {
  return str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
}

// Helper to remove commas and non-numeric chars
const cleanNumber = (str: string) => {
    return toEnglishDigits(str).replace(/[^0-9]/g, '');
}

export const WorkspaceAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Data State
  const [balance, setBalance] = useState(0);
  const [activeLicenses, setActiveLicenses] = useState<ClassLicense[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); 

  // Form State (Wallet)
  const [chargeAmount, setChargeAmount] = useState('');

  // Form State (License)
  const [capacityTier, setCapacityTier] = useState<30 | 100>(30);
  const [renewPeriod, setRenewPeriod] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [autoRenew, setAutoRenew] = useState(true);
  const [licenseTitle, setLicenseTitle] = useState('');

  // Form State (Teacher)
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherSubject, setNewTeacherSubject] = useState('');
  
  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        const [ws, licenses, teachersList] = await Promise.all([
            ApiService.getWorkspace(),
            ApiService.getLicenses(),
            ApiService.getTeachers()
        ]);
        if (ws) setBalance(ws.walletBalance);
        setActiveLicenses(licenses);
        setTeachers(teachersList);
    } catch (e) {
        console.error("Error fetching data", e);
    } finally {
        setIsLoading(false);
    }
  };

  // Helper to format date for storage (Gregorian ISO)
  const formatDateISO = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getCurrentPrice = () => {
      const tierPrices = capacityTier === 30 ? PRICES.CAPACITY_30 : PRICES.CAPACITY_100;
      return renewPeriod === 'DAILY' ? tierPrices.DAILY : tierPrices.WEEKLY;
  };

  const handleManualCharge = async () => {
      const rawAmount = cleanNumber(chargeAmount);
      const amount = parseInt(rawAmount);

      if (!rawAmount || isNaN(amount) || amount <= 0) {
          alert("لطفا یک مبلغ معتبر وارد کنید.");
          return;
      }
      
      setIsProcessing(true);
      try {
        const newBalance = balance + amount;
        await ApiService.updateWalletBalance(newBalance);
        setBalance(newBalance);
        setChargeAmount('');
        alert("کیف پول با موفقیت شارژ شد.");
      } catch (error) {
        alert("خطا در بروزرسانی کیف پول.");
      } finally {
        setIsProcessing(false);
      }
  };

  const handleCreateLicense = async () => {
      if (!licenseTitle.trim()) {
          alert("لطفا عنوان کلاس را وارد کنید.");
          return;
      }
      
      const cost = getCurrentPrice();

      if (balance < cost) {
          alert("موجودی کیف پول برای شروع این دوره کافی نیست. لطفا ابتدا کیف پول را شارژ کنید.");
          return;
      }

      setIsProcessing(true);

      try {
          // 1. Deduct Balance
          const newBalance = balance - cost;
          await ApiService.updateWalletBalance(newBalance);
          setBalance(newBalance);

          // 2. Calculate Dates
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(startDate.getDate() + (renewPeriod === 'DAILY' ? 1 : 7));

          // 3. Create Object
          const newLicense: ClassLicense = {
              id: Math.random().toString(36).substr(2, 9),
              title: licenseTitle,
              capacity: capacityTier,
              startDate: formatDateISO(startDate),
              endDate: formatDateISO(endDate),
              autoRenew,
              renewPeriod,
              costPerPeriod: cost,
              isActive: true
          };

          // 4. Save to DB
          await ApiService.createLicense(newLicense);
          
          // 5. Update UI
          setActiveLicenses(prev => [...prev, newLicense]);
          setLicenseTitle('');
          alert("لایسنس با موفقیت ایجاد و فعال شد.");

      } catch (err) {
          alert("خطا در برقراری ارتباط با دیتابیس.");
      } finally {
          setIsProcessing(false);
      }
  };

  const handleManualExtend = async (id: string) => {
      const license = activeLicenses.find(l => l.id === id);
      if (!license) return;

      const cost = license.costPerPeriod;
      
      if (balance < cost) {
          alert("موجودی کافی نیست. لطفا کیف پول را شارژ کنید.");
          return;
      }

      const periodName = license.renewPeriod === 'DAILY' ? 'یک روز' : 'یک هفته';

      if (window.confirm(`آیا تایید می‌کنید که مبلغ ${cost.toLocaleString()} تومان برای تمدید ${periodName} از کیف پول کسر شود؟`)) {
           
           setIsProcessing(true);
           try {
               // 1. Update Balance in DB
               const newBalance = balance - cost;
               await ApiService.updateWalletBalance(newBalance);
               setBalance(newBalance); 
               
               // 2. Calculate Dates (Fix for Timezone/Rounding issues)
               // Set everything to NOON (12:00:00) to avoid midnight rollback bugs
               const [ly, lm, ld] = license.endDate.split('-').map(Number);
               const currentEndDate = new Date(ly, lm - 1, ld, 12, 0, 0, 0); 
               
               const today = new Date();
               today.setHours(12, 0, 0, 0);

               // Determine Start Point: If expired, start from Today. If active, add to existing end.
               let baseDate = currentEndDate;
               // If class expired yesterday or earlier, we restart from today
               if (currentEndDate.getTime() < today.getTime()) {
                   baseDate = today;
               }
               
               // 3. Create NEW Date Object for result and add days
               const newEndDate = new Date(baseDate.getTime());
               const daysToAdd = license.renewPeriod === 'DAILY' ? 1 : 7;
               newEndDate.setDate(newEndDate.getDate() + daysToAdd);
               
               const updatedLicense = {
                   ...license,
                   endDate: formatDateISO(newEndDate),
                   isActive: true
               };

               // 4. Update License in DB
               await ApiService.updateLicense(updatedLicense);
               
               // 5. Update UI
               setActiveLicenses(prev => prev.map(l => l.id === id ? updatedLicense : l));
               
               alert(`تمدید انجام شد. تاریخ پایان جدید: ${toPersianDate(updatedLicense.endDate)}`);

           } catch(e) {
               console.error(e);
               alert("خطا در عملیات تمدید. لطفا مجدد تلاش کنید.");
           } finally {
               setIsProcessing(false);
           }
      }
  };

  const toggleAutoRenew = async (id: string) => {
      const license = activeLicenses.find(l => l.id === id);
      if (!license) return;
      
      const updated = { ...license, autoRenew: !license.autoRenew };
      // Optimistic update
      setActiveLicenses(prev => prev.map(l => l.id === id ? updated : l));
      await ApiService.updateLicense(updated);
  };

  const handleDeleteLicense = async (id: string) => {
      if(window.confirm("آیا از حذف این لایسنس اطمینان دارید؟")) {
          await ApiService.deleteLicense(id);
          setActiveLicenses(prev => prev.filter(l => l.id !== id));
      }
  };

  // --- TEACHER MANAGEMENT ---

  const handleCreateTeacher = async () => {
      if (!newTeacherName || !newTeacherEmail || !newTeacherSubject) {
          return alert("لطفا نام، ایمیل و درس را وارد کنید");
      }

      setIsProcessing(true);
      try {
          const newTeacher: Teacher = {
              id: Math.random().toString(36).substr(2, 9),
              name: newTeacherName,
              email: newTeacherEmail,
              subject: newTeacherSubject
          };
          await ApiService.createTeacher(newTeacher);
          setTeachers(prev => [...prev, newTeacher]);
          setShowTeacherModal(false);
          setNewTeacherName('');
          setNewTeacherEmail('');
          setNewTeacherSubject('');
      } catch (e) {
          alert("خطا در ایجاد معلم");
      } finally {
          setIsProcessing(false);
      }
  };

  const handleDeleteTeacher = async (id: string) => {
      if(window.confirm("آیا از حذف این معلم اطمینان دارید؟")) {
          await ApiService.deleteTeacher(id);
          setTeachers(prev => prev.filter(t => t.id !== id));
      }
  };

  if (isLoading && balance === 0 && activeLicenses.length === 0) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500">
          <Loader2 className="animate-spin mr-2" /> در حال دریافت اطلاعات از سرور...
      </div>;
  }

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
                        <h1 className="font-bold text-lg">پنل مدیریت دبیرستان</h1>
                        <div className="text-xs text-gray-500">مدیر: دکتر محمدی</div>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg flex items-center gap-2">
                        <Wallet className="text-green-500" size={18} />
                        <span className="font-bold text-lg">{balance.toLocaleString()}</span>
                        <span className="text-xs text-gray-500">تومان</span>
                    </div>
                    <button onClick={() => navigate('/')} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Wallet & Create License */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* 1. Wallet Management Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border dark:border-gray-700 shadow-sm">
                    <h2 className="font-bold text-xl mb-4 flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CreditCard size={20}/> مدیریت موجودی
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">افزایش موجودی (تومان)</label>
                            <div className="flex gap-2">
                                <input 
                                    className="w-full bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-lg p-2 text-sm outline-none focus:border-green-500 font-mono"
                                    placeholder="مثال: 1,000,000"
                                    dir="ltr"
                                    value={chargeAmount}
                                    onChange={e => setChargeAmount(e.target.value)}
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">مبلغ را بدون واحد وارد کنید.</p>
                        </div>
                        <Button 
                            className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2" 
                            onClick={handleManualCharge}
                            disabled={isProcessing}
                        >
                            {isProcessing ? <Loader2 className="animate-spin" size={16}/> : <ArrowUpCircle size={16}/>}
                            شارژ کیف پول
                        </Button>
                    </div>
                </div>

                {/* 2. Create License Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border dark:border-gray-700 shadow-sm sticky top-24">
                    <h2 className="font-bold text-xl mb-6 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <Plus size={20}/> ایجاد لایسنس کلاس
                    </h2>
                    
                    <div className="space-y-5">
                        {/* Title Input */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">عنوان کلاس</label>
                            <input 
                                className="w-full bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                                placeholder="مثال: کلاس زیست شناسی"
                                value={licenseTitle}
                                onChange={e => setLicenseTitle(e.target.value)}
                            />
                        </div>

                        {/* Capacity Selection */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">ظرفیت کلاس</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setCapacityTier(30)}
                                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${capacityTier === 30 ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 ring-1 ring-blue-500' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}
                                >
                                    <span className="font-bold text-lg">۳۰ نفر</span>
                                </button>
                                <button 
                                    onClick={() => setCapacityTier(100)}
                                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${capacityTier === 100 ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 ring-1 ring-blue-500' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}
                                >
                                    <span className="font-bold text-lg">۱۰۰ نفر</span>
                                </button>
                            </div>
                        </div>

                        {/* Period Selection */}
                        <div>
                             <label className="block text-xs font-bold text-gray-500 mb-2">دوره پرداخت (تمدید)</label>
                             <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setRenewPeriod('DAILY')}
                                    className={`p-3 rounded-xl border text-sm font-bold transition ${renewPeriod === 'DAILY' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 ring-1 ring-blue-500' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}
                                >
                                    روزانه
                                    <div className="text-[10px] font-normal mt-1 opacity-80">
                                        {(capacityTier === 30 ? PRICES.CAPACITY_30.DAILY : PRICES.CAPACITY_100.DAILY).toLocaleString()} ت
                                    </div>
                                </button>
                                <button 
                                    onClick={() => setRenewPeriod('WEEKLY')}
                                    className={`p-3 rounded-xl border text-sm font-bold transition ${renewPeriod === 'WEEKLY' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 ring-1 ring-blue-500' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}
                                >
                                    هفتگی
                                    <div className="text-[10px] font-normal mt-1 opacity-80">
                                        {(capacityTier === 30 ? PRICES.CAPACITY_30.WEEKLY : PRICES.CAPACITY_100.WEEKLY).toLocaleString()} ت
                                    </div>
                                </button>
                             </div>
                        </div>

                        {/* Auto Renew Toggle */}
                        <div 
                            onClick={() => setAutoRenew(!autoRenew)}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${autoRenew ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-700'}`}
                        >
                            <div className="flex items-center gap-2">
                                <RefreshCw size={18} className={autoRenew ? 'text-green-600' : 'text-gray-400'} />
                                <span className={`text-sm font-medium ${autoRenew ? 'text-green-700 dark:text-green-300' : 'text-gray-500'}`}>تمدید اتوماتیک</span>
                            </div>
                            <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${autoRenew ? 'bg-green-500' : 'bg-gray-400'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${autoRenew ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400">
                            {autoRenew 
                                ? 'پس از اتمام دوره، در صورت موجودی کافی، به صورت خودکار تمدید می‌شود.' 
                                : 'پس از اتمام دوره، لایسنس غیرفعال شده و باید دستی تمدید شود.'}
                        </p>

                        {/* Total & Action */}
                        <div className="pt-4 border-t dark:border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-500 text-sm">هزینه فعال‌سازی (دوره اول):</span>
                                <span className="font-bold text-xl text-blue-600">{getCurrentPrice().toLocaleString()} <span className="text-xs">تومان</span></span>
                            </div>
                            <Button 
                                className="w-full h-12 text-lg shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2" 
                                onClick={handleCreateLicense}
                                disabled={isProcessing}
                            >
                                {isProcessing ? <><Loader2 className="animate-spin"/> در حال پردازش...</> : 'ایجاد و پرداخت'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Active Licenses & Teachers */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* Active Licenses List */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border dark:border-gray-700 shadow-sm">
                    <h2 className="font-bold text-xl mb-6 flex items-center gap-2">
                        <CheckCircle className="text-green-500" size={20}/> لایسنس‌های کلاس‌های شما
                    </h2>
                    
                    <div className="grid gap-4">
                        {activeLicenses.map(license => {
                             const isExpired = new Date(license.endDate) < new Date();
                             return (
                                <div key={license.id} className={`border rounded-xl p-4 flex flex-col gap-4 relative overflow-hidden transition ${isExpired ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30'}`}>
                                    
                                    {/* Top Row: Info */}
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white font-bold shadow-md ${license.capacity === 30 ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-purple-500 to-purple-600'}`}>
                                                <span className="text-xl">{license.capacity}</span>
                                                <span className="text-[9px] opacity-80 uppercase">نفر</span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg flex items-center gap-2">
                                                    {license.title}
                                                    {isExpired && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">منقضی شده</span>}
                                                </h3>
                                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                                    <span className="flex items-center gap-1 bg-white dark:bg-gray-800 px-2 py-1 rounded border dark:border-gray-600">
                                                        <Clock size={12}/> {license.renewPeriod === 'DAILY' ? 'روزانه' : 'هفتگی'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={14}/> پایان: <span className={`font-mono font-bold ${isExpired ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>{toPersianDate(license.endDate)}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            {/* Auto Renew Toggle */}
                                            <button 
                                                onClick={() => toggleAutoRenew(license.id)}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition ${
                                                    license.autoRenew 
                                                    ? 'border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20' 
                                                    : 'border-gray-300 dark:border-gray-600 text-gray-400 bg-white dark:bg-gray-800'
                                                }`}
                                                title={license.autoRenew ? "تمدید اتوماتیک فعال است" : "تمدید اتوماتیک غیرفعال است"}
                                            >
                                                <RefreshCw size={14} className={license.autoRenew ? 'animate-spin-slow' : ''} />
                                                {license.autoRenew ? 'اتوماتیک' : 'دستی'}
                                            </button>

                                            <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-1"></div>

                                            <button 
                                                onClick={() => handleDeleteLicense(license.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" 
                                                title="حذف لایسنس"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Bottom Row: Manual Extend Button */}
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <div className="text-xs text-gray-500">
                                            هزینه تمدید دوره: <span className="font-bold text-gray-700 dark:text-gray-300">{license.costPerPeriod.toLocaleString()}</span> تومان
                                        </div>
                                        <button 
                                            onClick={() => handleManualExtend(license.id)}
                                            disabled={isProcessing}
                                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg shadow-lg shadow-blue-500/20 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />}
                                            تمدید فوری (+1 {license.renewPeriod === 'DAILY' ? 'روز' : 'هفته'})
                                        </button>
                                    </div>
                                </div>
                             );
                        })}
                        {activeLicenses.length === 0 && !isLoading && <div className="text-center text-gray-500 py-8">هیچ لایسنس فعالی وجود ندارد.</div>}
                    </div>
                </div>

                {/* Teachers Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-bold text-xl flex items-center gap-2"><Users className="text-purple-500"/> مدیریت معلمین</h2>
                        <Button onClick={() => setShowTeacherModal(true)}><Plus size={18} className="ml-2"/> تعریف معلم جدید</Button>
                    </div>
                    
                    <div className="overflow-hidden rounded-xl border dark:border-gray-700">
                        <table className="w-full text-right">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 text-xs">
                                <tr>
                                    <th className="p-4">نام و نام خانوادگی</th>
                                    <th className="p-4">ایمیل (شناسه)</th>
                                    <th className="p-4">درس تخصصی</th>
                                    <th className="p-4">عملیات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {teachers.map((teacher) => (
                                    <tr key={teacher.id}>
                                        <td className="p-4 font-bold">{teacher.name}</td>
                                        <td className="p-4 text-sm text-gray-500 font-mono">{teacher.email}</td>
                                        <td className="p-4 text-sm text-gray-500">{teacher.subject}</td>
                                        <td className="p-4 flex gap-2">
                                            <button className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit2 size={16}/></button>
                                            <button onClick={() => handleDeleteTeacher(teacher.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                                {teachers.length === 0 && (
                                    <tr className="text-sm text-gray-500">
                                        <td className="p-4 text-center" colSpan={4}>در حال حاضر دبیری تعریف نشده است.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create Teacher Modal */}
            {showTeacherModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl p-6">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Users size={20}/> تعریف معلم جدید</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">نام و نام خانوادگی</label>
                                <input 
                                    value={newTeacherName}
                                    onChange={(e) => setNewTeacherName(e.target.value)}
                                    className="w-full bg-gray-100 dark:bg-gray-700 rounded p-2 border border-transparent focus:border-blue-500 outline-none"
                                    placeholder="مثال: آقای رضایی"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">ایمیل (شناسه ورود)</label>
                                <div className="relative">
                                    <input 
                                        type="email"
                                        value={newTeacherEmail}
                                        onChange={(e) => setNewTeacherEmail(e.target.value)}
                                        className="w-full bg-gray-100 dark:bg-gray-700 rounded p-2 border border-transparent focus:border-blue-500 outline-none pl-8"
                                        placeholder="teacher@school.com"
                                        dir="ltr"
                                    />
                                    <Mail size={16} className="absolute left-2 top-2.5 text-gray-400" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">درس تخصصی</label>
                                <input 
                                    value={newTeacherSubject}
                                    onChange={(e) => setNewTeacherSubject(e.target.value)}
                                    className="w-full bg-gray-100 dark:bg-gray-700 rounded p-2 border border-transparent focus:border-blue-500 outline-none"
                                    placeholder="مثال: ریاضیات"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button variant="secondary" className="flex-1" onClick={() => setShowTeacherModal(false)}>انصراف</Button>
                                <Button className="flex-1" onClick={handleCreateTeacher} disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="animate-spin"/> : 'ذخیره'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
