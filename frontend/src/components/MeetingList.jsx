import React from 'react';
import { Link } from 'react-router-dom';

const MeetingList = ({ meetings }) => {
  
  // Hàm tách ngày giờ từ chuỗi "YYYY-MM-DD HH:MM:SS"
  const parseDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return { date: '---', time: '---' };
    const [date, time] = dateTimeStr.split(' ');
    return { date, time };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-center text-lg font-bold text-gray-800 mb-6 border-b pb-4">
        Danh sách buổi tư vấn ({meetings.length})
      </h2>
      
      {meetings.length === 0 ? (
        <p className="text-center text-gray-500 italic">Chưa có buổi tư vấn nào.</p>
      ) : (
        <div className="space-y-6">
          {meetings.map((item, index) => {
            const { date, time } = parseDateTime(item.start_time);
            // Tính thời gian kết thúc để hiển thị (Ví dụ: 09:00 - 11:00)
            const endTimeObj = parseDateTime(item.end_time);
            
            return (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center text-sm border-b md:border-none pb-4 md:pb-0 last:border-0 last:pb-0 hover:bg-gray-50 p-2 rounded transition-colors">
                
                {/* Cột 1: Chủ đề & Ngày */}
                <div className="flex flex-col">
                  <span className="font-bold text-blue-700 text-base">{item.name}</span>
                  <span className="text-gray-500 text-xs">{date}</span>
                </div>

                {/* Cột 2: Thời gian */}
                <div className="flex flex-col">
                  <span className="font-medium text-gray-600">Thời gian</span>
                  <span className="text-gray-900 font-bold">{time} - {endTimeObj.time}</span>
                </div>

                {/* Cột 3: Địa điểm / Hình thức */}
                <div className="flex flex-col">
                  <span className="font-medium text-gray-600">Địa điểm</span>
                  <span className="text-gray-900 truncate" title={item.place}>{item.place}</span>
                </div>

                {/* Cột 4: Nút bấm */}
                <div className="flex justify-between items-center md:block text-right">
                  <Link to={`/session-info/${item.id}`} // <--- SỬA DÒNG NÀY (Dùng dấu backtick ` và ${item.id})
                    className="text-blue-500 hover:underline text-sm font-medium bg-blue-50 px-3 py-1 rounded">
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MeetingList;