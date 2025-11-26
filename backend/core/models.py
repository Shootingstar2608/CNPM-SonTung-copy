# backend/core/models.py
from dataclasses import dataclass, asdict, field
from typing import Optional, List, Set
from enum import Enum
from datetime import datetime

# SyncService

class SyncStatusEnum(Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"

class SyncTypeEnum(Enum):
    PERSONAL = "PERSONAL"
    ROLE = "ROLE"

@dataclass
class Permission:
    code: str
    description: str

    def __hash__(self):
        return hash(self.code)

@dataclass
class UserProfile:
    id: str
    name: str
    email: str
    avatar_url: str = ""

@dataclass
class SyncReport:
    timestamp: datetime
    status: SyncStatusEnum
    message: str
    records_processed: int = 0
    errors: List[str] = field(default_factory=list)

@dataclass
class AuthResult:
    success: bool
    token: Optional[str] = None
    user_id: Optional[str] = None
    error_message: Optional[str] = None

@dataclass
class SsoLogoutUrl:
    url: str

@dataclass
class SyncStatus:
    last_run: datetime
    status: SyncStatusEnum
    details: str

# Core entitys

@dataclass
class Role:
    id: str   # Ví dụ: "R_ADMIN"
    name: str # Ví dụ: "ADMIN"
    # Lưu tập hợp các quyền (Permission objects)
    _permissions: Set[Permission] = field(default_factory=set)

    def get_permissions(self) -> Set[Permission]:
        return self._permissions
    
    def add_permission(self, perm: Permission):
        self._permissions.add(perm)

    def to_dict(self) -> dict:
        return {
            "id": self.id, 
            "name": self.name,
            "permissions": [p.code for p in self._permissions]
        }

@dataclass
class User:
    id: str
    name: str
    email: str
    password: str
    role: any 
    
    booked_appointments: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        data = asdict(self)
        if hasattr(self.role, 'name'):
            data['role'] = self.role.name
        elif hasattr(self.role, 'get'): # Nếu là dict
             data['role'] = self.role.get('name', 'UNKNOWN')
        return data

    def get_profile(self) -> UserProfile:
        return UserProfile(id=self.id, name=self.name, email=self.email)

    def get_role(self) -> Role:
        return self.role

# LibraryService

@dataclass
class Appointment:
    id: str
    tutor_id: str
    name: str = "Buổi học"
    start_time: str = ""
    end_time: str = ""
    place: str = "Online"
    max_slot: int = 1
    status: str = "OPEN"
    current_slots: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)

@dataclass
class Document:
    id: str
    title: str
    description: str
    uploader_id: str
    link: str
    course_code: str
    created_at: str

    def to_dict(self) -> dict:
        return asdict(self)

@dataclass
class DocumentAccess:
    id: str
    user_id: str    
    doc_id: str
    action: str     # 'VIEW', 'SEND', 'RECEIVE', 'UPLOAD'
    timestamp: str
    partner_id: str      
    
    def to_dict(self) -> dict:
        return asdict(self)