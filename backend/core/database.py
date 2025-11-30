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

    u_nva = User(
        id="u_nva", 
        name="Nguyễn Ngọc Tôn", 
        email="ton.nguyen1411030723@hcmut.edu.vn", 
        password=_hash("123"), 
        role="TUTOR"
    )
    db["users"][u_nva.id] = asdict(u_nva)

    # --- SỬA ĐOẠN NÀY ---
    # Cập nhật theo model mới: dùng start_time/end_time thay vì time, bỏ student_id
    a1 = Appointment(
        id="a1", 
        tutor_id="u1",  # <--- Sửa ID cho đúng ông Nguyễn Văn A
        name="Luyện thi Đại số tuyến tính",
        start_time="2025-11-26 09:00:00",
        end_time="2025-11-26 11:00:00",
        place="H6-304",
        max_slot=5,
        status="OPEN"
    )
    # Lưu a1 vào DB (Dùng key id để không bị ghi đè)
    db["appointments"][a1.id] = asdict(a1) 

    # --- TẠO BUỔI 2 ---
    a2 = Appointment(
        id="a2", 
        tutor_id="u1", # <--- Sửa ID cho đúng
        name="Luyện thi Đại số tuyến tính (Buổi 2)",
        start_time="2025-12-06 14:00:00",
        end_time="2025-12-06 16:00:00",
        place="H6-304",
        max_slot=5,
        status="OPEN"
    )
    # Lưu a2 vào DB
    db["appointments"][a2.id] = asdict(a2)

    a_nva = Appointment(
        id="apt_nva_1", 
        tutor_id="u_nva", 
        name="Họp nghiên cứu Khoa học",
        start_time="2025-12-05 14:00:00",
        end_time="2025-12-05 16:00:00",
        place="Phòng H6-301",
        max_slot=10,
        status="OPEN"
    )
    db["appointments"][a_nva.id] = asdict(a_nva)

    a_nvb = Appointment(
        id="apt_nva_2", 
        tutor_id="u_nva", 
        name="Công nghệ phần mềm",
        start_time="2025-12-06 14:00:00",
        end_time="2025-12-06 16:00:00",
        place="Phòng H6-301",
        max_slot=90,
        status="OPEN"
    )
    db["appointments"][a_nvb.id] = asdict(a_nvb)

    # --------------------
    # --- TÍN THÊM DỮ LIỆU MẪU CHO MODULE 3 - DOCUMENTS ---
    # --- 3. DOCUMENTS (Sinh tự động 40+ tài liệu) ---

    mock_courses = [
        ("CH1003", "Hóa đại cương"),
        ("SP1037", "Tư tưởng Hồ Chí Minh"),
        ("CO2001", "Kỹ năng Chuyên nghiệp cho Kỹ sư"),
        ("CO3001", "Công nghệ Phần mềm"),
        ("CO3005", "Nguyên lý Ngôn ngữ Lập trình"),
        ("CO3093", "Mạng máy tính"),
        ("CO3011", "Quản lý Dự án Phần mềm"),
        ("CO3013", "Xây dựng Chương trình Dịch"),
        ("CO3015", "Kiểm tra Phần mềm"),
        ("CO3017", "Kiến trúc Phần mềm"),
        ("CO3021", "Hệ Quản trị Cơ sở Dữ Liệu"),
        ("CO3023", "CSDL Phân tán và Hướng đối tượng"),
        ("CO3027", "Thương mại Điện tử"),
        ("CO3029", "Khai phá Dữ liệu"),
        ("CO3031", "Phân tích và Thiết kế Giải Thuật"),
        ("CO3033", "Bảo mật Hệ thống Thông tin"),
        ("CO3035", "Hệ thời gian thực"),
        ("CO3037", "Phát triển Ứng dụng IoT"),
        ("CO3041", "Hệ thống Thông minh"),
        ("CO3043", "Phát triển Ứng dụng Di động"),
        ("CO3045", "Lập trình Game"),
        ("CO3047", "Mạng máy tính nâng cao"),
        ("CO3049", "Lập trình Web"),
        ("CO3051", "Hệ thống thiết bị di động"),
        ("CO3057", "Xử lý Ảnh số và Thị giác Máy tính"),
        ("CO3059", "Đồ họa Máy tính"),
        ("CO3061", "Nhập môn Trí tuệ Nhân tạo"),
        ("CO3065", "Công nghệ Phần mềm Nâng cao"),
        ("CO3067", "Tính toán Song song"),
        ("CO3069", "Mật mã và An ninh mạng"),
        ("CO3071", "Hệ phân bố"),
        ("CO3083", "Mật mã học và Mã hóa Thông tin"),
        ("CO3085", "Xử lý Ngôn ngữ Tự nhiên"),
        ("CO3089", "Chủ đề Nâng cao KHMT"),
        ("CO3101", "Đồ án Tổng hợp - AI"),
        ("CO3103", "Đồ án Tổng hợp - CNPM"),
        ("CO3105", "Đồ án Tổng hợp - HTTT"),
        ("CO3109", "Thực tập Đồ án Đa ngành - CNPM"),
        ("CO4031", "Kho dữ Liệu và Hỗ trợ Quyết định"),
        ("CO4033", "Phân tích Dữ liệu lớn"),
        ("TH3636", "Đặc sản Nem chua")  # Giữ lại môn cũ của bạn
    ]

    d1 = Document(
        id="doc1",
        title="Slide bài giảng CNPM Chương 1",
        description="Tổng quan về quy trình phần mềm",
        uploader_id="u1",
        link="https://drive.google.com/file/d/xyz...",
        course_code="CO3001",
        created_at="2025-11-26 10:00:00"
    )
    db["documents"][d1.id] = asdict(d1)

    d2 = Document(
        id="doc2",
        title="Giới thiệu đặc sản nem chua",
        description="Tổng quan mảnh đất trữ tình",
        uploader_id="u3",
        link="https://drive.google.com/file/d/366...",
        course_code="TH3636",
        created_at="2025-11-26 10:00:00"
    )
    db["documents"][d2.id] = asdict(d2)

    # Vòng lặp sinh thêm 40 tài liệu từ danh sách trên
    for i, (code, name) in enumerate(mock_courses, start=3):
        doc_id = f"doc{i}"
        # Xen kẽ người upload để đa dạng dữ liệu
        uploader = "u1" if i % 2 == 0 else "u3"

        new_doc = Document(
            id=doc_id,
            title=f"Tài liệu ôn tập {name}",
            description=f"Tổng hợp kiến thức, đề thi các năm môn {name} - HK232.",
            uploader_id=uploader,
            link=f"https://drive.google.com/file/d/mock_link_{doc_id}",
            course_code=code,
            created_at="2025-11-26 10:00:00"
        )
        db["documents"][doc_id] = asdict(new_doc)



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