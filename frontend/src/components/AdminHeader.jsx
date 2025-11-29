import React, { useMemo } from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import logoBKTutor from '../assets/logo.png'; 
import { Link, useNavigate, useLocation } from 'react-router-dom';

const AdminHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const homePath = useMemo(() => {
    const role = localStorage.getItem('user_role') || '';
    if (['ADMIN', 'OFFICER', 'DEPARTMENT'].includes(role.toUpperCase())) {
      return '/admin-home';
    }
    return '/admin-home';
  }, []);

  const getLinkClass = (path, includeChildren = false) => {
    const isActive = includeChildren
      ? location.pathname.startsWith(path)
      : location.pathname === path;
    return isActive
      ? 'text-blue-600 border-b-2 border-blue-600 py-5 font-bold cursor-pointer'
      : 'text-gray-900 hover:text-blue-600 py-5 font-medium cursor-pointer transition-colors';
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => navigate(homePath)}
          >
            <img src={logoBKTutor} alt="BKTutor Logo" className="h-10 w-auto object-contain" />
            <span className="text-gray-900 font-extrabold text-2xl tracking-tight">
              BKTutor
            </span>
          </div>

          {/* ADMIN MENU LINKS */}
          <nav className="hidden md:flex space-x-8 text-sm">
            <Link to={homePath} className={getLinkClass('/admin-home', true)}>
              Trang chủ
            </Link>
            
            {/* Link này đang Active ở trang User Management */}
            <Link to="/user-management" className={getLinkClass('/user-management', true)}>
              Quản lý người dùng và phân quyền
            </Link>
            
            <Link to="/admin-home" className="text-gray-900 hover:text-blue-600 py-5 font-medium">
              Danh sách admin
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <button className="text-gray-500 hover:text-gray-700">
              <Bell size={20} />
            </button>
            <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700 bg-gray-100 p-1 rounded-full px-3">
              {/* Giả lập Avatar Admin */}
              <div className="bg-gray-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">A</div>
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;