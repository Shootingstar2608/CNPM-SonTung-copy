import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, User } from 'lucide-react';
import heroBg from '../assets/slbk.jpg';
import logoBKTutor from '../assets/logo.png';

const tutorCards = [
  {
    id: 1,
    title: 'Mở buổi tư vấn',
    description: 'Thiết lập lịch gặp, chủ đề và số lượng sinh viên cho từng ca.',
    statusLabel: 'Đồng bộ',
    statusColor: 'text-green-600',
    action: '/create-session',
    illustration: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 2,
    title: 'Thiết lập lịch rảnh',
    description: 'Cập nhật khung giờ để sinh viên đặt lịch theo UC001-1A.',
    statusLabel: 'Đang cập nhật',
    statusColor: 'text-amber-600',
    action: '/free-schedule',
    illustration: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 3,
    title: 'Chia sẻ tài liệu',
    description: 'Tải lên giáo trình, slide, đề cương phục vụ lớp phụ trách.',
    statusLabel: 'Hoạt động',
    statusColor: 'text-blue-600',
    action: '/resources/upload',
    illustration: 'https://images.unsplash.com/photo-1485217988980-11786ced9454?auto=format&fit=crop&w=900&q=80',
  },
];

const TutorHomePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user_data');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore parse error
    }
  }, []);

  const avatarLabel = (user?.name || 'Tutor').charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const NavItem = ({ label, onClick, active }) => (
    <button
      onClick={onClick}
      className={`text-sm font-semibold py-1 ${
        active ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* NAVIGATION */}
      <header className="border-b bg-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button onClick={() => navigate('/tutor-home')} className="flex items-center gap-2">
            <img src={logoBKTutor} alt="BKTutor" className="h-9 w-auto" />
            <span className="font-extrabold text-2xl tracking-tight">BKTutor</span>
          </button>
          <nav className="hidden md:flex items-center gap-5">
            <NavItem label="Trang chủ" active />
            <NavItem label="Quản lý buổi gặp" onClick={() => navigate('/meetings')} />
            <NavItem label="Tài liệu học tập" onClick={() => navigate('/resources')} />
            <NavItem label="Phản hồi chất lượng" onClick={() => navigate('/feedback')} />
          </nav>
          <div className="flex items-center gap-4">
            <Bell size={18} className="text-gray-500" />
            <div className="relative">
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm font-semibold"
              >
                <span className="bg-blue-200 text-blue-800 rounded-full w-7 h-7 flex items-center justify-center">
                  {avatarLabel}
                </span>
                <ChevronDown size={14} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl border bg-white shadow-lg z-20">
                    <button
                      onClick={() => navigate('/user-info')}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 w-full text-left"
                    >
                      <User size={16} /> Thông tin cá nhân
                    </button>
                    <button
                      onClick={() => navigate('/meetings')}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 w-full text-left"
                    >
                      Lịch
                    </button>
                    <button
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 w-full text-left"
                    >
                      Tùy chọn
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left rounded-b-2xl"
                    >
                      <LogOut size={16} /> Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative max-w-6xl mx-auto mt-6 rounded-[32px] overflow-hidden border shadow-[0_30px_80px_-60px_rgba(15,98,254,0.8)]">
        <img src={heroBg} alt="BK campus" className="w-full h-64 md:h-80 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/60 to-transparent" />
        <div className="absolute inset-0" />
      </section>

      {/* HEADER PATH */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-gray-500 mt-4">Trang chủ</div>

      {/* CARD GRID */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <h2 className="text-2xl font-bold">Chức năng có thể sử dụng của Tutor</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tutorCards.map((card) => (
            <div key={card.id} className="rounded-[32px] border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
              <div className="h-40 bg-gray-100">
                <img
                  src={card.illustration}
                  alt={card.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <div className="p-6 flex flex-col gap-4 flex-1">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-gray-400 mb-2">Use case</p>
                  <h3 className="font-bold text-lg text-gray-900">{card.title}</h3>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{card.description}</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-semibold ${card.statusColor}`}>{card.statusLabel}</span>
                  <button
                    onClick={() => navigate(card.action)}
                    className="font-semibold text-gray-700 hover:text-[#0F62FE] transition-colors flex items-center gap-1"
                  >
                    View more →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((page) => (
            <button
              key={page}
              className={`w-8 h-8 rounded-full border text-sm ${
                page === 1 ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="rounded-[32px] border border-gray-200 bg-gray-50/60 px-6 py-5 text-sm text-gray-600 flex flex-wrap items-center gap-3">
          <span className="font-semibold text-gray-900">Truy cập nhanh:</span>
          <button onClick={() => navigate('/meetings')} className="text-[#0F62FE] hover:underline">
            Danh sách buổi tư vấn
          </button>
          <span className="text-gray-400">·</span>
          <button onClick={() => navigate('/free-schedule')} className="text-[#0F62FE] hover:underline">
            Lịch rảnh của tôi
          </button>
          <span className="text-gray-400">·</span>
          <button onClick={() => navigate('/resources/upload')} className="text-[#0F62FE] hover:underline">
            Kho tài liệu của tôi
          </button>
        </div>
      </section>
    </div>
  );
};

export default TutorHomePage;

