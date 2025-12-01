import React, { useState } from 'react';
import Header from '../components/Header';
import { ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OpenSessionPage = () => {
    const navigate = useNavigate();

    // 1. Khai báo State để lưu dữ liệu Form
    const [formData, setFormData] = useState({
        topic: '',
        content: '',
        date: '',
        timeSlot: '',
        mode: 'Online',
        maxSlot: 0,
        place: ''
    });

    const [loading, setLoading] = useState(false);

    // Hàm cập nhật state khi nhập liệu
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 2. Hàm xử lý logic Submit
    const handleSubmit = async (e) => {
        e.preventDefault(); // Ngăn reload trang
        setLoading(true);

        // --- BƯỚC 1: CHUẨN BỊ DỮ LIỆU ---
        // Backend yêu cầu: name, start_time, end_time, place, max_slot
        // Format ngày giờ: "YYYY-MM-DD HH:MM:SS"

        if (!formData.topic || !formData.date || !formData.timeSlot || !formData.place) {
            alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
            setLoading(false);
            return;
        }

        // Tách giờ từ chuỗi "09:00 - 11:00"
        // Giả sử timeSlot có dạng "HH:MM - HH:MM"
        const [startTimeStr, endTimeStr] = formData.timeSlot.split(' - ');
        
        // Ghép thành chuỗi đầy đủ: "2025-11-28 09:00:00"
        const fullStartTime = `${formData.date} ${startTimeStr}:00`;
        const fullEndTime = `${formData.date} ${endTimeStr}:00`;

        const payload = {
            name: formData.topic,           // Backend dùng 'name'
            start_time: fullStartTime,      // Backend cần format YYYY-MM-DD HH:MM:SS
            end_time: fullEndTime,
            place: formData.place,          // Nếu online thì có thể điền link Google Meet vào đây
            max_slot: parseInt(formData.maxSlot)
        };

        try {
            // Lấy Token từ LocalStorage
            const token = localStorage.getItem('access_token');
            if (!token) {
                alert("Bạn chưa đăng nhập!");
                navigate('/login');
                return;
            }

            // --- BƯỚC 2: GỌI API ---
            const response = await fetch('http://127.0.0.1:5000/appointments/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Gửi kèm Token xác thực
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                alert("✅ Tạo buổi tư vấn thành công!");
                navigate('/meetings'); // Quay về trang chủ của Tutor
            } else {
                // Xử lý lỗi từ Backend (ví dụ: trùng lịch)
                alert(`❌ Lỗi: ${data.error || 'Không thể tạo lịch'}`);
            }

        } catch (error) {
            console.error("Error creating session:", error);
            alert("❌ Lỗi kết nối tới Server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-700 pb-10">
            <Header />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-xs text-gray-500">
                <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate('/')}>Trang chủ</span>
                <span className="mx-2">›</span>
                <span className="hover:text-blue-600 cursor-pointer">Quản lý buổi gặp</span>
                <span className="mx-2">›</span>
                <span className="font-medium text-gray-700">Mở buổi tư vấn</span>
            </div>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <h1 className="text-xl font-bold text-gray-900 mb-6">Mở buổi tư vấn</h1>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    
                    {/* Form bắt đầu từ đây */}
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        
                        {/* Input: Chủ đề */}
                        <div>
                            <input 
                                name="topic"
                                value={formData.topic}
                                onChange={handleChange}
                                type="text" 
                                placeholder="Chủ đề" 
                                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                            />
                        </div>

                        {/* Textarea: Nội dung */}
                        <div>
                            <textarea 
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                rows={8}
                                placeholder="Nội dung (Mô tả chi tiết)" 
                                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 resize-none"
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            
                            {/* Cột 1: Ngày */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-800">Ngày</label>
                                <div className="relative">
                                    <select 
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Chọn Ngày</option>
                                        {/* Lưu ý: Value phải là định dạng YYYY-MM-DD để dễ ghép chuỗi */}
                                        <option value="2025-11-28">28/11/2025</option>
                                        <option value="2025-11-29">29/11/2025</option>
                                        <option value="2025-12-01">01/12/2025</option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Cột 2: Khung giờ */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-800">Khung giờ</label>
                                <div className="relative">
                                    <select 
                                        name="timeSlot"
                                        value={formData.timeSlot}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Chọn Khung giờ</option>
                                        <option value="09:00 - 11:00">09:00 - 11:00</option>
                                        <option value="14:00 - 16:00">14:00 - 16:00</option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Cột 3: Hình thức */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-800">Hình thức</label>
                                <div className="relative">
                                    <select 
                                        name="mode"
                                        value={formData.mode}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Online">Online</option>
                                        <option value="Offline">Offline</option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Cột 4: Số lượng */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-800">Số lượng SV tối đa</label>
                                <input 
                                    name="maxSlot"
                                    value={formData.maxSlot}
                                    onChange={handleChange}
                                    type="number" 
                                    min="1"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Input: Địa điểm / Link */}
                        <div>
                            <input 
                                name="place"
                                value={formData.place}
                                onChange={handleChange}
                                type="text" 
                                placeholder={formData.mode === 'Online' ? "Link phòng học (Google Meet/Zoom)" : "Địa điểm phòng học (Vd: H6-304)"}
                                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-center gap-4 pt-4">
                            <button 
                                type="button"
                                onClick={() => navigate('/meetings')}
                                className="px-8 py-2 border border-gray-400 rounded hover:bg-gray-50 text-gray-700 font-medium transition-colors"
                            >
                                Hủy
                            </button>
                            <button 
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium transition-colors shadow-sm disabled:bg-blue-300"
                            >
                                {loading ? 'Đang xử lý...' : 'Xác Nhận'}
                            </button>
                        </div>

                    </form>
                </div>
            </main>
        </div>
    );
};

export default OpenSessionPage;