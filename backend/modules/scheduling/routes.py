from flask import Blueprint, request, jsonify, g
from core.security import require_role, require_login
from core.database import db
from .logic import (
    create_appointment as logic_create_appointment,
    cancel_appointment as logic_cancel_appointment,
    book_appointment as logic_book_appointment,
    list_appointments as logic_list_appointments,
    cancel_student_appointment as logic_cancel_student_appointment,
    reschedule_appointment as logic_reschedule_appointment,
    save_minutes as logic_save_minutes,
    LogicError,
)

bp = Blueprint("appointments", __name__, url_prefix="/appointments")

# --- API CHO TUTOR ---

@bp.route("/", methods=["POST"])
@require_role("TUTOR")
def create_appointment():
    data = request.get_json() or {}
    tutor_id = g.user_id

    name = data.get("name")
    start_str = data.get("start_time")
    end_str = data.get("end_time")
    place = data.get("place")
    max_slot = data.get("max_slot", 1)

    if not all([name, start_str, end_str, place]):
        return jsonify({"error": "Thiếu thông tin bắt buộc"}), 400

    try:
        apt = logic_create_appointment(tutor_id, name, start_str, end_str, place, max_slot)
        return jsonify({"message": "Tạo lịch thành công", "data": apt}), 201
    except LogicError as e:
        return jsonify({"error": e.message}), e.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route("/<apt_id>", methods=["DELETE"])
@require_role("TUTOR")
def cancel_appointment(apt_id):
    try:
        logic_cancel_appointment(apt_id, g.user_id)
        return jsonify({"message": "Đã hủy buổi hẹn"}), 200
    except LogicError as e:
        return jsonify({"error": e.message}), e.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- API CHO STUDENT ---

@bp.route("/<apt_id>/book", methods=["POST"])
@require_role("STUDENT")
def book_appointment(apt_id):
    try:
        apt = logic_book_appointment(apt_id, g.user_id)
        return jsonify({"message": "Đặt lịch thành công", "appointment": apt}), 200
    except LogicError as e:
        return jsonify({"error": e.message}), e.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route("/<apt_id>/book", methods=["DELETE"])
@require_role("STUDENT")
def cancel_student_appointment(apt_id):
    """Student cancels their booking for an appointment (DELETE /<apt_id>/book)."""
    try:
        apt = logic_cancel_student_appointment(apt_id, g.user_id)
        return jsonify({"message": "Đã huỷ đặt lịch", "appointment": apt}), 200
    except LogicError as e:
        return jsonify({"error": e.message}), e.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- API CHUNG (GET) ---
@bp.route("/", methods=["GET"])
def list_appointments():
    tutor_id_filter = request.args.get("tutor_id")
    try:
        results = logic_list_appointments(tutor_id_filter)
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- API LỊCH RẢNH (FREE SCHEDULE) ---
@bp.route('/free-schedule', methods=['POST'])
@require_role('TUTOR')
def save_free_schedule():
    data = request.get_json() or {}
    tutor_id = g.user_id
    
    cells = data.get('cells', [])
    week = str(data.get('week', '6'))
    note = data.get('note', '') # Nhận thêm ghi chú
    
    if 'free_schedules' not in db:
        db['free_schedules'] = {}
        
    if tutor_id not in db['free_schedules'] or isinstance(db['free_schedules'][tutor_id], list):
        db['free_schedules'][tutor_id] = {}
        
    # Lưu cả cells và note vào object theo tuần
    db['free_schedules'][tutor_id][week] = {
        "cells": cells,
        "note": note
    }
    
    return jsonify({"message": f"Đã lưu lịch và ghi chú tuần {week} thành công"}), 200

@bp.route('/free-schedule', methods=['GET'])
@require_login
def get_free_schedule():
    target_id = request.args.get('tutor_id')
    week = str(request.args.get('week', '6'))
    
    if not target_id:
        target_id = getattr(g, 'user_id', None)

    if not target_id:
        return jsonify({"cells": [], "note": ""}), 200

    user_data = db.get('free_schedules', {}).get(target_id, {})
    
    # Xử lý trường hợp dữ liệu cũ
    if isinstance(user_data, list):
        user_data = {} 

    week_data = user_data.get(week, {})
    
    if isinstance(week_data, list):
        return jsonify({"cells": week_data, "note": ""}), 200
        
    return jsonify({
        "cells": week_data.get('cells', []),
        "note": week_data.get('note', '')
    }), 200


# --- API ĐỔI LỊCH (PUT) ---
@bp.route("/<apt_id>", methods=["PUT"])
@require_role("TUTOR")
def reschedule_appointment(apt_id):
    data = request.get_json() or {}
    
    # Lấy thông tin từ Frontend
    start_str = data.get("start_time")
    end_str = data.get("end_time")
    place = data.get("place")
    mode = data.get("mode")
    max_slot = data.get("max_slot")

    if not all([start_str, end_str, place]):
        return jsonify({"error": "Thiếu thông tin đổi lịch"}), 400

    try:
        # Gọi logic xử lý
        updated_apt = logic_reschedule_appointment(
            apt_id, 
            g.user_id, 
            start_str, 
            end_str, 
            place,
            mode,
            max_slot
        )
        return jsonify({"message": "Đổi lịch thành công", "data": updated_apt}), 200
    except LogicError as e:
        return jsonify({"error": e.message}), e.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- API BIÊN BẢN (MINUTES) ---
@bp.route("/<apt_id>/minutes", methods=["POST"])
@require_role("TUTOR")
def create_minutes(apt_id):
    data = request.get_json() or {}
    
    content = data.get("content", "")
    student_results = data.get("student_results", [])
    file_link = data.get("file_link", "")

    try:
        minutes = logic_save_minutes(apt_id, g.user_id, content, student_results, file_link)
        return jsonify({"message": "Lưu biên bản thành công", "data": minutes}), 200
    except LogicError as e:
        return jsonify({"error": e.message}), e.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500