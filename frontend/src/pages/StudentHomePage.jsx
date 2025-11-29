import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, User } from 'lucide-react';
import heroBg from '../assets/slbk.jpg';
import logoBKTutor from '../assets/logo.png';

const studentFeatures = [
  {
    id: 1,
    title: 'Quản lý buổi gặp',
    description: 'Đăng ký slot tư vấn, theo dõi trạng thái lịch hẹn với tutor.',
    statusLabel: 'Đồng bộ',
    statusColor: 'text-green-600',
    action: '/meetings',
    illustration: 'https://images.unsplash.com/photo-1486591978090-586b3d0d8cd1?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 2,
    title: 'Kho tài liệu học tập',
    description: 'Tải giáo trình, đề cương, tài liệu bổ trợ từ hệ thống.',
    statusLabel: 'Hoạt động',
    statusColor: 'text-blue-600',
    action: '/resources/student',
    illustration: 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 3,
    title: 'Phản hồi chất lượng',
    description: 'Gửi đánh giá sau buổi tư vấn để nhà trường cải thiện dịch vụ.',
    statusLabel: 'Đang thu thập',
    statusColor: 'text-amber-600',
    action: '/feedback',
    illustration: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=900&q=80',
  },
];

const StudentHomePage = () => {
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

  const avatarLabel = (user?.name || 'Student').charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const NavLink = ({ label, onClick, active }) => (
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
      {/* NAV BAR */}
      <header className="border-b bg-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button onClick={() => navigate('/student-home')} className="flex items-center gap-2">
            <img src={logoBKTutor} alt="logo" className="h-9 w-auto" />
            <span className="font-extrabold text-2xl tracking-tight">BKTutor</span>
          </button>
          <nav className="hidden md:flex items-center gap-5">
            <NavLink label="Trang chủ" active />
            <NavLink label="Thông tin" />
            <NavLink label="Blog" />
            <NavLink label="Đặt lịch" onClick={() => navigate('/meetings')} />
            <NavLink label="Phản hồi chất lượng" onClick={() => navigate('/feedback')} />
            <NavLink label="Tài liệu học tập" onClick={() => navigate('/resources/student')} />
          </nav>
          <div className="flex items-center gap-4">
            <Bell size={18} className="text-gray-500" />
            <div className="relative">
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm font-semibold"
              >
                <span className="bg-purple-200 text-purple-800 rounded-full w-7 h-7 flex items-center justify-center">
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

      {/* BREADCRUMB */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-gray-500 mt-4">Trang chủ</div>

      {/* FEATURE GRID */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <h2 className="text-2xl font-bold">Chức năng có thể sử dụng của Sinh viên</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {studentFeatures.map((feature) => (
            <div key={feature.id} className="rounded-[32px] border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
              <div className="h-40 bg-gray-100">
                <img
                  src={feature.illustration}
                  alt={feature.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <div className="p-6 flex flex-col gap-4 flex-1">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-gray-400 mb-2">Use case</p>
                  <h3 className="font-bold text-lg text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{feature.description}</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-semibold ${feature.statusColor}`}>{feature.statusLabel}</span>
                  <button
                    onClick={() => navigate(feature.action)}
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
            Quản lý buổi gặp
          </button>
          <span className="text-gray-400">·</span>
          <button onClick={() => navigate('/resources/student')} className="text-[#0F62FE] hover:underline">
            Kho tài liệu
          </button>
          <span className="text-gray-400">·</span>
          <button onClick={() => navigate('/feedback')} className="text-[#0F62FE] hover:underline">
            Gửi phản hồi
          </button>
        </div>
      </section>
    </div>
  );
};

export default StudentHomePage;

