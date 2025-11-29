"""Business logic for scheduling (appointments).

This module contains the core operations separated from HTTP routes so they
can be unit-tested and reused. It uses the in-memory `db` from
`core.database` and ensures simple thread-safety for write operations.
"""
from datetime import datetime
import threading
import uuid
from typing import Optional, List, Dict

from core.database import db
from core.models import Appointment

# Simple lock to avoid race conditions on the in-memory `db`.
_lock = threading.Lock()


class LogicError(Exception):
	"""Raised when a business rule fails."""
	def __init__(self, message: str, status_code: int = 400):
		super().__init__(message)
		self.message = message
		self.status_code = status_code


def _parse_time(time_str: str) -> datetime:
	try:
		return datetime.strptime(time_str, "%Y-%m-%d %H:%M:%S")
	except Exception:
		raise LogicError("Sai định dạng ngày giờ (YYYY-MM-DD HH:MM:SS)", 400)


def create_appointment(tutor_id: str, name: str, start_str: str, end_str: str, place: str, max_slot: int) -> Dict:
	start = _parse_time(start_str)
	end = _parse_time(end_str)

	if start >= end:
		raise LogicError("Thời gian kết thúc phải sau thời gian bắt đầu", 400)

	try:
		max_slot = int(max_slot)
	except Exception:
		raise LogicError("max_slot phải là số nguyên", 400)
	if max_slot <= 0:
		raise LogicError("max_slot phải lớn hơn 0", 400)

	# Check overlapping for same tutor
	for apt in db.get("appointments", {}).values():
		if apt.get("status") == "CANCELLED":
			continue
		if apt.get("tutor_id") != tutor_id:
			continue

		exist_start = _parse_time(apt.get("start_time"))
		exist_end = _parse_time(apt.get("end_time"))
		if (start < exist_end) and (end > exist_start):
			raise LogicError(f'Bị trùng lịch với buổi: {apt.get("name")}', 409)

	apt_id = str(uuid.uuid4())
	new_apt = Appointment(
		id=apt_id,
		tutor_id=tutor_id,
		name=name,
		start_time=start_str,
		end_time=end_str,
		place=place,
		max_slot=max_slot,
	)
	with _lock:
		db.setdefault("appointments", {})
		db["appointments"][apt_id] = new_apt.to_dict()

	return db["appointments"][apt_id]


def cancel_appointment(apt_id: str, user_id: str) -> Dict:
	appts = db.get("appointments", {})
	if apt_id not in appts:
		raise LogicError("Không tìm thấy lịch", 404)

	apt = appts[apt_id]
	if apt.get("tutor_id") != user_id:
		raise LogicError("Không có quyền xóa lịch này", 403)

	with _lock:
		apt["status"] = "CANCELLED"

	return apt


def book_appointment(apt_id: str, student_id: str) -> Dict:
	appts = db.get("appointments", {})
	if apt_id not in appts:
		raise LogicError("Lịch không tồn tại", 404)

	apt = appts[apt_id]
	if apt.get("status") != "OPEN":
		raise LogicError("Lịch này không khả dụng", 400)

	if student_id in apt.get("current_slots", []):
		raise LogicError("Bạn đã đặt lịch này rồi", 400)

	if len(apt.get("current_slots", [])) >= apt.get("max_slot", 0):
		raise LogicError("Lịch đã đầy", 400)

	cur_start = _parse_time(apt.get("start_time"))
	cur_end = _parse_time(apt.get("end_time"))
	for other in appts.values():
		if other.get("status") != "OPEN":
			continue
		if student_id not in other.get("current_slots", []):
			continue
		other_start = _parse_time(other.get("start_time"))
		other_end = _parse_time(other.get("end_time"))
		if (cur_start < other_end) and (cur_end > other_start):
			raise LogicError(f'Bạn bị trùng giờ với lịch {other.get("name")}', 409)

	with _lock:
		apt.setdefault("current_slots", [])
		apt["current_slots"].append(student_id)

		users = db.setdefault("users", {})
		if student_id in users:
			user = users[student_id]
			b = user.setdefault("booked_appointments", [])
			if apt_id not in b:
				b.append(apt_id)
	return apt


