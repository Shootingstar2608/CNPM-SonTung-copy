from flask import Blueprint, request, jsonify, g
from datetime import datetime
import uuid

from core.database import db
from core.models import Appointment
from core.security import require_role

bp = Blueprint('appointments', __name__, url_prefix='/appointments')

# Helper: Chuyển string sang datetime để so sánh
def parse_time(time_str):
    # Giả sử format gửi lên là "2023-12-01 09:00:00"
    return datetime.strptime(time_str, "%Y-%m-%d %H:%M:%S")

# --- API CHO TUTOR ---

@bp.route('/', methods=['POST'])
@require_role('TUTOR')
def create_appointment():
    """
    Tương đương: Tutor.open_apt() trong file tutor.py
    """
    data = request.get_json()
    tutor_id = g.user_id
    
    # 1. Lấy dữ liệu từ Client
    name = data.get('name')
    start_str = data.get('start_time')
    end_str = data.get('end_time')
    place = data.get('place')
    max_slot = data.get('max_slot', 1)

    if not all([name, start_str, end_str, place]):
        return jsonify({'error': 'Thiếu thông tin bắt buộc'}), 400

    try:
        new_start = parse_time(start_str)
        new_end = parse_time(end_str)
        
        if new_start >= new_end:
             return jsonify({'error': 'Thời gian kết thúc phải sau thời gian bắt đầu'}), 400
             
        # 2. Logic kiểm tra trùng lịch (Logic từ schedule.py -> add_appointment)
        # Duyệt qua tất cả lịch trong DB để xem có bị chồng chéo không
        for apt_data in db['appointments'].values():
            # Chỉ check nếu lịch chưa bị hủy
            if apt_data.get('status') == 'CANCELLED':
                continue
                
            # Nếu trùng địa điểm hoặc trùng người dạy thì mới check time
            # Ở đây mình check trùng người dạy (Tutor không thể phân thân)
            if apt_data['tutor_id'] == tutor_id:
                exist_start = parse_time(apt_data['start_time'])
                exist_end = parse_time(apt_data['end_time'])
                
                # Công thức check overlap: (StartA < EndB) and (EndA > StartB)
                is_overlapping = (new_start < exist_end) and (new_end > exist_start)
                
                if is_overlapping:
                    return jsonify({
                        'error': f'Bị trùng lịch với buổi: {apt_data["name"]}'
                    }), 409

        # 3. Tạo và lưu vào DB
        apt_id = str(uuid.uuid4())
        new_apt = Appointment(
            id=apt_id,
            tutor_id=tutor_id,
            name=name,
            start_time=start_str,
            end_time=end_str,
            place=place,
            max_slot=int(max_slot)
        )
        
        db['appointments'][apt_id] = new_apt.to_dict()
        
        return jsonify({'message': 'Tạo lịch thành công', 'data': new_apt.to_dict()}), 201

    except ValueError:
        return jsonify({'error': 'Sai định dạng ngày giờ (YYYY-MM-DD HH:MM:SS)'}), 400


@bp.route('/<apt_id>', methods=['DELETE'])
@require_role('TUTOR')
def cancel_appointment(apt_id):
    """
    Tương đương: Tutor.cancel_apt() -> Schedule.delete_appointment()
    """
    if apt_id not in db['appointments']:
        return jsonify({'error': 'Không tìm thấy lịch'}), 404
    
    apt = db['appointments'][apt_id]
    
    # Chỉ chủ sở hữu mới được xóa
    if apt['tutor_id'] != g.user_id:
        return jsonify({'error': 'Không có quyền xóa lịch này'}), 403

    # Cập nhật trạng thái thay vì xóa hẳn (để giữ lịch sử)
    apt['status'] = 'CANCELLED'
    return jsonify({'message': 'Đã hủy buổi hẹn'}), 200


# --- API CHO STUDENT ---

@bp.route('/<apt_id>/book', methods=['POST'])
@require_role('STUDENT')
def book_appointment(apt_id):
    """
    Tương đương: Student.booking() trong file student.py
    """
    if apt_id not in db['appointments']:
        return jsonify({'error': 'Lịch không tồn tại'}), 404

    apt = db['appointments'][apt_id]
    student_id = g.user_id

    # 1. Các logic kiểm tra điều kiện (Validate)
    if apt['status'] != 'OPEN':
        return jsonify({'error': 'Lịch này không khả dụng'}), 400
        
    # Check full slot
    if len(apt['current_slots']) >= apt['max_slot']:
        return jsonify({'error': 'Lịch đã đầy'}), 400
        
    # Check đã book chưa
    if student_id in apt['current_slots']:
        return jsonify({'error': 'Bạn đã đặt lịch này rồi'}), 400

    # Check trùng giờ với các lịch khác của chính sinh viên đó (Logic nâng cao)
    current_apt_start = parse_time(apt['start_time'])
    current_apt_end = parse_time(apt['end_time'])
    
    # Lấy danh sách lịch student này đã book
    for other_apt in db['appointments'].values():
        if student_id in other_apt['current_slots'] and other_apt['status'] == 'OPEN':
            other_start = parse_time(other_apt['start_time'])
            other_end = parse_time(other_apt['end_time'])
            
            if (current_apt_start < other_end) and (current_apt_end > other_start):
                 return jsonify({'error': f'Bạn bị trùng giờ với lịch {other_apt["name"]}'}), 409

    # 2. Thực hiện Booking
    apt['current_slots'].append(student_id)
    
    # Cập nhật thông tin phía User (Student) nếu cần
    if student_id in db['users']:
        student = db['users'][student_id]
        if 'booked_appointments' not in student:
            student['booked_appointments'] = []
        student['booked_appointments'].append(apt_id)

    return jsonify({'message': 'Đặt lịch thành công', 'appointment': apt}), 200

# --- API CHUNG (GET) ---

@bp.route('/', methods=['GET'])
def list_appointments():
    """Lấy danh sách, có thể filter theo tutor_id"""
    tutor_id_filter = request.args.get('tutor_id')
    
    results = []
    for apt in db['appointments'].values():
        if tutor_id_filter and apt['tutor_id'] != tutor_id_filter:
            continue
        # Ẩn các lịch đã hủy nếu muốn
        # if apt['status'] == 'CANCELLED': continue
        results.append(apt)
        
    return jsonify(results), 200