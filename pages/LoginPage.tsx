
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Shield, Layout, User, School, LogIn } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans text-white">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-700">
        
        {/* Left Side: Illustration/Brand */}
        <div className="bg-blue-600 p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="z-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-6">
              <Layout size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">کلاس‌کانکت</h1>
            <p className="text-blue-100 opacity-90">پلتفرم جامع مدیریت آموزش آنلاین با قابلیت‌های پیشرفته مدیریتی و نظارتی.</p>
          </div>
          <div className="z-10 text-xs text-blue-200 mt-8">
            نسخه ۳.۲.۰ - اینترپرایز
          </div>
        </div>

        {/* Right Side: Login Options */}
        <div className="p-8 flex flex-col justify-center">
          <h2 className="text-2xl font-bold mb-6 text-center">ورود به پنل کاربری</h2>
          
          <div className="space-y-4">
            <button 
              onClick={() => navigate('/super-admin')}
              className="w-full p-4 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-xl flex items-center gap-4 transition group"
            >
              <div className="w-10 h-10 bg-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                <Shield size={20} />
              </div>
              <div className="text-right flex-1">
                <div className="font-bold">سوپر ادمین</div>
                <div className="text-xs text-gray-400">مدیریت کل سیستم و فضاها</div>
              </div>
              <LogIn size={18} className="text-gray-500" />
            </button>

            <button 
              onClick={() => navigate('/workspace-admin')}
              className="w-full p-4 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-xl flex items-center gap-4 transition group"
            >
              <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                <School size={20} />
              </div>
              <div className="text-right flex-1">
                <div className="font-bold">مدیر فضای کار (مدرسه)</div>
                <div className="text-xs text-gray-400">شارژ کیف پول، تعریف معلم</div>
              </div>
              <LogIn size={18} className="text-gray-500" />
            </button>

            <button 
              onClick={() => navigate('/teacher-hub')}
              className="w-full p-4 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-xl flex items-center gap-4 transition group"
            >
              <div className="w-10 h-10 bg-green-500/20 text-green-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                <User size={20} />
              </div>
              <div className="text-right flex-1">
                <div className="font-bold">معلم / مدرس</div>
                <div className="text-xs text-gray-400">برگزاری و مدیریت کلاس‌ها</div>
              </div>
              <LogIn size={18} className="text-gray-500" />
            </button>
          </div>

          <div className="mt-8 text-center text-xs text-gray-500">
            برای ورود دانش‌آموزان، از لینک اختصاصی کلاس استفاده کنید.
          </div>
        </div>
      </div>
    </div>
  );
};
