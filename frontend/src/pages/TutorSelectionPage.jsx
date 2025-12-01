import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { Search, UserCheck } from 'lucide-react'; // Import thêm icon UserCheck
import StatusModal from '../components/StatusModal';

const TutorSelectionPage = () => {
  const navigate = useNavigate();
  const [tutors, setTutors] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State lấy Tutor hiện tại từ LocalStorage
  const [currentTutor, setCurrentTutor] = useState({
    id: localStorage.getItem('selected_tutor_id'),
    name: localStorage.getItem('selected_tutor_name')
  });

  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

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

  const filteredTutors = tutors.filter(tutor => {
    const term = searchTerm.toLowerCase();
    return (
      tutor.name.toLowerCase().includes(term) || 
      tutor.id.toLowerCase().includes(term)
    );
  });

  const handleSelectTutor = (tutor) => {
    localStorage.setItem('selected_tutor_id', tutor.id);
    localStorage.setItem('selected_tutor_name', tutor.name);
    setCurrentTutor({ id: tutor.id, name: tutor.name }); // Cập nhật state hiển thị ngay lập tức

    setStatusModal({
      isOpen: true,
      type: 'success',
      title: 'Success',
      message: `Đã chọn Tutor: ${tutor.name}. Hệ thống sẽ hiển thị lịch của Tutor này.`,
      confirmText: 'Đóng',
      onConfirm: () => {
        setStatusModal({ ...statusModal, isOpen: false });
        navigate('/meetings'); 
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
        
        {/* HEADER & NÚT ĐÓNG */}
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold text-gray-900">Lựa chọn Tutor</h1>
            <button 
                onClick={() => navigate('/meetings')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
            >
                Đóng
            </button>
        </div>

        {/* HIỂN THỊ TUTOR ĐANG CHỌN (NẾU CÓ) */}
        {currentTutor.name && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3 animate-fade-in">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                    <UserCheck size={20} />
                </div>
                <div>
                    <span className="text-xs text-gray-500 uppercase font-bold block">Tutor đã chọn</span>
                    <span className="text-blue-800 font-bold text-base">{currentTutor.name}</span>
                </div>
            </div>
        )}

        <div className="bg-gray-100 rounded-xl p-8 min-h-[500px]">
          <div className="flex justify-end mb-6">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Tìm Kiếm" 
                className="w-full pl-10 pr-4 py-2 border border-gray-400 rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
             <div className="text-center text-gray-500 italic">Đang tải danh sách giảng viên...</div>
          ) : filteredTutors.length === 0 ? (
             <div className="text-center text-gray-500 italic">Không tìm thấy giảng viên nào khớp với từ khóa "{searchTerm}".</div>
          ) : (
            <div className="space-y-4">
              {filteredTutors.map((tutor) => {
                // Kiểm tra xem tutor này có phải là người đang được chọn không
                const isSelected = currentTutor.id === tutor.id;
                
                return (
                    <div key={tutor.id} className={`bg-white border rounded-lg p-5 shadow-sm hover:shadow-md transition-all ${isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300'}`}>
                    <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-gray-900 text-base flex items-center gap-2">
                            {tutor.name} (ID: {tutor.id})
                            {isSelected && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Đã chọn</span>}
                        </span>
                        
                        {/* Ẩn nút chọn nếu đã chọn người này, hoặc đổi thành nút "Đã chọn" disabled */}
                        {isSelected ? (
                            <button disabled className="bg-gray-100 text-gray-400 font-medium py-1.5 px-6 rounded text-sm cursor-default">
                                Đã chọn
                            </button>
                        ) : (
                            <button 
                                onClick={() => handleSelectTutor(tutor)}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-1.5 px-6 rounded text-sm transition-colors"
                            >
                                Xác Nhận
                            </button>
                        )}
                    </div>
                    <div className="border-t border-gray-200 my-3"></div>
                    <div className="grid grid-cols-4 gap-4 text-sm text-gray-600">
                        <div><span className="block font-medium text-gray-500 text-xs mb-1">Khoa</span>{tutor.faculty}</div>
                        <div className="text-center"><span className="block font-medium text-gray-500 text-xs mb-1">Nhóm</span>{tutor.group}</div>
                        <div className="text-center"><span className="block font-medium text-gray-500 text-xs mb-1">Phòng</span>{tutor.room}</div>
                        <div className="text-right"><span className="block font-medium text-gray-500 text-xs mb-1">Địa điểm</span>{tutor.location}</div>
                    </div>
                    </div>
                );
              })}
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