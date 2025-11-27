# backend/modules/integration/services.py
import time
import uuid
import jwt
import requests
from datetime import datetime, timedelta
from typing import List, Optional
from flask import current_app

from core.models import (
    User, Role, Permission, SyncReport, SyncStatusEnum, 
    SyncStatus, SyncTypeEnum, AuthResult, SsoLogoutUrl, UserProfile, SchedulerConfig
)
from core.database import db
from extensions import scheduler

# Mock clients
class MockDataCoreClient:
    DATACORE_DB = {
        "u1": {
            "name": "Đỗ Hồng Phúc", 
            "email": "tutor@hcmut.edu.vn", 
            "role": "TUTOR",
            "major": "Khoa học Máy tính",
            "faculty": "KH&KT Máy tính",
            "phone": "0909123456",
            "address": "Vũ Hán, Tàu Khựa"
        },
        "u2": {
            "name": "Bùi Trần Duy Khang", 
            "email": "student@hcmut.edu.vn", 
            "role": "STUDENT",
            "major": "Khoa học Máy tính",
            "faculty": "KH&KT Máy tính",
            "phone": "0123456789",
            "address": "Dĩ An, Bình Dương"
        },
        "u3": {
            "name": "Lê Trọng Tín", 
            "email": "admin@hcmut.edu.vn", 
            "role": "ADMIN",
            "major": "",
            "faculty": "Khoa KH&KT Máy tính",
            "phone": "3663366336",
            "address": "Đầu Ba Tổng Chín, Thanh Hóa"
        },
        "u4": {
            "name": "Mai Đức Trung", 
            "email": "mai.trung@hcmut.edu.vn", 
            "role": "OFFICER",
            "major": "",
            "faculty": "Phòng Đào tạo",
            "phone": "0900000000",
            "address": "Trường ĐH Bách Khoa"
        },
        "u5": {
            "name": "Quản Thành Thơ", 
            "email": "thothanhquan@hcmut.edu.vn", 
            "role": "DEPARTMENT",
            "major": "",
            "faculty": "Khoa KH&KT Máy tính",
            "phone": "0900000000",
            "address": "Trường ĐH Bách Khoa"
        }
    }

    def fetch_all_user_ids(self) -> List[str]:
        print("[MockDataCore] Đang quét User ID trong hệ thống trường...")
        return list(self.DATACORE_DB.keys())
    
    def fetch_user_profiles(self, user_ids: List[str]):
        print(f"[MockDataCore] Đang trích xuất hồ sơ chi tiết cho: {user_ids}")
        results = []
        for uid in user_ids:
            if uid in self.DATACORE_DB:
                results.append({ "id": uid, **self.DATACORE_DB[uid] })
            else:
                results.append({
                    "id": uid, "name": f"User {uid}", "email": f"{uid}@hcmut.edu.vn", "role": "PENDING"
                })
        return results

    def fetch_all_roles(self):
        print(f"[MockDataCore] 📥 Đang lấy định nghĩa 5 Roles & Permissions")
        return [
            # Role Quản trị hệ thống
            {"id": "R_ADMIN", "name": "ADMIN", "perms": ["MANAGE_USER", "SYNC_DATA", "VIEW_LOGS"]},
            
            # Role Giảng dạy/Học tập
            {"id": "R_TUTOR", "name": "TUTOR", "perms": ["CREATE_SCHEDULE", "UPLOAD_DOC", "VIEW_STUDENTS"]},
            {"id": "R_STUDENT", "name": "STUDENT", "perms": ["BOOK_APT", "VIEW_DOC", "RATE_TUTOR"]},
            
            # Role Quản lý/Nghiệp vụ
            {
                "id": "R_OFFICER", 
                "name": "OFFICER", 
                "perms": ["VIEW_ALL_TRANSCRIPTS", "EXPORT_REPORTS", "MANAGE_SCHOLARSHIP"] 
                # Ví dụ: Xem bảng điểm toàn trường, Xuất báo cáo, Xét học bổng
            },
            {
                "id": "R_DEPARTMENT", 
                "name": "DEPARTMENT", 
                "perms": ["VIEW_DEPT_STATS", "MANAGE_DISCIPLINE", "APPROVE_REQUESTS"] 
                # Ví dụ: Xem thống kê khoa, Xử lý kỷ luật/Đuổi học, Duyệt yêu cầu
            }
        ]

