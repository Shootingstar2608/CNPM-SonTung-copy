# backend/core/models.py
from dataclasses import dataclass, asdict, field
from typing import Optional, List

@dataclass
class User:
    id: str
    name: str
    email: str
    password: str
    role: str
    # THÊM: Lưu danh sách các mã lịch hẹn đã đặt (dành cho Student)
    # field(default_factory=list) giúp tạo list rỗng mặc định khi tạo user mới
    booked_appointments: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)

@dataclass
class Role:
    name: str

@dataclass
class Appointment:
    id: str
    tutor_id: str
    name: str = "Buổi học"
    start_time: str = ""
    end_time: str = ""
    place: str = "Online"
    max_slot: int = 1
    status: str = "OPEN"
    current_slots: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class Document:
    id: str
    title: str
    description: str
    uploader_id: str
    link: str
    course_code: str
    created_at: str

    def to_dict(self) -> dict:
        return asdict(self)

# Đây là class dùng để lưu lại lịch sử truy cập của từng user 
# Lưu ý: Chỉ những hành động tải tài liệu (UPLOAD), gửi(SENT), nhận(RECEIVED) 
# và XEM CHI TIẾT 1 TÀI LIỆU(VIEW) mới được lưu vào lịch sử  
# Xem toàm bộ tài liệu thì ko ghi tránh gây rác lịch sử 
@dataclass
class DocumentAccess:
    id: str
    user_id: str    # người thực hiện hành động
    doc_id: str
    action: str     # 'VIEW', 'SEND', 'RECEIVE' 
                    # 'UPLOAD' - dành riêng cho role TUTOR 
    timestamp: str
    partner_id: str      # người bị tác động bới hành động của user_id 
    def to_dict(self) -> dict:
        return asdict(self)