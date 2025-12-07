
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Workspace, SystemLog } from '../types';
import { Button } from '../components/Button';
import { 
  LayoutDashboard, Server, Users, DollarSign, Activity, 
  Settings, FileText, Search, MoreVertical, CheckCircle, XCircle, LogOut, Plus
} from 'lucide-react';

const MOCK_WORKSPACES: Workspace[] = [
    { id: 'w1', name: 'دبیرستان البرز', managerName: 'دکتر محمدی', walletBalance: 5000000, activePlan: 'MONTHLY', planExpiryDate: '1403/09/01', teacherCount: 25, studentCount: 450, status: 'ACTIVE' },
    { id: 'w2', name: 'آموزشگاه زبان سفیر', managerName: 'خانم رضایی', walletBalance: 120000, activePlan: 'HOURLY', teacherCount: 10, studentCount: 120, status: 'ACTIVE' },
    { id: 'w3', name: 'دانشگاه فنی تهران', managerName: 'مهندس کاظمی', walletBalance: 0, activePlan: 'NONE', teacherCount: 5, studentCount: 0, status: 'SUSPENDED' },
];

const MOCK_LOGS: SystemLog[] = [
    { id: 'l1', action: 'Create Workspace', admin: 'SuperAdmin', timestamp: '1403/07/20 10:00', details: 'Created workspace: دبیرستان البرز' },
    { id: 'l2', action: 'Payment Approval', admin: 'SuperAdmin', timestamp: '1403/07/20 11:30', details: 'Approved payment ID #9988 for w1' },
    { id: 'l3', action: 'System Config', admin: 'SuperAdmin', timestamp: '1403/07/21 09:15', details: 'Updated WebRTC TURN server config' },
];

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'workspaces' | 'logs' | 'settings'>('overview');
  const [workspaces, setWorkspaces] = useState(MOCK_WORKSPACES);

  const toggleStatus = (id: string) => {
      setWorkspaces(workspaces.map(w => w.id === id ? { ...w, status: w.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' } : w));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans flex text-gray-800 dark:text-gray-100">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-l dark:border-gray-700 flex flex-col shrink-0">
            <div className="h-16 flex items-center gap-2 px-6 border-b dark:border-gray-700">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white">
                    <Server size={18} />
                </div>
                <span className="font-bold text-lg">پنل سوپر ادمین</span>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                <NavButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<LayoutDashboard size={20} />} label="داشبورد وضعیت" />
                <NavButton active={activeTab === 'workspaces'} onClick={() => setActiveTab('workspaces')} icon={<Server size={20} />} label="فضاهای کار (Workspaces)" />
                <NavButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<FileText size={20} />} label="لاگ‌های سیستم" />
                <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={20} />} label="پیکربندی سرور" />
            </nav>

            <div className="p-4 border-t dark:border-gray-700">
                <button onClick={() => navigate('/')} className="w-full flex items-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition">
                    <LogOut size={20} /> خروج از سیستم
                </button>
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
            <header className="h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-8 flex items-center justify-between sticky top-0 z-10">
                <h2 className="text-xl font-bold">
                    {activeTab === 'overview' && 'نمای کلی سیستم'}
                    {activeTab === 'workspaces' && 'مدیریت فضاهای کار'}
                    {activeTab === 'logs' && 'لاگ‌های عملیاتی'}
                    {activeTab === 'settings' && 'تنظیمات پیکربندی'}
                </h2>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500">ادمین کل: <span className="font-bold text-gray-800 dark:text-white">آقای مدیر</span></div>
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                </div>
            </header>

            <div className="p-8">
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <StatCard icon={<Server className="text-blue-500"/>} title="کل فضاها" value={workspaces.length} sub="۲ فضای جدید در هفته اخیر" />
                            <StatCard icon={<Users className="text-green-500"/>} title="کاربران آنلاین" value="1,245" sub="پیک مصرف: ۱۲:۰۰ ظهر" />
                            <StatCard icon={<DollarSign className="text-yellow-500"/>} title="درآمد ماهانه" value="۱۵۴,۰۰۰,۰۰۰" sub="تومان" />
                            <StatCard icon={<Activity className="text-red-500"/>} title="بار سرور" value="34%" sub="وضعیت پایدار" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border dark:border-gray-700">
                                <h3 className="font-bold mb-4">مصرف پهنای باند (Live)</h3>
                                <div className="h-64 flex items-end justify-between gap-2">
                                    {[40, 65, 30, 80, 55, 90, 45, 60, 75, 50].map((h, i) => (
                                        <div key={i} className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t-lg relative group">
                                            <div style={{ height: `${h}%` }} className="absolute bottom-0 w-full bg-blue-500 rounded-t-lg transition-all group-hover:bg-blue-400"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border dark:border-gray-700">
                                <h3 className="font-bold mb-4">آخرین درخواست‌های مالی</h3>
                                <div className="space-y-4">
                                    {[1,2,3].map(i => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600"><DollarSign size={20}/></div>
                                                <div>
                                                    <div className="font-bold text-sm">شارژ کیف پول</div>
                                                    <div className="text-xs text-gray-500">مدرسه شهید بهشتی</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">۵,۰۰۰,۰۰۰ تومان</span>
                                                <Button size="sm" className="text-xs">تایید</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'workspaces' && (
                    <div className="animate-in fade-in space-y-4">
                        <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700">
                            <div className="relative w-64">
                                <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
                                <input className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-lg py-2 pr-10 pl-4 text-sm focus:ring-2 ring-blue-500" placeholder="جستجو نام مدرسه..." />
                            </div>
                            <Button><Plus size={18} className="ml-2"/> ایجاد فضای کار جدید</Button>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
                            <table className="w-full text-right">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 text-xs uppercase">
                                    <tr>
                                        <th className="p-4">نام فضای کار</th>
                                        <th className="p-4">مدیر</th>
                                        <th className="p-4">کیف پول</th>
                                        <th className="p-4">طرح فعال</th>
                                        <th className="p-4">کاربران</th>
                                        <th className="p-4">وضعیت</th>
                                        <th className="p-4">عملیات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {workspaces.map(ws => (
                                        <tr key={ws.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                                            <td className="p-4 font-bold">{ws.name}</td>
                                            <td className="p-4 text-sm text-gray-500">{ws.managerName}</td>
                                            <td className="p-4 font-mono text-sm">{ws.walletBalance.toLocaleString()} <span className="text-[10px] text-gray-400">T</span></td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${ws.activePlan === 'NONE' ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'}`}>
                                                    {ws.activePlan === 'HOURLY' ? 'ساعتی' : ws.activePlan === 'MONTHLY' ? 'ماهانه' : ws.activePlan === 'YEARLY' ? 'سالانه' : 'بدون طرح'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm">{ws.teacherCount + ws.studentCount} نفر</td>
                                            <td className="p-4">
                                                <span className={`flex items-center gap-1 text-xs ${ws.status === 'ACTIVE' ? 'text-green-500' : 'text-red-500'}`}>
                                                    {ws.status === 'ACTIVE' ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                                                    {ws.status === 'ACTIVE' ? 'فعال' : 'معلق'}
                                                </span>
                                            </td>
                                            <td className="p-4 flex gap-2">
                                                <button onClick={() => toggleStatus(ws.id)} className="text-gray-400 hover:text-blue-500"><Settings size={18}/></button>
                                                <button className="text-gray-400 hover:text-red-500"><XCircle size={18}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden animate-in fade-in">
                         <div className="p-4 border-b dark:border-gray-700 font-bold">آخرین فعالیت‌های سیستمی</div>
                         <div className="divide-y divide-gray-100 dark:divide-gray-700">
                             {MOCK_LOGS.map(log => (
                                 <div key={log.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                     <div className="flex items-center gap-4">
                                         <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                         <div>
                                             <div className="font-bold text-sm">{log.action}</div>
                                             <div className="text-xs text-gray-500">{log.details}</div>
                                         </div>
                                     </div>
                                     <div className="text-right">
                                         <div className="text-xs font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">{log.timestamp}</div>
                                         <div className="text-[10px] text-gray-400 mt-1">{log.admin}</div>
                                     </div>
                                 </div>
                             ))}
                         </div>
                    </div>
                )}
            </div>
        </main>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: any) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
    >
        {icon}
        <span className="font-medium text-sm">{label}</span>
    </button>
);

const StatCard = ({ icon, title, value, sub }: any) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border dark:border-gray-700 shadow-sm">
        <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-center">{icon}</div>
            <MoreVertical size={20} className="text-gray-400" />
        </div>
        <div className="text-3xl font-bold mb-1">{value}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{title}</div>
        <div className="text-[10px] text-green-500 mt-2 bg-green-50 dark:bg-green-900/20 inline-block px-2 py-0.5 rounded-full">{sub}</div>
    </div>
);