class HttpSSOClient:
    SSO_URL = "http://localhost:5001"
    def exchange_code_for_token(self, code: str):
        try:
            resp = requests.post(f"{self.SSO_URL}/token", json={"code": code}, timeout=10)
            if resp.status_code == 200: return resp.json()
            raise Exception(f"SSO Error: {resp.text}")
        except Exception as e: raise e

# Exceptions
class UserDataProcessingError(Exception): pass
class RoleProcessingError(Exception): pass

# Repositories
class UserRepository:
    def get_all_users(self) -> List[User]:
        return list(db['users'].values())

    def update_or_create(self, user_data: dict):
        uid = user_data['id']
        if uid in db['users']:
            current = db['users'][uid]
            for field in ['name', 'email', 'major', 'faculty', 'phone', 'address']:
                if user_data.get(field) and user_data.get(field) != current.get(field):
                    current[field] = user_data.get(field)
            print(f"[UserRepo] Đã cập nhật user {uid}")
        else:
            from core.database import create_user
            try:
                create_user(**user_data, password="default_password")
                print(f"[UserRepo] Đã tạo user mới {uid}")
            except ValueError: pass
            
    def get_user_by_id(self, user_id: str) -> Optional[dict]:
        return db['users'].get(user_id)

class RoleRepository:
    def update_or_create(self, role_data: dict):
        db['roles'][role_data['id']] = role_data
        
# Services
class DataSyncService:
    def __init__(self):
        self.datacore_client = MockDataCoreClient()
        self.userRepo = UserRepository()
        self.roleRepo = RoleRepository()
        self._sync_history = {} 

    def run_scheduled_personal_data_sync(self) -> SyncReport:
        report = SyncReport(datetime.now(), SyncStatusEnum.SUCCESS, "Auto Sync Started")
        try:
            # 1. Hỏi DataCore danh sách toàn bộ ID
            all_ids = self.datacore_client.fetch_all_user_ids()
            print(f"[Sync] Tìm thấy {len(all_ids)} user trên hệ thống trường.")
            
            # 2. Đồng bộ toàn bộ danh sách này (Tự tạo mới nếu chưa có)
            self._core_pull_and_process_user_data(all_ids)
            
            report.message = f"Đã đồng bộ toàn bộ {len(all_ids)} người dùng."
            report.records_processed = len(all_ids)
            self._update_sync_status(SyncTypeEnum.PERSONAL, report)
        except Exception as e:
            report.status = SyncStatusEnum.FAILED; report.message = str(e)
            self._update_sync_status(SyncTypeEnum.PERSONAL, report)
        return report

    def run_manual_personal_data_sync(self, user_id: str) -> SyncReport:
        report = SyncReport(
            timestamp=datetime.now(),
            status=SyncStatusEnum.SUCCESS,
            message=f"Đồng bộ thủ công cho user {user_id}"
        )
        try:
            self._core_pull_and_process_user_data([user_id])
            report.records_processed = 1
            report.message = "Đồng bộ thành công"
        except Exception as e:
            report.status = SyncStatusEnum.FAILED
            report.message = str(e)
            report.errors.append(str(e))
        
        return report

    def run_scheduled_role_sync(self) -> SyncReport:
        report = SyncReport(
            timestamp=datetime.now(),
            status=SyncStatusEnum.SUCCESS,
            message="Đồng bộ Role bắt đầu"
        )
        try:
            self._core_pull_and_process_all_roles()
            report.message = "Đồng bộ thành công"
            self._update_sync_status(SyncTypeEnum.ROLE, report)
        except Exception as e:
            report.status = SyncStatusEnum.FAILED
            report.message = str(e)
            self._update_sync_status(SyncTypeEnum.ROLE, report)
        
        return report

    def _core_pull_and_process_user_data(self, user_ids: list[str]) -> None:
        max_retries = 3
        for attempt in range(max_retries):
            try:
                data = self.datacore_client.fetch_user_profiles(user_ids)
                for user_data in data:
                    self.userRepo.update_or_create(user_data)
                return
            except Exception as e:
                print(f"[Sync] Lần thử {attempt+1} thất bại: {e}")
                if attempt == max_retries - 1:
                    raise UserDataProcessingError(f"Thất bại sau {max_retries} lần thử: {e}")
                time.sleep(1)

    def _core_pull_and_process_all_roles(self) -> None:
        max_retries = 3
        for attempt in range(max_retries):
            try:
                roles_data = self.datacore_client.fetch_all_roles()
                for r_data in roles_data:
                    self.roleRepo.update_or_create(r_data)
                return
            except Exception as e:
                if attempt == max_retries - 1:
                    raise RoleProcessingError(f"Không thể đồng bộ: {e}")
                time.sleep(1)

    def get_latest_sync_status(self, sync_type: SyncTypeEnum) -> SyncStatus:
        if sync_type in self._sync_history:
            report = self._sync_history[sync_type]
            return SyncStatus(
                last_run=report.timestamp,
                status=report.status,
                details=report.message
            )
        return SyncStatus(datetime.now(), SyncStatusEnum.FAILED, "Chưa có lịch sử đồng bộ")

    def _update_sync_status(self, type: SyncTypeEnum, report: SyncReport):
        self._sync_history[type] = report

