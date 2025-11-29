import React, { useState } from 'react';
import Header from '../components/Header';
import { Link, useNavigate } from 'react-router-dom';
import { CloudUpload, ArrowLeft } from 'lucide-react';
import StatusModal from '../components/StatusModal';

// --- DANH SÁCH MÔN HỌC ĐỒNG BỘ ---
const MOCK_COURSES = [
    { code: "GENERAL", name: "Tài liệu chung" },
    { code: "CH1003", name: "Hóa đại cương" },
    { code: "SP1037", name: "Tư tưởng Hồ Chí Minh" },
    { code: "CO2001", name: "Kỹ năng Chuyên nghiệp cho Kỹ sư" },
    { code: "CO3001", name: "Công nghệ Phần mềm" },
    { code: "CO3005", name: "Nguyên lý Ngôn ngữ Lập trình" },
    { code: "CO3093", name: "Mạng máy tính" },
    { code: "CO3011", name: "Quản lý Dự án Phần mềm" },
    { code: "CO3013", name: "Xây dựng Chương trình Dịch" },
    { code: "CO3015", name: "Kiểm tra Phần mềm" },
    { code: "CO3017", name: "Kiến trúc Phần mềm" },
    { code: "CO3021", name: "Hệ Quản trị Cơ sở Dữ Liệu" },
    { code: "CO3023", name: "CSDL Phân tán và Hướng đối tượng" },
    { code: "CO3027", name: "Thương mại Điện tử" },
    { code: "CO3029", name: "Khai phá Dữ liệu" },
    { code: "CO3031", name: "Phân tích và Thiết kế Giải Thuật" },
    { code: "CO3033", name: "Bảo mật Hệ thống Thông tin" },
    { code: "CO3035", name: "Hệ thời gian thực" },
    { code: "CO3037", name: "Phát triển Ứng dụng IoT" },
    { code: "CO3041", name: "Hệ thống Thông minh" },
    { code: "CO3043", name: "Phát triển Ứng dụng Di động" },
    { code: "CO3045", name: "Lập trình Game" },
    { code: "CO3047", name: "Mạng máy tính nâng cao" },
    { code: "CO3049", name: "Lập trình Web" },
    { code: "CO3051", name: "Hệ thống thiết bị di động" },
    { code: "CO3057", name: "Xử lý Ảnh số và Thị giác Máy tính" },
    { code: "CO3059", name: "Đồ họa Máy tính" },
    { code: "CO3061", name: "Nhập môn Trí tuệ Nhân tạo" },
    { code: "CO3065", name: "Công nghệ Phần mềm Nâng cao" },
    { code: "CO3067", name: "Tính toán Song song" },
    { code: "CO3069", name: "Mật mã và An ninh mạng" },
    { code: "CO3071", name: "Hệ phân bố" },
    { code: "CO3083", name: "Mật mã học và Mã hóa Thông tin" },
    { code: "CO3085", name: "Xử lý Ngôn ngữ Tự nhiên" },
    { code: "CO3089", name: "Chủ đề Nâng cao KHMT" },
    { code: "CO3101", name: "Đồ án Tổng hợp - AI" },
    { code: "CO3103", name: "Đồ án Tổng hợp - CNPM" },
    { code: "CO3105", name: "Đồ án Tổng hợp - HTTT" },
    { code: "CO3109", name: "Thực tập Đồ án Đa ngành - CNPM" },
    { code: "CO4031", name: "Kho dữ Liệu và Hỗ trợ Quyết định" },
    { code: "CO4033", name: "Phân tích Dữ liệu lớn" },
    { code: "TH3636", name: "Đặc sản Nem chua" }
];

const ResourcePage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');

  // State form
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    course_code: '',
    description: ''
  });

  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  const handleUpload = async () => {
    // 1. Validate Client-side
    if (!formData.title || !formData.link || !formData.course_code) {
      setStatusModal({
        isOpen: true, type: 'error', title: 'Thiếu thông tin',
        message: 'Vui lòng nhập Tiêu đề, Link và chọn Môn học.'
      });
      return;
    }

    try {
      // 2. Gọi API Upload
      const response = await fetch('http://127.0.0.1:5000/library/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setStatusModal({
          isOpen: true, type: 'success', title: 'Thành công',
          message: 'Tài liệu đã được đăng tải lên hệ thống!'
        });
        // Reset form
        setFormData({ title: '', link: '', course_code: '', description: '' });
      } else {
        setStatusModal({
          isOpen: true, type: 'error', title: 'Lỗi',
          message: data.error || 'Có lỗi xảy ra khi đăng tải.'
        });
      }
    } catch (err) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Lỗi kết nối', message: 'Không thể kết nối đến server.' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-700 pb-10">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-xs text-gray-500">
        <Link to="/" className="hover:text-blue-600">Trang chủ</Link>
        <span className="mx-2">›</span>
        <Link to="/resources" className="hover:text-blue-600">Tài liệu học tập</Link>
        <span className="mx-2">›</span>
        <span className="font-medium text-gray-700">Đăng tải tài liệu</span>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* NÚT QUAY LẠI */}
        <button
            onClick={() => navigate('/resources')}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-4 transition-colors font-medium"
        >
            <ArrowLeft size={20} /> Quay lại Menu
        </button>

        <h1 className="text-xl font-bold text-gray-900 mb-6">Đăng Tải Tài Liệu (Dành cho Tutor)</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
            {/* Input: Tiêu đề */}
            <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Tiêu đề tài liệu <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    placeholder="VD: Slide bài giảng Chương 1..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                />
            </div>

            {/* Input: Link & Môn học */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">Link tài liệu (Drive/Dropbox) <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        placeholder="https://..."
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.link}
                        onChange={e => setFormData({...formData, link: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">Môn học / Chuyên mục <span className="text-red-500">*</span></label>

                    {/* DROPDOWN MÔN HỌC (ĐÃ CẬP NHẬT) */}
                    <select
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={formData.course_code}
                        onChange={e => setFormData({...formData, course_code: e.target.value})}
                    >
                        <option value="">-- Chọn môn học --</option>
                        {MOCK_COURSES.map((course) => (
                            <option key={course.code} value={course.code}>
                                {course.code} - {course.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Input: Mô tả */}
            <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Mô tả chi tiết</label>
                <textarea
                    rows={4}
                    placeholder="Nhập nội dung tóm tắt về tài liệu..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                ></textarea>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-gray-100 gap-4">
                <button
                    onClick={() => navigate('/resources')}
                    className="px-6 py-2 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    Hủy
                </button>
                <button
                    onClick={handleUpload}
                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2"
                >
                    <CloudUpload size={18} /> Đăng Tải
                </button>
            </div>
        </div>
      </main>

      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
      />
    </div>
  );
};

export default ResourcePage;
