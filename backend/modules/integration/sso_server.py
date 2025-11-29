# sso_server.py
from flask import Flask, request, jsonify, redirect
import os

# Try to use the app's in-memory DB for credential verification when available
try:
    from core.database import init_db, authenticate, get_user_by_email
    # initialize sample data for the mock SSO (safe to call)
    init_db()
    USING_APP_DB = True
except Exception:
    USING_APP_DB = False
from datetime import datetime, timedelta
import uuid

app = Flask(__name__)

MOCK_USERS = {
    "student": { "sso_id": "u2", "name": "Bùi Trần Duy Khang", "email": "student@hcmut.edu.vn", "role": "STUDENT", "password": "456" },
    "tutor":   { "sso_id": "u1", "name": "Đỗ Hồng Phúc", "email": "tutor@hcmut.edu.vn", "role": "TUTOR", "password": "123" },
    "admin":   { "sso_id": "u3", "name": "Lê Trọng Tín", "email": "admin@hcmut.edu.vn", "role": "ADMIN", "password": "admin" },
    
    "officer": { "sso_id": "u4", "name": "Mai Đức Trung", "email": "mai.trung@hcmut.edu.vn", "role": "OFFICER", "password": "123" },
    "dept":    { "sso_id": "u5", "name": "Quản Thành Thơ", "email": "thothanhquan@hcmut.edu.vn", "role": "DEPARTMENT", "password": "123" }
}

active_codes = {}

def clean_expired_codes():
    now = datetime.now()
    expired_codes = [
        code for code, data in active_codes.items()
        if now - data['created_at'] > timedelta(minutes=5)
    ]
    for code in expired_codes:
        del active_codes[code]
        print(f"[SSO] Cleaned expired code: {code}")

@app.route('/', methods=['GET'])
def home():
    return "<h1>HCMUT SSO Simulator (Port 5001)</h1>"


@app.route('/authorize', methods=['GET'])
def authorize():
    redirect_uri = request.args.get('redirect_uri', '')
    return f"""
    <div style="text-align:center; padding-top:20px; font-family:sans-serif">
        <h2>Giả lập SSO (5 Roles)</h2>
        <p>Vui lòng đăng nhập bằng Email & Mật khẩu:</p>

        <div style="margin: 10px 0;">
            <form action="/login-action" method="POST" style="display:inline-block; text-align:left;">
                <input type="hidden" name="redirect_uri" value="{redirect_uri}">
                <div style="margin-bottom:8px;"><label>Email:</label><br><input name="email" type="email" style="padding:8px; width:260px" required></div>
                <div style="margin-bottom:8px;"><label>Mật khẩu:</label><br><input name="password" type="password" style="padding:8px; width:260px" required></div>
                <div><button type="submit" style="padding:10px 18px; background:#1976d2; color:white; border:none; cursor:pointer;">Đăng nhập bằng Email</button></div>
            </form>
        </div>
    </div>
    """

