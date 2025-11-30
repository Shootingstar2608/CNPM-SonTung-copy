import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import StatusModal from '../components/StatusModal';

const TutorSelectionPage = () => {
  const navigate = useNavigate();
  const [tutors, setTutors] = useState([]); // State rỗng ban đầu
  const [loading, setLoading] = useState(true);
  
  // State quản lý Modal
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  // --- GỌI API LẤY DANH SÁCH TUTOR THẬT ---
  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5000/auth/tutors');
        if (res.ok) {
          const data = await res.json();
          setTutors(data);
        }
      } catch (error) {
        console.error("Lỗi tải danh sách tutor:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTutors();
  }, []);

  const handleSelectTutor = (tutor) => {
    // Lưu ID thật vào localStorage để trang Đặt lịch dùng lọc
    localStorage.setItem('selected_tutor_id', tutor.id);
    localStorage.setItem('selected_tutor_name', tutor.name);

    setStatusModal({
      isOpen: true,
      type: 'success',
      title: 'Success',
      message: `Đã chọn giảng viên: ${tutor.name}. Hệ thống sẽ hiển thị lịch của giảng viên này.`,
      confirmText: 'Đến trang đặt lịch',
      onConfirm: () => {
        setStatusModal({ ...statusModal, isOpen: false });
        navigate('/meetings'); // Quay về trang đặt lịch
      }
    });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-700 pb-10">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-xs text-gray-500">
        <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate('/')}>Trang chủ</span>
        <span className="mx-2">›</span>
        <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate('/meetings')}>Quản lý buổi gặp</span>
        <span className="mx-2">›</span>
        <span className="font-medium text-gray-700">Lựa chọn Tutor</span>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Lựa chọn Tutor</h1>

        <div className="bg-gray-100 rounded-xl p-8 min-h-[500px]">
          <div className="flex justify-end mb-6">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
              <input type="text" placeholder="Tìm Kiếm" className="w-full pl-10 pr-4 py-2 border border-gray-400 rounded-full bg-white text-sm" />
            </div>
          </div>

          {loading ? (
             <div className="text-center text-gray-500 italic">Đang tải danh sách giảng viên...</div>
          ) : tutors.length === 0 ? (
             <div className="text-center text-gray-500 italic">Hiện chưa có giảng viên nào trong hệ thống.</div>
          ) : (
            <div className="space-y-4">
              {tutors.map((tutor) => (
                <div key={tutor.id} className="bg-white border border-gray-300 rounded-lg p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-gray-900 text-base">{tutor.name} (ID: {tutor.id})</span>
                    <button 
                      onClick={() => handleSelectTutor(tutor)}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-1.5 px-6 rounded text-sm transition-colors"
                    >
                      Xác Nhận
                    </button>
                  </div>
                  <div className="border-t border-gray-200 my-3"></div>
                  <div className="grid grid-cols-4 gap-4 text-sm text-gray-600">
                    <div><span className="block font-medium text-gray-500 text-xs mb-1">Khoa</span>{tutor.faculty}</div>
                    <div className="text-center"><span className="block font-medium text-gray-500 text-xs mb-1">Nhóm</span>{tutor.group}</div>
                    <div className="text-center"><span className="block font-medium text-gray-500 text-xs mb-1">Phòng</span>{tutor.room}</div>
                    <div className="text-right"><span className="block font-medium text-gray-500 text-xs mb-1">Địa điểm</span>{tutor.location}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <StatusModal 
        isOpen={statusModal.isOpen} 
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        onConfirm={statusModal.onConfirm}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        confirmText={statusModal.confirmText}
      />
    </div>
  );
};

export default TutorSelectionPage;