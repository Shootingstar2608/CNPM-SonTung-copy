# Bảng Endpoint API — backend bktutor

Bảng này liệt kê tất cả endpoint công khai của backend, yêu cầu xác thực, tham số và ví dụ phản hồi để đội frontend tham khảo.

Ghi chú:
- Các endpoint cần xác thực yêu cầu header: `Authorization: Bearer <JWT>`.
- Định dạng thời gian hiện dùng: chuỗi `YYYY-MM-DD HH:MM:SS`.

| Phương thức | Đường dẫn | Xác thực | Mô tả | Yêu cầu (params / body) | Phản hồi thành công (ví dụ) | Mã trạng thái |
|---|---:|---|---|---|---|---|
| GET | `/auth/sso/login-url` | không | Lấy URL chuyển hướng SSO | không | `{ "redirect_url": "https://..." }` | 200 |
| GET/POST | `/auth/sso/callback` | không | Xử lý callback SSO (đổi code → token) | query/body: `{ "code": "..." }` | `{ "message": "SSO Login Success", "access_token": "<JWT>", "user_id": "u1" }` | 200 / 401 |
| POST | `/auth/logout` | không (token trong body) | Logout (SSO) — gửi token trong body | `{ "token": "<JWT>" }` | `{ "message": "Logged out", "sso_logout_url": "https://..." }` | 200 / 400 |
| POST | `/auth/verify` | không | Kiểm tra tính hợp lệ của token | `{ "token": "<JWT>" }` | `{ "valid": true }` | 200 |
| GET | `/auth/profile` | Bearer (bất kỳ) | Lấy profile của user hiện tại | header: `Authorization` | `{ "user": { id,name,email,role,... } }` | 200 / 401 |

## Các endpoint quản trị (role = ADMIN)

| Phương thức | Đường dẫn | Xác thực | Mô tả | Yêu cầu (body) | Phản hồi (ví dụ) | Mã |
|---|---:|---|---|---|---|---|
| GET | `/admin/users` | Bearer (ADMIN) | Liệt kê người dùng (không trả password) | không | `{ "count": N, "users": [ {id,name,email,role}, ... ] }` | 200 |
| POST | `/admin/grant-role` | Bearer (ADMIN) | Gán/đổi role cho user | `{ "user_id": "u2", "role": "TUTOR" }` | `{ "message": "Đã cập nhật quyền TUTOR thành công", "user": {...} }` | 200 / 400 / 404 |

## Thư viện / Tài liệu

| Phương thức | Đường dẫn | Xác thực | Mô tả | Yêu cầu (params / body) | Phản hồi (ví dụ) | Mã |
|---|---:|---|---|---|---|---|
| GET | `/library/` | không | Tìm kiếm / liệt kê tài liệu | query: `q` (tìm kiếm), `course` (mã môn) | `[{ id,title,course_code,uploader_name,created_at,... }, ...]` | 200 |
| GET | `/library/history` | Bearer | Lấy lịch sử truy cập của user hiện tại | không | `[{ id,user_id,doc_id,action,timestamp,doc_title,partner_name }, ...]` | 200 |
| GET | `/library/<doc_id>` | Bearer | Lấy chi tiết tài liệu và tự động ghi log VIEW | không | `{ "message": "Saving log access...", "document": { id,title,link,created_at,uploader_name } }` | 200 / 404 |
| POST | `/library/upload` | Bearer (TUTOR) | Tạo bản ghi tài liệu mới (không upload file) | `{ "title":"...","link":"...","course_code":"CO3001","description":"..." }` | `{ "message":"upload tài liệu thành công","document":{...} }` | 201 / 400 |
| POST | `/library/share` | Bearer | Chia sẻ tài liệu cho user khác (ghi log SENT/RECEIVED) | `{ "doc_id":"doc1","receiver_email":"x@y.com" }` | `{ "message": "Đã chia sẻ thành công cho <name>" }` | 200 / 400 / 404 |

## Đồng bộ / Scheduler (ADMIN)

| Phương thức | Đường dẫn | Xác thực | Mô tả | Yêu cầu | Phản hồi (ví dụ) | Mã |
|---|---:|---|---|---|---|---|
| POST | `/sync/personal/scheduled` | Bearer (ADMIN) | Chạy đồng bộ dữ liệu cá nhân theo lịch (mock) | không | `SyncReport` JSON (timestamp,status,message,records_processed,errors) | 200 / 500 |
| POST | `/sync/personal/manual` | Bearer (ADMIN) | Đồng bộ thủ công cho 1 user | `{ "user_id":"u1" }` | `SyncReport` | 200 / 400 / 500 |
| POST | `/sync/roles` | Bearer (ADMIN) | Đồng bộ Role (mock) | không | `SyncReport` | 200 / 500 |
| GET | `/sync/status?type=PERSONAL|ROLE` | Bearer (ADMIN) | Lấy trạng thái đồng bộ gần nhất | query: `type` | `{ last_run, status, details }` | 200 / 400 |
| POST | `/sync/scheduler/config` | Bearer (ADMIN) | Cập nhật cấu hình scheduler (INTERVAL/DAILY/WEEKLY/MONTHLY) | body ví dụ: `{ "schedule_type":"DAILY", "run_time":"23:30" }` | `{ "message":"Cập nhật cấu hình thành công","config":{...} }` | 200 / 400 |
| POST | `/sync/scheduler/start` | Bearer (ADMIN) | Bật scheduler | không | `{ "message": "Scheduler đã được BẬT" }` | 200 |
| POST | `/sync/scheduler/stop` | Bearer (ADMIN) | Tắt scheduler | không | `{ "message": "Scheduler đã được TẮT" }` | 200 |

## Lịch hẹn / Scheduling

| Phương thức | Đường dẫn | Xác thực | Mô tả | Yêu cầu | Phản hồi (ví dụ) | Mã |
|---|---:|---|---|---|---|---|
| POST | `/appointments/` | Bearer (TUTOR) | Tạo buổi (kiểm tra trùng giờ cho cùng tutor) | `{ "name","start_time":"YYYY-MM-DD HH:MM:SS","end_time":"...","place","max_slot" }` | `{ "message":"Tạo lịch thành công","data":{...}}` | 201 / 400 / 409 |
| DELETE | `/appointments/<apt_id>` | Bearer (TUTOR owner) | Hủy buổi (chuyển status -> CANCELLED) | không | `{ "message":"Đã hủy buổi hẹn" }` | 200 / 403 / 404 |
| POST | `/appointments/<apt_id>/book` | Bearer (STUDENT) | Đặt lịch (kiểm tra đầy/đặt trùng giờ) | không | `{ "message":"Đặt lịch thành công","appointment":{...} }` | 200 / 400 / 404 / 409 |
| GET | `/appointments/` | không | Liệt kê buổi; có thể lọc `tutor_id` | query: `tutor_id` | `[{...appointments...}]` | 200 |

## Ghi chú chung cho FE
- Xác thực: sau flow SSO server trả `access_token` (JWT). FE lưu token tạm thời (không khuyến nghị lưu lâu trên localStorage). Gửi header `Authorization: Bearer <token>` khi gọi endpoint cần xác thực.
- Với hành động yêu cầu role (upload, grant-role, scheduler, admin) — server trả 403 nếu token không đủ quyền.
- Không upload file: `/library/upload` nhận `link` (URL). FE nên upload file lên dịch vụ lưu trữ (Drive/Cloud) và gửi URL.
- Lỗi trả về dạng JSON với trường `error` và mã HTTP phù hợp.