class AuthService:
    def __init__(self):
        self.sso_config = {
            "sso_login_url": "http://localhost:5001/authorize",
            "client_id": "bktutor_app"
        }
        self.sso_client = HttpSSOClient()
        self.userRepo = UserRepository()
        
    def get_detail_profile(self, token: str) -> dict:
        try:
            secret_key = current_app.config.get('SECRET_KEY', 'dev-secret')
            payload = jwt.decode(token, secret_key, algorithms=['HS256'])
            user_id = payload.get('user_id')
            
            user = self.userRepo.get_user_by_id(user_id)
            if not user:
                return {"error": "User not found"}

            safe_user = user.copy()
            safe_user.pop('password', None)
            return safe_user
            
        except jwt.ExpiredSignatureError:
            return {"error": "Token expired"}
        except jwt.InvalidTokenError:
            return {"error": "Invalid token"}

    def get_sso_login_redirect_url(self) -> str:
        base = self.sso_config["sso_login_url"]
        redirect_uri = "http://localhost:5000/auth/sso/callback"
        return f"{base}?redirect_uri={redirect_uri}"

    def handle_sso_callback(self, authorization_code: str) -> AuthResult:
        try:
            print(f"[AuthService] Đang xử lý callback với code: {authorization_code}")
            
            sso_info = self.sso_client.exchange_code_for_token(authorization_code)
            
            user_data = {
                "id": sso_info['sso_id'],
                "name": sso_info['name'],
                "email": sso_info['email']
            }
            # Cập nhật thông tin user vào database
            self.userRepo.update_or_create(user_data)
            print(f"[AuthService] Đã đồng bộ user: {user_data['name']}")
            
            # Tạo token
            secret_key = current_app.config.get('SECRET_KEY', 'dev-secret')
            payload = {
                'user_id': sso_info['sso_id'],
                'role': sso_info.get('role', 'STUDENT'),
                'exp': datetime.utcnow() + timedelta(hours=2),
                'iat': datetime.utcnow()
            }
            token = jwt.encode(payload, secret_key, algorithm='HS256')
            
            print(f"[AuthService] Đã tạo Token cho User ID: {sso_info['sso_id']}")
            
            return AuthResult(
                success=True,
                token=token,
                user_id=sso_info['sso_id']
            )
            
        except Exception as e:
            print(f"[AuthService] Callback thất bại: {str(e)}")
            return AuthResult(success=False, error_message=str(e))

    def validate_local_token(self, token: str) -> bool:
        try:
            secret_key = current_app.config.get('SECRET_KEY', 'dev-secret')
            jwt.decode(token, secret_key, algorithms=['HS256'])
            return True
        except jwt.ExpiredSignatureError:
            print(f"[AuthService] Token đã hết hạn")
            return False
        except jwt.InvalidTokenError:
            print(f"[AuthService] Token không hợp lệ")
            return False
            
    def log_out(self, token: str):
        return SsoLogoutUrl("http://localhost:5001/logout")
    
    def get_sso_password_reset_url(self):
        return "http://localhost:5001/reset"
    
