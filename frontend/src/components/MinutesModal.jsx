import React, { useState, useEffect } from 'react';
import { X, Pencil, CloudUpload, Plus, FileText, Trash2 } from 'lucide-react';

const MinutesModal = ({ isOpen, onClose, sessionData }) => {
  if (!isOpen) return null;

  // State
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [students, setStudents] = useState([]);

  // --- 1. LOAD DANH SÁCH SINH VIÊN ---
  useEffect(() => {
    if (sessionData) {
      const bookedIDs = sessionData.current_slots || [];
      const loadedStudents = bookedIDs.map((studentId) => ({
        id: studentId,
        name: `Sinh viên ${studentId}`,
        email: `${studentId}@hcmut.edu.vn`,
        result: ""
      }));
      setStudents(loadedStudents);
      setContent("");
      setFiles([]);
    }
  }, [sessionData]);

  const handleResultChange = (index, value) => {
    const newStudents = [...students];
    newStudents[index].result = value;
    setStudents(newStudents);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // --- 3. XUẤT FILE TEXT BIÊN BẢN (CẬP NHẬT TÊN FILE) ---
  const exportToTextFile = () => {
    const lines = [];
    lines.push("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM");
    lines.push("Độc lập - Tự do - Hạnh phúc");
    lines.push("----------------------------");
    lines.push("");
    lines.push(`BIÊN BẢN BUỔI TƯ VẤN: ${sessionData?.name}`);
    lines.push(`Người phụ trách (Tutor): ${sessionData?.tutor_name || "---"}`);
    lines.push(`Ngày: ${sessionData?.start_time}`);
    lines.push(`Địa điểm: ${sessionData?.place}`);
    lines.push("");
    lines.push("NỘI DUNG:");
    lines.push(content || "(Không có nội dung)");
    lines.push("");
    lines.push("DANH SÁCH SINH VIÊN & KẾT QUẢ:");
    
    if (students.length === 0) {
        lines.push("- Không có sinh viên tham gia.");
    } else {
        students.forEach((s, idx) => {
            lines.push(`${idx + 1}. ${s.name} (${s.email}) - Kết quả: ${s.result || 'Chưa chấm'}`);
        });
    }
    
    lines.push("");
    lines.push("TÀI LIỆU ĐÍNH KÈM:");
    if (files.length === 0) {
        lines.push("- Không có.");
    } else {
        files.forEach(f => lines.push(`- ${f.name}`));
    }

    const element = document.createElement("a");
    const fileContent = lines.join("\n");
    const blob = new Blob([fileContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(blob);
    
    // --- SỬA TÊN FILE TẠI ĐÂY ---
    // Lấy tên buổi học làm tên file, nếu không có thì dùng tên mặc định
    const fileName = sessionData?.name ? sessionData.name : `BienBan_${sessionData?.id}`;
    element.download = `${fileName}.txt`; 
    // -----------------------------

    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // --- 4. LƯU & TẢI XUỐNG ---
  const handleSave = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return alert("Vui lòng đăng nhập!");

    const fileNames = files.map(f => f.name).join(", ");

    const payload = {
        content: content,
        file_link: fileNames,
        student_results: students.map(s => ({
            student_id: s.id,
            score: s.result
        }))
    };

    try {
        const res = await fetch(`http://127.0.0.1:5000/appointments/${sessionData?.id}/minutes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok) {
            // A. Tải file Biên bản
            exportToTextFile();
            
            // B. Tải file đính kèm
            files.forEach((file) => {
                const fileUrl = URL.createObjectURL(file);
                const element = document.createElement("a");
                element.href = fileUrl;
                element.download = file.name;
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
                setTimeout(() => URL.revokeObjectURL(fileUrl), 100);
            });

            alert(`✅ Đã lưu! Đang tải xuống biên bản và ${files.length} tệp đính kèm.`);
            onClose();
        } else {
            alert(`❌ Lỗi Server: ${data.error}`);
        }
    } catch (e) {
        alert("Lỗi kết nối server");
    }
  };

  // Helper hiển thị ngày giờ
  const dateStr = sessionData?.start_time?.split(' ')[0] || '---';
  const timeStr = sessionData?.start_time?.split(' ')[1] || '---';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        
        {/* Header */}
        <div className="pt-6 pb-2 px-8 relative text-center">
          <h2 className="text-xl font-bold text-gray-900">Biên bản buổi tư vấn</h2>
          <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          
          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">Chủ đề</h3>
            <p className="text-sm text-gray-700">{sessionData?.name}</p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">Nội dung</h3>
            <textarea 
                className="w-full border border-gray-300 rounded p-2 text-sm h-24 focus:outline-blue-500 resize-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nhập nội dung biên bản..."
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div><span className="font-bold text-gray-900 text-sm block">Ngày</span><span className="text-sm text-gray-600">{dateStr}</span></div>
            <div><span className="font-bold text-gray-900 text-sm block">Giờ</span><span className="text-sm text-gray-600">{timeStr}</span></div>
            <div><span className="font-bold text-gray-900 text-sm block">Hình thức</span><span className="text-sm text-gray-600">{sessionData?.place}</span></div>
            <div><span className="font-bold text-gray-900 text-sm block">Sĩ số</span><span className="text-sm text-gray-600">{sessionData?.current_slots?.length || 0} / {sessionData?.max_slot}</span></div>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-2">Danh sách sinh viên</h3>
            <div className="border rounded-md overflow-hidden bg-gray-50">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700 font-bold border-b">
                  <tr>
                    <th className="px-4 py-2">Sinh viên</th>
                    <th className="px-4 py-2 text-center w-32">Điểm số</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.length > 0 ? students.map((student, index) => (
                    <tr key={index} className="bg-white">
                      <td className="px-4 py-2">
                          <div className="font-medium">{student.name}</div>
                          <div className="text-xs text-gray-500">{student.email}</div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input type="text" className="border rounded w-full text-center py-1 outline-none focus:border-blue-500" value={student.result} onChange={(e) => handleResultChange(index, e.target.value)} />
                      </td>
                    </tr>
                  )) : (
                      <tr><td colSpan="2" className="px-4 py-4 text-center text-gray-500 italic">Chưa có sinh viên.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-900 text-sm">Tài liệu đính kèm ({files.length})</h3>
                {files.length > 0 && (
                    <button onClick={() => setFiles([])} className="text-xs text-red-500 hover:underline">Xóa tất cả</button>
                )}
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors relative">
              <input 
                type="file" 
                multiple 
                onChange={handleFileChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                  <CloudUpload size={28} className="text-blue-500" />
                  <span className="text-xs text-gray-500 font-medium">Bấm hoặc Kéo thả để thêm tài liệu</span>
              </div>
            </div>

            {files.length > 0 && (
                <div className="mt-3 space-y-2">
                    {files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-100 rounded text-sm">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileText size={16} className="text-blue-600 flex-shrink-0" />
                                <span className="text-gray-700 truncate">{file.name}</span>
                                <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(0)} KB)</span>
                            </div>
                            <button 
                                onClick={() => removeFile(idx)} 
                                className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-white transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
          </div>

          <div className="flex justify-center gap-4 pt-4 border-t border-gray-100">
            <button onClick={onClose} className="px-6 py-2 border border-gray-400 rounded hover:bg-gray-50 text-gray-700 font-bold">Hủy</button>
            <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow-sm">
                Lưu & Tải xuống ({files.length + 1})
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MinutesModal;