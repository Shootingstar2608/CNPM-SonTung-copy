import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import StatusModal from '../components/StatusModal';

const FreeSchedulePage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');

  // State
  const [selectedCells, setSelectedCells] = useState([]);
  const [note, setNote] = useState(''); // <--- 1. Thêm State cho Ghi chú
  const [currentWeek, setCurrentWeek] = useState(6);
  const [modalStatus, setModalStatus] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  // --- LOAD DỮ LIỆU ---
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!token) return;
      try {
        const res = await fetch(`http://127.0.0.1:5000/appointments/free-schedule?week=${currentWeek}`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          }
        });
        if (res.ok) {
          const data = await res.json();
          setSelectedCells(data.cells || []);
          setNote(data.note || ''); // <--- 2. Load ghi chú từ server
        }
      } catch (error) {
        console.error("Lỗi tải lịch:", error);
      }
    };
    fetchSchedule();
  }, [token, currentWeek]);

  // --- LƯU DỮ LIỆU ---
  const handleSave = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://127.0.0.1:5000/appointments/free-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // <--- 3. Gửi kèm note lên server
        body: JSON.stringify({ cells: selectedCells, week: currentWeek, note: note }) 
      });

      if (response.ok) {
        setModalStatus({
          isOpen: true, type: 'success', title: 'Thành công',
          message: `Dữ liệu tuần ${currentWeek} đã được lưu!`
        });
      }
    } catch (e) {
      setModalStatus({ isOpen: true, type: 'error', title: 'Lỗi', message: 'Không thể lưu.' });
    }
  };

  // Logic chuyển tuần
  const handlePrevWeek = () => { if (currentWeek > 1) setCurrentWeek(curr => curr - 1); };
  const handleNextWeek = () => { setCurrentWeek(curr => curr + 1); };

  // Logic Grid
  const periods = Array.from({ length: 15 }, (_, i) => i + 1);
  const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];
  const toggleCell = (d, p) => {
      const id = `${d}-${p}`;
      if (selectedCells.includes(id)) setSelectedCells(selectedCells.filter(x => x !== id));
      else setSelectedCells([...selectedCells, id]);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-700 pb-10">
      <Header />
      
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-xs text-gray-500">
        <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate('/')}>Trang chủ</span>
        <span className="mx-2">›</span>
        <span className="cursor-pointer hover:text-blue-600">Quản lý buổi gặp</span>
        <span className="mx-2">›</span>
        <span className="font-medium text-gray-700">Thiết lập lịch rảnh</span>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Thiết lập lịch rảnh</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              
              {/* THANH ĐIỀU HƯỚNG TUẦN */}
              <div className="flex justify-between items-center mb-4 px-4 select-none">
                <button onClick={handlePrevWeek} className="flex items-center text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors">
                  <ChevronLeft size={16} /> Tuần {currentWeek - 1}
                </button>
                <span className="font-bold text-xl text-blue-800">Tuần {currentWeek}</span>
                <button onClick={handleNextWeek} className="flex items-center text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors">
                  Tuần {currentWeek + 1} <ChevronRight size={16} />
                </button>
              </div>

              {/* Bảng Grid */}
              <div className="border border-gray-300 rounded overflow-hidden overflow-x-auto">
                <div className="min-w-[600px]">
                  <div className="grid grid-cols-8 bg-gray-50 border-b border-gray-300">
                    <div className="p-3 text-center font-bold text-sm text-gray-700 border-r border-gray-300">Tiết</div>
                    {days.map((day, index) => (
                      <div key={index} className="p-3 text-center font-bold text-sm text-gray-700 border-r border-gray-300 last:border-r-0">{day}</div>
                    ))}
                  </div>
                  {periods.map((period) => (
                    <div key={period} className="grid grid-cols-8 border-b border-gray-200 last:border-b-0 h-10">
                      <div className="flex items-center justify-center font-medium text-sm text-gray-600 border-r border-gray-300 bg-gray-50">{period}</div>
                      {days.map((day, dayIndex) => {
                        const cellId = `${dayIndex}-${period}`;
                        const isSelected = selectedCells.includes(cellId);
                        return (
                          <div 
                            key={dayIndex}
                            onClick={() => toggleCell(dayIndex, period)}
                            className={`border-r border-gray-200 last:border-r-0 cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-green-200 hover:bg-green-300' : ''}`}
                          ></div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* --- PHẦN GHI CHÚ --- */}
            <div className="w-full lg:w-64 flex flex-col gap-4">
               <div className="border border-gray-300 rounded p-2 h-full min-h-[300px] bg-white">
                 <textarea 
                    // <--- 4. Bind giá trị vào State note
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full h-full resize-none outline-none text-sm placeholder-gray-400" 
                    placeholder="Ghi chú (Tùy chọn)"
                 ></textarea>
               </div>
               <div className="flex items-center gap-2">
                  <input type="checkbox" id="repeat" className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                  <label htmlFor="repeat" className="text-sm font-bold text-gray-700">Lặp lại cho tuần sau</label>
               </div>
               <div className="flex justify-center gap-4 mt-4">
                  <button onClick={() => navigate('/')} className="px-6 py-1.5 border border-gray-400 rounded hover:bg-gray-50 text-gray-700 font-medium">Hủy</button>
                  <button onClick={handleSave} className="px-6 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium shadow-sm">Lưu</button>
               </div>
            </div>

          </div>
        </div>
      </main>
      <StatusModal isOpen={modalStatus.isOpen} onClose={() => setModalStatus({...modalStatus, isOpen:false})} type={modalStatus.type} title={modalStatus.title} message={modalStatus.message} />
    </div>
  );
};

export default FreeSchedulePage;