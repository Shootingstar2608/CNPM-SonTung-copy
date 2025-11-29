import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useNavigate, useParams } from 'react-router-dom';
import RescheduleModal from '../components/RescheduleModal';
import MinutesModal from '../components/MinutesModal';
import StatusModal from '../components/StatusModal';

const SessionInfoPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Lấy ID từ URL
  const token = localStorage.getItem('access_token');

  // State lưu thông tin buổi học
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);

  // State Modal
  const [isMinutesOpen, setIsMinutesOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  
  // State thông báo trạng thái
  const [statusModal, setStatusModal] = useState({ 
    isOpen: false, 
    type: 'success', 
    title: '', 
    message: '',
    onConfirm: null 
  });

  // --- 1. GỌI API LẤY CHI TIẾT BUỔI HỌC ---
  const fetchSessionDetail = async () => {
    try {
      // Backend chưa có API get single, ta lấy hết rồi lọc
      const res = await fetch('http://127.0.0.1:5000/appointments/', {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
          const list = await res.json();
          const found = list.find(item => item.id === id);
          if (found) {
              setSessionData(found);
          } else {
              // Nếu không tìm thấy (do ID sai hoặc đã bị xóa)
              setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Lỗi',
                message: 'Không tìm thấy thông tin buổi học.',
                onConfirm: () => navigate('/')
              });
          }
      }
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // --- 2. XỬ LÝ HỦY LỊCH (DELETE) ---
  const handleCancelClick = () => {
    setStatusModal({
      isOpen: true,
      type: 'confirm',
      title: 'Xác nhận hủy',
      message: 'Bạn có chắc chắn muốn hủy buổi gặp này không?',
      onConfirm: confirmCancel
    });
  };

  const confirmCancel = async () => {
      try {
          const res = await fetch(`http://127.0.0.1:5000/appointments/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
              setStatusModal({ 
                isOpen: true, 
                type: 'success', 
                title: 'Thành công', 
                message: 'Đã hủy buổi học.',
                onConfirm: () => navigate('/') // Bấm OK thì về trang chủ
              });
          } else {
              const data = await res.json();
              setStatusModal({ 
                isOpen: true, 
                type: 'error', 
                title: 'Lỗi', 
                message: data.error || 'Không thể hủy lịch.' 
              });
          }
      } catch (e) {
          console.error(e);
          setStatusModal({ isOpen: true, type: 'error', title: 'Lỗi', message: 'Lỗi kết nối server' });
      }
  };

  // --- 3. XỬ LÝ ĐỔI LỊCH (PUT) ---
  const handleRescheduleSubmit = async (newData) => {
    setIsRescheduleOpen(false); // Đóng form nhập liệu

    try {
        const res = await fetch(`http://127.0.0.1:5000/appointments/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newData)
        });

        const data = await res.json();

        if (res.ok) {
            setStatusModal({ 
                isOpen: true, 
                type: 'success', 
                title: 'Thành công', 
                message: 'Đổi lịch thành công!',
                onConfirm: () => {
                    setStatusModal({ ...statusModal, isOpen: false });
                    setLoading(true);
                    fetchSessionDetail(); // Tải lại dữ liệu mới ngay lập tức
                }
            });
        } else {
            setStatusModal({ 
                isOpen: true, 
                type: 'error', 
                title: 'Thất bại', 
                message: data.error || 'Không thể đổi lịch' 
            });
        }
    } catch (err) {
        setStatusModal({ isOpen: true, type: 'error', title: 'Lỗi', message: 'Lỗi kết nối server' });
    }
  };

  const handleCreateMinutes = () => { setIsMinutesOpen(true); };

  // --- RENDER ---
  if (loading) return <div className="text-center pt-20">Đang tải thông tin...</div>;
  if (!sessionData) return null; // Modal lỗi sẽ hiện thay thế

  // Tách chuỗi ngày giờ để hiển thị
  const [dateStr, timeStr] = (sessionData.start_time || " ").split(' ');
  const endTimeStr = (sessionData.end_time || " ").split(' ')[1];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-700 pb-10">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-xs text-gray-500">
        <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate('/')}>Trang chủ</span>
        <span className="mx-2">›</span>
        <span className="font-medium text-gray-700">Thông tin buổi tư vấn</span>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Thông tin buổi tư vấn</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-6">
            
            {/* Chủ đề */}
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Chủ đề</h3>
              <p className="text-lg text-blue-700 font-medium">{sessionData.name}</p>
            </div>

            {/* Trạng thái */}
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Trạng thái</h3>
              <span className={`px-2 py-1 rounded text-xs font-bold ${sessionData.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {sessionData.status}
              </span>
            </div>

            {/* Grid Thông tin chi tiết */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-2">
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Ngày</h3>
                <p className="text-sm text-gray-600">{dateStr}</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Khung giờ</h3>
                <p className="text-sm text-gray-600">{timeStr} - {endTimeStr}</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Hình thức/Địa điểm</h3>
                <p className="text-sm text-gray-600">{sessionData.place}</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Sĩ số</h3>
                <p className="text-sm text-gray-600">{(sessionData.current_slots || []).length} / {sessionData.max_slot}</p>
              </div>
            </div>

          </div>

          {/* Các nút hành động */}
          <div className="flex flex-wrap justify-center gap-4 mt-12 border-t pt-8">
            <button onClick={handleCancelClick} className="px-6 py-2 border border-gray-400 rounded hover:bg-gray-50 text-red-600 font-medium min-w-[120px]">
              Hủy Lịch
            </button>
            <button onClick={() => setIsRescheduleOpen(true)} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium min-w-[120px]">
              Đổi Lịch
            </button>
            <button onClick={handleCreateMinutes} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium min-w-[120px]">
              Biên bản
            </button>
          </div>
        </div>
      </main>

      {/* 1. Modal Đổi lịch */}
      <RescheduleModal 
        isOpen={isRescheduleOpen} 
        onClose={() => setIsRescheduleOpen(false)} 
        onConfirm={handleRescheduleSubmit} 
      />

      {/* 2. Modal Biên bản */}
      <MinutesModal 
        isOpen={isMinutesOpen} 
        onClose={() => setIsMinutesOpen(false)} 
        sessionData={sessionData} // <--- THÊM DÒNG NÀY ĐỂ TRUYỀN DỮ LIỆU
      />
      
      {/* 3. Modal Thông báo chung */}
      <StatusModal 
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        onConfirm={statusModal.onConfirm} 
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
      />
    </div>
  );
};

export default SessionInfoPage;