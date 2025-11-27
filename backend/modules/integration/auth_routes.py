from flask import Blueprint, request, jsonify, g
from modules.integration.services import AuthService
from core.security import require_login

bp = Blueprint('auth', __name__, url_prefix='/auth')

auth_service = AuthService()
@bp.route('/sso/login-url', methods=['GET'])
def get_sso_url():
    try:
        url = auth_service.get_sso_login_redirect_url()
        return jsonify({'redirect_url': url}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/sso/callback', methods=['GET', 'POST'])
def sso_callback():
    code = request.args.get('code') or (request.get_json() or {}).get('code')

    if not code:
        return jsonify({'error': 'Missing authorization code'}), 400

    result = auth_service.handle_sso_callback(code)

    if result.success:
        return jsonify({
            'message': 'SSO Login Success',
            'access_token': result.token,
            'user_id': result.user_id
        }), 200
    else:
        return jsonify({'error': result.error_message}), 401

@bp.route('/logout', methods=['POST'])
def logout():
    data = request.get_json() or {}
    token = data.get('token')
    if not token:
        return jsonify({'error': 'Token required'}), 400

    logout_info = auth_service.log_out(token)
    return jsonify({'message': 'Logged out', 'sso_logout_url': logout_info.url}), 200

@bp.route('/verify', methods=['POST'])
def verify():
    token = request.get_json().get('token')
    is_valid = auth_service.validate_local_token(token)
    return jsonify({'valid': is_valid}), 200

@bp.route('/profile', methods=['GET'])
@require_login
def get_my_profile():
    # `require_login` already set `g.current_user`
    user = g.get('current_user')
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    return jsonify({'user': user}), 200