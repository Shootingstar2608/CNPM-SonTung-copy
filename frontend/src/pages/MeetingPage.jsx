import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Breadcrumb from '../components/Breadcrumb';
import MeetingList from '../components/MeetingList';
import ActionCard from '../components/ActionCard';

const MeetingPage = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]); // State lưu danh sách thật
  const [loading, setLoading] = useState(false);

  // Hình ảnh minh họa (giữ nguyên)
  const imgChart = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000";
  const imgSetup = "https://images.unsplash.com/photo-1543286386-713bdd548da4?auto=format&fit=crop&q=80&w=1000";

  // --- GỌI API LẤY DANH SÁCH ---
  useEffect(() => {
    const fetchMeetings = async () => {
      setLoading(true);
      try {
        // Lấy user_id từ localStorage để chỉ hiện lịch của mình (nếu cần)
        // const userId = localStorage.getItem('user_id'); 
        // const url = userId ? `http://127.0.0.1:5000/appointments/?tutor_id=${userId}` : 'http://127.0.0.1:5000/appointments/';
        
        // Hiện tại lấy TOÀN BỘ để test cho dễ thấy
        const url = 'http://127.0.0.1:5000/appointments/';
        
        const res = await fetch(url);
        if (!res.ok) throw new Error("Không thể tải dữ liệu");
        
        const data = await res.json();
        // Backend trả về mảng, nếu lỗi thì data.error
        if (Array.isArray(data)) {
          // Đảo ngược mảng để bài mới nhất hiện lên đầu
          setMeetings(data.reverse());
        }
      } catch (err) {
        console.error("Lỗi tải lịch:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-700 pb-10">
      <Header />
      <Breadcrumb />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* Truyền biến meetings và loading vào component con */}
        {loading ? (
          <div className="text-center py-10">⏳ Đang tải danh sách...</div>
        ) : (
          <MeetingList meetings={meetings} />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ActionCard 
            title="Mở buổi tư vấn"
            imageSrc={imgChart}
            onActionClick={() => navigate('/create-session')} 
            onViewMoreClick={() => navigate('/create-session')}
          />
          <ActionCard 
            title="Thiết lập lịch rảnh"
            imageSrc={imgSetup}
            onActionClick={() => navigate('/free-schedule')} 
            onViewMoreClick={() => navigate('/free-schedule')}
          />
        </div>
      </main>
    </div>
  );
};

export default MeetingPage;