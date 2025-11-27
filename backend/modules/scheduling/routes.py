from flask import Blueprint, request, jsonify, g
from core.security import require_role

from .logic import (
    create_appointment as logic_create_appointment,
    cancel_appointment as logic_cancel_appointment,
    book_appointment as logic_book_appointment,
    list_appointments as logic_list_appointments,
    cancel_student_appointment as logic_cancel_student_appointment,
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