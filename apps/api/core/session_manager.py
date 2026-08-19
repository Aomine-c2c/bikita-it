import threading
import uuid
from typing import Dict, Any, List, Optional
from django.utils import timezone

class UserSession:
    def __init__(self, session_id: str, user_id: int, username: str, ip_address: str, user_agent: str):
        self.session_id = session_id
        self.user_id = user_id
        self.username = username
        self.ip_address = ip_address or "127.0.0.1"
        self.user_agent = user_agent or "Unknown Client"
        self.device_info = self._parse_device(user_agent)
        self.created_at = timezone.now()
        self.last_active = timezone.now()
        self.is_revoked = False

    def _parse_device(self, ua: str) -> str:
        if not ua:
            return "Web Client"
        ua_lower = ua.lower()
        if "tauri" in ua_lower or "pulse-desktop" in ua_lower:
            return "Pulse Desktop (Tauri)"
        if "windows" in ua_lower:
            return "Windows Desktop"
        if "macintosh" in ua_lower or "mac os" in ua_lower:
            return "macOS Desktop"
        if "iphone" in ua_lower or "ipad" in ua_lower:
            return "iOS Device"
        if "android" in ua_lower:
            return "Android Mobile"
        if "linux" in ua_lower:
            return "Linux Workstation"
        return "Web Browser"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "username": self.username,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "device_info": self.device_info,
            "created_at": self.created_at.isoformat(),
            "last_active": self.last_active.isoformat(),
            "is_revoked": self.is_revoked,
        }

SESSIONS: Dict[str, UserSession] = {}
SESSION_LOCK = threading.Lock()

def record_session(user_id: int, username: str, ip_address: str = "127.0.0.1", user_agent: str = "") -> str:
    session_id = f"sess-{uuid.uuid4().hex[:12]}"
    sess = UserSession(session_id, user_id, username, ip_address, user_agent)
    with SESSION_LOCK:
        SESSIONS[session_id] = sess
    return session_id

def get_user_sessions(user_id: Optional[int] = None, include_all: bool = False) -> List[Dict[str, Any]]:
    with SESSION_LOCK:
        res = []
        for s in SESSIONS.values():
            if not s.is_revoked:
                if include_all or (user_id is not None and s.user_id == user_id):
                    res.append(s.to_dict())
        return sorted(res, key=lambda x: x["last_active"], reverse=True)

def revoke_session(session_id: str) -> bool:
    with SESSION_LOCK:
        sess = SESSIONS.get(session_id)
        if sess:
            sess.is_revoked = True
            return True
        return False

def revoke_all_other_sessions(user_id: int, current_session_id: Optional[str] = None) -> int:
    revoked_count = 0
    with SESSION_LOCK:
        for s in SESSIONS.values():
            if s.user_id == user_id and s.session_id != current_session_id and not s.is_revoked:
                s.is_revoked = True
                revoked_count += 1
    return revoked_count

def touch_session(session_id: str):
    with SESSION_LOCK:
        sess = SESSIONS.get(session_id)
        if sess and not sess.is_revoked:
            sess.last_active = timezone.now()

def is_session_valid(session_id: str) -> bool:
    with SESSION_LOCK:
        sess = SESSIONS.get(session_id)
        return sess is not None and not sess.is_revoked
