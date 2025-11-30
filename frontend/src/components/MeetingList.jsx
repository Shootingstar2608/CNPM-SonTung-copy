import React from 'react';
import { Link } from 'react-router-dom';

// Thêm props: title, emptyMsg
const MeetingList = ({ meetings, title, emptyMsg }) => {
  
  const parseDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return { date: '---', time: '---' };
    const [date, time] = dateTimeStr.split(' ');
    return { date, time };
  };

  // Giá trị mặc định nếu không truyền props
  const displayTitle = title || `Danh sách buổi tư vấn (${meetings.length})`;
  const displayEmpty = emptyMsg || "Chưa có buổi tư vấn nào.";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-center text-lg font-bold text-gray-800 mb-6 border-b pb-4">
        {displayTitle}
      </h2>
      
      {meetings.length === 0 ? (
        <p className="text-center text-gray-500 italic">{displayEmpty}</p>
      ) : (
        <div className="space-y-6">
          {meetings.map((item, index) => {
            const { date, time } = parseDateTime(item.start_time);
            const endTimeObj = parseDateTime(item.end_time);
            
            return (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center text-sm border-b md:border-none pb-4 md:pb-0 last:border-0 last:pb-0 hover:bg-gray-50 p-2 rounded transition-colors">
                <div className="flex flex-col">
                  <span className="font-bold text-blue-700 text-base">{item.name}</span>
                  <span className="text-gray-500 text-xs">{date}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-600">Thời gian</span>
                  <span className="text-gray-900 font-bold">{time} - {endTimeObj.time}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-600">Địa điểm</span>
                  <span className="text-gray-900 truncate" title={item.place}>{item.place}</span>
                </div>
                <div className="flex justify-between items-center md:block text-right">
                  <Link to={`/session-info/${item.id}`} 
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