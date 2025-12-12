from flask import Blueprint, request, jsonify, g, current_app
from core.database import db
from core.security import require_login, require_role
from datetime import datetime
from dataclasses import asdict

bp = Blueprint('info', __name__, url_prefix='/info')


def _check_roles(allowed):
    """Simple helper to check g.current_user role against allowed set."""
    user = getattr(g, 'current_user', None)
    if not user:
        return False
    role = user.get('role')
    if isinstance(role, str):
        role_name = role
    elif isinstance(role, dict):
        role_name = role.get('name')
    else:
        role_name = getattr(role, 'name', None)
    return role_name in allowed


@bp.route('/overview', methods=['GET'])
@require_login
def overview():
    allowed = {'OFFICER', 'DEPARTMENT', 'UNIVERSITY_OFFICER', 'ADMIN'}
    if not _check_roles(allowed):
        return jsonify({'error': 'Forbidden'}), 403

    data = {
        'users_count': len(db.get('users', {})),
        'appointments_count': len(db.get('appointments', {})),
        'documents_count': len(db.get('documents', {})),
    }
    return jsonify(data), 200


@bp.route('/users', methods=['GET'])
@require_login
def list_users():
    allowed = {'OFFICER', 'DEPARTMENT', 'UNIVERSITY_OFFICER', 'ADMIN'}
    if not _check_roles(allowed):
        return jsonify({'error': 'Forbidden'}), 403

    users = []
    for u in db.get('users', {}).values():
        uu = u.copy()
        uu.pop('password', None)
        users.append(uu)
    return jsonify({'count': len(users), 'users': users}), 200


@bp.route('/appointments', methods=['GET'])
@require_login
def list_appointments():
    allowed = {'OFFICER', 'DEPARTMENT', 'UNIVERSITY_OFFICER', 'ADMIN'}
    if not _check_roles(allowed):
        return jsonify({'error': 'Forbidden'}), 403

    apts = list(db.get('appointments', {}).values())
    return jsonify({'count': len(apts), 'appointments': apts}), 200


@bp.route('/appointments/mine', methods=['GET'])
@require_login
def my_appointments():
    # Return appointments related to the current user (student's booked sessions)
    user = getattr(g, 'current_user', None)
    if not user:
        return jsonify({'error': 'Forbidden'}), 403

    uid = user.get('id')
    if not uid:
        return jsonify({'error': 'Forbidden'}), 403

    result = []
    for appt in db.get('appointments', {}).values():
        if uid in appt.get('current_slots', []) or appt.get('id') in db.get('users', {}).get(uid, {}).get('booked_appointments', []):
            result.append(appt)

    return jsonify({'count': len(result), 'appointments': result}), 200


@bp.route('/appointments/<appt_id>/feedback', methods=['POST'])
def submit_feedback(appt_id):
    # Lightweight demo endpoint: accept feedback as long as caller provides a student_id
    # This relaxes participant checks for demo/demo-report purposes.
    body = request.get_json() or {}
    student_id = body.get('student_id')

    # If request was authenticated, prefer that user id
    auth_user = getattr(g, 'current_user', None)
    if auth_user and auth_user.get('id'):
        student_id = auth_user.get('id')

    if not student_id:
        return jsonify({'error': 'student_id is required (or authenticate)'}), 400

    appt = db.get('appointments', {}).get(appt_id)
    if not appt:
        return jsonify({'error': 'Appointment not found'}), 404

    rating = body.get('rating')
    comment = body.get('comment', '')

    if rating is None:
        return jsonify({'error': 'rating is required'}), 400

    feedback_entry = {
        'student_id': student_id,
        'rating': int(rating),
        'comment': comment,
        'created_at': datetime.utcnow().isoformat() + 'Z'
    }

    # Append feedback (create list if missing)
    if 'feedback' not in appt or appt.get('feedback') is None:
        appt['feedback'] = []

    appt['feedback'].append(feedback_entry)
    db['appointments'][appt_id] = appt

    return jsonify({'feedback': feedback_entry}), 201


