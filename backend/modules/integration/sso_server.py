# sso_server.py
from flask import Flask, request, jsonify, redirect
import os
import requests

# SSO Server giờ sẽ gọi API của backend app để verify credentials
# thay vì dùng database riêng
BACKEND_VERIFY_URL = os.environ.get('BACKEND_URL', 'http://127.0.0.1:5000') + '/auth/verify-credentials'

app = Flask(__name__)

# Mock users chỉ để fallback (nếu backend không available)
MOCK_USERS = {
    "student": { "sso_id": "u2", "name": "Bùi Trần Duy Khang", "email": "student@hcmut.edu.vn", "role": "STUDENT", "password": "456" },
    "tutor":   { "sso_id": "u1", "name": "Đỗ Hồng Phúc", "email": "tutor@hcmut.edu.vn", "role": "TUTOR", "password": "123" },
    "admin":   { "sso_id": "u3", "name": "Lê Trọng Tín", "email": "admin@hcmut.edu.vn", "role": "ADMIN", "password": "admin" },
    
    "officer": { "sso_id": "u4", "name": "Mai Đức Trung", "email": "mai.trung@hcmut.edu.vn", "role": "OFFICER", "password": "123" },
    "dept":    { "sso_id": "u5", "name": "Quản Thành Thơ", "email": "thothanhquan@hcmut.edu.vn", "role": "DEPARTMENT", "password": "123" },
    "university_officer":    { "sso_id": "u6", "name": "Trần Ngọc Bảo Duy", "email": "duy.bao@hcmut.edu.vn", "role": "UNIVERSITY_OFFICER", "password": "123" }

}

from datetime import datetime, timedelta
import uuid

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
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HCMUT SSO - Đăng nhập</title>
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }}
            .container {{
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                max-width: 420px;
                width: 100%;
                overflow: hidden;
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px 30px;
                text-align: center;
                color: white;
            }}
            .header h1 {{
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 8px;
            }}
            .header p {{
                font-size: 14px;
                opacity: 0.95;
            }}
            .form-container {{
                padding: 40px 30px;
            }}
            .form-group {{
                margin-bottom: 24px;
            }}
            .form-group label {{
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: #333;
                font-size: 14px;
            }}
            .form-group input {{
                width: 100%;
                padding: 14px 16px;
                border: 2px solid #e1e8ed;
                border-radius: 8px;
                font-size: 15px;
                transition: all 0.3s ease;
                outline: none;
            }}
            .form-group input:focus {{
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }}
            .btn-login {{
                width: 100%;
                padding: 14px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                margin-top: 8px;
            }}
            .btn-login:hover {{
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
            }}
            .btn-login:active {{
                transform: translateY(0);
            }}
            .footer {{
                text-align: center;
                padding: 20px 30px 30px;
                color: #666;
                font-size: 13px;
            }}
            .footer a {{
                color: #667eea;
                text-decoration: none;
                font-weight: 600;
            }}
            .footer a:hover {{
                text-decoration: underline;
            }}
            .logo {{
                width: 60px;
                height: 60px;
                background: white;
                border-radius: 50%;
                margin: 0 auto 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🎓</div>
                <h1>HCMUT SSO</h1>
                <p>Đăng nhập hệ thống BKTutor</p>
            </div>
            
            <form action="/login-action" method="POST" class="form-container">
                <input type="hidden" name="redirect_uri" value="{redirect_uri}">
                
                <div class="form-group">
                    <label for="email">Email</label>
                    <input 
                        id="email"
                        name="email" 
                        type="email" 
                        placeholder="example@hcmut.edu.vn"
                        required
                        autofocus
                    >
                </div>
                
                <div class="form-group">
                    <label for="password">Mật khẩu</label>
                    <input 
                        id="password"
                        name="password" 
                        type="password" 
                        placeholder="Nhập mật khẩu"
                        required
                    >
                </div>
                
                <button type="submit" class="btn-login">
                    Đăng nhập
                </button>
            </form>
            
            <div class="footer">
                <p>Bạn chưa có tài khoản? <a href="http://127.0.0.1:5173/register">Đăng ký ngay</a></p>
            </div>
        </div>
    </body>
    </html>
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

    # Try to verify credentials via backend API (real-time check)
    try:
        response = requests.post(BACKEND_VERIFY_URL, json={
            'email': email,
            'password': password
        }, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            user_info = {
                'sso_id': data.get('user_id'),
                'name': data.get('name'),
                'email': data.get('email'),
                'role': data.get('role', 'STUDENT')
            }
            print(f"[SSO] Authenticated via backend API: {email}")
        elif response.status_code == 401:
            return "Invalid credentials", 401
        else:
            raise Exception(f"Backend returned {response.status_code}")
    except Exception as e:
        print(f"[SSO] Backend API unavailable ({e}), falling back to MOCK_USERS")
        # Fallback to MOCK_USERS if backend is down
        found = None
        for k, v in MOCK_USERS.items():
            if v.get('email') == email:
                found = v
                break
        if found:
            # Verify mock password
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
    
    if not user_info:
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
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HCMUT SSO - Đăng xuất</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .container {
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                max-width: 420px;
                width: 100%;
                padding: 60px 40px;
                text-align: center;
            }
            .icon {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                margin: 0 auto 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 40px;
            }
            h1 {
                font-size: 24px;
                color: #333;
                margin-bottom: 12px;
            }
            p {
                color: #666;
                font-size: 15px;
                line-height: 1.6;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">✓</div>
            <h1>Đăng xuất thành công</h1>
            <p>Bạn đã đăng xuất khỏi HCMUT SSO.<br>Bạn có thể đóng tab này.</p>
        </div>
    </body>
    </html>
    """

@app.route('/reset', methods=['GET'])
def reset_password():
    return """
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HCMUT SSO - Đặt lại mật khẩu</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .container {
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                max-width: 420px;
                width: 100%;
                padding: 40px;
            }
            h1 {
                font-size: 24px;
                color: #333;
                margin-bottom: 8px;
                text-align: center;
            }
            .subtitle {
                color: #666;
                font-size: 14px;
                text-align: center;
                margin-bottom: 32px;
            }
            .form-group {
                margin-bottom: 24px;
            }
            .form-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: #333;
                font-size: 14px;
            }
            .form-group input {
                width: 100%;
                padding: 14px 16px;
                border: 2px solid #e1e8ed;
                border-radius: 8px;
                font-size: 15px;
                outline: none;
                transition: all 0.3s ease;
            }
            .form-group input:focus {
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }
            .btn {
                width: 100%;
                padding: 14px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
            }
            .back-link {
                text-align: center;
                margin-top: 20px;
            }
            .back-link a {
                color: #667eea;
                text-decoration: none;
                font-size: 14px;
                font-weight: 600;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Đặt lại mật khẩu</h1>
            <p class="subtitle">Nhập email để nhận link đặt lại mật khẩu</p>
            <form>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input id="email" type="email" placeholder="example@hcmut.edu.vn" required>
                </div>
                <button type="submit" class="btn">Gửi link đặt lại</button>
            </form>
            <div class="back-link">
                <a href="javascript:history.back()">← Quay lại đăng nhập</a>
            </div>
        </div>
    </body>
    </html>
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