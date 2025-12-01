import React, { useState, useMemo } from 'react';
import { Bell, ChevronDown, User, Calendar, Settings, LogOut } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

// Nếu bạn có file logo thì giữ dòng import này, nếu không thì comment lại và dùng text
import logoBKTutor from '../assets/logo.png'; 

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State để đóng/mở menu người dùng (Avatar)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { roleHomePath, isTutor } = useMemo(() => {
    const roleMap = {
      STUDENT: '/student-home',
      TUTOR: '/tutor-home',
      ADMIN: '/admin-home',
      OFFICER: '/admin-home',
      DEPARTMENT: '/admin-home'
    };

    const resolveRole = () => {
      try {
        const stored = localStorage.getItem('user_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.role) return parsed.role.toUpperCase();
        }
      } catch {
        // ignore parse errors
      }
      const cachedRole = localStorage.getItem('user_role');
      return cachedRole ? cachedRole.toUpperCase() : null;
    };

    const detectedRole = resolveRole();
    const homePath = roleMap[detectedRole] || '/login'; // <--- Tách biến
    return { // <--- THAY ĐỔI: Trả về Object
      roleHomePath: homePath, 
      isTutor: detectedRole === 'TUTOR' // <--- BỔ SUNG: Cờ kiểm tra
    };
  }, []);

  const handleNavigateHome = () => navigate(roleHomePath);

  const getLinkClass = (path, includeChildren = false) => {
    const isActive = includeChildren
      ? location.pathname.startsWith(path)
      : location.pathname === path;
    return isActive
      ? 'text-blue-600 border-b-2 border-blue-600 py-5 font-bold cursor-pointer transition-colors'
      : 'text-gray-900 hover:text-blue-600 py-5 font-medium cursor-pointer transition-colors';
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* --- LOGO --- */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={handleNavigateHome}
          >
            {/* Nếu có ảnh thì dùng ảnh, không thì dùng Text */}
            <img 
              src={logoBKTutor} 
              alt="BKTutor Logo" 
              className="h-10 w-auto object-contain" 
              onError={(e) => {e.target.style.display='none'}} // Ẩn ảnh nếu lỗi
            /> 
            {/* Fallback Text nếu ảnh lỗi hoặc chưa có */}
            <span className="text-gray-900 font-extrabold text-2xl tracking-tight">
              BKTutor
            </span>
          </div>

          {/* --- MENU LINKS --- */}
          <nav className="hidden md:flex space-x-8 text-sm">
            <Link to={roleHomePath} className={getLinkClass(roleHomePath, true)}>Trang chủ</Link>
            {!isTutor && ( // <--- ĐIỀU KIỆN
                <>
                    {/* <Link to={roleHomePath} className="text-gray-900 hover:text-blue-600 py-5 font-medium">Thông tin</Link> 
                    <Link to={roleHomePath} className="text-gray-900 hover:text-blue-600 py-5 font-medium">Blog</Link> */}
                    
                    <div className="relative group cursor-pointer flex items-center gap-1 hover:text-blue-600 py-5 font-medium">
                        Đặt lịch <ChevronDown size={14} />
                    </div>
                </>
            )}
            
            {/* Link 1: Quản lý buổi gặp */}
            <Link to="/meetings" className={getLinkClass('/meetings', true)}>
              Quản lý buổi gặp
            </Link>
            
            {/* Link 2: Tài liệu học tập */}
            <Link to="/resources" className={getLinkClass('/resources', true)}>
              Tài liệu học tập
            </Link>
          </nav>

          {/* --- USER ACTIONS (RIGHT) --- */}
          <div className="flex items-center space-x-4">
            <button className="text-gray-500 hover:text-gray-700">
              <Bell size={20} />
            </button>
            
            {/* Dropdown Menu User */}
            <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)} // Bật tắt menu
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-700 bg-gray-100 p-1 rounded-full px-3 transition-colors outline-none"
                >
                  <div className="bg-purple-200 text-purple-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">U</div>
                  <ChevronDown size={16} />
                </button>

                {/* Nội dung Dropdown */}
                {isDropdownOpen && (
                  <>
                    {/* Lớp nền trong suốt để click ra ngoài thì tắt menu */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsDropdownOpen(false)}
                    ></div>

                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 border border-gray-100 animate-fade-in-up z-50">
                      <div className="px-4 py-2 border-b border-gray-100 mb-1">
                        <p className="text-sm font-bold text-gray-900">User Name</p>
                        <p className="text-xs text-gray-500">user@hcmut.edu.vn</p>
                      </div>

                      <Link 
                        to="/user-info" 
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                      >
                        <User size={16} className="mr-3"/> Thông tin cá nhân
                      </Link>
                      
                      <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                        <Calendar size={16} className="mr-3"/> Lịch cá nhân
                      </a>
                      
                      <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                        <Settings size={16} className="mr-3"/> Tùy chọn
                      </a>
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <a href="#" className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">
                        <LogOut size={16} className="mr-3"/> Đăng xuất
                      </a>
                    </div>
                  </>
                )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;