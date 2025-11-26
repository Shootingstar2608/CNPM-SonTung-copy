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

# Mock clients
class MockDataCoreClient:
    def fetch_user_profiles(self, user_ids: List[str]):
        print(f"[MockDataCore] Đang lấy thông tin profile cho: {user_ids}")
        results = []
        for uid in user_ids:
            results.append({
                "id": uid, 
                "name": f"User {uid} (Đã Sync)", 
                "email": f"{uid}@hcmut.edu.vn"
            })
        return results

    def fetch_all_roles(self):
        print(f"[MockDataCore] Đang lấy danh sách Roles & Permissions")
        return [
            {"id": "R_ADMIN", "name": "ADMIN", "perms": ["MANAGE_USER", "VIEW_LOGS", "SYNC_DATA"]},
            {"id": "R_TUTOR", "name": "TUTOR", "perms": ["CREATE_SCHEDULE", "UPLOAD_DOC"]},
            {"id": "R_STUDENT", "name": "STUDENT", "perms": ["BOOK_APT", "VIEW_DOC"]}
        ]

class HttpSSOClient:
    SSO_URL = "http://localhost:5001"

    def exchange_code_for_token(self, code: str):
        try:
            print(f"[SSO Client] 🔄 Đang đổi code lấy token: {code}")
            
            response = requests.post(
                f"{self.SSO_URL}/token", 
                json={"code": code},
                timeout=10
            )
            
            print(f"[SSO Client] Trạng thái trả về: {response.status_code}")
            
            if response.status_code == 200:
                user_info = response.json()
                print(f"[SSO Client] Thành công! User: {user_info.get('name')}")
                return user_info
            
            error_text = response.text
            print(f"[SSO Client] Lỗi từ server: {error_text}")
            raise Exception(f"Lỗi SSO: {error_text}")
            
        except requests.exceptions.ConnectionError:
            raise Exception("Không kết nối được với SSO Server")
        except requests.exceptions.Timeout:
            raise Exception("SSO Server không phản hồi (Timeout)")
        except Exception as e:
            raise

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
            current_user = db['users'][uid]
            
            db['users'][uid]['name'] = user_data['name']
            db['users'][uid]['email'] = user_data['email']
            print(f"[UserRepo] Đã cập nhật thông tin user: {uid}")
            new_role = user_data.get('role')
            if new_role and new_role != current_user['role']:
                print(f"[UserRepo] Phát hiện thay đổi Role của {uid}: {current_user['role']} -> {new_role}")
                current_user['role'] = new_role
        else:
            from core.database import create_user
            try:
                create_user(
                    name=user_data['name'],
                    email=user_data['email'],
                    password="default_password",
                    role="PENDING"
                )
                print(f"[UserRepo] Đã tạo người dùng mới: {uid}")
            except ValueError as e:
                print(f"[UserRepo] Người dùng đã tồn tại: {uid}")
                pass
            
    def get_user_by_id(self, user_id: str) -> Optional[dict]:
        return db['users'].get(user_id)

class RoleRepository:
    def update_or_create(self, role_data: dict):
        rid = role_data['id']
        db['roles'][rid] = role_data
        print(f"[RoleRepo] Đã đồng bộ Role: {role_data['name']}")
# Services
class DataSyncService:
    def __init__(self):
        self.datacore_client = MockDataCoreClient()
        self.userRepo = UserRepository()
        self.roleRepo = RoleRepository()
        self._sync_history = {} 

    def run_scheduled_personal_data_sync(self) -> SyncReport:
        report = SyncReport(
            timestamp=datetime.now(),
            status=SyncStatusEnum.SUCCESS,
            message="Đồng bộ lịch trình (Scheduled) bắt đầu"
        )
        try:
            users = self.userRepo.get_all_users()
            user_ids = [u.get('id') for u in users]
            self._core_pull_and_process_user_data(user_ids)
            report.message = "Đồng bộ hoàn tất"
            report.records_processed = len(user_ids)
            self._update_sync_status(SyncTypeEnum.PERSONAL, report)
        except Exception as e:
            report.status = SyncStatusEnum.FAILED
            report.message = f"Lỗi hệ thống: {str(e)}"
            report.errors.append(str(e))
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

    def get_sso_login_redirect_url(self) -> str:
        """Tạo URL để redirect đến SSO"""
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
            secret_key = "dev-secret"
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
            secret_key = "dev-secret"
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
        from app import scheduler
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
        current['schedule_type'] = new_config.get('schedule_type', current['schedule_type'])
        current['interval_minutes'] = new_config.get('interval_minutes', current['interval_minutes'])
        current['run_time'] = new_config.get('run_time', current['run_time'])
        current['day_value'] = new_config.get('day_value', current['day_value'])
        
        if current['is_active']:
            self.start_scheduler()

    def start_scheduler(self):
        from app import scheduler
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
            print(f"[Scheduler] Đã BẬT: Chạy mỗi {minutes} phút.")

        elif sch_type == 'DAILY':
            # Chạy hàng ngày vào giờ cụ thể
            time_str = cfg.get('run_time', "00:00")
            hour, minute = time_str.split(':')
            scheduler.add_job(
                id=self.JOB_ID,
                func='modules.integration.services:run_auto_sync_job',
                trigger='cron',
                hour=hour,
                minute=minute
            )
            print(f"[Scheduler] Đã BẬT: Chạy hàng ngày lúc {time_str}.")

        elif sch_type == 'WEEKLY':
            # Chạy hàng tuần vào thứ mấy
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
            print(f"[Scheduler] Đã BẬT: Chạy hàng tuần ({day_val}) lúc {time_str}.")
            
        elif sch_type == 'MONTHLY':
            # Chạy hàng tháng vào ngày mấy
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
            print(f"[Scheduler] Đã BẬT: Chạy ngày {day_val} hàng tháng lúc {time_str}.")

        cfg['is_active'] = True

    def stop_scheduler(self):
        from app import scheduler
        if scheduler.get_job(self.JOB_ID):
            scheduler.remove_job(self.JOB_ID)
        db['scheduler_config']['main']['is_active'] = False
        print("[Scheduler] Đã TẮT đồng bộ tự động.")
        
        