import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import axios from 'axios';
import { 
  Building2, HardHat, Hammer, Phone, Mail, 
  Lock, LogOut, Plus, Upload, Send, X, ArrowLeft, ArrowDownLeft, Check, Trash2, Images,
  ChevronLeft, ChevronRight, Maximize2
} from 'lucide-react';

const API_BASE = 'https://wajeez-amaal.onrender.com/api';
const HERO_BG = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80";

export default function App() {
  const [albums, setAlbums] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [username, setUsername] = useState(localStorage.getItem('adminUser') || '');
  
  // Modals & States
  const [showLogin, setShowLogin] = useState(false);
  const [loginCreds, setLoginCreds] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  
  const [showNewAlbum, setShowNewAlbum] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  
  const [selectedAlbumForUpload, setSelectedAlbumForUpload] = useState(null);
  const [uploadFiles, setUploadFiles] = useState([]);

  // Active Album Filter
  const [activeAlbumId, setActiveAlbumId] = useState('ALL');

  // Lightbox / Photo Studio State
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    images: [],
    currentIndex: 0,
    albumTitle: ''
  });

  // Quote Form State
  const [quoteForm, setQuoteForm] = useState({ client_name: '', phone: '', notes: '' });
  const [quoteFile, setQuoteFile] = useState(null);
  const [quoteStatus, setQuoteStatus] = useState('');

  useEffect(() => {
    fetchAlbums();
  }, []);

  // Keyboard navigation for Lightbox (Right/Left arrows & Esc)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightbox.isOpen) return;
      if (e.key === 'ArrowRight') prevImage();
      if (e.key === 'ArrowLeft') nextImage();
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox]);

  const fetchAlbums = async () => {
    try {
      const res = await axios.get(`${API_BASE}/albums`);
      setAlbums(res.data);
    } catch (err) {
      console.error('خطأ في جلب الألبومات:', err);
    }
  };

  // Lightbox Handlers
  const openLightbox = (images, index, albumTitle) => {
    setLightbox({
      isOpen: true,
      images,
      currentIndex: index,
      albumTitle
    });
  };

  const closeLightbox = () => {
    setLightbox(prev => ({ ...prev, isOpen: false }));
  };

  const nextImage = (e) => {
    e?.stopPropagation();
    setLightbox(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.images.length
    }));
  };

  const prevImage = (e) => {
    e?.stopPropagation();
    setLightbox(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await axios.post(`${API_BASE}/admin/login`, loginCreds);
      setToken(res.data.token);
      setUsername(res.data.username);
      localStorage.setItem('adminToken', res.data.token);
      localStorage.setItem('adminUser', res.data.username);
      setShowLogin(false);
      setLoginCreds({ username: '', password: '' });
    } catch (err) {
      setLoginError(err.response?.data?.error || 'حدث خطأ أثناء تسجيل الدخول');
    }
  };

  const handleLogout = () => {
    setToken('');
    setUsername('');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!newAlbumTitle) return;
    try {
      await axios.post(
        `${API_BASE}/albums`, 
        { title: newAlbumTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewAlbumTitle('');
      setShowNewAlbum(false);
      fetchAlbums();
    } catch (err) {
      alert(err.response?.data?.error || 'خطأ في إنشاء الألبوم');
    }
  };

  const handleDeleteAlbum = async (e, albumId) => {
    e.stopPropagation();
    if (!window.confirm('هل أنت تأكد من حذف هذا الألبوم بالكامل مع جميع صوره؟')) return;
    try {
      await axios.delete(`${API_BASE}/albums/${albumId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlbums(prev => prev.filter(a => a.album_id !== albumId));
      if (activeAlbumId === albumId) setActiveAlbumId('ALL');
    } catch (err) {
      alert(err.response?.data?.error || 'خطأ في حذف الألبوم');
    }
  };

  const handleUploadImages = async (e) => {
    e.preventDefault();
    if (!selectedAlbumForUpload || uploadFiles.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < uploadFiles.length; i++) {
      formData.append('images', uploadFiles[i]);
    }

    try {
      await axios.post(`${API_BASE}/albums/${selectedAlbumForUpload}/images`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setSelectedAlbumForUpload(null);
      setUploadFiles([]);
      fetchAlbums();
    } catch (err) {
      alert(err.response?.data?.error || 'خطأ في رفع الصور');
    }
  };

  const handleDeleteImage = async (e, imageId) => {
    e.stopPropagation();
    if (!window.confirm('هل أنت تأكد من حذف هذه الصورة؟')) return;
    try {
      await axios.delete(`${API_BASE}/images/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAlbums(prevAlbums => 
        prevAlbums.map(album => ({
          ...album,
          images: album.images.filter(img => img.id !== imageId)
        }))
      );
    } catch (err) {
      alert(err.response?.data?.error || 'حدث خطأ أثناء حذف الصورة من السيرفر');
    }
  };

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    setQuoteStatus('جاري الإرسال...');
    const formData = new FormData();
    formData.append('client_name', quoteForm.client_name);
    formData.append('phone', quoteForm.phone);
    formData.append('notes', quoteForm.notes);
    if (quoteFile) formData.append('blueprint', quoteFile);

    try {
      const res = await axios.post(`${API_BASE}/quote-requests`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setQuoteStatus(res.data.message);
      setQuoteForm({ client_name: '', phone: '', notes: '' });
      setQuoteFile(null);
    } catch (err) {
      setQuoteStatus('حدث خطأ أثناء إرسال الطلب');
    }
  };

  const displayedAlbums = activeAlbumId === 'ALL' 
    ? albums 
    : albums.filter(a => a.album_id === activeAlbumId);

  return (
    <div dir="rtl" className="min-h-screen bg-[#0b0f17] text-slate-100 font-sans scroll-smooth">
      
      {/* Navbar */}
      {/* Navbar Component */}
      <Navbar 
        token={token} 
        username={username} 
        handleLogout={handleLogout} 
        setShowLogin={setShowLogin} 
      />
          

      {/* Hero Section */}
      <header className="relative min-h-[90vh] flex items-center justify-center overflow-hidden border-b border-slate-800">
        <div 
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0f17] via-[#0b0f17]/85 to-[#0b0f17]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f17] via-transparent to-[#0b0f17]/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-5 order-2 md:order-1">
            <div className="bg-[#0f1523]/80 border border-yellow-500/40 backdrop-blur-md rounded-xl p-8 max-w-sm shadow-2xl relative overflow-hidden group hover:border-yellow-500 transition">
              <div className="flex justify-between items-center text-xs text-yellow-500/80 tracking-widest font-mono mb-8">
                <span>W.A / 2026</span>
                <div className="w-6 h-6 border border-yellow-500/40 rounded-full flex items-center justify-center text-[10px]">
                  ⌖
                </div>
              </div>

              <div className="text-center my-6">
                <span className="text-7xl font-extrabold text-yellow-500 tracking-tight block">
                  ١٠
                </span>
                <p className="text-lg font-bold text-slate-200 mt-2">
                  أعوام من البناء المتقن
                </p>
              </div>

              <div className="border-t border-slate-700/60 pt-4 mt-6">
                <p className="text-xs text-slate-400 leading-relaxed text-center">
                  يقاس نجاحنا بما يبقى بعد أن ننصرف.
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-7 order-1 md:order-2 space-y-8 text-right">
            <div className="flex items-center gap-3">
              <span className="w-8 h-[2px] bg-yellow-500 inline-block"></span>
              <span className="text-yellow-500 font-bold text-sm tracking-wider">
                نبني ما يعتمد عليه
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.15] tracking-tight">
              بيتك القادم <br />
              <span className="text-yellow-500">يبدأ من هنا.</span>
            </h1>

            <p className="text-slate-300 text-base md:text-lg max-w-xl leading-relaxed font-light">
              <strong className="font-semibold text-white">وجيز الآمال للمقاولات.</strong> شريكك المحلي في بناء المساحات التي تصمد أمام الوقت، وتمنح كل يوم معنى أجمل.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-6">
              <a 
                href="#quote" 
                className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black px-8 py-4 rounded-none flex items-center gap-3 transition shadow-lg shadow-yellow-500/10 text-base"
              >
                <span>تحدث مع مهندسنا</span>
                <div className="bg-slate-950 text-yellow-500 p-1.5 rounded-full">
                  <ArrowLeft className="w-4 h-4" />
                </div>
              </a>

              <a 
                href="#projects" 
                className="text-slate-200 hover:text-yellow-500 font-bold text-base flex items-center gap-2 transition group"
              >
                <span>شاهد أعمالنا</span>
                <ArrowDownLeft className="w-5 h-5 text-yellow-500 group-hover:translate-x-[-2px] group-hover:translate-y-[2px] transition" />
              </a>
            </div>

            <div className="pt-8 flex flex-wrap items-center gap-8 border-t border-slate-800/80 text-xs font-semibold text-slate-400">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-yellow-500" />
                <span>ضمان مكتوب على الأعمال</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-yellow-500" />
                <span>مهندس مشروع مخصص</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Services Section */}
      <section id="services" className="py-24 px-6 max-w-7xl mx-auto w-full">
        <h2 className="text-3xl font-black text-center mb-16 text-slate-100">خدماتنا الرئيسية</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-[#0f1523] border border-slate-800 p-8 hover:border-yellow-500/50 transition rounded-xl">
            <Building2 className="w-10 h-10 text-yellow-500 mb-6" />
            <h3 className="text-xl font-bold mb-3 text-white">المقاولات العامة والبناء</h3>
            <p className="text-slate-400 text-sm leading-relaxed">تنفيذ المجمعات والمنشآت السكنية والتجارية من الأساسات حتى التسليم العظم بأعلى معايير الأمان.</p>
          </div>
          <div className="bg-[#0f1523] border border-slate-800 p-8 hover:border-yellow-500/50 transition rounded-xl">
            <HardHat className="w-10 h-10 text-yellow-500 mb-6" />
            <h3 className="text-xl font-bold mb-3 text-white">التشطيبات والديكورات</h3>
            <p className="text-slate-400 text-sm leading-relaxed">تنفيذ كافة أعمال التشطيبات الداخلية والخارجية والواجهات بأحدث المواد والأنماط المعمارية.</p>
          </div>
          <div className="bg-[#0f1523] border border-slate-800 p-8 hover:border-yellow-500/50 transition rounded-xl">
            <Hammer className="w-10 h-10 text-yellow-500 mb-6" />
            <h3 className="text-xl font-bold mb-3 text-white">الترميم والصيانة المتكاملة</h3>
            <p className="text-slate-400 text-sm leading-relaxed">تجديد الهياكل والمباني القائمة، إعادة التأهيل المعماري، ومعالجة المشاكل الإنطباعية.</p>
          </div>
        </div>
      </section>

      {/* Projects Showcase */}
      <section id="projects" className="py-24 px-6 bg-[#0f1523]/40 border-y border-slate-800/80 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-100">معرض المشاريع والألبومات</h2>
              <p className="text-slate-400 text-sm mt-2">اضغط على أي صورة لاستعراض الألبوم كاملاً كمستعرض الصور في الهاتف</p>
            </div>
            
            {token && (
              <button 
                onClick={() => setShowNewAlbum(true)}
                className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold px-5 py-2.5 flex items-center gap-2 transition text-sm shrink-0 rounded-lg shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء ألبوم جديد</span>
              </button>
            )}
          </div>

          {/* Album Selection Tabs */}
          {albums.length > 0 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-8 border-b border-slate-800">
              <button
                onClick={() => setActiveAlbumId('ALL')}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                  activeAlbumId === 'ALL'
                    ? 'bg-yellow-500 text-slate-950 shadow-md'
                    : 'bg-[#0f1523] text-slate-300 border border-slate-800 hover:border-yellow-500/50'
                }`}
              >
                <Images className="w-4 h-4" />
                <span>جميع الألبومات ({albums.length})</span>
              </button>

              {albums.map((album) => (
                <button
                  key={album.album_id}
                  onClick={() => setActiveAlbumId(album.album_id)}
                  className={`px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeAlbumId === album.album_id
                      ? 'bg-yellow-500 text-slate-950 shadow-md'
                      : 'bg-[#0f1523] text-slate-300 border border-slate-800 hover:border-yellow-500/50'
                  }`}
                >
                  <span>{album.title}</span>
                  <span className="bg-slate-950/40 px-2 py-0.5 rounded text-[10px]">
                    {album.images.length}
                  </span>
                </button>
              ))}
            </div>
          )}

          {displayedAlbums.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl">
              <p className="text-slate-500 text-sm">لا توجد ألبومات مشاريع حالياً.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {displayedAlbums.map((album) => (
                <div key={album.album_id} className="bg-[#0f1523] border border-slate-800 p-6 rounded-2xl shadow-xl">
                  
                  {/* Header of Album */}
                  <div className="flex justify-between items-center mb-6 border-b border-slate-800/80 pb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold text-yellow-500">{album.title}</h3>
                      <span className="text-xs bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded-full">
                        {album.images.length} صورة
                      </span>
                    </div>

                    {token && (
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setSelectedAlbumForUpload(album.album_id)}
                          className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-2 flex items-center gap-2 transition rounded-lg"
                        >
                          <Upload className="w-3.5 h-3.5 text-yellow-500" />
                          <span>إضافة صور</span>
                        </button>
                        <button 
                          onClick={(e) => handleDeleteAlbum(e, album.album_id)}
                          className="text-xs bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/60 px-3 py-2 flex items-center gap-1.5 transition rounded-lg"
                          title="حذف الألبوم"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف الألبوم</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Album Grid (Smartphone Gallery Style) */}
                  {album.images.length === 0 ? (
                    <p className="text-slate-500 text-xs py-6 text-center">لا توجد صور مضافة في هذا الألبوم بعد.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {album.images.map((img, idx) => (
                        <div 
                          key={img.id} 
                          onClick={() => openLightbox(album.images, idx, album.title)}
                          className="group relative aspect-[4/3] overflow-hidden bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-yellow-500/80 hover:shadow-lg hover:shadow-yellow-500/10 transition-all duration-300"
                        >
                          <img 
                            src={`https://wajeez-amaal.onrender.com${img.image_url}`} 
                            alt={album.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-500 ease-out"
                          />
                          
                          {/* Hover Zoom Overlay */}
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-300">
                            <div className="bg-yellow-500 text-slate-950 p-3 rounded-full transform translate-y-3 group-hover:translate-y-0 transition duration-300 shadow-xl">
                              <Maximize2 className="w-5 h-5" />
                            </div>
                          </div>

                          {/* Delete icon for Admin */}
                          {token && (
                            <button
                              onClick={(e) => handleDeleteImage(e, img.id)}
                              className="absolute top-2 left-2 bg-rose-600/90 hover:bg-rose-600 text-white p-2 rounded-lg shadow-md transition duration-200 z-20"
                              title="حذف الصورة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox / Phone Gallery Fullscreen Viewer */}
      {lightbox.isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-lg z-50 flex flex-col justify-between p-4 md:p-6 select-none animate-fadeIn"
          onClick={closeLightbox}
        >
          {/* Top Bar */}
          <div className="flex justify-between items-center text-slate-200 z-10 w-full max-w-6xl mx-auto" onClick={e => e.stopPropagation()}>
            <div>
              <h4 className="font-bold text-yellow-500 text-base md:text-lg">{lightbox.albumTitle}</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                صورة {lightbox.currentIndex + 1} من {lightbox.images.length}
              </p>
            </div>
            <button 
              onClick={closeLightbox}
              className="bg-slate-800/80 hover:bg-slate-700 text-white p-2.5 rounded-full transition border border-slate-700"
              title="إغلاق (Esc)"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Content Area (Image + Left/Right Navigation) */}
          <div className="relative flex-1 flex items-center justify-center my-4 max-w-6xl w-full mx-auto" onClick={e => e.stopPropagation()}>
            
            {/* Previous Image Button */}
            {lightbox.images.length > 1 && (
              <button 
                onClick={prevImage}
                className="absolute right-2 md:right-4 z-20 bg-slate-900/80 hover:bg-yellow-500 hover:text-slate-950 text-white p-3 md:p-4 rounded-full border border-slate-700/80 transition duration-200 shadow-2xl"
                title="الصورة السابقة"
              >
                <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            )}

            {/* Displayed Image */}
            <div className="relative max-h-[75vh] max-w-full flex items-center justify-center overflow-hidden rounded-2xl border border-slate-800 shadow-2xl bg-black/40">
              <img 
                src={`https://wajeez-amaal.onrender.com${lightbox.images[lightbox.currentIndex]?.image_url}`} 
                alt="معاينة المكبّرة" 
                className="max-h-[75vh] max-w-full object-contain transition-all duration-300"
              />
            </div>

            {/* Next Image Button */}
            {lightbox.images.length > 1 && (
              <button 
                onClick={nextImage}
                className="absolute left-2 md:left-4 z-20 bg-slate-900/80 hover:bg-yellow-500 hover:text-slate-950 text-white p-3 md:p-4 rounded-full border border-slate-700/80 transition duration-200 shadow-2xl"
                title="الصورة التالية"
              >
                <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip (Like Phone Gallery) */}
          {lightbox.images.length > 1 && (
            <div className="w-full max-w-3xl mx-auto overflow-x-auto py-2 px-4 flex justify-center gap-2 border-t border-slate-800/80 z-10" onClick={e => e.stopPropagation()}>
              {lightbox.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setLightbox(prev => ({ ...prev, currentIndex: idx }))}
                  className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    lightbox.currentIndex === idx 
                      ? 'border-yellow-500 scale-105 shadow-md shadow-yellow-500/30' 
                      : 'border-transparent opacity-40 hover:opacity-100'
                  }`}
                >
                  <img 
                    src={`https://wajeez-amaal.onrender.com${img.image_url}`} 
                    alt="صورة مصغرة" 
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quote Form */}
      <section id="quote" className="py-24 px-6 max-w-4xl mx-auto w-full">
        <div className="bg-[#0f1523] border border-slate-800 p-8 md:p-12 shadow-2xl rounded-2xl">
          <h2 className="text-3xl font-black text-center mb-3">أرسل مشروعك / طلب استشارة</h2>
          <p className="text-slate-400 text-sm text-center mb-10">قم بتعبئة بياناتك وإرفاق المخطط وسنرجع إليك بدراسة أولية</p>

          <form onSubmit={handleQuoteSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold mb-2 text-slate-300">الاسم الكامل</label>
                <input 
                  type="text" 
                  required
                  value={quoteForm.client_name}
                  onChange={(e) => setQuoteForm({...quoteForm, client_name: e.target.value})}
                  className="w-full bg-[#0b0f17] border border-slate-800 px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition rounded-lg"
                  placeholder="مثال: أحمد المحمود"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 text-slate-300">رقم الهاتف / الواتساب</label>
                <input 
                  type="text" 
                  required
                  value={quoteForm.phone}
                  onChange={(e) => setQuoteForm({...quoteForm, phone: e.target.value})}
                  className="w-full bg-[#0b0f17] border border-slate-800 px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition rounded-lg"
                  placeholder="0936180004"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2 text-slate-300">تفاصيل المشروع أو ملاحظاتك</label>
              <textarea 
                rows="4"
                value={quoteForm.notes}
                onChange={(e) => setQuoteForm({...quoteForm, notes: e.target.value})}
                className="w-full bg-[#0b0f17] border border-slate-800 px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition rounded-lg"
                placeholder="اكتب نبذة عن المساحة، طبيعة البناء، أو التجهيزات المطلوبة..."
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2 text-slate-300">إرفاق مخطط المشروع (اختياري)</label>
              <input 
                type="file"
                onChange={(e) => setQuoteFile(e.target.files[0])}
                className="w-full bg-[#0b0f17] border border-slate-800 px-4 py-3 text-slate-400 text-xs file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-slate-800 file:text-yellow-500 hover:file:bg-slate-700 cursor-pointer rounded-lg"
              />
            </div>

            <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-4 flex items-center justify-center gap-2 transition text-base rounded-lg shadow-lg shadow-yellow-500/10">
              <Send className="w-4 h-4" />
              <span>إرسال الطلب الآن</span>
            </button>

            {quoteStatus && (
              <p className="text-center font-bold text-yellow-500 text-sm mt-4">{quoteStatus}</p>
            )}
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0b0f17] border-t border-slate-800 py-12 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="شعار الشركة" className="h-12 w-auto object-contain" />
              <span className="text-lg font-bold text-slate-100">شركة وجيز الآمال للمقاولات</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              شريككم الموثوق في المشاريع المعمارية والإنشائية بتقديم أعلى معايير الجودة والالتزام بالجدول الزمني.
            </p>
          </div>

          <div className="space-y-3 text-slate-300">
            <h4 className="font-bold text-yellow-500 text-sm mb-4">معلومات التواصل</h4>
            <div className="flex items-center gap-3 text-xs">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>0936180004</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>yasen.ali.2091@gmail.com</span>
            </div>
          </div>

          <div className="text-slate-400 text-xs flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-yellow-500 text-sm mb-4">روابط سريعة</h4>
              <ul className="space-y-2">
                <li><a href="#services" className="hover:text-yellow-500 transition">خدماتنا</a></li>
                <li><a href="#projects" className="hover:text-yellow-500 transition">معرض الأعمال</a></li>
              </ul>
            </div>
            <p className="text-[11px] text-slate-600 mt-6">جميع الحقوق محفوظة © {new Date().getFullYear()} شركة وجيز الآمال للمقاولات.</p>
          </div>
        </div>
      </footer>

      {/* Admin Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1523] border border-slate-800 p-8 max-w-md w-full relative rounded-2xl shadow-2xl">
            <button onClick={() => setShowLogin(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-6 text-yellow-500">تسجيل دخول المشرف</h3>
            
            {loginError && <p className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 mb-4 rounded-lg">{loginError}</p>}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-2">اسم المستخدم</label>
                <input 
                  type="text" 
                  required
                  value={loginCreds.username}
                  onChange={(e) => setLoginCreds({...loginCreds, username: e.target.value})}
                  className="w-full bg-[#0b0f17] border border-slate-800 px-4 py-2.5 text-sm focus:border-yellow-500 outline-none rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2">كلمة المرور</label>
                <input 
                  type="password" 
                  required
                  value={loginCreds.password}
                  onChange={(e) => setLoginCreds({...loginCreds, password: e.target.value})}
                  className="w-full bg-[#0b0f17] border border-slate-800 px-4 py-2.5 text-sm focus:border-yellow-500 outline-none rounded-lg"
                />
              </div>
              <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-3 transition text-sm rounded-lg">
                دخول
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New Album Modal */}
      {showNewAlbum && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1523] border border-slate-800 p-8 max-w-md w-full relative rounded-2xl shadow-2xl">
            <button onClick={() => setShowNewAlbum(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-6 text-yellow-500">إنشاء ألبوم مشروع جديد</h3>
            <form onSubmit={handleCreateAlbum} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-2">عنوان الألبوم</label>
                <input 
                  type="text" 
                  required
                  value={newAlbumTitle}
                  onChange={(e) => setNewAlbumTitle(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-slate-800 px-4 py-2.5 text-sm focus:border-yellow-500 outline-none rounded-lg"
                  placeholder="مثال: مشروع مجمع الخزامى السكني"
                />
              </div>
              <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-3 transition text-sm rounded-lg">
                حفظ الألبوم
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Upload Images Modal */}
      {selectedAlbumForUpload && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1523] border border-slate-800 p-8 max-w-md w-full relative rounded-2xl shadow-2xl">
            <button onClick={() => setSelectedAlbumForUpload(null)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-6 text-yellow-500">رفع صور للألبوم</h3>
            <form onSubmit={handleUploadImages} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-2">اختر الصور</label>
                <input 
                  type="file" 
                  multiple
                  accept="image/*"
                  onChange={(e) => setUploadFiles(e.target.files)}
                  className="w-full bg-[#0b0f17] border border-slate-800 px-4 py-2.5 text-xs rounded-lg"
                />
              </div>
              <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-3 transition text-sm rounded-lg">
                رفع الصور الآن
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
