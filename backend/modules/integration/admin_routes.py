# backend/modules/integration/admin_routes.py
from flask import Blueprint, request, jsonify
from core.database import db, set_user_role
from core.security import require_role

bp = Blueprint('admin', __name__, url_prefix='/admin')

def _public_user(u: dict) -> dict:
    if not u:
        return None
    user_copy = u.copy()
    user_copy.pop('password', None)
    
    role = user_copy.get('role')
    if hasattr(role, 'name'):
        user_copy['role'] = role.name
    elif isinstance(role, dict):
        user_copy['role'] = role.get('name', 'UNKNOWN')
    return user_copy


@bp.route('/users', methods=['GET'])
@require_role('ADMIN')
def list_users():
    users_list = [_public_user(u) for u in db['users'].values()]
    return jsonify({'count': len(users_list), 'users': users_list}), 200


@bp.route('/grant-role', methods=['POST'])
@require_role('ADMIN')
def grant_role():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    role = data.get('role')
    
    if not user_id or not role:
        return jsonify({'error': 'Cần có user_id và role'}), 400
        
    if set_user_role(user_id, role):
        updated_user = db['users'][user_id]
        return jsonify({
            'message': f'Đã cập nhật quyền {role} thành công',
            'user': _public_user(updated_user)
        }), 200
    
    return jsonify({'error': 'User không tồn tại'}), 404