def list_appointments(tutor_id: Optional[str] = None) -> List[Dict]:
    res = []
    users = db.get("users", {}) # Lấy danh sách user để tra cứu tên
    
    for apt in db.get("appointments", {}).values():
        if apt.get("status") == "CANCELLED":
            continue
        if tutor_id and apt.get("tutor_id") != tutor_id:
            continue
        
        # Copy ra dict mới để không ảnh hưởng dữ liệu gốc
        apt_data = apt.copy()
        
        # --- THÊM TÊN TUTOR ---
        tutor = users.get(apt.get("tutor_id"))
        apt_data["tutor_name"] = tutor["name"] if tutor else "Unknown Tutor"
        # ----------------------

        res.append(apt_data)
    return res


def cancel_student_appointment(apt_id: str, student_id: str) -> Dict:
	appts = db.get("appointments", {})
	if apt_id not in appts:
		raise LogicError("Lịch không tồn tại", 404)

	apt = appts[apt_id]
	if apt.get("status") == "CANCELLED":
		raise LogicError("Buổi đã bị hủy; không thể huỷ đặt", 400)

	if student_id not in apt.get("current_slots", []):
		raise LogicError("Bạn chưa đặt lịch này", 400)

	try:
		start = _parse_time(apt.get("start_time"))
		if datetime.now() >= start:
			raise LogicError("Không thể huỷ sau khi buổi học đã bắt đầu", 400)
	except LogicError:
		raise

	with _lock:
		slots = apt.setdefault("current_slots", [])
		if student_id in slots:
			slots.remove(student_id)

		users = db.setdefault("users", {})
		if student_id in users:
			user = users[student_id]
			b = user.setdefault("booked_appointments", [])
			if apt_id in b:
				b.remove(apt_id)

	return apt

# Đổi lịch: Cập nhật giờ, địa điểm, hình thức và số lượng
def reschedule_appointment(apt_id: str, tutor_id: str, new_start_str: str, new_end_str: str, new_place: str, new_mode: str = None, new_max_slot: int = None) -> Dict:
    """Đổi lịch: Cập nhật giờ, địa điểm, hình thức và số lượng"""
    appts = db.get("appointments", {})
    if apt_id not in appts:
        raise LogicError("Không tìm thấy lịch", 404)

    apt = appts[apt_id]
    if apt.get("tutor_id") != tutor_id:
        raise LogicError("Không có quyền sửa lịch này", 403)

    if apt.get("status") == "CANCELLED":
        raise LogicError("Không thể đổi lịch đã hủy", 400)

    start = _parse_time(new_start_str)
    end = _parse_time(new_end_str)
    if start >= end:
        raise LogicError("Thời gian kết thúc phải sau thời gian bắt đầu", 400)

    # Check overlapping (Trừ chính nó ra)
    for other_id, other_apt in appts.items():
        if other_id == apt_id: continue
        if other_apt.get("status") == "CANCELLED": continue
        if other_apt.get("tutor_id") != tutor_id: continue

        exist_start = _parse_time(other_apt.get("start_time"))
        exist_end = _parse_time(other_apt.get("end_time"))
        
        if (start < exist_end) and (end > exist_start):
            raise LogicError(f'Thời gian mới bị trùng với buổi: {other_apt.get("name")}', 409)

    with _lock:
        apt["start_time"] = new_start_str
        apt["end_time"] = new_end_str
        apt["place"] = new_place
        
        # Cập nhật thêm Hình thức (mode)
        if new_mode:
            apt["mode"] = new_mode
            
        # Cập nhật thêm Số lượng (max_slot)
        if new_max_slot is not None:
            try:
                new_val = int(new_max_slot)
                # (Tùy chọn) Có thể check nếu new_val < số lượng đã book
                apt["max_slot"] = new_val
            except:
                pass
    
    return apt
# Lưu biên bản buổi học (minutes)
def save_minutes(apt_id: str, tutor_id: str, content: str, student_results: list, file_link: str) -> Dict:
    appts = db.get("appointments", {})
    if apt_id not in appts:
        raise LogicError("Không tìm thấy buổi học", 404)
    
    apt = appts[apt_id]
    if apt.get("tutor_id") != tutor_id:
        raise LogicError("Bạn không phải là Tutor của buổi này", 403)

    # Khởi tạo kho lưu minutes nếu chưa có
    if "minutes" not in db:
        db["minutes"] = {}

    # Lưu biên bản
    minutes_data = {
        "apt_id": apt_id,
        "content": content,
        "student_results": student_results, # List các object { student_id, score, note }
        "file_link": file_link,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    db["minutes"][apt_id] = minutes_data
    return minutes_data