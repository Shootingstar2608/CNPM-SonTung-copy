# core/security.py
from functools import wraps
from flask import request, jsonify, current_app, g
import jwt
from core.database import db


def parse_bearer_token(req):
    """Return token string or None if missing/invalid format."""
    auth = req.headers.get('Authorization', '')
    if not auth or not auth.startswith('Bearer '):
        return None
    return auth.split(' ', 1)[1].strip()


def require_login(f):
    """Decorator: validate JWT, attach `g.user_id` and `g.current_user`.

    Use this everywhere instead of decoding tokens locally.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = parse_bearer_token(request)
        if not token:
            return jsonify({'error': 'Unauthorized: missing token'}), 401

        secret = current_app.config.get('SECRET_KEY', 'dev-secret')
        try:
            payload = jwt.decode(token, secret, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401

        user_id = payload.get('user_id')
        if not user_id or user_id not in db['users']:
            return jsonify({'error': 'Unauthorized: user not found'}), 401

        user = db['users'][user_id].copy()
        user.pop('password', None)

        g.token_payload = payload
        g.user_id = user_id
        g.current_user = user

        return f(*args, **kwargs)

    return decorated


def _role_name(role_obj):
    """Normalize stored role to a simple string name."""
    if not role_obj:
        return None
    if isinstance(role_obj, str):
        return role_obj
    if isinstance(role_obj, dict):
        return role_obj.get('name')
    # fallback: try attribute
    return getattr(role_obj, 'name', None)


def require_role(allowed_role):
    """Decorator to require a specific role. Uses `require_login` first."""
    def decorator(f):
        @require_login
        @wraps(f)
        def decorated(*args, **kwargs):
            user = getattr(g, 'current_user', None)
            if not user:
                return jsonify({'error': 'Unauthorized'}), 401

            role_name = _role_name(user.get('role'))
            if role_name != allowed_role:
                return jsonify({'error': 'Forbidden: insufficient role'}), 403

            return f(*args, **kwargs)

        return decorated

    return decorator
