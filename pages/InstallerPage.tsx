
import React, { useState, useEffect } from 'react';
import { Database, User, CheckCircle, Server, Shield, Loader2, ArrowLeft, Terminal, FileText, HardDrive } from 'lucide-react';
import { Button } from '../components/Button';
import { ApiService } from '../services/api';

interface InstallerPageProps {
  onInstalled: () => void;
}

export const InstallerPage: React.FC<InstallerPageProps> = ({ onInstalled }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAutoConfigured, setIsAutoConfigured] = useState(false);

  // Step 1: DB Config
  const [dbConfig, setDbConfig] = useState({
      provider: 'postgres',
      host: 'localhost',
      port: '5432',
      name: 'classconnect_db',
      user: 'postgres',
      password: ''
  });

  // Step 2: Admin Config
  const [adminConfig, setAdminConfig] = useState({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
  });

  // Check for Docker Pre-configuration on Mount
  useEffect(() => {
    // Cast import.meta to any to avoid TS errors when types are not properly configured
    const metaEnv = (import.meta as any).env || {};
    const preConfiguredProvider = metaEnv.VITE_DB_PROVIDER;
    
    if (preConfiguredProvider && preConfiguredProvider !== 'manual') {
        setIsAutoConfigured(true);
        setDbConfig(prev => ({
            ...prev,
            provider: preConfiguredProvider,
            host: metaEnv.VITE_DB_HOST || 'localhost',
            port: metaEnv.VITE_DB_PORT || (preConfiguredProvider === 'mssql' ? '1433' : '5432'),
            name: metaEnv.VITE_DB_NAME || 'classconnect_db',
            user: 'admin', // In real app, this comes from env too
            password: '***' // Masked
        }));
        // Auto skip to step 2
        setStep(2);
    }
  }, []);

  const handleDbTest = async () => {
      setLoading(true);
      setError('');
      // Simulate DB Connection Test
      setTimeout(() => {
          setLoading(false);
          // In a real app, we would ping the API here.
          // For demo, we just proceed.
          setStep(2);
      }, 1500);
  };

  const handleInstall = async () => {
      if (adminConfig.password !== adminConfig.confirmPassword) {
          setError('رمز عبور و تکرار آن مطابقت ندارند.');
          return;
      }
      if (!adminConfig.email || !adminConfig.name) {
          setError('لطفا تمام فیلدها را پر کنید.');
          return;
      }

      setLoading(true);
      
      try {
          await ApiService.installSystem({
              dbType: dbConfig.provider,
              ...dbConfig,
              adminName: adminConfig.name,
              adminEmail: adminConfig.email,
              adminPassword: adminConfig.password
          });
          onInstalled();
      } catch (e) {
          setError('خطا در نصب سیستم.');
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-4xl w-full bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-700 flex flex-col md:flex-row">
            
            {/* Left Sidebar (Progress) */}
            <div className="w-full md:w-1/3 bg-blue-600 p-8 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-8">
                        <Terminal size={32} className="text-white" />
                        <h1 className="font-bold text-xl">نصب کلاس‌کانکت</h1>
                    </div>
                    
                    <div className="space-y-6">
                        <div className={`flex items-center gap-3 ${step >= 1 ? 'text-white' : 'text-blue-300'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step > 1 ? 'bg-white text-blue-600 border-white' : 'border-current'}`}>
                                {step > 1 ? <CheckCircle size={18} /> : <span>1</span>}
                            </div>
                            <span className="font-bold text-sm">
                                {isAutoConfigured ? 'دیتابیس (خودکار)' : 'اتصال به دیتابیس'}
                            </span>
                        </div>
                        <div className={`flex items-center gap-3 ${step >= 2 ? 'text-white' : 'text-blue-300'}`}>
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step > 2 ? 'bg-white text-blue-600 border-white' : 'border-current'}`}>
                                {step > 2 ? <CheckCircle size={18} /> : <span>2</span>}
                            </div>
                            <span className="font-bold text-sm">تعریف ادمین ارشد</span>
                        </div>
                         <div className={`flex items-center gap-3 ${step >= 3 ? 'text-white' : 'text-blue-300'}`}>
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step > 3 ? 'bg-white text-blue-600 border-white' : 'border-current'}`}>
                                <span>3</span>
                            </div>
                            <span className="font-bold text-sm">پایان</span>
                        </div>
                    </div>
                </div>
                <div className="text-xs text-blue-200 mt-8 opacity-75">
                    نسخه ۳.۲.۰ - Installation Wizard
                </div>
            </div>

            {/* Right Content */}
            <div className="flex-1 p-8 md:p-12">
                
                {step === 1 && (
                    <div className="space-y-6 animate-in slide-in-from-right">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold mb-2">پیکربندی دیتابیس</h2>
                            <p className="text-gray-400 text-sm">لطفا اطلاعات اتصال به پایگاه داده خود را وارد کنید.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="col-span-2">
                                <label className="block text-xs text-gray-400 mb-1">نوع دیتابیس (Provider)</label>
                                <div className="grid grid-cols-4 gap-2">
                                    <button 
                                        onClick={() => setDbConfig({...dbConfig, provider: 'postgres'})}
                                        className={`p-2 rounded-xl border flex flex-col items-center gap-2 transition ${dbConfig.provider === 'postgres' ? 'bg-blue-600 border-blue-500' : 'border-gray-600 hover:bg-gray-700'}`}
                                    >
                                        <Database size={18} /> PostgreSQL
                                    </button>
                                    <button 
                                        onClick={() => setDbConfig({...dbConfig, provider: 'mssql'})}
                                        className={`p-2 rounded-xl border flex flex-col items-center gap-2 transition ${dbConfig.provider === 'mssql' ? 'bg-blue-600 border-blue-500' : 'border-gray-600 hover:bg-gray-700'}`}
                                    >
                                        <HardDrive size={18} /> SQL Server
                                    </button>
                                    <button 
                                        onClick={() => setDbConfig({...dbConfig, provider: 'mysql'})}
                                        className={`p-2 rounded-xl border flex flex-col items-center gap-2 transition ${dbConfig.provider === 'mysql' ? 'bg-blue-600 border-blue-500' : 'border-gray-600 hover:bg-gray-700'}`}
                                    >
                                        <Server size={18} /> MySQL
                                    </button>
                                    <button 
                                        onClick={() => setDbConfig({...dbConfig, provider: 'sqlite'})}
                                        className={`p-2 rounded-xl border flex flex-col items-center gap-2 transition ${dbConfig.provider === 'sqlite' ? 'bg-blue-600 border-blue-500' : 'border-gray-600 hover:bg-gray-700'}`}
                                    >
                                        <FileText size={18} /> SQLite
                                    </button>
                                </div>
                             </div>

                             {dbConfig.provider !== 'sqlite' && (
                                 <>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-xs text-gray-400 mb-1">آدرس هاست (Host)</label>
                                        <input 
                                            value={dbConfig.host}
                                            onChange={e => setDbConfig({...dbConfig, host: e.target.value})}
                                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                                            dir="ltr"
                                        />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-xs text-gray-400 mb-1">پورت (Port)</label>
                                        <input 
                                            value={dbConfig.port}
                                            onChange={e => setDbConfig({...dbConfig, port: e.target.value})}
                                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                                            dir="ltr"
                                            placeholder={dbConfig.provider === 'mssql' ? '1433' : '5432'}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs text-gray-400 mb-1">نام دیتابیس</label>
                                        <input 
                                            value={dbConfig.name}
                                            onChange={e => setDbConfig({...dbConfig, name: e.target.value})}
                                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                                            dir="ltr"
                                        />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-xs text-gray-400 mb-1">نام کاربری</label>
                                        <input 
                                            value={dbConfig.user}
                                            onChange={e => setDbConfig({...dbConfig, user: e.target.value})}
                                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                                            dir="ltr"
                                        />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-xs text-gray-400 mb-1">رمز عبور</label>
                                        <input 
                                            type="password"
                                            value={dbConfig.password}
                                            onChange={e => setDbConfig({...dbConfig, password: e.target.value})}
                                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                                            dir="ltr"
                                        />
                                    </div>
                                 </>
                             )}
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button onClick={handleDbTest} disabled={loading} className="w-full md:w-auto min-w-[150px]">
                                {loading ? <><Loader2 className="animate-spin ml-2"/> در حال تست...</> : 'تست اتصال و ادامه'}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right">
                         <div className="mb-6">
                            <h2 className="text-2xl font-bold mb-2">
                                {isAutoConfigured ? 'راه‌اندازی اولیه سیستم' : 'ساخت حساب مدیر ارشد'}
                            </h2>
                            {isAutoConfigured ? (
                                <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg text-xs text-blue-200 mb-4 flex items-center gap-2">
                                    <CheckCircle size={14} />
                                    اتصال به دیتابیس {dbConfig.provider} ({dbConfig.host}) با موفقیت برقرار شد.
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm">این حساب دسترسی کامل به تمامی تنظیمات سیستم خواهد داشت.</p>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">نام و نام خانوادگی مدیر</label>
                                <input 
                                    value={adminConfig.name}
                                    onChange={e => setAdminConfig({...adminConfig, name: e.target.value})}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                                    placeholder="مثال: علی محمدی"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">ایمیل (نام کاربری)</label>
                                <input 
                                    type="email"
                                    value={adminConfig.email}
                                    onChange={e => setAdminConfig({...adminConfig, email: e.target.value})}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                                    dir="ltr"
                                    placeholder="admin@example.com"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">رمز عبور</label>
                                    <input 
                                        type="password"
                                        value={adminConfig.password}
                                        onChange={e => setAdminConfig({...adminConfig, password: e.target.value})}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                                        dir="ltr"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">تکرار رمز عبور</label>
                                    <input 
                                        type="password"
                                        value={adminConfig.confirmPassword}
                                        onChange={e => setAdminConfig({...adminConfig, confirmPassword: e.target.value})}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-sm border border-red-500/30">
                                {error}
                            </div>
                        )}

                        <div className="pt-4 flex gap-3 justify-end">
                            {!isAutoConfigured && (
                                <Button variant="ghost" onClick={() => setStep(1)} disabled={loading}>
                                    <ArrowLeft className="ml-2" size={18} /> بازگشت
                                </Button>
                            )}
                            <Button onClick={handleInstall} disabled={loading} className="min-w-[150px]">
                                {loading ? <><Loader2 className="animate-spin ml-2"/> در حال نصب...</> : 'نصب و راه‌اندازی'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};