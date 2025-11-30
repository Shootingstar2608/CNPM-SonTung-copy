import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useNavigate, useParams } from 'react-router-dom';
import RescheduleModal from '../components/RescheduleModal'; // Modal cho Tutor
import MinutesModal from '../components/MinutesModal';
import StatusModal from '../components/StatusModal';
import StudentRescheduleModal from '../components/StudentRescheduleModal'; // Modal cho Student

const SessionInfoPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role')?.toUpperCase(); 
  const currentUserId = localStorage.getItem('user_id');

  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);

  // State Modals
  const [isMinutesOpen, setIsMinutesOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isStudentSwitchOpen, setIsStudentSwitchOpen] = useState(false);
  
  const [statusModal, setStatusModal] = useState({ 
    isOpen: false, type: 'success', title: '', message: '', onConfirm: null 
  });

  const fetchSessionDetail = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/appointments/', {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
          const list = await res.json();
          const found = list.find(item => item.id === id);
          if (found) setSessionData(found);
          else {
              setStatusModal({
                isOpen: true, type: 'error', title: 'Lỗi', message: 'Không tìm thấy thông tin buổi học.',
                onConfirm: () => navigate('/')
              });
          }
      }
    } catch (error) { console.error("Lỗi:", error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchSessionDetail(); }, [id]);

  // --- 1. LOGIC ĐĂNG KÝ (MỚI THÊM) ---
  const handleBookClick = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/appointments/${id}/book`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setStatusModal({
          isOpen: true, type: 'success', title: 'Thành công',
          message: 'Đăng ký thành công!',
          // Đăng ký xong -> Quay về tab "Đăng ký mới" (activeTab: 'booking')
          onConfirm: () => navigate('/meetings', { state: { activeTab: 'booking' } })
        });
      } else {
        setStatusModal({
          isOpen: true, type: 'error', title: 'Lỗi',
          message: data.error || 'Không thể đăng ký lịch này.'
        });
      }
    } catch (e) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Lỗi', message: 'Lỗi kết nối server' });
    }
  };

  // --- LOGIC HỦY LỊCH ---
  const handleCancelClick = () => {
    setStatusModal({
      isOpen: true, type: 'confirm', title: 'Xác nhận hủy',
      message: userRole === 'STUDENT' 
        ? 'Bạn có chắc chắn muốn hủy đăng ký buổi này không?'
        : 'Bạn có chắc chắn muốn hủy buổi gặp này không (Tutor)?',
      onConfirm: confirmCancel
    });
  };

  const confirmCancel = async () => {
      const url = userRole === 'STUDENT' 
        ? `http://127.0.0.1:5000/appointments/${id}/book`
        : `http://127.0.0.1:5000/appointments/${id}`;

      try {
          const res = await fetch(url, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
              setStatusModal({ 
                isOpen: true, type: 'success', title: 'Thành công', 
                message: 'Đã hủy thành công.',
                // Hủy xong -> Quay về tab "Lịch của tôi"
                onConfirm: () => navigate('/meetings', { state: { activeTab: 'my-schedule' } }) 
              });
          } else {
              const data = await res.json();
              setStatusModal({ isOpen: true, type: 'error', title: 'Lỗi', message: data.error || 'Không thể hủy.' });
          }
      } catch (e) {
          setStatusModal({ isOpen: true, type: 'error', title: 'Lỗi', message: 'Lỗi kết nối server' });
      }
  };

  // --- LOGIC ĐỔI LỊCH (STUDENT) ---
  const handleStudentSwitch = async (newAptId) => {
    setIsStudentSwitchOpen(false);
    try {
        const cancelRes = await fetch(`http://127.0.0.1:5000/appointments/${id}/book`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!cancelRes.ok) throw new Error("Không thể hủy lịch cũ");

        const bookRes = await fetch(`http://127.0.0.1:5000/appointments/${newAptId}/book`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (bookRes.ok) {
            setStatusModal({ 
                isOpen: true, type: 'success', title: 'Đổi lịch thành công', 
                message: 'Bạn đã chuyển sang buổi hẹn mới.',
                onConfirm: () => navigate(`/session-info/${newAptId}`) 
            });
        } else {
            const err = await bookRes.json();
            throw new Error(err.error || "Lỗi khi đăng ký lịch mới");
        }
    } catch (e) {
        setStatusModal({ isOpen: true, type: 'error', title: 'Lỗi đổi lịch', message: e.message });
    }
  };

  const handleTutorReschedule = async (newData) => { /* Logic Tutor */ };

  if (loading) return <div className="text-center pt-20">Đang tải thông tin...</div>;
  if (!sessionData) return null;

  const isMyBooking = sessionData.current_slots && sessionData.current_slots.includes(currentUserId);
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
            <div><h3 className="font-bold text-gray-900 mb-1">Chủ đề</h3><p className="text-lg text-blue-700 font-medium">{sessionData.name}</p></div>
            <div><h3 className="font-bold text-gray-900 mb-1">Trạng thái</h3><span className={`px-2 py-1 rounded text-xs font-bold ${sessionData.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{sessionData.status}</span></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-2">
              <div><h3 className="font-bold text-gray-900 text-sm mb-1">Ngày</h3><p className="text-sm text-gray-600">{dateStr}</p></div>
              <div><h3 className="font-bold text-gray-900 text-sm mb-1">Khung giờ</h3><p className="text-sm text-gray-600">{timeStr} - {endTimeStr}</p></div>
              <div><h3 className="font-bold text-gray-900 text-sm mb-1">Hình thức/Địa điểm</h3><p className="text-sm text-gray-600">{sessionData.place}</p></div>
              <div><h3 className="font-bold text-gray-900 text-sm mb-1">Sĩ số</h3><p className="text-sm text-gray-600">{(sessionData.current_slots || []).length} / {sessionData.max_slot}</p></div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-12 border-t pt-8">
            
            {/* 1. TUTOR VIEW */}
            {userRole !== 'STUDENT' && (
                <>
                    <button onClick={handleCancelClick} className="px-6 py-2 border border-gray-400 rounded hover:bg-gray-50 text-red-600 font-medium min-w-[120px]">Hủy Lịch</button>
                    <button onClick={() => setIsRescheduleOpen(true)} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium min-w-[120px]">Đổi Lịch</button>
                    <button onClick={() => setIsMinutesOpen(true)} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium min-w-[120px]">Biên bản</button>
                </>
            )}

            {/* 2. STUDENT VIEW */}
            {userRole === 'STUDENT' && (
                <>
                    {/* A. Đã đăng ký -> Hiện Hủy, Đổi, Đóng */}
                    {isMyBooking ? (
                        <>
                            <button onClick={handleCancelClick} className="px-6 py-2 border border-gray-400 rounded hover:bg-gray-50 text-red-600 font-medium min-w-[120px]">
                                Hủy Lịch
                            </button>
                            <button onClick={() => setIsStudentSwitchOpen(true)} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium min-w-[120px]">
                                Đổi Lịch
                            </button>
                            <button 
                                onClick={() => navigate('/meetings', { state: { activeTab: 'my-schedule' } })}
                                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-100 text-gray-700 font-medium min-w-[120px]"
                            >
                                Đóng
                            </button>
                        </>
                    ) : (
                        // B. Chưa đăng ký -> Hiện Đóng, ĐĂNG KÝ
                        <>
                            <button 
                                onClick={() => navigate('/meetings', { state: { activeTab: 'booking' } })} 
                                className="px-8 py-2 border border-gray-400 rounded hover:bg-gray-50 text-gray-700 font-medium min-w-[120px]"
                            >
                                Đóng
                            </button>
                            {/* Nút Đăng ký mới */}
                            <button 
                                onClick={handleBookClick}
                                className="px-8 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium min-w-[120px] shadow-sm"
                            >
                                Đăng ký
                            </button>
                        </>
                    )}
                </>
            )}

          </div>
        </div>
      </main>

      <RescheduleModal isOpen={isRescheduleOpen} onClose={() => setIsRescheduleOpen(false)} onConfirm={handleTutorReschedule} />
      <StudentRescheduleModal isOpen={isStudentSwitchOpen} onClose={() => setIsStudentSwitchOpen(false)} currentSession={sessionData} onConfirm={handleStudentSwitch} />
      <MinutesModal isOpen={isMinutesOpen} onClose={() => setIsMinutesOpen(false)} sessionData={sessionData} />
      <StatusModal isOpen={statusModal.isOpen} onClose={() => setStatusModal({ ...statusModal, isOpen: false })} onConfirm={statusModal.onConfirm} type={statusModal.type} title={statusModal.title} message={statusModal.message} confirmText={statusModal.confirmText} />
    </div>
  );
};

export default SessionInfoPage;