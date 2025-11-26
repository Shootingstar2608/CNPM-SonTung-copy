# backend/modules/integration/library_routes.py
from functools import wraps
from flask import Blueprint, request, jsonify, g, current_app
from datetime import datetime
import uuid
import jwt

from core.database import db
from core.models import Document, DocumentAccess
from core.security import require_role


bp = Blueprint('library', __name__, url_prefix='/library')

# --- DECORATOR KIỂM TRA ĐĂNG NHẬP (Dùng cho cả Student & Tutor) ---
# phải có cài này ở đây là tại vì mỗi bước lấy lịch sử hay xem chi tiết tài liệu 
# đều gọi g.get('user_id'), thành ra nếu không gắn thêm decorator kèm theo định nghĩa hàm
# đó thì sẽ không lấy được user_id 
def require_login(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Lấy token từ Header
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return jsonify({"error": "Unauthorized: Missing token"}), 401
        
        token = auth.split(' ', 1)[1].strip()
        secret = current_app.config.get('SECRET_KEY', 'dev-secret')
        
        # Giải mã Token
        try:
            payload = jwt.decode(token, secret, algorithms=['HS256'])
            user_id = payload.get('user_id')
            
            # Kiểm tra user có tồn tại trong DB không
            if not user_id or user_id not in db['users']:
                return jsonify({"error": "Unauthorized: User not found"}), 401
                
            # Gắn thông tin vào biến toàn cục g
            g.user_id = user_id
            g.current_user = db['users'][user_id]
            
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
            
        return f(*args, **kwargs)
    return decorated_function

# Hàm ghi lại lịch sử truy cập 
def log_access(user_id, doc_id, action, partner_id=""):
    log_id = str(uuid.uuid4())
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    new_log = DocumentAccess(
        id=log_id,
        user_id=user_id,
        doc_id=doc_id,
        action=action,      # VIEW, SEND, RECEIVE, UPLOAD 
        timestamp=now,
        partner_id=partner_id
    )
    db['access_logs'][log_id] = new_log.to_dict()

@bp.route('/', methods=['GET'])
def list_documents():
    """
    API hỗ trợ lấy tài liệu theo từ khóa (q)
    và mã môn (course)
    """
    # Mặc định nếu không có query thì lấy hết tài liệu 
    # Tìm tài liệu theo title hoặc theo description: GET .../library?q='tên_tài_liệu'
    query = request.args.get('q', '').lower()

    # Tìm tài liệu theo khóa học: GET .../library?course='mã_môn'
    course = request.args.get('course', '').upper()

    results = []

    for doc in db['documents'].values():
        match_query = (query in doc['title'].lower()) or (query in doc['description'].lower())

        # match_course = (query in doc['course_code'].lower()) sai
        match_course = (not course) or (course in doc['course_code'].upper())

        if match_query and match_course:
            uploader = db['users'].get(doc['uploader_id'])
            doc_data = dict(doc)
            doc_data['uploader_name'] = uploader['name'] if uploader else "Unknown"
            results.append(doc_data)
    
    return jsonify(results), 200 


@bp.route('/history', methods=['GET'])
@require_login
def view_history():
    """
    Lấy danh sách lịch sử của user hiện tại (VIEW, SENT, RECEIVED)
    """
    current_user_id = g.get('user_id')
    if not current_user_id:
        return jsonify({'error': 'Debug: Not found user_id'}), 401
        
    my_history = []
    
    # Duyệt ngược để lấy mới nhất trước (nếu muốn sort)
    # Ở đây duyệt bình thường, sort ở frontend hoặc dùng sorted()
    all_logs = list(db['access_logs'].values())
    # Sắp xếp theo thời gian giảm dần (mới nhất lên đầu)
    all_logs.sort(key=lambda x: x['timestamp'], reverse=True)

    for log in all_logs:
        if log['user_id'] == current_user_id:
            # Lấy thêm info để hiển thị đẹp hơn
            doc = db['documents'].get(log['doc_id'])
            partner = db['users'].get(log['partner_id'])
            
            log_data = dict(log)
            log_data['doc_title'] = doc['title'] if doc else "Tài liệu đã bị xóa"
            log_data['partner_name'] = partner['name'] if partner else ""
            
            my_history.append(log_data)
            
    return jsonify(my_history), 200


@bp.route('/<doc_id>',methods=['GET'])
@require_login
def get_document(doc_id):
    """
    API xem chi tiết tài liệu. 
    Khi gọi API này sẽ tự động lưu lịch sử VIEW.
    """

    if doc_id not in db['documents']:
        return jsonify({"error" : "Tài liệu không tồn tại"}), 404
    
    doc = db['documents'][doc_id]
    viewer_id = g.get('user_id')

    if viewer_id:
        print("Debug: Saved log 11111")
        log_access(viewer_id, doc_id, "VIEW")

    uploader = db['users'].get(doc['uploader_id'])
    doc_data = dict(doc)
    doc_data['uploader_name'] = uploader['name'] if uploader else "Unknown"

    return jsonify({'message': 'Saving log access...', 'document':doc_data}), 200


@bp.route('/upload', methods=['POST'])
@require_role('TUTOR')  # Chỉ dành cho TUTOR
@require_login
def upload_document():
    data = request.get_json()
    uploader_id = g.user_id 
    title = data.get('title')
    link = data.get('link')
    course_code = data.get('course_code', 'GENERAL')
    desc = data.get('description', '')

    if not title or not link:
        return jsonify({'error': 'Tiêu đề và link tài liệu là bắt buộc'}), 400
    
    doc_id = str(uuid.uuid4())

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    new_doc = Document(
        id=doc_id,
        title=title,
        description=desc,
        uploader_id=uploader_id,
        link=link,
        course_code=course_code,
        created_at=now
    )
    log_access(uploader_id, doc_id, "UPLOAD")
    db['documents'][doc_id] = new_doc.to_dict()
    return jsonify({'message': 'upload tài liệu thành công',
                    'document': new_doc.to_dict()}), 201 


@bp.route('/share', methods=['POST'])
@require_login
def share_document():
    """
    API chia sẻ tài liệu cho người dùng khác qua email.
    """
    # Lấy thông tin người gửi từ token
    sender_id = g.get('user_id') 
    if not sender_id:
        return jsonify({'error': 'Vui lòng nhập email người nhận'}), 401

    data = request.get_json()
    doc_id = data.get('doc_id')
    receiver_email = data.get('receiver_email')

    # Validate dữ liệu
    if not doc_id or not receiver_email:
        return jsonify({'error': 'Cần nhập Document ID và Email người nhận'}), 400

    if doc_id not in db['documents']:
        return jsonify({'error': 'Tài liệu không tồn tại'}), 404

    # Kiểm tra người nhận có tồn tại không
    receiver = None
    for u in db['users'].values():
        if u['email'] == receiver_email:
            receiver = u
            break

    if not receiver:
        return jsonify({'error': 'Không tìm thấy người dùng với email này'}), 404
    

    # --- GHI LOG LỊCH SỬ ---
    log_access(sender_id, doc_id, "SENT", partner_id=receiver['id'])
    log_access(receiver['id'], doc_id, "RECEIVED", partner_id=sender_id)

    
    return jsonify({
        'message': f'Đã chia sẻ thành công cho {receiver["name"]}'
    }), 200

