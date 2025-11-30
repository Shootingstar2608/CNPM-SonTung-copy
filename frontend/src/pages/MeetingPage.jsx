import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Thêm useLocation
import Header from '../components/Header';
import Breadcrumb from '../components/Breadcrumb';
import MeetingList from '../components/MeetingList';
import ActionCard from '../components/ActionCard';
import StatusModal from '../components/StatusModal';

const MeetingPage = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Hook lấy state từ điều hướng
  
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState('');
  
  const currentUserId = localStorage.getItem('user_id'); 
  const [activeTab, setActiveTab] = useState('my-schedule'); 

  // --- 1. NHẬN DIỆN TAB TỪ TRANG KHÁC (NẾU CÓ) ---
  useEffect(() => {
    if (location.state && location.state.activeTab) {
        setActiveTab(location.state.activeTab);
        // Tự động cuộn xuống phần danh sách nếu có yêu cầu mở tab
        setTimeout(() => {
            document.getElementById('meeting-list-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }
  }, [location]);

  const [isRegistered, setIsRegistered] = useState(() => {
    return localStorage.getItem('is_program_registered') === 'true';
  });

  const [selectedTutor, setSelectedTutor] = useState({
    id: localStorage.getItem('selected_tutor_id'),
    name: localStorage.getItem('selected_tutor_name')
  });

  const [statusModal, setStatusModal] = useState({ 
    isOpen: false, type: 'success', title: '', message: '', confirmText: 'OK', onConfirm: null 
  });

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    setUserRole(role ? role.toUpperCase() : '');

    const fetchMeetings = async () => {
      setLoading(true);
      try {
        let url = 'http://127.0.0.1:5000/appointments/';
        const res = await fetch(url);
        if (!res.ok) throw new Error("Không thể tải dữ liệu");
        
        const data = await res.json();
        if (Array.isArray(data)) {
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

  // --- 2. LOGIC LỌC DANH SÁCH ---
  const myBookings = meetings.filter(m => 
    m.current_slots && m.current_slots.includes(currentUserId)
  );

  const availableBookings = meetings.filter(m => {
    const notBookedYet = !m.current_slots || !m.current_slots.includes(currentUserId);
    const matchesTutor = selectedTutor.id ? m.tutor_id === selectedTutor.id : true;
    return notBookedYet && matchesTutor;
  });

  const displayedMeetings = activeTab === 'my-schedule' ? myBookings : availableBookings;

  const handleRegisterClick = () => {
    setStatusModal({
      isOpen: true, type: 'confirm', title: 'Xác nhận tham gia',
      message: 'Bạn có chắc chắn muốn đăng ký tham gia chương trình này không?',
      confirmText: 'Xác nhận',
      onConfirm: confirmRegistration
    });
  };

  const confirmRegistration = () => {
    localStorage.setItem('is_program_registered', 'true');
    setIsRegistered(true);
    setStatusModal({ ...statusModal, isOpen: false });
    setTimeout(() => {
        setStatusModal({
            isOpen: true, type: 'success', title: 'Thành công',
            message: 'Đăng ký thành công! Bạn đã có thể sử dụng các chức năng.',
            confirmText: 'OK', onConfirm: null
        });
    }, 300);
  };

  const handleFeatureClick = (action) => {
    if (!isRegistered) {
        setStatusModal({
            isOpen: true, type: 'warning', title: 'Chưa đăng ký',
            message: 'Bạn cần "Đăng ký tham gia chương trình" trước khi sử dụng tính năng này!',
            confirmText: 'Đã hiểu'
        });
        return;
    }
    action();
  };

  const imgChart = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000";
  const imgSetup = "https://images.unsplash.com/photo-1543286386-713bdd548da4?auto=format&fit=crop&q=80&w=1000";

  const studentMenu = [
    { id: 1, title: "Đăng ký tham gia chương trình", action: handleRegisterClick, image: imgChart, isRegistrationCard: true },
    { id: 2, title: "Lựa chọn Tutor", action: () => navigate('/tutor-selection'), image: imgChart },
    { id: 3, title: "Đặt lịch Tutor", action: () => navigate('/booking-tutor'), image: imgSetup },
  ];

  const visibleMenu = studentMenu.filter(item => {
      if (isRegistered && item.isRegistrationCard) return false;
      return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-700 pb-10">
      <Header />
      <Breadcrumb />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {userRole === 'STUDENT' ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-8 border-l-4 border-blue-600 pl-4">
              Menu Chức Năng Sinh Viên
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {visibleMenu.map((item) => {
                const isLocked = !isRegistered && !item.isRegistrationCard;
                return (
                  <div key={item.id} className={`h-full ${isLocked ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}>
                    <ActionCard 
                      title={item.title} imageSrc={item.image}
                      onActionClick={() => item.isRegistrationCard ? item.action() : handleFeatureClick(item.action)}
                      onViewMoreClick={() => item.isRegistrationCard ? item.action() : handleFeatureClick(item.action)}
                    />
                  </div>
                );
              })}
            </div>

            {isRegistered && (
                <div id="meeting-list-section" className="pt-12 mt-12 border-t border-gray-200">
                   
                   <div className="flex space-x-6 border-b border-gray-300 mb-6">
                      <button 
                        onClick={() => setActiveTab('my-schedule')}
                        className={`pb-3 font-bold text-lg transition-colors ${activeTab === 'my-schedule' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Các buổi đã đăng ký ({myBookings.length})
                      </button>
                      <button 
                        onClick={() => setActiveTab('booking')}
                        className={`pb-3 font-bold text-lg transition-colors ${activeTab === 'booking' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Đăng ký mới
                      </button>
                   </div>

                   <div className="flex justify-between items-end mb-4">
                       <h3 className="font-bold text-gray-800">
                          {activeTab === 'my-schedule' 
                            ? "Danh sách các buổi tư vấn bạn đã đăng ký tham gia:" 
                            : selectedTutor.name 
                                ? `Các buổi hẹn mới của Tutor: ${selectedTutor.name}`
                                : "Tất cả các buổi hẹn mới hiện có"
                          }
                       </h3>
                       
                       {activeTab === 'booking' && selectedTutor.name && (
                         <button 
                           onClick={() => {
                             localStorage.removeItem('selected_tutor_id');
                             localStorage.removeItem('selected_tutor_name');
                             setSelectedTutor({ id: null, name: '' });
                           }}
                           className="text-sm text-red-500 hover:underline cursor-pointer"
                         >
                           Xóa bộ lọc Tutor
                         </button>
                       )}
                   </div>

                   {loading ? (
                     <div className="text-center py-10">⏳ Đang tải dữ liệu...</div>
                   ) : (
                     <MeetingList 
                        meetings={displayedMeetings} 
                        title={activeTab === 'my-schedule' ? `Danh sách đã đăng ký (${displayedMeetings.length})` : `Danh sách các buổi tư vấn mới (${displayedMeetings.length})`}
                        emptyMsg={activeTab === 'my-schedule' ? "Bạn chưa đăng ký buổi nào." : "Chưa có buổi tư vấn mới nào."}
                     />
                   )}
                </div>
            )}
          </>
        ) : (
          /* Tutor View - Giữ nguyên */
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-8 border-l-4 border-blue-600 pl-4">Quản lý buổi gặp</h1>
            {loading ? <div className="text-center py-10">⏳ Đang tải...</div> : <MeetingList meetings={meetings} />}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <ActionCard title="Mở buổi tư vấn" imageSrc={imgChart} onActionClick={() => navigate('/create-session')} onViewMoreClick={() => navigate('/create-session')} />
              <ActionCard title="Thiết lập lịch rảnh" imageSrc={imgSetup} onActionClick={() => navigate('/free-schedule')} onViewMoreClick={() => navigate('/free-schedule')} />
            </div>
          </>
        )}

      </main>

      <StatusModal isOpen={statusModal.isOpen} onClose={() => setStatusModal({ ...statusModal, isOpen: false })} onConfirm={statusModal.onConfirm} type={statusModal.type} title={statusModal.title} message={statusModal.message} confirmText={statusModal.confirmText} />
    </div>
  );
};

export default MeetingPage;