## Tài liệu tham khảo API & Ghi chú triển khai

Tệp này tóm tắt kiến trúc backend, các lưu ý triển khai quan trọng và bảng API ngắn gọn để frontend tích hợp.

**Kiến trúc:**
- Framework: Flask (sử dụng Blueprints theo module)
- Lưu trữ dev: in-memory trong `core/database.py` (dict `db`). Không bền — chỉ dùng cho phát triển.
- Models: dataclass trong `core/models.py` (User, Role, Appointment, Document, DocumentAccess,...).
- Xác thực: JWT. Khóa bí mật lấy từ `app.config['SECRET_KEY']`.

**Lưu ý triển khai (dành cho BE):**
- Mật khẩu được băm bằng `bcrypt` trước khi lưu vào `db`.
- `db` lưu các dict Python thuần (ví dụ `db['users'][user_id] = asdict(User(...))`). Nên lưu role nhất quán dưới dạng chuỗi (ví dụ `'ADMIN'`).
- Timestamps hiện lưu/ trả về là chuỗi định dạng `YYYY-MM-DD HH:MM:SS` (quyết định của team). Frontend xử lý theo múi giờ server nếu cần.
- Xử lý token: `core/security.require_role(role)` xử lý decode token và kiểm tra role. Một số module trước đây tự định nghĩa `require_login` có logic decode — đã hợp nhất vào `core/security.py` để tránh trùng lặp.
- Đồng thời: DB in-memory không an toàn cho ghi song song; nếu tiếp tục dùng nên bọc write bằng lock hoặc dùng snapshot file.

**Ghi chú bảo mật:**
- Đảm bảo đặt `SECRET_KEY` trên production và token có `exp`. Cân nhắc refresh token hoặc cơ chế thu hồi token khi logout.
- Dùng HTTPS khi triển khai. Không để `dev-secret` lộ ra production.

----

**Bảng API (FE sẽ gọi)**

Định dạng: PHƯƠNG THỨC ĐƯỜNG_DẪN — Xác thực — Mô tả — Tham số/Body — Phản hồi chính — Mã trạng thái

--- Auth / SSO / Profile
- GET `/auth/sso/login-url` — không cần auth — Lấy URL login SSO.
  - Tham số: không
  - Phản hồi: `{ "redirect_url": "https://..." }` (200)

- GET|POST `/auth/sso/callback` — không cần auth — Xử lý callback SSO (code)
  - Query/body: `{ "code": "..." }` hoặc `?code=...`
  - Phản hồi: `{ "message": "SSO Login Success", "access_token": "<JWT>", "user_id": "uX" }` (200) hoặc `{error}` (401)

- POST `/auth/logout` — không cần header auth; body chứa token — Logout/ trả URL logout SSO
  - Body: `{ "token": "<JWT>" }`
  - Phản hồi: `{ "message": "Logged out", "sso_logout_url": "https://..." }` (200)

- POST `/auth/verify` — không cần auth — Kiểm tra token
  - Body: `{ "token": "<JWT>" }`
  - Phản hồi: `{ "valid": true }` (200)

- GET `/auth/profile` — Header `Authorization: Bearer <JWT>` — Lấy profile hiện tại
  - Phản hồi: `{ "user": { id,name,email,role,... } }` (200)

--- Quản trị (role=ADMIN)
- GET `/admin/users` — ADMIN — Liệt kê user
  - Phản hồi: `{ "count": N, "users": [ ... ] }` (200)

- POST `/admin/grant-role` — ADMIN — Gán role
  - Body: `{ "user_id": "u2", "role": "TUTOR" }`
  - Phản hồi: `{ "message": "Đã cập nhật quyền ...", "user": {...} }` (200)

--- Thư viện tài liệu
- GET `/library/` — Public — Tìm/ lọc tài liệu (`q`, `course`)
- GET `/library/history` — Auth — Lịch sử truy cập của user
- GET `/library/<doc_id>` — Auth — Xem chi tiết tài liệu (ghi log VIEW)
- POST `/library/upload` — TUTOR — Tạo record tài liệu (FE gửi `link`)
- POST `/library/share` — Auth — Chia sẻ tài liệu cho user khác (bằng email)

--- Đồng bộ / Scheduler (ADMIN)
- Nhiều endpoint `sync/*` để trigger/dùng scheduler; đều yêu cầu ADMIN.

--- Lịch hẹn
- POST `/appointments/` — TUTOR — tạo buổi (kiểm tra chồng giờ)
- DELETE `/appointments/<apt_id>` — TUTOR owner — hủy buổi (status=CANCELLED)
- POST `/appointments/<apt_id>/book` — STUDENT — đặt lịch
- GET `/appointments/` — Public, có thể filter `tutor_id`

----

Ghi chú cho FE:
- Gửi header `Authorization: Bearer <JWT>` cho endpoint cần auth.
- Timestamps: `YYYY-MM-DD HH:MM:SS`.
- Với thao tác thay đổi trạng thái (upload, share, grant-role, book), FE nên dựa vào HTTP status và trường `message` trong response để hiển thị trạng thái.

----

Muốn mình xuất tài liệu này thành CSV/Google Sheets, Postman collection hoặc OpenAPI không? Mình làm tiếp nếu bạn muốn.

