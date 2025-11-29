import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, User } from 'lucide-react';
import heroBg from '../assets/slbk.jpg';
import logoBKTutor from '../assets/logo.png';

const adminCards = [
  {
    id: 1,
    title: 'Quản lý người dùng và phân quyền',
    description: 'Theo dõi trạng thái tài khoản, phân vai trò student / tutor / admin.',
    statusLabel: 'Phân quyền',
    statusColor: 'text-green-600',
    action: '/user-management',
    illustration: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 2,
    title: 'Danh sách admin',
    description: 'Quản lý quyền hạn nội bộ, đồng bộ hồ sơ cán bộ quản trị.',
    statusLabel: 'Đồng bộ',
    statusColor: 'text-emerald-600',
    action: '/user-management',
    illustration: 'https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?auto=format&fit=crop&w=900&q=80',
  },
];

const AdminHomePage = () => {
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
      // ignore
    }
  }, []);

  const avatarLabel = (user?.name || 'Admin').charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* NAVIGATION */}
      <header className="border-b bg-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button onClick={() => navigate('/admin-home')} className="flex items-center gap-2">
            <img src={logoBKTutor} alt="logo" className="h-9 w-auto" />
            <span className="font-extrabold text-2xl tracking-tight">BKTutor</span>
          </button>
          <nav className="hidden md:flex items-center gap-5 text-sm font-semibold">
            <button className="text-[#0F62FE] border-b-2 border-[#0F62FE] py-1">Trang chủ</button>
            <button onClick={() => navigate('/user-management')} className="hover:text-[#0F62FE] py-1 text-gray-600">
              Quản lý người dùng và phân quyền
            </button>
            <button onClick={() => navigate('/user-management')} className="hover:text-[#0F62FE] py-1 text-gray-600">
              Danh sách admin
            </button>
          </nav>
          <div className="flex items-center gap-4">
            <Bell size={18} className="text-gray-500" />
            <div className="relative">
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm font-semibold"
              >
                <span className="bg-gray-900 text-white rounded-full w-7 h-7 flex items-center justify-center">
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
                      <User size={16} /> Hồ sơ cá nhân
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-gray-500 mt-4">Trang chủ</div>

      {/* CARDS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <h2 className="text-2xl font-bold">Chức năng có thể sử dụng của Quản trị viên hệ thống</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminCards.map((card) => (
            <div key={card.id} className="rounded-[32px] border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
              <div className="h-48 bg-gray-100">
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

      {/* QUICK LINKS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="rounded-[32px] border border-gray-200 bg-gray-50/60 px-6 py-5 text-sm text-gray-600 flex flex-wrap items-center gap-3">
          <span className="font-semibold text-gray-900">Truy cập nhanh:</span>
          <button onClick={() => navigate('/user-management')} className="text-[#0F62FE] hover:underline">
            Quản lý người dùng
          </button>
          <span className="text-gray-400">·</span>
          <button onClick={() => navigate('/feedback/analysis')} className="text-[#0F62FE] hover:underline">
            Khai thác phản hồi
          </button>
          <span className="text-gray-400">·</span>
          <button onClick={() => navigate('/resources')} className="text-[#0F62FE] hover:underline">
            Kho tài liệu hệ thống
          </button>
        </div>
      </section>
    </div>
  );
};

export default AdminHomePage;