@app.route('/login-action', methods=['POST'])
def login_action():
    # Accept values from form or querystring for robustness
    vals = request.values
    redirect_uri = vals.get('redirect_uri')
    # If redirect_uri missing (some browsers/forms may not include), try to
    # recover from Referer header or fallback to default backend callback.
    if not redirect_uri:
        referer = request.headers.get('Referer') or request.referrer
        if referer:
            try:
                from urllib.parse import urlparse, parse_qs
                q = urlparse(referer).query
                params = parse_qs(q)
                ru = params.get('redirect_uri')
                if ru:
                    redirect_uri = ru[0]
                    print(f"[SSO] Recovered redirect_uri from Referer: {redirect_uri}")
            except Exception:
                pass
    if not redirect_uri:
        # final fallback to backend callback
        redirect_uri = os.environ.get('BACKEND_CALLBACK', 'http://127.0.0.1:5000/auth/sso/callback')
        print(f"[SSO] No redirect_uri provided; falling back to {redirect_uri}")
    email = vals.get('email')
    password = vals.get('password')

    if not redirect_uri:
        return "Missing redirect_uri", 400

    # Validate presence
    if not email or not password:
        return "Missing credentials", 400

    user_info = None

    # Try app DB authentication first (if available)
    if USING_APP_DB:
        uid = authenticate(email, password)
        if uid:
            u = get_user_by_email(email)
            user_info = {
                'sso_id': u.get('id'),
                'name': u.get('name'),
                'email': u.get('email'),
                'role': u.get('role', 'STUDENT')
            }
        else:
            return "Invalid credentials", 401
    else:
        # fallback to MOCK_USERS by email
        found = None
        for k, v in MOCK_USERS.items():
            if v.get('email') == email:
                found = v
                break
        if found:
            # Verify mock password (do not accept any password)
            expected_pw = found.get('password')
            if expected_pw is None:
                print(f"[SSO] Mock user {email} has no password set; rejecting login")
                return "Invalid credentials", 401
            if password != expected_pw:
                print(f"[SSO] Invalid password for mock user {email}")
                return "Invalid credentials", 401
            user_info = found
        else:
            return "Invalid credentials", 401

    clean_expired_codes()
    code = f"auth_{uuid.uuid4().hex[:8]}"
    active_codes[code] = {
        'user_info': user_info,
        'created_at': datetime.now(),
        'used': False
    }

    print(f"[SSO] Generated code: {code} for user: {user_info.get('email')}")
    print(f"[SSO] Redirecting to: {redirect_uri}?code={code}")
    return redirect(f"{redirect_uri}?code={code}")

@app.route('/token', methods=['POST'])
def token_exchange():
    data = request.get_json()
    code = data.get('code')
    
    print(f"[SSO] Token exchange request for code: {code}")
    
    if not code:
        return jsonify({"error": "Code is required"}), 400
    clean_expired_codes()
    
    if code not in active_codes:
        print(f"[SSO] Code not found: {code}")
        print(f"[SSO] Active codes: {list(active_codes.keys())}")
        return jsonify({"error": "Invalid code"}), 400
    
    code_data = active_codes[code]
    
    if code_data['used']:
        print(f"[SSO] Code already used: {code}")
        return jsonify({"error": "Code already used"}), 400
    
    if datetime.now() - code_data['created_at'] > timedelta(minutes=5):
        del active_codes[code]
        print(f"[SSO] Code expired: {code}")
        return jsonify({"error": "Code expired"}), 400
    
    code_data['used'] = True
    user_info = code_data['user_info']
    
    print(f"[SSO] Token exchange successful for: {user_info['name']}")
    
    return jsonify(user_info), 200

@app.route('/logout', methods=['GET'])
def logout():
    """SSO Logout endpoint"""
    return """
    <div style="text-align:center; padding-top:50px; font-family:sans-serif">
        <h2>Đã đăng xuất khỏi HCMUT SSO</h2>
        <p>Bạn có thể đóng tab này.</p>
    </div>
    """

@app.route('/reset', methods=['GET'])
def reset_password():
    return """
    <div style="text-align:center; padding-top:50px; font-family:sans-serif">
        <h2>Đặt lại mật khẩu</h2>
        <p>Đây là trang giả lập reset password</p>
        <form>
            <input type="email" placeholder="Email" style="padding:10px; width:300px"><br><br>
            <button style="padding:10px 20px; cursor:pointer">Gửi link reset</button>
        </form>
    </div>
    """
    
@app.route('/debug/codes', methods=['GET'])
def debug_codes():
    """Xem danh sách active codes (chỉ để debug)"""
    clean_expired_codes()
    codes_info = []
    for code, data in active_codes.items():
        codes_info.append({
            'code': code,
            'user': data['user_info']['name'],
            'created_at': data['created_at'].isoformat(),
            'used': data['used'],
            'age_seconds': (datetime.now() - data['created_at']).seconds
        })
    
    return jsonify({
        'total_codes': len(active_codes),
        'codes': codes_info
    }), 200

if __name__ == '__main__':
    print("=" * 50)
    print("HCMUT SSO Mock Server Starting...")
    print("URL: http://localhost:5001")
    print("Debug: http://localhost:5001/debug/codes")
    print("=" * 50)
    app.run(port=5001, debug=True)