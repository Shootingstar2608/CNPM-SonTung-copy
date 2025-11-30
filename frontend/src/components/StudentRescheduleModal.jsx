import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const StudentRescheduleModal = ({ isOpen, onClose, currentSession, onConfirm }) => {
  if (!isOpen || !currentSession) return null;

  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Lấy ID người dùng để lọc
  const currentUserId = localStorage.getItem('user_id');

  useEffect(() => {
    const fetchTutorSlots = async () => {
      setLoading(true);
      try {
        const tutorId = currentSession.tutor_id;
        const res = await fetch(`http://127.0.0.1:5000/appointments/?tutor_id=${tutorId}`);
        if (res.ok) {
          const data = await res.json();
          
          // --- LOGIC LỌC: CHỈ HIỆN BUỔI CHƯA ĐĂNG KÝ ---
          const others = data.filter(apt => 
            // 1. Phải là OPEN
            apt.status === 'OPEN' && 
            // 2. Không phải buổi hiện tại đang muốn đổi
            apt.id !== currentSession.id &&
            // 3. Mình CHƯA đăng ký buổi đó (tránh đổi sang buổi mình cũng đang học)
            (!apt.current_slots || !apt.current_slots.includes(currentUserId))
          );
          
          setAvailableSlots(others);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTutorSlots();
  }, [currentSession, currentUserId]);

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">Chọn lịch hẹn mới của Tutor</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Đang tìm lịch trống...</div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-8 text-gray-500 italic">
              Tutor này hiện không còn buổi hẹn nào mới mà bạn chưa đăng ký.
            </div>
          ) : (
            <div className="space-y-4">
              {availableSlots.map(slot => (
                <div key={slot.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-blue-700">{slot.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {slot.start_time} <span className="mx-2">|</span> {slot.place}
                    </p>
                  </div>
                  <button 
                    onClick={() => onConfirm(slot.id)}
                    className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    Chuyển sang buổi này
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
          <button onClick={onClose} className="text-gray-600 font-bold hover:text-gray-900 text-sm">Đóng</button>
        </div>
      </div>
    </div>
  );
};

export default StudentRescheduleModal;