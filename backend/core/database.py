# """
# core/database.py
#
# Implement HashMap-style in-memory DB (plain dicts) and helpers used by routes.
# """
from typing import Optional
from datetime import datetime
from dataclasses import asdict
from core.models import User, Appointment, Document, DocumentAccess
import bcrypt

# Global HashMap (in-memory)
db = {
    "users": {},         # user_id -> {id,name,email,password,role}
    "appointments": {},  # appt_id -> {id,tutor_id,student_id,time}
    "documents": {},     # doc_id -> Document
    "access_logs": {},   # Xem lịch sử truy cập
    "free_schedules": {},
    "scheduler_config": {
        "main": {
            "schedule_type": "DAILY",   # Mặc định chạy hàng ngày
            "interval_minutes": 60,     # Backup
            "run_time": "02:00",        # Chạy lúc 2 giờ sáng
            "day_value": "*",           
            "is_active": False
        }
    }
}


def init_db():
    """Initialize sample data."""
    def _hash(pw: str) -> str:
        return bcrypt.hashpw(pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    u1 = User(id="u1", name="Đỗ Hồng Phúc", email="tutor@hcmut.edu.vn", password=_hash("123"), role="TUTOR")
    u2 = User(id="u2", name="Duy Khang", email="student@hcmut.edu.vn", password=_hash("123"), role="STUDENT")
    u3 = User(id="u3", name="Tín", email="admin@hcmut.edu.vn", password=_hash("admin"), role="ADMIN")

    db["users"] = {
        u1.id: asdict(u1),
        u2.id: asdict(u2),
        u3.id: asdict(u3),
    }

    # --- SỬA ĐOẠN NÀY ---
    # Cập nhật theo model mới: dùng start_time/end_time thay vì time, bỏ student_id
    a1 = Appointment(
        id="a1", 
        tutor_id="u1", 
        name="Luyện thi Đại số tuyến tính",
        start_time="2025-11-26 09:00:00",
        end_time="2025-11-26 11:00:00",
        place="H6-304",
        max_slot=5,
        status="OPEN"
    )
    db["appointments"] = {a1.id: asdict(a1)}
    
    # --------------------
    # --- TÍN THÊM DỮ LIỆU MẪU CHO MODULE 3 - DOCUMENTS --- 
    d1 = Document(
        id="doc1",
        title="Slide bài giảng CNPM Chương 1",
        description="Tổng quan về quy trình phần mềm",
        uploader_id="u1",
        link="https://drive.google.com/file/d/xyz...",
        course_code="CO3001",
        created_at="2025-11-26 10:00:00"
    )

    # Nhớ chỗ này gán là phải lưu vào index trong document == id
    # dù chưa tối ưu lắm nếu id là số quá lớn ... 
    db["documents"][d1.id] = asdict(d1)
    
    d2 = Document(
        id="doc2",
        title="Giới thiệu đặc sản nem chua",
        description="Tổng quan mảnh đất trữ tình",
        uploader_id="u3", 					# Admin Tín upload 
        link="https://drive.google.com/file/d/366...",
        course_code="TH3636",
        created_at="2025-11-26 10:00:00"
    )
    db["documents"][d2.id] = asdict(d2)



    # log1 = DocumentAccess(
    #     id="log1",
    #     user_id="u1",
    #     doc_id="doc1",
    #     action="VIEW", 
    #     timestamp="2025-11-26 10:05:00"
    # )
    # db["access_logs"][log1.id] = asdict(log1)
    # --------------------


def _next_user_id() -> str:
    idx = 1
    while True:
        uid = f"u{idx}"
        if uid not in db["users"]:
            return uid
        idx += 1


def create_user(name: str, email: str, password: str, role: str = "PENDING") -> dict:
    """Create a new user (returns the created user dict). Raises ValueError if email exists."""
    if get_user_by_email(email) is not None:
        raise ValueError("Email already exists")
    uid = _next_user_id()
    # hash password before storing
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user_obj = User(id=uid, name=name, email=email, password=hashed, role=role)
    user = asdict(user_obj)
    db["users"][uid] = user
    return user


def get_user_by_email(email: str) -> Optional[dict]:
    for user in db["users"].values():
        if user.get("email") == email:
            return user
    return None


def authenticate(email: str, password: str) -> Optional[str]:
    """Return user_id if credentials match, else None."""
    u = get_user_by_email(email)
    if not u:
        return None
    stored = u.get("password")
    try:
        if stored and bcrypt.checkpw(password.encode('utf-8'), stored.encode('utf-8')):
            return u.get("id")
    except ValueError:
        return None
    return None


def set_user_role(user_id: str, role: str) -> bool:
    if user_id not in db["users"]:
        return False
    db["users"][user_id]["role"] = role
    return True


# NOTE: do not auto-initialize here to avoid double-init with reloader.
# Call `init_db()` from application factory (`create_app`) when starting the server.