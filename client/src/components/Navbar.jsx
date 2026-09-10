import { useState } from 'react';

export default function Navbar() {
  // متغير منطقي لتتبع حالة القائمة
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-slate-900 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* 1. قسم الشعار */}
          <div className="flex-shrink-0">
            <span className="text-amber-500 font-extrabold text-2xl tracking-wide">وجيز الآمال</span>
          </div>

          {/* 2. روابط شاشات الكمبيوتر (مخفية في الجوال عبر hidden، تظهر كـ block من مقاس md فما فوق) */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4 space-x-reverse">
              <a href="#" className="text-slate-100 hover:text-amber-500 px-3 py-2 rounded-md font-semibold transition-colors">الرئيسية</a>
              <a href="#" className="text-slate-300 hover:text-amber-500 px-3 py-2 rounded-md font-semibold transition-colors">خدماتنا</a>
              <a href="#" className="text-slate-300 hover:text-amber-500 px-3 py-2 rounded-md font-semibold transition-colors">مشاريعنا</a>
              <a href="#" className="text-slate-300 hover:text-amber-500 px-3 py-2 rounded-md font-semibold transition-colors">اتصل بنا</a>
            </div>
          </div>

          {/* 3. زر القائمة الخاص بالجوال (يختفي في شاشات الكمبيوتر) */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="text-slate-300 hover:text-amber-500 focus:outline-none p-2"
            >
              {/* تغيير شكل الأيقونة برمجياً (IF condition) بناءً على حالة المتغير */}
              {isOpen ? (
                // أيقونة الإغلاق (X)
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // أيقونة الخطوط الثلاثة
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 4. القائمة المنسدلة للجوال (تُعالج برمجياً لتظهر فقط إذا كان isOpen = true) */}
      {isOpen && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 text-center">
            <a href="#" className="block text-slate-100 hover:bg-slate-700 hover:text-amber-500 px-3 py-2 rounded-md font-semibold">الرئيسية</a>
            <a href="#" className="block text-slate-300 hover:bg-slate-700 hover:text-amber-500 px-3 py-2 rounded-md font-semibold">خدماتنا</a>
            <a href="#" className="block text-slate-300 hover:bg-slate-700 hover:text-amber-500 px-3 py-2 rounded-md font-semibold">مشاريعنا</a>
            <a href="#" className="block text-slate-300 hover:bg-slate-700 hover:text-amber-500 px-3 py-2 rounded-md font-semibold">اتصل بنا</a>
          </div>
        </div>
      )}
    </nav>
  );
}