class SchedulerService:
    JOB_ID = 'auto_personal_sync'

    def get_config(self) -> SchedulerConfig:
        cfg = db['scheduler_config']['main']
        job = scheduler.get_job(self.JOB_ID)
        next_run = str(job.next_run_time) if job else "Chưa lên lịch"
        
        return SchedulerConfig(
            schedule_type=cfg.get('schedule_type', 'INTERVAL'),
            interval_minutes=cfg.get('interval_minutes', 60),
            run_time=cfg.get('run_time', "00:00"),
            day_value=cfg.get('day_value', "*"),
            is_active=cfg['is_active'],
            last_run=cfg.get('last_run'),
            next_run=next_run
        )

    def update_config(self, new_config: dict):
        current = db['scheduler_config']['main']
        for key in ['schedule_type', 'interval_minutes', 'run_time', 'day_value']:
            if key in new_config:
                current[key] = new_config[key]
        
        if current['is_active']:
            self.start_scheduler()

    def start_scheduler(self):
        cfg = db['scheduler_config']['main']
        if scheduler.get_job(self.JOB_ID):
            scheduler.remove_job(self.JOB_ID)
            
        sch_type = cfg.get('schedule_type', 'INTERVAL')
        
        if sch_type == 'INTERVAL':
            minutes = int(cfg.get('interval_minutes', 60))
            scheduler.add_job(
                id=self.JOB_ID,
                func='modules.integration.services:run_auto_sync_job',
                trigger='interval',
                minutes=minutes
            )
            print(f"[Scheduler] 🟢 Đã BẬT: Chạy mỗi {minutes} phút.")

        elif sch_type == 'DAILY':
            time_str = cfg.get('run_time', "00:00")
            hour, minute = time_str.split(':')
            scheduler.add_job(
                id=self.JOB_ID,
                func='modules.integration.services:run_auto_sync_job',
                trigger='cron',
                hour=hour,
                minute=minute
            )
            print(f"[Scheduler] 🟢 Đã BẬT: Chạy hàng ngày lúc {time_str}.")

        elif sch_type == 'WEEKLY':
            time_str = cfg.get('run_time', "00:00")
            day_val = cfg.get('day_value', 'mon')
            hour, minute = time_str.split(':')
            scheduler.add_job(
                id=self.JOB_ID,
                func='modules.integration.services:run_auto_sync_job',
                trigger='cron',
                day_of_week=day_val,
                hour=hour,
                minute=minute
            )
            print(f"[Scheduler] 🟢 Đã BẬT: Chạy hàng tuần ({day_val}) lúc {time_str}.")
            
        elif sch_type == 'MONTHLY':
            time_str = cfg.get('run_time', "00:00")
            day_val = cfg.get('day_value', '1') 
            hour, minute = time_str.split(':')
            scheduler.add_job(
                id=self.JOB_ID,
                func='modules.integration.services:run_auto_sync_job',
                trigger='cron',
                day=day_val,
                hour=hour,
                minute=minute
            )
            print(f"[Scheduler] 🟢 Đã BẬT: Chạy ngày {day_val} hàng tháng lúc {time_str}.")

        cfg['is_active'] = True

    def stop_scheduler(self):
        if scheduler.get_job(self.JOB_ID):
            scheduler.remove_job(self.JOB_ID)
        db['scheduler_config']['main']['is_active'] = False
        print("[Scheduler] 🔴 Đã TẮT đồng bộ tự động.")

def run_auto_sync_job():
    print("\n[Scheduler] ⏰ Bắt đầu chạy Job đồng bộ tự động...")
    from app import create_app
    app = create_app(init_scheduler=False)

    with app.app_context():
        service = DataSyncService()
        report = service.run_scheduled_personal_data_sync()
        if 'scheduler_config' in db and 'main' in db['scheduler_config']:
            db['scheduler_config']['main']['last_run'] = datetime.now().isoformat()
            
        print(f"[Scheduler] Kết quả: {report.status.value} - {report.message}\n")
        
        