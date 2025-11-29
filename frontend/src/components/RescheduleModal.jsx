import React, { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

const RescheduleModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  // --- 1. TẠO DỮ LIỆU GIẢ CHO DROPDOWN ---
  // Tạo danh sách 7 ngày tới để nạp vào dropdown "Ngày"
  const getNext7Days = () => {
    const dates = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const displayStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; // DD/MM/YYYY
      dates.push({ value: dateStr, label: displayStr });
    }
    return dates;
  };

  const dateOptions = getNext7Days();

  // Danh sách các ca học cố định cho dropdown "Khung giờ"
  const timeSlotOptions = [
    { label: "Ca 1 (07:00 - 09:00)", start: "07:00", end: "09:00" },
    { label: "Ca 2 (09:00 - 11:00)", start: "09:00", end: "11:00" },
    { label: "Ca 3 (13:00 - 15:00)", start: "13:00", end: "15:00" },
    { label: "Ca 4 (15:00 - 17:00)", start: "15:00", end: "17:00" },
    { label: "Ca 5 (17:00 - 19:00)", start: "17:00", end: "19:00" },
    { label: "Ca 6 (19:00 - 21:00)", start: "19:00", end: "21:00" },
  ];

  // --- STATE ---
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(''); // Lưu index của mảng timeSlotOptions
  const [mode, setMode] = useState('Online');
  const [maxSlot, setMaxSlot] = useState(0);
  const [place, setPlace] = useState('');

  // --- XỬ LÝ SUBMIT ---
  const handleSubmit = () => {
    // Validate
    if (!selectedDate || selectedSlotIndex === '' || !place) {
      alert("Vui lòng chọn đầy đủ thông tin!");
      return;
    }

    // Lấy giờ start/end từ option đã chọn
    const slot = timeSlotOptions[selectedSlotIndex];
    
    // Ghép chuỗi chuẩn Backend (YYYY-MM-DD HH:MM:SS)
    const fullStart = `${selectedDate} ${slot.start}:00`;
    const fullEnd = `${selectedDate} ${slot.end}:00`;

    onConfirm({
      start_time: fullStart,
      end_time: fullEnd,
      place: place,
      mode: mode,
      max_slot: maxSlot
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden p-8 relative">
        
        <h2 className="text-xl font-bold text-gray-900 text-center mb-8">Đổi lịch</h2>

        <div className="space-y-6">
          
          {/* Hàng 1: Ngày & Khung giờ (Dạng Dropdown Select) */}
          <div className="grid grid-cols-2 gap-8">
            {/* Dropdown Ngày */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-gray-800 text-sm">Ngày</label>
              <div className="relative">
                <select 
                  className="w-full border border-gray-400 rounded px-4 py-2.5 text-gray-700 focus:outline-none focus:border-blue-600 appearance-none bg-white cursor-pointer"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                >
                  <option value="">Chọn Ngày</option>
                  {dateOptions.map((opt, idx) => (
                    <option key={idx} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"/>
              </div>
            </div>

            {/* Dropdown Khung Giờ */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-gray-800 text-sm">Khung giờ</label>
              <div className="relative">
                <select 
                  className="w-full border border-gray-400 rounded px-4 py-2.5 text-gray-700 focus:outline-none focus:border-blue-600 appearance-none bg-white cursor-pointer"
                  value={selectedSlotIndex}
                  onChange={(e) => setSelectedSlotIndex(e.target.value)}
                >
                  <option value="">Chọn Khung giờ</option>
                  {timeSlotOptions.map((slot, idx) => (
                    <option key={idx} value={idx}>{slot.label}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"/>
              </div>
            </div>
          </div>

          {/* Hàng 2: Hình thức & Số lượng (Giữ nguyên) */}
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
              <label className="font-bold text-gray-800 text-sm">Hình thức</label>
              <div className="relative">
                <select 
                  className="w-full border border-gray-400 rounded px-4 py-2.5 text-gray-800 focus:outline-none focus:border-blue-600 appearance-none bg-white cursor-pointer"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                >
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"/>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-bold text-gray-800 text-sm text-right">Số lượng sinh viên tối đa</label>
              <div className="flex justify-end">
                <input 
                  type="number" 
                  className="w-32 border border-gray-400 rounded px-4 py-2.5 text-gray-800 focus:outline-none focus:border-blue-600 text-center"
                  value={maxSlot}
                  onChange={(e) => setMaxSlot(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Hàng 3: Địa điểm */}
          <div className="flex flex-col gap-2 pt-2">
            <input 
              type="text" 
              placeholder="Địa điểm / Link phòng" 
              className="w-full border border-gray-400 rounded px-4 py-2.5 text-gray-700 focus:outline-none focus:border-blue-600 placeholder-gray-400"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-6 pt-6">
            <button 
              onClick={onClose} 
              className="px-8 py-2 border border-gray-400 rounded text-gray-700 font-bold hover:bg-gray-50 text-sm uppercase"
            >
              Hủy
            </button>
            <button 
              onClick={handleSubmit} 
              className="px-6 py-2 bg-blue-500 text-white rounded font-bold hover:bg-blue-600 text-sm uppercase shadow-sm"
            >
              Xác Nhận
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;