@bp.route('/feedbacks/all', methods=['GET'])
@require_role('UNIVERSITY_OFFICER')
def get_all_feedbacks():
    """
    UNIVERSITY_OFFICER xem tất cả feedbacks từ mọi appointments.
    Trả về danh sách feedbacks với thông tin appointment và student.
    """
    all_feedbacks = []
    
    for appt_id, appt in db.get('appointments', {}).items():
        feedbacks = appt.get('feedback', [])
        if not feedbacks:
            continue
            
        for fb in feedbacks:
            student_id = fb.get('student_id')
            student = db.get('users', {}).get(student_id, {})
            student_name = student.get('name', 'Unknown')
            student_email = student.get('email', 'N/A')
            
            # Lấy thông tin tutor
            tutor_id = appt.get('tutor_id')
            tutor = db.get('users', {}).get(tutor_id, {})
            tutor_name = tutor.get('name', 'Unknown')
            
            all_feedbacks.append({
                'feedback_id': f"{appt_id}_{student_id}_{fb.get('created_at', '')}",
                'appointment_id': appt_id,
                'appointment_name': appt.get('name', 'N/A'),
                'start_time': appt.get('start_time', 'N/A'),
                'place': appt.get('place', 'N/A'),
                'tutor_name': tutor_name,
                'student_id': student_id,
                'student_name': student_name,
                'student_email': student_email,
                'rating': fb.get('rating'),
                'comment': fb.get('comment', ''),
                'created_at': fb.get('created_at', '')
            })
    
    # Sort by created_at desc
    all_feedbacks.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    return jsonify({
        'count': len(all_feedbacks),
        'feedbacks': all_feedbacks
    }), 200


@bp.route('/documents', methods=['GET'])
@require_login
def list_documents():
    allowed = {'OFFICER', 'DEPARTMENT', 'UNIVERSITY_OFFICER', 'ADMIN'}
    if not _check_roles(allowed):
        return jsonify({'error': 'Forbidden'}), 403

    docs = list(db.get('documents', {}).values())
    return jsonify({'count': len(docs), 'documents': docs}), 200


@bp.route('/users/<user_id>', methods=['PATCH'])
@require_login
def update_user(user_id):
    # Only DEPARTMENT or ADMIN can update academic fields
    allowed = {'DEPARTMENT', 'ADMIN'}
    if not _check_roles(allowed):
        return jsonify({'error': 'Forbidden'}), 403

    body = request.get_json() or {}
    user = db.get('users', {}).get(user_id)
    if not user:
        return jsonify({'error': 'Not found'}), 404

    # Only allow updating specific academic fields to avoid changing core auth fields
    for key in ('score', 'conduct_points', 'scholarship_level'):
        if key in body:
            user[key] = body.get(key)

    # persist (in-memory) and return sanitized user
    db['users'][user_id] = user
    u = user.copy()
    u.pop('password', None)
    return jsonify({'user': u}), 200


@bp.route('/notifications/my', methods=['GET'])
@require_login
def get_my_notifications():
    """Lấy tất cả notifications của user hiện tại"""
    user = g.get('current_user')
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = user.get('id')
    all_notifications = []
    
    for notif_id, notif in db.get('notifications', {}).items():
        if notif.get('user_id') == user_id:
            all_notifications.append(notif)
    
    # Sort by created_at desc
    all_notifications.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    # Count unread
    unread_count = sum(1 for n in all_notifications if not n.get('is_read', False))
    
    return jsonify({
        'notifications': all_notifications,
        'unread_count': unread_count
    }), 200


@bp.route('/notifications/<notif_id>/read', methods=['POST'])
@require_login
def mark_notification_read(notif_id):
    """Đánh dấu notification đã đọc"""
    user = g.get('current_user')
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    notif = db.get('notifications', {}).get(notif_id)
    if not notif:
        return jsonify({'error': 'Notification not found'}), 404
    
    if notif.get('user_id') != user.get('id'):
        return jsonify({'error': 'Forbidden'}), 403
    
    notif['is_read'] = True
    db['notifications'][notif_id] = notif
    
    return jsonify({'notification': notif}), 200


@bp.route('/notifications', methods=['POST'])
@require_login
def create_notification():
    """Tạo notification mới (dùng bởi DEPARTMENT khi cập nhật điểm)"""
    data = request.get_json() or {}
    
    from core.models import Notification
    
    notif_id = f"notif_{len(db.get('notifications', {})) + 1}"
    
    notif = Notification(
        id=notif_id,
        user_id=data.get('user_id'),
        title=data.get('title', 'Thông báo'),
        message=data.get('message', ''),
        type=data.get('type', 'INFO'),
        is_read=False,
        created_at=datetime.utcnow().isoformat() + 'Z',
        link=data.get('link')
    )
    
    db['notifications'][notif_id] = asdict(notif)
    
    return jsonify({'notification': asdict(notif)}), 201
