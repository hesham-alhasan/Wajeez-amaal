import React, { useState } from 'react';
import { Lock, LogOut, X } from 'lucide-react';

// هنا الملف يستقبل متغيرات المشرف من App.jsx
export default function Navbar({ token, username, handleLogout, setShowLogin }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b border-slate-800/80 bg-[#0b0f17]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        
        {/* الشعار */}
        <div className="flex items-center gap-3 md:gap-4">
          <img src="/logo.png" alt="شعار الشركة" className="h-16 md:h-24 w-auto object-contain drop-shadow-md" />
          <span className="text-xl md:text-3xl font-black tracking-wide text-yellow-500">
            وجيز الآمال
          </span>
        </div>
        
        {/* روابط شاشات الكمبيوتر */}
        <div className="hidden md:flex items-center gap-8 font-semibold text-sm">
          <a href="#about" className="hover:text-yellow-500 transition">قصتنا</a>
          <a href="#services" className="hover:text-yellow-500 transition">خدماتنا</a>
          <a href="#projects" className="hover:text-yellow-500 transition">مشاريعنا</a>
          <a href="#quote" className="hover:text-yellow-500 transition">طلب استشارة</a>
          
          {/* أزرار المشرف للكمبيوتر */}
          {token ? (
            <div className="flex items-center gap-3 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-xs text-yellow-500">مرحباً، {username}</span>
              <button onClick={handleLogout} className="text-rose-400 hover:text-rose-300 p-1" title="تسجيل الخروج">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowLogin(true)} className="flex items-center gap-1.5 text-slate-400 hover:text-yellow-500 transition text-xs">
              <Lock className="w-3.5 h-3.5" />
              <span>دخول المشرفين</span>
            </button>
          )}
        </div>

        {/* زر قائمة الجوال */}
        <div className="md:hidden flex items-center">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="text-slate-300 hover:text-yellow-500 focus:outline-none p-2"
          >
            {isMobileMenuOpen ? (
              <X className="w-7 h-7" />
            ) : (
              <div className="space-y-1.5">
                <span className="block w-6 h-0.5 bg-current"></span>
                <span className="block w-6 h-0.5 bg-current"></span>
                <span className="block w-6 h-0.5 bg-current"></span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* القائمة المنسدلة لشاشات الجوال */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0f1523] border-t border-slate-800">
          <div className="px-4 pt-4 pb-6 space-y-5 text-center flex flex-col shadow-inner">
            <a onClick={() => setIsMobileMenuOpen(false)} href="#about" className="text-slate-200 hover:text-yellow-500 font-semibold text-lg">قصتنا</a>
            <a onClick={() => setIsMobileMenuOpen(false)} href="#services" className="text-slate-200 hover:text-yellow-500 font-semibold text-lg">خدماتنا</a>
            <a onClick={() => setIsMobileMenuOpen(false)} href="#projects" className="text-slate-200 hover:text-yellow-500 font-semibold text-lg">مشاريعنا</a>
            <a onClick={() => setIsMobileMenuOpen(false)} href="#quote" className="text-slate-200 hover:text-yellow-500 font-semibold text-lg">طلب استشارة</a>
            
            {/* أزرار المشرف للجوال */}
            <div className="pt-4 border-t border-slate-800 flex justify-center">
              {token ? (
                <div className="flex items-center gap-4 bg-slate-900 px-4 py-2.5 rounded-lg border border-slate-700">
                  <span className="text-sm text-yellow-500">مرحباً، {username}</span>
                  <button onClick={() => {handleLogout(); setIsMobileMenuOpen(false);}} className="text-rose-400 hover:text-rose-300 p-1">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button onClick={() => {setShowLogin(true); setIsMobileMenuOpen(false);}} className="flex items-center gap-2 text-slate-400 hover:text-yellow-500 transition text-sm">
                  <Lock className="w-4 h-4" />
                  <span>دخول المشرفين</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
