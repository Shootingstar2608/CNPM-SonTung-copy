# mock_sso_server.py
from flask import Flask, request, jsonify, redirect
import uuid

app = Flask(__name__)

MOCK_USERS = {
    "student": {
        "sso_id": "u2",                 
        "name": "Duy Khang",            
        "email": "student@hcmut.edu.vn", 
        "role": "STUDENT"
    },
    "tutor": {
        "sso_id": "u1",                 
        "name": "Đỗ Hồng Phúc",         
        "email": "tutor@hcmut.edu.vn", 
        "role": "TUTOR"
    },
    "admin": {
        "sso_id": "u3",                
        "name": "Tín",                  
        "email": "admin@hcmut.edu.vn", 
        "role": "ADMIN"
    }
}

active_codes = {}

@app.route('/', methods=['GET'])
def home():
    return "<h1>HCMUT SSO Simulator (Port 5001)</h1>"

@app.route('/authorize', methods=['GET'])
def authorize():
    redirect_uri = request.args.get('redirect_uri', '')
    return f"""
    <div style="text-align:center; padding-top:50px; font-family:sans-serif">
        <h2>Giả lập đăng nhập SSO (HCMUT)</h2>
        <p>Chọn tài khoản để đăng nhập thử:</p>
        <form action="/login-action" method="POST">
            <input type="hidden" name="redirect_uri" value="{redirect_uri}">
            
            <button name="user" value="student" style="padding:10px 20px; cursor:pointer; background:#e0f7fa; border:1px solid #006064">
                <strong>Sinh viên:</strong> Duy Khang (u2)
            </button> 
            <br><br>
            
            <button name="user" value="tutor" style="padding:10px 20px; cursor:pointer; background:#fff3e0; border:1px solid #e65100">
                <strong>Gia sư:</strong> Đỗ Hồng Phúc (u1)
            </button> 
            <br><br>
            
            <button name="user" value="admin" style="padding:10px 20px; cursor:pointer; background:#fce4ec; border:1px solid #880e4f">
                <strong>Admin:</strong> Tín (u3)
            </button>
        </form>
    </div>
    """

# 2. Xử lý Login -> Redirect về Backend kèm Code
@app.route('/login-action', methods=['POST'])
def login_action():
    user_key = request.form.get('user')
    redirect_uri = request.form.get('redirect_uri')
    
    if user_key not in MOCK_USERS:
        return "User not found", 400

    code = f"auth_{uuid.uuid4().hex[:8]}"
    active_codes[code] = MOCK_USERS[user_key]
    return redirect(f"{redirect_uri}?code={code}")

# 3. API để Backend đổi Code lấy Token/Info
@app.route('/token', methods=['POST'])
def token_exchange():
    data = request.get_json()
    code = data.get('code')
    
    if code in active_codes:
        user_info = active_codes.pop(code)
        return jsonify(user_info)
    
    return jsonify({"error": "Invalid code"}), 400

if __name__ == '__main__':
    app.run(port=5001, debug=True)