import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import StatusModal from '../components/StatusModal';

const BookingPage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Lấy ID người dùng hiện tại để lọc
  const currentUserId = localStorage.getItem('user_id'); 
  
  const selectedTutorId = localStorage.getItem('selected_tutor_id');
  const selectedTutorName = localStorage.getItem('selected_tutor_name') || "Chưa chọn giảng viên";

  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!selectedTutorId) {
        alert("Vui lòng lựa chọn Tutor trước!");
        navigate('/tutor-selection');
        return;
      }

      try {
        const res = await fetch(`http://127.0.0.1:5000/appointments/?tutor_id=${selectedTutorId}`);
        if (res.ok) {
          const data = await res.json();
          
          // --- LOGIC LỌC MỚI ---
          // 1. Phải là trạng thái OPEN
          // 2. ID của mình KHÔNG được nằm trong current_slots (tức là chưa đăng ký)
          const availableSlots = data.filter(apt => {
             const isOpen = apt.status === 'OPEN';
             const isNotBookedByMe = !apt.current_slots || !apt.current_slots.includes(currentUserId);
             return isOpen && isNotBookedByMe;
          });
          
          setAppointments(availableSlots);
        }
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [selectedTutorId, navigate, currentUserId]);

  const handleBook = async (aptId) => {
    const token = localStorage.getItem('access_token');
    if (!token) return navigate('/login');

    try {
      const res = await fetch(`http://127.0.0.1:5000/appointments/${aptId}/book`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (res.ok) {
        setStatusModal({
            isOpen: true, type: 'success', title: 'Thành công',
            message: 'Đăng ký lịch thành công!',
            onConfirm: () => {
                setStatusModal({...statusModal, isOpen: false});
                window.location.reload(); 
            }
        });
      } else {
        setStatusModal({
            isOpen: true, type: 'error', title: 'Lỗi',
            message: data.error || 'Không thể đặt lịch này.'
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return { date: '---', time: '---' };
    const [date, time] = dateStr.split(' ');
    return { date, time: time.slice(0, 5) };
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-700 pb-10">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-xs text-gray-500">
        <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate('/')}>Trang chủ</span>
        <span className="mx-2">›</span>
        <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate('/meetings')}>Quản lý buổi gặp</span>
        <span className="mx-2">›</span>
        <span className="font-medium text-gray-700">Đặt lịch Tutor</span>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Đặt lịch Tutor</h1>

        <div className="bg-gray-100 rounded-xl p-8 min-h-[500px]">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">{selectedTutorName}</h2>



                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-4 text-gray-500">Đang tải lịch...</div>
                    ) : appointments.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 italic">
                            Tutor này hiện không còn lịch hẹn nào mới mà bạn chưa đăng ký.
                        </div>
                    ) : (
                        appointments.map((item) => {
                            const start = formatDateTime(item.start_time);
                            const end = formatDateTime(item.end_time);
                            
                            return (
                                <div key={item.id} className="flex flex-wrap items-center justify-between py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors px-2 rounded">
                                    <div className="w-1/5"><span className="block text-gray-500 text-xs font-bold uppercase">Ngày</span><span className="text-gray-800 text-sm font-medium">{start.date}</span></div>
                                    <div className="w-1/5 text-center"><span className="block text-gray-500 text-xs font-bold uppercase">Giờ bắt đầu</span><span className="text-gray-800 text-sm font-medium">{start.time}</span></div>
                                    <div className="w-1/5 text-center"><span className="block text-gray-500 text-xs font-bold uppercase">Thời gian</span><span className="text-gray-800 text-sm font-medium">{start.time} - {end.time}</span></div>
                                    <div className="w-1/5 text-center"><span className="block text-gray-500 text-xs font-bold uppercase">Tuần</span><span className="text-gray-800 text-sm font-medium">--</span></div>
                                    <div className="w-1/5 text-right">
                                        <button onClick={() => handleBook(item.id)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded text-sm shadow-sm transition-colors">Xác Nhận</button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
      </main>

      <StatusModal isOpen={statusModal.isOpen} onClose={() => setStatusModal({ ...statusModal, isOpen: false })} onConfirm={statusModal.onConfirm} type={statusModal.type} title={statusModal.title} message={statusModal.message} />
    </div>
  );
};

export default BookingPage;