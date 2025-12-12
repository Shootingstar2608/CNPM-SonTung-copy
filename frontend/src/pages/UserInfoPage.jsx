import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Link, useNavigate } from 'react-router-dom';

const UserInfoPage = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:5000/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setUserData(data.user);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem('access_token');
    
    try {
      const res = await fetch(`http://127.0.0.1:5000/info/users/${userData.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          score: userData.score,
          conduct_points: userData.conduct_points,
          scholarship_level: userData.scholarship_level
        })
      });

      if (res.ok) {
        setStatusModal({
          isOpen: true,
          type: 'success',
          title: 'Thành công',
          message: 'Đã lưu thay đổi!',
          onConfirm: () => {
            setStatusModal({ ...statusModal, isOpen: false });
            setActiveTab('view');
          }
        });
      } else {
        setStatusModal({
          isOpen: true,
          type: 'error',
          title: 'Lỗi',
          message: 'Không thể lưu thay đổi'
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-20 text-center text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-20 text-center text-gray-500">Không có dữ liệu</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-700 pb-10">
      <Header />
      
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-xs text-gray-500">
        <Link to="/" className="hover:text-blue-600">Trang chủ</Link>
        <span className="mx-2">›</span>
        <span className="font-medium text-gray-700">Thông tin cá nhân</span>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Thông tin cá nhân</h1>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-6">
            <InfoRow label="ID" value={userData.id} />
            <InfoRow label="Họ tên" value={userData.name} />
            <InfoRow label="Email" value={userData.email} />
            <InfoRow label="Role" value={userData.role} />
            
            {userData.role === 'STUDENT' && (
              <>
                <div className="border-t pt-6 mt-6">
                  <h3 className="font-bold text-gray-800 mb-4">Thông tin học tập</h3>
                  <InfoRow label="Điểm" value={userData.score ?? 'Chưa có'} />
                  <InfoRow label="Điểm rèn luyện" value={userData.conduct_points ?? 'Chưa có'} />
                  <InfoRow label="Học bổng" value={userData.scholarship_level ?? 'Chưa có'} />
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// Helper Components
const InfoRow = ({ label, value }) => (
  <div className="flex items-center border-b border-gray-100 pb-3">
    <div className="w-1/3 text-sm font-semibold text-gray-600">{label}</div>
    <div className="w-2/3 text-sm text-gray-900">{value}</div>
  </div>
);

export default UserInfoPage;